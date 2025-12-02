"use client";

import { createContext, useContext, ReactNode } from "react";
import { useSession } from "@/lib/auth-client";

type User = {
  id: string;
  name: string;
  email: string;
  image?: string;
  emailVerified: boolean;
};

type Session = {
  user: User;
  session: {
    id: string;
    expiresAt: Date;
    token: string;
    userId: string;
  };
};

type AuthContextType = {
  session: Session | null;
  isLoading: boolean;
  user: User | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession();

  const value: AuthContextType = {
    session: session as Session | null,
    isLoading: isPending,
    user: session?.user as User | null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
