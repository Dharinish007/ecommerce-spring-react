import React from "react";
import { CategoryDTO } from "@/types/category.types";
import { Filter, X, ArrowUpDown } from "lucide-react";

export interface ProductFiltersProps {
  categories: CategoryDTO[];
  selectedCategory?: number;
  onSelectCategory: (categoryId?: number) => void;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSortChange: (sortBy: string, sortOrder: "asc" | "desc") => void;
  onReset: () => void;
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  sortBy,
  sortOrder,
  onSortChange,
  onReset,
}) => {
  const currentSortKey = `${sortBy}:${sortOrder}`;

  const handleSortSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [newSortBy, newSortOrder] = e.target.value.split(":") as [string, "asc" | "desc"];
    onSortChange(newSortBy, newSortOrder);
  };

  const hasActiveFilters = Boolean(selectedCategory);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-cyan-600" />
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Filter & Sort
          </h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Sort Selector */}
      <div className="space-y-2">
        <label
          htmlFor="catalog-sort"
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600"
        >
          <ArrowUpDown className="w-3.5 h-3.5" />
          <span>Sort By</span>
        </label>
        <select
          id="catalog-sort"
          value={currentSortKey}
          onChange={handleSortSelect}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
        >
          <option value="productId:desc">Newest Arrivals</option>
          <option value="price:asc">Price: Low to High</option>
          <option value="price:desc">Price: High to Low</option>
          <option value="productName:asc">Product Name: A to Z</option>
          <option value="productName:desc">Product Name: Z to A</option>
        </select>
      </div>

      {/* Category List */}
      <div className="space-y-2">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-600">
          Categories
        </div>
        <div className="space-y-1">
          <button
            onClick={() => onSelectCategory(undefined)}
            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer flex items-center justify-between ${
              !selectedCategory
                ? "bg-cyan-50 text-cyan-800 font-bold border border-cyan-200"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <span>All Categories</span>
          </button>

          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.categoryId;
            return (
              <button
                key={cat.categoryId}
                onClick={() => onSelectCategory(cat.categoryId)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? "bg-cyan-50 text-cyan-800 font-bold border border-cyan-200"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span>{cat.categoryName}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProductFilters;
