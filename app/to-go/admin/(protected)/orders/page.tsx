'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { transactionsApi } from '@/lib/api';
import { Transaction, TransactionStatus } from '@/lib/types';
import { toast } from 'react-toastify';
import { useNotifications } from '@/contexts/NotificationsContext';

const POLL_INTERVAL = 10_000;

// ── Config de estados ───────────────────────────────────────────────────────
const STATUS_META: Record<
  TransactionStatus,
  { label: string; short: string; icon: string; badgeClass: string; nextAction: string | null }
> = {
  [TransactionStatus.PENDING]: {
    label: 'Confirmando pedido',
    short: 'Pendiente',
    icon: '🕐',
    badgeClass: 'bg-amber-100 text-amber-700 border-amber-300',
    nextAction: 'Aceptar pedido',
  },
  [TransactionStatus.PREPARING]: {
    label: 'En preparación',
    short: 'Preparando',
    icon: '👨‍🍳',
    badgeClass: 'bg-blue-100 text-blue-700 border-blue-300',
    nextAction: 'Marcar como Listo',
  },
  [TransactionStatus.READY]: {
    label: 'Pedido Listo',
    short: 'Listo',
    icon: '✅',
    badgeClass: 'bg-green-100 text-green-700 border-green-400',
    nextAction: 'Finalizar pedido',
  },
  [TransactionStatus.COMPLETED]: {
    label: 'Finalizado',
    short: 'Finalizado',
    icon: '🎉',
    badgeClass: 'bg-gray-100 text-gray-500 border-gray-300',
    nextAction: null,
  },
};

const FILTER_TABS: { key: TransactionStatus | 'ALL'; label: string }[] = [
  { key: 'ALL', label: 'Todas' },
  { key: TransactionStatus.PENDING, label: '🕐 Pendientes' },
  { key: TransactionStatus.PREPARING, label: '👨‍🍳 Preparando' },
  { key: TransactionStatus.READY, label: '✅ Listas' },
  { key: TransactionStatus.COMPLETED, label: '🎉 Finalizadas' },
];

function StatusBadge({ status }: { status: TransactionStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${meta.badgeClass}`}
    >
      {meta.icon} {meta.short}
    </span>
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TransactionStatus | 'ALL'>('ALL');
  const [advancingId, setAdvancingId] = useState<number | null>(null);
  const mountedRef = useRef(true);
  const { markAllAsRead } = useNotifications();

  const fetchOrders = useCallback(async (silent = false) => {
    try {
      const data = await transactionsApi.getAll();
      if (mountedRef.current) setOrders(data);
    } catch {
      if (!silent) toast.error('Error al cargar las órdenes');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    markAllAsRead();
    fetchOrders();
    const id = setInterval(() => fetchOrders(true), POLL_INTERVAL);
    return () => {
      mountedRef.current = false;
      clearInterval(id);
    };
  }, [fetchOrders, markAllAsRead]);

  const handleAdvance = async (order: Transaction) => {
    setAdvancingId(order.id);
    try {
      const updated = await transactionsApi.advanceStatus(order.id);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      const meta = STATUS_META[updated.status];
      toast.success(`Orden #${updated.id} → ${meta.label}`);
    } catch {
      toast.error('No se pudo actualizar el estado');
    } finally {
      setAdvancingId(null);
    }
  };

  const filtered =
    filter === 'ALL' ? orders : orders.filter((o) => o.status === filter);

  // Contadores por estado para los tabs
  const countByStatus = (s: TransactionStatus | 'ALL') =>
    s === 'ALL' ? orders.length : orders.filter((o) => o.status === s).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-[#e86b07] border-r-transparent" />
          <p className="mt-4 text-gray-600">Cargando órdenes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Órdenes</h1>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="inline-block h-2 w-2 rounded-full bg-green-400 animate-pulse" />
          Actualización cada 10 s
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTER_TABS.map((tab) => {
          const count = countByStatus(tab.key);
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border transition cursor-pointer ${
                filter === tab.key
                  ? 'bg-[#e86b07] text-white border-[#e86b07]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-[#e86b07] hover:text-[#e86b07]'
              }`}
            >
              {tab.label}
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                  filter === tab.key ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="text-5xl mb-4">📋</div>
          <h2 className="text-xl font-bold text-gray-700 mb-2">
            {filter === 'ALL' ? 'Sin órdenes todavía' : 'Sin órdenes en este estado'}
          </h2>
          <p className="text-gray-500">
            {filter === 'ALL'
              ? 'Las órdenes realizadas desde To-Go aparecerán aquí.'
              : 'Prueba seleccionando otro filtro.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Desktop table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">#</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Cliente</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Teléfono</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Estado</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Recogida</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Total</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600">Acción</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((order) => {
                  const meta = STATUS_META[order.status];
                  const isAdvancing = advancingId === order.id;
                  return (
                    <tr key={order.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-bold text-[#e86b07]">#{order.id}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{order.fullName}</td>
                      <td className="px-4 py-3 text-gray-600">{order.phone}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {order.pickupTime ? formatDate(order.pickupTime) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900">
                        ${Number(order.total).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {meta.nextAction ? (
                          <button
                            onClick={() => handleAdvance(order)}
                            disabled={isAdvancing}
                            className="inline-flex items-center gap-1 bg-[#e86b07] hover:bg-[#d05f06] disabled:bg-gray-300 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer"
                          >
                            {isAdvancing ? (
                              <span className="h-3 w-3 border-2 border-white border-r-transparent rounded-full animate-spin inline-block" />
                            ) : (
                              '▶'
                            )}
                            {meta.nextAction}
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400 font-medium">Finalizado</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Link
                          href={`/to-go/admin/orders/${order.id}`}
                          className="inline-block bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                        >
                          Ver
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden divide-y divide-gray-100">
            {filtered.map((order) => {
              const meta = STATUS_META[order.status];
              const isAdvancing = advancingId === order.id;
              return (
                <div key={order.id} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-[#e86b07] text-lg">#{order.id}</span>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="font-semibold text-gray-800">{order.fullName}</p>
                  <p className="text-sm text-gray-500">{order.phone}</p>
                  {order.pickupTime && (
                    <p className="text-xs text-gray-400 mt-1">
                      🕐 Recogida: {formatDate(order.pickupTime)}
                    </p>
                  )}
                  <p className="font-bold text-gray-900 mt-1">${Number(order.total).toFixed(2)}</p>
                  <div className="flex gap-2 mt-3">
                    {meta.nextAction && (
                      <button
                        onClick={() => handleAdvance(order)}
                        disabled={isAdvancing}
                        className="flex-1 bg-[#e86b07] hover:bg-[#d05f06] disabled:bg-gray-300 text-white text-xs font-bold py-2 rounded-lg transition cursor-pointer"
                      >
                        {isAdvancing ? '...' : `▶ ${meta.nextAction}`}
                      </button>
                    )}
                    <Link
                      href={`/to-go/admin/orders/${order.id}`}
                      className="flex-1 text-center bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold py-2 rounded-lg transition"
                    >
                      Ver detalle
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
