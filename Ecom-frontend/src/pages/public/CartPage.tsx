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
          description="Your cart items are securely saved to your account. Sign in now to view and complete your orders."
          icon={<ShoppingBag className="w-8 h-8 text-cyan-600" />}
          actionLabel="Sign In Now"
          onAction={() => navigate("/login?redirect=/cart")}
        />
      </div>
    );
  }

  if (isLoading && !cart) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="h-8 w-48 bg-slate-200 animate-pulse rounded-lg" />
        <TableSkeleton rows={4} />
      </div>
    );
  }

  const products = cart?.products || [];
  const totalPrice = cart?.totalPrice || 0;
  const isFreeShipping = totalPrice >= 50;
  const shippingFee = isFreeShipping ? 0 : 9.99;
  const grandTotal = totalPrice + shippingFee;

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
          description="Looks like you haven't added any enterprise electronics to your cart yet. Explore our verified hardware collection today."
          icon={<ShoppingBag className="w-8 h-8 text-slate-400" />}
          actionLabel="Start Shopping"
          onAction={() => navigate("/products")}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Shopping Cart
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review your selected products and proceed to secure checkout
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Cart Item List */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800">
              Cart Items ({products.length})
            </h2>
            <Link
              to="/products"
              className="text-xs font-semibold text-cyan-600 hover:text-cyan-700"
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
                  className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors hover:bg-slate-50/50"
                >
                  {/* Thumbnail & Name */}
                  <div className="flex items-center gap-4 flex-1">
                    <Link
                      to={`/products/${item.productId}`}
                      className="w-20 h-20 bg-slate-50 rounded-xl p-2 border border-slate-100 shrink-0 flex items-center justify-center overflow-hidden"
                    >
                      <img
                        src={imageUrl}
                        alt={item.productName}
                        onError={handleImageError}
                        className="w-full h-full object-contain mix-blend-multiply"
                      />
                    </Link>

                    <div className="space-y-1">
                      {item.categoryName && (
                        <span className="text-[10px] font-bold text-cyan-600 uppercase tracking-wider block">
                          {item.categoryName}
                        </span>
                      )}
                      <Link
                        to={`/products/${item.productId}`}
                        className="text-sm font-bold text-slate-900 hover:text-cyan-600 transition-colors line-clamp-1"
                      >
                        {item.productName}
                      </Link>
                      <div className="text-xs font-medium text-slate-500">
                        Unit Price:{" "}
                        <span className="font-semibold text-slate-800">
                          {formatPrice(itemPrice)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quantity Controller */}
                  <div className="flex items-center gap-6 self-end sm:self-center">
                    <div className="flex items-center border border-slate-200 rounded-xl bg-white shadow-2xs">
                      <button
                        onClick={() => handleUpdateQuantity(item.productId, "decrement")}
                        disabled={isUpdating}
                        className="p-2 text-slate-500 hover:text-slate-800 disabled:opacity-30 cursor-pointer"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 text-xs font-bold text-slate-900 min-w-8 text-center select-none">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(item.productId, "increment")}
                        disabled={isUpdating}
                        className="p-2 text-slate-500 hover:text-slate-800 disabled:opacity-30 cursor-pointer"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Subtotal */}
                    <div className="text-right min-w-20">
                      <span className="text-sm font-black text-slate-900 block">
                        {formatPrice(itemTotal)}
                      </span>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => handleRemoveItem(item.productId)}
                      disabled={isUpdating}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
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
        <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          <h2 className="text-base font-bold text-slate-900 pb-4 border-b border-slate-100">
            Order Summary
          </h2>

          {/* Shipping Threshold banner */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
            <div className="flex items-center justify-between font-semibold">
              <span className="text-slate-700 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-cyan-600" />
                Delivery Standard
              </span>
              <span className={isFreeShipping ? "text-emerald-600 font-bold" : "text-slate-600"}>
                {isFreeShipping ? "FREE" : "$9.99"}
              </span>
            </div>
            {!isFreeShipping && (
              <p className="text-[11px] text-slate-500">
                Add <span className="font-bold text-cyan-600">{formatPrice(50 - totalPrice)}</span>{" "}
                more to unlock Free Standard Shipping!
              </p>
            )}
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Items Subtotal</span>
              <span className="font-semibold text-slate-900">{formatPrice(totalPrice)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Estimated Shipping</span>
              <span className="font-semibold text-slate-900">
                {isFreeShipping ? "FREE" : formatPrice(shippingFee)}
              </span>
            </div>
            <div className="border-t border-slate-100 pt-3 flex justify-between items-baseline">
              <span className="text-sm font-bold text-slate-900">Estimated Total</span>
              <span className="text-xl font-black text-cyan-700">{formatPrice(grandTotal)}</span>
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate("/checkout")}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="w-full shadow-md"
          >
            Proceed to Checkout
          </Button>

          <div className="pt-2 border-t border-slate-100 space-y-2 text-[11px] text-slate-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Verified TLS-encrypted checkout</span>
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-cyan-600 shrink-0" />
              <span>30-day money-back guarantee</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
