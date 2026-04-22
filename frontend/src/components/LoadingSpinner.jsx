import React from 'react'

const LoadingSpinner = ({ message = 'กำลังโหลด...', size = 'medium' }) => {
  const sizeConfig = {
    small: {
      spinner: 'w-8 h-8 border-4',
      text: 'text-sm',
      padding: 'p-4'
    },
    medium: {
      spinner: 'w-12 h-12 border-4',
      text: 'text-base',
      padding: 'p-6'
    },
    large: {
      spinner: 'w-16 h-16 border-4',
      text: 'text-lg',
      padding: 'p-8'
    }
  }

  const config = sizeConfig[size]

  return (
    <div className={`flex flex-col items-center justify-center ${config.padding}`}>
      <div
        className={`${config.spinner} mb-4 rounded-full border-amber-200 border-t-amber-600 animate-spin`}
        aria-hidden="true"
      />
      <div className="text-center">
        <p className={`text-gray-700 font-medium ${config.text}`}>
          {message}
        </p>
      </div>
    </div>
  )
}

export default LoadingSpinner
