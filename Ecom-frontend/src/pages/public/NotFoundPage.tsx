import React from "react";
import { useNavigate } from "react-router-dom";
import EmptyState from "@/components/common/EmptyState";
import { HelpCircle } from "lucide-react";

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <EmptyState
        title="404 — Page Not Found"
        description="The page or resource you are looking for might have been moved, removed, or is temporarily unavailable."
        icon={<HelpCircle className="w-8 h-8 text-cyan-600" />}
        actionLabel="Back to Home"
        onAction={() => navigate("/")}
      />
    </div>
  );
};

export default NotFoundPage;
