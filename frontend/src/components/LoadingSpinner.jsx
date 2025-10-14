import React from 'react'

const LoadingSpinner = ({ message = 'กำลังโหลด...', size = 'medium' }) => {
  const sizeConfig = {
    small: {
      container: 'w-12 h-12',
      spinner: 'w-10 h-10',
      icon: 'text-2xl',
      text: 'text-sm',
      padding: 'p-4'
    },
    medium: {
      container: 'w-16 h-16',
      spinner: 'w-14 h-14',
      icon: 'text-3xl',
      text: 'text-base',
      padding: 'p-6'
    },
    large: {
      container: 'w-20 h-20',
      spinner: 'w-18 h-18',
      icon: 'text-4xl',
      text: 'text-lg',
      padding: 'p-8'
    }
  }

  const config = sizeConfig[size]

  return (
    <div className={`flex flex-col items-center justify-center ${config.padding}`}>
      {/* Animated Container with Gradient Background */}
      <div className="relative mb-6">
        {/* Outer rotating ring */}
        <div className={`${config.container} rounded-full bg-gradient-to-tr from-amber-400 via-orange-400 to-yellow-400 animate-spin`}>
          <div className="w-full h-full rounded-full bg-white m-1"></div>
        </div>
        
        {/* Inner pulsing icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-pulse">
            <i className={`ri-seedling-line ${config.icon} text-amber-600`}></i>
          </div>
        </div>
        
        {/* Decorative dots */}
        <div className="absolute -top-1 -right-1">
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-ping"></div>
        </div>
        <div className="absolute -bottom-1 -left-1">
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-ping animation-delay-150"></div>
        </div>
      </div>

      {/* Loading Message */}
      <div className="text-center">
        <p className={`text-gray-700 font-medium ${config.text} mb-1`}>
          {message}
        </p>
        {/* Animated dots */}
        <div className="flex items-center justify-center space-x-1">
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce animation-delay-150"></div>
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce animation-delay-300"></div>
        </div>
      </div>
    </div>
  )
}

export default LoadingSpinner

