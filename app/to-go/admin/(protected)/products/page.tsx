'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { productsApi, getImageUrl } from '@/lib/api';
import { Product } from '@/lib/types';
import { toast } from 'react-toastify';

const PAGE_SIZES = [10, 20, 50] as const;
type PageSize = (typeof PAGE_SIZES)[number];

function PaginationBar({
  total,
  page,
  pageSize,
  onPage,
  onPageSize,
}: {
  total: number;
  page: number;
  pageSize: PageSize;
  onPage: (p: number) => void;
  onPageSize: (s: PageSize) => void;
}) {
  const totalPages = Math.ceil(total / pageSize);
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 bg-gray-50 rounded-b-lg text-sm text-gray-600">
      <div className="flex items-center gap-2">
        <span>Filas por página:</span>
        {PAGE_SIZES.map((s) => (
          <button
            key={s}
            onClick={() => onPageSize(s)}
            className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
              pageSize === s
                ? 'bg-[#e86b07] text-white'
                : 'bg-white border border-gray-200 hover:border-[#e86b07] text-gray-600'
            }`}
          >
            {s}
          </button>
        ))}
      </div>
      <span className="text-gray-400">
        {from}–{to} de {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(1)}
          disabled={page === 1}
          className="px-2 py-1 rounded-lg border border-gray-200 disabled:opacity-40 hover:border-[#e86b07] cursor-pointer"
        >
          «
        </button>
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          className="px-2 py-1 rounded-lg border border-gray-200 disabled:opacity-40 hover:border-[#e86b07] cursor-pointer"
        >
          ‹
        </button>
        <span className="px-3 py-1 font-semibold text-gray-700">
          {page} / {totalPages || 1}
        </span>
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
          className="px-2 py-1 rounded-lg border border-gray-200 disabled:opacity-40 hover:border-[#e86b07] cursor-pointer"
        >
          ›
        </button>
        <button
          onClick={() => onPage(totalPages)}
          disabled={page >= totalPages}
          className="px-2 py-1 rounded-lg border border-gray-200 disabled:opacity-40 hover:border-[#e86b07] cursor-pointer"
        >
          »
        </button>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(10);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await productsApi.getAll({ take: 1000 });
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;

    try {
      await productsApi.delete(id);
      setProducts(products.filter((p) => p.id !== id));
      toast.success('Producto eliminado correctamente');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Error al eliminar el producto');
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      await productsApi.update(id, { status: !currentStatus });
      setProducts(products.map((p) => 
        p.id === id ? { ...p, status: !currentStatus } : p
      ));
      toast.success(`Producto ${!currentStatus ? 'activado' : 'desactivado'} correctamente`);
    } catch (error) {
      console.error('Error updating product status:', error);
      toast.error('Error al actualizar el estado del producto');
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'active' && product.status) ||
      (filter === 'inactive' && !product.status);

    const matchesSearch =
      !searchTerm ||
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.name.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  // Reset página cuando cambia filtro, búsqueda o tamaño de página
  useEffect(() => {
    setPage(1);
  }, [filter, searchTerm, pageSize]);

  const totalFiltered = filteredProducts.length;
  const pagedProducts = filteredProducts.slice((page - 1) * pageSize, page * pageSize);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-[#e86b07] border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Cargando productos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Productos</h1>
        <Link href="/to-go/admin/products/new" className="btn-primary">
          ➕ Nuevo Producto
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Buscar por nombre o categoría..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e86b07] focus:border-transparent outline-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-semibold transition cursor-pointer ${
                filter === 'all'
                  ? 'bg-[#e86b07] text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Todos ({products.length})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-lg font-semibold transition cursor-pointer ${
                filter === 'active'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Activos ({products.filter((p) => p.status).length})
            </button>
            <button
              onClick={() => setFilter('inactive')}
              className={`px-4 py-2 rounded-lg font-semibold transition cursor-pointer ${
                filter === 'inactive'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Inactivos ({products.filter((p) => !p.status).length})
            </button>
          </div>
        </div>
      </div>

      {/* Products Table/Cards */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-600 text-lg">
            {searchTerm ? 'Sin resultados para tu búsqueda' : 'No se encontraron productos'}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Imagen
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Precio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pagedProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="relative h-16 w-16 rounded overflow-hidden">
                        <Image
                          src={getImageUrl(product.image)}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-900">{product.name}</p>
                        {product.description && (
                          <p className="text-sm text-gray-600 line-clamp-1">
                            {product.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {product.category?.name || 'Sin categoría'}
                    </td>
                    <td className="px-6 py-4 font-bold text-[#e86b07]">
                      {Number(product.price).toFixed(2)}€
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(product.id, product.status)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#e86b07] focus:ring-offset-2 cursor-pointer ${
                          product.status ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                        aria-label={product.status ? 'Desactivar producto' : 'Activar producto'}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            product.status ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Link
                          href={`/to-go/admin/products/${product.id}/edit`}
                          className="text-[#1c0bdb] hover:text-[#1509a8] font-semibold text-sm cursor-pointer"
                        >
                          Editar
                        </Link>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 hover:text-red-800 font-semibold text-sm cursor-pointer"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <PaginationBar
              total={totalFiltered}
              page={page}
              pageSize={pageSize}
              onPage={setPage}
              onPageSize={(s) => { setPageSize(s); setPage(1); }}
            />
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden space-y-4">
            {pagedProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow-md p-4">
                <div className="flex gap-4">
                  {/* Image */}
                  <div className="relative h-20 w-20 shrink-0 rounded overflow-hidden">
                    <Image
                      src={getImageUrl(product.image)}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-lg mb-1">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {product.category?.name || 'Sin categoría'}
                    </p>
                    <p className="font-bold text-[#e86b07] text-xl">
                      {Number(product.price).toFixed(2)}€
                    </p>
                  </div>
                </div>

                {/* Description */}
                {product.description && (
                  <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                    {product.description}
                  </p>
                )}

                {/* Actions */}
                <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                  {/* Status Toggle */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Estado:</span>
                    <button
                      onClick={() => handleToggleStatus(product.id, product.status)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#e86b07] focus:ring-offset-2 cursor-pointer ${
                        product.status ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                      aria-label={product.status ? 'Desactivar producto' : 'Activar producto'}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          product.status ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Edit and Delete Buttons */}
                  <div className="flex gap-3">
                    <Link
                      href={`/to-go/admin/products/${product.id}/edit`}
                      className="px-4 py-2 bg-[#1c0bdb] text-white rounded-lg hover:bg-[#1509a8] font-semibold text-sm transition cursor-pointer"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold text-sm transition cursor-pointer"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {/* Mobile pagination */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <PaginationBar
                total={totalFiltered}
                page={page}
                pageSize={pageSize}
                onPage={setPage}
                onPageSize={(s) => { setPageSize(s); setPage(1); }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
