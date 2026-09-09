import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { login, clearAuthError } from "@/store/slices/authSlice";
import { addToast } from "@/store/slices/uiSlice";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import { Lock, User, AlertCircle, ShieldCheck } from "lucide-react";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useAppDispatch();

  const redirectUrl = searchParams.get("redirect") || "/";
  const { isLoading, error } = useAppSelector((state) => state.auth);

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
          message: `Welcome back, ${username}!`,
        })
      );
      navigate(redirectUrl, { replace: true });
    } catch {
      // Error handled by redux slice state
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 shadow-xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-600 text-white font-black text-2xl shadow-md mb-2">
            A
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Sign In to ApexStore
          </h1>
          <p className="text-xs text-slate-500">
            Access your order tracking, addresses, and customer account
          </p>
        </div>

        {/* Global Server Error Alert */}
        {error && (
          <div
            role="alert"
            className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed font-medium">{error}</p>
          </div>
        )}

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
            placeholder="Enter your username"
            error={validationErrors.username}
            leftIcon={<User className="w-4 h-4" />}
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
            placeholder="Enter your password"
            error={validationErrors.password}
            leftIcon={<Lock className="w-4 h-4" />}
            autoComplete="current-password"
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="w-full mt-2"
          >
            Sign In
          </Button>
        </form>

        {/* Footer */}
        <div className="border-t border-slate-100 pt-4 text-center text-xs text-slate-500">
          <span>Don&apos;t have an account? </span>
          <Link
            to={redirectUrl !== "/" ? `/register?redirect=${redirectUrl}` : "/register"}
            className="font-bold text-cyan-600 hover:text-cyan-700 transition-colors"
          >
            Create an Account
          </Link>
        </div>

        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Spring Security Stateless JWT Authentication</span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
