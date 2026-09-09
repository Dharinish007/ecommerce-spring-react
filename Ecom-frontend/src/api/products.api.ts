import apiClient from "./client";
import { ProductDTO, ProductResponse, ProductQueryParams } from "@/types/product.types";

export const productsApi = {
  getAllProducts: async (params?: ProductQueryParams): Promise<ProductResponse> => {
    const response = await apiClient.get<ProductResponse>("/public/products", { params });
    return response.data;
  },

  getProductById: async (productId: number): Promise<ProductDTO> => {
    const response = await apiClient.get<ProductDTO>(`/public/products/${productId}`);
    return response.data;
  },

  getProductsByCategory: async (
    categoryId: number,
    params?: ProductQueryParams
  ): Promise<ProductResponse> => {
    const response = await apiClient.get<ProductResponse>(
      `/public/categories/${categoryId}/products`,
      { params }
    );
    return response.data;
  },

  getProductsByKeyword: async (
    keyword: string,
    params?: ProductQueryParams
  ): Promise<ProductResponse> => {
    const response = await apiClient.get<ProductResponse>(
      `/public/products/keyword/${encodeURIComponent(keyword)}`,
      { params }
    );
    return response.data;
  },
};

export default productsApi;
