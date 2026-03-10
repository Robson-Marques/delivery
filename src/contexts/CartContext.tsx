import React, { createContext, useContext, useState, useCallback } from 'react';
import type { MenuItem, PizzaSize, Extra } from '@/data/menu-data';

export interface CartItemData {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  size?: PizzaSize;
  secondFlavor?: MenuItem;
  extras: Extra[];
  observations: string;
  unitPrice: number;
}

interface CartContextType {
  items: CartItemData[];
  addItem: (item: CartItemData) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateObservations: (id: string, observations: string) => void;
  clearCart: () => void;
  coupon: string | null;
  applyCoupon: (code: string) => void;
  removeCoupon: () => void;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItemData[]>([]);
  const [coupon, setCoupon] = useState<string | null>(null);
  const deliveryFee = 5.99;

  const addItem = useCallback((item: CartItemData) => {
    setItems(prev => [...prev, { ...item, id: `${item.menuItem.id}-${Date.now()}` }]);
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
  }, []);

  const applyCoupon = useCallback((code: string) => {
    setCoupon(code.toUpperCase());
  }, []);

  const removeCoupon = useCallback(() => setCoupon(null), []);

  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  const discount = coupon === 'PRIMEIRACOMPRA' ? subtotal * 0.1 :
    coupon === 'FRETEGRATIS' ? deliveryFee :
    coupon === 'PIZZA10' ? 10 : 0;

  const total = Math.max(0, subtotal - discount + (coupon === 'FRETEGRATIS' ? 0 : deliveryFee));
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      items, addItem, removeItem, updateQuantity, updateObservations,
      clearCart, coupon, applyCoupon, removeCoupon,
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
