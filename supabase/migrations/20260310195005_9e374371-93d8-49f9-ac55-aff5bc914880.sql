
-- Function to update customer stats when an order is completed
CREATE OR REPLACE FUNCTION public.update_customer_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- When order status changes to 'done', update customer stats
  IF NEW.status = 'done' AND OLD.status != 'done' AND NEW.customer_id IS NOT NULL THEN
    UPDATE public.customers
    SET 
      total_orders = total_orders + 1,
      total_spent = total_spent + NEW.total,
      loyalty_points = loyalty_points + FLOOR(NEW.total),
      updated_at = now()
    WHERE id = NEW.customer_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger on orders table for loyalty points
CREATE TRIGGER on_order_done
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_customer_stats();

-- Insert default establishment settings if none exist
INSERT INTO public.establishment_settings (name)
SELECT 'Pizza Express'
WHERE NOT EXISTS (SELECT 1 FROM public.establishment_settings);
