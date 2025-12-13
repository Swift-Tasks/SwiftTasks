import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { headers } from "next/headers";
import { db } from "@/server/db";
import { user } from "@/server/db/schema";
import { eq } from "drizzle-orm";

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

    const [userData] = await db
      .select({
        autoCompleteExpired: user.autoCompleteExpired,
        autoCompleteAllTasks: user.autoCompleteAllTasks,
        showCompletedAssignments: user.showCompletedAssignments,
        fontFamily: user.fontFamily,
        fontSize: user.fontSize,
        reducedMotion: user.reducedMotion,
        highContrast: user.highContrast,
        themeMode: user.themeMode,
        autoThemeEnabled: user.autoThemeEnabled,
        lightModeStart: user.lightModeStart,
        lightModeEnd: user.lightModeEnd,
      })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    return NextResponse.json({
      autoCompleteExpired: userData?.autoCompleteExpired ?? false,
      autoCompleteAllTasks: userData?.autoCompleteAllTasks ?? false,
      showCompletedAssignments: userData?.showCompletedAssignments ?? true,
      fontFamily: userData?.fontFamily ?? "default",
      fontSize: userData?.fontSize ?? "normal",
      reducedMotion: userData?.reducedMotion ?? false,
      highContrast: userData?.highContrast ?? false,
      themeMode: userData?.themeMode ?? "light",
      autoThemeEnabled: userData?.autoThemeEnabled ?? true,
      lightModeStart: userData?.lightModeStart ?? "07:00",
      lightModeEnd: userData?.lightModeEnd ?? "20:00",
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Internal error", message: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

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

    const allowedFields = [
      "autoCompleteExpired",
      "autoCompleteAllTasks",
      "showCompletedAssignments",
      "fontFamily",
      "fontSize",
      "reducedMotion",
      "highContrast",
      "themeMode",
      "autoThemeEnabled",
      "lightModeStart",
      "lightModeEnd",
    ];

    const updates: Record<string, any> = {};

    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields", message: "No valid fields to update" },
        { status: 400 }
      );
    }

    // Validate enum values
    if (
      updates.fontFamily &&
      !["default", "dyslexic", "mono"].includes(updates.fontFamily)
    ) {
      return NextResponse.json(
        { error: "Invalid value", message: "Invalid font family" },
        { status: 400 }
      );
    }

    if (
      updates.fontSize &&
      !["normal", "large", "larger"].includes(updates.fontSize)
    ) {
      return NextResponse.json(
        { error: "Invalid value", message: "Invalid font size" },
        { status: 400 }
      );
    }

    if (updates.themeMode && !["light", "dark"].includes(updates.themeMode)) {
      return NextResponse.json(
        { error: "Invalid value", message: "Invalid theme mode" },
        { status: 400 }
      );
    }

    await db.update(user).set(updates).where(eq(user.id, userId));

    return NextResponse.json({
      success: true,
      message: "Settings updated",
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Internal error", message: "Failed to update settings" },
      { status: 500 }
    );
  }
}
