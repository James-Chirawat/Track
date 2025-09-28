import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { apiClient } from '../lib/api'
import QRCode from 'react-qr-code'

const ProductDetails = () => {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [productionStages, setProductionStages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showQR, setShowQR] = useState(false)

  useEffect(() => {
    if (id) {
      fetchProductDetails()
    }
  }, [id])

  const fetchProductDetails = async () => {
    try {
      setLoading(true)
      setError('')

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      )

      // Try backend API first with timeout
      try {
        const apiPromise = apiClient.getProduct(id)
        const response = await Promise.race([apiPromise, timeoutPromise])
        
        if (response && response.success) {
          setProduct(response.data.product)
          setProductionStages(response.data.stages || [])
          setLoading(false)
          return
        }
      } catch (err) {
        console.error('Error fetching product details via API:', err)
      }

      // Fallback to direct Supabase calls
      console.log('Falling back to Supabase direct calls...')
      
      // Fetch product details
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select(`
          *,
          branches (
            id,
            name,
            location,
            manager_name
          )
        `)
        .eq('id', id)
        .single()

      if (productError) {
        if (productError.code === 'PGRST116') {
          setError('ไม่พบผลิตภัณฑ์')
        } else {
          throw productError
        }
        return
      }

      setProduct(productData)

      // Fetch production stages
      const { data: stagesData, error: stagesError } = await supabase
        .from('production_stages')
        .select('*')
        .eq('product_id', id)
        .order('recorded_at', { ascending: true })

      if (stagesError) throw stagesError

      setProductionStages(stagesData || [])
    } catch (err) {
      console.error('Error fetching product details:', err)
      setError('ไม่สามารถโหลดข้อมูลผลิตภัณฑ์ได้: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const getStageName = (stageId, stageName) => {
    const stageNames = {
      planting: 'การปลูก',
      growing: 'การดูแลและเลี้ยง',
      harvesting: 'การเก็บเกี่ยว',
      fermentation: 'การหมัก',
      drying: 'การอบแห้ง',
      roasting: 'การคั่ว',
      grinding: 'การบดและแปรรูป',
      packaging: 'การบรรจุ',
      distribution: 'การจัดจำหน่าย'
    }
    return stageNames[stageId] || stageName
  }

  const getStageColors = (stageId) => {
    if (['planting', 'growing', 'harvesting'].includes(stageId)) {
      return {
        bg: 'bg-green-50',
        border: 'border-l-green-500',
        title: 'text-green-800',
        subtitle: 'text-green-600',
        icon: 'text-green-500'
      }
    } else if (['fermentation', 'drying', 'roasting'].includes(stageId)) {
      return {
        bg: 'bg-yellow-50',
        border: 'border-l-yellow-500',
        title: 'text-yellow-800',
        subtitle: 'text-yellow-600',
        icon: 'text-yellow-500'
      }
    } else if (['grinding', 'packaging', 'distribution'].includes(stageId)) {
      return {
        bg: 'bg-blue-50',
        border: 'border-l-blue-500',
        title: 'text-blue-800',
        subtitle: 'text-blue-600',
        icon: 'text-blue-500'
      }
    }
    return {
      bg: 'bg-gray-50',
      border: 'border-l-gray-500',
      title: 'text-gray-800',
      subtitle: 'text-gray-600',
      icon: 'text-gray-500'
    }
  }

  const formatStageData = (data) => {
    const fieldLabels = {
      // Planting fields
      farm_location: 'ที่ตั้งฟาร์ม',
      planting_date: 'วันที่ปลูก',
      seed_variety: 'พันธุ์ผำอินทรีย์',
      farmer_name: 'ชื่อเกษตรกร',
      farm_size: 'ขนาดฟาร์ม (เฮกตาร์)',
      
      // Growing fields
      fertilizer_used: 'ปุ่ยที่ใช้',
      pest_control: 'วิธีกำจัดศัตรูพืช',
      irrigation_method: 'วิธีการให้น้ำ',
      care_notes: 'หมายเหตุการดูแล',
      
      // Harvesting fields
      harvest_date: 'วันที่เก็บเกี่ยว',
      harvest_quantity: 'ปริมาณที่เก็บได้ (กิโลกรัม)',
      quality_grade: 'เกรดคุณภาพ',
      harvest_notes: 'หมายเหตุการเก็บเกี่ยว',
      
      // Fermentation fields
      fermentation_start: 'วันที่เริ่มหมัก',
      fermentation_duration: 'ระยะเวลา (วัน)',
      temperature: 'อุณหภูมิ (°C)',
      humidity: 'ความชื้น (%)',
      fermentation_notes: 'หมายเหตุการหมัก',
      
      // Drying fields
      drying_start: 'วันที่เริ่มอบแห้ง',
      drying_method: 'วิธีการอบแห้ง',
      drying_duration: 'ระยะเวลา (วัน)',
      final_moisture: 'ความชื้นสุดท้าย (%)',
      drying_notes: 'หมายเหตุการอบแห้ง',
      
      // Roasting fields
      roasting_date: 'วันที่คั่ว',
      roasting_temperature: 'อุณหภูมิ (°C)',
      roasting_duration: 'ระยะเวลา (นาที)',
      roast_level: 'ระดับการคั่ว',
      roasting_notes: 'หมายเหตุการคั่ว',
      
      // Grinding fields
      grinding_date: 'วันที่บด',
      grind_size: 'ขนาดการบด',
      processing_method: 'วิธีการแปรรูป',
      yield_percentage: 'เปอร์เซ็นต์ผลผลิต (%)',
      
      // Packaging fields
      packaging_date: 'วันที่บรรจุ',
      package_type: 'ประเภทบรรจุภัณฑ์',
      package_size: 'ขนาดบรรจุภัณฑ์',
      batch_number: 'หมายเลขชุดผลิต',
      expiry_date: 'วันหมดอายุ',
      
      // Distribution fields
      distribution_date: 'วันที่จัดจำหน่าย',
      distributor_name: 'ชื่อผู้จัดจำหน่าย',
      destination: 'จุดหมายปลายทาง',
      transport_method: 'วิธีการขนส่ง',
      tracking_number: 'หมายเลขติดตาม'
    }

    return Object.entries(data).map(([key, value]) => {
      const label = fieldLabels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      return { label, value }
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
        <header className="bg-white shadow-sm border-b border-amber-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <div className="flex-shrink-0 flex items-center">
                  <i className="ri-seedling-line text-xl sm:text-2xl text-amber-600 mr-2"></i>
                  <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">ระบบติดตามข้อมูลผำอินทรีย์</h1>
                </div>
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center min-h-64">
            <div className="text-center">
              <i className="ri-loader-4-line text-4xl text-amber-600 animate-spin mb-4"></i>
              <p className="text-gray-600">กำลังโหลดข้อมูลผลิตภัณฑ์...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
        <header className="bg-white shadow-sm border-b border-amber-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <div className="flex-shrink-0 flex items-center">
                  <i className="ri-seedling-line text-xl sm:text-2xl text-amber-600 mr-2"></i>
                  <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">ระบบติดตามข้อมูลผำอินทรีย์</h1>
                </div>
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <i className="ri-error-warning-line text-4xl text-red-500 mb-4"></i>
            <h2 className="text-xl font-semibold text-red-800 mb-2">เกิดข้อผิดพลาด</h2>
            <p className="text-red-600">{error}</p>
            <button 
              onClick={fetchProductDetails}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <i className="ri-refresh-line mr-2"></i>
              ลองใหม่
            </button>
          </div>
        </main>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
        <header className="bg-white shadow-sm border-b border-amber-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <div className="flex-shrink-0 flex items-center">
                  <i className="ri-seedling-line text-xl sm:text-2xl text-amber-600 mr-2"></i>
                  <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">ระบบติดตามข้อมูลผำอินทรีย์</h1>
                </div>
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <i className="ri-file-search-line text-4xl text-gray-400 mb-4"></i>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">ไม่พบผลิตภัณฑ์</h2>
            <p className="text-gray-600">ไม่สามารถค้นหาผลิตภัณฑ์ที่ร้องขอได้</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-amber-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <i className="ri-seedling-line text-xl sm:text-2xl text-amber-600 mr-2"></i>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">ระบบติดตามข้อมูลผำอินทรีย์</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        {/* Product Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="mb-4 md:mb-0">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              <i className="ri-seedling-line mr-2 text-amber-600"></i>
              {product.batch_number}
            </h1>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <span>
                <i className="ri-calendar-line mr-1"></i>
                สร้างเมื่อ: {new Date(product.created_at).toLocaleDateString('th-TH')}
              </span>
              <span>
                <i className="ri-building-line mr-1"></i>
                สาขา: {product.branches?.name || 'ไม่ระบุ'}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                product.status === 'completed' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                <i className="ri-flag-line mr-1"></i>
                {product.status === 'completed' ? 'เสร็จสิ้น' : 'กำลังผลิต'}
              </span>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowQR(!showQR)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <i className="ri-qr-code-line mr-2"></i>
              {showQR ? 'ซ่อน QR' : 'แสดง QR'}
            </button>
            <button
              onClick={() => window.print()}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <i className="ri-printer-line mr-2"></i>
              พิมพ์
            </button>
          </div>
        </div>

        {/* QR Code */}
        {showQR && (
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
              <QRCode
                value={`${window.location.origin}/product/${product.id}`}
                size={150}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              QR Code ผลิตภัณฑ์ - แชร์เพื่อติดตามผลิตภัณฑ์
            </p>
          </div>
        )}
      </div>

      {/* Production Timeline */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          <i className="ri-timeline-view mr-2 text-purple-600"></i>
          ไทม์ไลน์การผลิต
        </h2>

        {productionStages.length === 0 ? (
          <div className="text-center py-8">
            <i className="ri-file-list-line text-4xl text-gray-400 mb-4"></i>
            <p className="text-gray-600">ยังไม่มีการบันทึกขั้นตอนการผลิต</p>
          </div>
        ) : (
          <div className="space-y-6">
            {productionStages.map((stage, index) => {
              const colors = getStageColors(stage.stage_id)
              return (
                <div key={stage.id}>
                  <div className={`${colors.bg} ${colors.border} border-l-4 rounded-lg p-6 shadow-sm`}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className={`text-xl font-bold ${colors.title}`}>
                        {getStageName(stage.stage_id, stage.stage_name)}
                      </h3>
                      <span className={`text-sm font-medium ${colors.subtitle}`}>
                        <i className={`ri-time-line mr-1 ${colors.icon}`}></i>
                        {new Date(stage.recorded_at).toLocaleString('th-TH')}
                      </span>
                    </div>
                    
                    {/* Stage Data */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {formatStageData(stage.stage_data).map((item, idx) => (
                        <div key={idx} className="bg-white rounded-lg p-4 shadow-sm border border-white/50">
                          <dt className={`text-sm font-semibold ${colors.subtitle} mb-1`}>
                            {item.label}
                          </dt>
                          <dd className="text-sm text-gray-800 font-medium">
                            {item.value || 'ไม่ระบุ'}
                          </dd>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Production Summary */}
      <div className="bg-white rounded-lg shadow-md p-6 mt-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          <i className="ri-bar-chart-line mr-2 text-indigo-600"></i>
          สรุปการผลิต
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <i className="ri-seedling-line text-3xl text-green-600 mb-2"></i>
            <h3 className="font-semibold text-gray-900">ต้นน้ำ</h3>
            <p className="text-sm text-gray-600">
              {productionStages.filter(s => ['planting', 'growing', 'harvesting'].includes(s.stage_id)).length} ขั้นตอน
            </p>
          </div>
          
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <i className="ri-settings-3-line text-3xl text-yellow-600 mb-2"></i>
            <h3 className="font-semibold text-gray-900">กลางน้ำ</h3>
            <p className="text-sm text-gray-600">
              {productionStages.filter(s => ['fermentation', 'drying', 'roasting'].includes(s.stage_id)).length} ขั้นตอน
            </p>
          </div>
          
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <i className="ri-shopping-bag-line text-3xl text-blue-600 mb-2"></i>
            <h3 className="font-semibold text-gray-900">ปลายน้ำ</h3>
            <p className="text-sm text-gray-600">
              {productionStages.filter(s => ['grinding', 'packaging', 'distribution'].includes(s.stage_id)).length} ขั้นตอน
            </p>
          </div>
        </div>
      </div>
      </main>
    </div>
  )
}

export default ProductDetails
