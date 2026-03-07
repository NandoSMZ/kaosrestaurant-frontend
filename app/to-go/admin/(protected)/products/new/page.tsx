'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { productsApi, categoriesApi } from '@/lib/api';
import { Category, CreateProductDto } from '@/lib/types';
import { toast } from 'react-toastify';
import ImageUpload from '@/components/admin/ImageUpload';

export default function NewProductPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateProductDto>();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await categoriesApi.getAll();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleImageChange = (file: File) => {
    setImageFile(file);
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  };

  const onSubmit = async (data: CreateProductDto) => {
    try {
      setLoading(true);
      setError('');

      let imageUrl = data.image;

      // Si hay archivo de imagen, subirlo primero
      if (imageFile) {
        try {
          const uploadResult = await productsApi.uploadImage(imageFile);
          imageUrl = uploadResult.secure_url;
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError);
          toast.error('Error al subir la imagen');
          setLoading(false);
          return;
        }
      }

      if (!imageUrl) {
        toast.error('Debes seleccionar una imagen');
        setLoading(false);
        return;
      }

      await productsApi.create({
        ...data,
        image: imageUrl,
        categoryId: Number(data.categoryId),
        price: Number(data.price),
        status: data.status ?? true,
      });
      toast.success('Producto creado correctamente');
      router.push('/to-go/admin/products');
    } catch (err: unknown) {
      console.error('Error creating product:', err);
      const error = err as { response?: { data?: { message?: string } } };
      const errorMessage = error.response?.data?.message || 'Error al crear el producto';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-[#1c0bdb] hover:text-[#1509a8] font-semibold cursor-pointer"
        >
          ← Volver
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Nuevo Producto</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              {...register('name', { required: 'El nombre es requerido' })}
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e86b07] focus:border-transparent outline-none"
              placeholder="Ej: Hamburguesa Clásica"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e86b07] focus:border-transparent outline-none"
              placeholder="Descripción del producto..."
            />
          </div>

          {/* Precio */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Precio <span className="text-red-500">*</span>
            </label>
            <input
              {...register('price', {
                required: 'El precio es requerido',
                min: { value: 0, message: 'El precio debe ser mayor a 0' },
              })}
              type="number"
              step="0.01"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e86b07] focus:border-transparent outline-none"
              placeholder="0.00"
            />
            {errors.price && (
              <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>
            )}
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Categoría <span className="text-red-500">*</span>
            </label>
            <select
              {...register('categoryId', { required: 'La categoría es requerida' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e86b07] focus:border-transparent outline-none"
            >
              <option value="">Selecciona una categoría</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.categoryId && (
              <p className="text-red-500 text-sm mt-1">{errors.categoryId.message}</p>
            )}
          </div>

          {/* Imagen */}
          <ImageUpload
            imagePreview={imagePreview}
            onImageChange={handleImageChange}
            disabled={loading}
          />

          {/* Estado */}
          <div className="flex items-center gap-3">
            <input
              {...register('status')}
              type="checkbox"
              id="status"
              defaultChecked
              className="w-5 h-5 text-[#e86b07] border-gray-300 rounded focus:ring-[#e86b07] cursor-pointer"
            />
            <label htmlFor="status" className="text-sm font-semibold text-gray-700 cursor-pointer">
              Producto activo (visible en el menú)
            </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creando...' : 'Crear Producto'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 btn-outline py-3"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
