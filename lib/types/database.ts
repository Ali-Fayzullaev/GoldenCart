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
  updated_at: string;
};

export type StoreCustomer = {
  id: string;
  store_id: string;
  customer_id: string;
  created_at: string;
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
    };
  };
};
