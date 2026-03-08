'use client';

import { useEffect, useRef, useCallback } from 'react';
import ProtectedRoute from '@/components/admin/ProtectedRoute';
import AdminNavbar from '@/components/admin/Navbar';
import { transactionsApi } from '@/lib/api';
import { toast } from 'react-toastify';
import { NotificationsProvider, useNotifications } from '@/contexts/NotificationsContext';

const POLL_INTERVAL = 10_000;

function playNotificationSound() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const playBeep = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.4, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };
    const now = ctx.currentTime;
    playBeep(880, now, 0.15);
    playBeep(1100, now + 0.18, 0.15);
    playBeep(1320, now + 0.36, 0.25);
  } catch (e) {
    console.warn('No se pudo reproducir el sonido de notificación:', e);
  }
}

function OrderNotifier() {
  const knownCountRef = useRef<number | null>(null);
  const isFirstLoadRef = useRef(true);
  const knownIdsRef = useRef<Set<number>>(new Set());
  const { addNotification } = useNotifications();

  const poll = useCallback(async () => {
    try {
      const data = await transactionsApi.getAll();

      if (!isFirstLoadRef.current && knownCountRef.current !== null) {
        const newOrders = data.filter((o) => !knownIdsRef.current.has(o.id));
        if (newOrders.length > 0) {
          playNotificationSound();
          newOrders.forEach((o) => {
            addNotification({
              orderId: o.id,
              fullName: o.fullName,
              phone: o.phone,
              total: o.total,
            });
          });
          toast.info(
            `🔔 ${
              newOrders.length === 1
                ? 'Nueva orden recibida'
                : `${newOrders.length} nuevas órdenes recibidas`
            }`,
            { autoClose: 4000 },
          );
        }
      }

      knownIdsRef.current = new Set(data.map((o) => o.id));
      knownCountRef.current = data.length;
      isFirstLoadRef.current = false;
    } catch {
      // silencioso en polling de fondo
    }
  }, [addNotification]);

  useEffect(() => {
    poll();
    const id = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [poll]);

  return null;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <NotificationsProvider>
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <AdminNavbar />
          <OrderNotifier />
          <main>{children}</main>
        </div>
      </ProtectedRoute>
    </NotificationsProvider>
  );
}
