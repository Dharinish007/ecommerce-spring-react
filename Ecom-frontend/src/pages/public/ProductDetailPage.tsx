import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import productsApi from "@/api/products.api";
import { ProductDTO } from "@/types/product.types";
import { formatPrice, formatDiscount } from "@/utils/formatters";
import { resolveProductImageUrl, handleImageError } from "@/utils/imageUtils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addToCart } from "@/store/slices/cartSlice";
import { addToast } from "@/store/slices/uiSlice";
import Button from "@/components/common/Button";
import ProductCard from "@/components/product/ProductCard";
import Skeleton from "@/components/common/Skeleton";
import ErrorState from "@/components/common/ErrorState";
import {
  ShoppingBag,
  Check,
  ShieldCheck,
  Truck,
  RotateCcw,
  ChevronRight,
  Plus,
  Minus,
} from "lucide-react";

export const ProductDetailPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const [product, setProduct] = useState<ProductDTO | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<ProductDTO[]>([]);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProduct = useCallback(async () => {
    if (!productId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await productsApi.getProductById(Number(productId));
      setProduct(data);
      setSelectedQuantity(1);

      // Fetch related products from same category if available
      if (data.categoryId) {
        productsApi
          .getProductsByCategory(data.categoryId, { pageSize: 4 })
          .then((res) => {
            const filtered = (res.content || []).filter(
              (p) => p.productId !== data.productId
            );
            setRelatedProducts(filtered.slice(0, 4));
          })
          .catch(() => setRelatedProducts([]));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load product details.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadProduct();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [loadProduct]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <Skeleton className="h-4 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <Skeleton className="h-96 rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-40" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <ErrorState
          title="Product not found"
          message={error || "The requested product does not exist in inventory."}
          onRetry={loadProduct}
        />
      </div>
    );
  }

  const {
    productName,
    description,
    image,
    quantity,
    price,
    discount,
    specialPrice,
    categoryId,
    categoryName,
  } = product;

  const isAvailable = quantity > 0;
  const imageUrl = resolveProductImageUrl(image);

  const handleQuantityDecrement = () => {
    if (selectedQuantity > 1) {
      setSelectedQuantity((prev) => prev - 1);
    }
  };

  const handleQuantityIncrement = () => {
    if (selectedQuantity < quantity) {
      setSelectedQuantity((prev) => prev + 1);
    }
  };

  const handleAddToCart = async () => {
    if (!isAvailable) return;

    if (!isAuthenticated) {
      dispatch(
        addToast({
          type: "info",
          message: "Please sign in to add items to your cart.",
        })
      );
      navigate("/login");
      return;
    }

    setIsAdding(true);
    try {
      await dispatch(
        addToCart({ productId: product.productId, quantity: selectedQuantity })
      ).unwrap();
      setIsSuccess(true);
      dispatch(
        addToast({
          type: "success",
          message: `Added ${selectedQuantity}x "${productName}" to your cart!`,
        })
      );
      setTimeout(() => setIsSuccess(false), 2500);
    } catch (err: unknown) {
      const msg = typeof err === "string" ? err : "Failed to add product to cart.";
      dispatch(addToast({ type: "error", message: msg }));
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500">
        <Link to="/" className="hover:text-cyan-600 transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <Link to="/products" className="hover:text-cyan-600 transition-colors">
          Catalog
        </Link>
        {categoryName && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <Link
              to={`/products?category=${categoryId}`}
              className="hover:text-cyan-600 transition-colors"
            >
              {categoryName}
            </Link>
          </>
        )}
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="font-semibold text-slate-800 truncate max-w-xs">{productName}</span>
      </nav>

      {/* Main Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs">
        {/* Product Image Frame */}
        <div className="relative h-96 sm:h-[450px] bg-slate-50 rounded-2xl flex items-center justify-center p-8 overflow-hidden border border-slate-100">
          <img
            src={imageUrl}
            alt={productName}
            onError={handleImageError}
            className="w-full h-full object-contain mix-blend-multiply transition-transform duration-500 hover:scale-105"
          />

          {discount > 0 && (
            <div className="absolute top-4 right-4">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-red-600 text-white shadow-sm">
                {formatDiscount(discount)}
              </span>
            </div>
          )}
        </div>

        {/* Product Information */}
        <div className="space-y-6">
          <div>
            {categoryName && (
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-600">
                {categoryName}
              </span>
            )}
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1 leading-snug">
              {productName}
            </h1>
          </div>

          {/* Pricing Block */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Total Price
              </span>
              <div className="flex items-baseline gap-3 mt-1">
                {specialPrice && specialPrice < price ? (
                  <>
                    <span className="text-3xl font-black text-emerald-600">
                      {formatPrice(specialPrice)}
                    </span>
                    <span className="text-base text-slate-400 line-through font-medium">
                      {formatPrice(price)}
                    </span>
                  </>
                ) : (
                  <span className="text-3xl font-black text-slate-900">
                    {formatPrice(price)}
                  </span>
                )}
              </div>
            </div>

            <div>
              <span
                className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-xs ${
                  isAvailable
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    : "bg-red-100 text-red-800 border border-red-200"
                }`}
              >
                {isAvailable ? `${quantity} Available In Stock` : "Out of Stock"}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Product Overview
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {description}
            </p>
          </div>

          {/* Quantity and Add-to-Cart */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            {isAvailable ? (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                {/* Quantity Control */}
                <div className="flex items-center border border-slate-300 rounded-xl bg-white shadow-xs">
                  <button
                    onClick={handleQuantityDecrement}
                    disabled={selectedQuantity <= 1}
                    className="p-3 text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 text-sm font-bold text-slate-900 select-none min-w-10 text-center">
                    {selectedQuantity}
                  </span>
                  <button
                    onClick={handleQuantityIncrement}
                    disabled={selectedQuantity >= quantity}
                    className="p-3 text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Primary Add Button */}
                <Button
                  variant="primary"
                  size="lg"
                  isLoading={isAdding}
                  onClick={handleAddToCart}
                  leftIcon={
                    isSuccess ? <Check className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />
                  }
                  className={`flex-1 ${isSuccess ? "bg-emerald-600 hover:bg-emerald-700" : ""}`}
                >
                  {isSuccess ? "Added to Shopping Cart!" : "Add to Cart"}
                </Button>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-red-50 text-red-700 text-sm font-medium border border-red-200">
                This item is currently sold out. Check back later for restock alerts.
              </div>
            )}
          </div>

          {/* Guarantees Matrix */}
          <div className="grid grid-cols-3 gap-3 pt-6 border-t border-slate-100 text-slate-600">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-cyan-600 shrink-0" />
              <span className="text-[11px] font-medium">Fast Dispatch</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-600 shrink-0" />
              <span className="text-[11px] font-medium">1 Year Warranty</span>
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-cyan-600 shrink-0" />
              <span className="text-[11px] font-medium">30-Day Returns</span>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Related Products in {categoryName}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map((rel) => (
              <ProductCard key={rel.productId} product={rel} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;
