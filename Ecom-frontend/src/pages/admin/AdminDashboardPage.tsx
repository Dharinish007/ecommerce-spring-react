import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import productsApi from "@/api/products.api";
import categoriesApi from "@/api/categories.api";
import adminApi from "@/api/admin.api";
import { OrderDTO } from "@/types/order.types";
import { formatPrice, formatDate } from "@/utils/formatters";
import Badge from "@/components/common/Badge";
import { Skeleton } from "@/components/common/Skeleton";
import {
  Package,
  FolderTree,
  ShoppingCart,
  TrendingUp,
  Plus,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState({
    productsCount: 0,
    categoriesCount: 0,
    ordersCount: 0,
    activeCartsCount: 0,
  });
  const [recentOrders, setRecentOrders] = useState<OrderDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      setIsLoading(true);
      try {
        const [prodRes, catRes, ordRes, cartsRes] = await Promise.all([
          productsApi.getAllProducts({ pageSize: 1 }),
          categoriesApi.getAllCategories({ pageSize: 1 }),
          adminApi.getAllOrders(0, 5, "orderDate", "desc"),
          adminApi.getAllCarts().catch(() => []),
        ]);

        setStats({
          productsCount: prodRes.totalElements || 0,
          categoriesCount: catRes.totalElements || 0,
          ordersCount: ordRes.totalElements || 0,
          activeCartsCount: cartsRes.length || 0,
        });

        setRecentOrders(ordRes.content || []);
      } catch {
        // Safe fallback
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-200 animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time backend performance metrics, store statistics, and recent orders
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/products"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Manage Products</span>
          </Link>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Products */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Products
            </span>
            <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">{stats.productsCount}</div>
          <Link
            to="/admin/products"
            className="text-[11px] font-semibold text-amber-700 hover:text-amber-800 inline-flex items-center gap-1"
          >
            <span>View inventory</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Categories */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Categories
            </span>
            <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <FolderTree className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">{stats.categoriesCount}</div>
          <Link
            to="/admin/categories"
            className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
          >
            <span>Manage taxonomy</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Total Orders */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Customer Orders
            </span>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">{stats.ordersCount}</div>
          <Link
            to="/admin/orders"
            className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1"
          >
            <span>Fulfill orders</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Active Carts */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Sessions
            </span>
            <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">{stats.activeCartsCount}</div>
          <span className="text-[11px] font-medium text-slate-400">
            Current active cart sessions
          </span>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Customer Orders</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Latest transactions placed across the storefront
            </p>
          </div>
          <Link
            to="/admin/orders"
            className="text-xs font-bold text-slate-700 hover:text-amber-600 inline-flex items-center gap-1"
          >
            <span>View All Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No customer orders placed yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-6">Order ID</th>
                  <th className="py-3.5 px-6">Customer Email</th>
                  <th className="py-3.5 px-6">Date</th>
                  <th className="py-3.5 px-6">Amount</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map((order) => (
                  <tr key={order.orderId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-900">#{order.orderId}</td>
                    <td className="py-4 px-6 text-slate-600 truncate max-w-xs">{order.email}</td>
                    <td className="py-4 px-6 text-slate-500">{formatDate(order.orderDate)}</td>
                    <td className="py-4 px-6 font-bold text-slate-900">
                      {formatPrice(order.totalAmount)}
                    </td>
                    <td className="py-4 px-6">
                      <Badge
                        variant={
                          order.orderStatus === "DELIVERED" || order.orderStatus === "CONFIRMED"
                            ? "success"
                            : order.orderStatus === "CANCELLED"
                            ? "danger"
                            : "info"
                        }
                      >
                        {order.orderStatus}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        to="/admin/orders"
                        className="inline-flex items-center gap-1 text-slate-700 hover:text-amber-600 font-semibold"
                      >
                        <span>Manage</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;
