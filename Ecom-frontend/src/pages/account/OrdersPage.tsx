import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ordersApi from "@/api/orders.api";
import { OrderDTO, OrderResponse, OrderStatus } from "@/types/order.types";
import { formatPrice, formatDate } from "@/utils/formatters";
import Badge from "@/components/common/Badge";
import Pagination from "@/components/common/Pagination";
import EmptyState from "@/components/common/EmptyState";
import { TableSkeleton } from "@/components/common/Skeleton";
import ErrorState from "@/components/common/ErrorState";
import { Package, Eye, Calendar, CreditCard } from "lucide-react";

export const OrdersPage: React.FC = () => {
  const navigate = useNavigate();

  const [orderData, setOrderData] = useState<OrderResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = async (page: number = 0) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await ordersApi.getUserOrders(page, 10, "orderDate", "desc");
      setOrderData(data);
      setCurrentPage(page);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load order history.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders(0);
  }, []);

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

  const orders = orderData?.content || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          My Orders
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Track shipments, view detailed invoices, and monitor order fulfillment
        </p>
      </div>

      {isLoading ? (
        <TableSkeleton rows={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => loadOrders(currentPage)} />
      ) : orders.length === 0 ? (
        <EmptyState
          title="No orders placed yet"
          description="You have not placed any orders with ApexStore yet. Start exploring our verified electronics catalog."
          icon={<Package className="w-8 h-8 text-slate-400" />}
          actionLabel="Explore Catalog"
          onAction={() => navigate("/products")}
        />
      ) : (
        <div className="space-y-6">
          <div className="space-y-4">
            {orders.map((order: OrderDTO) => (
              <div
                key={order.orderId}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:border-slate-300 transition-all space-y-4"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Package className="w-5 h-5 text-cyan-600" />
                      <span className="text-base font-bold text-slate-900">
                        Order #{order.orderId}
                      </span>
                    </div>
                    {getStatusBadge(order.orderStatus)}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 font-semibold uppercase block">
                        Total
                      </span>
                      <span className="text-base font-black text-cyan-700">
                        {formatPrice(order.totalAmount)}
                      </span>
                    </div>

                    <Link
                      to={`/orders/${order.orderId}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-cyan-600 transition-colors shadow-2xs"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Details</span>
                    </Link>
                  </div>
                </div>

                {/* Body Meta */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Placed on {formatDate(order.orderDate)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Payment: {order.payment?.paymentMethod || "Standard"}</span>
                  </div>

                  <div>
                    <span className="font-semibold text-slate-800">
                      {order.orderItems?.length || 0} product(s) in order
                    </span>
                  </div>
                </div>

                {/* Items preview preview */}
                {order.orderItems && order.orderItems.length > 0 && (
                  <div className="bg-slate-50 rounded-2xl p-4 flex flex-wrap items-center gap-3 text-xs">
                    {order.orderItems.map((item) => (
                      <div
                        key={item.orderItemId}
                        className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 font-medium truncate max-w-xs"
                      >
                        {item.quantity}x {item.product?.productName || "Product"}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {orderData && (
            <Pagination
              pageNumber={orderData.pageNumber}
              totalPages={orderData.totalPages}
              totalElements={orderData.totalElements}
              onPageChange={(page) => loadOrders(page)}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
