"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth-provider";
import { Loading } from "./loading";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !session) {
      router.push("/signup");
    }
  }, [session, isLoading, router]);

  if (isLoading) {
    return <Loading />;
  }

  if (!session) {
    return null;
  }

  return <>{children}</>;
}
