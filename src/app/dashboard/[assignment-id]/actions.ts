"use server";

import { db } from "@/server/db";
import { task, assignment } from "@/server/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { auth } from "@/server/auth";
import { headers } from "next/headers";

export async function getTasks() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const tasks = await db
    .select()
    .from(task)
    .where(eq(task.userId, session.user.id))
    .orderBy(desc(task.createdAt));

  return tasks;
}

export async function getAssignments() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const assignments = await db
    .select()
    .from(assignment)
    .where(eq(assignment.userId, session.user.id))
    .orderBy(desc(assignment.createdAt));

  return assignments;
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

export async function createTask(data: {
  name: string;
  assignmentId: string;
  body?: string;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Generate a unique ID
  const taskId = crypto.randomUUID();

  // Get the assignment to inherit its deadline
  const assignmentData = await db
    .select()
    .from(assignment)
    .where(
      and(
        eq(assignment.id, data.assignmentId),
        eq(assignment.userId, session.user.id)
      )
    )
    .limit(1);

  if (assignmentData.length === 0) {
    throw new Error("Assignment not found");
  }

  const newTask = {
    id: taskId,
    name: data.name,
    description: "",
    body: data.body || "",
    userId: session.user.id,
    assignmentId: data.assignmentId,
    bookmarked: 0,
    finished: 0,
    deadline: assignmentData[0].deadline,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.insert(task).values(newTask);

  return { success: true, task: newTask };
}
