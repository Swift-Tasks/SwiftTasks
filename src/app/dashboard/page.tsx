"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/protected-route";
import { useAuth } from "@/components/auth-provider";
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
import { toast } from "sonner";
import {
  Check,
  Plus,
  Calendar,
  ClipboardList,
  Clock,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  X,
  ArrowUpDown,
} from "lucide-react";
import {
  getAssignmentsGroupedByCourse,
  createAssignment,
  getAllCourses,
} from "./actions";

interface Assignment {
  id: string;
  name: string;
  taskIds: string;
  userId: string;
  canvasAssignmentId: string | null;
  canvasCourseId: string | null;
  deadline: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface CourseGroup {
  courseId: string | null;
  courseName: string;
  assignments: Assignment[];
}

interface Course {
  id: string;
  name: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [courseGroups, setCourseGroups] = useState<CourseGroup[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [completedAssignments, setCompletedAssignments] = useState<Set<string>>(
    new Set()
  );

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState<
    "all" | "today" | "week" | "month" | "overdue"
  >("all");
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"deadline" | "newest" | "name">(
    "deadline"
  );

  // Form state for new assignment
  const [newAssignmentName, setNewAssignmentName] = useState("");
  const [newCourseName, setNewCourseName] = useState("");
  const [newDeadline, setNewDeadline] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Timetable state
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
    return new Date(now.setDate(diff));
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [coursesData, groupedData] = await Promise.all([
          getAllCourses(),
          getAssignmentsGroupedByCourse(),
        ]);
        setCourseGroups(groupedData);
        setCourses(coursesData);
        console.log(coursesData, groupedData);
        console.log(await getAssignmentsGroupedByCourse());
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load assignments");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get due date color
  const getDueDateColor = (deadline: Date) => {
    const now = new Date();
    const dueDate = new Date(deadline);
    const diffMs = dueDate.getTime() - now.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffMs < 0) return "text-red-500";
    if (diffDays < 1) return "text-red-500";
    if (diffDays < 3) return "text-orange-500";
    if (diffDays < 7) return "text-amber-500";
    return "text-emerald-500";
  };

  // Format date
  const formatDate = (deadline: Date) => {
    const date = new Date(deadline);
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Toggle assignment completion
  const toggleComplete = (assignmentId: string) => {
    setCompletedAssignments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(assignmentId)) {
        newSet.delete(assignmentId);
      } else {
        newSet.add(assignmentId);
      }
      return newSet;
    });
  };

  // Create new assignment
  const handleCreateAssignment = async () => {
    if (!newAssignmentName.trim() || !newCourseName.trim() || !newDeadline) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsCreating(true);
    try {
      await createAssignment({
        name: newAssignmentName.trim(),
        courseName: newCourseName.trim(),
        deadline: new Date(newDeadline),
      });

      toast.success("Assignment created!");
      setAddDialogOpen(false);
      setNewAssignmentName("");
      setNewCourseName("");
      setNewDeadline("");

      // Refresh data
      const groupedData = await getAssignmentsGroupedByCourse();
      setCourseGroups(groupedData);
    } catch (error) {
      console.error("Error creating assignment:", error);
      toast.error("Failed to create assignment");
    } finally {
      setIsCreating(false);
    }
  };

  // Get two weeks of dates
  const weekDates = useMemo(() => {
    const dates = [];
    for (let i = 0; i < 14; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [currentWeekStart]);

  // Navigate weeks (2 weeks at a time)
  const goToPreviousWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() - 14);
    setCurrentWeekStart(newStart);
  };

  const goToNextWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + 14);
    setCurrentWeekStart(newStart);
  };

  // Get assignments for a specific date
  const getAssignmentsForDate = (date: Date) => {
    const allAssignments: Assignment[] = [];
    courseGroups.forEach((group) => {
      group.assignments.forEach((a) => {
        const assignmentDate = new Date(a.deadline);
        if (
          assignmentDate.getDate() === date.getDate() &&
          assignmentDate.getMonth() === date.getMonth() &&
          assignmentDate.getFullYear() === date.getFullYear()
        ) {
          allAssignments.push(a);
        }
      });
    });
    return allAssignments;
  };

  // Time slots for timetable
  const timeSlots = ["9am", "10am", "11am", "12pm", "1pm", "2pm", "3pm", "4pm"];
  const dayNames = [
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
    "Sun",
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
    "Sun",
  ];

  // Get color for cell based on if there's an assignment
  const getCellColor = (dayIndex: number, timeIndex: number) => {
    const date = weekDates[dayIndex];
    const assignments = getAssignmentsForDate(date);
    if (assignments.length > 0) {
      // Vary colors based on index for visual variety
      const colors = [
        "bg-red-100 dark:bg-red-900/30",
        "bg-orange-100 dark:bg-orange-900/30",
        "bg-amber-100 dark:bg-amber-900/30",
        "bg-emerald-100 dark:bg-emerald-900/30",
        "bg-cyan-100 dark:bg-cyan-900/30",
        "bg-purple-100 dark:bg-purple-900/30",
      ];
      return colors[(dayIndex + timeIndex) % colors.length];
    }
    return "";
  };

  // Filter assignments
  const filteredCourseGroups = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1);
    const endOfWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const endOfMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      today.getDate()
    );

    return courseGroups
      .filter((group) => {
        // Filter by selected course
        if (selectedCourse !== "all") {
          return (
            group.courseId === selectedCourse ||
            group.courseName === selectedCourse
          );
        }
        return true;
      })
      .map((group) => ({
        ...group,
        assignments: group.assignments
          .filter((assignment) => {
            // Search filter
            const assignmentName = assignment.name.toLowerCase();
            if (
              searchQuery &&
              !assignmentName.includes(searchQuery.toLowerCase())
            ) {
              return false;
            }

            // Time filter
            const deadline = new Date(assignment.deadline);
            switch (timeFilter) {
              case "today":
                return deadline >= today && deadline <= endOfToday;
              case "week":
                return deadline >= today && deadline <= endOfWeek;
              case "month":
                return deadline >= today && deadline <= endOfMonth;
              case "overdue":
                return deadline < now;
              default:
                return true;
            }
          })
          .sort((a, b) => {
            switch (sortBy) {
              case "newest":
                return (
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
                );
              case "name":
                return a.name.localeCompare(b.name);
              case "deadline":
              default:
                return (
                  new Date(a.deadline).getTime() -
                  new Date(b.deadline).getTime()
                );
            }
          }),
      }))
      .filter((group) => group.assignments.length > 0);
  }, [courseGroups, searchQuery, timeFilter, selectedCourse, sortBy]);

  // Get unique courses for filter dropdown
  const uniqueCourses = useMemo(() => {
    const courseMap = new Map<string, string>();
    courseGroups.forEach((group) => {
      const id = group.courseId || group.courseName;
      if (!courseMap.has(id)) {
        courseMap.set(id, group.courseName);
      }
    });
    return Array.from(courseMap.entries()).map(([id, name]) => ({ id, name }));
  }, [courseGroups]);

  const hasActiveFilters =
    searchQuery ||
    timeFilter !== "all" ||
    selectedCourse !== "all" ||
    sortBy !== "deadline";

  const clearFilters = () => {
    setSearchQuery("");
    setTimeFilter("all");
    setSelectedCourse("all");
    setSortBy("deadline");
  };

  const userName = user?.name || "User";

  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Welcome Header */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              Welcome back, {userName}
            </h1>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Assignments Due Card */}
            <div className="bg-card dark:bg-card rounded-2xl shadow-lg p-6 lg:row-span-1">
              <div className="flex items-center gap-2 mb-4">
                <ClipboardList className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Assignments Due
                </h2>
              </div>

              {/* Filters */}
              <div className="space-y-3 mb-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search assignments..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>

                {/* Filter buttons */}
                <div className="flex flex-wrap gap-2">
                  {/* Time filters */}
                  <div className="flex gap-1 flex-wrap">
                    {(
                      ["all", "today", "week", "month", "overdue"] as const
                    ).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setTimeFilter(filter)}
                        className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                          timeFilter === filter
                            ? "bg-amber-500 text-white"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                        }`}
                      >
                        {filter === "all"
                          ? "All"
                          : filter === "week"
                          ? "This Week"
                          : filter === "month"
                          ? "This Month"
                          : filter.charAt(0).toUpperCase() + filter.slice(1)}
                      </button>
                    ))}
                  </div>

                  {/* Course filter */}
                  {uniqueCourses.length > 1 && (
                    <select
                      value={selectedCourse}
                      onChange={(e) => setSelectedCourse(e.target.value)}
                      className="px-2.5 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-none focus:outline-none focus:ring-2 focus:ring-amber-500/50 cursor-pointer"
                    >
                      <option value="all">All Courses</option>
                      {uniqueCourses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.name}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Sort dropdown */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-2.5 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-none focus:outline-none focus:ring-2 focus:ring-amber-500/50 cursor-pointer"
                  >
                    <option value="deadline">Sort: Due Date</option>
                    <option value="newest">Sort: Newest</option>
                    <option value="name">Sort: Name</option>
                  </select>

                  {/* Clear filters */}
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="px-2.5 py-1 text-xs rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : courseGroups.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <p>No assignments yet.</p>
                  <p className="text-sm mt-1">
                    Enable courses in Settings or add an assignment.
                  </p>
                </div>
              ) : filteredCourseGroups.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p>No assignments match your filters.</p>
                  <button
                    onClick={clearFilters}
                    className="text-sm mt-2 text-amber-500 hover:text-amber-600"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2">
                  {filteredCourseGroups.map((group) => (
                    <div key={group.courseId || group.courseName}>
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                        {group.courseName}
                      </h3>
                      <div className="space-y-2">
                        {group.assignments.map((assignment) => {
                          const isCompleted = completedAssignments.has(
                            assignment.id
                          );
                          const assignmentName = assignment.name.includes(": ")
                            ? assignment.name.split(": ").slice(1).join(": ")
                            : assignment.name;

                          return (
                            <div
                              key={assignment.id}
                              className={`flex items-center gap-3 p-2 rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                                isCompleted ? "opacity-60" : ""
                              }`}
                            >
                              <button
                                onClick={() => toggleComplete(assignment.id)}
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                  isCompleted
                                    ? "bg-emerald-500 border-emerald-500 text-white"
                                    : "border-gray-300 dark:border-gray-600 hover:border-emerald-500"
                                }`}
                              >
                                {isCompleted && <Check className="w-3 h-3" />}
                              </button>
                              <button
                                onClick={() =>
                                  router.push(`/dashboard/${assignment.id}`)
                                }
                                className={`flex-1 text-left text-sm truncate ${
                                  isCompleted
                                    ? "line-through text-gray-500"
                                    : "text-gray-700 dark:text-gray-300"
                                }`}
                              >
                                {assignmentName}
                              </button>
                              <span
                                className={`text-xs font-medium ${getDueDateColor(
                                  assignment.deadline
                                )}`}
                              >
                                📅 {formatDate(assignment.deadline)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Assignment Button */}
              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="primary" className="w-full gap-2">
                      <Plus className="w-4 h-4" />
                      Add Assignment
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Assignment</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="course-name">Course/Class Name</Label>
                        <Input
                          id="course-name"
                          placeholder="e.g., Cyber Security"
                          value={newCourseName}
                          onChange={(e) => setNewCourseName(e.target.value)}
                          list="existing-courses"
                        />
                        <datalist id="existing-courses">
                          {courses.map((course) => (
                            <option key={course.id} value={course.name} />
                          ))}
                        </datalist>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="assignment-name">Assignment Name</Label>
                        <Input
                          id="assignment-name"
                          placeholder="e.g., Unit 1 Essay"
                          value={newAssignmentName}
                          onChange={(e) => setNewAssignmentName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="deadline">Due Date</Label>
                        <Input
                          id="deadline"
                          type="datetime-local"
                          value={newDeadline}
                          onChange={(e) => setNewDeadline(e.target.value)}
                        />
                      </div>
                      <Button
                        onClick={handleCreateAssignment}
                        disabled={isCreating}
                        className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                      >
                        {isCreating ? "Creating..." : "Create Assignment"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Timetable Card */}
            <div className="bg-card dark:bg-card rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-500" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Two Week Schedule
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={goToPreviousWeek}
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                  <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[180px] text-center">
                    {currentWeekStart.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    -{" "}
                    {weekDates[13].toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <button
                    onClick={goToNextWeek}
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Two Week Calendar Grid - stacked weeks */}
              <div className="space-y-4">
                {/* Week 1 */}
                <div className="grid grid-cols-7 gap-1">
                  {dayNames.slice(0, 7).map((day, i) => (
                    <div key={`week1-${day}-${i}`} className="text-center">
                      <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        {day}
                      </div>
                      <div
                        className={`text-lg font-semibold mb-2 ${
                          weekDates[i]?.toDateString() ===
                          new Date().toDateString()
                            ? "text-amber-500"
                            : "text-gray-900 dark:text-gray-100"
                        }`}
                      >
                        {weekDates[i]?.getDate()}
                      </div>
                      <div className="h-[120px] bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2 space-y-1.5 overflow-y-auto">
                        {getAssignmentsForDate(weekDates[i]).map(
                          (assignment) => {
                            const assignmentName = assignment.name.includes(
                              ": "
                            )
                              ? assignment.name.split(": ").slice(1).join(": ")
                              : assignment.name;
                            const isOverdue =
                              new Date(assignment.deadline) < new Date();

                            return (
                              <button
                                key={assignment.id}
                                onClick={() =>
                                  router.push(`/dashboard/${assignment.id}`)
                                }
                                className={`w-full text-left p-1.5 rounded text-xs truncate transition-colors cursor-pointer ${
                                  isOverdue
                                    ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50"
                                    : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50"
                                }`}
                                title={assignmentName}
                              >
                                {assignmentName}
                              </button>
                            );
                          }
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Week 2 */}
                <div className="grid grid-cols-7 gap-1">
                  {dayNames.slice(0, 7).map((day, i) => (
                    <div key={`week2-${day}-${i}`} className="text-center">
                      <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        {day}
                      </div>
                      <div
                        className={`text-lg font-semibold mb-2 ${
                          weekDates[i + 7]?.toDateString() ===
                          new Date().toDateString()
                            ? "text-amber-500"
                            : "text-gray-900 dark:text-gray-100"
                        }`}
                      >
                        {weekDates[i + 7]?.getDate()}
                      </div>
                      <div className="h-[120px] bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2 space-y-1.5 overflow-y-auto">
                        {getAssignmentsForDate(weekDates[i + 7]).map(
                          (assignment) => {
                            const assignmentName = assignment.name.includes(
                              ": "
                            )
                              ? assignment.name.split(": ").slice(1).join(": ")
                              : assignment.name;
                            const isOverdue =
                              new Date(assignment.deadline) < new Date();

                            return (
                              <button
                                key={assignment.id}
                                onClick={() =>
                                  router.push(`/dashboard/${assignment.id}`)
                                }
                                className={`w-full text-left p-1.5 rounded text-xs truncate transition-colors cursor-pointer ${
                                  isOverdue
                                    ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50"
                                    : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50"
                                }`}
                                title={assignmentName}
                              >
                                {assignmentName}
                              </button>
                            );
                          }
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
