import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import ordersApi from "@/api/orders.api";
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
      const msg = err instanceof Error ? err.message : "Failed to load order details.";
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-32 rounded-3xl" />
        <Skeleton className="h-96 rounded-3xl" />
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
    { label: "Confirmed", status: "CONFIRMED", icon: <CheckCircle2 className="w-5 h-5" /> },
    { label: "Processing", status: "PROCESSING", icon: <Clock className="w-5 h-5" /> },
    { label: "Shipped", status: "SHIPPED", icon: <Truck className="w-5 h-5" /> },
    { label: "Delivered", status: "DELIVERED", icon: <Package className="w-5 h-5" /> },
  ];

  const orderStatusIndex = (() => {
    switch (order.orderStatus) {
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500">
        <Link to="/" className="hover:text-cyan-600 transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <Link to="/orders" className="hover:text-cyan-600 transition-colors">
          My Orders
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="font-semibold text-slate-800">Order #{order.orderId}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Order #{order.orderId}
            </h1>
            <Badge
              variant={
                order.orderStatus === "DELIVERED"
                  ? "success"
                  : order.orderStatus === "CANCELLED"
                  ? "danger"
                  : "info"
              }
              size="md"
            >
              {order.orderStatus}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">Placed on {formatDate(order.orderDate)}</p>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-400 uppercase font-semibold block">Total Paid</span>
          <span className="text-2xl font-black text-cyan-700">{formatPrice(order.totalAmount)}</span>
        </div>
      </div>

      {/* Tracking Timeline */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <h2 className="text-sm font-bold text-slate-800 mb-6 uppercase tracking-wider">
          Fulfillment Status
        </h2>

        {isCancelled ? (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>This order was cancelled. Stock has been safely returned to inventory.</span>
          </div>
        ) : (
          <div className="relative">
            {/* Horizontal progress bar */}
            <div className="hidden sm:block absolute top-5 left-8 right-8 h-1 bg-slate-200 -z-0">
              <div
                className="h-full bg-cyan-600 transition-all duration-500"
                style={{
                  width: `${(orderStatusIndex / (stages.length - 1)) * 100}%`,
                }}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 relative z-10">
              {stages.map((stage, idx) => {
                const isPassed = idx <= orderStatusIndex;
                const isCurrent = idx === orderStatusIndex;

                return (
                  <div key={stage.status} className="flex flex-col items-center text-center gap-2">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ${
                        isPassed
                          ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30"
                          : "bg-slate-100 text-slate-400 border border-slate-200"
                      }`}
                    >
                      {stage.icon}
                    </div>
                    <span
                      className={`text-xs font-bold ${
                        isCurrent
                          ? "text-cyan-700"
                          : isPassed
                          ? "text-slate-800"
                          : "text-slate-400"
                      }`}
                    >
                      {stage.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Addresses & Payment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Delivery Address */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2 font-bold text-slate-800 pb-3 border-b border-slate-100">
            <MapPin className="w-4 h-4 text-cyan-600" />
            <h3 className="text-sm">Delivery Address</h3>
          </div>
          {order.address ? (
            <div className="text-xs text-slate-600 space-y-1">
              <p className="font-bold text-slate-800 text-sm">{order.address.buildingName}</p>
              <p>{order.address.street}</p>
              <p>
                {order.address.city}, {order.address.state} - {order.address.pincode}
              </p>
              <p className="font-semibold text-slate-500">{order.address.country}</p>
            </div>
          ) : (
            <p className="text-xs text-slate-400">Address record attached to ID #{order.addressId}</p>
          )}
        </div>

        {/* Payment Record */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2 font-bold text-slate-800 pb-3 border-b border-slate-100">
            <CreditCard className="w-4 h-4 text-cyan-600" />
            <h3 className="text-sm">Payment Confirmation</h3>
          </div>
          <div className="text-xs text-slate-600 space-y-2">
            <div className="flex justify-between">
              <span>Payment Mode</span>
              <span className="font-bold text-slate-800">
                {order.payment?.paymentMethod || "Direct Payment"}
              </span>
            </div>
            {order.payment?.pgPaymentId && (
              <div className="flex justify-between">
                <span>Transaction Ref</span>
                <span className="font-mono text-slate-700">{order.payment.pgPaymentId}</span>
              </div>
            )}
            {order.payment?.pgStatus && (
              <div className="flex justify-between">
                <span>Gateway Status</span>
                <Badge variant="success">{order.payment.pgStatus}</Badge>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ordered Items Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">
            Items in Order ({order.orderItems?.length || 0})
          </h3>
        </div>

        <div className="divide-y divide-slate-100">
          {order.orderItems?.map((item) => {
            const product = item.product;
            const imageUrl = resolveProductImageUrl(product?.image);
            const lineTotal = item.orderedProductPrice * item.quantity;

            return (
              <div
                key={item.orderItemId}
                className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-slate-50 p-2 border border-slate-100 shrink-0 flex items-center justify-center">
                    <img
                      src={imageUrl}
                      alt={product?.productName || "Product"}
                      onError={handleImageError}
                      className="w-full h-full object-contain mix-blend-multiply"
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      {product?.productName || "Hardware Item"}
                    </h4>
                    <p className="text-xs text-slate-500">
                      Unit Price: {formatPrice(item.orderedProductPrice)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-8 self-end sm:self-center">
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Quantity</span>
                    <span className="text-sm font-bold text-slate-800">{item.quantity}</span>
                  </div>

                  <div className="text-right min-w-24">
                    <span className="text-xs text-slate-400 block">Subtotal</span>
                    <span className="text-base font-black text-slate-900">
                      {formatPrice(lineTotal)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
