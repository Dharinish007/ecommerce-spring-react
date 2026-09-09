import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import productsApi from "@/api/products.api";
import categoriesApi from "@/api/categories.api";
import { ProductDTO } from "@/types/product.types";
import { CategoryDTO } from "@/types/category.types";
import ProductCard from "@/components/product/ProductCard";
import { ProductCardSkeleton } from "@/components/common/Skeleton";
import ErrorState from "@/components/common/ErrorState";
import { ArrowRight, Sparkles, ShieldCheck, Zap, Headphones, CheckCircle2 } from "lucide-react";

export const HomePage: React.FC = () => {
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHomeData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [prodRes, catRes] = await Promise.all([
        productsApi.getAllProducts({ pageSize: 8, sortBy: "productId", sortOrder: "desc" }),
        categoriesApi.getAllCategories({ pageSize: 10 }),
      ]);
      setProducts(prodRes.content || []);
      setCategories(catRes.content || []);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to connect to product catalog.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHomeData();
  }, []);

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-900 text-white py-20 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
          {/* Left copy */}
          <div className="max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Engineered for Reliability</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
              Next-Generation Electronics & Hardware
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl">
              Discover certified enterprise electronics, performance computing, and modern
              accessories. Real-time inventory straight from our verified distribution network.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                to="/products"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm transition-all duration-200 shadow-lg shadow-cyan-900/30 active:scale-95"
              >
                <span>Browse Full Catalog</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/products?sortBy=price&sortOrder=asc"
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-sm transition-all duration-200"
              >
                Special Value Deals
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Free Dispatch &gt; $50
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Official Manufacturer Warranty
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 30-Day Effortless Return
              </span>
            </div>
          </div>

          {/* Right Visual Badge Matrix */}
          <div className="hidden lg:grid grid-cols-2 gap-4 w-96 shrink-0">
            <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
              <Zap className="w-6 h-6 text-cyan-400" />
              <div className="text-2xl font-black text-white">Instant</div>
              <div className="text-xs text-slate-400">Real-time stock reservation system</div>
            </div>
            <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              <div className="text-2xl font-black text-white">100%</div>
              <div className="text-xs text-slate-400">Verified hardware authenticity</div>
            </div>
            <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
              <Headphones className="w-6 h-6 text-cyan-400" />
              <div className="text-2xl font-black text-white">24/7</div>
              <div className="text-xs text-slate-400">Expert engineering support</div>
            </div>
            <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
              <Sparkles className="w-6 h-6 text-amber-400" />
              <div className="text-2xl font-black text-white">Direct</div>
              <div className="text-xs text-slate-400">Straight from trusted manufacturers</div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Pills Navigation */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Featured Categories
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Explore by specialized domain</p>
            </div>
            <Link
              to="/products"
              className="text-xs font-bold text-cyan-600 hover:text-cyan-700 inline-flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
            <Link
              to="/products"
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 hover:border-cyan-500 hover:text-cyan-600 shadow-xs whitespace-nowrap transition-colors"
            >
              All Products
            </Link>
            {categories.map((category) => (
              <Link
                key={category.categoryId}
                to={`/products?category=${category.categoryId}`}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:border-cyan-500 hover:text-cyan-600 shadow-xs whitespace-nowrap transition-colors"
              >
                {category.categoryName}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Latest Additions & Featured Products
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Freshly stocked items backed by authentic warranty
            </p>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-600 hover:text-cyan-700"
          >
            <span>See Full Catalog</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <ErrorState
            title="Unable to load catalog"
            message={error}
            onRetry={loadHomeData}
          />
        ) : products.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
            <h3 className="text-base font-bold text-slate-700">No products found</h3>
            <p className="text-xs text-slate-400 mt-1">
              The catalog is currently being updated. Please check back shortly.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.productId} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;
