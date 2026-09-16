import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchCart, updateCartItem, removeFromCart } from "@/store/slices/cartSlice";
import { addToast } from "@/store/slices/uiSlice";
import { formatPrice } from "@/utils/formatters";
import { resolveProductImageUrl, handleImageError } from "@/utils/imageUtils";
import Button from "@/components/common/Button";
import EmptyState from "@/components/common/EmptyState";
import { TableSkeleton } from "@/components/common/Skeleton";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { cart, isLoading, isUpdating } = useAppSelector((state) => state.cart);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchCart());
    }
  }, [isAuthenticated, dispatch]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <EmptyState
          title="Sign in to view your shopping cart"
          description="Your cart items are securely saved to your Angadi account. Sign in now to view and complete your purchase."
          icon={<ShoppingBag className="w-8 h-8 text-amber-600" />}
          actionLabel="Sign In Now"
          onAction={() => navigate("/login?redirect=/cart")}
        />
      </div>
    );
  }

  if (isLoading && !cart) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="h-8 w-48 bg-slate-200 animate-pulse rounded-lg" />
        <TableSkeleton rows={4} />
      </div>
    );
  }

  const products = cart?.products || [];
  const totalPrice = cart?.totalPrice || 0;
  const isFreeShipping = totalPrice >= 499;
  const shippingFee = isFreeShipping ? 0 : 49;
  const grandTotal = totalPrice + shippingFee;
  const totalItemCount = products.reduce((sum, item) => sum + item.quantity, 0);

  const handleUpdateQuantity = async (
    productId: number,
    operation: "increment" | "decrement"
  ) => {
    try {
      await dispatch(updateCartItem({ productId, operation })).unwrap();
    } catch (err: unknown) {
      const msg = typeof err === "string" ? err : "Failed to update item quantity.";
      dispatch(addToast({ type: "error", message: msg }));
    }
  };

  const handleRemoveItem = async (productId: number) => {
    if (!cart?.cartId) return;
    try {
      await dispatch(removeFromCart({ cartId: cart.cartId, productId })).unwrap();
      dispatch(addToast({ type: "info", message: "Item removed from cart." }));
    } catch (err: unknown) {
      const msg = typeof err === "string" ? err : "Failed to remove item.";
      dispatch(addToast({ type: "error", message: msg }));
    }
  };

  if (products.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <EmptyState
          title="Your shopping cart is empty"
          description="Your cart is currently empty. Explore top deals on mobiles, laptops, audio, and everyday essentials on Angadi."
          icon={<ShoppingBag className="w-8 h-8 text-slate-400" />}
          actionLabel="Shop Today's Deals"
          onAction={() => navigate("/products")}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Shopping Cart ({totalItemCount} {totalItemCount === 1 ? "item" : "items"})
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Review your selected items and proceed to fast, secure checkout
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Cart Item List */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              Cart Items
            </h2>
            <Link
              to="/products"
              className="text-xs font-semibold text-amber-700 hover:text-amber-800"
            >
              Continue Shopping
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {products.map((item) => {
              const itemPrice =
                item.specialPrice && item.specialPrice < item.price
                  ? item.specialPrice
                  : item.price;
              const itemTotal = itemPrice * item.quantity;
              const imageUrl = resolveProductImageUrl(item.image);

              return (
                <div
                  key={item.productId}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors hover:bg-slate-50/50"
                >
                  {/* Thumbnail & Title */}
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <Link
                      to={`/products/${item.productId}`}
                      className="w-18 h-18 bg-slate-50 rounded-lg p-2 border border-slate-100 shrink-0 flex items-center justify-center overflow-hidden"
                    >
                      <img
                        src={imageUrl}
                        alt={item.productName}
                        onError={handleImageError}
                        className="w-full h-full object-contain mix-blend-multiply"
                      />
                    </Link>

                    <div className="space-y-1 min-w-0">
                      {item.categoryName && (
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">
                          {item.categoryName}
                        </span>
                      )}
                      <Link
                        to={`/products/${item.productId}`}
                        className="text-xs sm:text-sm font-bold text-slate-900 hover:text-amber-700 transition-colors line-clamp-2"
                      >
                        {item.productName}
                      </Link>
                      <div className="text-xs text-slate-500">
                        Price:{" "}
                        <span className="font-bold text-slate-900">
                          {formatPrice(itemPrice)}
                        </span>
                        {item.specialPrice && item.specialPrice < item.price && (
                          <span className="text-[11px] text-slate-400 line-through ml-1.5">
                            {formatPrice(item.price)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quantity & Actions */}
                  <div className="flex items-center gap-4 sm:gap-6 self-end sm:self-center shrink-0">
                    <div className="flex items-center border border-slate-200 rounded-lg bg-white">
                      <button
                        onClick={() => handleUpdateQuantity(item.productId, "decrement")}
                        disabled={isUpdating}
                        className="p-1.5 text-slate-500 hover:text-slate-800 disabled:opacity-30 cursor-pointer"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2.5 text-xs font-bold text-slate-900 min-w-7 text-center select-none">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(item.productId, "increment")}
                        disabled={isUpdating}
                        className="p-1.5 text-slate-500 hover:text-slate-800 disabled:opacity-30 cursor-pointer"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Subtotal */}
                    <div className="text-right min-w-18">
                      <span className="text-sm font-extrabold text-slate-950 block">
                        {formatPrice(itemTotal)}
                      </span>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => handleRemoveItem(item.productId)}
                      disabled={isUpdating}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Summary Box */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-5">
          <h2 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">
            Order Summary
          </h2>

          {/* Shipping Threshold banner */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1 text-xs">
            <div className="flex items-center justify-between font-semibold">
              <span className="text-slate-700 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-amber-600" />
                Delivery
              </span>
              <span className={isFreeShipping ? "text-emerald-700 font-bold" : "text-slate-700"}>
                {isFreeShipping ? "FREE" : "₹49"}
              </span>
            </div>
            {!isFreeShipping && (
              <p className="text-[11px] text-slate-600">
                Add <span className="font-bold text-amber-700">{formatPrice(499 - totalPrice)}</span>{" "}
                more to unlock Free Delivery!
              </p>
            )}
            {isFreeShipping && (
              <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Your order is eligible for Free Delivery
              </p>
            )}
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal ({totalItemCount} items)</span>
              <span className="font-semibold text-slate-900">{formatPrice(totalPrice)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Delivery Fee</span>
              <span className="font-semibold text-slate-900">
                {isFreeShipping ? "FREE" : formatPrice(shippingFee)}
              </span>
            </div>
            <div className="border-t border-slate-100 pt-3 flex justify-between items-baseline">
              <span className="text-sm font-bold text-slate-900">Order Total</span>
              <span className="text-xl font-black text-slate-950">{formatPrice(grandTotal)}</span>
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate("/checkout")}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-xs border-none"
          >
            Proceed to Buy ({totalItemCount} {totalItemCount === 1 ? "item" : "items"})
          </Button>

          <div className="pt-2 border-t border-slate-100 space-y-2 text-[11px] text-slate-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Safe &amp; Secure Checkout</span>
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-amber-600 shrink-0" />
              <span>7 Days Replacement Policy</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
