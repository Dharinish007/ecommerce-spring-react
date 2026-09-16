import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import ordersApi from "@/api/orders.api";
import { OrderDTO } from "@/types/order.types";
import { formatPrice, formatDate } from "@/utils/formatters";
import Button from "@/components/common/Button";
import { Skeleton } from "@/components/common/Skeleton";
import { CheckCircle2, Package, Truck, MapPin, ShoppingBag } from "lucide-react";

export const OrderSuccessPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<OrderDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    ordersApi
      .getOrderById(Number(orderId))
      .then((data) => setOrder(data))
      .catch(() => setOrder(null))
      .finally(() => setIsLoading(false));
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <Skeleton className="h-16 w-16 mx-auto rounded-full" />
        <Skeleton className="h-8 w-3/4 mx-auto" />
        <Skeleton className="h-4 w-1/2 mx-auto" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-center space-y-8">
      {/* Celebration Header */}
      <div className="space-y-3">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-xs">
          <CheckCircle2 className="h-9 w-9" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Order Placed Successfully!
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
          Thank you for shopping with Angadi. We have confirmed your order and are dispatching your items.
        </p>
      </div>

      {/* Summary Card */}
      {order && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 text-left shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Order Reference
              </span>
              <span className="text-sm font-black text-slate-900">
                Order #{order.orderId}
              </span>
            </div>
            <div className="sm:text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Order Date
              </span>
              <span className="text-xs font-semibold text-slate-700">
                {formatDate(order.orderDate)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            {/* Delivery address */}
            {order.address && (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  <span>Delivery Address</span>
                </div>
                <p className="text-slate-700 font-medium">{order.address.buildingName}</p>
                <p className="text-slate-600">{order.address.street}</p>
                <p className="text-slate-600">
                  {order.address.city}, {order.address.state} - {order.address.pincode}
                </p>
              </div>
            )}

            {/* Payment & Status */}
            <div className="space-y-2">
              <div>
                <span className="font-bold text-slate-900 block">Payment Mode</span>
                <span className="text-slate-600 font-medium">
                  {order.payment?.paymentMethod || "Standard Payment"}
                </span>
              </div>
              <div>
                <span className="font-bold text-slate-900 block">Total Amount</span>
                <span className="text-lg font-black text-slate-950">
                  {formatPrice(order.totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Item List preview */}
          {order.orderItems && order.orderItems.length > 0 && (
            <div className="border-t border-slate-100 pt-3">
              <span className="text-xs font-bold text-slate-900 block mb-2">
                Items in this order ({order.orderItems.length})
              </span>
              <div className="space-y-1.5">
                {order.orderItems.map((item) => (
                  <div
                    key={item.orderItemId}
                    className="flex items-center justify-between text-xs py-1"
                  >
                    <span className="text-slate-700 font-medium truncate max-w-xs">
                      {item.product?.productName || `Product #${item.orderItemId}`}
                    </span>
                    <span className="text-slate-600 font-semibold">
                      Qty: {item.quantity} × {formatPrice(item.orderedProductPrice)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        {orderId && (
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate(`/orders/${orderId}`)}
            leftIcon={<Package className="w-4 h-4" />}
            className="bg-slate-900 hover:bg-slate-800 text-white"
          >
            Track Order Status
          </Button>
        )}
        <Link
          to="/products"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Continue Shopping</span>
        </Link>
      </div>

      <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
        <Truck className="w-4 h-4 text-amber-600" />
        <span>Estimated delivery within 3-5 business days across India</span>
      </div>
    </div>
  );
};

export default OrderSuccessPage;
