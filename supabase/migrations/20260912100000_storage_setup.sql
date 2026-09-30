-- Create a public bucket for product images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they already exist to avoid errors during replay
DROP POLICY IF EXISTS "Allow Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Allow Public Insert" ON storage.objects;
DROP POLICY IF EXISTS "Allow Public Update" ON storage.objects;
DROP POLICY IF EXISTS "Allow Public Delete" ON storage.objects;

-- 1. Enable Public Read Access on 'product-images' bucket
CREATE POLICY "Allow Public Access" ON storage.objects
  FOR SELECT 
  USING (bucket_id = 'product-images');

-- 2. Enable Public Insert (Upload) Access on 'product-images' bucket
CREATE POLICY "Allow Public Insert" ON storage.objects
  FOR INSERT 
  WITH CHECK (bucket_id = 'product-images');

-- 3. Enable Public Update Access on 'product-images' bucket
CREATE POLICY "Allow Public Update" ON storage.objects
  FOR UPDATE 
  WITH CHECK (bucket_id = 'product-images');

-- 4. Enable Public Delete Access on 'product-images' bucket
CREATE POLICY "Allow Public Delete" ON storage.objects
  FOR DELETE 
  USING (bucket_id = 'product-images');
