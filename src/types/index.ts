export type Gender = 'Men' | 'Women' | 'Kids' | 'Unisex';

export type ProductStatus = 'Draft' | 'Published' | 'Unpublished' | 'Out of Stock';

export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Processing'
  | 'Packed'
  | 'Shipped'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled'
  | 'Returned'
  | 'Refunded';

export type PaymentMethod = 'COD' | 'ONLINE_RAZORPAY';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export type AddressType = 'HOME' | 'WORK' | 'OTHER';

export interface CustomerAddress {
  id: string;
  customer_id: string;
  name: string;
  mobile: string;
  pincode: string;
  address: string;
  locality?: string;
  city: string;
  state: string;
  landmark?: string;
  address_type: AddressType;
  is_default: boolean;
}

export interface Customer {
  id: string;
  customer_id: string; // e.g. STYLE1-CUST-000001
  name: string;
  mobile: string;
  email?: string;
  created_at: string;
  status: 'ACTIVE' | 'BLOCKED';
  total_orders: number;
  total_spent: number;
  last_order_at?: string;
  addresses: CustomerAddress[];
  is_vip?: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  image_url?: string;
  parent_id?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  sort_order: number;
  display_order?: number;
  item_count?: number;
  description?: string;
}

export interface ProductImage {
  id: string;
  product_id?: string;
  image_url: string;
  sort_order: number;
  is_primary: boolean;
  caption?: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  size: string;
  color: string;
  sku: string;
  stock: number;
  price: number;
  mrp: number;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  category_id: string;
  category_name: string;
  category_slug?: string;
  subcategory_id?: string;
  subcategory_name?: string;
  gender: Gender;
  description: string;
  brand: string;
  mrp: number;
  selling_price: number; // Customer Final Selling Price (Admin Selling Price)
  admin_selling_price?: number; // Explicit Admin Selling Price field
  shopkeeper_price?: number; // Shopkeeper internal/private base price (Admin & Shopkeeper only)
  discount_percentage: number;
  stock: number;
  status: ProductStatus;
  rating: number;
  rating_count: number;
  sizes: string[];
  colors: string[];
  available_sizes?: string[];
  available_colors?: string[];
  tags: string[];
  specifications: Record<string, string>;
  images: ProductImage[];
  variants?: ProductVariant[];
  created_at: string;
  updated_at: string;
  is_demo?: boolean;
  shopkeeper_id?: string;
  shopkeeper_name?: string;
  approval_status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  is_live?: boolean;
  rejection_reason?: string;
  reviewed_by?: string;
  reviewed_at?: string;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  product: Product;
  size: string;
  color: string;
  quantity: number;
  price: number;
  mrp: number;
}

export interface Cart {
  id: string;
  customer_id: string;
  items: CartItem[];
  subtotal: number;
  total_discount: number;
  delivery_charge: number;
  total: number;
}

export interface WishlistItem {
  id: string;
  customer_id: string;
  product_id: string;
  product: Product;
  added_at: string;
}

export type OrderType = 'standard' | 'try_at_home';

export type ItemReturnStatus =
  | 'Return Requested'
  | 'Return Accepted'
  | 'Return Completed'
  | 'Replace Item'
  | 'Replace Requested'
  | 'Replace Accepted'
  | 'Replace Completed'
  | 'Cancelled';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  brand: string;
  sku: string;
  quantity: number;
  price: number;
  mrp: number;
  size: string;
  color: string;
  image_url: string;
  item_status?: OrderStatus | ItemReturnStatus;
  cancelled_at?: string;
  cancellation_reason?: string;
  return_status?: ItemReturnStatus;
  returned_quantity?: number;
  final_quantity?: number;
  return_amount?: number;
  final_amount?: number;
  return_id?: string;
  return_reason?: string;
  return_remark?: string;
  return_requested_at?: string;
  return_accepted_at?: string;
  return_completed_at?: string;
  stock_restored?: boolean;
  request_type?: 'return' | 'replace';
  is_replaced?: boolean;
  replacement_size?: string;
  replacement_color?: string;
  replacement_reason?: string;
  replacement_amount?: number;
  shopkeeper_id?: string;
  shopkeeper_name?: string;
}

export interface OrderItemCalculation {
  item_id: string;
  product_id: string;
  product_name: string;
  sku: string;
  size: string;
  color: string;
  image_url: string;
  delivered_quantity: number;
  returned_quantity: number;
  final_quantity: number;
  rate: number;
  original_amount: number;
  return_amount: number;
  final_amount: number;
  item_status?: string;
  return_status?: string;
  is_replace?: boolean;
  request_type?: 'return' | 'replace';
  replacement_size?: string;
  replacement_color?: string;
  replaced_quantity?: number;
}

export interface OrderBillCalculation {
  order_id: string;
  invoice_number: string;
  customer_name: string;
  customer_mobile: string;
  customer_address: string;
  order_date: string;
  delivery_date?: string;
  items: OrderItemCalculation[];
  total_delivered_quantity: number;
  total_returned_quantity: number;
  total_replaced_quantity: number;
  total_final_quantity: number;
  original_subtotal: number;
  total_return_amount: number;
  final_subtotal: number;
  delivery_charge: number;
  original_tax: number;
  adjusted_tax: number;
  tax_reversed: number;
  original_total: number;
  final_payable: number;
  payment_method: string;
  payment_status: string;
  amount_collected: number;
  balance_due: number;
  has_returns: boolean;
  has_replacements: boolean;
  final_bill_generated: boolean;
  final_bill_locked?: boolean;
  final_bill_generated_at?: string;
  try_at_home_fee?: number;
  replacement_credit_applied?: number;
  replacement_credit_source_order_id?: string;
}

export interface ProductReturn {
  return_id: string; // e.g. RET-STYLE1-000001
  id?: string; // alias for return_id
  order_id: string;
  order_item_id: string;
  invoice_number?: string;
  product_id: string;
  product_name: string;
  item_name?: string; // alias for product_name
  product_image?: string;
  item_image?: string; // alias for product_image
  size: string;
  item_size?: string; // alias for size
  color: string;
  item_color?: string; // alias for color
  customer_id: string;
  customer_name: string;
  customer_mobile: string;
  customer_address?: string;
  delivery_boy_id: string;
  delivery_boy_name?: string;
  delivery_boy_mobile?: string;
  original_delivery_boy_id?: string;
  original_delivery_boy_name?: string;
  original_delivery_boy_mobile?: string;
  accepted_by_delivery_boy_id?: string;
  confirmed_by_delivery_boy_id?: string;
  quantity: number;
  product_price: number;
  item_price?: number; // alias for product_price
  unit_price?: number; // alias for product_price
  return_amount: number;
  status: ItemReturnStatus;
  reason?: string;
  remark?: string;
  return_remark?: string;
  requested_at: string;
  created_at?: string; // alias for requested_at
  assigned_at?: string;
  accepted_at?: string;
  confirmed_at?: string;
  completed_at?: string;
  stock_restored?: boolean;
  request_type?: 'return' | 'replace';
  replacement_size?: string;
  replacement_color?: string;
  replacement_reason?: string;
  replacement_amount?: number;
  is_credit_adjusted?: boolean;
  adjusted_in_order_id?: string;
  adjusted_at?: string;
}

export interface InventoryTransaction {
  id: string;
  return_id?: string;
  order_id?: string;
  order_item_id?: string;
  product_id: string;
  product_name: string;
  sku?: string;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reason: 'RETURN' | 'ORDER' | 'CANCEL' | 'MANUAL_ADJUST' | 'REPLACE';
  confirmed_by_delivery_boy_id?: string;
  confirmed_by_delivery_boy_name?: string;
  timestamp: string;
}

export interface OrderStatusHistoryItem {
  id: string;
  order_id: string;
  status: OrderStatus;
  changed_by: string;
  changed_at: string;
  notes?: string;
}

export interface Order {
  id: string;
  order_id: string; // e.g. STYLE1-ORD-000001
  invoice_number?: string; // e.g. INV-10025
  customer_id: string; // e.g. STYLE1-CUST-000001
  customer_name: string;
  mobile: string;
  email?: string;
  address: CustomerAddress;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  delivery_charge: number;
  tax_amount: number;
  total: number;
  total_amount?: number; // Backwards-compatible alias for total
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  order_type?: OrderType;
  created_at: string;
  order_date?: string; // Backwards-compatible alias for created_at
  updated_at: string;
  tracking_number?: string;
  courier_partner?: string;
  status_history: OrderStatusHistoryItem[];
  assigned_delivery_boy_id?: string;
  assigned_delivery_boy_name?: string;
  assigned_delivery_boy_mobile?: string;
  delivery_boy_assigned_at?: string;
  original_delivery_boy_id?: string;
  original_delivery_boy_name?: string;
  original_delivery_boy_mobile?: string;
  delivered_items_count?: number;
  returned_items_count?: number;
  final_items_count?: number;
  original_amount?: number;
  return_amount?: number;
  final_payable_amount?: number;
  amount_collected?: number;
  balance_due?: number;
  final_bill_generated?: boolean;
  final_bill_locked?: boolean;
  final_bill_generated_at?: string;
  is_replace_order?: boolean;
  replaced_items_count?: number;
  try_at_home_delivered_at?: string;
  try_at_home_duration_minutes?: number;
  try_at_home_expires_at?: string;
  try_at_home_status?: 'ACTIVE' | 'EXPIRED' | 'CLOSED' | 'COMPLETED';
  try_at_home_closed_at?: string;
  try_at_home_decision_notes?: string;
  try_at_home_fee?: number;
  replacement_credit_applied?: number;
  replacement_credit_source_id?: string;
  replacement_credit_source_order_id?: string;
}

export interface DeliveryBoy {
  id: string; // e.g. dboy-1
  delivery_boy_id: string; // e.g. STYLE1-DBOY-000001
  name: string;
  mobile: string;
  password?: string;
  email?: string;
  vehicle_type?: string;
  vehicle_number?: string;
  city?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'Active' | 'Inactive';
  assigned_area?: string;
  assigned_orders?: string[];
  created_at: string;
  total_delivered: number;
  completed_deliveries?: number;
  rating?: number;
}

export interface DeliveryBoyDetailedManagement {
  delivery_boy_id: string;
  id: string;
  name: string;
  delivery_boy_name?: string;
  mobile: string;
  vehicle_number: string;
  vehicle_type: string;
  city: string;
  status: string;
  total_orders_delivered: number;
  total_items_delivered: number;
  total_return_pickups: number;
  total_items_returned: number;
  total_cod_cash_collected: number;
  total_prepaid_amount_delivered: number;
  total_return_refund_amount: number;
  return_rate_percentage: number;
  active_assigned_orders_count: number;
  last_delivery_at?: string;
  last_return_at?: string;
  last_active_at?: string;
  delivered_orders: {
    order_id: string;
    invoice_number: string;
    delivered_at: string;
    customer_name: string;
    customer_mobile: string;
    customer_address: string;
    customer_city?: string;
    total_items_count: number;
    items: {
      id: string;
      product_id?: string;
      product_name: string;
      image_url?: string;
      size?: string;
      color?: string;
      quantity: number;
      price: number;
    }[];
    payable_amount: number;
    total_amount?: number;
    payment_method: string;
    payment_status: string;
  }[];
  returned_items: {
    id: string;
    return_id?: string;
    order_id: string;
    invoice_number: string;
    returned_at: string;
    customer_name: string;
    customer_mobile: string;
    product_name: string;
    item_name?: string;
    size?: string;
    quantity: number;
    return_amount: number;
    reason: string;
    remark?: string;
    status: string;
  }[];
}

export interface AdminUser {
  id: string;
  name: string;
  email_or_mobile: string;
  role: 'super_admin' | 'admin' | 'inventory_manager';
  status: 'ACTIVE' | 'INACTIVE';
  avatar?: string;
}

export interface StoreSettings {
  store_name: string;
  store_tagline: string;
  store_address?: string;
  gst_number?: string;
  contact_email: string;
  contact_phone: string;
  delivery_charge: number;
  free_delivery_threshold: number;
  cod_enabled: boolean;
  online_payment_enabled: boolean;
  min_order_value: number;
  gst_percentage: number;
  currency: string;
  currency_symbol: string;
  try_at_home_duration_minutes?: number;
  try_at_home_auto_close_on_expiry?: boolean;
  try_at_home_charge?: number; // Non-refundable Try at Home Convenience Fee (₹)
  // Hero Carousel Configuration (3-Slide Hero Banner)
  hero_image_1?: string;
  hero_image_2?: string;
  hero_image_3?: string;
  hero_background_image?: string;
  // SMS & OTP Gateway Configuration (Configurable & change later)
  sms_provider?: 'demo' | 'twilio' | 'fast2sms' | 'msg91';
  sms_api_key?: string;
  sms_sender_id?: string;
  twilio_account_sid?: string;
  twilio_auth_token?: string;
  twilio_from_phone?: string;

  // Centralized Theme & Colors
  theme_primary?: string;
  theme_secondary?: string;
  theme_accent?: string;
  theme_background?: string;
  theme_card_background?: string;
  theme_text?: string;
  theme_heading?: string;
  theme_button?: string;
  theme_button_text?: string;
  theme_border?: string;
  theme_header?: string;
  theme_footer?: string;

  // Compatibility fields for legacy and dual-key alignment
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  bg_color?: string;
  text_color?: string;
  heading_color?: string;
  header_bg_color?: string;
  footer_bg_color?: string;
  website_logo?: string;
  favicon?: string;
  header_text_color?: string;

  // Centralized Branding Logos & Images
  logo_website?: string;
  logo_favicon?: string;
  logo_header?: string;
  logo_footer?: string;

  // Centralized Banner Configurations
  hero_slides?: HeroSlideConfig[];
  festival_banners?: FestivalBannerConfig[];
  advertisement_banners?: AdvertisementBannerConfig[];

  // Unified Appearance Customizations
  theme_typography?: { fontFamilyDisplay?: string; fontFamilyBody?: string; fontScale?: number };
  theme_ui_style?: { borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'full'; borderWidth?: 'none' | 'thin' | 'thick' };
  theme_mobile_appearance?: { denseMode?: boolean; showQuickActions?: boolean };
}

export interface HeroSlideConfig {
  url: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  enabled: boolean;
}

export interface FestivalBannerConfig {
  id?: string;
  festivalName: string;
  bannerImageUrl: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  startDate: string;
  endDate: string;
  enabled: boolean;
}

export interface AdvertisementBannerConfig {
  id: string;
  name: string;
  imageUrl: string;
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  position: 'hero_below' | 'product_section' | 'category_section' | 'middle_banner' | 'bottom_banner';
  startDate: string;
  endDate: string;
  priority: number;
  enabled: boolean;
  order: number;
}

export interface DashboardStats {
  today_orders: number;
  today_sales: number;
  total_orders: number;
  total_customers: number;
  total_products: number;
  live_products: number;
  published_products?: number;
  total_stock?: number;
  out_of_stock_products: number;
  low_stock_products: number;
  pending_orders: number;
  delivered_orders: number;
  cancelled_orders: number;
  total_sales: number;
  recent_orders: Order[];
  top_products: Array<{
    product: Product;
    sales_count: number;
    revenue: number;
  }>;
  sales_by_day: Array<{
    date: string;
    sales: number;
    orders: number;
  }>;
}

export interface ExcelImportRow {
  'Product Name': string;
  'SKU': string;
  'Category': string;
  'Subcategory'?: string;
  'Brand': string;
  'Description': string;
  'MRP': number | string;
  'Selling Price': number | string;
  'Discount'?: number | string;
  'Stock': number | string;
  'Size'?: string;
  'Color'?: string;
  'Image URLs'?: string;
  'Status'?: string;
  'Gender'?: string;
}

export interface ExcelValidationResult {
  row_number: number;
  sku: string;
  name: string;
  category: string;
  mrp: number;
  selling_price: number;
  stock: number;
  sizes: string[];
  colors: string[];
  image_urls: string[];
  is_valid: boolean;
  errors: string[];
  status: ProductStatus;
  gender: Gender;
}

export type UserRole = 'CUSTOMER' | 'DELIVERY_BOY' | 'ADMIN' | 'SHOPKEEPER';

export interface ShopkeeperPermissions {
  can_view_dashboard: boolean;
  can_add_product: boolean;
  can_edit_product: boolean;
  can_upload_images: boolean;
  can_view_catalog: boolean;
  can_stock_in: boolean;
  can_stock_out: boolean;
  can_view_inventory: boolean;
  can_view_orders: boolean;
  can_view_stock_history: boolean;
  can_edit_price: boolean;
  can_edit_category: boolean;
  can_edit_images: boolean;
}

export interface Shopkeeper {
  id: string; // e.g. shop-1
  shopkeeper_id: string; // e.g. STYLE1-SHOP-000001
  name: string;
  store_name?: string;
  mobile: string;
  email?: string;
  city?: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  permissions: ShopkeeperPermissions;
  total_products: number;
  live_products: number;
  pending_products: number;
  current_stock: number;
  total_orders: number;
}

export interface StockTransaction {
  id: string; // e.g. stx-1
  transaction_id: string; // e.g. STX-STYLE1-000001
  product_id: string;
  product_name: string;
  sku: string;
  category_name?: string;
  shopkeeper_id: string;
  shopkeeper_name: string;
  transaction_type: 'IN' | 'OUT' | 'ORDER_STOCK_OUT' | 'RETURN_STOCK_IN' | 'ADJUSTMENT';
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reason?: string;
  reference_note?: string;
  performed_by: 'ADMIN' | 'SHOPKEEPER' | 'SYSTEM' | 'CUSTOMER' | 'DELIVERY_BOY';
  performed_by_name: string;
  performed_by_id: string;
  timestamp: string;
  order_id?: string;
}

export interface AuthSession {
  userId: string;
  role: UserRole;
  mobile: string;
  name: string;
  email?: string;
  token: string;
  authenticated_at: string;
  expires_at: number;
}

export interface AdminAccount {
  id: string;
  name: string;
  mobile: string;
  email: string;
  role: 'ADMIN' | 'super_admin';
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
}

export interface ProductReview {
  id: string;
  product_id: string;
  product_name: string;
  order_id: string;
  order_item_id?: string;
  customer_id: string;
  customer_name: string;
  customer_mobile?: string;
  rating: number; // 1 to 5 stars
  review_title?: string;
  review_text: string;
  is_verified_purchase: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ProductRatingStats {
  average_rating: number;
  total_reviews: number;
  star_counts: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  star_percentages: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}
