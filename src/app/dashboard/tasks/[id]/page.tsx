"use client";

import { ProtectedRoute } from "@/components/protected-route";
import { useAuth } from "@/components/auth-provider";
import { Navbar } from "@/components/navbar";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <Navbar />

        <div className="flex w-full h-full items-center justify-center">
          
        </div>
      </div>
    </ProtectedRoute>
  );
}
