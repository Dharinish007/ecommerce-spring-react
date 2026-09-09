import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import productsApi from "@/api/products.api";
import categoriesApi from "@/api/categories.api";
import { ProductDTO, ProductResponse } from "@/types/product.types";
import { CategoryDTO } from "@/types/category.types";
import ProductCard from "@/components/product/ProductCard";
import ProductFilters from "@/components/product/ProductFilters";
import Pagination from "@/components/common/Pagination";
import { ProductCardSkeleton } from "@/components/common/Skeleton";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import { SlidersHorizontal, Search } from "lucide-react";

export const ProductsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL state
  const categoryParam = searchParams.get("category");
  const keywordParam = searchParams.get("keyword") || "";
  const pageParam = parseInt(searchParams.get("pageNumber") || "0", 10);
  const sortByParam = searchParams.get("sortBy") || "productId";
  const sortOrderParam = (searchParams.get("sortOrder") as "asc" | "desc") || "desc";

  const selectedCategoryId = categoryParam ? parseInt(categoryParam, 10) : undefined;

  // Local state
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [productData, setProductData] = useState<ProductResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Load categories once
  useEffect(() => {
    categoriesApi
      .getAllCategories({ pageSize: 50 })
      .then((res) => setCategories(res.content || []))
      .catch(() => setCategories([]));
  }, []);

  // Fetch products based on URL parameters
  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let res: ProductResponse;
      const queryParams = {
        pageNumber: pageParam,
        pageSize: 12,
        sortBy: sortByParam,
        sortOrder: sortOrderParam,
      };

      if (keywordParam.trim()) {
        res = await productsApi.getProductsByKeyword(keywordParam.trim(), queryParams);
      } else if (selectedCategoryId) {
        res = await productsApi.getProductsByCategory(selectedCategoryId, queryParams);
      } else {
        res = await productsApi.getAllProducts(queryParams);
      }
      setProductData(res);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to load product catalog.";
      setError(msg);
      setProductData(null);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategoryId, keywordParam, pageParam, sortByParam, sortOrderParam]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Handlers to update URL state
  const handleCategorySelect = (categoryId?: number) => {
    const nextParams = new URLSearchParams(searchParams);
    if (categoryId) {
      nextParams.set("category", categoryId.toString());
    } else {
      nextParams.delete("category");
    }
    nextParams.set("pageNumber", "0"); // Reset to page 0 on filter change
    setSearchParams(nextParams);
    setIsMobileFiltersOpen(false);
  };

  const handleSortChange = (sortBy: string, sortOrder: "asc" | "desc") => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("sortBy", sortBy);
    nextParams.set("sortOrder", sortOrder);
    nextParams.set("pageNumber", "0");
    setSearchParams(nextParams);
  };

  const handlePageChange = (newPage: number) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("pageNumber", newPage.toString());
    setSearchParams(nextParams);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleResetFilters = () => {
    setSearchParams(new URLSearchParams({ sortBy: "productId", sortOrder: "desc" }));
  };

  const selectedCategoryName = categories.find(
    (c) => c.categoryId === selectedCategoryId
  )?.categoryName;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header with search & category indicators */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {keywordParam ? (
              <span className="flex items-center gap-2">
                <Search className="w-6 h-6 text-cyan-600" />
                Results for &quot;{keywordParam}&quot;
              </span>
            ) : selectedCategoryName ? (
              <span>{selectedCategoryName}</span>
            ) : (
              <span>Explore Products</span>
            )}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {productData?.totalElements !== undefined
              ? `Found ${productData.totalElements} verified items in inventory`
              : "Browsing authenticated enterprise inventory"}
          </p>
        </div>

        <button
          onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
          className="lg:hidden inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 shadow-xs cursor-pointer"
        >
          <SlidersHorizontal className="w-4 h-4 text-cyan-600" />
          <span>Filter &amp; Sort</span>
        </button>
      </div>

      {/* Main Grid & Filters Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Desktop Sidebar Filters */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="sticky top-24">
            <ProductFilters
              categories={categories}
              selectedCategory={selectedCategoryId}
              onSelectCategory={handleCategorySelect}
              sortBy={sortByParam}
              sortOrder={sortOrderParam}
              onSortChange={handleSortChange}
              onReset={handleResetFilters}
            />
          </div>
        </div>

        {/* Mobile Filters Drawer Modal */}
        {isMobileFiltersOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex lg:hidden">
            <div className="w-80 max-w-full bg-white h-full p-6 overflow-y-auto ml-auto">
              <ProductFilters
                categories={categories}
                selectedCategory={selectedCategoryId}
                onSelectCategory={handleCategorySelect}
                sortBy={sortByParam}
                sortOrder={sortOrderParam}
                onSortChange={handleSortChange}
                onReset={handleResetFilters}
              />
              <button
                onClick={() => setIsMobileFiltersOpen(false)}
                className="mt-6 w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Product Catalog Display */}
        <div className="lg:col-span-3 space-y-6">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <ErrorState title="Error Loading Products" message={error} onRetry={loadProducts} />
          ) : !productData || productData.content.length === 0 ? (
            <EmptyState
              title="No products matched your criteria"
              description="Try adjusting your filters, searching for a different term, or clearing your current selection."
              actionLabel="Clear Filters"
              onAction={handleResetFilters}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {productData.content.map((product: ProductDTO) => (
                  <ProductCard key={product.productId} product={product} />
                ))}
              </div>

              {/* Pagination */}
              <Pagination
                pageNumber={productData.pageNumber}
                totalPages={productData.totalPages}
                totalElements={productData.totalElements}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
