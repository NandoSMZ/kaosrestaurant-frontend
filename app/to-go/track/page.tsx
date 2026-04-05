'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { transactionsApi } from '@/lib/api';
import { Transaction, TransactionStatus } from '@/lib/types';

const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

// ── Config de estados ───────────────────────────────────────────────────────
const STATUS_STEPS: TransactionStatus[] = [
  TransactionStatus.PENDING,
  TransactionStatus.PREPARING,
  TransactionStatus.READY,
  TransactionStatus.COMPLETED,
];

const STATUS_META: Record<TransactionStatus, { label: string; icon: string; color: string; bg: string; border: string }> = {
  [TransactionStatus.PENDING]: {
    label: 'Confirmando tu pedido',
    icon: '🕐',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-300',
  },
  [TransactionStatus.PREPARING]: {
    label: 'En preparación',
    icon: '👨‍🍳',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-300',
  },
  [TransactionStatus.READY]: {
    label: '¡Pedido Listo para recoger!',
    icon: '✅',
    color: 'text-green-700',
    bg: 'bg-green-50',
    border: 'border-green-400',
  },
  [TransactionStatus.COMPLETED]: {
    label: 'Pedido Finalizado',
    icon: '🎉',
    color: 'text-gray-600',
    bg: 'bg-gray-50',
    border: 'border-gray-300',
  },
  [TransactionStatus.CANCELLED]: {
    label: 'Pedido Cancelado',
    icon: '🚫',
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-300',
  },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-ES', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatusProgress({ status }: { status: TransactionStatus }) {
  const currentIdx = STATUS_STEPS.indexOf(status);
  return (
    <div className="flex items-center w-full my-4">
      {STATUS_STEPS.map((s, idx) => {
        const meta = STATUS_META[s];
        const done = idx < currentIdx;
        const active = idx === currentIdx;
        return (
          <React.Fragment key={s}>
            <div className="flex flex-col items-center flex-1 min-w-0">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                  done
                    ? 'bg-[#e86b07] border-[#e86b07] text-white'
                    : active
                    ? `${meta.bg} ${meta.border} ${meta.color} border-2`
                    : 'bg-gray-100 border-gray-200 text-gray-400'
                }`}
              >
                {done ? '✓' : active ? meta.icon : idx + 1}
              </div>
              <span
                className={`text-[10px] mt-1 text-center leading-tight px-0.5 ${
                  active ? meta.color + ' font-semibold' : done ? 'text-[#e86b07]' : 'text-gray-400'
                }`}
              >
                {meta.label}
              </span>
            </div>
            {idx < STATUS_STEPS.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-1 mt-4 ${
                  idx < currentIdx ? 'bg-[#e86b07]' : 'bg-gray-200'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function OrderCard({
  order,
  onCancelled,
}: {
  order: Transaction;
  onCancelled: (updated: Transaction) => void;
}) {
  const meta = STATUS_META[order.status] ?? STATUS_META[TransactionStatus.PENDING];
  const isCancelled = order.status === TransactionStatus.CANCELLED;
  const isPending = order.status === TransactionStatus.PENDING;

  const [cancelling, setCancelling] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const updated = await transactionsApi.cancelOrder(order.id);
      onCancelled(updated);
      setConfirmCancel(false);
    } catch {
      alert('No se pudo cancelar la orden. Inténtalo de nuevo.');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className={`rounded-xl border-2 ${meta.border} ${meta.bg} p-5 mb-4`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="font-bold text-gray-800 text-lg">
          Orden <span className="text-[#e86b07]">#{order.id}</span>
        </span>
        <span
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold border ${meta.border} ${meta.color} ${meta.bg}`}
        >
          {meta.icon} {meta.label}
        </span>
      </div>

      {/* Cancelled banner */}
      {isCancelled ? (
        <div className="rounded-lg bg-red-100 border border-red-300 px-4 py-3 mb-3">
          <p className="text-sm font-bold text-red-700 mb-1">🚫 Este pedido fue cancelado</p>
          {order.cancellationNote ? (
            <p className="text-sm text-red-600">
              <span className="font-semibold">Motivo:</span> {order.cancellationNote}
            </p>
          ) : (
            <p className="text-sm text-red-500 italic">Cancelado por el cliente.</p>
          )}
          {order.cancelledAt && (
            <p className="text-xs text-red-400 mt-1">
              Cancelado el {formatDate(order.cancelledAt)}
            </p>
          )}
        </div>
      ) : (
        /* Progress bar — solo para órdenes activas */
        <StatusProgress status={order.status} />
      )}

      {/* Pickup time */}
      {order.pickupTime && !isCancelled && (
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#e86b07] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="capitalize">Recogida: <strong>{formatDate(order.pickupTime)}</strong></span>
        </div>
      )}

      {/* Productos */}
      <div className="text-sm text-gray-600 border-t border-gray-200 pt-3 space-y-1">
        {order.contents?.slice(0, 3).map((item) => (
          <div key={item.id} className="flex justify-between">
            <span>{item.product.name} × {item.quantity}</span>
            <span className="font-semibold">{(Number(item.price) * item.quantity).toFixed(2)}€</span>
          </div>
        ))}
        {(order.contents?.length ?? 0) > 3 && (
          <p className="text-xs text-gray-400">+{(order.contents?.length ?? 0) - 3} producto(s) más</p>
        )}
      </div>

      {/* Total */}
      <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
        <span className="text-sm font-semibold text-gray-700">Total del pedido</span>
        <span className="text-lg font-bold text-[#e86b07]">{Number(order.total).toFixed(2)}€</span>
      </div>

      {/* Botón cancelar (solo PENDING) */}
      {isPending && !confirmCancel && (
        <button
          onClick={() => setConfirmCancel(true)}
          className="mt-3 w-full text-center text-sm text-red-500 hover:text-red-700 font-semibold py-2 border border-red-200 rounded-lg hover:bg-red-50 transition cursor-pointer"
        >
          Cancelar pedido
        </button>
      )}

      {/* Confirmación cancelación */}
      {isPending && confirmCancel && (
        <div className="mt-3 rounded-lg bg-red-50 border border-red-300 p-3 space-y-2">
          <p className="text-sm font-semibold text-red-700">¿Confirmas que deseas cancelar este pedido?</p>
          <p className="text-xs text-red-500">Esta acción no se puede deshacer. Solo podrás cancelar mientras el restaurante no haya confirmado tu pedido.</p>
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white text-sm font-bold py-2 rounded-lg transition cursor-pointer"
            >
              {cancelling ? 'Cancelando...' : 'Sí, cancelar'}
            </button>
            <button
              onClick={() => setConfirmCancel(false)}
              disabled={cancelling}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold py-2 rounded-lg transition cursor-pointer"
            >
              Volver
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrackOrderPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [orders, setOrders] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const isVisible = (o: Transaction) => {
    if (o.status === TransactionStatus.COMPLETED) return false;
    if (o.status === TransactionStatus.CANCELLED) {
      if (!o.cancelledAt) return false;
      return Date.now() - new Date(o.cancelledAt).getTime() < TWELVE_HOURS_MS;
    }
    return true;
  };

  const hasActiveOrders = orders.some(
    (o) => o.status !== TransactionStatus.COMPLETED && o.status !== TransactionStatus.CANCELLED,
  );

  const fetchOrders = useCallback(async (ph: string, silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const data = await transactionsApi.trackByPhone(ph);
      setOrders(data);
      setSearched(true);
    } catch {
      if (!silent) setError('No se pudo consultar. Intenta de nuevo.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const handleSearch = async () => {
    const trimmed = phoneInput.trim();
    if (!trimmed) {
      setError('Ingresa tu número de teléfono');
      return;
    }
    setPhone(trimmed);
    await fetchOrders(trimmed);
  };

  const handleCancelled = (updated: Transaction) => {
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
  };

  // Polling cuando hay órdenes activas
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (phone && hasActiveOrders) {
      intervalRef.current = setInterval(() => fetchOrders(phone, true), 10_000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [phone, hasActiveOrders, fetchOrders]);

  const displayOrders = orders.filter(isVisible).slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-md sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => router.push('/to-go')}
            className="text-[#e86b07] hover:text-[#d05f06] font-bold text-xl cursor-pointer"
          >
            ←
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Seguir Pedido</h1>
            <p className="text-xs text-gray-500">Consulta el estado de tu orden</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-lg">
        {/* Search card */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <p className="text-sm text-gray-600 mb-4">
            Ingresa tu número de teléfono <span className="font-semibold">sin indicativo de país</span> para ver el estado de tu pedido.
          </p>
          <div className="flex gap-2">
            <input
              type="tel"
              value={phoneInput}
              onChange={(e) => {
                setPhoneInput(e.target.value.replace(/[^\d\s]/g, ''));
                setError('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Ej: 612 345 678"
              className={`flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e86b07] ${
                error ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="bg-[#e86b07] hover:bg-[#d05f06] disabled:bg-gray-300 text-white font-semibold px-4 py-2 rounded-lg text-sm transition cursor-pointer"
            >
              {loading ? (
                <span className="inline-block h-4 w-4 border-2 border-white border-r-transparent rounded-full animate-spin" />
              ) : 'Buscar'}
            </button>
          </div>
          {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
        </div>

        {/* Results */}
        {searched && !loading && (
          <>
            {displayOrders.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-8 text-center">
                <div className="text-5xl mb-3">{orders.length > 0 ? '🎉' : '🔍'}</div>
                <h2 className="text-lg font-bold text-gray-700 mb-1">
                  {orders.length > 0 ? 'Sin pedidos activos' : 'Sin pedidos encontrados'}
                </h2>
                <p className="text-sm text-gray-500">
                  {orders.length > 0
                    ? 'Todos tus pedidos ya han sido entregados o completados.'
                    : 'No encontramos pedidos asociados a este número.'}
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-gray-700">
                    {displayOrders.length} pedido{displayOrders.length !== 1 ? 's' : ''} encontrado{displayOrders.length !== 1 ? 's' : ''}
                  </p>
                  {hasActiveOrders && (
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
                      Actualización automática
                    </span>
                  )}
                </div>
                {displayOrders.map((order) => (
                  <OrderCard key={order.id} order={order} onCancelled={handleCancelled} />
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
