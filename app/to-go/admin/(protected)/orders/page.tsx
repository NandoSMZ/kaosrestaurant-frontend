'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { transactionsApi } from '@/lib/api';
import { Transaction } from '@/lib/types';
import { toast } from 'react-toastify';
import { useNotifications } from '@/contexts/NotificationsContext';

const POLL_INTERVAL = 10_000;

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);
  const { markAllAsRead } = useNotifications();

  const fetchOrders = useCallback(async (silent = false) => {
    try {
      const data = await transactionsApi.getAll();
      if (mountedRef.current) setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      if (!silent) toast.error('Error al cargar las órdenes');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    markAllAsRead(); // Al entrar a órdenes, marcar todo como leído
    fetchOrders();
    const id = setInterval(() => fetchOrders(true), POLL_INTERVAL);
    return () => {
      mountedRef.current = false;
      clearInterval(id);
    };
  }, [fetchOrders, markAllAsRead]);

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
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Órdenes</h1>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="inline-block h-2 w-2 rounded-full bg-green-400 animate-pulse" />
          Actualización automática cada 10 s
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="text-5xl mb-4">📋</div>
          <h2 className="text-xl font-bold text-gray-700 mb-2">Sin órdenes todavía</h2>
          <p className="text-gray-500">Las órdenes realizadas desde To-Go aparecerán aquí.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">#</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Cliente</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Teléfono</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Productos</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Total</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Fecha</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-bold text-[#e86b07]">#{order.id}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{order.fullName}</td>
                    <td className="px-4 py-3 text-gray-600">{order.phone}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {order.contents?.length ?? 0} ítem{(order.contents?.length ?? 0) !== 1 ? 's' : ''}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">
                      ${Number(order.total).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {formatDate(order.transactionDate)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Link
                        href={`/to-go/admin/orders/${order.id}`}
                        className="inline-block bg-[#e86b07] hover:bg-[#d05f06] text-white text-xs font-semibold px-3 py-1 rounded transition"
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-gray-100">
            {orders.map((order) => (
              <div key={order.id} className="p-4">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-[#e86b07]">#{order.id}</span>
                  <span className="font-bold text-gray-900">${Number(order.total).toFixed(2)}</span>
                </div>
                <p className="font-semibold text-gray-800">{order.fullName}</p>
                <p className="text-sm text-gray-500">{order.phone}</p>
                <p className="text-xs text-gray-400 mt-1">{formatDate(order.transactionDate)}</p>
                <Link
                  href={`/to-go/admin/orders/${order.id}`}
                  className="mt-2 inline-block bg-[#e86b07] hover:bg-[#d05f06] text-white text-xs font-semibold px-3 py-1 rounded transition"
                >
                  Ver detalle
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
