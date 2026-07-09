import { create } from 'zustand';
import type { Order } from '@/types';

interface OrderState {
  orders: Order[];
  selectedOrder: Order | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    status?: string;
    dateRange?: {
      start: Date;
      end: Date;
    };
    serviceProviderId?: string;
  };

  setOrders: (orders: Order[]) => void;
  setSelectedOrder: (order: Order | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: OrderState['filters']) => void;
  
  addOrder: (order: Order) => void;
  updateOrder: (orderId: string, updates: Partial<Order>) => void;
  removeOrder: (orderId: string) => void;
  clearError: () => void;
}

export const useOrderStore = create<OrderState>((set) => ({
  orders: [],
  selectedOrder: null,
  isLoading: false,
  error: null,
  filters: {},

  setOrders: (orders) => set({ orders }),
  setSelectedOrder: (selectedOrder) => set({ selectedOrder }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setFilters: (filters) => set({ filters }),

  addOrder: (order) => set((state) => ({
    orders: [order, ...state.orders],
  })),

  updateOrder: (orderId, updates) => set((state) => ({
    orders: state.orders.map((order) =>
      order.orderId === orderId ? { ...order, ...updates } : order
    ),
    selectedOrder: state.selectedOrder?.orderId === orderId
      ? { ...state.selectedOrder, ...updates }
      : state.selectedOrder,
  })),

  removeOrder: (orderId) => set((state) => ({
    orders: state.orders.filter((order) => order.orderId !== orderId),
  })),

  clearError: () => set({ error: null }),
}));
