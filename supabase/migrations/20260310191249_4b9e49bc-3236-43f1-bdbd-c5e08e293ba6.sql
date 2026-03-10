
-- Fix overly permissive policies by adding better constraints

-- Customers: anon can only insert, not update
DROP POLICY IF EXISTS "Public can insert customers" ON public.customers;
CREATE POLICY "Public can insert customers" ON public.customers FOR INSERT TO anon WITH CHECK (
  name IS NOT NULL AND phone IS NOT NULL AND length(name) > 0 AND length(phone) > 0
);

-- Customers: authenticated update restricted to staff roles
DROP POLICY IF EXISTS "Authenticated users can update customers" ON public.customers;
CREATE POLICY "Staff can update customers" ON public.customers FOR UPDATE TO authenticated USING (
  public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'attendant')
);

-- Customers: authenticated insert with validation
DROP POLICY IF EXISTS "Authenticated users can insert customers" ON public.customers;
CREATE POLICY "Staff can insert customers" ON public.customers FOR INSERT TO authenticated WITH CHECK (
  name IS NOT NULL AND phone IS NOT NULL AND length(name) > 0 AND length(phone) > 0
);

-- Orders: anon insert with validation
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
CREATE POLICY "Anon can create orders" ON public.orders FOR INSERT TO anon WITH CHECK (
  customer_name IS NOT NULL AND customer_phone IS NOT NULL AND total > 0
);

-- Orders: authenticated insert with validation
DROP POLICY IF EXISTS "Authenticated can create orders" ON public.orders;
CREATE POLICY "Auth can create orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (
  customer_name IS NOT NULL AND customer_phone IS NOT NULL AND total > 0
);

-- Orders: only staff can update
DROP POLICY IF EXISTS "Authenticated users can update orders" ON public.orders;
CREATE POLICY "Staff can update orders" ON public.orders FOR UPDATE TO authenticated USING (
  public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'attendant') OR public.has_role(auth.uid(), 'kitchen') OR public.has_role(auth.uid(), 'driver')
);

-- Order items: anon insert with validation
DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;
CREATE POLICY "Anon can create order items" ON public.order_items FOR INSERT TO anon WITH CHECK (
  product_name IS NOT NULL AND quantity > 0
);

-- Order items: auth insert with validation
DROP POLICY IF EXISTS "Authenticated can create order items" ON public.order_items;
CREATE POLICY "Auth can create order items" ON public.order_items FOR INSERT TO authenticated WITH CHECK (
  product_name IS NOT NULL AND quantity > 0
);
