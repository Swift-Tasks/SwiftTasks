"use server";

import { db } from "@/server/db";
import { task, assignment, user } from "@/server/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { auth } from "@/server/auth";
import { headers } from "next/headers";
import { createId } from "@/lib/utils";

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
    .orderBy(desc(assignment.deadline));

  return assignments;
}

export async function getAssignmentsGroupedByCourse() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Get user's enabled courses
  const [userData] = await db
    .select()
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  const enabledCourses: string[] = userData?.enabledCourses
    ? JSON.parse(userData.enabledCourses)
    : [];

  // If no courses are enabled, return empty array (default: no unnecessary data)
  if (enabledCourses.length === 0) {
    return [];
  }

  // Get all assignments
  let assignmentsQuery = db
    .select()
    .from(assignment)
    .where(eq(assignment.userId, session.user.id))
    .orderBy(assignment.deadline);

  const allAssignments = await assignmentsQuery;

  // Filter by enabled courses (include assignments without canvasCourseId as "manual" assignments)
  const filteredAssignments = allAssignments.filter(
    (a) => !a.canvasCourseId || enabledCourses.includes(a.canvasCourseId)
  );

  // Sort assignments: non-expired first (by deadline), then expired at the bottom
  const now = new Date();
  const sortedAssignments = filteredAssignments.sort((a, b) => {
    const aExpired = new Date(a.deadline) < now;
    const bExpired = new Date(b.deadline) < now;

    // If one is expired and the other isn't, non-expired comes first
    if (aExpired && !bExpired) return 1;
    if (!aExpired && bExpired) return -1;

    // Both expired or both non-expired: sort by deadline
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });

  // Group assignments by course name
  const grouped: Record<
    string,
    {
      courseId: string | null;
      courseName: string;
      assignments: typeof sortedAssignments;
    }
  > = {};

  for (const a of sortedAssignments) {
    // Extract course name from assignment name (format: "CourseName: AssignmentName")
    const courseName = a.name.includes(": ")
      ? a.name.split(": ")[0]
      : "Uncategorized";
    const courseId = a.canvasCourseId || courseName;

    if (!grouped[courseId]) {
      grouped[courseId] = {
        courseId: a.canvasCourseId,
        courseName,
        assignments: [],
      };
    }
    grouped[courseId].assignments.push(a);
  }

  return Object.values(grouped);
}

export async function getAllCourses() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const allAssignments = await db
    .select()
    .from(assignment)
    .where(eq(assignment.userId, session.user.id));

  // Extract unique courses
  const courses: Record<string, { id: string; name: string }> = {};

  for (const a of allAssignments) {
    const courseName = a.name.includes(": ")
      ? a.name.split(": ")[0]
      : "Uncategorized";
    const courseId = a.canvasCourseId || courseName;

    if (!courses[courseId]) {
      courses[courseId] = {
        id: courseId,
        name: courseName,
      };
    }
  }

  return Object.values(courses);
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

export async function createAssignment(data: {
  name: string;
  courseName: string;
  deadline: Date;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const assignmentId = createId();
  const fullName = `${data.courseName} - ${data.name}`;

  await db.insert(assignment).values({
    id: assignmentId,
    name: fullName,
    taskIds: "[]",
    userId: session.user.id,
    deadline: data.deadline,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return { success: true, id: assignmentId };
}

export async function toggleAssignmentComplete(assignmentId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Get assignment's tasks and toggle them all
  const assignmentTasks = await db
    .select()
    .from(task)
    .where(
      and(eq(task.assignmentId, assignmentId), eq(task.userId, session.user.id))
    );

  // Check if all tasks are complete
  const allComplete = assignmentTasks.every((t) => t.finished === 1);
  const newState = allComplete ? 0 : 1;

  // Toggle all tasks
  for (const t of assignmentTasks) {
    await db.update(task).set({ finished: newState }).where(eq(task.id, t.id));
  }

  return { success: true, finished: newState };
}

export async function getEnabledCourses() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const [userData] = await db
    .select()
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  return userData?.enabledCourses ? JSON.parse(userData.enabledCourses) : [];
}

export async function setEnabledCourses(courseIds: string[]) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  await db
    .update(user)
    .set({
      enabledCourses: JSON.stringify(courseIds),
    })
    .where(eq(user.id, session.user.id));

  return { success: true };
}
