import { ProtectedRoute } from "@/components/protected-route";
import Image from 'next/image';
export default function HomePage() {
  return (
    <ProtectedRoute>
      <div className="w-screen flex items-center justify-between gap-4 pt-4 px-4">
        <img className="w-[150px]" src="/images/SwifTaskLogo.png" alt="Logo" />

        <h1>Hello, User!</h1>
        <a href="/dashboard" className="flex justify-between items-center">
        <Image 
  className="w-12 h-12" 
  src="/images/user_profile_icon.png" 
  alt="profile"
  width={48}
  height={48}
/></a>
      </div>

      <div className="flex justify-center items-center h-[calc(100vh-250px)] gap-8 px-12">
        {/* <link href="/dashboard"> */}
        <div className="max-w-lg p-6 bg-white border border-gray-200 rounded-lg shadow min-h-[500px]">
          <h2 className="text-xl font-semibold mb-4 flex  items-center gap-2">
            <svg  xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"  className="text-[#FFB900] lucide lucide-clipboard-clock-icon lucide-clipboard-clock"><path d="M16 14v2.2l1.6 1"/><path d="M16 4h2a2 2 0 0 1 2 2v.832"/><path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h2"/><circle cx="16" cy="16" r="6"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>
            Assignments Due:
          </h2>
          <div className="space-y-3">
            <a href="/dashboard" className="flex justify-between items-center">
              <span>Cyber Security</span>
              <span className="text-gray-600 hover:shadow-lg transition-shadow">Due: Dec 5th, 2025</span>
            </a>
            <a href="/dashboard" className="flex justify-between items-center hover:shadow-lg transition-shadow">
              <span>Cloud Tech</span>
              <span className="text-gray-600">Due: Dec 5th, 2025</span>

              
            </a>
          </div>
        </div>
        {/* </link> */}
        {/* Second box - placeholder */}
      <div className="max-w-lg p-6 bg-white border border-gray-200 rounded-lg shadow min-h-[400px]">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="text-[#FFB900]  lucide lucide-calendar-fold-icon lucide-calendar-fold"><path d="M3 20a2 2 0 0 0 2 2h10a2.4 2.4 0 0 0 1.706-.706l3.588-3.588A2.4 2.4 0 0 0 21 16V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z"/><path d="M15 22v-5a1 1 0 0 1 1-1h5"/><path d="M8 2v4"/><path d="M16 2v4"/><path d="M3 10h18"/></svg>
          Your Timetable:</h2>
        {/* Add your content here */}
      </div>
      </div>
    </ProtectedRoute>
  );
}
