import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { user, assignment, task } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { createId } from "@/lib/utils";

interface CanvasWebhookPayload {
  assignment_id: string;
  course_id: string;
  assignment_name: string;
  assignment_description: string;
  assignment_due_at: string | null;
  user_id?: string;
}

export async function POST(request: NextRequest) {
  try {
    const payload: CanvasWebhookPayload = await request.json();

    const users = await db.select().from(user);

    let syncedCount = 0;

    for (const userRecord of users) {
      if (!userRecord.canvasApiUrl || !userRecord.canvasApiToken) {
        continue;
      }

      const existingAssignments = await db
        .select()
        .from(assignment)
        .where(eq(assignment.userId, userRecord.id));

      const exists = existingAssignments.some(
        (a) => a.canvasAssignmentId === payload.assignment_id
      );

      if (exists) {
        continue;
      }

      const assignmentId = createId();
      const taskId = createId();

      await db.insert(assignment).values({
        id: assignmentId,
        name: payload.assignment_name,
        taskIds: taskId,
        userId: userRecord.id,
        canvasAssignmentId: payload.assignment_id,
        canvasCourseId: payload.course_id,
        deadline: payload.assignment_due_at
          ? new Date(payload.assignment_due_at)
          : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const taskBody = payload.assignment_description
        ? `# ${payload.assignment_name}\n\n## Description\n${payload.assignment_description}`
        : `# ${payload.assignment_name}`;

      await db.insert(task).values({
        id: taskId,
        name: payload.assignment_name,
        description: "Canvas assignment",
        body: taskBody,
        userId: userRecord.id,
        assignmentId: assignmentId,
        bookmarked: 0,
        finished: 0,
        deadline: payload.assignment_due_at
          ? new Date(payload.assignment_due_at)
          : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      syncedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Synced to ${syncedCount} users`,
    });
  } catch (error: any) {
    console.error("Canvas webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed", message: error.message },
      { status: 500 }
    );
  }
}
