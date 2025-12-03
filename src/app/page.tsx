import { ProtectedRoute } from "@/components/protected-route";

export default function HomePage() {
  return (
    <ProtectedRoute>
      <div className="w-screen flex items-center gap-4 pt-4 pl-4">
        <img className="w-[150px]" src="/images/SwifTaskLogo.png" alt="Logo" />

        <h1>Hello, User!</h1>
      </div>

      <div className="flex justify-center items-center h-[calc(100vh-250px)] gap-8 px-12">
        <div className="max-w-lg p-6 bg-white border border-gray-200 rounded-lg shadow min-h-[500px]">
          <h2 className="text-xl font-semibold mb-4">Assignments Due:</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span>Cyber Security</span>
              <span className="text-gray-600">Due: Dec 5th, 2025</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Cloud Tech</span>
              <span className="text-gray-600">Due: Dec 5th, 2025</span>

              
            </div>
          </div>
        </div>
        {/* Second box - placeholder */}
      <div className="max-w-lg p-6 bg-white border border-gray-200 rounded-lg shadow min-h-[400px]">
        <h2 className="text-xl font-semibold mb-4">Your Timetable:</h2>
        {/* Add your content here */}
      </div>
      </div>
    </ProtectedRoute>
  );
}
