export interface CategoryDTO {
  categoryId: number;
  categoryName: string;
}

export interface CategoryResponse {
  content: CategoryDTO[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  lastPage: boolean;
}

export interface CategoryQueryParams {
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
