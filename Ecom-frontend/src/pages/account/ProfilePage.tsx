import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout } from "@/store/slices/authSlice";
import { addToast } from "@/store/slices/uiSlice";
import Badge from "@/components/common/Badge";
import Button from "@/components/common/Button";
import { Mail, ShieldCheck, Package, MapPin, ShoppingBag, LogOut } from "lucide-react";

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const isAdmin = user?.roles?.includes("ROLE_ADMIN") || false;

  const handleLogout = async () => {
    await dispatch(logout());
    dispatch(addToast({ type: "info", message: "Signed out successfully." }));
    navigate("/");
  };

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Account Profile
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review your personal credentials, roles, and quick navigation links
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 text-cyan-400 font-black text-2xl flex items-center justify-center uppercase shadow-md">
            {user.username.charAt(0)}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900">{user.username}</h2>
              {isAdmin ? (
                <Badge variant="info">ADMINISTRATOR</Badge>
              ) : (
                <Badge variant="neutral">VERIFIED CUSTOMER</Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{user.email}</span>
            </div>
            <p className="text-[11px] text-slate-400">User Account ID #{user.id}</p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          leftIcon={<LogOut className="w-4 h-4 text-red-600" />}
          className="border-red-200 text-red-600 hover:bg-red-50"
        >
          Sign Out
        </Button>
      </div>

      {/* Account Navigation Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Link
          to="/orders"
          className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:border-cyan-500 hover:shadow-lg transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Package className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900 group-hover:text-cyan-600 transition-colors">
            My Orders
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Check live shipment status and view previous orders
          </p>
        </Link>

        <Link
          to="/account/addresses"
          className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:border-cyan-500 hover:shadow-lg transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <MapPin className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900 group-hover:text-cyan-600 transition-colors">
            Delivery Addresses
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Add or edit saved shipping and billing locations
          </p>
        </Link>

        <Link
          to="/cart"
          className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:border-cyan-500 hover:shadow-lg transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900 group-hover:text-cyan-600 transition-colors">
            Shopping Cart
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Review reserved items and proceed to checkout
          </p>
        </Link>
      </div>

      {/* Admin Quick Entry */}
      {isAdmin && (
        <div className="bg-gradient-to-r from-slate-900 to-cyan-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 border border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              <h3 className="text-lg font-bold">Administrator Privileges Active</h3>
            </div>
            <p className="text-xs text-slate-300 max-w-lg">
              You possess elevated access rights to manage product listings, categories, and customer order statuses.
            </p>
          </div>

          <Link
            to="/admin"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors shrink-0 shadow-md"
          >
            <span>Open Admin Dashboard</span>
          </Link>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
