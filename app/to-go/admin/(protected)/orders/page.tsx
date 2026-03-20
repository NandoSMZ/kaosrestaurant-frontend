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
  [TransactionStatus.CANCELLED]: {
    label: 'Cancelada',
    short: 'Cancelada',
    icon: '🚫',
    badgeClass: 'bg-red-100 text-red-600 border-red-300',
    nextAction: null,
  },
};

const FILTER_TABS: { key: TransactionStatus | 'ALL'; label: string }[] = [
  { key: 'ALL', label: 'Todas' },
  { key: TransactionStatus.PENDING, label: '🕐 Pendientes' },
  { key: TransactionStatus.PREPARING, label: '👨‍🍳 Preparando' },
  { key: TransactionStatus.READY, label: '✅ Listas' },
  { key: TransactionStatus.COMPLETED, label: '🎉 Finalizadas' },
  { key: TransactionStatus.CANCELLED, label: '🚫 Canceladas' },
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

// ── Modal cancelación admin ─────────────────────────────────────────────────
function CancelModal({
  order,
  onClose,
  onCancelled,
}: {
  order: Transaction;
  onClose: () => void;
  onCancelled: (updated: Transaction) => void;
}) {
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;
    setLoading(true);
    try {
      const updated = await transactionsApi.adminCancelOrder(order.id, note.trim());
      onCancelled(updated);
      toast.success(`Orden #${order.id} cancelada`);
      onClose();
    } catch {
      toast.error('No se pudo cancelar la orden');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Cancelar Orden #{order.id}</h2>
        <p className="text-sm text-gray-500 mb-4">
          Cliente: <strong>{order.fullName}</strong> — {order.phone}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Motivo de cancelación <span className="text-red-500">*</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej: Producto no disponible, restaurante cerrado por hoy..."
              rows={3}
              maxLength={500}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
            />
            <p className="text-xs text-gray-400 text-right mt-1">{note.length}/500</p>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading || !note.trim()}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-bold py-2 rounded-lg transition cursor-pointer text-sm"
            >
              {loading ? 'Cancelando...' : 'Confirmar cancelación'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 rounded-lg transition cursor-pointer text-sm"
            >
              Volver
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const PAGE_SIZES = [10, 20, 50] as const;
type PageSize = (typeof PAGE_SIZES)[number];

function PaginationBar({
  total,
  page,
  pageSize,
  onPage,
  onPageSize,
}: {
  total: number;
  page: number;
  pageSize: PageSize;
  onPage: (p: number) => void;
  onPageSize: (s: PageSize) => void;
}) {
  const totalPages = Math.ceil(total / pageSize);
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 bg-gray-50 text-sm text-gray-600">
      <div className="flex items-center gap-2">
        <span>Filas por página:</span>
        {PAGE_SIZES.map((s) => (
          <button
            key={s}
            onClick={() => onPageSize(s)}
            className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
              pageSize === s
                ? 'bg-[#e86b07] text-white'
                : 'bg-white border border-gray-200 hover:border-[#e86b07] text-gray-600'
            }`}
          >
            {s}
          </button>
        ))}
      </div>
      <span className="text-gray-400">
        {from}–{to} de {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(1)}
          disabled={page === 1}
          className="px-2 py-1 rounded-lg border border-gray-200 disabled:opacity-40 hover:border-[#e86b07] cursor-pointer"
        >
          «
        </button>
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          className="px-2 py-1 rounded-lg border border-gray-200 disabled:opacity-40 hover:border-[#e86b07] cursor-pointer"
        >
          ‹
        </button>
        <span className="px-3 py-1 font-semibold text-gray-700">
          {page} / {totalPages || 1}
        </span>
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
          className="px-2 py-1 rounded-lg border border-gray-200 disabled:opacity-40 hover:border-[#e86b07] cursor-pointer"
        >
          ›
        </button>
        <button
          onClick={() => onPage(totalPages)}
          disabled={page >= totalPages}
          className="px-2 py-1 rounded-lg border border-gray-200 disabled:opacity-40 hover:border-[#e86b07] cursor-pointer"
        >
          »
        </button>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TransactionStatus | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(10);
  const [advancingId, setAdvancingId] = useState<number | null>(null);
  const [cancelTargetOrder, setCancelTargetOrder] = useState<Transaction | null>(null);
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

  const handleCancelled = (updated: Transaction) => {
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    setCancelTargetOrder(null);
  };

  // Reset página cuando cambia filtro o búsqueda
  useEffect(() => {
    setPage(1);
  }, [filter, searchTerm, pageSize]);

  const filtered = orders.filter((o) => {
    const matchesTab = filter === 'ALL' || o.status === filter;
    if (!matchesTab) return false;
    if (!searchTerm.trim()) return true;
    const term = searchTerm.trim().toLowerCase();
    return (
      String(o.id).includes(term) ||
      o.fullName.toLowerCase().includes(term) ||
      o.phone.toLowerCase().includes(term)
    );
  });

  const totalFiltered = filtered.length;
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

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
      {/* Modal cancelación */}
      {cancelTargetOrder && (
        <CancelModal
          order={cancelTargetOrder}
          onClose={() => setCancelTargetOrder(null)}
          onCancelled={handleCancelled}
        />
      )}
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Órdenes</h1>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="inline-block h-2 w-2 rounded-full bg-green-400 animate-pulse" />
          Actualización cada 10 s
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
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

      {/* Buscador */}
      <div className="relative mb-6">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">🔍</span>
        <input
          type="text"
          placeholder="Buscar por ID, cliente o teléfono..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#e86b07] bg-white shadow-sm"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none cursor-pointer"
          >
            ×
          </button>
        )}
      </div>

      {totalFiltered === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="text-5xl mb-4">📋</div>
          <h2 className="text-xl font-bold text-gray-700 mb-2">
            {searchTerm
              ? 'Sin resultados para tu búsqueda'
              : filter === 'ALL'
              ? 'Sin órdenes todavía'
              : 'Sin órdenes en este estado'}
          </h2>
          <p className="text-gray-500">
            {searchTerm
              ? 'Prueba con otro ID, nombre o teléfono.'
              : filter === 'ALL'
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
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Creada</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Recogida</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Total</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600">Acción</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paged.map((order) => {
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
                        {formatDate(order.transactionDate)}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {order.pickupTime ? formatDate(order.pickupTime) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900">
                        {Number(order.total).toFixed(2)}€
                      </td>
                      <td className="px-4 py-3 text-center">
                        {meta.nextAction ? (
                          <div className="flex flex-col gap-1 items-center">
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
                            <button
                              onClick={() => setCancelTargetOrder(order)}
                              className="text-xs text-red-500 hover:text-red-700 font-semibold cursor-pointer"
                            >
                              🚫 Cancelar
                            </button>
                          </div>
                        ) : order.status === TransactionStatus.CANCELLED ? (
                          <span className="text-xs text-red-400 font-medium">Cancelada</span>
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
            {paged.map((order) => {
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
                  <p className="text-xs text-gray-400 mt-1">📅 {formatDate(order.transactionDate)}</p>
                  {order.pickupTime && (
                    <p className="text-xs text-gray-400 mt-1">
                      🕐 Recogida: {formatDate(order.pickupTime)}
                    </p>
                  )}
                  <p className="font-bold text-gray-900 mt-1">{Number(order.total).toFixed(2)}€</p>
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
                    {meta.nextAction && (
                      <button
                        onClick={() => setCancelTargetOrder(order)}
                        className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-lg transition cursor-pointer border border-red-200"
                      >
                        🚫
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

          <PaginationBar
            total={totalFiltered}
            page={page}
            pageSize={pageSize}
            onPage={setPage}
            onPageSize={(s) => { setPageSize(s); setPage(1); }}
          />
        </div>
      )}
    </div>
  );
}
