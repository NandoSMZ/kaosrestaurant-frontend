'use client';

import React from 'react';
import { Product } from '@/lib/types';
import ProductCard from './ProductCard';

interface CategorySectionProps {
  categoryName: string;
  products: Product[];
  onProductClick: (product: Product) => void;
  sectionRef?: (el: HTMLElement | null) => void;
}

export default function CategorySection({ categoryName, products, onProductClick, sectionRef }: CategorySectionProps) {
  if (products.length === 0) return null;

  return (
    <section ref={sectionRef} className="mb-12 scroll-mt-32">
      <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-2 border-b-4 border-[#e86b07]">
        {categoryName}
      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard 
            key={product.id} 
            product={product} 
            onClick={onProductClick}
          />
        ))}
      </div>
    </section>
  );
}
