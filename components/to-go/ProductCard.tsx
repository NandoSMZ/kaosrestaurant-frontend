'use client';

import React from 'react';
import Image from 'next/image';
import { Product } from '@/lib/types';
import { useCart } from '@/contexts/CartContext';
import { getImageUrl } from '@/lib/api';

interface ProductCardProps {
  product: Product;
  onClick?: (product: Product) => void;
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
  const { addItem } = useCart();

  if (!product.status) {
    return null;
  }

  const handleCardClick = () => {
    if (onClick) {
      onClick(product);
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem(product, 1, false); // false = no abrir carrito
  };

  return (
    <div 
      onClick={handleCardClick}
      className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden cursor-pointer"
    >
      <div className="relative h-48 w-full">
        <Image
          src={getImageUrl(product.image)}
          alt={product.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-900 mb-2">{product.name}</h3>
        
        {product.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {product.description}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-[#e86b07]">
            {Number(product.price).toFixed(2)}€
          </span>
          
          <button
            onClick={handleAddToCart}
            className="btn-primary text-sm"
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
}
