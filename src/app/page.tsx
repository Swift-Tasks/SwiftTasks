export default function HomePage() {

  return (
    <>
    <div className="w-screen flex items-center gap-4 pt-4 pl-4">
    <img className="w-[150px]" src="/SwifTaskLogo.png" alt="Logo" />

      <h1>Hello, User!</h1>
      </div>

    
      <div className="flex items-center h-[calc(100vh-200px)] pl-12">
      <div className="max-w-md p-6 bg-white border border-gray-200 rounded-lg shadow">
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
      </div>

    
    </>
  )
}