import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Truck, RefreshCw, Headphones, ShoppingBag, MapPin, Mail } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-auto border-t border-slate-800">
      {/* Value Proposition Highlights */}
      <div className="border-b border-slate-800 bg-slate-950/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
              <Truck className="w-8 h-8 text-amber-400 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-white">Free &amp; Fast Delivery</h4>
                <p className="text-xs text-slate-400 mt-0.5">Free shipping on orders over ₹499</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
              <ShieldCheck className="w-8 h-8 text-amber-400 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-white">100% Authentic Goods</h4>
                <p className="text-xs text-slate-400 mt-0.5">Directly sourced &amp; verified items</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
              <RefreshCw className="w-8 h-8 text-amber-400 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-white">Easy 7-Day Returns</h4>
                <p className="text-xs text-slate-400 mt-0.5">Hassle-free replacement policy</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
              <Headphones className="w-8 h-8 text-amber-400 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-white">Dedicated Support</h4>
                <p className="text-xs text-slate-400 mt-0.5">Prompt assistance for your orders</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-black">
                <ShoppingBag className="w-4 h-4 fill-slate-950" />
              </div>
              <span className="font-extrabold text-white text-xl tracking-tight font-serif">
                ANGADI<span className="text-amber-400">.in</span>
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              Angadi is India&apos;s trusted online marketplace. Shop mobiles, laptops, audio gear,
              smart wearables, and daily lifestyle essentials with guaranteed authentic quality,
              transparent pricing, and dependable doorstep delivery.
            </p>
            <div className="text-xs text-slate-400 space-y-1 pt-1">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>Pan-India Fulfillment Network</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-amber-400" />
                <span>support@angadi.in</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Explore Store
            </h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/products" className="hover:text-amber-400 transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link to="/products?sortBy=price&sortOrder=asc" className="hover:text-amber-400 transition-colors">
                  Today&apos;s Value Deals
                </Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-amber-400 transition-colors">
                  View Shopping Cart
                </Link>
              </li>
              <li>
                <Link to="/orders" className="hover:text-amber-400 transition-colors">
                  Your Orders &amp; Invoices
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Account */}
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Your Account
            </h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/account/profile" className="hover:text-amber-400 transition-colors">
                  Profile &amp; Security
                </Link>
              </li>
              <li>
                <Link to="/account/addresses" className="hover:text-amber-400 transition-colors">
                  Saved Delivery Addresses
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-amber-400 transition-colors">
                  Sign In / Register
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-amber-400 transition-colors">
                  Seller &amp; Admin Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Payment & Security */}
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Payment &amp; Trust
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              We accept UPI, Net Banking, Credit/Debit Cards, and Cash on Delivery (COD) for supported pincodes.
            </p>
            <div className="flex flex-wrap gap-2 text-[11px] font-bold text-slate-300">
              <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700">UPI</span>
              <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700">RuPay</span>
              <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700">Visa / MC</span>
              <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700">Cash on Delivery</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800/80 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} Angadi Marketplace. All rights reserved.</span>
          <span className="text-[11px]">Designed for high-performance mainstream commerce.</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
