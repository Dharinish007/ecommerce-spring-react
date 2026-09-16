import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout } from "@/store/slices/authSlice";
import { addToast } from "@/store/slices/uiSlice";
import categoriesApi from "@/api/categories.api";
import { CategoryDTO } from "@/types/category.types";
import { formatPrice } from "@/utils/formatters";
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
  Sparkles,
  Tag,
  Grid,
} from "lucide-react";

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();

  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const cart = useAppSelector((state) => state.cart.cart);

  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
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

  // Sync search input with URL params if on products page
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const keyword = params.get("keyword") || "";
    const cat = params.get("category") || "";
    setSearchQuery(keyword);
    setSelectedCategory(cat);
  }, [location.search]);

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
    const params = new URLSearchParams();
    if (searchQuery.trim()) {
      params.set("keyword", searchQuery.trim());
    }
    if (selectedCategory) {
      params.set("category", selectedCategory);
    }
    navigate(`/products?${params.toString()}`);
  };

  const handleLogout = async () => {
    await dispatch(logout());
    dispatch(
      addToast({
        type: "info",
        message: "You have been signed out of Angadi.",
      })
    );
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-40 w-full shadow-sm">
      {/* Top Utility & Trust Bar */}
      <div className="bg-slate-950 text-slate-300 text-xs py-1.5 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 text-[11px] font-medium">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-amber-400">
              <Sparkles className="w-3 h-3" />
              <span>Free Delivery on orders over ₹499</span>
            </span>
            <span className="hidden md:inline text-slate-500">•</span>
            <span className="hidden md:inline">100% Genuine Products</span>
            <span className="hidden md:inline text-slate-500">•</span>
            <span className="hidden md:inline">Cash on Delivery Available</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-medium ml-auto">
            <Link to="/orders" className="hover:text-amber-400 transition-colors">
              Track Orders
            </Link>
            <span className="text-slate-700">|</span>
            {isAdmin && (
              <Link
                to="/admin"
                className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
              >
                <ShieldCheck className="w-3 h-3" />
                <span>Admin Console</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Primary Brand & Search Bar (Deep Slate / Commerce Navy) */}
      <div className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3 sm:gap-6">
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Angadi Brand Logo */}
            <Link to="/" className="flex items-center gap-2.5 shrink-0 group py-1">
              <div className="h-9 w-9 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 shadow-sm group-hover:bg-amber-400 transition-colors">
                <ShoppingBag className="w-5 h-5 text-slate-950 fill-slate-950" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-0.5">
                  <span className="font-extrabold text-white text-xl sm:text-2xl tracking-tight leading-none group-hover:text-amber-400 transition-colors font-serif">
                    ANGADI
                  </span>
                  <span className="text-amber-400 font-bold text-xs tracking-wider">.in</span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium tracking-wide">
                  Apna Marketplace
                </span>
              </div>
            </Link>

            {/* Delivery Location Indicator */}
            <div className="hidden xl:flex items-center gap-1.5 text-xs text-slate-300 pl-2 pr-4 border-l border-slate-800 shrink-0">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="flex flex-col leading-tight">
                <span className="text-[10px] text-slate-400">Deliver to</span>
                <span className="font-bold text-slate-100">All India</span>
              </div>
            </div>

            {/* Global Search Bar */}
            <form
              onSubmit={handleSearchSubmit}
              className="hidden md:flex flex-1 max-w-2xl relative items-center"
            >
              <div className="relative w-full flex items-stretch">
                {categories.length > 0 && (
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="hidden lg:block bg-slate-100 text-slate-800 text-xs font-semibold px-3 py-2 border-r border-slate-300 rounded-l-lg focus:outline-none cursor-pointer max-w-[140px] truncate"
                    aria-label="Select category filter"
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat.categoryId} value={cat.categoryId}>
                        {cat.categoryName}
                      </option>
                    ))}
                  </select>
                )}
                <input
                  type="search"
                  placeholder="Search products, mobiles, electronics, appliances..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full bg-white text-slate-900 pl-3.5 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all ${
                    categories.length > 0 ? "lg:rounded-none rounded-l-lg" : "rounded-l-lg"
                  }`}
                />
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-5 flex items-center justify-center rounded-r-lg font-bold transition-colors cursor-pointer shrink-0"
                  aria-label="Search"
                >
                  <Search className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                </button>
              </div>
            </form>

            {/* Right Header Navigation & Actions */}
            <div className="flex items-center gap-1 sm:gap-4 shrink-0">
              {/* Returns & Orders */}
              <Link
                to={isAuthenticated ? "/orders" : "/login?redirect=/orders"}
                className="hidden sm:flex flex-col text-left px-2 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <span className="text-[10px] text-slate-400 font-medium leading-none">Returns</span>
                <span className="text-xs font-bold text-slate-100 leading-tight">&amp; Orders</span>
              </Link>

              {/* Account Dropdown */}
              <div className="relative" ref={userMenuRef}>
                {isAuthenticated && user ? (
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800 text-left transition-colors cursor-pointer"
                    aria-expanded={isUserMenuOpen}
                  >
                    <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-black uppercase shadow-xs">
                      {user.username.charAt(0)}
                    </div>
                    <div className="hidden lg:flex flex-col leading-tight">
                      <span className="text-[10px] text-slate-400">Hello,</span>
                      <span className="text-xs font-bold text-slate-100 max-w-[100px] truncate">
                        {user.username}
                      </span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:inline-block" />
                  </button>
                ) : (
                  <Link
                    to="/login"
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-100 hover:text-amber-400 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <div className="flex flex-col text-left leading-tight">
                      <span className="text-[10px] text-slate-400 font-normal">Hello, Sign In</span>
                      <span className="text-xs font-bold">Account</span>
                    </div>
                  </Link>
                )}

                {/* User Dropdown Menu */}
                {isUserMenuOpen && isAuthenticated && user && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-50 text-slate-900 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 rounded-t-xl">
                      <p className="text-xs font-bold text-slate-900">{user.username}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      {isAdmin && (
                        <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-900 tracking-wider">
                          ADMINISTRATOR
                        </span>
                      )}
                    </div>

                    <div className="py-1">
                      {isAdmin && (
                        <Link
                          to="/admin"
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-amber-700 hover:bg-amber-50 transition-colors"
                        >
                          <ShieldCheck className="w-4 h-4 text-amber-600" />
                          Admin Console
                        </Link>
                      )}

                      <Link
                        to="/account/profile"
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        Your Account
                      </Link>

                      <Link
                        to="/orders"
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <Package className="w-4 h-4 text-slate-400" />
                        Your Orders
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
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Shopping Cart Button */}
              <Link
                to="/cart"
                className="relative flex items-center gap-2 px-3 py-2 text-slate-100 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
                aria-label={`Shopping cart with ${cartItemCount} items`}
              >
                <div className="relative">
                  <ShoppingBag className="w-6 h-6 text-amber-400" />
                  {cartItemCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-red-600 text-white text-[10px] font-extrabold h-4 min-w-4 px-1 rounded-full flex items-center justify-center shadow-sm">
                      {cartItemCount}
                    </span>
                  )}
                </div>
                <div className="hidden sm:flex flex-col text-left leading-tight">
                  <span className="text-[10px] text-slate-400 font-medium">Cart</span>
                  <span className="text-xs font-bold text-amber-400">
                    {cart?.totalPrice ? formatPrice(cart.totalPrice) : "₹0"}
                  </span>
                </div>
              </Link>
            </div>
          </div>

          {/* Mobile Search Bar */}
          <div className="pb-3 md:hidden">
            <form onSubmit={handleSearchSubmit} className="flex items-stretch w-full">
              <input
                type="search"
                placeholder="Search products in Angadi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white text-slate-900 rounded-l-lg pl-3.5 pr-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="submit"
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 rounded-r-lg font-bold flex items-center justify-center cursor-pointer"
                aria-label="Submit search"
              >
                <Search className="w-4 h-4 stroke-[2.5]" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Secondary Category Sub-navigation Bar */}
      <div className="bg-slate-800 text-slate-200 border-t border-slate-700/60 text-xs font-semibold">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-none">
            {/* All Categories Dropdown Trigger */}
            <div className="relative shrink-0" ref={categoryMenuRef}>
              <button
                onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-slate-700 text-slate-100 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Grid className="w-3.5 h-3.5 text-amber-400" />
                <span>All Categories</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isCategoryMenuOpen && (
                <div className="absolute top-full left-0 mt-1 w-60 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in duration-150">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Browse Department
                  </div>
                  <Link
                    to="/products"
                    className="block px-3 py-2 text-xs font-bold text-slate-900 hover:bg-amber-50 hover:text-amber-800 transition-colors"
                  >
                    All Products
                  </Link>
                  {categories.map((cat) => (
                    <Link
                      key={cat.categoryId}
                      to={`/products?category=${cat.categoryId}`}
                      className="block px-3 py-2 text-xs text-slate-700 hover:bg-amber-50 hover:text-amber-800 transition-colors"
                    >
                      {cat.categoryName}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Links */}
            <Link
              to="/products"
              className="px-3 py-1.5 rounded-md hover:bg-slate-700 hover:text-white transition-colors shrink-0 whitespace-nowrap"
            >
              All Products
            </Link>

            <Link
              to="/products?sortBy=price&sortOrder=asc"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-amber-300 hover:bg-slate-700 hover:text-amber-200 transition-colors shrink-0 whitespace-nowrap"
            >
              <Tag className="w-3 h-3 text-amber-400" />
              <span>Today&apos;s Deals</span>
            </Link>

            {/* Render Category Links */}
            {categories.slice(0, 7).map((cat) => (
              <Link
                key={cat.categoryId}
                to={`/products?category=${cat.categoryId}`}
                className="px-3 py-1.5 rounded-md hover:bg-slate-700 hover:text-white transition-colors shrink-0 whitespace-nowrap text-slate-300"
              >
                {cat.categoryName}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white text-slate-900 px-4 pt-3 pb-6 space-y-4 max-h-[80vh] overflow-y-auto shadow-2xl">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm text-slate-900">{user.username}</span>
                <span className="text-xs text-slate-500">{user.email}</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link
                to="/login"
                className="text-center py-2 rounded-lg border border-slate-300 text-xs font-bold text-slate-800"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-center py-2 rounded-lg bg-amber-500 text-xs font-bold text-slate-950"
              >
                Create Account
              </Link>
            </div>
          )}

          <div className="space-y-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
              Shop by Category
            </div>
            <Link
              to="/products"
              className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-800 hover:bg-slate-100"
            >
              All Products
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.categoryId}
                to={`/products?category=${cat.categoryId}`}
                className="block px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100"
              >
                {cat.categoryName}
              </Link>
            ))}
          </div>

          <div className="border-t border-slate-100 pt-3 space-y-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
              My Account
            </div>
            {isAdmin && (
              <Link
                to="/admin"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold text-amber-800 bg-amber-50"
              >
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                Admin Console
              </Link>
            )}
            <Link
              to="/orders"
              className="block px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100"
            >
              My Orders
            </Link>
            <Link
              to="/account/addresses"
              className="block px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100"
            >
              Saved Addresses
            </Link>
            <Link
              to="/account/profile"
              className="block px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100"
            >
              Profile Settings
            </Link>
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
