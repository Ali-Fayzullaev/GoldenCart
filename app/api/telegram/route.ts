import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chat_id, store_name, order_id, total, items_count, address, phone } = body;

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json({ error: "Telegram бот не настроен" }, { status: 500 });
    }

    if (!chat_id) {
      return NextResponse.json({ error: "Chat ID не указан" }, { status: 400 });
    }

    const message = [
      `🛒 *Новый заказ!*`,
      ``,
      `🏪 Магазин: *${escapeMarkdown(store_name)}*`,
      `📦 Заказ: \`${order_id.slice(0, 8)}\``,
      `📝 Товаров: ${items_count}`,
      `💰 Сумма: *${total} ₽*`,
      ``,
      `📍 Адрес: ${escapeMarkdown(address)}`,
      `📞 Телефон: ${escapeMarkdown(phone)}`,
      ``,
      `➡️ Откройте панель управления для подробностей`,
    ].join("\n");

    const res = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id,
          text: message,
          parse_mode: "Markdown",
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
  return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, "\\$&");
}
