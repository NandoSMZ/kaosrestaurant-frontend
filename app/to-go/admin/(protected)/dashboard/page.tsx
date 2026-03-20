'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { productsApi, categoriesApi, transactionsApi } from '@/lib/api';
import { TransactionStatus } from '@/lib/types';

const STATUS_LABELS: Record<TransactionStatus, string> = {
  [TransactionStatus.PENDING]: '🕐 Pendientes',
  [TransactionStatus.PREPARING]: '👨‍🍳 Preparando',
  [TransactionStatus.READY]: '✅ Listas',
  [TransactionStatus.COMPLETED]: '🎉 Completadas',
  [TransactionStatus.CANCELLED]: '🚫 Canceladas',
};

const STATUS_COLORS: Record<TransactionStatus, string> = {
  [TransactionStatus.PENDING]: 'text-yellow-600',
  [TransactionStatus.PREPARING]: 'text-blue-600',
  [TransactionStatus.READY]: 'text-green-600',
  [TransactionStatus.COMPLETED]: 'text-gray-500',
  [TransactionStatus.CANCELLED]: 'text-red-600',
};

const STATUS_BG: Record<TransactionStatus, string> = {
  [TransactionStatus.PENDING]: 'bg-yellow-50 border-yellow-200',
  [TransactionStatus.PREPARING]: 'bg-blue-50 border-blue-200',
  [TransactionStatus.READY]: 'bg-green-50 border-green-200',
  [TransactionStatus.COMPLETED]: 'bg-gray-50 border-gray-200',
  [TransactionStatus.CANCELLED]: 'bg-red-50 border-red-200',
};

export default function DashboardPage() {
  const [productStats, setProductStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    inactiveProducts: 0,
    totalCategories: 0,
  });

  const [orderCounts, setOrderCounts] = useState<Record<TransactionStatus, number>>({
    [TransactionStatus.PENDING]: 0,
    [TransactionStatus.PREPARING]: 0,
    [TransactionStatus.READY]: 0,
    [TransactionStatus.COMPLETED]: 0,
    [TransactionStatus.CANCELLED]: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [products, categories, orders] = await Promise.all([
          productsApi.getAll({ take: 1000 }),
          categoriesApi.getAll(),
          transactionsApi.getAll(),
        ]);
        setProductStats({
          totalProducts: products.length,
          activeProducts: products.filter((p) => p.status).length,
          inactiveProducts: products.filter((p) => !p.status).length,
          totalCategories: categories.length,
        });
        const counts: Record<TransactionStatus, number> = {
          [TransactionStatus.PENDING]: 0,
          [TransactionStatus.PREPARING]: 0,
          [TransactionStatus.READY]: 0,
          [TransactionStatus.COMPLETED]: 0,
          [TransactionStatus.CANCELLED]: 0,
        };
        for (const o of orders) {
          if (o.status in counts) counts[o.status as TransactionStatus]++;
        }
        setOrderCounts(counts);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-[#e86b07] border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  const activeOrders =
    orderCounts[TransactionStatus.PENDING] +
    orderCounts[TransactionStatus.PREPARING] +
    orderCounts[TransactionStatus.READY];

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

      {/* ── Resumen en vivo ── */}
      <section>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Resumen en vivo</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {(Object.values(TransactionStatus) as TransactionStatus[]).map((status) => (
            <div
              key={status}
              className={`rounded-lg border p-5 flex flex-col gap-1 ${STATUS_BG[status]}`}
            >
              <span className="text-sm text-gray-500">{STATUS_LABELS[status]}</span>
              <span className={`text-4xl font-bold ${STATUS_COLORS[status]}`}>
                {orderCounts[status]}
              </span>
              <span className="text-xs text-gray-400">órdenes</span>
            </div>
          ))}
        </div>
        {activeOrders > 0 && (
          <p className="mt-3 text-sm text-[#e86b07] font-medium">
            ⚡ {activeOrders} orden{activeOrders !== 1 ? 'es' : ''} activa
            {activeOrders !== 1 ? 's' : ''} en este momento
          </p>
        )}
      </section>

      {/* ── Catálogo ── */}
      <section>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Catálogo</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-md p-5">
            <p className="text-sm text-gray-500 mb-1">Total Productos</p>
            <p className="text-3xl font-bold text-[#e86b07]">{productStats.totalProducts}</p>
            <p className="text-2xl mt-1">📦</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-5">
            <p className="text-sm text-gray-500 mb-1">Productos Activos</p>
            <p className="text-3xl font-bold text-green-600">{productStats.activeProducts}</p>
            <p className="text-2xl mt-1">✅</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-5">
            <p className="text-sm text-gray-500 mb-1">Productos Inactivos</p>
            <p className="text-3xl font-bold text-red-500">{productStats.inactiveProducts}</p>
            <p className="text-2xl mt-1">❌</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-5">
            <p className="text-sm text-gray-500 mb-1">Categorías</p>
            <p className="text-3xl font-bold text-[#1c0bdb]">{productStats.totalCategories}</p>
            <p className="text-2xl mt-1">📁</p>
          </div>
        </div>
      </section>

      {/* ── Acciones rápidas ── */}
      <section className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/to-go/admin/products/new" className="btn-primary text-center py-4">
            ➕ Nuevo Producto
          </Link>
          <Link href="/to-go/admin/products" className="btn-secondary text-center py-4">
            📋 Ver Productos
          </Link>
          <Link href="/to-go/admin/orders" className="btn-outline text-center py-4">
            🛒 Ver Órdenes
          </Link>
          <Link href="/to-go/admin/stats" className="btn-outline text-center py-4">
            📊 Estadísticas
          </Link>
        </div>
      </section>
    </div>
  );
}
