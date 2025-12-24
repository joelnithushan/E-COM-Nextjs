import apiClient from './client';

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: {
    url: string;
    publicId: string;
  };
  parent?: {
    _id: string;
    name: string;
    slug: string;
  };
  status: 'active' | 'inactive';
  order: number;
}

export interface CategoriesResponse {
  success: boolean;
  data: {
    categories: Category[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      pages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

/**
 * Get all categories
 */
export const getCategories = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
  parent?: string;
}): Promise<CategoriesResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.status) queryParams.append('status', params.status);
  if (params?.parent !== undefined) queryParams.append('parent', params.parent);

  const queryString = queryParams.toString();
  const url = `/categories${queryString ? `?${queryString}` : ''}`;

  return apiClient.get(url);
};

/**
 * Get all categories without pagination (for dropdowns)
 */
export const getAllCategories = async (): Promise<CategoriesResponse> => {
  return apiClient.get('/categories/all');
};

/**
 * Get single category
 */
export const getCategory = async (id: string): Promise<{
  success: boolean;
  data: { category: Category };
}> => {
  return apiClient.get(`/categories/${id}`);
};

