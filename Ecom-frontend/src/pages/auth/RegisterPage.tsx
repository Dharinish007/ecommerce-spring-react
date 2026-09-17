import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { registerUser, clearAuthError } from "@/store/slices/authSlice";
import { addToast } from "@/store/slices/uiSlice";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import { Lock, User, Mail, AlertCircle, ShoppingBag, ShieldCheck } from "lucide-react";

export const RegisterPage: React.FC = () => {
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!username.trim() || username.trim().length < 3) {
      errs.username = "Username must be at least 3 characters";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      errs.email = "Please enter a valid email address";
    }
    if (!password || password.length < 6) {
      errs.password = "Password must be at least 6 characters";
    }
    if (password !== confirmPassword) {
      errs.confirmPassword = "Passwords do not match";
    }
    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearAuthError());

    if (!validate()) return;

    try {
      await dispatch(
        registerUser({
          username: username.trim(),
          email: email.trim(),
          password,
        })
      ).unwrap();

      dispatch(
        addToast({
          type: "success",
          message: "Account created successfully! Please sign in with your credentials.",
        })
      );
      navigate(redirectUrl !== "/" ? `/login?redirect=${redirectUrl}` : "/login");
    } catch {
      // Error handled by redux slice state
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 text-slate-950 font-black text-2xl shadow-xs mb-1">
            <ShoppingBag className="w-6 h-6 fill-slate-950" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight font-serif">
            Create Your Angadi Account
          </h1>
          <p className="text-xs text-slate-500">
            Sign up to track orders, manage addresses, and shop effortlessly
          </p>
        </div>

        {/* Global Error Alert */}
        {error && (
          <div
            role="alert"
            className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed font-medium">{error}</p>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Your Name / Username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. rahul_kumar"
            error={validationErrors.username}
            leftIcon={<User className="w-4 h-4 text-slate-400" />}
            autoComplete="username"
          />

          <Input
            label="Email Address"
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            error={validationErrors.email}
            leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
            autoComplete="email"
          />

          <Input
            label="Password"
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            error={validationErrors.password}
            leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
            autoComplete="new-password"
          />

          <Input
            label="Confirm Password"
            required
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter password"
            error={validationErrors.confirmPassword}
            leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
            autoComplete="new-password"
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="w-full mt-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold border-none"
          >
            Create Account
          </Button>
        </form>

        {/* Footer */}
        <div className="border-t border-slate-100 pt-4 text-center text-xs text-slate-500">
          <span>Already have an account? </span>
          <Link
            to={redirectUrl !== "/" ? `/login?redirect=${redirectUrl}` : "/login"}
            className="font-bold text-amber-700 hover:text-amber-800 transition-colors"
          >
            Sign In
          </Link>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>By continuing, you agree to Angadi Terms &amp; Conditions</span>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
