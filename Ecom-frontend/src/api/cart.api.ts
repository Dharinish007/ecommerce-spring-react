import apiClient from "./client";
import { CartDTO } from "@/types/cart.types";
import { APIResponse } from "@/types/common.types";

export const cartApi = {
  getUserCart: async (): Promise<CartDTO> => {
    const response = await apiClient.get<CartDTO>("/carts/user/cart");
    return response.data;
  },

  addProductToCart: async (productId: number, quantity: number = 1): Promise<CartDTO> => {
    const response = await apiClient.post<CartDTO>(
      `/carts/products/${productId}/quantity/${quantity}`
    );
    return response.data;
  },

  updateProductQuantity: async (
    productId: number,
    operation: "increment" | "decrement" | "delete"
  ): Promise<CartDTO> => {
    const response = await apiClient.put<CartDTO>(
      `/cart/products/${productId}/quantity/${operation}`
    );
    return response.data;
  },

  deleteProductFromCart: async (
    cartId: number,
    productId: number
  ): Promise<APIResponse> => {
    const response = await apiClient.delete<APIResponse>(
      `/cart/${cartId}/product/${productId}`
    );
    return response.data;
  },
};

export default cartApi;
