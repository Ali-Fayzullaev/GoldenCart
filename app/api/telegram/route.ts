import { NextRequest, NextResponse } from "next/server";

type TelegramPayload =
  | {
      type?: "new_order";
      chat_id: string;
      store_name: string;
      order_id: string;
      total: string;
      items_count: number;
      items?: { name: string; qty: number; price: string }[];
      address: string;
      phone: string;
      discount?: string;
      promo_code?: string;
      shipping?: string;
    }
  | {
      type: "status_change";
      chat_id: string;
      store_name: string;
      order_id: string;
      old_status: string;
      new_status: string;
      total: string;
    }
  | {
      type: "low_stock";
      chat_id: string;
      store_name: string;
      product_name: string;
      stock: number;
    };

const STATUS_EMOJI: Record<string, string> = {
  pending: "🕐",
  confirmed: "✅",
  shipped: "🚚",
  delivered: "📦",
  cancelled: "❌",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Ожидает",
  confirmed: "Подтверждён",
  shipped: "Отправлен",
  delivered: "Доставлен",
  cancelled: "Отменён",
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as TelegramPayload;

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json({ error: "Telegram бот не настроен" }, { status: 500 });
    }

    if (!body.chat_id) {
      return NextResponse.json({ error: "Chat ID не указан" }, { status: 400 });
    }

    const msgType = body.type || "new_order";
    let message: string;

    if (msgType === "status_change") {
      const b = body as Extract<TelegramPayload, { type: "status_change" }>;
      const newEmoji = STATUS_EMOJI[b.new_status] || "📋";
      message = [
        `${newEmoji} *Статус заказа обновлён*`,
        ``,
        `🏪 ${escapeMarkdown(b.store_name)}`,
        `📦 Заказ: \`${b.order_id.slice(0, 8)}\``,
        `💰 Сумма: *${escapeMarkdown(b.total)}*`,
        ``,
        `${STATUS_EMOJI[b.old_status] || "📋"} ${STATUS_LABELS[b.old_status] || b.old_status} → ${newEmoji} *${STATUS_LABELS[b.new_status] || b.new_status}*`,
      ].join("\n");
    } else if (msgType === "low_stock") {
      const b = body as Extract<TelegramPayload, { type: "low_stock" }>;
      message = [
        `⚠️ *Низкий остаток товара!*`,
        ``,
        `🏪 ${escapeMarkdown(b.store_name)}`,
        `📦 ${escapeMarkdown(b.product_name)}`,
        `📊 Осталось: *${b.stock} шт\\.*`,
        ``,
        `➡️ Пополните запас в панели управления`,
      ].join("\n");
    } else {
      // new_order — rich format with product list
      const b = body as Extract<TelegramPayload, { type?: "new_order" }>;
      const lines = [
        `🛒 *Новый заказ\\!*`,
        ``,
        `🏪 Магазин: *${escapeMarkdown(b.store_name)}*`,
        `📦 Заказ: \`${b.order_id.slice(0, 8)}\``,
      ];

      // Product list
      if (b.items && b.items.length > 0) {
        lines.push(``, `📝 *Товары:*`);
        b.items.forEach((item, i) => {
          lines.push(`  ${i + 1}\\. ${escapeMarkdown(item.name)} × ${item.qty} — ${escapeMarkdown(item.price)}`);
        });
      } else {
        lines.push(`📝 Товаров: ${b.items_count}`);
      }

      // Discount info
      if (b.discount && b.promo_code) {
        lines.push(``, `🏷 Промокод: \`${escapeMarkdown(b.promo_code)}\` \\(−${escapeMarkdown(b.discount)}\\)`);
      } else if (b.discount) {
        lines.push(``, `🎁 Скидка: −${escapeMarkdown(b.discount)}`);
      }

      // Shipping
      if (b.shipping) {
        lines.push(`🚚 Доставка: ${escapeMarkdown(b.shipping)}`);
      }

      lines.push(
        ``,
        `💰 *Итого: ${escapeMarkdown(b.total)}*`,
        ``,
        `📍 Адрес: ${escapeMarkdown(b.address)}`,
        `📞 Телефон: ${escapeMarkdown(b.phone)}`,
        ``,
        `➡️ Откройте панель управления для подробностей`
      );
      message = lines.join("\n");
    }

    const res = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: body.chat_id,
          text: message,
          parse_mode: "MarkdownV2",
        }),
      }
    );

    const data = await res.json();

    if (!data.ok) {
      console.error("Telegram API error:", data);
      return NextResponse.json({ error: "Ошибка отправки" }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Telegram notification error:", error);
    return NextResponse.json({ error: "Внутренняя ошибка" }, { status: 500 });
  }
}

function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+=|{}.!\\-]/g, "\\$&");
}
