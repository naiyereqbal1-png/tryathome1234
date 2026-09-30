-- 1. Drop foreign key constraints that depend on UUID columns
ALTER TABLE product_returns DROP CONSTRAINT IF EXISTS product_returns_order_item_id_fkey;

-- 2. Alter 'customers' table 'id' to TEXT
ALTER TABLE customers ALTER COLUMN id DROP DEFAULT;
ALTER TABLE customers ALTER COLUMN id TYPE TEXT USING id::text;
ALTER TABLE customers ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

-- 3. Alter 'customer_addresses' table 'id' to TEXT
ALTER TABLE customer_addresses ALTER COLUMN id TYPE TEXT USING id::text;

-- 4. Alter 'shopkeepers' table 'id' to TEXT
ALTER TABLE shopkeepers ALTER COLUMN id DROP DEFAULT;
ALTER TABLE shopkeepers ALTER COLUMN id TYPE TEXT USING id::text;
ALTER TABLE shopkeepers ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

-- 5. Alter 'delivery_boys' table 'id' to TEXT
ALTER TABLE delivery_boys ALTER COLUMN id DROP DEFAULT;
ALTER TABLE delivery_boys ALTER COLUMN id TYPE TEXT USING id::text;
ALTER TABLE delivery_boys ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

-- 6. Alter 'orders' table 'id' to TEXT
ALTER TABLE orders ALTER COLUMN id DROP DEFAULT;
ALTER TABLE orders ALTER COLUMN id TYPE TEXT USING id::text;
ALTER TABLE orders ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

-- 7. Alter 'order_items' table 'id' to TEXT
ALTER TABLE order_items ALTER COLUMN id DROP DEFAULT;
ALTER TABLE order_items ALTER COLUMN id TYPE TEXT USING id::text;
ALTER TABLE order_items ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

-- 8. Alter 'order_status_history' table 'id' to TEXT
ALTER TABLE order_status_history ALTER COLUMN id DROP DEFAULT;
ALTER TABLE order_status_history ALTER COLUMN id TYPE TEXT USING id::text;
ALTER TABLE order_status_history ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

-- 9. Alter 'product_returns' table 'order_item_id' to TEXT
ALTER TABLE product_returns ALTER COLUMN order_item_id TYPE TEXT USING order_item_id::text;

-- 10. Re-enable foreign key constraints with TEXT type compatibility
ALTER TABLE product_returns ADD CONSTRAINT product_returns_order_item_id_fkey 
  FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE;

-- 11. Seed 10 Shopkeepers (TEST-SHOPKEEPER-01 to TEST-SHOPKEEPER-10)
INSERT INTO shopkeepers (id, shopkeeper_id, name, store_name, mobile, email, city, status, permissions, total_products, live_products, current_stock)
VALUES
  ('shop-test-1', 'TEST-SHOPKEEPER-01', 'Arjun Sharma', 'TEST Ethnic India Trends', '9100000001', 'test.arjun@tryathome.in', 'New Delhi', 'ACTIVE', '{"can_view_dashboard":true,"can_add_product":true,"can_edit_product":true,"can_delete_product":false,"can_manage_inventory":true,"can_view_orders":true,"can_process_orders":true}'::jsonb, 1, 1, 120),
  ('shop-test-2', 'TEST-SHOPKEEPER-02', 'Priya Patel', 'TEST Zara Premium Casuals', '9100000002', 'test.priya@tryathome.in', 'Mumbai', 'ACTIVE', '{"can_view_dashboard":true,"can_add_product":true,"can_edit_product":true,"can_delete_product":false,"can_manage_inventory":true,"can_view_orders":true,"can_process_orders":true}'::jsonb, 1, 1, 95),
  ('shop-test-3', 'TEST-SHOPKEEPER-03', 'Rajesh Khanna', 'TEST Western Style Hub', '9100000003', 'test.rajesh@tryathome.in', 'Bengaluru', 'ACTIVE', '{"can_view_dashboard":true,"can_add_product":true,"can_edit_product":true,"can_delete_product":false,"can_manage_inventory":true,"can_view_orders":true,"can_process_orders":true}'::jsonb, 1, 1, 150),
  ('shop-test-4', 'TEST-SHOPKEEPER-04', 'Sanjay Dutt', 'TEST Denim World', '9100000004', 'test.sanjay@tryathome.in', 'New Delhi', 'ACTIVE', '{"can_view_dashboard":true,"can_add_product":true,"can_edit_product":true,"can_delete_product":false,"can_manage_inventory":true,"can_view_orders":true,"can_process_orders":true}'::jsonb, 1, 1, 110),
  ('shop-test-5', 'TEST-SHOPKEEPER-05', 'Nisha Sen', 'TEST Kurti & Lehenga Palace', '9100000005', 'test.nisha@tryathome.in', 'Kolkata', 'ACTIVE', '{"can_view_dashboard":true,"can_add_product":true,"can_edit_product":true,"can_delete_product":false,"can_manage_inventory":true,"can_view_orders":true,"can_process_orders":true}'::jsonb, 1, 1, 130),
  ('shop-test-6', 'TEST-SHOPKEEPER-06', 'Vikas Gupta', 'TEST T-Shirt Point', '9100000006', 'test.vikas@tryathome.in', 'Ahmedabad', 'ACTIVE', '{"can_view_dashboard":true,"can_add_product":true,"can_edit_product":true,"can_delete_product":false,"can_manage_inventory":true,"can_view_orders":true,"can_process_orders":true}'::jsonb, 1, 1, 180),
  ('shop-test-7', 'TEST-SHOPKEEPER-07', 'Sneha Reddy', 'TEST Premium Sarees', '9100000007', 'test.sneha@tryathome.in', 'Hyderabad', 'ACTIVE', '{"can_view_dashboard":true,"can_add_product":true,"can_edit_product":true,"can_delete_product":false,"can_manage_inventory":true,"can_view_orders":true,"can_process_orders":true}'::jsonb, 1, 1, 75),
  ('shop-test-8', 'TEST-SHOPKEEPER-08', 'Gaurav Gill', 'TEST Sports Activewear', '9100000008', 'test.gaurav@tryathome.in', 'Chandigarh', 'ACTIVE', '{"can_view_dashboard":true,"can_add_product":true,"can_edit_product":true,"can_delete_product":false,"can_manage_inventory":true,"can_view_orders":true,"can_process_orders":true}'::jsonb, 1, 1, 90),
  ('shop-test-9', 'TEST-SHOPKEEPER-09', 'Asha Bhosle', 'TEST Kids Fashion House', '9100000009', 'test.asha@tryathome.in', 'Pune', 'ACTIVE', '{"can_view_dashboard":true,"can_add_product":true,"can_edit_product":true,"can_delete_product":false,"can_manage_inventory":true,"can_view_orders":true,"can_process_orders":true}'::jsonb, 1, 1, 220),
  ('shop-test-10', 'TEST-SHOPKEEPER-10', 'Rohan Mehta', 'TEST Winter Wear Boutique', '9100000010', 'test.rohan@tryathome.in', 'New Delhi', 'ACTIVE', '{"can_view_dashboard":true,"can_add_product":true,"can_edit_product":true,"can_delete_product":false,"can_manage_inventory":true,"can_view_orders":true,"can_process_orders":true}'::jsonb, 1, 1, 140)
ON CONFLICT (shopkeeper_id) DO UPDATE SET name = EXCLUDED.name, store_name = EXCLUDED.store_name, status = EXCLUDED.status;

-- 12. Seed 10 Delivery Partners (TEST-DELIVERY-01 to TEST-DELIVERY-10)
INSERT INTO delivery_boys (id, delivery_boy_id, name, mobile, vehicle_type, vehicle_number, city, status, assigned_area, total_delivered, rating)
VALUES
  ('dboy-test-1', 'TEST-DELIVERY-01', 'Ravi Shankar', '9200000001', 'Motorcycle', 'DL-3C-XX-1122', 'New Delhi', 'ACTIVE', 'Connaught Place & Karol Bagh', 45, 4.9),
  ('dboy-test-2', 'TEST-DELIVERY-02', 'Amit Singh', '9200000002', 'Scooter', 'MH-01-YY-3344', 'Mumbai', 'ACTIVE', 'Bandra & Andheri West', 32, 4.8),
  ('dboy-test-3', 'TEST-DELIVERY-03', 'Vijay Kumar', '9200000003', 'Motorcycle', 'KA-03-ZZ-5566', 'Bengaluru', 'ACTIVE', 'Indiranagar & Koramangala', 54, 4.9),
  ('dboy-test-4', 'TEST-DELIVERY-04', 'Satish Chawla', '9200000004', 'Motorcycle', 'DL-4S-AA-4433', 'New Delhi', 'ACTIVE', 'Dwarka & Janakpuri', 15, 4.7),
  ('dboy-test-5', 'TEST-DELIVERY-05', 'Manpreet Singh', '9200000005', 'Motorcycle', 'PB-02-QQ-5544', 'Chandigarh', 'ACTIVE', 'Sector 17 & 35', 28, 4.8),
  ('dboy-test-6', 'TEST-DELIVERY-06', 'Sanjay Kumar', '9200000006', 'Scooter', 'GJ-01-RR-8877', 'Ahmedabad', 'ACTIVE', 'Satellite & Vastrapur', 19, 4.6),
  ('dboy-test-7', 'TEST-DELIVERY-07', 'Kiran Kumar', '9200000007', 'Motorcycle', 'AP-09-UU-9988', 'Hyderabad', 'ACTIVE', 'Gachibowli & Madhapur', 37, 4.9),
  ('dboy-test-8', 'TEST-DELIVERY-08', 'Dilip Patel', '9200000008', 'Scooter', 'MH-02-LL-2211', 'Mumbai', 'ACTIVE', 'Borivali & Malad', 41, 4.8),
  ('dboy-test-9', 'TEST-DELIVERY-09', 'Abhishek Roy', '9200000009', 'Motorcycle', 'WB-01-EE-3322', 'Kolkata', 'ACTIVE', 'Salt Lake & New Town', 22, 4.7),
  ('dboy-test-10', 'TEST-DELIVERY-10', 'Pradeep Joshi', '9200000010', 'Scooter', 'MH-12-FF-7766', 'Pune', 'ACTIVE', 'Kothrud & Deccan', 29, 4.8)
ON CONFLICT (delivery_boy_id) DO UPDATE SET name = EXCLUDED.name, status = EXCLUDED.status;

-- 13. Seed 10 Customers (TEST-CUSTOMER-01 to TEST-CUSTOMER-10)
INSERT INTO customers (id, customer_id, name, mobile, email, status, total_orders, total_spent)
VALUES
  ('cust-test-1', 'TEST-CUSTOMER-01', 'Anjali Gupta', '9300000001', 'test.anjali@gmail.com', 'ACTIVE', 2, 4500.00),
  ('cust-test-2', 'TEST-CUSTOMER-02', 'Vikram Aditya', '9300000002', 'test.vikram@gmail.com', 'ACTIVE', 1, 1800.00),
  ('cust-test-3', 'TEST-CUSTOMER-03', 'Suresh Raina', '9300000003', 'test.suresh@gmail.com', 'ACTIVE', 4, 12500.00),
  ('cust-test-4', 'TEST-CUSTOMER-04', 'Karan Johar', '9300000004', 'test.karan@gmail.com', 'ACTIVE', 0, 0.00),
  ('cust-test-5', 'TEST-CUSTOMER-05', 'Meera Nair', '9300000005', 'test.meera@gmail.com', 'ACTIVE', 3, 6200.00),
  ('cust-test-6', 'TEST-CUSTOMER-06', 'Aditya Roy', '9300000006', 'test.aditya@gmail.com', 'ACTIVE', 1, 950.00),
  ('cust-test-7', 'TEST-CUSTOMER-07', 'Pooja Hegde', '9300000007', 'test.pooja@gmail.com', 'ACTIVE', 5, 14200.00),
  ('cust-test-8', 'TEST-CUSTOMER-08', 'Rahul Dravid', '9300000008', 'test.rahul@gmail.com', 'ACTIVE', 2, 3800.00),
  ('cust-test-9', 'TEST-CUSTOMER-09', 'Sonia Gandhi', '9300000009', 'test.sonia@gmail.com', 'ACTIVE', 0, 0.00),
  ('cust-test-10', 'TEST-CUSTOMER-10', 'Arvind Kejriwal', '9300000010', 'test.arvind@gmail.com', 'ACTIVE', 1, 1500.00)
ON CONFLICT (customer_id) DO UPDATE SET name = EXCLUDED.name, mobile = EXCLUDED.mobile, status = EXCLUDED.status;

-- Seed Customer Addresses for testing
INSERT INTO customer_addresses (id, customer_id, name, mobile, pincode, address, locality, city, state, address_type, is_default)
VALUES
  ('addr-test-1', 'TEST-CUSTOMER-01', 'Anjali Gupta', '9300000001', '110001', 'Flat No. 402, Block B, Preet Vihar', 'East Delhi', 'New Delhi', 'Delhi', 'HOME', true),
  ('addr-test-2', 'TEST-CUSTOMER-02', 'Vikram Aditya', '9300000002', '400001', 'P.O. Box 102, Nariman Point', 'South Mumbai', 'Mumbai', 'Maharashtra', 'WORK', true),
  ('addr-test-3', 'TEST-CUSTOMER-03', 'Suresh Raina', '9300000003', '560001', 'House 43, 8th Main, Indiranagar', 'East Bengaluru', 'Bengaluru', 'Karnataka', 'HOME', true)
ON CONFLICT DO NOTHING;

-- 14. Seed 10 Products (TEST-PRODUCT-01 to TEST-PRODUCT-10)
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

-- 15. Ensure store_settings contains configurable SMS and Twilio provider columns
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS sms_provider TEXT DEFAULT 'demo';
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS sms_api_key TEXT DEFAULT 'DEMO_KEY_TRYATHOME_SMS_2026';
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS sms_sender_id TEXT DEFAULT 'TRYHOM';
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS twilio_account_sid TEXT DEFAULT 'AC_DEMO_TWILIO_ACCOUNT_SID_SUBABASE';
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS twilio_auth_token TEXT DEFAULT 'AUTH_DEMO_TWILIO_SECRET_TOKEN';
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS twilio_from_phone TEXT DEFAULT '+18005550199';

-- Update the primary row with demo defaults if not set
UPDATE store_settings
SET 
  sms_provider = COALESCE(sms_provider, 'demo'),
  sms_api_key = COALESCE(sms_api_key, 'DEMO_KEY_TRYATHOME_SMS_2026'),
  sms_sender_id = COALESCE(sms_sender_id, 'TRYHOM'),
  twilio_account_sid = COALESCE(twilio_account_sid, 'AC_DEMO_TWILIO_ACCOUNT_SID_SUBABASE'),
  twilio_auth_token = COALESCE(twilio_auth_token, 'AUTH_DEMO_TWILIO_SECRET_TOKEN'),
  twilio_from_phone = COALESCE(twilio_from_phone, '+18005550199')
WHERE id = 1;

