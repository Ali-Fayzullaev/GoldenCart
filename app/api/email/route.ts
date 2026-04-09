import { NextRequest, NextResponse } from "next/server";

type EmailPayload = {
  to: string;
  store_name: string;
  subject: string;
  type: "new_order" | "status_change";
  order_id: string;
  total: string;
  items?: { name: string; qty: number; price: string }[];
  address?: string;
  phone?: string;
  old_status?: string;
  new_status?: string;
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Ожидает",
  confirmed: "Подтверждён",
  shipped: "Отправлен",
  delivered: "Доставлен",
  cancelled: "Отменён",
};

function buildNewOrderHtml(p: EmailPayload): string {
  const itemsHtml = p.items
    ?.map(
      (item) =>
        `<tr><td style="padding:8px 12px;border-bottom:1px solid #eee">${item.name}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center">×${item.qty}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right">${item.price}</td></tr>`
    )
    .join("") || "";

  return `
<!DOCTYPE html>
<html lang="ru">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f4f4f5">
  <div style="max-width:560px;margin:24px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08)">
    <div style="background:#f59e0b;padding:24px 28px">
      <h1 style="margin:0;color:#fff;font-size:20px">🛒 Новый заказ</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,.85);font-size:14px">${p.store_name}</p>
    </div>
    <div style="padding:24px 28px">
      <p style="margin:0 0 6px;color:#6b7280;font-size:13px">Номер заказа</p>
      <p style="margin:0 0 20px;font-family:monospace;font-size:15px;color:#111">${p.order_id.slice(0, 8)}</p>

      <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
        <thead><tr style="background:#f9fafb">
          <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6b7280">Товар</th>
          <th style="padding:8px 12px;text-align:center;font-size:12px;color:#6b7280">Кол-во</th>
          <th style="padding:8px 12px;text-align:right;font-size:12px;color:#6b7280">Сумма</th>
        </tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>

      <div style="text-align:right;padding:12px 0;border-top:2px solid #f59e0b">
        <span style="font-size:13px;color:#6b7280">Итого: </span>
        <span style="font-size:18px;font-weight:700;color:#111">${p.total}</span>
      </div>

      ${p.address ? `<p style="margin:16px 0 4px;font-size:12px;color:#6b7280">📍 Адрес доставки</p><p style="margin:0;font-size:14px;color:#111">${p.address}</p>` : ""}
      ${p.phone ? `<p style="margin:12px 0 4px;font-size:12px;color:#6b7280">📞 Телефон</p><p style="margin:0;font-size:14px;color:#111">${p.phone}</p>` : ""}
    </div>
    <div style="padding:16px 28px;background:#f9fafb;text-align:center">
      <p style="margin:0;color:#9ca3af;font-size:12px">Откройте панель управления для подробностей</p>
    </div>
  </div>
</body></html>`;
}

function buildStatusChangeHtml(p: EmailPayload): string {
  const newLabel = STATUS_LABELS[p.new_status || ""] || p.new_status || "";
  const oldLabel = STATUS_LABELS[p.old_status || ""] || p.old_status || "";

  return `
<!DOCTYPE html>
<html lang="ru">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f4f4f5">
  <div style="max-width:560px;margin:24px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08)">
    <div style="background:#3b82f6;padding:24px 28px">
      <h1 style="margin:0;color:#fff;font-size:20px">📦 Статус заказа обновлён</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,.85);font-size:14px">${p.store_name}</p>
    </div>
    <div style="padding:24px 28px;text-align:center">
      <p style="margin:0 0 6px;color:#6b7280;font-size:13px">Заказ <span style="font-family:monospace">${p.order_id.slice(0, 8)}</span></p>
      <div style="display:inline-flex;align-items:center;gap:12px;margin:20px 0">
        <span style="padding:6px 14px;border-radius:8px;background:#f3f4f6;font-size:14px;color:#6b7280">${oldLabel}</span>
        <span style="font-size:18px;color:#9ca3af">→</span>
        <span style="padding:6px 14px;border-radius:8px;background:#dbeafe;font-size:14px;font-weight:600;color:#2563eb">${newLabel}</span>
      </div>
      <p style="margin:16px 0 0;font-size:13px;color:#6b7280">Сумма заказа: <strong>${p.total}</strong></p>
    </div>
    <div style="padding:16px 28px;background:#f9fafb;text-align:center">
      <p style="margin:0;color:#9ca3af;font-size:12px">${p.store_name} • GoldenCart</p>
    </div>
  </div>
</body></html>`;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as EmailPayload;

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      return NextResponse.json(
        { error: "Email сервис не настроен. Добавьте RESEND_API_KEY в .env" },
        { status: 500 }
      );
    }

    if (!body.to) {
      return NextResponse.json({ error: "Email не указан" }, { status: 400 });
    }

    const html =
      body.type === "status_change"
        ? buildStatusChangeHtml(body)
        : buildNewOrderHtml(body);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: `${body.store_name} <noreply@goldencart.app>`,
        to: body.to,
        subject: body.subject,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("Resend API error:", err);
      return NextResponse.json({ error: "Ошибка отправки email" }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Email notification error:", error);
    return NextResponse.json({ error: "Внутренняя ошибка" }, { status: 500 });
  }
}
