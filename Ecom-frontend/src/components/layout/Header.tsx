import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout } from "@/store/slices/authSlice";
import { addToast } from "@/store/slices/uiSlice";
import categoriesApi from "@/api/categories.api";
import { CategoryDTO } from "@/types/category.types";
import {
  ShoppingBag,
  Search,
  User,
  LogOut,
  ShieldCheck,
  Package,
  MapPin,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();

  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const cart = useAppSelector((state) => state.cart.cart);

  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const categoryMenuRef = useRef<HTMLDivElement>(null);

  const isAdmin = user?.roles?.includes("ROLE_ADMIN") || false;
  const cartItemCount =
    cart?.products?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;

  useEffect(() => {
    categoriesApi
      .getAllCategories({ pageSize: 20 })
      .then((res) => setCategories(res.content || []))
      .catch(() => setCategories([]));
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(e.target as Node)) {
        setIsCategoryMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
    setIsCategoryMenuOpen(false);
  }, [location.pathname]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?keyword=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate("/products");
    }
  };

  const handleLogout = async () => {
    await dispatch(logout());
    dispatch(
      addToast({
        type: "info",
        message: "You have been logged out successfully.",
      })
    );
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md transition-shadow">
      {/* Top Notification / Trust Bar */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 text-center font-medium">
        <span>Free standard delivery on orders over $50 • 100% Genuine Certified Products</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <div className="h-9 w-9 rounded-xl bg-cyan-600 flex items-center justify-center text-white font-black text-xl shadow-xs group-hover:bg-cyan-700 transition-colors">
              A
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-slate-900 text-lg tracking-tight leading-none group-hover:text-cyan-600 transition-colors">
                APEX<span className="text-cyan-600">STORE</span>
              </span>
              <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
                Enterprise Commerce
              </span>
            </div>
          </Link>

          {/* Desktop Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-lg relative items-center mx-4"
          >
            <input
              type="search"
              placeholder="Search products, models, categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-full pl-10 pr-4 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white transition-all duration-150"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
          </form>

          {/* Desktop Nav Links & User Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Catalog Link */}
            <Link
              to="/products"
              className="hidden lg:inline-flex text-sm font-semibold text-slate-700 hover:text-cyan-600 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              All Products
            </Link>

            {/* Categories Dropdown */}
            <div className="relative hidden lg:block" ref={categoryMenuRef}>
              <button
                onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-cyan-600 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <span>Categories</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {isCategoryMenuOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Browse Categories
                  </div>
                  {categories.length > 0 ? (
                    categories.map((cat) => (
                      <Link
                        key={cat.categoryId}
                        to={`/products?category=${cat.categoryId}`}
                        className="block px-3 py-2 text-sm text-slate-700 hover:bg-cyan-50 hover:text-cyan-700 transition-colors"
                      >
                        {cat.categoryName}
                      </Link>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-xs text-slate-400">No categories found</div>
                  )}
                </div>
              )}
            </div>

            {/* Cart Button */}
            <Link
              to="/cart"
              className="relative p-2 text-slate-700 hover:text-cyan-600 hover:bg-slate-50 rounded-xl transition-colors flex items-center"
              aria-label={`Cart with ${cartItemCount} items`}
            >
              <ShoppingBag className="w-6 h-6" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-cyan-600 text-white text-[11px] font-bold h-5 min-w-5 px-1.5 rounded-full flex items-center justify-center shadow-xs">
                  {cartItemCount}
                </span>
              )}
            </Link>

            {/* User Account Menu */}
            <div className="relative" ref={userMenuRef}>
              {isAuthenticated && user ? (
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-50 border border-slate-200 text-slate-800 transition-colors cursor-pointer"
                  aria-expanded={isUserMenuOpen}
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center text-xs font-bold uppercase">
                    {user.username.charAt(0)}
                  </div>
                  <span className="hidden sm:inline-block text-xs font-semibold max-w-[100px] truncate">
                    {user.username}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:inline-block" />
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="text-xs font-semibold text-slate-700 hover:text-cyan-600 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="hidden sm:inline-flex text-xs font-semibold bg-cyan-600 hover:bg-cyan-700 text-white px-3.5 py-2 rounded-lg shadow-xs transition-colors"
                  >
                    Register
                  </Link>
                </div>
              )}

              {/* User Dropdown */}
              {isUserMenuOpen && isAuthenticated && user && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-900">{user.username}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    {isAdmin && (
                      <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-extrabold bg-cyan-100 text-cyan-800 tracking-wider">
                        ADMINISTRATOR
                      </span>
                    )}
                  </div>

                  <div className="py-1">
                    {isAdmin && (
                      <Link
                        to="/admin"
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-cyan-700 hover:bg-cyan-50 transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4 text-cyan-600" />
                        Admin Dashboard
                      </Link>
                    )}

                    <Link
                      to="/account/profile"
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      My Profile
                    </Link>

                    <Link
                      to="/orders"
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Package className="w-4 h-4 text-slate-400" />
                      My Orders
                    </Link>

                    <Link
                      to="/account/addresses"
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <MapPin className="w-4 h-4 text-slate-400" />
                      Saved Addresses
                    </Link>
                  </div>

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="pb-3 md:hidden">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <input
              type="search"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-full pl-10 pr-4 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
          </form>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-4">
          <div className="space-y-1">
            <Link
              to="/products"
              className="block px-3 py-2 rounded-lg text-base font-medium text-slate-800 hover:bg-slate-50"
            >
              All Products
            </Link>
            <div className="pt-2 pb-1 text-xs font-bold text-slate-400 uppercase tracking-wider px-3">
              Categories
            </div>
            {categories.slice(0, 6).map((cat) => (
              <Link
                key={cat.categoryId}
                to={`/products?category=${cat.categoryId}`}
                className="block px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
              >
                {cat.categoryName}
              </Link>
            ))}
          </div>

          <div className="border-t border-slate-100 pt-3">
            {isAuthenticated && user ? (
              <div className="space-y-1">
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="block px-3 py-2 rounded-lg text-sm font-bold text-cyan-700 bg-cyan-50"
                  >
                    Admin Dashboard
                  </Link>
                )}
                <Link
                  to="/orders"
                  className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  My Orders
                </Link>
                <Link
                  to="/account/addresses"
                  className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Saved Addresses
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-2">
                <Link
                  to="/login"
                  className="w-full text-center py-2.5 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="w-full text-center py-2.5 rounded-lg bg-cyan-600 text-sm font-semibold text-white"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
