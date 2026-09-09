import React, { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout } from "@/store/slices/authSlice";
import { addToast } from "@/store/slices/uiSlice";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Store,
  LogOut,
  Menu,
  X,
  ShieldAlert,
} from "lucide-react";

export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await dispatch(logout());
    dispatch(addToast({ type: "info", message: "Signed out from Admin console." }));
    navigate("/login");
  };

  const navItems = [
    { name: "Dashboard", to: "/admin", icon: <LayoutDashboard className="w-5 h-5" />, end: true },
    { name: "Products", to: "/admin/products", icon: <Package className="w-5 h-5" /> },
    { name: "Categories", to: "/admin/categories", icon: <FolderTree className="w-5 h-5" /> },
    { name: "Orders", to: "/admin/orders", icon: <ShoppingCart className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen flex bg-slate-100 text-slate-900 font-sans">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-cyan-500 flex items-center justify-center text-slate-950 font-black">
              A
            </div>
            <div>
              <span className="font-bold text-white tracking-tight">Admin Console</span>
              <span className="block text-[10px] text-cyan-400 font-medium">Enterprise Backoffice</span>
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setIsSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-cyan-600 text-white shadow-xs font-semibold"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`
              }
            >
              {item.icon}
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <Link
            to="/"
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Store className="w-4 h-4" />
            <span>Customer Storefront</span>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-950/40 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Administrative Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-cyan-600 hidden sm:inline-block" />
              <h1 className="text-sm font-bold text-slate-800">Admin Management Portal</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 hidden sm:inline-block">Logged in as:</span>
            <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              <span className="text-xs font-bold text-slate-800">{user?.username}</span>
              <span className="text-[10px] bg-cyan-100 text-cyan-800 font-extrabold px-1.5 py-0.5 rounded">
                ADMIN
              </span>
            </div>
          </div>
        </header>

        {/* Body Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
