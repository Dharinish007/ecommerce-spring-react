import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import ordersApi from "@/api/orders.api";
import { OrderDTO } from "@/types/order.types";
import { formatPrice, formatDate } from "@/utils/formatters";
import Button from "@/components/common/Button";
import { Skeleton } from "@/components/common/Skeleton";
import { CheckCircle2, Package, Truck, MapPin, Store } from "lucide-react";

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
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <Skeleton className="h-16 w-16 mx-auto rounded-full" />
        <Skeleton className="h-8 w-3/4 mx-auto" />
        <Skeleton className="h-4 w-1/2 mx-auto" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-8">
      {/* Celebration Header */}
      <div className="space-y-3">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-600 shadow-md">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Order Confirmed!
        </h1>
        <p className="text-sm text-slate-500">
          Thank you for your purchase. We have received your order and our logistics team is
          preparing your shipment.
        </p>
      </div>

      {/* Summary Card */}
      {order && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 text-left shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Order Reference
              </span>
              <span className="text-base font-black text-slate-900">
                Order #{order.orderId}
              </span>
            </div>
            <div className="sm:text-right">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Date &amp; Time
              </span>
              <span className="text-xs font-semibold text-slate-700">
                {formatDate(order.orderDate)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            {/* Delivery address */}
            {order.address && (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <MapPin className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Delivery Address</span>
                </div>
                <p className="text-slate-600 font-medium">{order.address.buildingName}</p>
                <p className="text-slate-600">{order.address.street}</p>
                <p className="text-slate-600">
                  {order.address.city}, {order.address.state} - {order.address.pincode}
                </p>
              </div>
            )}

            {/* Payment & Status */}
            <div className="space-y-2">
              <div>
                <span className="font-bold text-slate-800 block">Payment Method</span>
                <span className="text-slate-600 font-medium">
                  {order.payment?.paymentMethod || "Standard Payment"}
                </span>
              </div>
              <div>
                <span className="font-bold text-slate-800 block">Total Amount</span>
                <span className="text-lg font-black text-cyan-700">
                  {formatPrice(order.totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Item List preview */}
          {order.orderItems && order.orderItems.length > 0 && (
            <div className="border-t border-slate-100 pt-4">
              <span className="text-xs font-bold text-slate-800 block mb-2">
                Ordered Items ({order.orderItems.length})
              </span>
              <div className="space-y-2">
                {order.orderItems.map((item) => (
                  <div
                    key={item.orderItemId}
                    className="flex items-center justify-between text-xs py-1"
                  >
                    <span className="text-slate-700 font-medium truncate max-w-xs">
                      {item.product?.productName || `Product #${item.orderItemId}`}
                    </span>
                    <span className="text-slate-500 font-semibold">
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
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        {orderId && (
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate(`/orders/${orderId}`)}
            leftIcon={<Package className="w-4 h-4" />}
          >
            Track Order Details
          </Button>
        )}
        <Link
          to="/products"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <Store className="w-4 h-4" />
          <span>Continue Shopping</span>
        </Link>
      </div>

      <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
        <Truck className="w-4 h-4 text-cyan-600" />
        <span>Inventory reserved automatically in backend database</span>
      </div>
    </div>
  );
};

export default OrderSuccessPage;
