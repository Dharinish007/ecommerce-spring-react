import apiClient from "./client";
import { ProductDTO } from "@/types/product.types";
import { CategoryDTO } from "@/types/category.types";
import { OrderResponse, OrderDTO, OrderStatus } from "@/types/order.types";
import { CartDTO } from "@/types/cart.types";
import { AddressDTO } from "@/types/address.types";

export const adminApi = {
  // Product management
  createProduct: async (categoryId: number, product: Partial<ProductDTO>): Promise<ProductDTO> => {
    const response = await apiClient.post<ProductDTO>(
      `/admin/categories/${categoryId}/product`,
      product
    );
    return response.data;
  },

  updateProduct: async (productId: number, product: Partial<ProductDTO>): Promise<ProductDTO> => {
    const response = await apiClient.put<ProductDTO>(`/admin/products/${productId}`, product);
    return response.data;
  },

  deleteProduct: async (productId: number): Promise<ProductDTO> => {
    const response = await apiClient.delete<ProductDTO>(`/admin/products/${productId}`);
    return response.data;
  },

  uploadProductImage: async (productId: number, file: File): Promise<ProductDTO> => {
    const formData = new FormData();
    formData.append("image", file);
    const response = await apiClient.put<ProductDTO>(
      `/admin/products/${productId}/image`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  // Category management
  createCategory: async (category: { categoryName: string }): Promise<CategoryDTO> => {
    const response = await apiClient.post<CategoryDTO>("/admin/categories", category);
    return response.data;
  },

  updateCategory: async (
    categoryId: number,
    category: { categoryName: string }
  ): Promise<CategoryDTO> => {
    const response = await apiClient.put<CategoryDTO>(
      `/admin/categories/${categoryId}`,
      category
    );
    return response.data;
  },

  deleteCategory: async (categoryId: number): Promise<CategoryDTO> => {
    const response = await apiClient.delete<CategoryDTO>(`/admin/categories/${categoryId}`);
    return response.data;
  },

  // Order management
  getAllOrders: async (
    pageNumber: number = 0,
    pageSize: number = 20,
    sortBy: string = "orderDate",
    sortOrder: string = "desc"
  ): Promise<OrderResponse> => {
    const response = await apiClient.get<OrderResponse>("/admin/orders", {
      params: { pageNumber, pageSize, sortBy, sortOrder },
    });
    return response.data;
  },

  updateOrderStatus: async (orderId: number, status: OrderStatus): Promise<OrderDTO> => {
    const response = await apiClient.put<OrderDTO>(`/admin/orders/${orderId}/status`, {
      orderStatus: status,
    });
    return response.data;
  },

  // Additional admin reporting data
  getAllCarts: async (): Promise<CartDTO[]> => {
    const response = await apiClient.get<CartDTO[]>("/admin/carts");
    return response.data;
  },

  getAllAddresses: async (): Promise<AddressDTO[]> => {
    const response = await apiClient.get<AddressDTO[]>("/admin/addresses");
    return response.data;
  },

  // User management
  getAllUsers: async (): Promise<AdminUserDTO[]> => {
    const response = await apiClient.get<AdminUserDTO[]>("/admin/users");
    return response.data;
  },

  updateUserRoles: async (userId: number, roles: string[]): Promise<{ message: string }> => {
    const response = await apiClient.put<{ message: string }>(`/admin/users/${userId}/roles`, roles);
    return response.data;
  },
};

export interface AdminUserDTO {
  userId: number;
  userName: string;
  email: string;
  roles: string[];
}

export default adminApi;
