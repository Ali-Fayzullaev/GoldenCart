// ============================================
// GoldenCart SaaS — Типы базы данных
// ============================================

export type Profile = {
  id: string;
  role: "seller" | "customer";
  full_name: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
};

export type Store = {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  contact_email: string;
  telegram_chat_id: string | null;
  first_order_discount_type: "percent" | "fixed" | null;
  first_order_discount_value: number;
  reviews_enabled: boolean;
  reviews_moderation: boolean;
  is_active: boolean;
  created_at: string;
};

export type StoreSettings = {
  id: string;
  store_id: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  font: string;
  logo_url: string | null;
  banner_url: string | null;
  welcome_text: string;
  instagram_url: string;
  telegram_url: string;
  vk_url: string;
  whatsapp_url: string;
  updated_at: string;
};

export type StoreCustomer = {
  id: string;
  store_id: string;
  customer_id: string;
  created_at: string;
};

export type ProductVariantOption = {
  name: string;
  values: string[];
};

export type Product = {
  id: string;
  store_id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
  category: string;
  variants: ProductVariantOption[];
  is_active: boolean;
  created_at: string;
};

export type Order = {
  id: string;
  store_id: string;
  customer_id: string;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  total_amount: number;
  shipping_address: string;
  phone: string;
  notes: string;
  created_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price_at_time: number;
  created_at: string;
};

export type PromoCode = {
  id: string;
  store_id: string;
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  min_order_amount: number;
  max_uses: number;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
};

export type Review = {
  id: string;
  product_id: string;
  customer_id: string;
  store_id: string;
  rating: number;
  comment: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

export type Wishlist = {
  id: string;
  customer_id: string;
  product_id: string;
  store_id: string;
  created_at: string;
};

export type StorePage = {
  id: string;
  store_id: string;
  title: string;
  slug: string;
  blocks: PageBlock[];
  is_published: boolean;
  sort_order: number;
  created_at: string;
};

export type PageBlock = {
  type: "heading" | "text" | "image" | "divider";
  content: string;
};

export type StoreBanner = {
  id: string;
  store_id: string;
  image_url: string;
  link: string;
  title: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

export type StoreCategory = {
  id: string;
  store_id: string;
  name: string;
  parent_id: string | null;
  sort_order: number;
  created_at: string;
};

export type ShippingMethod = {
  id: string;
  store_id: string;
  name: string;
  price: number;
  min_order_free: number | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
};

export type BlogPost = {
  id: string;
  store_id: string;
  title: string;
  slug: string;
  content: PageBlock[];
  cover_image: string | null;
  is_published: boolean;
  created_at: string;
};

export type StoreFaq = {
  id: string;
  store_id: string;
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

export type WishlistWithProduct = Wishlist & {
  products: Pick<Product, "id" | "name" | "price" | "images" | "stock">;
};

// Составные типы
export type StoreWithSettings = Store & {
  store_settings: StoreSettings | null;
};

export type OrderWithItems = Order & {
  order_items: (OrderItem & { products: Pick<Product, "name" | "images"> })[];
};

export type StoreCustomerWithProfile = StoreCustomer & {
  profiles: Pick<Profile, "full_name" | "email" | "avatar_url">;
};

export type ReviewWithProfile = Review & {
  profiles: Pick<Profile, "full_name" | "avatar_url">;
};

// Supabase Database type (для generic клиента)
export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile> & { id: string }; Update: Partial<Profile> };
      stores: { Row: Store; Insert: Omit<Store, "id" | "created_at">; Update: Partial<Store> };
      store_settings: { Row: StoreSettings; Insert: { store_id: string } & Partial<StoreSettings>; Update: Partial<StoreSettings> };
      store_customers: { Row: StoreCustomer; Insert: Omit<StoreCustomer, "id" | "created_at">; Update: Partial<StoreCustomer> };
      products: { Row: Product; Insert: Omit<Product, "id" | "created_at" | "is_active">; Update: Partial<Product> };
      orders: { Row: Order; Insert: Omit<Order, "id" | "created_at">; Update: Partial<Order> };
      order_items: { Row: OrderItem; Insert: Omit<OrderItem, "id" | "created_at">; Update: Partial<OrderItem> };
      promo_codes: { Row: PromoCode; Insert: Omit<PromoCode, "id" | "created_at" | "used_count">; Update: Partial<PromoCode> };
      reviews: { Row: Review; Insert: Omit<Review, "id" | "created_at">; Update: Partial<Review> };
      wishlists: { Row: Wishlist; Insert: Omit<Wishlist, "id" | "created_at">; Update: Partial<Wishlist> };
      store_pages: { Row: StorePage; Insert: Omit<StorePage, "id" | "created_at">; Update: Partial<StorePage> };
      store_banners: { Row: StoreBanner; Insert: Omit<StoreBanner, "id" | "created_at">; Update: Partial<StoreBanner> };
      store_categories: { Row: StoreCategory; Insert: Omit<StoreCategory, "id" | "created_at">; Update: Partial<StoreCategory> };
      shipping_methods: { Row: ShippingMethod; Insert: Omit<ShippingMethod, "id" | "created_at">; Update: Partial<ShippingMethod> };
      blog_posts: { Row: BlogPost; Insert: Omit<BlogPost, "id" | "created_at">; Update: Partial<BlogPost> };
      store_faqs: { Row: StoreFaq; Insert: Omit<StoreFaq, "id" | "created_at">; Update: Partial<StoreFaq> };
    };
  };
};
