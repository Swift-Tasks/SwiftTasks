"use server";

import { db } from "@/server/db";
import { task, assignment } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/server/auth";
import { headers } from "next/headers";

export async function saveTaskContent(taskId: string, content: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const existingTask = await db
    .select()
    .from(task)
    .where(and(eq(task.id, taskId), eq(task.userId, session.user.id)))
    .limit(1);

  if (existingTask.length === 0) {
    throw new Error("Task not found or unauthorized");
  }

  await db
    .update(task)
    .set({
      body: content,
      updatedAt: new Date(),
    })
    .where(eq(task.id, taskId));

  return { success: true };
}

export async function toggleTaskFinished(taskId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const existingTask = await db
    .select()
    .from(task)
    .where(and(eq(task.id, taskId), eq(task.userId, session.user.id)))
    .limit(1);

  if (existingTask.length === 0) {
    throw new Error("Task not found or unauthorized");
  }

  const newFinishedState = existingTask[0].finished ? 0 : 1;

  await db
    .update(task)
    .set({
      finished: newFinishedState,
    })
    .where(eq(task.id, taskId));

  return { success: true, finished: newFinishedState };
}

export async function toggleTaskBookmarked(taskId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const existingTask = await db
    .select()
    .from(task)
    .where(and(eq(task.id, taskId), eq(task.userId, session.user.id)))
    .limit(1);

  if (existingTask.length === 0) {
    throw new Error("Task not found or unauthorized");
  }

  const newBookmarkedState = existingTask[0].bookmarked ? 0 : 1;

  await db
    .update(task)
    .set({
      bookmarked: newBookmarkedState,
    })
    .where(eq(task.id, taskId));

  return { success: true, bookmarked: newBookmarkedState };
}

export async function getTask(taskId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const tasks = await db
    .select()
    .from(task)
    .where(and(eq(task.id, taskId), eq(task.userId, session.user.id)))
    .limit(1);

  if (tasks.length === 0) {
    throw new Error("Task not found");
  }

  const currentTask = tasks[0];
  let assignmentData = null;

  if (currentTask.assignmentId) {
    const assignments = await db
      .select()
      .from(assignment)
      .where(eq(assignment.id, currentTask.assignmentId))
      .limit(1);

    if (assignments.length > 0) {
      assignmentData = assignments[0];
    }
  }

  return {
    ...currentTask,
    assignment: assignmentData,
  };
}
