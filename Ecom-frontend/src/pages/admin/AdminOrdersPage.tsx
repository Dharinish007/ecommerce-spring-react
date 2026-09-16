import React, { useEffect, useState } from "react";
import adminApi from "@/api/admin.api";
import { OrderDTO, OrderResponse, OrderStatus } from "@/types/order.types";
import { formatPrice, formatDate } from "@/utils/formatters";
import { useAppDispatch } from "@/store/hooks";
import { addToast } from "@/store/slices/uiSlice";
import Badge from "@/components/common/Badge";
import Modal from "@/components/common/Modal";
import Pagination from "@/components/common/Pagination";
import { TableSkeleton } from "@/components/common/Skeleton";
import ErrorState from "@/components/common/ErrorState";
import { Eye, MapPin } from "lucide-react";

export const AdminOrdersPage: React.FC = () => {
  const dispatch = useAppDispatch();

  const [orderData, setOrderData] = useState<OrderResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Order Details Modal
  const [selectedOrder, setSelectedOrder] = useState<OrderDTO | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<number | null>(null);

  const loadOrders = async (page: number = 0) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminApi.getAllOrders(page, 15, "orderDate", "desc");
      setOrderData(data);
      setCurrentPage(page);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load orders.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders(0);
  }, []);

  const handleStatusChange = async (orderId: number, newStatus: OrderStatus) => {
    setIsUpdatingStatus(orderId);
    try {
      await adminApi.updateOrderStatus(orderId, newStatus);
      dispatch(
        addToast({
          type: "success",
          message: `Order #${orderId} status updated to ${newStatus}!`,
        })
      );
      loadOrders(currentPage);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to update order status.";
      dispatch(addToast({ type: "error", message: msg }));
    } finally {
      setIsUpdatingStatus(null);
    }
  };

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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Customer Order Fulfillment
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Review customer purchase transactions and advance dispatch workflow states
        </p>
      </div>

      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => loadOrders(currentPage)} />
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-xs text-slate-500">
          No customer orders found in the database.
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-6">Order ID</th>
                  <th className="py-3.5 px-6">Customer Email</th>
                  <th className="py-3.5 px-6">Placed At</th>
                  <th className="py-3.5 px-6">Amount</th>
                  <th className="py-3.5 px-6">Payment</th>
                  <th className="py-3.5 px-6">Current Status</th>
                  <th className="py-3.5 px-6">Update Workflow</th>
                  <th className="py-3.5 px-6 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <tr key={order.orderId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-900">
                      #{order.orderId}
                    </td>
                    <td className="py-4 px-6 text-slate-600 truncate max-w-[180px]">
                      {order.email}
                    </td>
                    <td className="py-4 px-6 text-slate-500">
                      {formatDate(order.orderDate)}
                    </td>
                    <td className="py-4 px-6 font-black text-slate-900">
                      {formatPrice(order.totalAmount)}
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-700">
                      {order.payment?.paymentMethod || "Standard"}
                    </td>
                    <td className="py-4 px-6">{getStatusBadge(order.orderStatus)}</td>

                    {/* Status updater dropdown */}
                    <td className="py-4 px-6">
                      <select
                        value={order.orderStatus}
                        disabled={
                          isUpdatingStatus === order.orderId ||
                          order.orderStatus === "DELIVERED" ||
                          order.orderStatus === "CANCELLED"
                        }
                        onChange={(e) =>
                          handleStatusChange(order.orderId, e.target.value as OrderStatus)
                        }
                        className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="CONFIRMED">CONFIRMED</option>
                        <option value="PROCESSING">PROCESSING</option>
                        <option value="SHIPPED">SHIPPED</option>
                        <option value="DELIVERED">DELIVERED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </td>

                    {/* View Details */}
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsDetailModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="View Full Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {orderData && (
            <div className="p-4 border-t border-slate-100">
              <Pagination
                pageNumber={orderData.pageNumber}
                totalPages={orderData.totalPages}
                totalElements={orderData.totalElements}
                onPageChange={(page) => loadOrders(page)}
              />
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Order #${selectedOrder?.orderId} Inspection`}
        maxWidth="lg"
      >
        {selectedOrder && (
          <div className="space-y-6 text-xs text-slate-700">
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100">
              <div>
                <span className="text-slate-400 font-bold uppercase block mb-0.5">
                  Customer Email
                </span>
                <span className="font-semibold text-slate-900">{selectedOrder.email}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase block mb-0.5">
                  Total Amount
                </span>
                <span className="text-base font-black text-slate-950">
                  {formatPrice(selectedOrder.totalAmount)}
                </span>
              </div>
            </div>

            {selectedOrder.address && (
              <div className="space-y-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  <span>Delivery Address</span>
                </div>
                <p className="font-semibold">{selectedOrder.address.buildingName}</p>
                <p>{selectedOrder.address.street}</p>
                <p>
                  {selectedOrder.address.city}, {selectedOrder.address.state} -{" "}
                  {selectedOrder.address.pincode}
                </p>
                <p className="text-slate-400 font-bold">{selectedOrder.address.country}</p>
              </div>
            )}

            <div>
              <span className="font-bold text-slate-900 uppercase tracking-wider block mb-3">
                Order Items ({selectedOrder.orderItems?.length || 0})
              </span>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedOrder.orderItems?.map((item) => (
                  <div
                    key={item.orderItemId}
                    className="flex justify-between items-center py-2 border-b border-slate-100"
                  >
                    <span className="font-medium text-slate-800">
                      {item.quantity}x {item.product?.productName || "Item"}
                    </span>
                    <span className="font-bold text-slate-900">
                      {formatPrice(item.orderedProductPrice * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminOrdersPage;
