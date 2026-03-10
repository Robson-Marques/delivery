import React, { createContext, useContext, useState, useCallback } from 'react';
import { validateCoupon } from '@/lib/api';
import { toast } from 'sonner';

export interface CartExtra {
  id: string;
  name: string;
  price: number;
}

export interface CartItemData {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  size?: string;
  secondFlavorId?: string;
  secondFlavorName?: string;
  extras: CartExtra[];
  observations: string;
  unitPrice: number;
}

interface CouponData {
  code: string;
  discountType: 'fixed' | 'percentage';
  discountValue: number;
}

interface CartContextType {
  items: CartItemData[];
  addItem: (item: CartItemData) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateObservations: (id: string, observations: string) => void;
  clearCart: () => void;
  coupon: CouponData | null;
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => void;
  loyaltyDiscount: number;
  loyaltyPointsUsed: number;
  applyLoyaltyPoints: (points: number) => void;
  removeLoyaltyPoints: () => void;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItemData[]>([]);
  const [coupon, setCoupon] = useState<CouponData | null>(null);
  const [loyaltyPointsUsed, setLoyaltyPointsUsed] = useState(0);
  const deliveryFee = 5.99;

  const addItem = useCallback((item: CartItemData) => {
    setItems(prev => [...prev, { ...item, id: `${item.productId}-${Date.now()}` }]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(prev => prev.filter(i => i.id !== id));
      return;
    }
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity } : i));
  }, []);

  const updateObservations = useCallback((id: string, observations: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, observations } : i));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setCoupon(null);
    setLoyaltyPointsUsed(0);
  }, []);

  const applyCoupon = useCallback(async (code: string): Promise<boolean> => {
    const result = await validateCoupon(code);
    if (!result) {
      toast.error('Cupom inválido ou expirado');
      return false;
    }
    setCoupon({
      code: result.code,
      discountType: result.discount_type,
      discountValue: Number(result.discount_value),
    });
    toast.success(`Cupom ${result.code} aplicado!`);
    return true;
  }, []);

  const removeCoupon = useCallback(() => setCoupon(null), []);

  // 10 points = R$ 1.00 discount
  const applyLoyaltyPoints = useCallback((points: number) => {
    setLoyaltyPointsUsed(points);
    toast.success(`${points} pontos aplicados!`);
  }, []);

  const removeLoyaltyPoints = useCallback(() => {
    setLoyaltyPointsUsed(0);
  }, []);

  const loyaltyDiscount = loyaltyPointsUsed / 10;

  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  const couponDiscount = coupon
    ? coupon.discountType === 'percentage'
      ? subtotal * (coupon.discountValue / 100)
      : coupon.discountValue
    : 0;

  const discount = couponDiscount + loyaltyDiscount;
  const total = Math.max(0, subtotal - discount + deliveryFee);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      items, addItem, removeItem, updateQuantity, updateObservations,
      clearCart, coupon, applyCoupon, removeCoupon,
      loyaltyDiscount, loyaltyPointsUsed, applyLoyaltyPoints, removeLoyaltyPoints,
      subtotal, discount, deliveryFee, total, itemCount,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
