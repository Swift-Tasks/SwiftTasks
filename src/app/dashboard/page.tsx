"use client";

import { ProtectedRoute } from "@/components/protected-route";
import { useAuth } from "@/components/auth-provider";
import { Navbar } from "@/components/navbar";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <div className="mx-auto max-w-7xl p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-2 text-gray-600">
              Welcome back, {user?.name || "User"}!
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">Your Tasks</h2>
            <p className="text-gray-600">
              Your tasks will appear here. You&apos;re authenticated as{" "}
              <strong>{user?.email}</strong>
            </p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
