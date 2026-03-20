'use client';

import { useEffect, useRef, useCallback } from 'react';
import ProtectedRoute from '@/components/admin/ProtectedRoute';
import AdminNavbar from '@/components/admin/Navbar';
import { transactionsApi } from '@/lib/api';
import { toast } from 'react-toastify';
import { NotificationsProvider, useNotifications } from '@/contexts/NotificationsContext';

const POLL_INTERVAL = 10_000;
const ORIGINAL_TITLE = 'Kaos Admin';

// ── Sonido: 4 pitidos ascendentes más intensos ──────────────────────────────
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
      gain.gain.setValueAtTime(0.7, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };
    const now = ctx.currentTime;
    playBeep(880,  now,        0.18);
    playBeep(1100, now + 0.20, 0.18);
    playBeep(1320, now + 0.40, 0.18);
    playBeep(1540, now + 0.60, 0.30);
  } catch (e) {
    console.warn('No se pudo reproducir el sonido de notificación:', e);
  }
}

// ── Browser Notification helpers ────────────────────────────────────────────
function requestBrowserNotificationPermission() {
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function sendBrowserNotification(title: string, body: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  try {
    const n = new Notification(title, {
      body,
      icon: '/images/Logos/apple-icon.png',
      badge: '/images/Logos/apple-icon.png',
      tag: 'kaos-order',          // agrupa para no spamear
      renotify: true,             // siempre re-alerta aunque use el mismo tag
    });
    setTimeout(() => n.close(), 8000);
  } catch (e) {
    console.warn('Browser notification error:', e);
  }
}

// ── Parpadeo del título de la pestaña ───────────────────────────────────────
function TabBlinker() {
  const { unreadCount } = useNotifications();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (unreadCount > 0) {
      let toggle = false;
      intervalRef.current = setInterval(() => {
        document.title = toggle
          ? `🔔 ${unreadCount} orden${unreadCount > 1 ? 'es' : ''} nueva${unreadCount > 1 ? 's' : ''}!`
          : ORIGINAL_TITLE;
        toggle = !toggle;
      }, 900);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      document.title = ORIGINAL_TITLE;
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [unreadCount]);

  return null;
}

// ── Polling de órdenes ───────────────────────────────────────────────────────
function OrderNotifier() {
  const knownCountRef = useRef<number | null>(null);
  const isFirstLoadRef = useRef(true);
  const knownIdsRef = useRef<Set<number>>(new Set());
  const { addNotification } = useNotifications();

  useEffect(() => {
    requestBrowserNotificationPermission();
  }, []);

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

          // Browser notification del SO
          if (newOrders.length === 1) {
            sendBrowserNotification(
              '🛒 Nueva orden recibida — Kaos',
              `${newOrders[0].fullName} · ${Number(newOrders[0].total).toFixed(2)}€`,
            );
          } else {
            sendBrowserNotification(
              `🛒 ${newOrders.length} nuevas órdenes — Kaos`,
              newOrders.map((o) => o.fullName).join(', '),
            );
          }

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
          <TabBlinker />
          <main>{children}</main>
        </div>
      </ProtectedRoute>
    </NotificationsProvider>
  );
}
