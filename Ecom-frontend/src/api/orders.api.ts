import apiClient from "./client";
import { OrderDTO, OrderResponse, OrderRequestDTO } from "@/types/order.types";

export const ordersApi = {
  placeOrder: async (paymentMethod: string, orderRequest: OrderRequestDTO): Promise<OrderDTO> => {
    const response = await apiClient.post<OrderDTO>(
      `/order/user/payments/${encodeURIComponent(paymentMethod)}`,
      orderRequest
    );
    return response.data;
  },

  getUserOrders: async (
    pageNumber: number = 0,
    pageSize: number = 10,
    sortBy: string = "orderDate",
    sortOrder: string = "desc"
  ): Promise<OrderResponse> => {
    const response = await apiClient.get<OrderResponse>("/order/user/orders", {
      params: { pageNumber, pageSize, sortBy, sortOrder },
    });
    return response.data;
  },

  getOrderById: async (orderId: number): Promise<OrderDTO> => {
    const response = await apiClient.get<OrderDTO>(`/order/user/orders/${orderId}`);
    return response.data;
  },
};

export default ordersApi;
