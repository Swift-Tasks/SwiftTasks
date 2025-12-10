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

  const [showForm, setShowForm] = useState(false);
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskDate, setNewTaskDate] = useState("");
  const [newTaskColor, setNewTaskColor] = useState("cyan");

  const toggleTask = (idx: number) => {
    setTasks(prev =>
      prev.map((task, i) =>
        i === idx ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const addTask = () => {
    if (newTaskText.trim() && newTaskDate) {
      const newTask = {
        text: newTaskText,
        date: newTaskDate,
        color: newTaskColor,
        completed: false
      };
      setTasks(prev => [...prev, newTask]);
      
      // Reset form
      setNewTaskText("");
      setNewTaskDate("");
      setNewTaskColor("cyan");
      setShowForm(false);
    }
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
            <h1 contentEditable className="w-full"> Cyber Security </h1>
            <div className="flex gap-5 text-gray-600 text-sm">
              <input type="date" value="2025-01-01" onChange={() => {}}/>
              <span>🔗 Exam Unit</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowForm(true)}
              className="p-2 rounded-lg hover:bg-amber-600/20 text-xl"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus-icon lucide-plus"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-100 text-xl">
              ⚙️
            </button>
          </div>
        </div>

        {/* ADD TASK FORM */}
        {showForm && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold mb-3">Add New Task</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Task name"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <input
                type="text"
                placeholder="Date (e.g., Dec, 15th 14:00)"
                value={newTaskDate}
                onChange={(e) => setNewTaskDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <select
                value={newTaskColor}
                onChange={(e) => setNewTaskColor(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                <option value="red">Red (Urgent)</option>
                <option value="orange">Orange (Medium)</option>
                <option value="cyan">Cyan (Low)</option>
              </select>
              <div className="flex gap-2">
                <button
                  onClick={addTask}
                  className="flex-1 bg-orange-400 text-white px-4 py-2 rounded-lg hover:bg-orange-500 transition"
                >
                  Add Task
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TASK LIST */}
        <ul className="space-y-2 overflow-y-scroll h-[400px] overflow-x-hidden">
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