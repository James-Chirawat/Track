import React from 'react'

const LoadingSpinner = ({ message = 'กำลังโหลด...', size = 'medium' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  }

  const textSizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  }

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className={`${sizeClasses[size]} animate-spin text-amber-600 mb-4`}>
        <i className="ri-loader-4-line text-current"></i>
      </div>
      <p className={`text-gray-600 ${textSizeClasses[size]}`}>
        {message}
      </p>
    </div>
  )
}

export default LoadingSpinner
