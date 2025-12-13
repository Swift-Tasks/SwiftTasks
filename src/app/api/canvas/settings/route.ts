import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { headers } from "next/headers";
import { db } from "@/server/db";
import { user } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
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
    const { apiUrl, apiToken } = body;

    if (!apiUrl) {
      return NextResponse.json(
        { error: "Missing URL", message: "Canvas API URL is required" },
        { status: 400 }
      );
    }

    if (!apiToken) {
      return NextResponse.json(
        { error: "Missing token", message: "Canvas API token is required" },
        { status: 400 }
      );
    }

    // Validate token doesn't look like an error message
    const tokenStr = String(apiToken).trim();
    if (
      tokenStr.includes("error") ||
      tokenStr.includes("Error") ||
      tokenStr.includes("failed") ||
      tokenStr.includes("Failed") ||
      tokenStr.includes("{") ||
      tokenStr.includes("}") ||
      tokenStr.length < 10
    ) {
      return NextResponse.json(
        {
          error: "Invalid token",
          message: "Please enter a valid Canvas API token",
        },
        { status: 400 }
      );
    }

    // Normalize the URL
    let normalizedUrl = apiUrl.trim();
    if (normalizedUrl.endsWith("/")) {
      normalizedUrl = normalizedUrl.slice(0, -1);
    }
    if (normalizedUrl.endsWith("/api/v1")) {
      normalizedUrl = normalizedUrl.slice(0, -7);
    }
    // Ensure HTTPS (Canvas redirects HTTP to HTTPS and strips auth headers)
    if (normalizedUrl.startsWith("http://")) {
      normalizedUrl = normalizedUrl.replace("http://", "https://");
    }
    if (!normalizedUrl.startsWith("https://")) {
      normalizedUrl = "https://" + normalizedUrl;
    }

    // Save both URL and token directly
    await db
      .update(user)
      .set({
        canvasApiUrl: normalizedUrl,
        canvasApiToken: apiToken.trim(),
      })
      .where(eq(user.id, userId));

    return NextResponse.json({
      success: true,
      message: "Canvas settings saved",
    });
  } catch (error) {
    console.error("Error saving Canvas settings:", error);
    return NextResponse.json(
      { error: "Server error", message: "Failed to save settings" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
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

    await db
      .update(user)
      .set({
        canvasApiUrl: null,
        canvasApiToken: null,
        canvasLastSync: null,
      })
      .where(eq(user.id, userId));

    return NextResponse.json({
      success: true,
      message: "Canvas disconnected",
    });
  } catch (error) {
    console.error("Error disconnecting Canvas:", error);
    return NextResponse.json(
      { error: "Server error", message: "Failed to disconnect Canvas" },
      { status: 500 }
    );
  }
}
