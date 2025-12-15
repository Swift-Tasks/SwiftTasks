import { NextRequest, NextResponse } from "next/server";
import { authenticateBearer } from "@/lib/bearer-auth";
import { db } from "@/server/db";
import { task } from "@/server/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const auth = await authenticateBearer(request);

  if (!auth.authenticated) {
    return NextResponse.json(
      { error: auth.error || "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const tasks = await db
      .select()
      .from(task)
      .where(eq(task.userId, auth.user!.id))
      .orderBy(desc(task.createdAt));

    return NextResponse.json({
      tasks,
      count: tasks.length,
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await authenticateBearer(request);

  if (!auth.authenticated) {
    return NextResponse.json(
      { error: auth.error || "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { name, description, bodyText, deadline, finished, bookmarked } =
      body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const taskId = `task-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const [newTask] = await db
      .insert(task)
      .values({
        id: taskId,
        name,
        description: description || "",
        body: bodyText || "",
        userId: auth.user!.id,
        deadline: deadline ? new Date(deadline) : undefined,
        finished: finished || 0,
        bookmarked: bookmarked || 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
