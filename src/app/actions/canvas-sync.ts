"use server";

import { db } from "@/server/db";
import { user, account, assignment, task } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { env } from "@/env";
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
  if(!apiToken) return [];
  const coursesResponse = await fetch(
    `${apiUrl}/api/v1/courses?enrollment_state=active&per_page=100`,
    {
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    }
  );

  if (!coursesResponse.ok) {
    throw new Error("Failed to fetch Canvas courses");
  }

  const courses: CanvasCourse[] = await coursesResponse.json();
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

async function syncCanvasAssignments(
  userId: string,
  apiUrl: string,
  apiToken: string
) {
  try {
    const canvasAssignments = await fetchCanvasAssignments(apiUrl, apiToken);

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

    await db
      .update(user)
      .set({
        canvasApiUrl: apiUrl,
        canvasLastSync: new Date(),
      })
      .where(eq(user.id, userId));

    console.log(
      `Canvas sync completed: ${syncedCount} synced, ${skippedCount} skipped`
    );
    return { success: true, syncedCount, skippedCount };
  } catch (error) {
    console.error("Canvas sync error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function checkAndSyncCanvasOnLogin(userId: string) {
  try {
    if (!env.CANVAS_API_URL) {
      return { shouldSync: false };
    }

    const [userRecord] = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!userRecord) {
      return { shouldSync: false };
    }

    const [microsoftAccount] = await db
      .select()
      .from(account)
      .where(eq(account.userId, userId))
      .limit(1);

    if (!microsoftAccount || microsoftAccount.providerId !== "microsoft") {
      if (!userRecord.canvasApiUrl || !userRecord.canvasApiToken) {
        return { shouldSync: false };
      }

      if (!userRecord.canvasLastSync) {
        return {
          shouldSync: true,
          apiUrl: userRecord.canvasApiUrl,
          apiToken: userRecord.canvasApiToken,
        };
      }

      const hoursSinceLastSync =
        (Date.now() - new Date(userRecord.canvasLastSync).getTime()) /
        (1000 * 60 * 60);

      if (hoursSinceLastSync > 24) {
        return {
          shouldSync: true,
          apiUrl: userRecord.canvasApiUrl,
          apiToken: userRecord.canvasApiToken,
        };
      }

      return { shouldSync: false };
    }

    if (!microsoftAccount.accessToken) {
      return { shouldSync: false };
    }

    if (!userRecord.canvasLastSync) {
      await syncCanvasAssignments(
        userId,
        env.CANVAS_API_URL,
        microsoftAccount.accessToken
      );
      return { shouldSync: false };
    }

    const hoursSinceLastSync =
      (Date.now() - new Date(userRecord.canvasLastSync).getTime()) /
      (1000 * 60 * 60);

    if (hoursSinceLastSync > 24) {
      await syncCanvasAssignments(
        userId,
        env.CANVAS_API_URL,
        microsoftAccount.accessToken
      );
    }

    return { shouldSync: false };
  } catch (error) {
    console.error("Error checking Canvas sync status:", error);
    return { shouldSync: false };
  }
}
