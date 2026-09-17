import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import ordersApi from "@/api/orders.api";
import { extractErrorMessage } from "@/api/client";
import { OrderDTO, OrderStatus } from "@/types/order.types";
import { formatPrice, formatDate } from "@/utils/formatters";
import { resolveProductImageUrl, handleImageError } from "@/utils/imageUtils";
import Badge from "@/components/common/Badge";
import { Skeleton } from "@/components/common/Skeleton";
import ErrorState from "@/components/common/ErrorState";
import {
  Package,
  MapPin,
  CreditCard,
  ChevronRight,
  CheckCircle2,
  Clock,
  Truck,
  AlertTriangle,
} from "lucide-react";

export const OrderDetailPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();

  const [order, setOrder] = useState<OrderDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrder = useCallback(async () => {
    if (!orderId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await ordersApi.getOrderById(Number(orderId));
      setOrder(data);
    } catch (err: unknown) {
      const msg = extractErrorMessage(err, "Failed to load order details.");
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <ErrorState
          title="Order Not Found"
          message={error || "We could not find the requested order record."}
          onRetry={loadOrder}
        />
      </div>
    );
  }

  // Tracking stages
  const stages: { label: string; status: OrderStatus; icon: React.ReactNode }[] = [
    { label: "Confirmed", status: "CONFIRMED", icon: <CheckCircle2 className="w-4 h-4" /> },
    { label: "Processing", status: "PROCESSING", icon: <Clock className="w-4 h-4" /> },
    { label: "Shipped", status: "SHIPPED", icon: <Truck className="w-4 h-4" /> },
    { label: "Delivered", status: "DELIVERED", icon: <Package className="w-4 h-4" /> },
  ];

  const orderStatusIndex = (() => {
    switch (order.orderStatus) {
      case "PENDING":
      case "CONFIRMED":
        return 0;
      case "PROCESSING":
        return 1;
      case "SHIPPED":
        return 2;
      case "DELIVERED":
        return 3;
      default:
        return 0;
    }
  })();

  const isCancelled = order.orderStatus === "CANCELLED";

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "DELIVERED":
      case "CONFIRMED":
        return <Badge variant="success">{status}</Badge>;
      case "PROCESSING":
        return <Badge variant="info">{status}</Badge>;
      case "SHIPPED":
        return <Badge variant="warning">{status}</Badge>;
      case "CANCELLED":
        return <Badge variant="danger">{status}</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500">
        <Link to="/" className="hover:text-slate-900 transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/orders" className="hover:text-slate-900 transition-colors">
          Orders
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-slate-800">Order #{order.orderId}</span>
      </nav>

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Order #{order.orderId}
            </h1>
            {getStatusBadge(order.orderStatus)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Placed on {formatDate(order.orderDate)} • Total:{" "}
            <span className="font-bold text-slate-900">{formatPrice(order.totalAmount)}</span>
          </p>
        </div>

        <Link
          to="/products"
          className="text-xs font-bold text-amber-700 hover:text-amber-800 self-start sm:self-auto"
        >
          &larr; Continue Shopping
        </Link>
      </div>

      {/* Order Progress Tracker */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6">
          Delivery Status
        </h2>

        {isCancelled ? (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 text-red-800 text-xs border border-red-200">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <div>
              <p className="font-bold">This order has been cancelled.</p>
              <p className="text-red-700 mt-0.5">
                If you made an online payment, a refund has been initiated to your original payment mode.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative">
            {stages.map((stage, idx) => {
              const isPast = idx < orderStatusIndex;
              const isCurrent = idx === orderStatusIndex;

              return (
                <div
                  key={stage.status}
                  className={`p-4 rounded-xl border flex flex-col items-center text-center gap-2 transition-colors ${
                    isCurrent
                      ? "border-amber-500 bg-amber-50/50 shadow-xs"
                      : isPast
                      ? "border-emerald-200 bg-emerald-50/30"
                      : "border-slate-100 bg-slate-50 opacity-60"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center ${
                      isCurrent
                        ? "bg-amber-500 text-slate-950 font-bold"
                        : isPast
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-200 text-slate-400"
                    }`}
                  >
                    {stage.icon}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      {stage.label}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {isCurrent ? "Current Status" : isPast ? "Completed" : "Pending"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Two Column Layout: Items & Shipping details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Ordered Items List */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">
              Items in this Order ({order.orderItems?.length || 0})
            </h2>
          </div>

          <div className="divide-y divide-slate-100">
            {order.orderItems?.map((item) => {
              const product = item.product;
              const imageUrl = resolveProductImageUrl(product?.image);
              const subtotal = item.orderedProductPrice * item.quantity;

              return (
                <div
                  key={item.orderItemId}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <div className="w-16 h-16 bg-slate-50 rounded-lg p-2 border border-slate-100 shrink-0 flex items-center justify-center overflow-hidden">
                      <img
                        src={imageUrl}
                        alt={product?.productName || "Product"}
                        onError={handleImageError}
                        className="w-full h-full object-contain mix-blend-multiply"
                      />
                    </div>

                    <div className="space-y-1 min-w-0">
                      {product?.productId ? (
                        <Link
                          to={`/products/${product.productId}`}
                          className="text-xs sm:text-sm font-bold text-slate-900 hover:text-amber-700 transition-colors line-clamp-1"
                        >
                          {product.productName}
                        </Link>
                      ) : (
                        <p className="text-xs font-bold text-slate-900">
                          {product?.productName || "Product"}
                        </p>
                      )}
                      <p className="text-xs text-slate-500">
                        Price:{" "}
                        <span className="font-semibold text-slate-800">
                          {formatPrice(item.orderedProductPrice)}
                        </span>{" "}
                        × {item.quantity} unit(s)
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-900 block">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Shipping & Payment Meta */}
        <div className="lg:col-span-1 space-y-4">
          {/* Shipping Address */}
          {order.address && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-900 pb-2 border-b border-slate-100">
                <MapPin className="w-4 h-4 text-amber-600" />
                <span>Delivery Address</span>
              </div>
              <p className="font-bold text-slate-900">{order.address.buildingName}</p>
              <p className="text-slate-600">{order.address.street}</p>
              <p className="text-slate-600">
                {order.address.city}, {order.address.state} - {order.address.pincode}
              </p>
              <p className="text-[10px] text-slate-400 font-bold uppercase pt-1">
                {order.address.country}
              </p>
            </div>
          )}

          {/* Payment & Invoice Overview */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3 text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-900 pb-2 border-b border-slate-100">
              <CreditCard className="w-4 h-4 text-amber-600" />
              <span>Payment Details</span>
            </div>
            <div className="space-y-2 text-slate-600">
              <div className="flex justify-between">
                <span>Payment Method</span>
                <span className="font-semibold text-slate-900">
                  {order.payment?.paymentMethod || "Standard Payment"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Payment Status</span>
                <span
                  className={`font-bold ${
                    order.payment?.pgStatus === "SUCCESS"
                      ? "text-emerald-700"
                      : order.payment?.pgStatus === "PENDING"
                      ? "text-amber-700"
                      : "text-red-700"
                  }`}
                >
                  {order.payment?.pgStatus === "SUCCESS"
                    ? "PAID"
                    : order.payment?.pgStatus === "PENDING"
                    ? "PENDING (COD)"
                    : order.payment?.pgStatus || "CONFIRMED"}
                </span>
              </div>

              {/* Price Breakdown */}
              <div className="border-t border-slate-100 pt-2 space-y-1.5 text-[11px]">
                <div className="flex justify-between text-slate-500">
                  <span>Items Subtotal</span>
                  <span className="font-medium text-slate-800">
                    {formatPrice(order.totalAmount - (order.shippingFee ?? 0))}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Delivery Fee</span>
                  <span className="font-medium text-slate-800">
                    {!order.shippingFee || order.shippingFee === 0
                      ? "FREE"
                      : formatPrice(order.shippingFee)}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-2 flex justify-between items-baseline font-bold text-slate-900">
                <span className="text-sm">Grand Total</span>
                <span className="text-lg font-black text-slate-950">
                  {formatPrice(order.totalAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
