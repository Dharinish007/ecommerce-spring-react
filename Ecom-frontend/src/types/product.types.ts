export interface ProductDTO {
  productId: number;
  productName: string;
  description: string;
  image: string;
  quantity: number;
  price: number;
  discount: number;
  specialPrice: number;
  categoryId?: number;
  categoryName?: string;
}

export interface ProductResponse {
  content: ProductDTO[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  lastPage: boolean;
}

export interface ProductQueryParams {
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  keyword?: string;
  categoryId?: number;
}
