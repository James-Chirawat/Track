import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { apiClient } from '../lib/api'
import LoadingSpinner from '../components/LoadingSpinner'
import QRCode from 'react-qr-code'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    inProduction: 0,
    completed: 0,
    cancelled: 0,
    statusDistribution: {},
    branchStats: [],
    recentActivity: []
  })
  const [branches, setBranches] = useState([])
  const [selectedBranch, setSelectedBranch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showQRPrintModal, setShowQRPrintModal] = useState(false)
  const [products, setProducts] = useState([])

  const fetchBranches = useCallback(async () => {
    try {
      setError('')
      const response = await apiClient.getBranches()
      if (response.success) {
        setBranches(response.data || [])
      }
    } catch (error) {
      console.error('Error fetching branches:', error)
      // Fallback to direct Supabase call
      try {
        const { data, error } = await supabase
          .from('branches')
          .select('*')
          .order('name')

        if (error) throw error
        setBranches(data || [])
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError)
        setError('ไม่สามารถโหลดข้อมูลสาขาได้')
      }
    }
  }, [])

  const fetchDashboardData = useCallback(async () => {
    try {
      setError('')
      // Try to use backend API first
      const response = await apiClient.getDashboardData()
      if (response.success) {
        const { totalProducts, inProduction, completed, cancelled, statusDistribution, branchStats, recentActivity } = response.data
        
        // Filter by selected branch if needed
        let filteredStats = { 
          totalProducts, 
          inProduction, 
          completed, 
          cancelled,
          statusDistribution,
          branchStats,
          recentActivity 
        }
        
        if (selectedBranch) {
          // Filter recent activity by branch
          const filteredActivity = recentActivity.filter(activity => 
            activity.products?.branches?.id === selectedBranch
          )
          filteredStats.recentActivity = filteredActivity.slice(0, 10)
          
          // Filter branch stats to show only selected branch
          const selectedBranchStats = branchStats.find(branch => branch.branchId === selectedBranch)
          if (selectedBranchStats) {
            filteredStats.totalProducts = selectedBranchStats.total
            filteredStats.inProduction = selectedBranchStats.inProduction
            filteredStats.completed = selectedBranchStats.completed
            filteredStats.cancelled = selectedBranchStats.cancelled
          }
        }
        
        setStats(filteredStats)
        setIsLoading(false)
        return
      }
    } catch (error) {
      console.error('Error fetching dashboard data from API:', error)
    }

    // Fallback to direct Supabase calls
    try {
      // Build query with branch filter
      let productsQuery = supabase
        .from('products')
        .select(`
          id, 
          status, 
          branch_id,
          branches (
            name
          )
        `)

      if (selectedBranch) {
        productsQuery = productsQuery.eq('branch_id', selectedBranch)
      }

      const { data: products, error: productsError } = await productsQuery

      if (productsError) throw productsError

      const totalProducts = products?.length || 0
      const inProduction = products?.filter(p => p.status === 'in_production').length || 0
      const completed = products?.filter(p => p.status === 'completed').length || 0
      const cancelled = products?.filter(p => p.status === 'cancelled').length || 0

      // Fetch recent activity with branch filter
      let activityQuery = supabase
        .from('production_stages')
        .select(`
          id,
          stage_name,
          recorded_at,
          products (
            id,
            batch_number,
            branches (
              name
            )
          )
        `)
        .order('recorded_at', { ascending: false })
        .limit(15)

      const { data: recentActivity, error: activityError } = await activityQuery

      if (activityError) throw activityError

      // Filter recent activity by branch if selected
      let filteredActivity = recentActivity || []
      if (selectedBranch) {
        filteredActivity = filteredActivity.filter(activity => 
          activity.products?.branches?.some(branch => branch.id === selectedBranch)
        )
      }

      setStats({
        totalProducts,
        inProduction,
        completed,
        cancelled,
        statusDistribution: {},
        branchStats: [],
        recentActivity: filteredActivity.slice(0, 10)
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setError('ไม่สามารถโหลดข้อมูลแดชบอร์ดได้')
    } finally {
      setIsLoading(false)
    }
  }, [selectedBranch])

  const fetchProducts = useCallback(async () => {
    try {
      const response = await apiClient.getProducts()
      if (response.success) {
        setProducts(response.data || [])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      // Fallback to direct Supabase call
      try {
        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            branches (
              id,
              name,
              location
            )
          `)
          .order('created_at', { ascending: false })

        if (error) throw error
        setProducts(data || [])
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError)
      }
    }
  }, [])

  const printQRCodesPDF = async () => {
    if (products.length === 0) {
      alert('ไม่มีผลิตภัณฑ์ให้พิมพ์')
      return
    }

    try {
      // Create a temporary container for QR codes
      const tempContainer = document.createElement('div')
      tempContainer.style.position = 'absolute'
      tempContainer.style.left = '-9999px'
      tempContainer.style.top = '-9999px'
      tempContainer.style.width = '800px'
      tempContainer.style.padding = '20px'
      tempContainer.style.backgroundColor = 'white'
      
      // Filter products by selected branch if any
      const filteredProducts = selectedBranch 
        ? products.filter(p => p.branch_id === selectedBranch)
        : products

      // Create QR codes grid
      tempContainer.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="font-size: 24px; font-weight: bold; color: #1f2937; margin-bottom: 10px;">
            QR Codes - ระบบติดตามผำอินทรีย์
          </h1>
          <p style="color: #6b7280; font-size: 14px;">
            ${selectedBranch ? branches.find(b => b.id === selectedBranch)?.name || 'สาขาที่เลือก' : 'ทุกสาขา'}
          </p>
        </div>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
          ${filteredProducts.slice(0, 12).map(product => `
            <div style="text-align: center; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px;">
              <div id="qr-${product.id}" style="margin-bottom: 10px;"></div>
              <p style="font-size: 12px; font-weight: bold; color: #1f2937; margin-bottom: 5px;">
                ${product.batch_number}
              </p>
              <p style="font-size: 10px; color: #6b7280;">
                ${product.branches?.name || 'ไม่ระบุสาขา'}
              </p>
            </div>
          `).join('')}
        </div>
      `

      document.body.appendChild(tempContainer)

      // Generate QR codes
      filteredProducts.slice(0, 12).forEach(product => {
        const qrContainer = tempContainer.querySelector(`#qr-${product.id}`)
        if (qrContainer) {
          const qrCode = document.createElement('div')
          qrCode.innerHTML = `<svg width="120" height="120"></svg>`
          qrContainer.appendChild(qrCode)
          
          // Use react-qr-code to generate QR
          const qrValue = `${window.location.origin}/product/${product.id}`
          // Create a simple QR placeholder for PDF generation
          qrContainer.innerHTML = `
            <div style="width: 120px; height: 120px; border: 2px solid #000; display: flex; align-items: center; justify-content: center; margin: 0 auto;">
              <span style="font-size: 10px; text-align: center; word-break: break-all; padding: 5px;">
                ${qrValue}
              </span>
            </div>
          `
        }
      })

      // Generate PDF
      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      })

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const imgWidth = 210 // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      const imgData = canvas.toDataURL('image/png')

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)

      // Save PDF
      const branchName = selectedBranch 
        ? branches.find(b => b.id === selectedBranch)?.name || 'สาขาที่เลือก'
        : 'ทุกสาขา'
      pdf.save(`QR-Codes-${branchName}-${new Date().toISOString().split('T')[0]}.pdf`)

      // Clean up
      document.body.removeChild(tempContainer)
      
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('เกิดข้อผิดพลาดในการสร้าง PDF')
    }
  }

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true)
      await fetchBranches()
      await fetchProducts()
      await fetchDashboardData()
    }
    loadInitialData()
  }, [fetchBranches, fetchProducts, fetchDashboardData])

  const statCards = useMemo(() => [
    {
      title: 'ผลิตภัณฑ์ทั้งหมด',
      value: stats.totalProducts,
      icon: 'ri-product-hunt-line',
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      percentage: 100
    },
    {
      title: 'กำลังผลิต',
      value: stats.inProduction,
      icon: 'ri-settings-3-line',
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      percentage: stats.totalProducts > 0 ? Math.round((stats.inProduction / stats.totalProducts) * 100) : 0
    },
    {
      title: 'เสร็จสิ้น',
      value: stats.completed,
      icon: 'ri-checkbox-circle-line',
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
      percentage: stats.totalProducts > 0 ? Math.round((stats.completed / stats.totalProducts) * 100) : 0
    },
    {
      title: 'ยกเลิก',
      value: stats.cancelled,
      icon: 'ri-close-circle-line',
      color: 'bg-red-500',
      textColor: 'text-red-600',
      bgColor: 'bg-red-50',
      percentage: stats.totalProducts > 0 ? Math.round((stats.cancelled / stats.totalProducts) * 100) : 0
    }
  ], [stats.totalProducts, stats.inProduction, stats.completed, stats.cancelled])

  if (isLoading) {
    return (
      <div className="px-0">
        <LoadingSpinner message="กำลังโหลดข้อมูลแดชบอร์ด..." size="large" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-0">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <i className="ri-error-warning-line text-4xl text-red-500 mb-4"></i>
          <h2 className="text-xl font-semibold text-red-800 mb-2">เกิดข้อผิดพลาด</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setError('')
              setIsLoading(true)
              fetchBranches()
              fetchDashboardData()
            }}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <i className="ri-refresh-line mr-2"></i>
            ลองใหม่
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="px-0">
      {/* Welcome Section */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              ยินดีต้อนรับสู่ระบบติดตามผำอินทรีย์
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              ติดตามการผลิตผำอินทรีย์จากฟาร์มสู่ผลิตภัณฑ์สำเร็จรูป
            </p>
          </div>
          
          {/* Branch Selection */}
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">เลือกสาขา:</label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
            >
              <option value="">ทุกสาขา</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {statCards.map((stat, index) => (
          <div key={index} className={`${stat.bgColor} rounded-lg shadow-md p-4 sm:p-6 border-l-4 ${stat.color.replace('bg-', 'border-')}`}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                <p className={`text-2xl sm:text-3xl font-bold ${stat.textColor} mb-2`}>
                  {stat.value}
                </p>
                {stat.percentage !== 100 && (
                  <div className="flex items-center">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                      <div 
                        className={`${stat.color} h-2 rounded-full transition-all duration-300`}
                        style={{ width: `${stat.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-medium text-gray-500">{stat.percentage}%</span>
                  </div>
                )}
              </div>
              <div className={`${stat.color} rounded-lg p-3 ml-3 flex-shrink-0`}>
                <i className={`${stat.icon} text-white text-xl`}></i>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Branch Statistics Overview */}
      {!selectedBranch && stats.branchStats && stats.branchStats.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 sm:mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            <i className="ri-building-line mr-2 text-purple-600"></i>
            ภาพรวมตามสาขา
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stats.branchStats.map((branch) => (
              <div key={branch.branchId} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-gray-900">{branch.branchName}</h4>
                    <p className="text-sm text-gray-600">{branch.branchLocation}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">{branch.total}</p>
                    <p className="text-xs text-gray-500">ผลิตภัณฑ์</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                      <span className="text-sm text-gray-700">กำลังผลิต</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900 mr-2">{branch.inProduction}</span>
                      <span className="text-xs text-gray-500">
                        ({branch.total > 0 ? Math.round((branch.inProduction / branch.total) * 100) : 0}%)
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm text-gray-700">เสร็จสิ้น</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900 mr-2">{branch.completed}</span>
                      <span className="text-xs text-gray-500">
                        ({branch.total > 0 ? Math.round((branch.completed / branch.total) * 100) : 0}%)
                      </span>
                    </div>
                  </div>
                  
                  {branch.cancelled > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                        <span className="text-sm text-gray-700">ยกเลิก</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900 mr-2">{branch.cancelled}</span>
                        <span className="text-xs text-gray-500">
                          ({branch.total > 0 ? Math.round((branch.cancelled / branch.total) * 100) : 0}%)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Progress bars */}
                <div className="mt-4 space-y-2">
                  {branch.inProduction > 0 && (
                    <div className="flex items-center">
                      <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-yellow-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${branch.total > 0 ? (branch.inProduction / branch.total) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  {branch.completed > 0 && (
                    <div className="flex items-center">
                      <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${branch.total > 0 ? (branch.completed / branch.total) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
            <i className="ri-add-circle-line mr-2 text-amber-600"></i>
            การดำเนินการด่วน
          </h3>
          <div className="space-y-3">
            <Link
              to="/roadmap"
              className="flex items-center p-3 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
            >
              <i className="ri-route-line text-amber-600 mr-3 flex-shrink-0"></i>
              <span className="font-medium text-gray-900 text-sm sm:text-base">เริ่มการผลิตใหม่</span>
            </Link>
            <Link
              to="/scanner"
              className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <i className="ri-qr-scan-line text-blue-600 mr-3 flex-shrink-0"></i>
              <span className="font-medium text-gray-900 text-sm sm:text-base">สแกน QR Code</span>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
            <i className="ri-time-line mr-2 text-green-600"></i>
            กิจกรรมล่าสุด
          </h3>
          <div className={`space-y-2 sm:space-y-3 ${stats.recentActivity.length > 4 ? 'max-h-64 sm:max-h-80 overflow-y-auto pr-2' : ''}`}>
            {stats.recentActivity.length > 0 ? (
              stats.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start sm:items-center p-2 sm:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <i className="ri-record-circle-line text-green-500 mr-2 sm:mr-3 flex-shrink-0 mt-1 sm:mt-0"></i>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                      {activity.stage_name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      ชุดผลิต: {activity.products?.batch_number || 'ไม่ระบุ'}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      สาขา: {activity.products?.branches?.name || 'ไม่ระบุ'}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                    {new Date(activity.recorded_at).toLocaleDateString('th-TH')}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">ไม่มีกิจกรรมล่าสุด</p>
            )}
          </div>
        </div>
      </div>

      {/* Production Flow Overview */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          <i className="ri-flow-chart mr-2 text-purple-600"></i>
          ภาพรวมกระบวนการผลิต
        </h3>
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-6">
          <div className="flex items-center text-center">
            <div className="bg-green-100 rounded-full p-4 mb-2">
              <i className="ri-seedling-line text-2xl text-green-600"></i>
            </div>
            <div className="text-start ml-1">
              <h4 className="font-semibold text-gray-900">ต้นน้ำ</h4>
              <p className="text-sm text-gray-600">ฟาร์มและการเก็บเกี่ยว</p>
            </div>
          </div>
          
          <div className="hidden md:block">
            <i className="ri-arrow-right-line text-gray-400 text-xl"></i>
          </div>
          
          <div className="flex items-center text-center">
            <div className="bg-yellow-100 rounded-full p-4 mb-2">
              <i className="ri-settings-3-line text-2xl text-yellow-600"></i>
            </div>
            <div className="text-start ml-1">
              <h4 className="font-semibold text-gray-900">กลางน้ำ</h4>
              <p className="text-sm text-gray-600">การแปรรูป</p>
            </div>
          </div>
          
          <div className="hidden md:block">
            <i className="ri-arrow-right-line text-gray-400 text-xl"></i>
          </div>
          
          <div className="flex items-center text-center">
            <div className="bg-blue-100 rounded-full p-4 mb-2">
              <i className="ri-shopping-bag-line text-2xl text-blue-600"></i>
            </div>
            <div className="text-start ml-1">
              <h4 className="font-semibold text-gray-900">ปลายน้ำ</h4>
              <p className="text-sm text-gray-600">บรรจุภัณฑ์และจัดจำหน่าย</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
