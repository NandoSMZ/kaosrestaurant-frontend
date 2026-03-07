'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';

export default function AdminNavbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { href: '/to-go/admin/dashboard', label: 'Dashboard' },
    { href: '/to-go/admin/products', label: 'Productos' },
    { href: '/to-go/admin/orders', label: 'Órdenes' },
  ];

  const handleNavClick = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className="bg-gray-900 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/to-go/admin/dashboard" className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition cursor-pointer">
            <div className="relative h-8 w-8 sm:h-10 sm:w-10">
              <Image
                src="/images/Logos/apple-icon.png"
                alt="Kaos"
                fill
                className="object-contain"
              />
            </div>
            <span className="text-lg sm:text-xl font-bold">Kaos Admin</span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`font-semibold transition cursor-pointer ${
                  pathname === item.href
                    ? 'text-[#e86b07]'
                    : 'text-white hover:text-[#e86b07]'
                }`}
              >
                {item.label}
              </Link>
            ))}

            {/* User Menu Desktop */}
            <div className="flex items-center gap-4 border-l border-gray-700 pl-6">
              <span className="text-sm text-gray-300">
                {user?.username}
              </span>
              <button
                onClick={logout}
                className="text-sm text-white hover:text-red-400 transition font-semibold cursor-pointer"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-800 transition cursor-pointer"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-700 py-4">
            <div className="flex flex-col space-y-3">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleNavClick}
                  className={`px-4 py-2 rounded-lg font-semibold transition cursor-pointer ${
                    pathname === item.href
                      ? 'bg-[#e86b07] text-white'
                      : 'text-white hover:bg-gray-800'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              
              {/* User Info Mobile */}
              <div className="border-t border-gray-700 pt-3 mt-2">
                <div className="px-4 py-2 text-sm text-gray-300">
                  Usuario: <span className="text-white font-semibold">{user?.username}</span>
                </div>
                <button
                  onClick={() => {
                    handleNavClick();
                    logout();
                  }}
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
