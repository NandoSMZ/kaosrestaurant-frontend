'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useCart } from '@/contexts/CartContext';
import { productsApi } from '@/lib/api';
import { Product } from '@/lib/types';
import CartSidebar from '@/components/to-go/CartSidebar';
import CategorySection from '@/components/to-go/CategorySection';
import ProductDetailModal from '@/components/to-go/ProductDetailModal';
import Image from 'next/image';

export default function ToGoPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeCategory, setActiveCategory] = useState('');
  const [mounted, setMounted] = useState(false);
  const { toggleCart, itemCount } = useCart();
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrollingToSection = useRef(false);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const activeTabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await productsApi.getAll({ take: 1000 });
      setProducts(data);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Error al cargar los productos. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Agrupar productos por categoría
  const productsByCategory = products.reduce((acc, product) => {
    const categoryName = product.category?.name || 'Sin categoría';
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    if (product.status) {
      acc[categoryName].push(product);
    }
    return acc;
  }, {} as Record<string, Product[]>);

  const categories = Object.keys(productsByCategory);

  // Establecer primera categoría como activa
  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

  // Auto-scroll horizontal de tabs cuando cambia la categoría activa
  useEffect(() => {
    if (tabsContainerRef.current && activeCategory) {
      const container = tabsContainerRef.current;
      const activeButton = activeTabRefs.current[activeCategory];

      if (activeButton) {
        const containerWidth = container.offsetWidth;
        const buttonLeft = activeButton.offsetLeft;
        const buttonWidth = activeButton.offsetWidth;

        // Centrar el botón activo en el contenedor
        const scrollPosition = buttonLeft - containerWidth / 2 + buttonWidth / 2;

        container.scrollTo({
          left: Math.max(0, scrollPosition),
          behavior: 'smooth',
        });
      }
    }
  }, [activeCategory]);

  // Scrollspy para detectar categoría activa
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;
    
    const updateScrollSpy = () => {
      if (scrollingToSection.current) return;
      
      const scrollPosition = window.scrollY + 150;
      const isNearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 200;
      
      if (isNearBottom) {
        const lastCategory = categories[categories.length - 1];
        if (activeCategory !== lastCategory) {
          setActiveCategory(lastCategory);
        }
        return;
      }
      
      let nearestCategory = activeCategory;
      let nearestDistance = Infinity;
      
      for (const [categoryName, sectionRef] of Object.entries(sectionRefs.current)) {
        if (sectionRef) {
          const sectionTop = sectionRef.offsetTop;
          const distance = Math.abs(scrollPosition - sectionTop);
          
          if (distance < nearestDistance && scrollPosition >= (sectionTop - 100)) {
            nearestDistance = distance;
            nearestCategory = categoryName;
          }
        }
      }
      
      if (nearestCategory !== activeCategory) {
        setActiveCategory(nearestCategory);
      }
    };
    
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(updateScrollSpy, 50);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    const timeoutId = setTimeout(updateScrollSpy, 200);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
      clearTimeout(scrollTimeout);
    };
  }, [categories, activeCategory]);

  const handleCategoryClick = (categoryName: string) => {
    setActiveCategory(categoryName);
    scrollingToSection.current = true;
    
    const element = sectionRefs.current[categoryName];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => {
        scrollingToSection.current = false;
      }, 1000);
    } else {
      scrollingToSection.current = false;
    }
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
  };

  const closeModal = () => {
    setSelectedProduct(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md fixed top-0 left-0 right-0 z-30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative h-12 w-12">
                <Image
                  src="/images/Logos/apple-icon.png"
                  alt="Kaos Restaurant"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#e86b07]">Kaos To Go</h1>
                <p className="text-sm text-gray-600">Ordena tu comida favorita</p>
              </div>
            </div>

            <button
              onClick={toggleCart}
              className="relative btn-primary flex items-center gap-2 cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span>Carrito</span>
              {mounted && itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#1c0bdb] text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        {!loading && categories.length > 0 && (
          <div className="border-t border-gray-200">
            <div 
              ref={tabsContainerRef}
              className="overflow-x-auto scroll-smooth hide-scrollbar"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <div className="flex gap-1 px-4 min-w-max">
                {categories.map((categoryName) => (
                  <button
                    key={categoryName}
                    ref={(el) => {
                      if (el) activeTabRefs.current[categoryName] = el;
                    }}
                    onClick={() => handleCategoryClick(categoryName)}
                    className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 cursor-pointer ${
                      activeCategory === categoryName
                        ? 'border-b-2 border-[#e86b07] text-[#e86b07] font-bold'
                        : 'text-gray-600 hover:text-[#e86b07]'
                    }`}
                  >
                    {categoryName}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Spacer for fixed header */}
      <div className={loading || categories.length === 0 ? 'h-20' : 'h-32'}></div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-[#e86b07] border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Cargando menú...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600 font-semibold">{error}</p>
            <button
              onClick={fetchProducts}
              className="mt-4 btn-primary"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <>
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-[#e86b07] to-[#1c0bdb] rounded-lg p-8 mb-8 text-white">
              <h2 className="text-4xl font-bold mb-2">¡Bienvenido a Kaos To Go!</h2>
              <p className="text-lg">Explora nuestro menú y ordena tus platillos favoritos</p>
            </div>

            {/* Products by Category */}
            {Object.keys(productsByCategory).length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">No hay productos disponibles en este momento.</p>
              </div>
            ) : (
              Object.entries(productsByCategory).map(([categoryName, categoryProducts]) => (
                <CategorySection
                  key={categoryName}
                  categoryName={categoryName}
                  products={categoryProducts}
                  onProductClick={handleProductClick}
                  sectionRef={(el: HTMLElement | null) => {
                    if (el) sectionRefs.current[categoryName] = el as HTMLDivElement;
                  }}
                />
              ))
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">© 2026 Kaos Restaurant. Todos los derechos reservados.</p>
          <p className="text-xs text-gray-400 mt-2">
            <a href="https://www.kaosrestaurant.com" className="hover:text-[#e86b07] cursor-pointer">
              www.kaosrestaurant.com
            </a>
          </p>
        </div>
      </footer>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal 
          product={selectedProduct} 
          onClose={closeModal} 
        />
      )}

      {/* Cart Sidebar */}
      <CartSidebar />
    </div>
  );
}
