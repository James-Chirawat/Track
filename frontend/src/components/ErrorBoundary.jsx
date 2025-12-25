import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
            <div className="mb-6">
              <i className="ri-error-warning-line text-6xl text-red-500 mb-4"></i>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">เกิดข้อผิดพลาด</h1>
              <p className="text-gray-600 mb-4">
                ขออภัย เกิดข้อผิดพลาดในการโหลดหน้านี้
              </p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                <i className="ri-refresh-line mr-2"></i>
                รีเฟรชหน้า
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                <i className="ri-home-line mr-2"></i>
                กลับหน้าหลัก
              </button>
            </div>
            
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  รายละเอียดข้อผิดพลาด (สำหรับนักพัฒนา)
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto max-h-32">
                  {this.state.error?.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary


