import { AddressDTO } from "./address.types";
import { ProductDTO } from "./product.types";

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export interface PaymentDTO {
  paymentId?: number;
  paymentMethod: string;
  pgPaymentId?: string;
  pgStatus?: string;
  pgResponseMessage?: string;
  pgName?: string;
}

export interface OrderItemDTO {
  orderItemId: number;
  product: ProductDTO;
  quantity: number;
  discount: number;
  orderedProductPrice: number;
}

export interface OrderDTO {
  orderId: number;
  email: string;
  orderItems: OrderItemDTO[];
  orderDate: string;
  payment?: PaymentDTO;
  totalAmount: number;
  shippingFee?: number;
  orderStatus: OrderStatus;
  addressId?: number;
  address?: AddressDTO;
}

export interface OrderResponse {
  content: OrderDTO[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  lastPage: boolean;
}

export interface OrderRequestDTO {
  addressId: number;
  paymentMethod: string;
  pgName?: string;
  pgPaymentId?: string;
  pgStatus?: string;
  pgResponseMessage?: string;
  simulateFailure?: boolean;
}

export interface OrderStatusUpdateDTO {
  orderStatus: OrderStatus;
}
