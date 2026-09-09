import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Truck, RefreshCw, Headphones, Mail } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 mt-auto border-t border-slate-800">
      {/* Value Proposition Highlights */}
      <div className="border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/40 border border-slate-800">
              <Truck className="w-8 h-8 text-cyan-400 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-white">Express Delivery</h4>
                <p className="text-xs text-slate-400 mt-0.5">Reliable tracking & dispatch</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/40 border border-slate-800">
              <ShieldCheck className="w-8 h-8 text-cyan-400 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-white">Genuine Warranty</h4>
                <p className="text-xs text-slate-400 mt-0.5">100% verified authentic goods</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/40 border border-slate-800">
              <RefreshCw className="w-8 h-8 text-cyan-400 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-white">Simple Returns</h4>
                <p className="text-xs text-slate-400 mt-0.5">30-day effortless returns policy</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/40 border border-slate-800">
              <Headphones className="w-8 h-8 text-cyan-400 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-white">Dedicated Support</h4>
                <p className="text-xs text-slate-400 mt-0.5">24/7 client service assistance</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-cyan-600 flex items-center justify-center text-white font-black text-lg">
                A
              </div>
              <span className="font-bold text-white text-lg tracking-tight">
                APEX<span className="text-cyan-400">STORE</span>
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              High-performance, reliable electronic commerce. Sourcing the latest technology with
              transparent pricing and instant inventory synchronization.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Explore
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/products" className="hover:text-white transition-colors">
                  Product Catalog
                </Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-white transition-colors">
                  Shopping Cart
                </Link>
              </li>
              <li>
                <Link to="/orders" className="hover:text-white transition-colors">
                  Order Tracking
                </Link>
              </li>
              <li>
                <Link to="/account/profile" className="hover:text-white transition-colors">
                  Account Overview
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Customer Support
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/account/addresses" className="hover:text-white transition-colors">
                  Delivery Addresses
                </Link>
              </li>
              <li>
                <span className="text-slate-500">Warranty Registration</span>
              </li>
              <li>
                <span className="text-slate-500">Terms of Service</span>
              </li>
              <li>
                <span className="text-slate-500">Privacy Policy</span>
              </li>
            </ul>
          </div>

          {/* Newsletter / Contact */}
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Contact & Inquiries
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Need assistance with an order or product specification?
            </p>
            <div className="flex items-center gap-2 text-xs text-cyan-400">
              <Mail className="w-4 h-4" />
              <span>support@apexstore.local</span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} ApexStore Inc. Production E-Commerce Platform.</p>
          <div className="flex gap-4">
            <span>PCI-DSS Compliant</span>
            <span>TLS 1.3 Encrypted</span>
            <span>RESTful Micro-Ready</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
