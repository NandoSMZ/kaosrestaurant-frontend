'use client';

import React from 'react';
import Image from 'next/image';
import { useCart } from '@/contexts/CartContext';
import { getImageUrl } from '@/lib/api';

export default function CartSidebar() {
  const { items, removeItem, updateQuantity, total, itemCount, isOpen, closeCart } = useCart();

  if (!isOpen) return null;

  const handleOrder = () => {
    alert('Funcionalidad de pedidos en desarrollo. Próximamente podrás realizar tu orden.');
  };

  return (
    <div className="relative z-[70]">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/30"
        onClick={closeCart}
      />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="bg-[#e86b07] text-white p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">Tu Carrito ({itemCount})</h2>
          <button
            onClick={closeCart}
            className="text-2xl hover:text-gray-200 cursor-pointer"
          >
            ×
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <p className="text-lg">Tu carrito está vacío</p>
              <p className="text-sm mt-2">Agrega productos para comenzar tu orden</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.product.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex gap-3">
                    <div className="relative h-20 w-20 flex-shrink-0 rounded overflow-hidden">
                      <Image
                        src={getImageUrl(item.product.image)}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {item.product.name}
                      </h3>
                      <p className="text-[#e86b07] font-bold">
                        ${Number(item.product.price).toFixed(2)}
                      </p>

                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="w-8 h-8 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="w-8 h-8 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold cursor-pointer"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeItem(item.product.id)}
                          className="ml-auto text-red-500 hover:text-red-700 text-sm font-semibold cursor-pointer"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-bold">
                      ${(Number(item.product.price) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-bold text-gray-900">Total:</span>
              <span className="text-2xl font-bold text-[#e86b07]">
                ${total.toFixed(2)}
              </span>
            </div>

            <button
              onClick={handleOrder}
              className="w-full btn-primary text-lg py-3"
            >
              Realizar Pedido
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
