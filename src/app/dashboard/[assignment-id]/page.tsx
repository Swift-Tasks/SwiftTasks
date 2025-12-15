"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { ProtectedRoute } from "@/components/protected-route";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import {
  Check,
  Bookmark,
  BookmarkCheck,
  Calendar,
  ChevronDown,
  RefreshCw,
  ExternalLink,
  Clock,
  AlertCircle,
  Plus,
  Upload,
} from "lucide-react";
import {
  getTasks,
  getAssignments,
  toggleTaskFinished,
  toggleTaskBookmarked,
  createTask,
} from "./actions";

interface Task {
  id: string;
  name: string;
  description: string;
  body: string;
  userId: string;
  bookmarked: number;
  assignmentId: string | null;
  finished: number;
  deadline: string | number | Date;
  createdAt: string | number | Date;
  updatedAt: string | number | Date;
}

interface Assignment {
  id: string;
  name: string;
  taskIds: string;
  userId: string;
  canvasAssignmentId: string | null;
  canvasCourseId: string | null;
  deadline: string | number | Date;
  createdAt: string | number | Date;
  updatedAt: string | number | Date;
}

type DateFilter = "all" | "today" | "week" | "month" | "overdue" | "custom";

export default function DashboardPage() {
  const router = useRouter();
  const params = useParams();
  const assignmentId = params["assignment-id"] as string;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [showCompleted, setShowCompleted] = useState(true);

  // Add task dialog state
  const [addTaskDialogOpen, setAddTaskDialogOpen] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskBody, setNewTaskBody] = useState("");
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Set selected assignment from URL params
  useEffect(() => {
    if (assignmentId) {
      setSelectedAssignment(assignmentId);
    }
  }, [assignmentId]);

  // Fetch tasks and assignments
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [tasksData, assignmentsData] = await Promise.all([
          getTasks(),
          getAssignments(),
        ]);
        setTasks(tasksData);
        setAssignments(assignmentsData);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load tasks");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get due date color based on how soon it's due
  const getDueDateColor = (deadline: string | number | Date) => {
    const now = new Date();
    const dueDate = new Date(deadline);
    const diffMs = dueDate.getTime() - now.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffMs < 0) {
      // Overdue
      return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20";
    } else if (diffDays < 1) {
      // Due today
      return "text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20";
    } else if (diffDays < 3) {
      // Due in 1-3 days
      return "text-orange-500 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20";
    } else if (diffDays < 7) {
      // Due in 3-7 days
      return "text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20";
    } else {
      // Due in more than a week
      return "text-emerald-500 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20";
    }
  };

  // Format due date for display
  const formatDueDate = (deadline: string | number | Date) => {
    const dueDate = new Date(deadline);
    const now = new Date();
    const diffMs = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `${Math.abs(diffDays)} day${
        Math.abs(diffDays) !== 1 ? "s" : ""
      } overdue`;
    } else if (diffDays === 0) {
      return "Due today";
    } else if (diffDays === 1) {
      return "Due tomorrow";
    } else if (diffDays < 7) {
      return `Due in ${diffDays} days`;
    } else {
      return dueDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year:
          dueDate.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      });
    }
  };

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = [...tasks];

    // Filter by assignment
    if (selectedAssignment) {
      filtered = filtered.filter(
        (task) => task.assignmentId === selectedAssignment
      );
    }

    // Filter by completion status
    if (!showCompleted) {
      filtered = filtered.filter((task) => !task.finished);
    }

    // Filter by date
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));

    switch (dateFilter) {
      case "today":
        const endOfDay = new Date(startOfDay);
        endOfDay.setDate(endOfDay.getDate() + 1);
        filtered = filtered.filter((task) => {
          const deadline = new Date(task.deadline);
          return deadline >= startOfDay && deadline < endOfDay;
        });
        break;
      case "week":
        const endOfWeek = new Date(startOfDay);
        endOfWeek.setDate(endOfWeek.getDate() + 7);
        filtered = filtered.filter((task) => {
          const deadline = new Date(task.deadline);
          return deadline >= startOfDay && deadline < endOfWeek;
        });
        break;
      case "month":
        const endOfMonth = new Date(startOfDay);
        endOfMonth.setMonth(endOfMonth.getMonth() + 1);
        filtered = filtered.filter((task) => {
          const deadline = new Date(task.deadline);
          return deadline >= startOfDay && deadline < endOfMonth;
        });
        break;
      case "overdue":
        filtered = filtered.filter((task) => {
          const deadline = new Date(task.deadline);
          return deadline < startOfDay;
        });
        break;
      case "custom":
        if (customStartDate) {
          const start = new Date(customStartDate);
          filtered = filtered.filter(
            (task) => new Date(task.deadline) >= start
          );
        }
        if (customEndDate) {
          const end = new Date(customEndDate);
          end.setDate(end.getDate() + 1); // Include the end date
          filtered = filtered.filter((task) => new Date(task.deadline) < end);
        }
        break;
    }

    // Sort: bookmarked first, then by deadline (ascending)
    filtered.sort((a, b) => {
      // Bookmarked tasks first
      if (a.bookmarked !== b.bookmarked) {
        return b.bookmarked - a.bookmarked;
      }
      // Then sort by deadline (earliest first)
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });

    return filtered;
  }, [
    tasks,
    selectedAssignment,
    dateFilter,
    customStartDate,
    customEndDate,
    showCompleted,
  ]);

  // Toggle task completion
  const handleToggleCompletion = async (
    taskId: string,
    currentStatus: number
  ) => {
    try {
      const result = await toggleTaskFinished(taskId);
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, finished: result.finished } : task
        )
      );
      toast.success(
        currentStatus ? "Task marked as incomplete" : "Task completed!"
      );
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
    }
  };

  // Toggle task bookmark
  const handleToggleBookmark = async (taskId: string) => {
    try {
      const result = await toggleTaskBookmarked(taskId);
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, bookmarked: result.bookmarked } : task
        )
      );
    } catch (error) {
      console.error("Error updating bookmark:", error);
      toast.error("Failed to update bookmark");
    }
  };

  // Create new task
  const handleCreateTask = async () => {
    if (!newTaskName.trim()) {
      toast.error("Please enter a task name");
      return;
    }

    if (!selectedAssignment) {
      toast.error("Please select an assignment first");
      return;
    }

    setIsCreatingTask(true);
    try {
      await createTask({
        name: newTaskName.trim(),
        assignmentId: selectedAssignment,
        body: newTaskBody,
      });

      toast.success("Task created!");
      setAddTaskDialogOpen(false);
      setNewTaskName("");
      setNewTaskBody("");

      // Refresh tasks
      const tasksData = await getTasks();
      setTasks(tasksData);
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error("Failed to create task");
    } finally {
      setIsCreatingTask(false);
    }
  };

  // Handle file upload for task body
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".md") && !file.name.endsWith(".markdown")) {
      toast.error("Please select a markdown file (.md or .markdown)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setNewTaskBody(text);
      toast.success(`Loaded ${file.name}`);
    };
    reader.onerror = () => {
      toast.error("Failed to read file");
    };
    reader.readAsText(file);

    event.target.value = "";
  };

  const selectedAssignmentName = selectedAssignment
    ? assignments.find((a) => a.id === selectedAssignment)?.name || "Assignment"
    : "All Tasks";

  const dateFilterLabels: Record<DateFilter, string> = {
    all: "All Dates",
    today: "Due Today",
    week: "This Week",
    month: "This Month",
    overdue: "Overdue",
    custom: "Custom Range",
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-row justify-between items-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {selectedAssignmentName.length > 43
                  ? `${selectedAssignmentName.slice(0, 50)}...`
                  : selectedAssignmentName}
              </h1>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {filteredAndSortedTasks.length} task
                {filteredAndSortedTasks.length !== 1 ? "s" : ""}
                {!showCompleted && " (hiding completed)"}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {/* Date Filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="gap-1 px-1.5 py-0.5 text-xs h-auto rounded-md"
                  >
                    <Calendar className="w-3 h-3" />
                    {dateFilterLabels[dateFilter]}
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-64 border border-white/10">
                  <div className="space-y-2">
                    {(Object.keys(dateFilterLabels) as DateFilter[]).map(
                      (filter) => (
                        <button
                          key={filter}
                          onClick={() => setDateFilter(filter)}
                          className={`w-full cursor-pointer text-left px-3 py-2 rounded-md text-sm transition-colors ${
                            dateFilter === filter
                              ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                              : "hover:bg-gray-100 dark:hover:bg-gray-800"
                          }`}
                        >
                          {dateFilterLabels[filter]}
                        </button>
                      )
                    )}

                    {dateFilter === "custom" && (
                      <div className="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-3">
                        <div>
                          <Label className="text-xs">Start Date</Label>
                          <Input
                            type="date"
                            value={customStartDate}
                            onChange={(e) => setCustomStartDate(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">End Date</Label>
                          <Input
                            type="date"
                            value={customEndDate}
                            onChange={(e) => setCustomEndDate(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Show/Hide Completed Toggle */}
              <Button
                variant={showCompleted ? "outline" : "secondary"}
                onClick={() => setShowCompleted(!showCompleted)}
                className="gap-1 px-1.5 py-0.5 text-xs h-auto rounded-md"
              >
                <Check className="w-3 h-3" />
                {showCompleted ? "All" : "Active"}
              </Button>

              {/* Add Task Button */}
              <Dialog
                open={addTaskDialogOpen}
                onOpenChange={setAddTaskDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="primary"
                    className="gap-1 px-1.5 py-0.5 text-xs h-auto rounded-md"
                    disabled={!selectedAssignment}
                  >
                    <Plus className="w-3 h-3" />
                    Add
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Task</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="task-name">Task Name</Label>
                      <Input
                        id="task-name"
                        placeholder="Enter task name..."
                        value={newTaskName}
                        onChange={(e) => setNewTaskName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Initial Notes (Optional)</Label>
                        <Button
                          variant="ghost"
                          className="gap-1.5 px-2 py-1 text-xs h-auto"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="w-3.5 h-3.5" />
                          Upload .md
                        </Button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".md,.markdown"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </div>
                      <textarea
                        placeholder="Enter initial notes or upload a markdown file..."
                        value={newTaskBody}
                        onChange={(e) => setNewTaskBody(e.target.value)}
                        className="w-full h-32 px-3 py-2 text-sm border border-gray-200 dark:border-neutral-600 rounded-lg bg-white dark:bg-[oklch(0.228_0.013_286.375)] text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
                      />
                    </div>
                    <Button
                      onClick={handleCreateTask}
                      disabled={isCreatingTask || !newTaskName.trim()}
                      className="w-full"
                      variant="primary"
                    >
                      {isCreatingTask ? "Creating..." : "Create Task"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Task List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : filteredAndSortedTasks.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
                No tasks found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {selectedAssignment
                  ? "No tasks in this assignment match your filters"
                  : "Try adjusting your filters or sync from Canvas"}
              </p>
            </div>
          ) : (
            <div className="bg-card dark:bg-card rounded-xl shadow-sm border border-gray-200 dark:border-neutral-800 overflow-hidden">
              <ul className="divide-y divide-gray-100 dark:divide-neutral-800">
                {filteredAndSortedTasks.map((task) => (
                  <li
                    key={task.id}
                    className={`group flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors ${
                      task.finished ? "opacity-60" : ""
                    }`}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleCompletion(task.id, task.finished);
                      }}
                      className={`shrink-0 w-5 h-5 rounded border-2 transition-colors flex items-center justify-center ${
                        task.finished
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : "border-gray-300 dark:border-gray-600 hover:border-emerald-500 dark:hover:border-emerald-500"
                      }`}
                    >
                      {task.finished ? <Check className="w-3 h-3" /> : null}
                    </button>

                    {/* Bookmark */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleBookmark(task.id);
                      }}
                      className={`shrink-0 transition-colors ${
                        task.bookmarked
                          ? "text-amber-500"
                          : "text-gray-300 dark:text-gray-600 hover:text-amber-400"
                      }`}
                    >
                      {task.bookmarked ? (
                        <BookmarkCheck className="w-5 h-5" />
                      ) : (
                        <Bookmark className="w-5 h-5" />
                      )}
                    </button>

                    {/* Task Content - Clickable */}
                    <button
                      onClick={() =>
                        router.push(
                          `/dashboard/${assignmentId}/tasks/${task.id}`
                        )
                      }
                      className="flex-1 text-left min-w-0"
                    >
                      <p
                        className={`font-medium truncate ${
                          task.finished
                            ? "line-through text-gray-500 dark:text-gray-400"
                            : "text-gray-900 dark:text-gray-100"
                        }`}
                        title={task.name}
                      >
                        {task.name.length > 43
                          ? task.name.slice(0, 43) + "…"
                          : task.name}
                      </p>
                      {task.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
                          {task.description}
                        </p>
                      )}
                    </button>

                    {/* Due Date */}
                    <div
                      className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${getDueDateColor(
                        task.deadline
                      )}`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      {formatDueDate(task.deadline)}
                    </div>

                    {/* View Link */}
                    <button
                      onClick={() =>
                        router.push(
                          `/dashboard/${assignmentId}/tasks/${task.id}`
                        )
                      }
                      className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
