import axios from 'axios';
import {
  Product,
  Category,
  CreateProductDto,
  UpdateProductDto,
  GetProductQueryDto,
  LoginResponse,
  JwtPayload,
  Transaction,
  CreateTransactionDto,
  TransactionStats,
} from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Products API
export const productsApi = {
  getAll: async (params?: GetProductQueryDto): Promise<Product[]> => {
    const response = await api.get<{ products: Product[]; total: number }>('/products', { params });
    return response.data.products;
  },
  
  getById: async (id: number): Promise<Product> => {
    const response = await api.get<Product>(`/products/${id}`);
    return response.data;
  },
  
  create: async (data: CreateProductDto): Promise<Product> => {
    const response = await api.post<Product>('/products', data);
    return response.data;
  },
  
  update: async (id: number, data: UpdateProductDto): Promise<Product> => {
    const response = await api.put<Product>(`/products/${id}`, data);
    return response.data;
  },
  
  delete: async (id: number): Promise<void> => {
    await api.delete(`/products/${id}`);
  },

  uploadImage: async (file: File): Promise<{ secure_url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await axios.post<{ secure_url: string }>(
      `${API_URL}/products/upload-image`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },
};

// Categories API
export const categoriesApi = {
  getAll: async (): Promise<Category[]> => {
    const response = await api.get<Category[]>('/categories');
    return response.data;
  },
  
  getById: async (id: number): Promise<Category> => {
    const response = await api.get<Category>(`/categories/${id}`);
    return response.data;
  },
};

// Transactions API
export const transactionsApi = {
  create: async (data: CreateTransactionDto): Promise<Transaction> => {
    const response = await api.post<Transaction>('/transactions', data);
    return response.data;
  },

  getAll: async (): Promise<Transaction[]> => {
    const response = await api.get<Transaction[]>('/transactions');
    return response.data;
  },

  getById: async (id: number): Promise<Transaction> => {
    const response = await api.get<Transaction>(`/transactions/${id}`);
    return response.data;
  },

  advanceStatus: async (id: number): Promise<Transaction> => {
    const response = await api.patch<Transaction>(`/transactions/${id}/status`);
    return response.data;
  },

  /** Usuario cancela su propia orden (solo si está en PENDING) */
  cancelOrder: async (id: number): Promise<Transaction> => {
    const response = await api.patch<Transaction>(`/transactions/${id}/cancel`);
    return response.data;
  },

  /** Admin cancela desde cualquier estado con nota obligatoria */
  adminCancelOrder: async (id: number, note: string): Promise<Transaction> => {
    const response = await api.patch<Transaction>(`/transactions/${id}/cancel/admin`, { note });
    return response.data;
  },

  trackByPhone: async (phone: string): Promise<Transaction[]> => {
    const response = await api.get<Transaction[]>(`/transactions/track/${encodeURIComponent(phone)}`);
    return response.data;
  },

  getStats: async (from: string, to: string): Promise<TransactionStats> => {
    const response = await api.get<TransactionStats>('/transactions/stats', {
      params: { from, to },
    });
    return response.data;
  },
};

// Auth API
export const authApi = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', { username, password });
    return response.data;
  },
  
  validate: async (token: string): Promise<{ valid: boolean; user: JwtPayload }> => {
    const response = await api.post<{ valid: boolean; user: JwtPayload }>('/auth/validate', { token });
    return response.data;
  },
};

// Función helper para obtener la URL completa de las imágenes
export const getImageUrl = (imagePath: string): string => {
  if (!imagePath) return `/api/images/img/default.svg`;
  if (imagePath.startsWith('http')) return imagePath;
  // Si no empieza con /, añadir /img/ al inicio
  const path = imagePath.startsWith('/') ? imagePath : `/img/${imagePath}`;
  
  // En desarrollo, usar el proxy para evitar problemas de CORS y restricciones de Next.js 16
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return `/api/images${path}`;
  }
  
  return `${API_URL}${path}`;
};
