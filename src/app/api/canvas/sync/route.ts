import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { headers } from "next/headers";
import { db } from "@/server/db";
import { user, assignment, task } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { createId } from "@/lib/utils";

interface CanvasAssignment {
  id: number;
  name: string;
  description: string;
  due_at: string | null;
  course_id: number;
  html_url: string;
}

interface CanvasCourse {
  id: number;
  name: string;
}

async function fetchCanvasAssignments(apiUrl: string, apiToken: string) {
    console.log(apiUrl, apiToken)
  const coursesResponse = await fetch(
    `${apiUrl}/api/v1/courses?enrollment_state=active&per_page=100`,
    {
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    }
  );

  if (!coursesResponse.ok) {
    const status = coursesResponse.status;
    if (status === 401) {
      throw new Error(
        "Invalid or expired Canvas API token. Please check your token in Settings."
      );
    } else if (status === 403) {
      throw new Error(
        "Access denied. Your Canvas token may not have the required permissions."
      );
    } else if (status === 404) {
      throw new Error(
        "Canvas API URL not found. Please check your Canvas URL in Settings."
      );
    }
    throw new Error(`Canvas API error (${status})`);
  }

  const courses: CanvasCourse[] = await coursesResponse.json();

  if (!Array.isArray(courses)) {
    throw new Error(
      "Invalid response from Canvas API. Please check your Canvas URL."
    );
  }

  const allAssignments: (CanvasAssignment & { courseName: string })[] = [];

  for (const course of courses) {
    const assignmentsResponse = await fetch(
      `${apiUrl}/api/v1/courses/${course.id}/assignments?per_page=100`,
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      }
    );

    if (assignmentsResponse.ok) {
      const assignments: CanvasAssignment[] = await assignmentsResponse.json();
      allAssignments.push(
        ...assignments.map((a) => ({ ...a, courseName: course.name }))
      );
    }
  }

  return allAssignments;
}

// POST - Sync Canvas assignments (uses saved credentials from database)
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

    // Get saved credentials from database
    const [userRecord] = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    const apiUrl = userRecord?.canvasApiUrl;
    const apiToken = userRecord?.canvasApiToken;

    if (!apiUrl || !apiToken) {
      return NextResponse.json(
        {
          error: "Not configured",
          message:
            "Please save your Canvas URL and API token in Settings first.",
        },
        { status: 400 }
      );
    }

    // Fetch assignments from Canvas
    const canvasAssignments = await fetchCanvasAssignments(apiUrl, apiToken);

    // Get existing assignments to avoid duplicates
    const existingAssignments = await db
      .select()
      .from(assignment)
      .where(eq(assignment.userId, userId));

    const existingCanvasIds = new Set(
      existingAssignments
        .filter((a) => a.canvasAssignmentId)
        .map((a) => a.canvasAssignmentId)
    );

    let syncedCount = 0;
    let skippedCount = 0;

    for (const canvasAssignment of canvasAssignments) {
      const canvasId = canvasAssignment.id.toString();

      if (existingCanvasIds.has(canvasId)) {
        skippedCount++;
        continue;
      }

      const assignmentId = createId();
      const taskId = createId();

      await db.insert(assignment).values({
        id: assignmentId,
        name: `${canvasAssignment.courseName}: ${canvasAssignment.name}`,
        taskIds: taskId,
        userId: userId,
        canvasAssignmentId: canvasId,
        canvasCourseId: canvasAssignment.course_id.toString(),
        deadline: canvasAssignment.due_at
          ? new Date(canvasAssignment.due_at)
          : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const taskBody = canvasAssignment.description
        ? `# ${canvasAssignment.name}\n\n## Course\n${canvasAssignment.courseName}\n\n## Description\n${canvasAssignment.description}\n\n## Canvas Link\n[View in Canvas](${canvasAssignment.html_url})`
        : `# ${canvasAssignment.name}\n\n## Course\n${canvasAssignment.courseName}\n\n## Canvas Link\n[View in Canvas](${canvasAssignment.html_url})`;

      await db.insert(task).values({
        id: taskId,
        name: canvasAssignment.name,
        description: `Canvas assignment from ${canvasAssignment.courseName}`,
        body: taskBody,
        userId: userId,
        assignmentId: assignmentId,
        bookmarked: 0,
        finished: 0,
        deadline: canvasAssignment.due_at
          ? new Date(canvasAssignment.due_at)
          : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      syncedCount++;
    }

    // Update last sync time only
    await db
      .update(user)
      .set({ canvasLastSync: new Date() })
      .where(eq(user.id, userId));

    return NextResponse.json({
      success: true,
      message: `Synced ${syncedCount} assignments, skipped ${skippedCount} existing`,
      synced: syncedCount,
      skipped: skippedCount,
      total: canvasAssignments.length,
    });
  } catch (error: any) {
    console.error("Canvas sync error:", error);
    return NextResponse.json(
      {
        error: "Sync failed",
        message: error.message || "Failed to sync Canvas assignments",
      },
      { status: 500 }
    );
  }
}

// GET - Get Canvas configuration status and verify connection
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const [userRecord] = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    const { env } = await import("@/env");

    const apiUrl = userRecord?.canvasApiUrl;
    const apiToken = userRecord?.canvasApiToken;

    // Check if credentials exist and token looks valid (not an error message)
    const hasCredentials = !!(apiUrl && apiToken && apiToken.length >= 10);
    const tokenLooksValid =
      hasCredentials &&
      !apiToken!.includes("error") &&
      !apiToken!.includes("Error") &&
      !apiToken!.includes("failed") &&
      !apiToken!.includes("{");

    let connectionVerified = false;
    let connectionError: string | null = null;

    // If credentials look valid, verify the connection actually works
    if (hasCredentials && tokenLooksValid) {
      try {
        const testResponse = await fetch(`${apiUrl}/api/v1/users/self`, {
          headers: { Authorization: `Bearer ${apiToken}` },
          signal: AbortSignal.timeout(10000), // 10 second timeout
        });
        connectionVerified = testResponse.ok;
        if (!testResponse.ok) {
          connectionError = `Canvas returned ${testResponse.status}`;
        }
      } catch (e: any) {
        connectionVerified = false;
        connectionError = e.message || "Connection failed";
      }
    }

    return NextResponse.json({
      configured: hasCredentials && tokenLooksValid,
      connectionVerified,
      connectionError,
      apiUrl: apiUrl || null,
      hasToken: !!apiToken,
      lastSync: userRecord?.canvasLastSync || null,
      canvasBaseUrl: env.CANVAS_API_URL || null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get Canvas status" },
      { status: 500 }
    );
  }
}
