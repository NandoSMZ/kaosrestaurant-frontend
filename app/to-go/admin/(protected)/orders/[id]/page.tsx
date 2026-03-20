'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { transactionsApi, getImageUrl } from '@/lib/api';
import { Transaction, TransactionStatus } from '@/lib/types';
import { toast } from 'react-toastify';

// ── Config de estados ───────────────────────────────────────────────────────
const STATUS_STEPS: TransactionStatus[] = [
  TransactionStatus.PENDING,
  TransactionStatus.PREPARING,
  TransactionStatus.READY,
  TransactionStatus.COMPLETED,
];

const STATUS_META: Record<
  TransactionStatus,
  { label: string; icon: string; bg: string; border: string; color: string; nextAction: string | null; nextBtnClass: string }
> = {
  [TransactionStatus.PENDING]: {
    label: 'Confirmando pedido',
    icon: '🕐',
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    color: 'text-amber-700',
    nextAction: 'Aceptar pedido — pasar a Preparación',
    nextBtnClass: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  [TransactionStatus.PREPARING]: {
    label: 'En preparación',
    icon: '👨‍🍳',
    bg: 'bg-blue-50',
    border: 'border-blue-300',
    color: 'text-blue-700',
    nextAction: 'Marcar como Listo',
    nextBtnClass: 'bg-green-600 hover:bg-green-700 text-white',
  },
  [TransactionStatus.READY]: {
    label: 'Pedido Listo para recoger',
    icon: '✅',
    bg: 'bg-green-50',
    border: 'border-green-400',
    color: 'text-green-700',
    nextAction: 'Marcar como Entregado (Finalizar)',
    nextBtnClass: 'bg-gray-600 hover:bg-gray-700 text-white',
  },
  [TransactionStatus.COMPLETED]: {
    label: 'Pedido Finalizado',
    icon: '🎉',
    bg: 'bg-gray-50',
    border: 'border-gray-300',
    color: 'text-gray-600',
    nextAction: null,
    nextBtnClass: '',
  },
  [TransactionStatus.CANCELLED]: {
    label: 'Pedido Cancelado',
    icon: '🚫',
    bg: 'bg-red-50',
    border: 'border-red-300',
    color: 'text-red-700',
    nextAction: null,
    nextBtnClass: '',
  },
};

function StatusProgressBar({ status }: { status: TransactionStatus }) {
  // La barra de progreso solo aplica al flujo normal (no CANCELLED)
  const currentIdx = STATUS_STEPS.indexOf(status);
  return (
    <div className="flex items-start w-full mt-4 mb-2">
      {STATUS_STEPS.map((s, idx) => {
        const meta = STATUS_META[s];
        const done = idx < currentIdx;
        const active = idx === currentIdx;
        return (
          <React.Fragment key={s}>
            <div className="flex flex-col items-center flex-1 min-w-0">
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center text-base font-bold border-2 transition-all ${
                  done
                    ? 'bg-[#e86b07] border-[#e86b07] text-white'
                    : active
                    ? `${meta.bg} ${meta.border} ${meta.color}`
                    : 'bg-gray-100 border-gray-200 text-gray-400'
                }`}
              >
                {done ? '✓' : active ? meta.icon : idx + 1}
              </div>
              <span
                className={`text-[10px] mt-1 text-center px-0.5 leading-tight ${
                  active ? meta.color + ' font-bold' : done ? 'text-[#e86b07] font-semibold' : 'text-gray-400'
                }`}
              >
                {meta.label}
              </span>
            </div>
            {idx < STATUS_STEPS.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-1 mt-5 ${idx < currentIdx ? 'bg-[#e86b07]' : 'bg-gray-200'}`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('es-ES', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function OrderDetailPage() {
  const params = useParams();
  const id = Number(params.id);

  const [order, setOrder] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [advancing, setAdvancing] = useState(false);

  // Estado para el panel de cancelación admin
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelNote, setCancelNote] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!id) return;
    transactionsApi
      .getById(id)
      .then(setOrder)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAdvance = async () => {
    if (!order) return;
    setAdvancing(true);
    try {
      const updated = await transactionsApi.advanceStatus(order.id);
      setOrder(updated);
      const meta = STATUS_META[updated.status];
      toast.success(`Estado actualizado: ${meta.label}`);
    } catch {
      toast.error('No se pudo actualizar el estado');
    } finally {
      setAdvancing(false);
    }
  };

  const handleCancelAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !cancelNote.trim()) return;
    setCancelling(true);
    try {
      const updated = await transactionsApi.adminCancelOrder(order.id, cancelNote.trim());
      setOrder(updated);
      toast.success(`Orden #${order.id} cancelada`);
      setShowCancelForm(false);
      setCancelNote('');
    } catch {
      toast.error('No se pudo cancelar la orden');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-[#e86b07] border-r-transparent" />
          <p className="mt-4 text-gray-600">Cargando orden...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-red-500 text-lg font-semibold mb-4">Orden no encontrada</p>
        <Link href="/to-go/admin/orders" className="text-[#e86b07] hover:underline font-semibold">
          ← Volver a órdenes
        </Link>
      </div>
    );
  }

  const meta = STATUS_META[order.status];
  const isCancelled = order.status === TransactionStatus.CANCELLED;
  const isCompleted = order.status === TransactionStatus.COMPLETED;
  const canCancel = !isCancelled && !isCompleted;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Breadcrumb */}
      <Link
        href="/to-go/admin/orders"
        className="text-sm text-[#e86b07] hover:underline font-semibold mb-6 inline-block"
      >
        ← Volver a órdenes
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Orden <span className="text-[#e86b07]">#{order.id}</span>
        </h1>
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold border-2 ${meta.border} ${meta.color} ${meta.bg}`}
        >
          {meta.icon} {meta.label}
        </span>
      </div>

      {/* Progreso / estado cancelado */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">
          Progreso del pedido
        </h2>

        {isCancelled ? (
          <div className="rounded-lg bg-red-50 border border-red-300 p-4 mt-3">
            <p className="text-base font-bold text-red-700 mb-1">🚫 Este pedido fue cancelado</p>
            {order.cancellationNote ? (
              <p className="text-sm text-red-600">
                <span className="font-semibold">Motivo:</span> {order.cancellationNote}
              </p>
            ) : (
              <p className="text-sm text-red-500 italic">Cancelado por el cliente sin nota.</p>
            )}
            {order.cancelledAt && (
              <p className="text-xs text-red-400 mt-1 capitalize">
                Cancelado el {formatDate(order.cancelledAt)}
              </p>
            )}
          </div>
        ) : (
          <>
            <StatusProgressBar status={order.status} />

            {/* Botón avanzar */}
            {meta.nextAction && (
              <button
                onClick={handleAdvance}
                disabled={advancing}
                className={`mt-6 w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition cursor-pointer ${meta.nextBtnClass} disabled:opacity-60`}
              >
                {advancing ? (
                  <>
                    <span className="h-4 w-4 border-2 border-white border-r-transparent rounded-full animate-spin inline-block" />
                    Actualizando...
                  </>
                ) : (
                  <>▶ {meta.nextAction}</>
                )}
              </button>
            )}
            {isCompleted && (
              <p className="mt-4 text-center text-sm text-gray-500 font-medium">
                🎉 Este pedido ya fue finalizado
              </p>
            )}
          </>
        )}

        {/* Botón / formulario cancelar admin */}
        {canCancel && !showCancelForm && (
          <button
            onClick={() => setShowCancelForm(true)}
            className="mt-4 w-full text-sm text-red-500 hover:text-red-700 font-semibold py-2 border border-red-200 rounded-xl hover:bg-red-50 transition cursor-pointer"
          >
            🚫 Cancelar esta orden
          </button>
        )}

        {canCancel && showCancelForm && (
          <form onSubmit={handleCancelAdmin} className="mt-4 rounded-xl bg-red-50 border border-red-200 p-4 space-y-3">
            <h3 className="text-sm font-bold text-red-700">Cancelar orden #{order.id}</h3>
            <div>
              <label className="block text-xs font-semibold text-red-700 mb-1">
                Motivo de cancelación <span className="text-red-500">*</span>
              </label>
              <textarea
                value={cancelNote}
                onChange={(e) => setCancelNote(e.target.value)}
                placeholder="Ej: Producto no disponible, restaurante cerrado..."
                rows={3}
                maxLength={500}
                className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none bg-white"
              />
              <p className="text-xs text-red-400 text-right">{cancelNote.length}/500</p>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={cancelling || !cancelNote.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-bold py-2 rounded-lg text-sm transition cursor-pointer"
              >
                {cancelling ? 'Cancelando...' : 'Confirmar cancelación'}
              </button>
              <button
                type="button"
                onClick={() => { setShowCancelForm(false); setCancelNote(''); }}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 rounded-lg text-sm transition cursor-pointer"
              >
                Volver
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Info del cliente */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">
          Datos del cliente
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Nombre</p>
            <p className="font-semibold text-gray-900">{order.fullName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Teléfono</p>
            <p className="font-semibold text-gray-900">{order.phone}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Fecha de pedido</p>
            <p className="font-semibold text-gray-900 capitalize">
              {formatDate(order.transactionDate)}
            </p>
          </div>
          {order.pickupTime && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Hora de recogida</p>
              <p className="font-semibold text-gray-900 capitalize">
                {formatDate(order.pickupTime)}
              </p>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total</p>
            <p className="text-2xl font-bold text-[#e86b07]">
              {Number(order.total).toFixed(2)}€
            </p>
          </div>
        </div>
      </div>

      {/* Productos */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">
            Productos ({order.contents?.length ?? 0})
          </h2>
        </div>

        <div className="divide-y divide-gray-100">
          {order.contents?.map((item) => (
            <div key={item.id} className="flex items-center gap-4 p-4">
              <div className="relative h-16 w-16 shrink-0 rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={getImageUrl(item.product.image)}
                  alt={item.product.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{item.product.name}</p>
                <p className="text-sm text-gray-500">
                  {Number(item.price).toFixed(2)}€ × {item.quantity}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">
                  {(Number(item.price) * item.quantity).toFixed(2)}€
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
          <span className="font-bold text-gray-800 text-lg">Total de la orden</span>
          <span className="text-2xl font-bold text-[#e86b07]">
            {Number(order.total).toFixed(2)}€
          </span>
        </div>
      </div>
    </div>
  );
}
