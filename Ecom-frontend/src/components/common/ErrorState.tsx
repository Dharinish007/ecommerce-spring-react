import React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import Button from "./Button";

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Failed to load information",
  message,
  onRetry,
  className = "",
}) => {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center p-8 text-center bg-red-50/50 rounded-2xl border border-red-200 ${className}`}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600 mb-4 shadow-xs">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-600 max-w-md mb-6 leading-relaxed">{message}</p>
      {onRetry && (
        <Button
          variant="outline"
          size="md"
          onClick={onRetry}
          leftIcon={<RotateCcw className="w-4 h-4" />}
          className="border-red-300 text-red-700 hover:bg-red-100/50"
        >
          Try Again
        </Button>
      )}
    </div>
  );
};

export default ErrorState;
