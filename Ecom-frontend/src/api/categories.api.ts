import apiClient from "./client";
import { CategoryDTO, CategoryResponse, CategoryQueryParams } from "@/types/category.types";

export const categoriesApi = {
  getAllCategories: async (params?: CategoryQueryParams): Promise<CategoryResponse> => {
    const response = await apiClient.get<CategoryResponse>("/public/categories", { params });
    return response.data;
  },

  getCategoryById: async (categoryId: number): Promise<CategoryDTO> => {
    const response = await apiClient.get<CategoryDTO>(`/public/categories/${categoryId}`);
    return response.data;
  },
};

export default categoriesApi;
