import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

export type OrderStatus = 'draft' | 'submitted';

export interface OrderDraft {
  title: string;
  company: string;
  contactName: string;
  contactPhone: string;
  productType: string;
  quantity: string;
  material: string;
  dimensions: string;
  printMethod: string;
  colors: string;
  deadline: string;
  notes: string;
}

export interface Order extends Omit<OrderDraft, 'quantity'> {
  id: string;
  quantity: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

interface OrdersContextValue {
  orders: Order[];
  isLoading: boolean;
  saveOrder: (draft: OrderDraft, status: OrderStatus, existingId?: string) => Promise<Order>;
  getOrder: (id: string) => Order | undefined;
}

const OrdersContext = createContext<OrdersContextValue | null>(null);
const STORAGE_KEY = '@print-fixture-orders/orders';

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!isMounted || !stored) return;
        const parsed = JSON.parse(stored) as Order[];
        if (Array.isArray(parsed)) setOrders(parsed);
      })
      .catch(() => undefined)
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const persist = async (nextOrders: Order[]) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextOrders));
    setOrders(nextOrders);
  };

  const saveOrder = async (draft: OrderDraft, status: OrderStatus, existingId?: string) => {
    const now = new Date().toISOString();
    const existing = existingId ? orders.find((order) => order.id === existingId) : undefined;
    const order: Order = {
      ...draft,
      id: existing?.id ?? createId(),
      quantity: Number.parseInt(draft.quantity, 10) || 0,
      status,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    const nextOrders = existing
      ? orders.map((item) => (item.id === existing.id ? order : item))
      : [order, ...orders];
    await persist(nextOrders);
    return order;
  };

  const value = useMemo(
    () => ({
      orders,
      isLoading,
      saveOrder,
      getOrder: (id: string) => orders.find((order) => order.id === id),
    }),
    [isLoading, orders],
  );

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders() {
  const context = useContext(OrdersContext);
  if (!context) throw new Error('useOrders must be used within OrdersProvider');
  return context;
}