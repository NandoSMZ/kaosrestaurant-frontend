'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationsContext';
import Image from 'next/image';

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'Ahora mismo';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `Hace ${hours} h`;
}

export default function AdminNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAllAsRead, clearAll, removeOne } = useNotifications();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBellOpen, setIsBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown de campanita al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setIsBellOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBellOpen = () => {
    setIsBellOpen((prev) => !prev);
  };

  const handleNavClick = () => {
    setIsMenuOpen(false);
  };

  const handleGoToOrders = () => {
    markAllAsRead();
    setIsBellOpen(false);
    router.push('/to-go/admin/orders');
  };

  const navItems = [
    { href: '/to-go/admin/dashboard', label: 'Dashboard' },
    { href: '/to-go/admin/products', label: 'Productos' },
    { href: '/to-go/admin/orders', label: 'Órdenes', badge: unreadCount },
    { href: '/to-go/admin/schedules', label: 'Horarios' },
    { href: '/to-go/admin/stats', label: 'Estadísticas' },
  ];

  return (
    <nav className="bg-gray-900 text-white shadow-lg relative z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/to-go/admin/dashboard"
            className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition cursor-pointer"
          >
            <div className="relative h-8 w-8 sm:h-10 sm:w-10">
              <Image src="/images/Logos/apple-icon.png" alt="Kaos" fill className="object-contain" />
            </div>
            <span className="text-lg sm:text-xl font-bold">Kaos Admin</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => item.href === '/to-go/admin/orders' && markAllAsRead()}
                className={`relative font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  pathname === item.href ? 'text-[#e86b07]' : 'text-white hover:text-[#e86b07]'
                }`}
              >
                {item.label}
                {item.badge && item.badge > 0 ? (
                  <span className="inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-red-500 text-white text-xs font-bold leading-none">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                ) : null}
              </Link>
            ))}

            {/* Bell + User */}
            <div className="flex items-center gap-4 border-l border-gray-700 pl-6">
              {/* Campanita */}
              <div ref={bellRef} className="relative">
                <button
                  onClick={handleBellOpen}
                  className="relative p-1.5 rounded-lg hover:bg-gray-700 transition cursor-pointer"
                  aria-label="Notificaciones"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center h-4.5 min-w-4.5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Dropdown de notificaciones */}
                {isBellOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                      <h3 className="font-bold text-gray-800 text-sm">
                        Notificaciones
                        {unreadCount > 0 && (
                          <span className="ml-2 inline-flex items-center justify-center h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-bold">
                            {unreadCount}
                          </span>
                        )}
                      </h3>
                      {notifications.length > 0 && (
                        <button
                          onClick={clearAll}
                          className="text-xs text-[#e86b07] hover:underline cursor-pointer font-semibold"
                        >
                          Limpiar todo
                        </button>
                      )}
                    </div>

                    {/* Lista */}
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-gray-400 text-sm">
                          <div className="text-3xl mb-2">🔔</div>
                          Sin notificaciones
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`flex items-start gap-2 px-4 py-3 border-b border-gray-50 last:border-0 transition group ${
                              !n.read ? 'bg-orange-50 hover:bg-orange-100' : 'bg-white hover:bg-gray-50'
                            }`}
                          >
                            {/* Punto no leído */}
                            {!n.read && (
                              <span className="mt-2 h-2 w-2 rounded-full bg-[#e86b07] shrink-0" />
                            )}

                            {/* Contenido clickeable → navega al detalle */}
                            <button
                              onClick={() => {
                                removeOne(n.id);
                                setIsBellOpen(false);
                                router.push(`/to-go/admin/orders/${n.orderId}`);
                              }}
                              className={`flex-1 min-w-0 text-left cursor-pointer ${n.read ? 'pl-4' : ''}`}
                            >
                              <p className="text-sm font-semibold text-gray-800 truncate">
                                Nueva orden #{n.orderId}
                              </p>
                              <p className="text-xs text-gray-600 truncate">{n.fullName}</p>
                              <div className="flex justify-between items-center mt-0.5">
                                <span className="text-xs text-gray-400">{formatTimeAgo(n.timestamp)}</span>
                                <span className="text-xs font-bold text-[#e86b07]">
                                  {Number(n.total).toFixed(2)}€
                                </span>
                              </div>
                            </button>

                            {/* Botón ✕ para eliminar individualmente */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeOne(n.id);
                              }}
                              className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500 cursor-pointer text-lg leading-none"
                              title="Eliminar notificación"
                            >
                              ×
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
                        <button
                          onClick={handleGoToOrders}
                          className="w-full text-center text-sm font-semibold text-[#e86b07] hover:underline cursor-pointer py-1"
                        >
                          Ver todas las órdenes →
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <span className="text-sm text-gray-300">{user?.username}</span>
              <button
                onClick={logout}
                className="text-sm text-white hover:text-red-400 transition font-semibold cursor-pointer"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>

          {/* Mobile: bell + hamburger */}
          <div className="md:hidden flex items-center gap-2">
            {/* Campanita mobile */}
            <div ref={undefined} className="relative">
              <button
                onClick={handleBellOpen}
                className="relative p-1.5 rounded-lg hover:bg-gray-700 transition cursor-pointer"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
            </div>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-800 transition cursor-pointer"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile dropdown notificaciones */}
        {isBellOpen && (
          <div className="md:hidden border-t border-gray-700 bg-gray-900 py-2">
            {notifications.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">Sin notificaciones</p>
            ) : (
              <div className="space-y-1 max-h-64 overflow-y-auto px-2">
                {notifications.slice(0, 10).map((n) => (
                  <div
                    key={n.id}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                      !n.read ? 'bg-gray-800' : 'bg-gray-850'
                    }`}
                  >
                    {!n.read && <span className="h-2 w-2 rounded-full bg-[#e86b07] shrink-0" />}
                    <div className={`flex-1 min-w-0 ${n.read ? 'pl-4' : ''}`}>
                      <p className="text-xs font-semibold text-white">
                        Orden #{n.orderId} — {n.fullName}
                      </p>
                      <p className="text-xs text-gray-400">{formatTimeAgo(n.timestamp)}</p>
                    </div>
                    <span className="text-xs font-bold text-[#e86b07]">
                      {Number(n.total).toFixed(2)}€
                    </span>
                  </div>
                ))}
                <button
                  onClick={handleGoToOrders}
                  className="w-full text-center text-xs font-semibold text-[#e86b07] py-2 cursor-pointer"
                >
                  Ver todas las órdenes →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-700 py-4">
            <div className="flex flex-col space-y-3">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    handleNavClick();
                    if (item.href === '/to-go/admin/orders') markAllAsRead();
                  }}
                  className={`px-4 py-2 rounded-lg font-semibold transition cursor-pointer flex items-center gap-2 ${
                    pathname === item.href ? 'bg-[#e86b07] text-white' : 'text-white hover:bg-gray-800'
                  }`}
                >
                  {item.label}
                  {item.badge && item.badge > 0 ? (
                    <span className="inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-red-500 text-white text-xs font-bold">
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              ))}

              <div className="border-t border-gray-700 pt-3 mt-2">
                <div className="px-4 py-2 text-sm text-gray-300">
                  Usuario: <span className="text-white font-semibold">{user?.username}</span>
                </div>
                <button
                  onClick={() => { handleNavClick(); logout(); }}
                  className="w-full text-left px-4 py-2 rounded-lg text-red-400 hover:bg-gray-800 transition font-semibold cursor-pointer"
                >
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
