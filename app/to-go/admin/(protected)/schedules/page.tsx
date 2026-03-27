'use client';

import React, { useEffect, useState } from 'react';
import { schedulesApi } from '@/lib/api';
import { Schedule } from '@/lib/types';
import { toast } from 'react-toastify';

const DAY_ICONS: Record<number, string> = {
  0: '☀️',
  1: '🌙',
  2: '🌙',
  3: '🌙',
  4: '🍴',
  5: '🍴',
  6: '🍴',
};

function timeToMinutes(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function ScheduleRow({
  schedule,
  onSaved,
}: {
  schedule: Schedule;
  onSaved: (updated: Schedule) => void;
}) {
  const [openTime, setOpenTime] = useState(schedule.openTime);
  const [closeTime, setCloseTime] = useState(schedule.closeTime);
  const [isActive, setIsActive] = useState(schedule.isActive);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const hasTimeError =
    isActive &&
    openTime &&
    closeTime &&
    timeToMinutes(openTime) >= timeToMinutes(closeTime);

  const handleToggle = async () => {
    const next = !isActive;
    setIsActive(next);
    setDirty(true);
  };

  const handleSave = async () => {
    if (hasTimeError) {
      toast.error('La apertura debe ser anterior al cierre');
      return;
    }
    setSaving(true);
    try {
      const updated = await schedulesApi.update(schedule.id, {
        openTime,
        closeTime,
        isActive,
      });
      onSaved(updated);
      setDirty(false);
      toast.success(`Horario de ${schedule.dayName} guardado`);
    } catch {
      toast.error('Error al guardar el horario');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setOpenTime(schedule.openTime);
    setCloseTime(schedule.closeTime);
    setIsActive(schedule.isActive);
    setDirty(false);
  };

  return (
    <div
      className={`bg-white rounded-xl border shadow-sm p-5 transition-all ${
        isActive ? 'border-[#e86b07]/40' : 'border-gray-200 opacity-75'
      }`}
    >
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Día */}
        <div className="flex items-center gap-3 min-w-35">
          <span className="text-2xl">{DAY_ICONS[schedule.dayOfWeek]}</span>
          <div>
            <p className="font-bold text-gray-900">{schedule.dayName}</p>
            <p className="text-xs text-gray-400">Día {schedule.dayOfWeek === 0 ? 7 : schedule.dayOfWeek}</p>
          </div>
        </div>

        {/* Horario */}
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Apertura</label>
            <input
              type="time"
              value={openTime}
              disabled={!isActive}
              onChange={(e) => {
                setOpenTime(e.target.value);
                setDirty(true);
              }}
              className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#e86b07] disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>
          <span className="text-gray-400 mt-5">→</span>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Cierre</label>
            <input
              type="time"
              value={closeTime}
              disabled={!isActive}
              onChange={(e) => {
                setCloseTime(e.target.value);
                setDirty(true);
              }}
              className={`border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#e86b07] disabled:bg-gray-50 disabled:text-gray-400 ${
                hasTimeError ? 'border-red-400' : ''
              }`}
            />
          </div>
          {hasTimeError && (
            <p className="text-xs text-red-500 mt-5 self-end">
              La apertura debe ser anterior al cierre
            </p>
          )}
        </div>

        {/* Toggle + botones */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">{isActive ? 'Activo' : 'Inactivo'}</span>
            <button
              onClick={handleToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#e86b07] focus:ring-offset-2 cursor-pointer ${
                isActive ? 'bg-[#e86b07]' : 'bg-gray-300'
              }`}
              aria-label={isActive ? 'Desactivar' : 'Activar'}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isActive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {dirty && (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving || !!hasTimeError}
                className="px-4 py-1.5 bg-[#e86b07] hover:bg-[#d05e00] disabled:bg-orange-300 text-white text-sm font-semibold rounded-lg transition cursor-pointer"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-semibold rounded-lg transition cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    schedulesApi
      .getAll()
      .then(setSchedules)
      .catch(() => toast.error('Error al cargar los horarios'))
      .finally(() => setLoading(false));
  }, []);

  const handleSaved = (updated: Schedule) => {
    setSchedules((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-[#e86b07] border-r-transparent" />
          <p className="mt-4 text-gray-600">Cargando horarios...</p>
        </div>
      </div>
    );
  }

  const activeCount = schedules.filter((s) => s.isActive).length;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Horarios</h1>
        <p className="text-gray-500 mt-1">
          {activeCount} día{activeCount !== 1 ? 's' : ''} activo{activeCount !== 1 ? 's' : ''} —
          las órdenes solo se pueden crear durante los horarios activos
        </p>
      </div>

      {/* Info */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-800 flex gap-2">
        <span className="text-lg">⚠️</span>
        <p>
          Los cambios se aplican inmediatamente. Desactiva un día para impedir pedidos ese día,
          o modifica las horas de apertura y cierre según necesites.
        </p>
      </div>

      {/* Lista de días */}
      <div className="space-y-3">
        {schedules.map((schedule) => (
          <ScheduleRow key={schedule.id} schedule={schedule} onSaved={handleSaved} />
        ))}
      </div>
    </div>
  );
}
