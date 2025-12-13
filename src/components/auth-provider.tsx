"use client";

import { createContext, useContext, ReactNode, useEffect, useRef } from "react";
import { useSession } from "@/lib/auth-client";
import { checkAndSyncCanvasOnLogin } from "@/app/actions/canvas-sync";

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
  const syncTriggeredRef = useRef(false);

  useEffect(() => {
    if (session?.user?.id && !syncTriggeredRef.current) {
      syncTriggeredRef.current = true;
      checkAndSyncCanvasOnLogin(session.user.id).catch(console.error);
    }
  }, [session?.user?.id]);

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
