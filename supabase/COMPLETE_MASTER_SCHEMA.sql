-- ============================================================================
-- TRYatHOME E-COMMERCE & TRY-AT-HOME PORTAL — COMPLETE MASTER SQL SCRIPT
-- ============================================================================
-- Safe & idempotent script: can be run on a fresh or existing Supabase project.
-- 1. Drops any conflicting foreign key constraints from legacy UUID schemas
-- 2. Converts existing UUID columns across all tables to TEXT safely
-- 3. Creates/updates all 16 tables with TEXT-compatible keys
-- 4. Sets up indexes and triggers
-- 5. Configures Supabase Storage bucket & storage policies
-- 6. Grants permissions to anon, authenticated, and service_role
-- 7. Seeds initial store settings, categories, and 10 test entries for each entity
-- ============================================================================

-- -----------------------------------------------------
-- 1. EXTENSIONS & FUNCTIONS
-- -----------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------
-- 2. PRE-CLEANUP: DROP CONFLICTING CONSTRAINTS & CONVERT ALL UUIDs TO TEXT
-- -----------------------------------------------------
ALTER TABLE IF EXISTS product_returns DROP CONSTRAINT IF EXISTS product_returns_order_item_id_fkey;
ALTER TABLE IF EXISTS product_returns DROP CONSTRAINT IF EXISTS product_returns_order_id_fkey;
ALTER TABLE IF EXISTS order_items DROP CONSTRAINT IF EXISTS order_items_order_id_fkey;
ALTER TABLE IF EXISTS order_status_history DROP CONSTRAINT IF EXISTS order_status_history_order_id_fkey;

-- Safely convert existing UUID columns to TEXT if tables already exist
DO $$
DECLARE
  tbl text;
BEGIN
  -- Convert 'id' column on all tables to TEXT if currently UUID
  FOR tbl IN SELECT unnest(ARRAY[
    'customers',
    'customer_addresses',
    'shopkeepers',
    'products',
    'product_images',
    'product_variants',
    'delivery_boys',
    'orders',
    'order_items',
    'order_status_history',
    'product_returns',
    'stock_transactions',
    'wishlist_items',
    'admin_users'
  ])
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = tbl AND column_name = 'id' AND data_type != 'text'
    ) THEN
      EXECUTE format('ALTER TABLE %I ALTER COLUMN id DROP DEFAULT;', tbl);
      EXECUTE format('ALTER TABLE %I ALTER COLUMN id TYPE TEXT USING id::text;', tbl);
      EXECUTE format('ALTER TABLE %I ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;', tbl);
    END IF;
  END LOOP;

  -- product_returns.order_item_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product_returns' AND column_name = 'order_item_id' AND data_type != 'text'
  ) THEN
    ALTER TABLE product_returns ALTER COLUMN order_item_id TYPE TEXT USING order_item_id::text;
  END IF;
END $$;

-- -----------------------------------------------------
-- 3. STORE SETTINGS TABLE (Single row: id = 1)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS store_settings (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    store_name TEXT NOT NULL DEFAULT 'TRYatHOME',
    store_tagline TEXT DEFAULT 'India’s Modern Garment & Fashion Destination • Try at Home',
    contact_email TEXT DEFAULT 'care@tryathome.in',
    contact_phone TEXT DEFAULT '+91 98765 43210',
    delivery_charge NUMERIC(10, 2) DEFAULT 49.00,
    free_delivery_threshold NUMERIC(10, 2) DEFAULT 499.00,
    cod_enabled BOOLEAN DEFAULT TRUE,
    online_payment_enabled BOOLEAN DEFAULT TRUE,
    min_order_value NUMERIC(10, 2) DEFAULT 199.00,
    gst_percentage NUMERIC(5, 2) DEFAULT 5.00,
    currency TEXT DEFAULT 'INR',
    currency_symbol TEXT DEFAULT '₹',
    try_at_home_duration_minutes INT DEFAULT 30,
    try_at_home_auto_close_on_expiry BOOLEAN DEFAULT TRUE,
    try_at_home_charge NUMERIC(10, 2) DEFAULT 99.00,
    sms_provider TEXT DEFAULT 'demo',
    sms_api_key TEXT DEFAULT 'DEMO_KEY_TRYATHOME_SMS_2026',
    sms_sender_id TEXT DEFAULT 'TRYHOM',
    twilio_account_sid TEXT DEFAULT 'AC_DEMO_TWILIO_ACCOUNT_SID_SUBABASE',
    twilio_auth_token TEXT DEFAULT 'AUTH_DEMO_TWILIO_SECRET_TOKEN',
    twilio_from_phone TEXT DEFAULT '+18005550199',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all configurable columns exist
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS sms_provider TEXT DEFAULT 'demo';
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS sms_api_key TEXT DEFAULT 'DEMO_KEY_TRYATHOME_SMS_2026';
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS sms_sender_id TEXT DEFAULT 'TRYHOM';
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS twilio_account_sid TEXT DEFAULT 'AC_DEMO_TWILIO_ACCOUNT_SID_SUBABASE';
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS twilio_auth_token TEXT DEFAULT 'AUTH_DEMO_TWILIO_SECRET_TOKEN';
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS twilio_from_phone TEXT DEFAULT '+18005550199';
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS try_at_home_charge NUMERIC(10, 2) DEFAULT 99.00;

DROP TRIGGER IF EXISTS update_store_settings_updated_at ON store_settings;
CREATE TRIGGER update_store_settings_updated_at
BEFORE UPDATE ON store_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------
-- 4. CATEGORIES TABLE
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    image TEXT,
    image_url TEXT,
    parent_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    sort_order INT DEFAULT 0,
    display_order INT DEFAULT 0,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------
-- 5. CUSTOMERS TABLE
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    customer_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    mobile TEXT NOT NULL UNIQUE,
    email TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'BLOCKED')),
    total_orders INT DEFAULT 0,
    total_spent NUMERIC(12, 2) DEFAULT 0.00,
    last_order_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON customers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------
-- 6. CUSTOMER ADDRESSES TABLE
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS customer_addresses (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    customer_id TEXT NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    mobile TEXT NOT NULL,
    pincode TEXT NOT NULL,
    address TEXT NOT NULL,
    locality TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    landmark TEXT,
    address_type TEXT NOT NULL DEFAULT 'HOME' CHECK (address_type IN ('HOME', 'WORK', 'OTHER')),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------
-- 7. SHOPKEEPERS (VENDORS) TABLE
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS shopkeepers (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    shopkeeper_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    store_name TEXT,
    mobile TEXT NOT NULL UNIQUE,
    email TEXT,
    city TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    permissions JSONB NOT NULL DEFAULT '{"can_view_dashboard":true,"can_add_product":true,"can_edit_product":true,"can_upload_images":true,"can_view_catalog":true,"can_stock_in":true,"can_stock_out":true,"can_view_inventory":true,"can_view_orders":true,"can_view_stock_history":true,"can_edit_price":true,"can_edit_category":true,"can_edit_images":true}'::jsonb,
    total_products INT DEFAULT 0,
    live_products INT DEFAULT 0,
    pending_products INT DEFAULT 0,
    current_stock INT DEFAULT 0,
    total_orders INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------
-- 8. PRODUCTS TABLE
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    sku TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    category_name TEXT NOT NULL,
    category_slug TEXT,
    subcategory_id TEXT,
    subcategory_name TEXT,
    gender TEXT NOT NULL CHECK (gender IN ('Men', 'Women', 'Kids', 'Unisex')),
    description TEXT,
    brand TEXT,
    mrp NUMERIC(10, 2) NOT NULL,
    selling_price NUMERIC(10, 2) NOT NULL,
    admin_selling_price NUMERIC(10, 2),
    shopkeeper_price NUMERIC(10, 2),
    discount_percentage NUMERIC(5, 2) DEFAULT 0.00,
    stock INT DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Published', 'Unpublished', 'Out of Stock')),
    rating NUMERIC(3, 2) DEFAULT 5.00,
    rating_count INT DEFAULT 0,
    sizes TEXT[] DEFAULT '{}',
    colors TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    specifications JSONB DEFAULT '{}'::jsonb,
    shopkeeper_id TEXT REFERENCES shopkeepers(shopkeeper_id) ON DELETE SET NULL,
    shopkeeper_name TEXT,
    approval_status TEXT NOT NULL DEFAULT 'APPROVED' CHECK (approval_status IN ('PENDING', 'APPROVED', 'REJECTED')),
    rejection_reason TEXT,
    is_live BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------
-- 9. PRODUCT IMAGES TABLE
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS product_images (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    sort_order INT DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    caption TEXT
);

-- -----------------------------------------------------
-- 10. PRODUCT VARIANTS TABLE
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS product_variants (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    size TEXT NOT NULL,
    color TEXT NOT NULL,
    sku TEXT NOT NULL,
    stock INT DEFAULT 0,
    price NUMERIC(10, 2) NOT NULL,
    mrp NUMERIC(10, 2) NOT NULL
);

-- -----------------------------------------------------
-- 11. DELIVERY BOYS (PARTNERS) TABLE
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS delivery_boys (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    delivery_boy_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    mobile TEXT NOT NULL UNIQUE,
    password TEXT,
    email TEXT,
    vehicle_type TEXT,
    vehicle_number TEXT,
    city TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    assigned_area TEXT,
    total_delivered INT DEFAULT 0,
    rating NUMERIC(3, 2) DEFAULT 5.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------
-- 12. ORDERS TABLE
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    order_id TEXT NOT NULL UNIQUE,
    invoice_number TEXT,
    customer_id TEXT NOT NULL REFERENCES customers(customer_id) ON DELETE RESTRICT,
    customer_name TEXT NOT NULL,
    mobile TEXT NOT NULL,
    email TEXT,
    subtotal NUMERIC(10, 2) NOT NULL,
    discount NUMERIC(10, 2) DEFAULT 0.00,
    delivery_charge NUMERIC(10, 2) DEFAULT 0.00,
    tax_amount NUMERIC(10, 2) DEFAULT 0.00,
    total NUMERIC(10, 2) NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('COD', 'ONLINE_RAZORPAY')),
    payment_status TEXT NOT NULL CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')),
    order_status TEXT NOT NULL DEFAULT 'Pending',
    order_type TEXT NOT NULL DEFAULT 'standard' CHECK (order_type IN ('standard', 'try_at_home')),
    tracking_number TEXT,
    courier_partner TEXT,
    assigned_delivery_boy_id TEXT REFERENCES delivery_boys(delivery_boy_id) ON DELETE SET NULL,
    assigned_delivery_boy_name TEXT,
    assigned_delivery_boy_mobile TEXT,
    delivery_boy_assigned_at TIMESTAMPTZ,
    original_delivery_boy_id TEXT,
    original_delivery_boy_name TEXT,
    original_delivery_boy_mobile TEXT,
    try_at_home_status TEXT CHECK (try_at_home_status IN ('ACTIVE', 'EXPIRED', 'CLOSED', 'COMPLETED')),
    try_at_home_fee NUMERIC(10, 2) DEFAULT 0.00,
    try_at_home_duration_minutes INT,
    try_at_home_expires_at TIMESTAMPTZ,
    try_at_home_closed_at TIMESTAMPTZ,
    try_at_home_decision_notes TEXT,
    try_at_home_delivered_at TIMESTAMPTZ,
    replacement_credit_applied NUMERIC(10, 2) DEFAULT 0.00,
    replacement_credit_source_order_id TEXT,
    delivery_address JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address JSONB;

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------
-- 13. ORDER ITEMS TABLE
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    order_id TEXT NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    product_name TEXT NOT NULL,
    brand TEXT,
    sku TEXT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    price NUMERIC(10, 2) NOT NULL,
    mrp NUMERIC(10, 2) NOT NULL,
    size TEXT NOT NULL,
    color TEXT NOT NULL,
    image_url TEXT NOT NULL,
    item_status TEXT,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    return_status TEXT,
    returned_quantity INT DEFAULT 0,
    final_quantity INT,
    return_amount NUMERIC(10, 2) DEFAULT 0.00,
    final_amount NUMERIC(10, 2),
    return_id TEXT,
    return_reason TEXT,
    return_remark TEXT,
    return_requested_at TIMESTAMPTZ,
    return_accepted_at TIMESTAMPTZ,
    return_completed_at TIMESTAMPTZ,
    stock_restored BOOLEAN DEFAULT FALSE,
    request_type TEXT CHECK (request_type IN ('return', 'replace')),
    is_replaced BOOLEAN DEFAULT FALSE,
    replacement_size TEXT,
    replacement_color TEXT,
    replacement_reason TEXT,
    replacement_amount NUMERIC(10, 2) DEFAULT 0.00,
    shopkeeper_id TEXT,
    shopkeeper_name TEXT
);

-- -----------------------------------------------------
-- 14. ORDER STATUS HISTORY TABLE
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS order_status_history (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    order_id TEXT NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    changed_by TEXT NOT NULL,
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT
);

-- -----------------------------------------------------
-- 15. PRODUCT RETURNS TABLE
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS product_returns (
    return_id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    order_item_id TEXT,
    invoice_number TEXT,
    product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    size TEXT NOT NULL,
    color TEXT NOT NULL,
    customer_id TEXT REFERENCES customers(customer_id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_mobile TEXT NOT NULL,
    customer_address TEXT,
    delivery_boy_id TEXT REFERENCES delivery_boys(delivery_boy_id) ON DELETE SET NULL,
    delivery_boy_name TEXT,
    delivery_boy_mobile TEXT,
    quantity INT NOT NULL CHECK (quantity > 0),
    product_price NUMERIC(10, 2) NOT NULL,
    return_amount NUMERIC(10, 2) NOT NULL,
    status TEXT NOT NULL,
    reason TEXT,
    remark TEXT,
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    confirmed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    stock_restored BOOLEAN DEFAULT FALSE,
    request_type TEXT CHECK (request_type IN ('return', 'replace')),
    replacement_size TEXT,
    replacement_color TEXT,
    replacement_reason TEXT,
    replacement_amount NUMERIC(10, 2) DEFAULT 0.00,
    is_credit_adjusted BOOLEAN DEFAULT FALSE,
    adjusted_in_order_id TEXT,
    adjusted_at TIMESTAMPTZ
);

-- Safely link foreign key now that both are TEXT
ALTER TABLE product_returns DROP CONSTRAINT IF EXISTS product_returns_order_item_id_fkey;
ALTER TABLE product_returns ADD CONSTRAINT product_returns_order_item_id_fkey 
  FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE;

-- -----------------------------------------------------
-- 16. STOCK TRANSACTIONS TABLE
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS stock_transactions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    transaction_id TEXT NOT NULL UNIQUE,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    sku TEXT NOT NULL,
    category_name TEXT,
    shopkeeper_id TEXT REFERENCES shopkeepers(shopkeeper_id) ON DELETE SET NULL,
    shopkeeper_name TEXT,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('IN', 'OUT', 'ORDER_STOCK_OUT', 'RETURN_STOCK_IN', 'ADJUSTMENT')),
    quantity INT NOT NULL,
    previous_stock INT NOT NULL,
    new_stock INT NOT NULL,
    reason TEXT,
    reference_note TEXT,
    performed_by TEXT NOT NULL CHECK (performed_by IN ('ADMIN', 'SHOPKEEPER', 'SYSTEM', 'CUSTOMER', 'DELIVERY_BOY')),
    performed_by_name TEXT NOT NULL,
    performed_by_id TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    order_id TEXT
);

-- -----------------------------------------------------
-- 17. WISHLIST ITEMS TABLE
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS wishlist_items (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    customer_id TEXT NOT NULL,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(customer_id, product_id)
);

-- -----------------------------------------------------
-- 17B. CART ITEMS TABLE (Cloud Cart Sync)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS cart_items (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    customer_id TEXT NOT NULL,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    size TEXT NOT NULL,
    color TEXT NOT NULL,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    added_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(customer_id, product_id, size, color)
);

-- -----------------------------------------------------
-- 17C. AUTH SESSIONS TABLE (Cloud Session Sync)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS auth_sessions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    user_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------
-- 18. ADMIN USERS TABLE
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    email_or_mobile TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'inventory_manager')),
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    avatar TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------
-- 19. PRODUCT REVIEWS TABLE
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS product_reviews (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    order_id TEXT NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    order_item_id TEXT,
    customer_id TEXT NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    customer_mobile TEXT,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_title TEXT,
    review_text TEXT NOT NULL,
    is_verified_purchase BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (customer_id, product_id, order_id)
);

DROP TRIGGER IF EXISTS update_product_reviews_updated_at ON product_reviews;
CREATE TRIGGER update_product_reviews_updated_at
BEFORE UPDATE ON product_reviews
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------
-- DATABASE INDEXES
-- -----------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_gender ON products(gender);
CREATE INDEX IF NOT EXISTS idx_customers_mobile ON customers(mobile);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_product_returns_order_id ON product_returns(order_id);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_product_id ON stock_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_customer_id ON product_reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_order_id ON product_reviews(order_id);

-- -----------------------------------------------------
-- SUPABASE STORAGE CONFIGURATION (Product Images Bucket)
-- -----------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Allow Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Allow Public Insert" ON storage.objects;
DROP POLICY IF EXISTS "Allow Public Update" ON storage.objects;
DROP POLICY IF EXISTS "Allow Public Delete" ON storage.objects;

CREATE POLICY "Allow Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Allow Public Insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Allow Public Update" ON storage.objects
  FOR UPDATE WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Allow Public Delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'product-images');

-- -----------------------------------------------------
-- GRANT PERMISSIONS TO ANON, AUTHENTICATED & SERVICE ROLES
-- -----------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- -----------------------------------------------------
-- ENABLE ROW LEVEL SECURITY & ADD POLICIES FOR ALL TABLES
-- -----------------------------------------------------
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'store_settings',
    'categories',
    'customers',
    'customer_addresses',
    'shopkeepers',
    'products',
    'product_images',
    'product_variants',
    'delivery_boys',
    'orders',
    'order_items',
    'order_status_history',
    'product_returns',
    'stock_transactions',
    'wishlist_items',
    'cart_items',
    'auth_sessions',
    'admin_users',
    'product_reviews'
  ])
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Allow All for Anon and Authenticated" ON %I;', tbl);
    EXECUTE format('CREATE POLICY "Allow All for Anon and Authenticated" ON %I FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);', tbl);
  END LOOP;
END $$;

-- -----------------------------------------------------
-- SEED INITIAL DATA
-- -----------------------------------------------------

-- 1. Default Store Settings
INSERT INTO store_settings (
  id, store_name, store_tagline, contact_email, contact_phone, 
  delivery_charge, free_delivery_threshold, cod_enabled, online_payment_enabled, 
  min_order_value, gst_percentage, try_at_home_duration_minutes, 
  try_at_home_auto_close_on_expiry, try_at_home_charge,
  sms_provider, sms_api_key, sms_sender_id, twilio_account_sid, twilio_auth_token, twilio_from_phone
)
VALUES (
  1, 'TRYatHOME', 'India’s Modern Garment & Fashion Destination • Try at Home',
  'care@tryathome.in', '+91 98765 43210', 49.00, 499.00, true, true, 199.00, 5.00,
  30, true, 99.00,
  'demo', 'DEMO_KEY_TRYATHOME_SMS_2026', 'TRYHOM', 
  'AC_DEMO_TWILIO_ACCOUNT_SID_SUBABASE', 'AUTH_DEMO_TWILIO_SECRET_TOKEN', '+18005550199'
)
ON CONFLICT (id) DO UPDATE SET 
  sms_provider = EXCLUDED.sms_provider,
  sms_api_key = EXCLUDED.sms_api_key,
  sms_sender_id = EXCLUDED.sms_sender_id,
  twilio_account_sid = EXCLUDED.twilio_account_sid,
  twilio_auth_token = EXCLUDED.twilio_auth_token,
  twilio_from_phone = EXCLUDED.twilio_from_phone;

-- 2. Categories
INSERT INTO categories (id, name, slug, status, sort_order)
VALUES 
  ('cat-jeans', 'Jeans', 'jeans', 'ACTIVE', 1),
  ('cat-tshirts', 'T-Shirts', 'tshirts', 'ACTIVE', 2),
  ('cat-shirts', 'Shirts', 'shirts', 'ACTIVE', 3),
  ('cat-pants', 'Pants & Trousers', 'pants', 'ACTIVE', 4),
  ('cat-leggings', 'Leggings', 'leggings', 'ACTIVE', 5),
  ('cat-kurtis', 'Kurtis & Sets', 'kurtis', 'ACTIVE', 6),
  ('cat-sarees', 'Sarees', 'sarees', 'ACTIVE', 7),
  ('cat-dresses', 'Dresses & Frocks', 'dresses', 'ACTIVE', 8),
  ('cat-winter', 'Winter Wear', 'winter-wear', 'ACTIVE', 9),
  ('cat-1', 'Men Fashion', 'men-fashion', 'ACTIVE', 10),
  ('cat-2', 'Women Fashion', 'women-fashion', 'ACTIVE', 11),
  ('cat-3', 'Kids Wear', 'kids-wear', 'ACTIVE', 12)
ON CONFLICT (id) DO NOTHING;

-- 3. Seed 10 Shopkeepers
INSERT INTO shopkeepers (shopkeeper_id, name, store_name, mobile, email, city, status, permissions, total_products, live_products, current_stock)
VALUES
  ('TEST-SHOPKEEPER-01', 'Arjun Sharma', 'TEST Ethnic India Trends', '9100000001', 'test.arjun@tryathome.in', 'New Delhi', 'ACTIVE', '{"can_view_dashboard":true,"can_add_product":true,"can_edit_product":true,"can_delete_product":false,"can_manage_inventory":true,"can_view_orders":true,"can_process_orders":true}'::jsonb, 1, 1, 120),
  ('TEST-SHOPKEEPER-02', 'Priya Patel', 'TEST Zara Premium Casuals', '9100000002', 'test.priya@tryathome.in', 'Mumbai', 'ACTIVE', '{"can_view_dashboard":true,"can_add_product":true,"can_edit_product":true,"can_delete_product":false,"can_manage_inventory":true,"can_view_orders":true,"can_process_orders":true}'::jsonb, 1, 1, 95),
  ('TEST-SHOPKEEPER-03', 'Rajesh Khanna', 'TEST Western Style Hub', '9100000003', 'test.rajesh@tryathome.in', 'Bengaluru', 'ACTIVE', '{"can_view_dashboard":true,"can_add_product":true,"can_edit_product":true,"can_delete_product":false,"can_manage_inventory":true,"can_view_orders":true,"can_process_orders":true}'::jsonb, 1, 1, 150),
  ('TEST-SHOPKEEPER-04', 'Sanjay Dutt', 'TEST Denim World', '9100000004', 'test.sanjay@tryathome.in', 'New Delhi', 'ACTIVE', '{"can_view_dashboard":true,"can_add_product":true,"can_edit_product":true,"can_delete_product":false,"can_manage_inventory":true,"can_view_orders":true,"can_process_orders":true}'::jsonb, 1, 1, 110),
  ('TEST-SHOPKEEPER-05', 'Nisha Sen', 'TEST Kurti & Lehenga Palace', '9100000005', 'test.nisha@tryathome.in', 'Kolkata', 'ACTIVE', '{"can_view_dashboard":true,"can_add_product":true,"can_edit_product":true,"can_delete_product":false,"can_manage_inventory":true,"can_view_orders":true,"can_process_orders":true}'::jsonb, 1, 1, 130),
  ('TEST-SHOPKEEPER-06', 'Vikas Gupta', 'TEST T-Shirt Point', '9100000006', 'test.vikas@tryathome.in', 'Ahmedabad', 'ACTIVE', '{"can_view_dashboard":true,"can_add_product":true,"can_edit_product":true,"can_delete_product":false,"can_manage_inventory":true,"can_view_orders":true,"can_process_orders":true}'::jsonb, 1, 1, 180),
  ('TEST-SHOPKEEPER-07', 'Sneha Reddy', 'TEST Premium Sarees', '9100000007', 'test.sneha@tryathome.in', 'Hyderabad', 'ACTIVE', '{"can_view_dashboard":true,"can_add_product":true,"can_edit_product":true,"can_delete_product":false,"can_manage_inventory":true,"can_view_orders":true,"can_process_orders":true}'::jsonb, 1, 1, 75),
  ('TEST-SHOPKEEPER-08', 'Gaurav Gill', 'TEST Sports Activewear', '9100000008', 'test.gaurav@tryathome.in', 'Chandigarh', 'ACTIVE', '{"can_view_dashboard":true,"can_add_product":true,"can_edit_product":true,"can_delete_product":false,"can_manage_inventory":true,"can_view_orders":true,"can_process_orders":true}'::jsonb, 1, 1, 90),
  ('TEST-SHOPKEEPER-09', 'Asha Bhosle', 'TEST Kids Fashion House', '9100000009', 'test.asha@tryathome.in', 'Pune', 'ACTIVE', '{"can_view_dashboard":true,"can_add_product":true,"can_edit_product":true,"can_delete_product":false,"can_manage_inventory":true,"can_view_orders":true,"can_process_orders":true}'::jsonb, 1, 1, 220),
  ('TEST-SHOPKEEPER-10', 'Rohan Mehta', 'TEST Winter Wear Boutique', '9100000010', 'test.rohan@tryathome.in', 'New Delhi', 'ACTIVE', '{"can_view_dashboard":true,"can_add_product":true,"can_edit_product":true,"can_delete_product":false,"can_manage_inventory":true,"can_view_orders":true,"can_process_orders":true}'::jsonb, 1, 1, 140)
ON CONFLICT (shopkeeper_id) DO UPDATE SET name = EXCLUDED.name, store_name = EXCLUDED.store_name, status = EXCLUDED.status;

-- 4. Seed 10 Delivery Partners
INSERT INTO delivery_boys (delivery_boy_id, name, mobile, vehicle_type, vehicle_number, city, status, assigned_area, total_delivered, rating)
VALUES
  ('TEST-DELIVERY-01', 'Ravi Shankar', '9200000001', 'Motorcycle', 'DL-3C-XX-1122', 'New Delhi', 'ACTIVE', 'Connaught Place & Karol Bagh', 45, 4.9),
  ('TEST-DELIVERY-02', 'Amit Singh', '9200000002', 'Scooter', 'MH-01-YY-3344', 'Mumbai', 'ACTIVE', 'Bandra & Andheri West', 32, 4.8),
  ('TEST-DELIVERY-03', 'Vijay Kumar', '9200000003', 'Motorcycle', 'KA-03-ZZ-5566', 'Bengaluru', 'ACTIVE', 'Indiranagar & Koramangala', 54, 4.9),
  ('TEST-DELIVERY-04', 'Satish Chawla', '9200000004', 'Motorcycle', 'DL-4S-AA-4433', 'New Delhi', 'ACTIVE', 'Dwarka & Janakpuri', 15, 4.7),
  ('TEST-DELIVERY-05', 'Manpreet Singh', '9200000005', 'Motorcycle', 'PB-02-QQ-5544', 'Chandigarh', 'ACTIVE', 'Sector 17 & 35', 28, 4.8),
  ('TEST-DELIVERY-06', 'Sanjay Kumar', '9200000006', 'Scooter', 'GJ-01-RR-8877', 'Ahmedabad', 'ACTIVE', 'Satellite & Vastrapur', 19, 4.6),
  ('TEST-DELIVERY-07', 'Kiran Kumar', '9200000007', 'Motorcycle', 'AP-09-UU-9988', 'Hyderabad', 'ACTIVE', 'Gachibowli & Madhapur', 37, 4.9),
  ('TEST-DELIVERY-08', 'Dilip Patel', '9200000008', 'Scooter', 'MH-02-LL-2211', 'Mumbai', 'ACTIVE', 'Borivali & Malad', 41, 4.8),
  ('TEST-DELIVERY-09', 'Abhishek Roy', '9200000009', 'Motorcycle', 'WB-01-EE-3322', 'Kolkata', 'ACTIVE', 'Salt Lake & New Town', 22, 4.7),
  ('TEST-DELIVERY-10', 'Pradeep Joshi', '9200000010', 'Scooter', 'MH-12-FF-7766', 'Pune', 'ACTIVE', 'Kothrud & Deccan', 29, 4.8)
ON CONFLICT (delivery_boy_id) DO UPDATE SET name = EXCLUDED.name, status = EXCLUDED.status;

-- 5. Seed 10 Customers
INSERT INTO customers (customer_id, name, mobile, email, status, total_orders, total_spent)
VALUES
  ('TEST-CUSTOMER-01', 'Anjali Gupta', '9300000001', 'test.anjali@gmail.com', 'ACTIVE', 2, 4500.00),
  ('TEST-CUSTOMER-02', 'Vikram Aditya', '9300000002', 'test.vikram@gmail.com', 'ACTIVE', 1, 1800.00),
  ('TEST-CUSTOMER-03', 'Suresh Raina', '9300000003', 'test.suresh@gmail.com', 'ACTIVE', 4, 12500.00),
  ('TEST-CUSTOMER-04', 'Karan Johar', '9300000004', 'test.karan@gmail.com', 'ACTIVE', 0, 0.00),
  ('TEST-CUSTOMER-05', 'Meera Nair', '9300000005', 'test.meera@gmail.com', 'ACTIVE', 3, 6200.00),
  ('TEST-CUSTOMER-06', 'Aditya Roy', '9300000006', 'test.aditya@gmail.com', 'ACTIVE', 1, 950.00),
  ('TEST-CUSTOMER-07', 'Pooja Hegde', '9300000007', 'test.pooja@gmail.com', 'ACTIVE', 5, 14200.00),
  ('TEST-CUSTOMER-08', 'Rahul Dravid', '9300000008', 'test.rahul@gmail.com', 'ACTIVE', 2, 3800.00),
  ('TEST-CUSTOMER-09', 'Sonia Gandhi', '9300000009', 'test.sonia@gmail.com', 'ACTIVE', 0, 0.00),
  ('TEST-CUSTOMER-10', 'Arvind Kejriwal', '9300000010', 'test.arvind@gmail.com', 'ACTIVE', 1, 1500.00)
ON CONFLICT (customer_id) DO UPDATE SET name = EXCLUDED.name, mobile = EXCLUDED.mobile, status = EXCLUDED.status;

-- 6. Seed Customer Addresses (10 Addresses, 1 for each customer)
INSERT INTO customer_addresses (id, customer_id, name, mobile, pincode, address, locality, city, state, address_type, is_default)
VALUES
  ('addr-seed-01', 'TEST-CUSTOMER-01', 'Anjali Gupta', '9300000001', '110001', 'Flat No. 402, Block B, Preet Vihar', 'East Delhi', 'New Delhi', 'Delhi', 'HOME', true),
  ('addr-seed-02', 'TEST-CUSTOMER-02', 'Vikram Aditya', '9300000002', '400001', 'P.O. Box 102, Nariman Point', 'South Mumbai', 'Mumbai', 'Maharashtra', 'WORK', true),
  ('addr-seed-03', 'TEST-CUSTOMER-03', 'Suresh Raina', '9300000003', '560001', 'House 43, 8th Main, Indiranagar', 'East Bengaluru', 'Bengaluru', 'Karnataka', 'HOME', true),
  ('addr-seed-04', 'TEST-CUSTOMER-04', 'Karan Johar', '9300000004', '400050', 'Bungalow 12, Bandra West', 'Pali Hill', 'Mumbai', 'Maharashtra', 'HOME', true),
  ('addr-seed-05', 'TEST-CUSTOMER-05', 'Meera Nair', '9300000005', '110016', 'D-14, Green Park Extension', 'South Delhi', 'New Delhi', 'Delhi', 'HOME', true),
  ('addr-seed-06', 'TEST-CUSTOMER-06', 'Aditya Roy', '9300000006', '560103', 'Flat 304, Palm Grove, Bellandur', 'Outer Ring Road', 'Bengaluru', 'Karnataka', 'WORK', true),
  ('addr-seed-07', 'TEST-CUSTOMER-07', 'Pooja Hegde', '9300000007', '500081', 'Villa 21, Jubilee Hills Road 36', 'Jubilee Hills', 'Hyderabad', 'Telangana', 'HOME', true),
  ('addr-seed-08', 'TEST-CUSTOMER-08', 'Rahul Dravid', '9300000008', '560004', '14/2, 5th Cross, Malleshwaram', 'Central Bengaluru', 'Bengaluru', 'Karnataka', 'HOME', true),
  ('addr-seed-09', 'TEST-CUSTOMER-09', 'Sonia Gandhi', '9300000009', '110011', '10 Janpath', 'Lutyens Delhi', 'New Delhi', 'Delhi', 'HOME', true),
  ('addr-seed-10', 'TEST-CUSTOMER-10', 'Arvind Kejriwal', '9300000010', '110054', '6 Flagstaff Road, Civil Lines', 'North Delhi', 'New Delhi', 'Delhi', 'HOME', true)
ON CONFLICT (id) DO NOTHING;

-- 7. Seed 10 Products
INSERT INTO products (id, sku, name, slug, category_id, category_name, gender, description, brand, mrp, selling_price, status, stock, sizes, colors, tags, shopkeeper_id, shopkeeper_name, approval_status, is_live)
VALUES
  ('prod-test-1', 'TEST-SKU-01', 'TEST-PRODUCT-01 Blue Jeans', 'test-product-01', 'cat-jeans', 'Jeans', 'Men', 'Test Denim Jeans Slim Fit', 'Levis', 2499.00, 1499.00, 'Published', 45, '{"30","32","34"}', '{"Blue","Black"}', '{"denim","jeans"}', 'TEST-SHOPKEEPER-01', 'Arjun Sharma', 'APPROVED', true),
  ('prod-test-2', 'TEST-SKU-02', 'TEST-PRODUCT-02 Cotton Tee', 'test-product-02', 'cat-tshirts', 'T-Shirts', 'Men', 'Test Cotton T-Shirt Round Neck', 'Puma', 999.00, 599.00, 'Published', 100, '{"M","L","XL"}', '{"White","Red"}', '{"tshirt","casual"}', 'TEST-SHOPKEEPER-02', 'Priya Patel', 'APPROVED', true),
  ('prod-test-3', 'TEST-SKU-03', 'TEST-PRODUCT-03 Oxford Shirt', 'test-product-03', 'cat-shirts', 'Shirts', 'Men', 'Test Formal Oxford Cotton Shirt', 'Zodiac', 1999.00, 1199.00, 'Published', 30, '{"40","42"}', '{"White","Blue"}', '{"shirt","formal"}', 'TEST-SHOPKEEPER-03', 'Rajesh Khanna', 'APPROVED', true),
  ('prod-test-4', 'TEST-SKU-04', 'TEST-PRODUCT-04 Cotton Chinos', 'test-product-04', 'cat-pants', 'Pants & Trousers', 'Men', 'Test Premium Cotton Stretch Chinos', 'Dockers', 2999.00, 1799.00, 'Published', 25, '{"32","34"}', '{"Khaki","Beige"}', '{"pants","casual"}', 'TEST-SHOPKEEPER-04', 'Sanjay Dutt', 'APPROVED', true),
  ('prod-test-5', 'TEST-SKU-05', 'TEST-PRODUCT-05 Black Leggings', 'test-product-05', 'cat-leggings', 'Leggings', 'Women', 'Test Stretch Leggings High Waist', 'Lyra', 799.00, 499.00, 'Published', 80, '{"Free Size"}', '{"Black"}', '{"leggings","women"}', 'TEST-SHOPKEEPER-05', 'Nisha Sen', 'APPROVED', true),
  ('prod-test-6', 'TEST-SKU-06', 'TEST-PRODUCT-06 Designer Kurti', 'test-product-06', 'cat-kurtis', 'Kurtis & Sets', 'Women', 'Test Cotton Printed Anarkali Kurti', 'Biba', 3499.00, 1999.00, 'Published', 15, '{"S","M","L"}', '{"Pink","Yellow"}', '{"kurti","ethnic"}', 'TEST-SHOPKEEPER-06', 'Vikas Gupta', 'APPROVED', true),
  ('prod-test-7', 'TEST-SKU-07', 'TEST-PRODUCT-07 Silk Saree', 'test-product-07', 'cat-sarees', 'Sarees', 'Women', 'Test Banarasi Art Silk Traditional Saree', 'Kanjivaram', 5999.00, 3499.00, 'Published', 10, '{"Unstitched"}', '{"Red","Green"}', '{"saree","wedding"}', 'TEST-SHOPKEEPER-07', 'Sneha Reddy', 'APPROVED', true),
  ('prod-test-8', 'TEST-SKU-08', 'TEST-PRODUCT-08 Jogger Pants', 'test-product-08', 'cat-pants', 'Pants & Trousers', 'Unisex', 'Test Fleece Athletic Slim Fit Joggers', 'Nike', 2499.00, 1599.00, 'Published', 40, '{"M","L","XL"}', '{"Grey","Black"}', '{"jogger","activewear"}', 'TEST-SHOPKEEPER-08', 'Gaurav Gill', 'APPROVED', true),
  ('prod-test-9', 'TEST-SKU-09', 'TEST-PRODUCT-09 Girls Frock', 'test-product-09', 'cat-dresses', 'Dresses & Frocks', 'Kids', 'Test Cotton Floral Party Frock', 'Utsa', 1499.00, 899.00, 'Published', 20, '{"4-5Y","6-7Y"}', '{"Pink"}', '{"frock","kids"}', 'TEST-SHOPKEEPER-09', 'Asha Bhosle', 'APPROVED', true),
  ('prod-test-10', 'TEST-SKU-10', 'TEST-PRODUCT-10 Winter Jacket', 'test-product-10', 'cat-winter', 'Winter Wear', 'Unisex', 'Test Lightweight Warm Puffer Jacket', 'Wildcraft', 4999.00, 2999.00, 'Published', 15, '{"S","M","L","XL"}', '{"Black","Navy"}', '{"jacket","winter"}', 'TEST-SHOPKEEPER-10', 'Rohan Mehta', 'APPROVED', true)
ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, mrp = EXCLUDED.mrp, selling_price = EXCLUDED.selling_price;

-- 8. Seed Product Images (omitting ID so Postgres autogenerates ID safely)
INSERT INTO product_images (product_id, image_url, sort_order, is_primary)
SELECT 'prod-test-1', 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&q=80', 1, true
WHERE NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = 'prod-test-1');

INSERT INTO product_images (product_id, image_url, sort_order, is_primary)
SELECT 'prod-test-2', 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&q=80', 1, true
WHERE NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = 'prod-test-2');

INSERT INTO product_images (product_id, image_url, sort_order, is_primary)
SELECT 'prod-test-3', 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400&q=80', 1, true
WHERE NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = 'prod-test-3');

INSERT INTO product_images (product_id, image_url, sort_order, is_primary)
SELECT 'prod-test-4', 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&q=80', 1, true
WHERE NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = 'prod-test-4');

INSERT INTO product_images (product_id, image_url, sort_order, is_primary)
SELECT 'prod-test-5', 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=400&q=80', 1, true
WHERE NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = 'prod-test-5');

INSERT INTO product_images (product_id, image_url, sort_order, is_primary)
SELECT 'prod-test-6', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400&q=80', 1, true
WHERE NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = 'prod-test-6');

INSERT INTO product_images (product_id, image_url, sort_order, is_primary)
SELECT 'prod-test-7', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&q=80', 1, true
WHERE NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = 'prod-test-7');

INSERT INTO product_images (product_id, image_url, sort_order, is_primary)
SELECT 'prod-test-8', 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=400&q=80', 1, true
WHERE NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = 'prod-test-8');

INSERT INTO product_images (product_id, image_url, sort_order, is_primary)
SELECT 'prod-test-9', 'https://images.unsplash.com/photo-1621452773781-0f992fd1f5cb?w=400&q=80', 1, true
WHERE NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = 'prod-test-9');

INSERT INTO product_images (product_id, image_url, sort_order, is_primary)
SELECT 'prod-test-10', 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=400&q=80', 1, true
WHERE NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = 'prod-test-10');

-- 9. Seed 10 Orders (Comprehensive Multi-Status Test Data)
INSERT INTO orders (
  order_id, invoice_number, customer_id, customer_name, mobile, email,
  subtotal, discount, delivery_charge, tax_amount, total,
  payment_method, payment_status, order_status, order_type,
  tracking_number, courier_partner,
  assigned_delivery_boy_id, assigned_delivery_boy_name, assigned_delivery_boy_mobile, delivery_boy_assigned_at,
  try_at_home_status, try_at_home_fee, try_at_home_duration_minutes,
  delivery_address
)
VALUES
  ('STYLE1-ORD-000001', 'INV-2026-0001', 'TEST-CUSTOMER-01', 'Anjali Gupta', '9300000001', 'test.anjali@gmail.com', 1499.00, 1000.00, 0.00, 75.00, 1499.00, 'COD', 'PENDING', 'Confirmed', 'standard', 'ST1-EXP-100001', 'BlueDart Express', NULL, NULL, NULL, NULL, NULL, 0, NULL, '{"address":"Flat No. 402, Block B, Preet Vihar","city":"New Delhi","state":"Delhi","pincode":"110001","name":"Anjali Gupta","mobile":"9300000001"}'::jsonb),
  ('STYLE1-ORD-000002', 'INV-2026-0002', 'TEST-CUSTOMER-02', 'Vikram Aditya', '9300000002', 'test.vikram@gmail.com', 599.00, 400.00, 49.00, 30.00, 648.00, 'ONLINE_RAZORPAY', 'PAID', 'Processing', 'standard', 'ST1-EXP-100002', 'Delhivery Surface', NULL, NULL, NULL, NULL, NULL, 0, NULL, '{"address":"P.O. Box 102, Nariman Point","city":"Mumbai","state":"Maharashtra","pincode":"400001","name":"Vikram Aditya","mobile":"9300000002"}'::jsonb),
  ('STYLE1-ORD-000003', 'INV-2026-0003', 'TEST-CUSTOMER-03', 'Suresh Raina', '9300000003', 'test.suresh@gmail.com', 1199.00, 800.00, 0.00, 60.00, 1199.00, 'COD', 'PENDING', 'Packed', 'standard', 'ST1-EXP-100003', 'BlueDart Express', NULL, NULL, NULL, NULL, NULL, 0, NULL, '{"address":"House 43, 8th Main, Indiranagar","city":"Bengaluru","state":"Karnataka","pincode":"560001","name":"Suresh Raina","mobile":"9300000003"}'::jsonb),
  ('STYLE1-ORD-000004', 'INV-2026-0004', 'TEST-CUSTOMER-04', 'Karan Johar', '9300000004', 'test.karan@gmail.com', 1799.00, 1200.00, 0.00, 90.00, 1799.00, 'ONLINE_RAZORPAY', 'PAID', 'Out for Delivery', 'standard', 'ST1-EXP-100004', 'Shadowfax Express', 'TEST-DELIVERY-01', 'Ravi Shankar', '9200000001', NOW(), NULL, 0, NULL, '{"address":"Bungalow 12, Bandra West","city":"Mumbai","state":"Maharashtra","pincode":"400050","name":"Karan Johar","mobile":"9300000004"}'::jsonb),
  ('STYLE1-ORD-000005', 'INV-2026-0005', 'TEST-CUSTOMER-05', 'Meera Nair', '9300000005', 'test.meera@gmail.com', 499.00, 300.00, 49.00, 25.00, 647.00, 'COD', 'PENDING', 'Try at Home Active', 'try_at_home', 'ST1-EXP-100005', 'Express Try Courier', 'TEST-DELIVERY-02', 'Amit Singh', '9200000002', NOW(), 'ACTIVE', 99.00, 30, '{"address":"D-14, Green Park Extension","city":"New Delhi","state":"Delhi","pincode":"110016","name":"Meera Nair","mobile":"9300000005"}'::jsonb),
  ('STYLE1-ORD-000006', 'INV-2026-0006', 'TEST-CUSTOMER-06', 'Aditya Roy', '9300000006', 'test.aditya@gmail.com', 1999.00, 1500.00, 0.00, 100.00, 1999.00, 'ONLINE_RAZORPAY', 'PAID', 'Delivered', 'standard', 'ST1-EXP-100006', 'BlueDart Express', 'TEST-DELIVERY-03', 'Vijay Kumar', '9200000003', NOW() - INTERVAL '2 days', NULL, 0, NULL, '{"address":"Flat 304, Palm Grove, Bellandur","city":"Bengaluru","state":"Karnataka","pincode":"560103","name":"Aditya Roy","mobile":"9300000006"}'::jsonb),
  ('STYLE1-ORD-000007', 'INV-2026-0007', 'TEST-CUSTOMER-07', 'Pooja Hegde', '9300000007', 'test.pooja@gmail.com', 3499.00, 2500.00, 0.00, 175.00, 3499.00, 'COD', 'PAID', 'Delivered', 'standard', 'ST1-EXP-100007', 'BlueDart Express', 'TEST-DELIVERY-04', 'Satish Chawla', '9200000004', NOW() - INTERVAL '3 days', NULL, 0, NULL, '{"address":"Villa 21, Jubilee Hills Road 36","city":"Hyderabad","state":"Telangana","pincode":"500081","name":"Pooja Hegde","mobile":"9300000007"}'::jsonb),
  ('STYLE1-ORD-000008', 'INV-2026-0008', 'TEST-CUSTOMER-08', 'Rahul Dravid', '9300000008', 'test.rahul@gmail.com', 1599.00, 900.00, 0.00, 80.00, 1599.00, 'COD', 'FAILED', 'Cancelled', 'standard', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, '{"address":"14/2, 5th Cross, Malleshwaram","city":"Bengaluru","state":"Karnataka","pincode":"560004","name":"Rahul Dravid","mobile":"9300000008"}'::jsonb),
  ('STYLE1-ORD-000009', 'INV-2026-0009', 'TEST-CUSTOMER-09', 'Sonia Gandhi', '9300000009', 'test.sonia@gmail.com', 899.00, 600.00, 0.00, 45.00, 998.00, 'COD', 'PENDING', 'Confirmed', 'try_at_home', 'ST1-EXP-100009', 'Express Try Courier', NULL, NULL, NULL, NULL, 'ACTIVE', 99.00, 30, '{"address":"10 Janpath","city":"New Delhi","state":"Delhi","pincode":"110011","name":"Sonia Gandhi","mobile":"9300000009"}'::jsonb),
  ('STYLE1-ORD-000010', 'INV-2026-0010', 'TEST-CUSTOMER-10', 'Arvind Kejriwal', '9300000010', 'test.arvind@gmail.com', 2999.00, 2000.00, 0.00, 150.00, 2999.00, 'ONLINE_RAZORPAY', 'PAID', 'Delivered', 'standard', 'ST1-EXP-100010', 'BlueDart Express', 'TEST-DELIVERY-08', 'Dilip Patel', '9200000008', NOW() - INTERVAL '5 days', NULL, 0, NULL, '{"address":"6 Flagstaff Road, Civil Lines","city":"New Delhi","state":"Delhi","pincode":"110054","name":"Arvind Kejriwal","mobile":"9300000010"}'::jsonb)
ON CONFLICT (order_id) DO UPDATE SET order_status = EXCLUDED.order_status, payment_status = EXCLUDED.payment_status;

-- 10. Seed Order Items
INSERT INTO order_items (id, order_id, product_id, product_name, brand, sku, quantity, price, mrp, size, color, image_url, item_status, shopkeeper_id, shopkeeper_name)
VALUES
  ('oi-seed-01', 'STYLE1-ORD-000001', 'prod-test-1', 'TEST-PRODUCT-01 Blue Jeans', 'Levis', 'TEST-SKU-01', 1, 1499.00, 2499.00, '32', 'Blue', 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&q=80', 'Confirmed', 'TEST-SHOPKEEPER-01', 'Arjun Sharma'),
  ('oi-seed-02', 'STYLE1-ORD-000002', 'prod-test-2', 'TEST-PRODUCT-02 Cotton Tee', 'Puma', 'TEST-SKU-02', 1, 599.00, 999.00, 'L', 'White', 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&q=80', 'Processing', 'TEST-SHOPKEEPER-02', 'Priya Patel'),
  ('oi-seed-03', 'STYLE1-ORD-000003', 'prod-test-3', 'TEST-PRODUCT-03 Oxford Shirt', 'Zodiac', 'TEST-SKU-03', 1, 1199.00, 1999.00, '40', 'White', 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400&q=80', 'Packed', 'TEST-SHOPKEEPER-03', 'Rajesh Khanna'),
  ('oi-seed-04', 'STYLE1-ORD-000004', 'prod-test-4', 'TEST-PRODUCT-04 Cotton Chinos', 'Dockers', 'TEST-SKU-04', 1, 1799.00, 2999.00, '32', 'Khaki', 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&q=80', 'Out for Delivery', 'TEST-SHOPKEEPER-04', 'Sanjay Dutt'),
  ('oi-seed-05', 'STYLE1-ORD-000005', 'prod-test-5', 'TEST-PRODUCT-05 Black Leggings', 'Lyra', 'TEST-SKU-05', 1, 499.00, 799.00, 'Free Size', 'Black', 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=400&q=80', 'Confirmed', 'TEST-SHOPKEEPER-05', 'Nisha Sen'),
  ('oi-seed-06', 'STYLE1-ORD-000006', 'prod-test-6', 'TEST-PRODUCT-06 Designer Kurti', 'Biba', 'TEST-SKU-06', 1, 1999.00, 3499.00, 'M', 'Pink', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400&q=80', 'Delivered', 'TEST-SHOPKEEPER-06', 'Vikas Gupta'),
  ('oi-seed-07', 'STYLE1-ORD-000007', 'prod-test-7', 'TEST-PRODUCT-07 Silk Saree', 'Kanjivaram', 'TEST-SKU-07', 1, 3499.00, 5999.00, 'Unstitched', 'Red', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&q=80', 'Delivered', 'TEST-SHOPKEEPER-07', 'Sneha Reddy'),
  ('oi-seed-08', 'STYLE1-ORD-000008', 'prod-test-8', 'TEST-PRODUCT-08 Jogger Pants', 'Nike', 'TEST-SKU-08', 1, 1599.00, 2499.00, 'M', 'Grey', 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=400&q=80', 'Cancelled', 'TEST-SHOPKEEPER-08', 'Gaurav Gill'),
  ('oi-seed-09', 'STYLE1-ORD-000009', 'prod-test-9', 'TEST-PRODUCT-09 Girls Frock', 'Utsa', 'TEST-SKU-09', 1, 899.00, 1499.00, '4-5Y', 'Pink', 'https://images.unsplash.com/photo-1621452773781-0f992fd1f5cb?w=400&q=80', 'Confirmed', 'TEST-SHOPKEEPER-09', 'Asha Bhosle'),
  ('oi-seed-10', 'STYLE1-ORD-000010', 'prod-test-10', 'TEST-PRODUCT-10 Winter Jacket', 'Wildcraft', 'TEST-SKU-10', 1, 2999.00, 4999.00, 'L', 'Black', 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=400&q=80', 'Delivered', 'TEST-SHOPKEEPER-10', 'Rohan Mehta')
ON CONFLICT (id) DO NOTHING;

-- 11. Seed Order Status Histories
INSERT INTO order_status_history (id, order_id, status, changed_by, notes)
VALUES
  ('sh-seed-01', 'STYLE1-ORD-000001', 'Confirmed', 'Customer', 'Customer placed order with Cash on Delivery.'),
  ('sh-seed-02', 'STYLE1-ORD-000002', 'Confirmed', 'Customer', 'Online payment verified via Razorpay.'),
  ('sh-seed-03', 'STYLE1-ORD-000002', 'Processing', 'Merchant Admin', 'Order verified and sent to merchant packing station.'),
  ('sh-seed-04', 'STYLE1-ORD-000003', 'Confirmed', 'Customer', 'Order verified.'),
  ('sh-seed-05', 'STYLE1-ORD-000003', 'Packed', 'Warehouse Lead', 'Items neatly packed in eco-friendly garment pouch.'),
  ('sh-seed-06', 'STYLE1-ORD-000004', 'Out for Delivery', 'Ravi Shankar (Delivery Boy)', 'Delivery partner on the way to customer doorstep.'),
  ('sh-seed-07', 'STYLE1-ORD-000005', 'Try at Home Active', 'Customer', 'Try at home 30-minute doorstep trial session scheduled.'),
  ('sh-seed-08', 'STYLE1-ORD-000006', 'Delivered', 'Vijay Kumar (Delivery Boy)', 'Delivered safely and OTP verified at doorstep.'),
  ('sh-seed-09', 'STYLE1-ORD-000007', 'Delivered', 'Satish Chawla (Delivery Boy)', 'Package handed over to recipient.'),
  ('sh-seed-10', 'STYLE1-ORD-000008', 'Cancelled', 'Customer', 'Customer cancelled order before dispatch.'),
  ('sh-seed-11', 'STYLE1-ORD-000009', 'Confirmed', 'Customer', 'Try at Home requested.'),
  ('sh-seed-12', 'STYLE1-ORD-000010', 'Delivered', 'Dilip Patel (Delivery Boy)', 'Delivered successfully.')
ON CONFLICT (id) DO NOTHING;

-- 12. Seed Master Admin User
INSERT INTO admin_users (id, name, email, mobile, role, is_active)
VALUES
  ('adm-master', 'TRYatHOME Admin', 'admin@tryathome.in', '9876543210', 'ADMIN', true)
ON CONFLICT (id) DO NOTHING;
