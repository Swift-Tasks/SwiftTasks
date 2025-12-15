"use client";
import { useAuth } from "@/components/auth-provider";
import { ProtectedRoute } from "@/components/protected-route";
import Image from "next/image";
import { useState } from "react";

export default function HomePage() {

  const { user } = useAuth()
  const [tasks, setTasks] = useState([
    { id: 1, name: "Cyber Security", dueDate: new Date(2025, 11, 5) },
    { id: 2, name: "Cloud Tech", dueDate: new Date(2025, 11, 5) },
    { id: 3, name: "Cyber Security", dueDate: new Date(2025, 11, 5) },
    { id: 4, name: "Cloud Tech", dueDate: new Date(2025, 11, 5) },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskDate, setNewTaskDate] = useState("");
  const [currentStartDate, setCurrentStartDate] = useState(new Date());

  const generateTwoWeeks = (startDate) => {
    const dates = [];
    for (let i = 0; i < 14; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date);
    }
    return dates;
  };
  const goToPreviousWeeks = () => {
    const newDate = new Date(currentStartDate);
    newDate.setDate(newDate.getDate() - 14);
    setCurrentStartDate(newDate);
  };
  
  const goToNextWeeks = () => {
    const newDate = new Date(currentStartDate);
    newDate.setDate(newDate.getDate() + 14);
    setCurrentStartDate(newDate);
  };
  const getTasksForDate = (date) => {
    return  tasks.filter(task =>
   task.dueDate.toDateString() === date.toDateString()
    );
  };


  const addTask = () => {
    if (newTaskName.trim() && newTaskDate.trim()) {
      const newTask = {
        id: tasks.length + 1,
        name: newTaskName,
        dueDate: new Date(newTaskDate),
      };
      setTasks([...tasks, newTask]);

      setNewTaskName("");
      setNewTaskDate("");
      setIsAnimating(false);
      setTimeout(() => setShowForm(false), 300);
    }
  };

  const handleShowForm = () => {
    setShowForm(true);
    setTimeout(() => setIsAnimating(true), 10);
  };

  const handleHideForm = () => {
    setIsAnimating(false);
    setTimeout(() => setShowForm(false), 300);
  };

  return (
    <ProtectedRoute>
      <div className="text-center pt-8 pb-6">
        <h1 className="text-6xl font-bold bg-gradient-to-b from-[#FFB900] to-[#6c6c36] bg-clip-text text-transparent">
          Hello, {user?.name}!
        </h1>
      </div>

      <div className="flex justify-center items-center h-[calc(100vh-250px)] gap-8 px-12">
        <div className="max-w-lg p-6 bg-white border border-gray-200 rounded-lg shadow min-h-[500px]">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-[#FFB900]"
            >
              <path d="M16 14v2.2l1.6 1" />
              <path d="M16 4h2a2 2 0 0 1 2 2v.832" />
              <path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h2" />
              <circle cx="16" cy="16" r="6" />
              <rect x="8" y="2" width="8" height="4" rx="1" />
            </svg>
            Assignments Due:
          </h2>

          <div className="space-y-3">
            {tasks.map((task) => (
              <a
                key={task.id}
                href="/dashboard"
                className="flex justify-between items-center hover:shadow-lg transition-all duration-300 ease-in-out hover:scale-105"
              >
                <span>{task.name}</span>
                <span className="text-gray-600">Due: {task.dueDate.toLocaleDateString()}</span>
              </a>
            ))}
          </div>

          {showForm && (
            <div
              className={`mt-4 space-y-2 transition-all duration-300 ease-in-out ${
                isAnimating
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 -translate-y-2"
              }`}
            >
              <input
                type="text"
                placeholder="Task name (e.g., Math Homework)"
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
              <input
                type="text"
                placeholder="Due date (e.g., Dec 15th, 2025)"
                value={newTaskDate}
                onChange={(e) => setNewTaskDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
              <div className="flex gap-2">
                <button
                  onClick={addTask}
                  className="flex-1 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: "#FFCB3B" }}
                >
                  Save Task
                </button>
                <button
                  onClick={handleHideForm}
                  className="flex-1 py-2 rounded-lg font-medium bg-gray-300 hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {!showForm && (
            <button
              onClick={handleShowForm}
              className="w-full mt-4 py-2 rounded-lg font-medium hover:opacity-90 transition-all duration-300"
              style={{ backgroundColor: "#FFCB3B" }}
            >
              + Add Task
            </button>
          )}
        </div>

        <div className="max-w-3xl flex-1 p-6 bg-white border border-gray-200 rounded-lg shadow min-h-[400px]">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-[#FFB900]"
            >
              <path d="M3 20a2 2 0 0 0 2 2h10a2.4 2.4 0 0 0 1.706-.706l3.588-3.588A2.4 2.4 0 0 0 21 16V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z" />
              <path d="M15 22v-5a1 1 0 0 1 1-1h5" />
              <path d="M8 2v4" />
              <path d="M16 2v4" />
              <path d="M3 10h18" />
            </svg>
            Your Timetable:
          </h2>

          <div className="flex justify-between items-center mb-4">
            <button
              onClick={goToPreviousWeeks}
              className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg font-medium transition-colors"
            >
              ← Previous
            </button>
            <span className="font-semibold text-gray-700">
              {currentStartDate.toLocaleDateString()} - {new Date(currentStartDate.getTime() + 13 * 24 * 60 * 60 * 1000).toLocaleDateString()}
            </span>
            <button
              onClick={goToNextWeeks}
              className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg font-medium transition-colors"
            >
              Next →
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2 max-h-[350px] overflow-y-auto">
            {generateTwoWeeks(currentStartDate).map((date) => (
              <div key={date.toDateString()} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="font-semibold text-gray-800 text-sm">
                  {date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                </div>
                <div className="mt-2 space-y-1">
                  {getTasksForDate(date).length > 0 ? (
                    getTasksForDate(date).map((task) => (
                      <div key={task.id} className="text-xs bg-yellow-100 text-gray-800 p-1 rounded border-l-2 border-[#FFB900]">
                        {task.name}
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-gray-500 italic">No tasks</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}