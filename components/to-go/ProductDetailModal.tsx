'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Product } from '@/lib/types';
import { useCart } from '@/contexts/CartContext';
import { getImageUrl } from '@/lib/api';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
}

export default function ProductDetailModal({ product, onClose }: ProductDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  if (!product) return null;

  const handleAddToCart = () => {
    addItem(product, quantity, false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div 
        ref={modalRef} 
        className="relative bg-white rounded-lg p-6 m-4 max-w-lg w-full shadow-2xl z-10"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl text-gray-900 font-bold">{product.name}</h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="relative w-full h-64 mb-4 rounded-lg overflow-hidden">
          <Image
            src={getImageUrl(product.image)}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, 500px"
            className="object-cover"
            priority
          />
        </div>

        <div className="mb-4">
          <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
        </div>

        <div className="mb-4">
          <span className="text-sm text-gray-500">Categoría: </span>
          <span className="text-gray-900 font-medium">{product.category?.name || 'Sin categoría'}</span>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="text-2xl font-bold text-[#e86b07]">
            ${Number(product.price).toFixed(2)}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold text-gray-700 transition-colors cursor-pointer"
              aria-label="Disminuir cantidad"
            >
              −
            </button>
            <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold text-gray-700 transition-colors cursor-pointer"
              aria-label="Aumentar cantidad"
            >
              +
            </button>
          </div>
        </div>

        <button
          onClick={handleAddToCart}
          className="w-full bg-[#e86b07] hover:bg-[#d15f06] text-white font-bold py-3 px-6 rounded-lg transition-colors cursor-pointer"
        >
          Agregar al carrito · ${(Number(product.price) * quantity).toFixed(2)}
        </button>
      </div>
    </div>
  );
}
