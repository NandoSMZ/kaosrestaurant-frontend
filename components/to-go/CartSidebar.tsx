'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useCart } from '@/contexts/CartContext';
import { getImageUrl, transactionsApi } from '@/lib/api';
import { Transaction } from '@/lib/types';
import { toast } from 'react-toastify';

type Step = 'cart' | 'checkout' | 'success';

export default function CartSidebar() {
  const { items, removeItem, updateQuantity, total, itemCount, isOpen, closeCart, clearCart } =
    useCart();

  const [step, setStep] = useState<Step>('cart');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<{ fullName?: string; phone?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Transaction | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    if (step !== 'success') {
      setStep('cart');
      setFullName('');
      setPhone('');
      setErrors({});
    }
    closeCart();
  };

  const handleCloseSuccess = () => {
    setStep('cart');
    setFullName('');
    setPhone('');
    setErrors({});
    setConfirmedOrder(null);
    closeCart();
  };

  const validate = (): boolean => {
    const newErrors: { fullName?: string; phone?: string } = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'El nombre completo es obligatorio';
    }
    if (!phone.trim()) {
      newErrors.phone = 'El teléfono es obligatorio';
    } else if (!/^[0-9+\s\-()]{6,20}$/.test(phone.trim())) {
      newErrors.phone = 'Ingresa un teléfono válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirmOrder = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const order = await transactionsApi.create({
        fullName: fullName.trim(),
        phone: phone.trim(),
        contents: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
      });

      setConfirmedOrder(order);
      setStep('success');
      clearCart();
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Ocurrió un error al crear tu orden. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative z-[70]">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/30" onClick={handleClose} />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="bg-[#e86b07] text-white p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">
            {step === 'cart' && `Tu Carrito (${itemCount})`}
            {step === 'checkout' && 'Confirmar Pedido'}
            {step === 'success' && '¡Pedido Confirmado!'}
          </h2>
          <button onClick={handleClose} className="text-2xl hover:text-gray-200 cursor-pointer">
            ×
          </button>
        </div>

        {/* ── STEP: CART ── */}
        {step === 'cart' && (
          <>
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
                              onClick={() =>
                                updateQuantity(item.product.id, item.quantity - 1)
                              }
                              className="w-8 h-8 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold cursor-pointer"
                            >
                              -
                            </button>
                            <span className="w-8 text-center font-semibold">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(item.product.id, item.quantity + 1)
                              }
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

            {items.length > 0 && (
              <div className="border-t border-gray-200 p-4 bg-gray-50">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-bold text-gray-900">Total:</span>
                  <span className="text-2xl font-bold text-[#e86b07]">${total.toFixed(2)}</span>
                </div>
                <button
                  onClick={() => setStep('checkout')}
                  className="w-full bg-[#e86b07] hover:bg-[#d05f06] text-white font-bold text-lg py-3 rounded-lg transition cursor-pointer"
                >
                  Realizar Pedido
                </button>
              </div>
            )}
          </>
        )}

        {/* ── STEP: CHECKOUT ── */}
        {step === 'checkout' && (
          <>
            <div className="flex-1 overflow-y-auto p-4">
              {/* Resumen */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-bold text-gray-700 mb-2">Resumen de tu orden</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  {items.map((item) => (
                    <div key={item.product.id} className="flex justify-between">
                      <span>
                        {item.product.name} × {item.quantity}
                      </span>
                      <span className="font-semibold">
                        ${(Number(item.product.price) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-300 mt-3 pt-3 flex justify-between font-bold text-gray-900">
                  <span>Total:</span>
                  <span className="text-[#e86b07]">${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Formulario */}
              <div className="space-y-4">
                <h3 className="font-bold text-gray-800 text-lg">Tus datos de contacto</h3>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Nombre completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (errors.fullName)
                        setErrors((prev) => ({ ...prev, fullName: undefined }));
                    }}
                    placeholder="Ej: Juan García"
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e86b07] ${
                      errors.fullName ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.fullName && (
                    <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Teléfono <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                    }}
                    placeholder="Ej: 612 345 678"
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e86b07] ${
                      errors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 p-4 bg-gray-50 space-y-3">
              <button
                onClick={handleConfirmOrder}
                disabled={isSubmitting}
                className="w-full bg-[#e86b07] hover:bg-[#d05f06] disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold text-lg py-3 rounded-lg transition cursor-pointer"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-r-transparent" />
                    Enviando...
                  </span>
                ) : (
                  'Confirmar Pedido'
                )}
              </button>
              <button
                onClick={() => setStep('cart')}
                disabled={isSubmitting}
                className="w-full border border-gray-300 text-gray-700 hover:bg-gray-100 font-semibold py-2 rounded-lg transition cursor-pointer text-sm"
              >
                ← Volver al carrito
              </button>
            </div>
          </>
        )}

        {/* ── STEP: SUCCESS ── */}
        {step === 'success' && confirmedOrder && (
          <>
            <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
              <div className="text-6xl mb-4 mt-4">🎉</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">
                ¡Pedido recibido!
              </h3>
              <p className="text-gray-500 text-center mb-6">
                Nos pondremos en contacto contigo al número{' '}
                <span className="font-semibold text-gray-800">{confirmedOrder.phone}</span> para
                confirmar tu orden.
              </p>

              <div className="w-full bg-gray-50 rounded-lg p-4 space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">N° de orden:</span>
                  <span className="font-bold text-gray-900">#{confirmedOrder.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cliente:</span>
                  <span className="font-semibold">{confirmedOrder.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-bold text-[#e86b07] text-base">
                    ${Number(confirmedOrder.total).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="w-full space-y-1">
                {confirmedOrder.contents?.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between text-sm text-gray-600 py-1 border-b border-gray-100"
                  >
                    <span>
                      {item.product.name} × {item.quantity}
                    </span>
                    <span>${(Number(item.price) * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 p-4">
              <button
                onClick={handleCloseSuccess}
                className="w-full bg-[#e86b07] hover:bg-[#d05f06] text-white font-bold py-3 rounded-lg transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
