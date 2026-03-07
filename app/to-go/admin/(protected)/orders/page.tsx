'use client';

import React from 'react';

export default function OrdersPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Gestión de Órdenes</h1>

      {/* Under Development Notice */}
      <div className="bg-gradient-to-r from-[#e86b07] to-[#1c0bdb] rounded-lg p-12 text-white text-center">
        <div className="text-6xl mb-4">🚧</div>
        <h2 className="text-3xl font-bold mb-4">Funcionalidad en Desarrollo</h2>
        <p className="text-lg mb-6">
          El sistema de gestión de órdenes estará disponible próximamente.
        </p>
        <p className="text-sm opacity-90">
          Esta funcionalidad permitirá visualizar, gestionar y actualizar el estado de las órdenes en tiempo real.
        </p>
      </div>

      {/* Future Features Preview */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-4xl mb-3">📋</div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Lista de Órdenes</h3>
          <p className="text-sm text-gray-600">
            Visualiza todas las órdenes recibidas con su estado actual y detalles del cliente.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-4xl mb-3">🔔</div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Notificaciones</h3>
          <p className="text-sm text-gray-600">
            Recibe alertas en tiempo real cuando se realicen nuevas órdenes.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-4xl mb-3">📊</div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Reportes</h3>
          <p className="text-sm text-gray-600">
            Accede a estadísticas y reportes de ventas por período.
          </p>
        </div>
      </div>
    </div>
  );
}
