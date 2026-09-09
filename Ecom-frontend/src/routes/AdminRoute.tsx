import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAppSelector } from "@/store/hooks";
import EmptyState from "@/components/common/EmptyState";
import { ShieldAlert } from "lucide-react";

export const AdminRoute: React.FC = () => {
  const location = useLocation();
  const { user, isAuthenticated, isLoading } = useAppSelector((state) => state.auth);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  const isAdmin = user?.roles?.includes("ROLE_ADMIN");

  if (!isAdmin) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <EmptyState
          title="Access Restricted"
          description="You do not possess administrative permissions to access the enterprise backoffice. This area is reserved for ROLE_ADMIN credentials."
          icon={<ShieldAlert className="w-8 h-8 text-red-600" />}
          actionLabel="Return to Storefront"
          onAction={() => window.location.replace("/")}
        />
      </div>
    );
  }

  return <Outlet />;
};

export default AdminRoute;
