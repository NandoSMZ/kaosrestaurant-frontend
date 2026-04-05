'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useCart } from '@/contexts/CartContext';
import { getImageUrl, transactionsApi, schedulesApi } from '@/lib/api';
import { Transaction, Schedule } from '@/lib/types';
import { toast } from 'react-toastify';

type Step = 'cart' | 'checkout' | 'success';



export default function CartSidebar() {
  const { items, removeItem, updateQuantity, total, itemCount, isOpen, closeCart, clearCart } =
    useCart();

  const [step, setStep] = useState<Step>('cart');
  const [fullName, setFullName] = useState('');
  const [phoneCountry, setPhoneCountry] = useState('34');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [errors, setErrors] = useState<{ fullName?: string; phone?: string; pickupTime?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Transaction | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);

  // Tiempo mínimo: 20 min. Default pre-cargado: 60 min (margen para llenar el formulario)
  const getMinPickupTime = () => {
    const d = new Date(Date.now() + 20 * 60 * 1000);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const getDefaultPickupTime = () => {
    const d = new Date(Date.now() + 60 * 60 * 1000);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // Cargar horarios semanales al abrir el checkout
  useEffect(() => {
    if (step === 'checkout') {
      setLoadingSchedules(true);
      schedulesApi
        .getAll()
        .then(setSchedules)
        .catch(() => setSchedules([]))
        .finally(() => setLoadingSchedules(false));
    }
  }, [step]);

  /** Obtiene el horario correspondiente al día del pickupTime seleccionado */
  const getScheduleForPickup = (pickupValue: string): Schedule | undefined => {
    if (!pickupValue || schedules.length === 0) return undefined;
    const d = new Date(pickupValue);
    // JS getDay(): Dom=0..Sáb=6  →  nuestro convenio: Lun=0..Dom=6
    const dayOfWeek = (d.getDay() + 6) % 7;
    return schedules.find((s) => s.dayOfWeek === dayOfWeek);
  };

  /** Avanza al checkout pre-cargando el mínimo de recogida */
  const handleGoToCheckout = () => {
    setPickupTime(getDefaultPickupTime());
    setErrors({});
    setStep('checkout');
  };

  const formatPickupTime = (iso: string) =>
    new Date(iso).toLocaleString('es-ES', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  if (!isOpen) return null;

  const handleClose = () => {
    if (step !== 'success') {
      setStep('cart');
      setFullName('');
      setPhoneNumber('');
      setPickupTime('');
      setErrors({});
    }
    closeCart();
  };

  const handleCloseSuccess = () => {
    setStep('cart');
    setFullName('');
    setPhoneNumber('');
    setPickupTime('');
    setErrors({});
    setConfirmedOrder(null);
    closeCart();
  };

  const validate = (): boolean => {
    const newErrors: { fullName?: string; phone?: string; pickupTime?: string } = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'El nombre completo es obligatorio';
    }
    if (!phoneCountry.trim() || !/^\d{1,4}$/.test(phoneCountry.trim())) {
      newErrors.phone = 'Ingresa un indicativo de país válido (solo dígitos, ej: 34)';
    } else if (!phoneNumber.trim()) {
      newErrors.phone = 'El teléfono es obligatorio';
    } else if (!/^[\d\s]{4,17}$/.test(phoneNumber.trim())) {
      newErrors.phone = 'Ingresa solo los dígitos locales, sin indicativo. Mínimo 4 dígitos.';
    }
    if (!pickupTime) {
      newErrors.pickupTime = 'Selecciona la hora de recogida';
    } else if (new Date(pickupTime) < new Date(Date.now() + 18 * 60 * 1000)) {
      newErrors.pickupTime = 'La hora debe ser al menos 20 minutos a partir de ahora';
    } else {
      // Solo validamos si el DÍA está activo — la franja horaria la valida el backend
      // (el frontend no conoce la timezone del restaurante)
      const schedule = getScheduleForPickup(pickupTime);
      if (schedules.length > 0 && (!schedule || !schedule.isActive)) {
        const dayName = new Date(pickupTime).toLocaleDateString('es-ES', { weekday: 'long' });
        newErrors.pickupTime = `La tienda no abre los ${dayName}s. Consulta los horarios disponibles.`;
      }
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
        phone: `+${phoneCountry} ${phoneNumber.trim()}`,
        pickupTime: new Date(pickupTime).toISOString(),
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
    <div className="relative z-70">
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
                        <div className="relative h-20 w-20 shrink-0 rounded overflow-hidden">
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
                            {Number(item.product.price).toFixed(2)}€
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
                          {(Number(item.product.price) * item.quantity).toFixed(2)}€
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
                  <span className="text-2xl font-bold text-[#e86b07]">{total.toFixed(2)}€</span>
                </div>
                <button
                  onClick={handleGoToCheckout}
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
              {/* Horarios de la tienda */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                <p className="text-sm font-bold text-amber-800 mb-2">🕐 Horarios de recogida</p>
                {loadingSchedules ? (
                  <div className="flex items-center gap-2 text-xs text-amber-600">
                    <span className="h-3 w-3 border-2 border-amber-500 border-r-transparent rounded-full animate-spin inline-block" />
                    Cargando horarios...
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                    {schedules.map((s) => (
                      <div key={s.id} className="flex justify-between text-xs py-0.5">
                        <span className={`font-medium ${s.isActive ? 'text-amber-900' : 'text-gray-400'}`}>
                          {s.dayName}
                        </span>
                        <span className={s.isActive ? 'text-amber-700' : 'text-gray-400'}>
                          {s.isActive ? `${s.openTime}–${s.closeTime}` : 'Cerrado'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
                        {(Number(item.product.price) * item.quantity).toFixed(2)}€
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-300 mt-3 pt-3 flex justify-between font-bold text-gray-900">
                  <span>Total:</span>
                  <span className="text-[#e86b07]">{total.toFixed(2)}€</span>
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
                  <div className={`flex rounded-lg border overflow-hidden focus-within:ring-2 focus-within:ring-[#e86b07] ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}>
                    {/* Prefijo + fijo */}
                    <span className="flex items-center bg-gray-50 border-r border-gray-300 pl-3 pr-1 text-sm font-semibold text-gray-500 select-none">
                      +
                    </span>
                    {/* Input indicativo: solo dígitos, max 4 chars */}
                    <input
                      type="tel"
                      value={phoneCountry}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                        setPhoneCountry(val);
                        if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                      }}
                      placeholder="34"
                      className="w-12 px-1 py-2 text-sm text-center focus:outline-none bg-gray-50 border-r border-gray-300"
                    />
                    {/* Número local */}
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^\d\s]/g, '');
                        setPhoneNumber(val);
                        if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                      }}
                      placeholder="612 345 678"
                      className="flex-1 px-3 py-2 text-sm focus:outline-none min-w-0"
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    Número completo: <span className="font-medium text-gray-600">+{phoneCountry || '··'} {phoneNumber || '...'}</span>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    ¿Cuándo pasarás a recoger? <span className="text-red-500">*</span>
                  </label>
                  {/* Aviso mínimo siempre visible */}
                  <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 mb-2">
                    <span className="text-amber-500 text-sm">⏱</span>
                    <p className="text-xs text-amber-700 font-medium">
                      El pedido debe programarse con al menos <strong>20 minutos</strong> de antelación.
                    </p>
                  </div>
                  <input
                    type="datetime-local"
                    value={pickupTime}
                    min={getMinPickupTime()}
                    onChange={(e) => {
                      setPickupTime(e.target.value);
                      if (errors.pickupTime) setErrors((prev) => ({ ...prev, pickupTime: undefined }));
                    }}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e86b07] ${
                      errors.pickupTime ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.pickupTime && (
                    <p className="text-red-500 text-xs mt-1">{errors.pickupTime}</p>
                  )}
                  {/* Indicador en tiempo real del horario del día seleccionado */}
                  {pickupTime && schedules.length > 0 && (() => {
                    const sch = getScheduleForPickup(pickupTime);
                    if (!sch) return null;
                    return (
                      <p className={`text-xs mt-1 ${sch.isActive ? 'text-green-600' : 'text-red-500'}`}>
                        {sch.isActive
                          ? `✓ ${sch.dayName}: abrimos de ${sch.openTime} a ${sch.closeTime}`
                          : `✗ La tienda no abre los ${sch.dayName.toLowerCase()}s`}
                      </p>
                    );
                  })()}
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
                {confirmedOrder.pickupTime && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Recogida:</span>
                    <span className="font-semibold text-right text-xs capitalize">
                      {formatPickupTime(confirmedOrder.pickupTime)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-bold text-[#e86b07] text-base">
                    {Number(confirmedOrder.total).toFixed(2)}€
                  </span>
                </div>
              </div>

              {/* Estado inicial */}
              <div className="w-full bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800 font-medium text-center mb-2">
                🕐 Restaurante confirmando tu pedido...
              </div>
              <p className="text-xs text-gray-400 text-center mb-4">
                Usa <strong>Seguir Pedido</strong> para ver el estado en tiempo real
              </p>

              <div className="w-full space-y-1">
                {confirmedOrder.contents?.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between text-sm text-gray-600 py-1 border-b border-gray-100"
                  >
                    <span>
                      {item.product.name} × {item.quantity}
                    </span>
                    <span>{(Number(item.price) * item.quantity).toFixed(2)}€</span>
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
