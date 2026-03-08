'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { transactionsApi, getImageUrl } from '@/lib/api';
import { Transaction } from '@/lib/types';

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

  useEffect(() => {
    if (!id) return;
    transactionsApi
      .getById(id)
      .then(setOrder)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

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
        <Link
          href="/to-go/admin/orders"
          className="text-[#e86b07] hover:underline font-semibold"
        >
          ← Volver a órdenes
        </Link>
      </div>
    );
  }

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
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Fecha</p>
            <p className="font-semibold text-gray-900 capitalize">
              {formatDate(order.transactionDate)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total</p>
            <p className="text-2xl font-bold text-[#e86b07]">
              ${Number(order.total).toFixed(2)}
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
              <div className="relative h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
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
                  ${Number(item.price).toFixed(2)} × {item.quantity}
                </p>
              </div>

              <div className="text-right">
                <p className="font-bold text-gray-900">
                  ${(Number(item.price) * item.quantity).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
          <span className="font-bold text-gray-800 text-lg">Total de la orden</span>
          <span className="text-2xl font-bold text-[#e86b07]">
            ${Number(order.total).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
