'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface OrderNotification {
  id: string;
  orderId: number;
  fullName: string;
  phone: string;
  total: number;
  timestamp: Date;
  read: boolean;
}

interface NotificationsContextType {
  notifications: OrderNotification[];
  unreadCount: number;
  addNotification: (data: Omit<OrderNotification, 'id' | 'timestamp' | 'read'>) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  removeOne: (id: string) => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);

  const addNotification = useCallback(
    (data: Omit<OrderNotification, 'id' | 'timestamp' | 'read'>) => {
      const newNotif: OrderNotification = {
        ...data,
        id: `${data.orderId}-${Date.now()}`,
        timestamp: new Date(),
        read: false,
      };
      setNotifications((prev) => [newNotif, ...prev].slice(0, 50)); // máximo 50
    },
    [],
  );

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const removeOne = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationsContext.Provider
      value={{ notifications, unreadCount, addNotification, markAllAsRead, clearAll, removeOne }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
}
