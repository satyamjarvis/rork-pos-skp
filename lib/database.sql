-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create main categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('main', 'sub')) DEFAULT 'main',
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  image_url TEXT,
  image_path TEXT,
  category_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create addon categories table (hovedkategori for tilleggsvarer)
CREATE TABLE addon_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create addon variants table (varianter for tilleggsvarer med navn og pris)
CREATE TABLE addon_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  addon_category_id UUID REFERENCES addon_categories(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create product sizes table
CREATE TABLE product_sizes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  price_modifier DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  image_path TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  sub_category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  is_optional BOOLEAN DEFAULT FALSE,
  product_order INTEGER,
  sizes JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create product_sizes_junction table (mange-til-mange relasjon)
CREATE TABLE product_sizes_junction (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  size_id UUID REFERENCES product_sizes(id) ON DELETE CASCADE NOT NULL,
  custom_price DECIMAL(10, 2),
  UNIQUE(product_id, size_id)
);

-- Create product_addons_junction table (kobling mellom produkter og tilleggsvarer)
CREATE TABLE product_addons_junction (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  addon_category_id UUID REFERENCES addon_categories(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(product_id, addon_category_id)
);

-- Create orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  order_number SERIAL,
  customer_name TEXT NOT NULL,
  items JSONB NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  vat_amount DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'vipps', 'other')),
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions table removed per user request

-- Create business_settings table
CREATE TABLE business_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  business_name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT,
  org_number TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  vat_rate DECIMAL(5, 2) NOT NULL DEFAULT 25,
  logo_url TEXT,
  receipt_footer TEXT,
  product_columns INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create import_templates table (for å lagre importmaler)
CREATE TABLE import_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  template_structure JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE addon_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE addon_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_sizes_junction ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_addons_junction ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for categories
CREATE POLICY "Users can view own categories" ON categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own categories" ON categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories" ON categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories" ON categories
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for addon_categories
CREATE POLICY "Users can view own addon_categories" ON addon_categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own addon_categories" ON addon_categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own addon_categories" ON addon_categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own addon_categories" ON addon_categories
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for addon_variants
CREATE POLICY "Users can view own addon_variants" ON addon_variants
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own addon_variants" ON addon_variants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own addon_variants" ON addon_variants
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own addon_variants" ON addon_variants
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for products
CREATE POLICY "Users can view own products" ON products
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own products" ON products
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own products" ON products
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own products" ON products
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for product_sizes
CREATE POLICY "All users can view product_sizes" ON product_sizes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage product_sizes" ON product_sizes
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Create RLS policies for product_sizes_junction
CREATE POLICY "Users can manage own product sizes" ON product_sizes_junction
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM products 
      WHERE products.id = product_sizes_junction.product_id 
      AND products.user_id = auth.uid()
    )
  );

-- Create RLS policies for product_addons_junction
CREATE POLICY "Users can manage own product addons" ON product_addons_junction
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM products 
      WHERE products.id = product_addons_junction.product_id 
      AND products.user_id = auth.uid()
    )
  );

-- Create RLS policies for orders
CREATE POLICY "Users can manage own orders" ON orders
  FOR ALL USING (auth.uid() = user_id);



-- Create RLS policies for business_settings
CREATE POLICY "Users can manage own business_settings" ON business_settings
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for import_templates
CREATE POLICY "Users can manage own import_templates" ON import_templates
  FOR ALL USING (auth.uid() = user_id);

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $
BEGIN
  INSERT INTO public.profiles (id, full_name, company_name)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Brukernavn'),
    COALESCE(NEW.raw_user_meta_data->>'company_name', 'Bedriftsnavn')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_order ON categories(category_order);
CREATE INDEX idx_products_user_id ON products(user_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_sub_category_id ON products(sub_category_id);
CREATE INDEX idx_products_product_order ON products(product_order);
CREATE INDEX idx_addon_variants_addon_category_id ON addon_variants(addon_category_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);


-- Create storage bucket for product images and business logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('business-logos', 'business-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for product images
CREATE POLICY "Users can upload own product images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'product-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view product images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Users can update own product images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'product-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own product images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'product-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for business logos
CREATE POLICY "Users can upload own business logo" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'business-logos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view business logos" ON storage.objects
  FOR SELECT USING (bucket_id = 'business-logos');

CREATE POLICY "Users can update own business logo" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'business-logos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own business logo" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'business-logos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create view for product with all relationships (for easier querying)
CREATE OR REPLACE VIEW products_full AS
SELECT 
  p.*,
  c.name as category_name,
  sc.name as sub_category_name,
  COALESCE(
    json_agg(
      DISTINCT jsonb_build_object(
        'id', ps.id,
        'name', ps.name,
        'price_modifier', ps.price_modifier,
        'custom_price', psj.custom_price
      )
    ) FILTER (WHERE ps.id IS NOT NULL),
    '[]'::json
  ) as sizes,
  COALESCE(
    json_agg(
      DISTINCT jsonb_build_object(
        'id', ac.id,
        'name', ac.name,
        'variants', (
          SELECT json_agg(
            jsonb_build_object(
              'id', av.id,
              'name', av.name,
              'price', av.price
            )
          )
          FROM addon_variants av
          WHERE av.addon_category_id = ac.id
        )
      )
    ) FILTER (WHERE ac.id IS NOT NULL),
    '[]'::json
  ) as addons
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN categories sc ON p.sub_category_id = sc.id
LEFT JOIN product_sizes_junction psj ON p.id = psj.product_id
LEFT JOIN product_sizes ps ON psj.size_id = ps.id
LEFT JOIN product_addons_junction paj ON p.id = paj.product_id
LEFT JOIN addon_categories ac ON paj.addon_category_id = ac.id
GROUP BY p.id, c.name, sc.name;

-- Grant access to the view
GRANT SELECT ON products_full TO authenticated;