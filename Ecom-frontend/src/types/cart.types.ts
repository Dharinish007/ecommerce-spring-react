import { ProductDTO } from "./product.types";

export interface CartDTO {
  cartId: number;
  totalPrice: number;
  products: ProductDTO[];
}

export interface CartState {
  cart: CartDTO | null;
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;
}
