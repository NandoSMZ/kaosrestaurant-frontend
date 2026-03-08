export interface Product {
  id: number;
  name: string;
  description?: string;
  image: string;
  price: number;
  categoryId: number;
  category: Category;
  status: boolean;
}

export interface Category {
  id: number;
  name: string;
  products?: Product[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface LoginDto {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: {
    username: string;
  };
}

export interface JwtPayload {
  username: string;
  sub: number;
  iat: number;
  exp: number;
}

export interface CreateProductDto {
  name: string;
  description?: string;
  image: string;
  price: number;
  categoryId: number;
  status?: boolean;
}

export type UpdateProductDto = Partial<CreateProductDto>;

export interface GetProductQueryDto {
  category_id?: number;
  take?: number;
  skip?: number;
}

// Transactions
export interface TransactionContent {
  id: number;
  quantity: number;
  price: number;
  product: Product;
}

export interface Transaction {
  id: number;
  fullName: string;
  phone: string;
  total: number;
  transactionDate: string;
  contents: TransactionContent[];
}

export interface CreateTransactionContentDto {
  productId: number;
  quantity: number;
}

export interface CreateTransactionDto {
  fullName: string;
  phone: string;
  contents: CreateTransactionContentDto[];
}

// Transactions
export interface TransactionContent {
  id: number;
  quantity: number;
  price: number;
  product: Product;
}

export interface Transaction {
  id: number;
  fullName: string;
  phone: string;
  total: number;
  transactionDate: string;
  contents: TransactionContent[];
}

export interface CreateTransactionContentDto {
  productId: number;
  quantity: number;
}

export interface CreateTransactionDto {
  fullName: string;
  phone: string;
  contents: CreateTransactionContentDto[];
}
