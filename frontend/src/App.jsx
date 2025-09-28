import React from 'react'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-8">
          <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold">
            Track Frontend
          </div>
          <h1 className="block mt-1 text-lg leading-tight font-medium text-black">
            Hello World! 🌍
          </h1>
          <p className="mt-2 text-slate-500">
            Welcome to your React + Tailwind CSS starter project. This is a beautiful hello world application ready for development.
          </p>
          <div className="mt-6">
            <button className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out transform hover:scale-105">
              Get Started
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App


