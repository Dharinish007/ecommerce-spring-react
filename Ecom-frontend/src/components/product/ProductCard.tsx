import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ProductDTO } from "@/types/product.types";
import { formatPrice, formatDiscount } from "@/utils/formatters";
import { resolveProductImageUrl, handleImageError } from "@/utils/imageUtils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addToCart } from "@/store/slices/cartSlice";
import { addToast } from "@/store/slices/uiSlice";
import { ShoppingBag, Check, Loader2 } from "lucide-react";

export interface ProductCardProps {
  product: ProductDTO;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const {
    productId,
    productName,
    description,
    image,
    quantity,
    price,
    discount,
    specialPrice,
    categoryName,
  } = product;

  const isAvailable = quantity > 0;
  const imageUrl = resolveProductImageUrl(image);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

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
      await dispatch(addToCart({ productId, quantity: 1 })).unwrap();
      setJustAdded(true);
      dispatch(
        addToast({
          type: "success",
          message: `Added "${productName}" to your cart!`,
        })
      );
      setTimeout(() => setJustAdded(false), 2000);
    } catch (err: unknown) {
      const errMsg = typeof err === "string" ? err : "Failed to add product to cart.";
      dispatch(
        addToast({
          type: "error",
          message: errMsg,
        })
      );
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="group relative flex flex-col h-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-xl hover:border-slate-300 transition-all duration-300 hover:-translate-y-1">
      {/* Image Container */}
      <Link
        to={`/products/${productId}`}
        className="relative h-56 bg-slate-50 flex items-center justify-center p-6 overflow-hidden cursor-pointer"
        tabIndex={-1}
      >
        <img
          src={imageUrl}
          alt={productName}
          onError={handleImageError}
          loading="lazy"
          className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
        />

        {/* Stock Badge */}
        <div className="absolute top-3 left-3">
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase shadow-xs ${
              isAvailable
                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                : "bg-red-100 text-red-800 border border-red-200"
            }`}
          >
            {isAvailable ? "In Stock" : "Out of Stock"}
          </span>
        </div>

        {/* Discount Badge */}
        {discount > 0 && (
          <div className="absolute top-3 right-3">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-600 text-white shadow-xs">
              {formatDiscount(discount)}
            </span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        {categoryName && (
          <span className="text-[11px] font-bold text-cyan-600 uppercase tracking-wider mb-1">
            {categoryName}
          </span>
        )}

        <Link
          to={`/products/${productId}`}
          className="text-base font-bold text-slate-900 group-hover:text-cyan-600 transition-colors line-clamp-2 leading-snug cursor-pointer mb-2"
        >
          {productName}
        </Link>

        <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
          {description}
        </p>

        {/* Price & Action Section */}
        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            {specialPrice && specialPrice < price ? (
              <div className="flex flex-col">
                <span className="text-xs text-slate-400 line-through font-medium leading-none">
                  {formatPrice(price)}
                </span>
                <span className="text-lg font-black text-emerald-600 leading-tight">
                  {formatPrice(specialPrice)}
                </span>
              </div>
            ) : (
              <span className="text-lg font-black text-slate-900 leading-tight">
                {formatPrice(price)}
              </span>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            disabled={!isAvailable || isAdding}
            aria-label={`Add ${productName} to cart`}
            className={`
              inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shrink-0 shadow-xs
              ${
                justAdded
                  ? "bg-emerald-600 text-white"
                  : isAvailable
                  ? "bg-slate-900 hover:bg-cyan-600 text-white active:scale-95"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }
            `}
          >
            {isAdding ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : justAdded ? (
              <>
                <Check className="w-4 h-4" />
                <span>Added</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                <span>{isAvailable ? "Add" : "Sold"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
