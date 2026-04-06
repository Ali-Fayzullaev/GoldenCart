export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: "Ожидает",
    confirmed: "Подтверждён",
    shipped: "Отправлен",
    delivered: "Доставлен",
    cancelled: "Отменён",
  };
  return map[status] || status;
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    shipped: "bg-purple-100 text-purple-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };
  return map[status] || "bg-gray-100 text-gray-800";
}

export const PRODUCT_CATEGORIES = [
  "Одежда",
  "Электроника",
  "Дом и сад",
  "Красота",
  "Спорт",
  "Еда",
  "Книги",
  "Игрушки",
  "Другое",
] as const;

export const STORE_CATEGORIES = [
  "Одежда",
  "Электроника",
  "Дом",
  "Красота",
  "Спорт",
  "Еда",
  "Универсальный",
  "Другое",
] as const;

export const FONTS = [
  { label: "Inter", value: "Inter" },
  { label: "Roboto", value: "Roboto" },
  { label: "Open Sans", value: "Open Sans" },
  { label: "Montserrat", value: "Montserrat" },
  { label: "Nunito", value: "Nunito" },
] as const;
