import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Product = Database['public']['Tables']['products']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];
type PizzaSize = Database['public']['Tables']['pizza_sizes']['Row'];
type ProductExtra = Database['public']['Tables']['product_extras']['Row'];
type Order = Database['public']['Tables']['orders']['Row'];
type OrderItem = Database['public']['Tables']['order_items']['Insert'];
type Coupon = Database['public']['Tables']['coupons']['Row'];
type Customer = Database['public']['Tables']['customers']['Row'];

export type { Product, Category, PizzaSize, ProductExtra, Order, OrderItem, Coupon, Customer };

export async function fetchCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');
  if (error) throw error;
  return data;
}

export async function fetchProducts(categoryId?: string) {
  let query = supabase.from('products').select('*').eq('is_active', true).order('sort_order');
  if (categoryId) query = query.eq('category_id', categoryId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function fetchPizzaSizes() {
  const { data, error } = await supabase.from('pizza_sizes').select('*').order('sort_order');
  if (error) throw error;
  return data;
}

export async function fetchProductExtras(pizzaOnly?: boolean) {
  let query = supabase.from('product_extras').select('*').eq('is_active', true);
  if (pizzaOnly) query = query.eq('applies_to_pizza', true);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function validateCoupon(code: string) {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .single();
  if (error || !data) return null;
  if (data.valid_until && new Date(data.valid_until) < new Date()) return null;
  if (data.max_uses && data.current_uses >= data.max_uses) return null;
  return data;
}

export async function createOrder(orderData: Database['public']['Tables']['orders']['Insert']) {
  const { data, error } = await supabase
    .from('orders')
    .insert(orderData)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createOrderItems(items: OrderItem[]) {
  const { error } = await supabase.from('order_items').insert(items);
  if (error) throw error;
}

export async function findOrCreateCustomer(customerData: {
  name: string; phone: string; address?: string;
  address_number?: string; neighborhood?: string;
  complement?: string; reference?: string;
}) {
  // Try to find existing
  const { data: existing } = await supabase
    .from('customers')
    .select('*')
    .eq('phone', customerData.phone)
    .maybeSingle();

  if (existing) return existing;

  const { data, error } = await supabase
    .from('customers')
    .insert(customerData)
    .select()
    .single();
  if (error) throw error;
  return data;
}

type OrderStatus = Database['public']['Enums']['order_status'];

export async function fetchOrders(status?: OrderStatus) {
  let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function fetchOrderItems(orderId: string) {
  const { data, error } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId);
  if (error) throw error;
  return data;
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const updateData: Record<string, unknown> = { status };
  if (status === 'delivering') updateData.dispatched_at = new Date().toISOString();
  if (status === 'done') updateData.delivered_at = new Date().toISOString();
  
  const { error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', orderId);
  if (error) throw error;
}

export async function fetchDashboardStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: orders } = await supabase
    .from('orders')
    .select('total, order_type, payment_method, delivery_fee, discount')
    .gte('created_at', today.toISOString());

  const totalOrders = orders?.length || 0;
  const totalRevenue = orders?.reduce((s, o) => s + Number(o.total), 0) || 0;
  const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const deliveryCount = orders?.filter(o => o.order_type === 'delivery').length || 0;

  return { totalOrders, totalRevenue, avgTicket, deliveryCount };
}

export function subscribeToOrders(callback: (payload: unknown) => void) {
  return supabase
    .channel('orders-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, callback)
    .subscribe();
}
