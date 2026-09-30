-- Create the schema for the TRYatHOME E-Commerce Application

-- Enable necessary PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create a common function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. STORE SETTINGS TABLE
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
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_store_settings_updated_at
BEFORE UPDATE ON store_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY, -- Supports text-based unique identifiers like local db e.g., 'cat-1'
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

CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id TEXT NOT NULL UNIQUE, -- e.g., 'STYLE1-CUST-000001'
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

CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON customers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. CUSTOMER ADDRESSES TABLE
CREATE TABLE IF NOT EXISTS customer_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- 5. SHOPKEEPERS (VENDORS) TABLE
CREATE TABLE IF NOT EXISTS shopkeepers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shopkeeper_id TEXT NOT NULL UNIQUE, -- e.g., 'STYLE1-SHOP-000001'
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

-- 6. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY, -- Supports text-based unique identifiers e.g. 'prod-1'
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

CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. PRODUCT IMAGES TABLE
CREATE TABLE IF NOT EXISTS product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    sort_order INT DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    caption TEXT
);

-- 8. PRODUCT VARIANTS TABLE
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    size TEXT NOT NULL,
    color TEXT NOT NULL,
    sku TEXT NOT NULL,
    stock INT DEFAULT 0,
    price NUMERIC(10, 2) NOT NULL,
    mrp NUMERIC(10, 2) NOT NULL
);

-- 9. DELIVERY BOYS TABLE
CREATE TABLE IF NOT EXISTS delivery_boys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_boy_id TEXT NOT NULL UNIQUE, -- e.g., 'STYLE1-DBOY-000001'
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

-- 10. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT NOT NULL UNIQUE, -- e.g., 'STYLE1-ORD-000001'
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 11. ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- 12. ORDER STATUS HISTORY TABLE
CREATE TABLE IF NOT EXISTS order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    changed_by TEXT NOT NULL,
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT
);

-- 13. PRODUCT RETURNS TABLE
CREATE TABLE IF NOT EXISTS product_returns (
    return_id TEXT PRIMARY KEY, -- e.g., 'RET-STYLE1-000001'
    order_id TEXT NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE,
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

-- 14. STOCK TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS stock_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id TEXT NOT NULL UNIQUE, -- e.g., 'STX-STYLE1-000001'
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

-- 15. WISHLIST ITEMS TABLE
CREATE TABLE IF NOT EXISTS wishlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id TEXT NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(customer_id, product_id)
);

-- 16. ADMIN USERS TABLE
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email_or_mobile TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'inventory_manager')),
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    avatar TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------
-- DATABASE INDEXES FOR OPTIMAL E-COMMERCE PERFORMANCE
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

-- -----------------------------------------------------
-- SEED INITIAL DATA
-- -----------------------------------------------------

-- Insert Default Store Settings
INSERT INTO store_settings (id, store_name, store_tagline)
VALUES (1, 'TRYatHOME', 'India’s Modern Garment & Fashion Destination • Try at Home')
ON CONFLICT (id) DO NOTHING;

-- Insert Initial Categories (Matches demoData INITIAL_CATEGORIES)
INSERT INTO categories (id, name, slug, status, sort_order)
VALUES 
('cat-1', 'Men Fashion', 'men-fashion', 'ACTIVE', 1),
('cat-2', 'Women Fashion', 'women-fashion', 'ACTIVE', 2),
('cat-3', 'Kids Wear', 'kids-wear', 'ACTIVE', 3),
('cat-4', 'Footwear', 'footwear', 'ACTIVE', 4),
('cat-5', 'Accessories', 'accessories', 'ACTIVE', 5)
ON CONFLICT (id) DO NOTHING;
