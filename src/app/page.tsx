"use client";
import { ProtectedRoute } from "@/components/protected-route";
import Image from 'next/image';
import { useState } from 'react';

export default function HomePage() {
  const [tasks, setTasks] = useState([
    { id: 1, name: 'Cyber Security', dueDate: 'Dec 5th, 2025' },
    { id: 2, name: 'Cloud Tech', dueDate: 'Dec 5th, 2025' },
    { id: 3, name: 'Cyber Security', dueDate: 'Dec 5th, 2025' },
    { id: 4, name: 'Cloud Tech', dueDate: 'Dec 5th, 2025' },
  ]);
  
  const [showForm, setShowForm] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false); // NEW: tracks animation state
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');

  const addTask = () => {
    if (newTaskName.trim() && newTaskDate.trim()) {
      const newTask = {
        id: tasks.length + 1,
        name: newTaskName,
        dueDate: newTaskDate
      };
      setTasks([...tasks, newTask]);
      
      setNewTaskName('');
      setNewTaskDate('');
      setIsAnimating(false); // NEW: stop animation
      setTimeout(() => setShowForm(false), 300); // NEW: hide after animation
    }
  };

  // NEW: Function to show form with animation
  const handleShowForm = () => {
    setShowForm(true);
    setTimeout(() => setIsAnimating(true), 10); // Small delay to trigger animation
  };

  // NEW: Function to hide form with animation
  const handleHideForm = () => {
    setIsAnimating(false);
    setTimeout(() => setShowForm(false), 300); // Hide after 300ms animation
  };

  return (
    <ProtectedRoute>
      <div className="w-screen flex items-center justify-between gap-4 pt-4 px-4">
        <img className="w-[150px]" src="/images/SwifTaskLogo.png" alt="Logo" />
        <a href="/dashboard" className="block">
          <Image 
            className="w-12 h-12 hover:scale-120 hover:brightness-120 transition-all duration-200 cursor-pointer"
            src="/images/user_profile_icon-removebg-bgremove.png" 
            alt="profile"
            width={48}
            height={48}
          />
        </a>
      </div>
      
      <h1 className="text-6xl">Hello, User!</h1>

      <div className="flex justify-center items-center h-[calc(100vh-250px)] gap-8 px-12">
        {/* First box - Assignments */}
        <div className="max-w-lg p-6 bg-white border border-gray-200 rounded-lg shadow min-h-[500px]">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#FFB900] lucide lucide-clipboard-clock-icon lucide-clipboard-clock">
              <path d="M16 14v2.2l1.6 1"/>
              <path d="M16 4h2a2 2 0 0 1 2 2v.832"/>
              <path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h2"/>
              <circle cx="16" cy="16" r="6"/>
              <rect x="8" y="2" width="8" height="4" rx="1"/>
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
                <span className="text-gray-600">Due: {task.dueDate}</span>
              </a>
            ))}
          </div>

          {/* Add Task Form with Transition */}
          {showForm && (
            <div 
              className={`mt-4 space-y-2 transition-all duration-300 ease-in-out ${
                isAnimating 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 -translate-y-2'
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
                  style={{ backgroundColor: '#FFCB3B' }}
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
              style={{ backgroundColor: '#FFCB3B' }}
            >
              + Add Task
            </button>
          )}
        </div>

        {/* Second box - Timetable */}
        <div className="max-w-lg p-6 bg-white border border-gray-200 rounded-lg shadow min-h-[400px]">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#FFB900] lucide lucide-calendar-fold-icon lucide-calendar-fold">
              <path d="M3 20a2 2 0 0 0 2 2h10a2.4 2.4 0 0 0 1.706-.706l3.588-3.588A2.4 2.4 0 0 0 21 16V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z"/>
              <path d="M15 22v-5a1 1 0 0 1 1-1h5"/>
              <path d="M8 2v4"/>
              <path d="M16 2v4"/>
              <path d="M3 10h18"/>
            </svg>
            Your Timetable:
          </h2>
          {/* Add your content here */}
        </div>
      </div>
    </ProtectedRoute>
  );
}