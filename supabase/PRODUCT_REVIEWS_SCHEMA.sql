-- ============================================================================
-- TRYatHOME PRODUCT REVIEWS & 5-STAR RATINGS SCHEMA
-- ============================================================================
-- Safe & idempotent script to create product_reviews table, indexes, RLS policies
-- and triggers.
-- ============================================================================

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

-- Indexes for lightning fast queries
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_customer_id ON product_reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_order_id ON product_reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON product_reviews(rating);

-- Auto-update updated_at trigger
DROP TRIGGER IF EXISTS update_product_reviews_updated_at ON product_reviews;
CREATE TRIGGER update_product_reviews_updated_at
BEFORE UPDATE ON product_reviews
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON product_reviews TO anon, authenticated, service_role;

-- Row Level Security
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All for Anon and Authenticated" ON product_reviews;
CREATE POLICY "Allow All for Anon and Authenticated" ON product_reviews 
  FOR ALL TO anon, authenticated, service_role 
  USING (true) WITH CHECK (true);
