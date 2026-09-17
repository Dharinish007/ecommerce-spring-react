import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { login, clearAuthError } from "@/store/slices/authSlice";
import { addToast } from "@/store/slices/uiSlice";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import { Lock, User, AlertCircle, ShoppingBag, ShieldCheck } from "lucide-react";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useAppDispatch();

  const redirectUrl = searchParams.get("redirect") || "/";
  const { isAuthenticated, isLoading, error } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectUrl, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectUrl]);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!username.trim()) errs.username = "Username is required";
    if (!password) errs.password = "Password is required";
    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearAuthError());

    if (!validate()) return;

    try {
      await dispatch(login({ username: username.trim(), password })).unwrap();
      dispatch(
        addToast({
          type: "success",
          message: `Welcome to Angadi, ${username}!`,
        })
      );
      navigate(redirectUrl, { replace: true });
    } catch {
      // Error handled by redux slice state
    }
  };

  const handlePrefill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setValidationErrors({});
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 text-slate-950 font-black text-2xl shadow-xs mb-1">
            <ShoppingBag className="w-6 h-6 fill-slate-950" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight font-serif">
            Sign In to Angadi
          </h1>
          <p className="text-xs text-slate-500">
            Access your orders, saved addresses, and personal recommendations
          </p>
        </div>

        {/* Global Server Error Alert */}
        {error && (
          <div
            role="alert"
            className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed font-medium">{error}</p>
          </div>
        )}

        {/* Demo Credentials Helper Chips */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Demo Login Accounts (Click to Fill)
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => handlePrefill("john_doe", "user123")}
              className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 hover:border-amber-500 hover:text-amber-800 transition-colors cursor-pointer"
            >
              Customer (john_doe)
            </button>
            <button
              type="button"
              onClick={() => handlePrefill("admin", "admin123")}
              className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 hover:border-amber-500 hover:text-amber-800 transition-colors cursor-pointer"
            >
              Admin (admin)
            </button>
            <button
              type="button"
              onClick={() => handlePrefill("seller", "seller123")}
              className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 hover:border-amber-500 hover:text-amber-800 transition-colors cursor-pointer"
            >
              Seller (seller)
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Username"
            required
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              if (validationErrors.username) {
                setValidationErrors((prev) => ({ ...prev, username: "" }));
              }
            }}
            placeholder="Enter username"
            error={validationErrors.username}
            leftIcon={<User className="w-4 h-4 text-slate-400" />}
            autoComplete="username"
          />

          <Input
            label="Password"
            required
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (validationErrors.password) {
                setValidationErrors((prev) => ({ ...prev, password: "" }));
              }
            }}
            placeholder="Enter password"
            error={validationErrors.password}
            leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
            autoComplete="current-password"
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="w-full mt-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold border-none"
          >
            Sign In
          </Button>
        </form>

        {/* Footer */}
        <div className="border-t border-slate-100 pt-4 text-center text-xs text-slate-500">
          <span>New to Angadi? </span>
          <Link
            to={redirectUrl !== "/" ? `/register?redirect=${redirectUrl}` : "/register"}
            className="font-bold text-amber-700 hover:text-amber-800 transition-colors"
          >
            Create your account
          </Link>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Encrypted, secure account authentication</span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
