import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import productsApi from "@/api/products.api";
import categoriesApi from "@/api/categories.api";
import { extractErrorMessage } from "@/api/client";
import { ProductDTO } from "@/types/product.types";
import { CategoryDTO } from "@/types/category.types";
import ProductCard from "@/components/product/ProductCard";
import { ProductCardSkeleton } from "@/components/common/Skeleton";
import ErrorState from "@/components/common/ErrorState";
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Truck,
  RotateCcw,
  CreditCard,
  Tag,
  Smartphone,
  Laptop,
  Headphones,
  Watch,
  Tv,
  Home,
  ShoppingBag,
} from "lucide-react";

export const HomePage: React.FC = () => {
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [discountedProducts, setDiscountedProducts] = useState<ProductDTO[]>([]);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHomeData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [prodRes, catRes] = await Promise.all([
        productsApi.getAllProducts({ pageSize: 12, sortBy: "productId", sortOrder: "desc" }),
        categoriesApi.getAllCategories({ pageSize: 12 }),
      ]);
      const fetchedProducts = prodRes.content || [];
      setProducts(fetchedProducts);
      setCategories(catRes.content || []);

      // Filter products that have real discount
      const deals = fetchedProducts
        .filter((p) => p.discount && p.discount > 0)
        .sort((a, b) => (b.discount || 0) - (a.discount || 0));
      setDiscountedProducts(deals.slice(0, 4));
    } catch (err: unknown) {
      const msg = extractErrorMessage(err, "Failed to connect to the Angadi product catalog.");
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHomeData();
  }, []);

  const getCategoryIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("mobile") || lower.includes("phone")) return <Smartphone className="w-5 h-5" />;
    if (lower.includes("laptop") || lower.includes("computer")) return <Laptop className="w-5 h-5" />;
    if (lower.includes("audio") || lower.includes("headphone")) return <Headphones className="w-5 h-5" />;
    if (lower.includes("watch") || lower.includes("wearable")) return <Watch className="w-5 h-5" />;
    if (lower.includes("tv") || lower.includes("appliance")) return <Tv className="w-5 h-5" />;
    if (lower.includes("home") || lower.includes("kitchen")) return <Home className="w-5 h-5" />;
    return <ShoppingBag className="w-5 h-5" />;
  };

  return (
    <div className="space-y-10 pb-16">
      {/* Marketplace Promotional Banner Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Showcase Hero */}
          <div className="lg:col-span-2 relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 text-white p-6 sm:p-10 flex flex-col justify-between min-h-[260px] sm:min-h-[300px] border border-slate-800 shadow-sm">
            <div className="space-y-3 max-w-xl z-10">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold tracking-wide">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Angadi Grand Marketplace</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
                India&apos;s Trusted Store for Mobiles, Electronics &amp; Daily Tech
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md">
                Explore thousands of verified products from trusted distributors with direct
                warranty, instant stock updates, and reliable doorstep delivery.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-6 z-10">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm transition-colors shadow-sm"
              >
                <span>Shop All Products</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/products?sortBy=price&sortOrder=asc"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs sm:text-sm transition-colors"
              >
                <Tag className="w-4 h-4 text-amber-400" />
                <span>Explore Deals</span>
              </Link>
            </div>

            {/* Subtle background motif */}
            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          </div>

          {/* Secondary Highlight Cards */}
          <div className="flex flex-col gap-4">
            <div className="flex-1 rounded-2xl bg-amber-50 border border-amber-200 p-6 flex flex-col justify-between">
              <div className="space-y-1.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-800">
                  Value Deals
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                  Mobiles, Tablets &amp; Laptops at Direct Prices
                </h3>
                <p className="text-xs text-slate-600">
                  Save on genuine brand-name computers and flagship phones.
                </p>
              </div>
              <Link
                to="/products?sortBy=price&sortOrder=asc"
                className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 hover:text-amber-900 mt-4"
              >
                <span>Browse Value Deals</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="flex-1 rounded-2xl bg-slate-100 border border-slate-200 p-6 flex flex-col justify-between">
              <div className="space-y-1.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-600">
                  Pan-India Delivery
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                  Free Shipping on Orders Over ₹499
                </h3>
                <p className="text-xs text-slate-600">
                  Hassle-free shipping with Cash on Delivery and simple returns.
                </p>
              </div>
              <Link
                to="/products"
                className="inline-flex items-center gap-1 text-xs font-bold text-slate-800 hover:text-slate-950 mt-4"
              >
                <span>Start Shopping</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Category Discovery Pills / Tiles */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Shop by Category
              </h2>
              <p className="text-xs text-slate-500">Explore authentic products across departments</p>
            </div>
            <Link
              to="/products"
              className="text-xs font-bold text-amber-700 hover:text-amber-800 inline-flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {categories.map((category) => (
              <Link
                key={category.categoryId}
                to={`/products?category=${category.categoryId}`}
                className="group flex flex-col items-center p-4 rounded-xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-xs transition-all text-center"
              >
                <div className="w-11 h-11 rounded-full bg-slate-100 group-hover:bg-amber-100 text-slate-700 group-hover:text-amber-800 flex items-center justify-center transition-colors mb-2">
                  {getCategoryIcon(category.categoryName)}
                </div>
                <span className="text-xs font-semibold text-slate-800 group-hover:text-amber-800 line-clamp-1">
                  {category.categoryName}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Deals of the Day (Genuine Discounted Products from DB) */}
      {discountedProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-5 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-red-600 text-white font-black text-xs">
                  DEALS
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    Top Offers &amp; Discounts
                  </h2>
                  <p className="text-xs text-slate-600">
                    Live special prices with verified manufacturer discounts
                  </p>
                </div>
              </div>
              <Link
                to="/products?sortBy=price&sortOrder=asc"
                className="text-xs font-bold text-amber-900 hover:underline inline-flex items-center gap-1"
              >
                <span>View More Deals</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {discountedProducts.map((product) => (
                <ProductCard key={product.productId} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Catalog Products Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Featured Products &amp; New Arrivals
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Authentic inventory directly available for prompt delivery
            </p>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-800"
          >
            <span>See All Products</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
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
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
            <h3 className="text-sm font-bold text-slate-700">No products found</h3>
            <p className="text-xs text-slate-400 mt-1">
              The catalog is currently being updated. Please check back shortly.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {products.map((product) => (
              <ProductCard key={product.productId} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Trust & Marketplace Standards Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-8">
          <h3 className="text-base font-bold text-slate-900 mb-6 text-center">
            Why Shop with Angadi?
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800 shrink-0">
                <Truck className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Doorstep Delivery</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Fast and reliable shipping across India with trackable orders.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800 shrink-0">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">100% Genuine Items</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Direct sourcing backed by official manufacturer warranties.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800 shrink-0">
                <RotateCcw className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">7-Day Replacement</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Simple and transparent replacement on eligible defective items.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800 shrink-0">
                <CreditCard className="w-5 h-5 text-slate-800" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Secure Payments &amp; COD</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Pay securely with UPI, Net Banking, Cards, or Cash on Delivery.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
