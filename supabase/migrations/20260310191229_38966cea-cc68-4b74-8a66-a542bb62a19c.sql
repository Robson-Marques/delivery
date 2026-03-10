
-- ========================================
-- ENUM TYPES
-- ========================================
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'attendant', 'kitchen', 'driver');
CREATE TYPE public.order_status AS ENUM ('pending', 'accepted', 'preparing', 'ready', 'delivering', 'done', 'cancelled');
CREATE TYPE public.order_type AS ENUM ('delivery', 'pickup', 'dine_in');
CREATE TYPE public.payment_method AS ENUM ('pix', 'cash', 'card', 'online');
CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'refunded');
CREATE TYPE public.discount_type AS ENUM ('fixed', 'percentage');

-- ========================================
-- TIMESTAMP TRIGGER FUNCTION
-- ========================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ========================================
-- PROFILES TABLE
-- ========================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- USER ROLES TABLE
-- ========================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin'
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.is_admin(auth.uid()));

-- ========================================
-- CATEGORIES TABLE
-- ========================================
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active categories" ON public.categories FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL USING (public.is_admin(auth.uid()));

-- ========================================
-- PRODUCTS TABLE
-- ========================================
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  promo_price NUMERIC(10,2),
  image_url TEXT,
  prep_time_min INT NOT NULL DEFAULT 15,
  is_pizza BOOLEAN NOT NULL DEFAULT false,
  allow_two_flavors BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active products" ON public.products FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage products" ON public.products FOR ALL USING (public.is_admin(auth.uid()));

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========================================
-- PIZZA SIZES TABLE
-- ========================================
CREATE TABLE public.pizza_sizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  label TEXT NOT NULL,
  slices INT NOT NULL,
  price_multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.0,
  sort_order INT NOT NULL DEFAULT 0
);
ALTER TABLE public.pizza_sizes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view pizza sizes" ON public.pizza_sizes FOR SELECT USING (true);
CREATE POLICY "Admins can manage pizza sizes" ON public.pizza_sizes FOR ALL USING (public.is_admin(auth.uid()));

-- ========================================
-- PRODUCT EXTRAS TABLE
-- ========================================
CREATE TABLE public.product_extras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  applies_to_pizza BOOLEAN NOT NULL DEFAULT false
);
ALTER TABLE public.product_extras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active extras" ON public.product_extras FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage extras" ON public.product_extras FOR ALL USING (public.is_admin(auth.uid()));

-- ========================================
-- CUSTOMERS TABLE
-- ========================================
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  address_number TEXT,
  neighborhood TEXT,
  complement TEXT,
  reference TEXT,
  total_spent NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_orders INT NOT NULL DEFAULT 0,
  loyalty_points INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view customers" ON public.customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert customers" ON public.customers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update customers" ON public.customers FOR UPDATE TO authenticated USING (true);
-- Public can also insert (for self-service orders)
CREATE POLICY "Public can insert customers" ON public.customers FOR INSERT TO anon WITH CHECK (true);

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========================================
-- NEIGHBORHOODS TABLE (delivery fees)
-- ========================================
CREATE TABLE public.neighborhoods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 5.99,
  is_active BOOLEAN NOT NULL DEFAULT true
);
ALTER TABLE public.neighborhoods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view neighborhoods" ON public.neighborhoods FOR SELECT USING (true);
CREATE POLICY "Admins can manage neighborhoods" ON public.neighborhoods FOR ALL USING (public.is_admin(auth.uid()));

-- ========================================
-- ORDERS TABLE
-- ========================================
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number SERIAL,
  customer_id UUID REFERENCES public.customers(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  delivery_address TEXT,
  delivery_number TEXT,
  delivery_neighborhood TEXT,
  delivery_complement TEXT,
  delivery_reference TEXT,
  order_type order_type NOT NULL DEFAULT 'delivery',
  payment_method payment_method NOT NULL DEFAULT 'pix',
  payment_status payment_status NOT NULL DEFAULT 'pending',
  change_for NUMERIC(10,2),
  status order_status NOT NULL DEFAULT 'pending',
  subtotal NUMERIC(10,2) NOT NULL,
  delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL,
  observations TEXT,
  coupon_code TEXT,
  driver_id UUID,
  dispatched_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view orders" ON public.orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can create orders" ON public.orders FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Authenticated can create orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update orders" ON public.orders FOR UPDATE TO authenticated USING (true);

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created ON public.orders(created_at DESC);

-- ========================================
-- ORDER ITEMS TABLE
-- ========================================
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL,
  size TEXT,
  second_flavor_id UUID REFERENCES public.products(id),
  second_flavor_name TEXT,
  extras JSONB DEFAULT '[]',
  observations TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view order items" ON public.order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can create order items" ON public.order_items FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Authenticated can create order items" ON public.order_items FOR INSERT TO authenticated WITH CHECK (true);

-- ========================================
-- DELIVERY DRIVERS TABLE
-- ========================================
CREATE TABLE public.delivery_drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.delivery_drivers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view drivers" ON public.delivery_drivers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage drivers" ON public.delivery_drivers FOR ALL USING (public.is_admin(auth.uid()));

-- ========================================
-- COUPONS TABLE
-- ========================================
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_type discount_type NOT NULL DEFAULT 'percentage',
  discount_value NUMERIC(10,2) NOT NULL,
  min_order_value NUMERIC(10,2) DEFAULT 0,
  max_uses INT,
  current_uses INT NOT NULL DEFAULT 0,
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active coupons" ON public.coupons FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage coupons" ON public.coupons FOR ALL USING (public.is_admin(auth.uid()));

-- ========================================
-- ESTABLISHMENT SETTINGS TABLE
-- ========================================
CREATE TABLE public.establishment_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Pizza Express',
  logo_url TEXT,
  phone TEXT,
  cnpj TEXT,
  address TEXT,
  opening_hours JSONB DEFAULT '{"mon":{"open":"18:00","close":"23:00"},"tue":{"open":"18:00","close":"23:00"},"wed":{"open":"18:00","close":"23:00"},"thu":{"open":"18:00","close":"23:00"},"fri":{"open":"18:00","close":"23:00"},"sat":{"open":"18:00","close":"23:30"},"sun":{"open":"18:00","close":"23:00"}}',
  default_delivery_fee NUMERIC(10,2) DEFAULT 5.99,
  allow_scheduling BOOLEAN DEFAULT false,
  is_open BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.establishment_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view settings" ON public.establishment_settings FOR SELECT USING (true);
CREATE POLICY "Admins can update settings" ON public.establishment_settings FOR UPDATE USING (public.is_admin(auth.uid()));

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.establishment_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========================================
-- SEED DATA
-- ========================================

-- Insert default settings
INSERT INTO public.establishment_settings (name, phone) VALUES ('Pizza Express', '(11) 99999-9999');

-- Insert default categories
INSERT INTO public.categories (name, icon, sort_order) VALUES
  ('Pizzas', '🍕', 1),
  ('Lanches', '🍔', 2),
  ('Porções', '🍟', 3),
  ('Bebidas', '🥤', 4),
  ('Promoções', '🔥', 5);

-- Insert pizza sizes
INSERT INTO public.pizza_sizes (name, label, slices, price_multiplier, sort_order) VALUES
  ('pequena', 'Pequena', 4, 0.60, 1),
  ('media', 'Média', 6, 0.80, 2),
  ('grande', 'Grande', 8, 1.00, 3),
  ('gigante', 'Gigante', 12, 1.30, 4);

-- Insert extras
INSERT INTO public.product_extras (name, price, applies_to_pizza) VALUES
  ('Borda Catupiry', 8.00, true),
  ('Borda Cheddar', 8.00, true),
  ('Borda Chocolate', 10.00, true),
  ('Extra Queijo', 5.00, true),
  ('Extra Bacon', 6.00, true);

-- Insert default neighborhoods
INSERT INTO public.neighborhoods (name, delivery_fee) VALUES
  ('Centro', 5.99),
  ('Jardim América', 7.99),
  ('Vila Nova', 6.99),
  ('Santa Cruz', 8.99),
  ('Bela Vista', 6.49);

-- Insert sample coupons
INSERT INTO public.coupons (code, discount_type, discount_value, min_order_value) VALUES
  ('PRIMEIRACOMPRA', 'percentage', 10, 30),
  ('PIZZA10', 'fixed', 10, 40),
  ('FRETEGRATIS', 'fixed', 5.99, 50);
