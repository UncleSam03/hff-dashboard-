import React from "react";
import AuthPage from "@/auth/AuthPage";
import { useAuth } from "@/auth/AuthContext";

export default function AuthGate({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-hff-bg font-sans text-gray-900 flex items-center justify-center">
        <div className="text-sm text-gray-600">Loading…</div>
      </div>
    );
  }

  if (!user) return <AuthPage />;

  return children;
}

