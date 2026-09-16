import React, { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";

// Layouts
import MainLayout from "@/components/layout/MainLayout";
import AdminLayout from "@/components/layout/AdminLayout";

// Guards
import ProtectedRoute from "./ProtectedRoute";
import AdminRoute from "./AdminRoute";

// Lazy-loaded Public Pages
const HomePage = lazy(() => import("@/pages/public/HomePage"));
const ProductsPage = lazy(() => import("@/pages/public/ProductsPage"));
const ProductDetailPage = lazy(() => import("@/pages/public/ProductDetailPage"));
const CartPage = lazy(() => import("@/pages/public/CartPage"));
const NotFoundPage = lazy(() => import("@/pages/public/NotFoundPage"));

// Lazy-loaded Auth Pages
const LoginPage = lazy(() => import("@/pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/auth/RegisterPage"));

// Lazy-loaded Account Pages (Protected)
const CheckoutPage = lazy(() => import("@/pages/account/CheckoutPage"));
const OrderSuccessPage = lazy(() => import("@/pages/account/OrderSuccessPage"));
const OrdersPage = lazy(() => import("@/pages/account/OrdersPage"));
const OrderDetailPage = lazy(() => import("@/pages/account/OrderDetailPage"));
const AddressesPage = lazy(() => import("@/pages/account/AddressesPage"));
const ProfilePage = lazy(() => import("@/pages/account/ProfilePage"));

// Lazy-loaded Admin Pages (Admin Protected)
const AdminDashboardPage = lazy(() => import("@/pages/admin/AdminDashboardPage"));
const AdminProductsPage = lazy(() => import("@/pages/admin/AdminProductsPage"));
const AdminCategoriesPage = lazy(() => import("@/pages/admin/AdminCategoriesPage"));
const AdminOrdersPage = lazy(() => import("@/pages/admin/AdminOrdersPage"));
const AdminUsersPage = lazy(() => import("@/pages/admin/AdminUsersPage"));

const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
  </div>
);

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Consumer & Customer Routes */}
        <Route element={<MainLayout />}>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:productId" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Customer Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order-success/:orderId" element={<OrderSuccessPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/orders/:orderId" element={<OrderDetailPage />} />
            <Route path="/account" element={<ProfilePage />} />
            <Route path="/account/addresses" element={<AddressesPage />} />
            <Route path="/account/profile" element={<ProfilePage />} />
          </Route>

          {/* 404 Catch-All */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Admin Protected Console */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="categories" element={<AdminCategoriesPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="users" element={<AdminUsersPage />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
