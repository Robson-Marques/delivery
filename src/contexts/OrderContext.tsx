import React, { createContext, useContext, useState, useCallback } from 'react';
import type { CartItemData } from './CartContext';

export type OrderStatus = 'pending' | 'accepted' | 'preparing' | 'ready' | 'delivering' | 'done';
export type OrderType = 'delivery' | 'pickup' | 'dine-in';
export type PaymentMethod = 'pix' | 'cash' | 'card' | 'online';

export interface Order {
  id: string;
  number: number;
  items: CartItemData[];
  customer: {
    name: string;
    phone: string;
    address?: string;
    addressNumber?: string;
    neighborhood?: string;
    complement?: string;
    reference?: string;
  };
  type: OrderType;
  payment: PaymentMethod;
  changeFor?: number;
  observations: string;
  status: OrderStatus;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  createdAt: Date;
  updatedAt: Date;
}

interface OrderContextType {
  orders: Order[];
  addOrder: (order: Omit<Order, 'id' | 'number' | 'status' | 'createdAt' | 'updatedAt'>) => Order;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  getOrdersByStatus: (status: OrderStatus) => Order[];
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

let orderCounter = 100;

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);

  const addOrder = useCallback((orderData: Omit<Order, 'id' | 'number' | 'status' | 'createdAt' | 'updatedAt'>) => {
    orderCounter++;
    const order: Order = {
      ...orderData,
      id: `order-${Date.now()}`,
      number: orderCounter,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setOrders(prev => [order, ...prev]);
    return order;
  }, []);

  const updateOrderStatus = useCallback((id: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status, updatedAt: new Date() } : o));
  }, []);

  const getOrdersByStatus = useCallback((status: OrderStatus) => {
    return orders.filter(o => o.status === status);
  }, [orders]);

  return (
    <OrderContext.Provider value={{ orders, addOrder, updateOrderStatus, getOrdersByStatus }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error('useOrders must be used within OrderProvider');
  return ctx;
}
