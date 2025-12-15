import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { headers } from "next/headers";
import { db } from "@/server/db";
import { user } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized", message: "You must be logged in" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Invalid name", message: "Name is required" },
        { status: 400 }
      );
    }

    if (name.trim().length > 100) {
      return NextResponse.json(
        {
          error: "Invalid name",
          message: "Name must be less than 100 characters",
        },
        { status: 400 }
      );
    }

    await db.update(user).set({ name: name.trim() }).where(eq(user.id, userId));

    return NextResponse.json({
      success: true,
      message: "Profile updated",
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Server error", message: "Failed to update profile" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized", message: "You must be logged in" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    const [userRecord] = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        theme: user.theme,
        createdAt: user.createdAt,
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!userRecord) {
      return NextResponse.json(
        { error: "Not found", message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(userRecord);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Server error", message: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}
