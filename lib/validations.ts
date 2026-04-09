import { z } from "zod";

// --- Авторизация продавца ---
export const sellerLoginSchema = z.object({
  email: z.string().email("Введите корректный email"),
  password: z.string().min(6, "Минимум 6 символов"),
});

export const sellerRegisterSchema = z.object({
  email: z.string().email("Введите корректный email"),
  password: z.string().min(6, "Минимум 6 символов"),
  full_name: z.string().min(2, "Минимум 2 символа"),
});

// --- Авторизация покупателя ---
export const customerLoginSchema = z.object({
  email: z.string().email("Введите корректный email"),
  password: z.string().min(6, "Минимум 6 символов"),
});

export const customerRegisterSchema = z.object({
  email: z.string().email("Введите корректный email"),
  password: z.string().min(6, "Минимум 6 символов"),
  full_name: z.string().min(2, "Минимум 2 символа"),
});

// --- Магазин ---
export const storeSchema = z.object({
  name: z.string().min(2, "Минимум 2 символа").max(100),
  description: z.string().min(10, "Минимум 10 символов").max(1000),
  category: z.string().min(1, "Выберите категорию"),
  contact_email: z.string().email("Введите корректный email"),
});

// --- Настройки дизайна ---
export const storeSettingsSchema = z.object({
  primary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Некорректный цвет"),
  secondary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Некорректный цвет"),
  accent_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Некорректный цвет"),
  background_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Некорректный цвет"),
  text_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Некорректный цвет"),
  font: z.string().min(1),
  welcome_text: z.string().max(500).optional(),
});

// --- Варианты товара ---
export const variantOptionSchema = z.object({
  name: z.string().min(1, "Введите название варианта").max(50),
  values: z.array(z.string().min(1)).min(1, "Добавьте хотя бы одно значение"),
});

// --- Товары ---
export const productSchema = z.object({
  name: z.string().min(2, "Минимум 2 символа").max(200),
  description: z.string().min(10, "Минимум 10 символов").max(5000),
  price: z.coerce.number().min(0.01, "Цена должна быть больше 0"),
  stock: z.coerce.number().int().min(0, "Не может быть отрицательным"),
  category: z.string().min(1, "Выберите категорию"),
});

export type VariantOptionInput = z.infer<typeof variantOptionSchema>;

// --- Промокоды ---
export const promoCodeSchema = z.object({
  code: z.string().min(2, "Минимум 2 символа").max(30, "Максимум 30 символов"),
  discount_type: z.enum(["percent", "fixed"]),
  discount_value: z.coerce.number().min(0.01, "Значение должно быть больше 0"),
  min_order_amount: z.coerce.number().min(0).optional(),
  max_uses: z.coerce.number().int().min(0).optional(),
  expires_at: z.string().optional().refine(
    (val) => !val || new Date(val) > new Date(),
    "Дата должна быть в будущем"
  ),
});

// --- Оформление заказа ---
export const checkoutSchema = z.object({
  shipping_address: z.string().min(5, "Введите адрес доставки"),
  phone: z.string().min(7, "Введите номер телефона"),
  notes: z.string().max(500).optional(),
  promo_code: z.string().optional(),
});

// Типы
export type SellerLoginInput = z.infer<typeof sellerLoginSchema>;
export type SellerRegisterInput = z.infer<typeof sellerRegisterSchema>;
export type CustomerLoginInput = z.infer<typeof customerLoginSchema>;
export type CustomerRegisterInput = z.infer<typeof customerRegisterSchema>;
export type StoreInput = z.infer<typeof storeSchema>;
export type StoreSettingsInput = z.infer<typeof storeSettingsSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type PromoCodeInput = z.infer<typeof promoCodeSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;

// --- Отзывы ---
export const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1, "Минимум 1 звезда").max(5, "Максимум 5 звёзд"),
  comment: z.string().min(3, "Минимум 3 символа").max(1000, "Максимум 1000 символов"),
});

export type ReviewInput = z.infer<typeof reviewSchema>;
