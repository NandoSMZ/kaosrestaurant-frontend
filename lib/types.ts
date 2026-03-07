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
