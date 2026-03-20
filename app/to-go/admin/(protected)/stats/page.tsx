'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { transactionsApi } from '@/lib/api';
import { TransactionStatus, TransactionStats } from '@/lib/types';

function toLocalISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getDefaultRange() {
  const today = new Date();
  const monthAgo = new Date(today);
  monthAgo.setMonth(monthAgo.getMonth() - 1);
  return { from: toLocalISODate(monthAgo), to: toLocalISODate(today) };
}

// Solo mostramos Completadas y Canceladas en el desglose
const VISIBLE_STATUSES = [TransactionStatus.COMPLETED, TransactionStatus.CANCELLED];

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
  [TransactionStatus.COMPLETED]: 'text-gray-600',
  [TransactionStatus.CANCELLED]: 'text-red-600',
};

export default function StatsPage() {
  const defaults = getDefaultRange();
  const [fromDate, setFromDate] = useState(defaults.from);
  const [toDate, setToDate] = useState(defaults.to);
  const [rangeStats, setRangeStats] = useState<TransactionStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchStats = useCallback(async (from: string, to: string) => {
    try {
      setLoading(true);
      setError('');
      const data = await transactionsApi.getStats(from, to);
      setRangeStats(data);
    } catch {
      setError('No se pudieron cargar las estadísticas. Verifica la conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Carga automática al montar con el rango por defecto
  useEffect(() => {
    fetchStats(defaults.from, defaults.to);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStats(fromDate, toDate);
  };

  const formatDate = (iso: string) => {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header + selector de rango */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Estadísticas</h1>
          {rangeStats && !loading && (
            <p className="text-sm text-gray-400 mt-1">
              {formatDate(rangeStats.from)} — {formatDate(rangeStats.to)}
            </p>
          )}
        </div>

        {/* Selector de fechas */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-wrap items-end gap-3 bg-white border rounded-xl px-5 py-4 shadow-sm"
        >
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Desde</label>
            <input
              type="date"
              value={fromDate}
              max={toDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e86b07]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Hasta</label>
            <input
              type="date"
              value={toDate}
              min={fromDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e86b07]"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-[#e86b07] hover:bg-[#d05e00] disabled:bg-orange-300 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
          >
            {loading ? 'Consultando...' : 'Consultar'}
          </button>
        </form>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-3 text-gray-500 py-10 justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#e86b07] border-r-transparent" />
          <span>Cargando estadísticas…</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Resultados */}
      {rangeStats && !loading && (
        <div className="space-y-6">
          {/* Totales destacados */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-linear-to-br from-[#fff7f0] to-[#ffe8d5] border border-[#f7c09b] rounded-xl p-6 text-center shadow-sm">
              <p className="text-sm text-gray-500 mb-2">Órdenes completadas</p>
              <p className="text-5xl font-black text-[#e86b07]">{rangeStats.totalOrders}</p>
              <p className="text-xs text-gray-400 mt-1">en el período</p>
            </div>
            <div className="bg-linear-to-br from-[#f0f4ff] to-[#dce4ff] border border-[#c0ccf7] rounded-xl p-6 text-center shadow-sm">
              <p className="text-sm text-gray-500 mb-2">Ingresos totales</p>
              <p className="text-5xl font-black text-[#1c0bdb]">
                {rangeStats.totalRevenue.toFixed(2)}€
              </p>
              <p className="text-xs text-gray-400 mt-1">EUR · solo completadas</p>
            </div>
          </div>

          {/* Desglose: solo COMPLETED y CANCELLED */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
              <h2 className="font-semibold text-gray-700">Desglose por estado</h2>
              <span className="text-xs text-gray-400">Completadas y canceladas</span>
            </div>
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-gray-400 bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3">Estado</th>
                  <th className="text-right px-6 py-3">Órdenes</th>
                  <th className="text-right px-6 py-3">% del total</th>
                  <th className="text-right px-6 py-3">Ingresos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {VISIBLE_STATUSES.map((status) => {
                  const s = rangeStats.byStatus?.[status] ?? { count: 0, revenue: 0 };
                  const pct =
                    rangeStats.totalOrders > 0
                      ? ((s.count / rangeStats.totalOrders) * 100).toFixed(1)
                      : '0.0';
                  return (
                    <tr key={status} className="hover:bg-gray-50 transition-colors">
                      <td className={`px-6 py-4 font-semibold ${STATUS_COLORS[status]}`}>
                        {STATUS_LABELS[status]}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-700 font-medium">{s.count}</td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-gray-400 text-xs">{pct}%</span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium">
                        {status === TransactionStatus.CANCELLED ? (
                          <span className="text-red-400">—</span>
                        ) : (
                          <span className="text-gray-700">{s.revenue.toFixed(2)}€</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t-2 border-gray-200 bg-gray-50 font-bold text-sm">
                <tr>
                  <td className="px-6 py-3 text-gray-700">Total del período</td>
                  <td className="px-6 py-3 text-right text-gray-900">{rangeStats.totalOrders}</td>
                  <td className="px-6 py-3 text-right text-gray-400 text-xs">100%</td>
                  <td className="px-6 py-3 text-right text-gray-900">
                    {rangeStats.totalRevenue.toFixed(2)}€
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Desglose por día (solo si hay más de 1 día) */}
          {Object.keys(rangeStats.byDay ?? {}).length > 1 && (
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50">
                <h2 className="font-semibold text-gray-700">Desglose por día</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase text-gray-400 bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-6 py-3">Fecha</th>
                      <th className="text-right px-6 py-3">Órdenes</th>
                      <th className="text-right px-6 py-3">Ingresos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {Object.entries(rangeStats.byDay)
                      .sort(([a], [b]) => b.localeCompare(a))
                      .map(([day, data]) => (
                        <tr key={day} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-3 text-gray-700">{formatDate(day)}</td>
                          <td className="px-6 py-3 text-right text-gray-700 font-medium">
                            {data.count}
                          </td>
                          <td className="px-6 py-3 text-right text-gray-700 font-medium">
                            {data.revenue.toFixed(2)}€
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {rangeStats.totalOrders === 0 && (
            <div className="text-center py-10 text-gray-400">
              <div className="text-5xl mb-3">📊</div>
              <p className="text-lg font-medium">Sin órdenes en este período</p>
              <p className="text-sm mt-1">Prueba con un rango de fechas diferente</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

