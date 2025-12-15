import { NextRequest } from "next/server";
import { db } from "@/server/db";
import { session, user } from "@/server/db/schema";
import { eq, and, gt } from "drizzle-orm";

export async function authenticateBearer(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      authenticated: false,
      error: "Missing or invalid authorization header",
    };
  }

  const token = authHeader.substring(7);

  if (!token) {
    return { authenticated: false, error: "No token provided" };
  }

  try {
    const [sessionData] = await db
      .select({
        session: session,
        user: user,
      })
      .from(session)
      .innerJoin(user, eq(session.userId, user.id))
      .where(and(eq(session.token, token), gt(session.expiresAt, new Date())))
      .limit(1);

    if (!sessionData) {
      return { authenticated: false, error: "Invalid or expired token" };
    }

    return {
      authenticated: true,
      user: sessionData.user,
      session: sessionData.session,
    };
  } catch (error) {
    console.error("Bearer auth error:", error);
    return { authenticated: false, error: "Authentication failed" };
  }
}
