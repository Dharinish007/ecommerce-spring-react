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
  Zap,
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
  const [isBuyingNow, setIsBuyingNow] = useState(false);
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
          .getProductsByCategory(data.categoryId, { pageSize: 5 })
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Skeleton className="h-4 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-6 rounded-2xl border border-slate-200">
          <Skeleton className="h-96 rounded-xl" />
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
  const isLowStock = isAvailable && quantity <= 5;
  const imageUrl = resolveProductImageUrl(image);
  const effectivePrice = specialPrice && specialPrice < price ? specialPrice : price;
  const savings = specialPrice && specialPrice < price ? price - specialPrice : 0;

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
      navigate(`/login?redirect=/products/${product.productId}`);
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

  const handleBuyNow = async () => {
    if (!isAvailable) return;

    if (!isAuthenticated) {
      dispatch(
        addToast({
          type: "info",
          message: "Please sign in to complete checkout.",
        })
      );
      navigate(`/login?redirect=/checkout`);
      return;
    }

    setIsBuyingNow(true);
    try {
      await dispatch(
        addToCart({ productId: product.productId, quantity: selectedQuantity })
      ).unwrap();
      navigate("/checkout");
    } catch (err: unknown) {
      const msg = typeof err === "string" ? err : "Failed to proceed to checkout.";
      dispatch(addToast({ type: "error", message: msg }));
    } finally {
      setIsBuyingNow(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500">
        <Link to="/" className="hover:text-slate-900 transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <Link to="/products" className="hover:text-slate-900 transition-colors">
          Products
        </Link>
        {categoryName && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <Link
              to={`/products?category=${categoryId}`}
              className="hover:text-slate-900 transition-colors"
            >
              {categoryName}
            </Link>
          </>
        )}
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="font-semibold text-slate-800 truncate max-w-xs">{productName}</span>
      </nav>

      {/* Main Product Presentation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
        {/* Product Image Stage */}
        <div className="relative h-80 sm:h-[420px] bg-slate-50 rounded-xl flex items-center justify-center p-6 overflow-hidden border border-slate-100">
          <img
            src={imageUrl}
            alt={productName}
            onError={handleImageError}
            className="w-full h-full object-contain mix-blend-multiply transition-transform duration-300 hover:scale-105"
          />

          {discount > 0 && (
            <div className="absolute top-4 right-4">
              <span className="px-2.5 py-1 rounded-md text-xs font-black bg-red-600 text-white shadow-xs">
                {formatDiscount(discount)}
              </span>
            </div>
          )}
        </div>

        {/* Product Information Column */}
        <div className="space-y-6">
          <div>
            {categoryName && (
              <Link
                to={`/products?category=${categoryId}`}
                className="text-xs font-bold uppercase tracking-wider text-amber-700 hover:underline"
              >
                {categoryName}
              </Link>
            )}
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1 leading-snug">
              {productName}
            </h1>
          </div>

          {/* Pricing Block */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-slate-950">
                {formatPrice(effectivePrice)}
              </span>
              {specialPrice && specialPrice < price && (
                <span className="text-sm text-slate-400 line-through font-medium">
                  M.R.P: {formatPrice(price)}
                </span>
              )}
              {discount > 0 && (
                <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                  Save {formatPrice(savings)} ({Math.round(discount)}% off)
                </span>
              )}
            </div>

            <div className="text-[11px] text-slate-500">
              Inclusive of all taxes. Free shipping available on eligible orders.
            </div>

            {/* Stock State */}
            <div className="pt-2">
              <span
                className={`inline-block px-2.5 py-1 rounded text-xs font-bold tracking-wide uppercase ${
                  !isAvailable
                    ? "bg-red-100 text-red-800 border border-red-200"
                    : isLowStock
                    ? "bg-amber-100 text-amber-900 border border-amber-300"
                    : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                }`}
              >
                {!isAvailable
                  ? "Currently Unavailable"
                  : isLowStock
                  ? `Only ${quantity} units left in stock - order soon`
                  : "In Stock - Ready for Dispatch"}
              </span>
            </div>
          </div>

          {/* Product Overview / Description */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Description &amp; Specifications
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {description}
            </p>
          </div>

          {/* Quantity and Actions */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            {isAvailable ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-700">Quantity:</span>
                  <div className="flex items-center border border-slate-300 rounded-lg bg-white">
                    <button
                      onClick={handleQuantityDecrement}
                      disabled={selectedQuantity <= 1}
                      className="p-2 text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 text-xs font-bold text-slate-900 select-none min-w-8 text-center">
                      {selectedQuantity}
                    </span>
                    <button
                      onClick={handleQuantityIncrement}
                      disabled={selectedQuantity >= quantity}
                      className="p-2 text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                  <Button
                    variant="primary"
                    size="lg"
                    isLoading={isAdding}
                    onClick={handleAddToCart}
                    leftIcon={
                      isSuccess ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />
                    }
                    className={`flex-1 ${
                      isSuccess ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-slate-900 hover:bg-slate-800 text-white"
                    }`}
                  >
                    {isSuccess ? "Added to Cart!" : "Add to Cart"}
                  </Button>

                  <Button
                    variant="secondary"
                    size="lg"
                    isLoading={isBuyingNow}
                    onClick={handleBuyNow}
                    leftIcon={<Zap className="w-4 h-4 text-slate-950" />}
                    className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold border-none"
                  >
                    Buy Now
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-lg bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
                This item is currently sold out. We restock our catalog daily.
              </div>
            )}
          </div>

          {/* Genuine Marketplace Guarantees Matrix */}
          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-100 text-slate-600">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
              <Truck className="w-4 h-4 text-amber-600 shrink-0" />
              <div className="text-[11px] leading-tight">
                <span className="font-bold block text-slate-800">Fast Delivery</span>
                <span className="text-slate-500">Across India</span>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="text-[11px] leading-tight">
                <span className="font-bold block text-slate-800">100% Genuine</span>
                <span className="text-slate-500">Brand Warranty</span>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
              <RotateCcw className="w-4 h-4 text-amber-600 shrink-0" />
              <div className="text-[11px] leading-tight">
                <span className="font-bold block text-slate-800">7 Days</span>
                <span className="text-slate-500">Easy Replacement</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products Rail */}
      {relatedProducts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Related Products in {categoryName}
            </h2>
            <Link
              to={`/products?category=${categoryId}`}
              className="text-xs font-bold text-amber-700 hover:underline"
            >
              See more in category
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
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
