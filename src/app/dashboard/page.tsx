"use client";

import { useState } from "react";

export default function Home() {
  const [tasks, setTasks] = useState([
    { text: "Example Task", date: "Nov, 20th 12:00", color: "red", completed: false },
    { text: "Example Task", date: "Nov, 20th 12:00", color: "red", completed: false },
    { text: "Example Task", date: "Nov, 20th 12:00", color: "red", completed: false },
    { text: "Example Task", date: "Nov, 20th 12:00", color: "gray", completed: true },
    { text: "Example Task", date: "Nov, 20th 12:00", color: "orange", completed: false },
    { text: "Example Task", date: "Nov, 20th 12:00", color: "orange", completed: false },
    { text: "Example Task", date: "Nov, 20th 12:00", color: "orange", completed: false },
    { text: "Example Task", date: "Nov, 20th 12:00", color: "orange", completed: false },
    { text: "Example Task", date: "Nov, 20th 12:00", color: "orange", completed: false },
    { text: "Example Task", date: "Nov, 20th 12:00", color: "cyan", completed: false },
    { text: "Example Task", date: "Nov, 20th 12:00", color: "cyan", completed: false },
    { text: "Example Task", date: "Nov, 20th 12:00", color: "cyan", completed: false },
    { text: "Example Task", date: "Nov, 20th 12:00", color: "cyan", completed: false },
    { text: "Example Task", date: "Nov, 20th 12:00", color: "cyan", completed: false },
  ]);

  const toggleTask = (idx: number) => {
    setTasks(prev =>
      prev.map((task, i) =>
        i === idx ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const dateColorMap: Record<string, string> = {
    red: "text-red-500",
    orange: "text-orange-400",
    cyan: "text-cyan-400",
    gray: "text-gray-300",
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-5 bg-gradient-to-br from-yellow-200 to-orange-300">
      <div className="bg-white w-full max-w-3xl p-10 rounded-2xl shadow-2xl">
        
        {/* HEADER */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Cyber Security</h1>
            <div className="flex gap-5 text-gray-600 text-sm">
              <span>📅 12/01/2026</span>
              <span>🔗 Exam Unit</span>
            </div>
          </div>
          <button className="p-2 rounded-lg hover:bg-gray-100 text-xl">
            ⚙️
          </button>
        </div>

        {/* TASK LIST */}
        <ul className="space-y-2">
          {tasks.map((task, i) => (
            <li
              key={i}
              className={`flex items-center justify-between py-4 border-b border-gray-200 rounded-lg transition 
              hover:bg-gray-50 px-2 ${task.completed ? "opacity-60" : ""}`}
            >
              <div className="flex items-center gap-4 flex-1">
                <div
                  onClick={() => toggleTask(i)}
                  className={`w-5 h-5 border-2 rounded cursor-pointer transition 
                  ${task.completed ? "bg-gray-300 border-gray-300" : "border-gray-300 hover:border-gray-500"}`}
                ></div>

                <span
                  className={`text-base flex items-center gap-2 
                  ${task.completed ? "line-through text-gray-500" : "text-gray-800"}`}
                >
                  {task.text} 
                </span>
              </div>

              <span className={`text-sm font-medium ${dateColorMap[task.color]}`}>
                {task.date}
              </span>
            </li>
          ))}
        </ul>

        {/* BUTTON */}
        <div className="text-center mt-6">
          <button className="text-gray-500 text-sm hover:text-gray-700 transition">
            Show More...
          </button>
        </div>
      </div>
    </div>
  );
}
