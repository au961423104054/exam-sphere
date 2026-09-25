import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ToastContainer } from '../components/ui/Toast';
import { examSphereApi } from '../services/api';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);

  // Fetch initial notifications
  const loadNotifications = useCallback(async () => {
    try {
      const res = await examSphereApi.notifications.list();
      setNotifications(res.data || []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Mark single notification as read
  const markAsRead = async (id) => {
    try {
      await examSphereApi.notifications.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await examSphereApi.notifications.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  // Dispatch interactive toast
  const showToast = useCallback(({ type = 'info', title, message, duration = 4500 }) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast = { id, type, title, message, duration };
    setToasts((prev) => [...prev, newToast]);
  }, []);

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        showToast,
        loadNotifications,
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
