'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { productsApi, categoriesApi } from '@/lib/api';
import { Product } from '@/lib/types';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    inactiveProducts: 0,
    totalCategories: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [products, categories] = await Promise.all([
        productsApi.getAll({ take: 1000 }),
        categoriesApi.getAll(),
      ]);

      setStats({
        totalProducts: products.length,
        activeProducts: products.filter((p) => p.status).length,
        inactiveProducts: products.filter((p) => !p.status).length,
        totalCategories: categories.length,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({
    title,
    value,
    color,
    icon,
  }: {
    title: string;
    value: number;
    color: string;
    icon: string;
  }) => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
        </div>
        <div className={`text-5xl ${color}`}>{icon}</div>
      </div>
    </div>
  );

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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Productos"
          value={stats.totalProducts}
          color="text-[#e86b07]"
          icon="📦"
        />
        <StatCard
          title="Productos Activos"
          value={stats.activeProducts}
          color="text-green-600"
          icon="✅"
        />
        <StatCard
          title="Productos Inactivos"
          value={stats.inactiveProducts}
          color="text-red-600"
          icon="❌"
        />
        <StatCard
          title="Categorías"
          value={stats.totalCategories}
          color="text-[#1c0bdb]"
          icon="📁"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/to-go/admin/products/new"
            className="btn-primary text-center py-4"
          >
            ➕ Nuevo Producto
          </Link>
          <Link
            href="/to-go/admin/products"
            className="btn-secondary text-center py-4"
          >
            📋 Ver Productos
          </Link>
          <Link
            href="/to-go/admin/orders"
            className="btn-outline text-center py-4"
          >
            🛒 Ver Órdenes
          </Link>
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-8 bg-gradient-to-r from-[#e86b07] to-[#1c0bdb] rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Bienvenido al Panel de Administración</h2>
        <p className="text-lg">
          Desde aquí puedes gestionar todos los productos y órdenes de Kaos To Go.
        </p>
      </div>
    </div>
  );
}
