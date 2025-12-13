import { NextRequest, NextResponse } from "next/server";
import { authenticateBearer } from "@/lib/bearer-auth";
import { db } from "@/server/db";
import { assignment } from "@/server/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const auth = await authenticateBearer(request);

  if (!auth.authenticated) {
    return NextResponse.json(
      { error: auth.error || "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const assignments = await db
      .select()
      .from(assignment)
      .where(eq(assignment.userId, auth.user!.id))
      .orderBy(desc(assignment.createdAt));

    return NextResponse.json({
      assignments,
      count: assignments.length,
    });
  } catch (error) {
    console.error("Error fetching assignments:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignments" },
      { status: 500 }
    );
  }
}
