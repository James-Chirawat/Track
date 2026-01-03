import React from 'react'
import { Link, useLocation } from 'react-router-dom'

const Layout = ({ children }) => {
  const location = useLocation()

  const navigation = [
    { name: 'แดชบอร์ด', href: '/', icon: 'ri-dashboard-line' },
    { name: 'แผนผังการผลิต', href: '/roadmap', icon: 'ri-route-line' },
    { name: 'บันทึกประจำวัน', href: '/daily-record', icon: 'ri-file-list-3-line' },
    // { name: 'สแกน QR Code', href: '/scanner', icon: 'ri-qr-scan-line' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-amber-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <i className="ri-seedling-line text-xl sm:text-2xl text-amber-600 mr-2"></i>
                <h1 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 leading-tight">
                  <span className="hidden lg:inline">ระบบบริหารจัดการและควบคุมการผลิตไข่น้ำอินทรีย์ของกลุ่มผู้ประกอบการ</span>
                  <span className="hidden sm:inline lg:hidden">ระบบควบคุมการผลิตไข่น้ำอินทรีย์</span>
                  <span className="sm:hidden">ระบบผลิตไข่น้ำอินทรีย์</span>
                </h1>
              </div>
            </div>
            <nav className="hidden md:flex space-x-4 lg:space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`inline-flex items-center px-2 lg:px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    location.pathname === item.href
                      ? 'text-amber-700 bg-amber-100'
                      : 'text-gray-600 hover:text-amber-700 hover:bg-amber-50'
                  }`}
                >
                  <i className={`${item.icon} mr-1 lg:mr-2`}></i>
                  <span className="hidden lg:inline">{item.name}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <div className="md:hidden bg-white border-b border-amber-200 sticky top-16 z-30">
        <div className="flex overflow-x-auto px-2 py-2 space-x-2">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`flex-shrink-0 inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                location.pathname === item.href
                  ? 'text-amber-700 bg-amber-100'
                  : 'text-gray-600 hover:text-amber-700 hover:bg-amber-50'
              }`}
            >
              <i className={`${item.icon} mr-2`}></i>
              {item.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}

export default Layout
