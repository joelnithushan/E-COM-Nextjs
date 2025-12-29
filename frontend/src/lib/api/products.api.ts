import apiClient from './client';

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  category: {
    _id: string;
    name: string;
    slug: string;
  };
  images: Array<{
    url: string;
    alt?: string;
    isPrimary: boolean;
  }>;
  stock: number;
  status: 'active' | 'inactive' | 'draft';
  featured: boolean;
  ratings: {
    average: number;
    count: number;
  };
  variants?: Array<{
    name: string; // e.g., "Size", "Color"
    options: Array<{
      value: string; // e.g., "M", "Green"
      price?: number; // Additional price for this variant
      stock?: number; // Stock for this specific variant option
      sku?: string;
      image?: string;
    }>;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface ProductsResponse {
  success: boolean;
  data: {
    products: Product[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

export interface ProductResponse {
  success: boolean;
  data: {
    product: Product;
  };
}

export interface ProductsQueryParams {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc' | 'newest';
  inStock?: boolean;
  featured?: boolean;
  status?: 'active' | 'inactive' | 'draft';
}

/**
 * Get all products with pagination and filters
 */
export const getProducts = async (params?: ProductsQueryParams): Promise<ProductsResponse> => {
  const queryParams = new URLSearchParams();
  
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.category) queryParams.append('category', params.category);
  if (params?.search) queryParams.append('search', params.search);
  if (params?.minPrice) queryParams.append('minPrice', params.minPrice.toString());
  if (params?.maxPrice) queryParams.append('maxPrice', params.maxPrice.toString());
  if (params?.sort) queryParams.append('sort', params.sort);
  if (params?.inStock !== undefined) queryParams.append('inStock', params.inStock.toString());

  const queryString = queryParams.toString();
  const url = `/products${queryString ? `?${queryString}` : ''}`;
  
  return apiClient.get(url);
};

/**
 * Get single product by ID
 */
export const getProduct = async (id: string): Promise<ProductResponse> => {
  return apiClient.get(`/products/${id}`);
};




