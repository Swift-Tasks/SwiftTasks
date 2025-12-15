import { NextRequest, NextResponse } from "next/server";
import { authenticateBearer } from "@/lib/bearer-auth";
import { db } from "@/server/db";
import { task } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateBearer(request);

  if (!auth.authenticated) {
    return NextResponse.json(
      { error: auth.error || "Unauthorized" },
      { status: 401 }
    );
  }

  const { id } = await params;

  try {
    const [taskData] = await db
      .select()
      .from(task)
      .where(and(eq(task.id, id), eq(task.userId, auth.user!.id)))
      .limit(1);

    if (!taskData) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(taskData);
  } catch (error) {
    console.error("Error fetching task:", error);
    return NextResponse.json(
      { error: "Failed to fetch task" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateBearer(request);

  if (!auth.authenticated) {
    return NextResponse.json(
      { error: auth.error || "Unauthorized" },
      { status: 401 }
    );
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { name, description, bodyText, finished, bookmarked, deadline } =
      body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (bodyText !== undefined) updateData.body = bodyText;
    if (finished !== undefined) updateData.finished = finished;
    if (bookmarked !== undefined) updateData.bookmarked = bookmarked;
    if (deadline !== undefined)
      updateData.deadline = deadline ? new Date(deadline) : null;

    const [updatedTask] = await db
      .update(task)
      .set(updateData)
      .where(and(eq(task.id, id), eq(task.userId, auth.user!.id)))
      .returning();

    if (!updatedTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateBearer(request);

  if (!auth.authenticated) {
    return NextResponse.json(
      { error: auth.error || "Unauthorized" },
      { status: 401 }
    );
  }

  const { id } = await params;

  try {
    const [deletedTask] = await db
      .delete(task)
      .where(and(eq(task.id, id), eq(task.userId, auth.user!.id)))
      .returning();

    if (!deletedTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
