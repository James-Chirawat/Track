import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { apiClient } from '../lib/api'
import { v4 as uuidv4 } from 'uuid'
import QRCode from 'react-qr-code'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

// Enterprise names list (same as DailyRecord.jsx)
const ENTERPRISE_NAMES = [
  'วิสาหกิจชุมชนรักษ์ดินทอง',
  'วิสาหกิจชุมชนสวนไผ่พลังงานพัฒนาตำบลชัยนาม',
  'วิสาหกิจชุมชนเศรษฐกิจพอเพียงแบบยั่งยืนอำเภอวังทอง',
  'วิสาหกิจชุมชนบ้านเนินสะอาดไร่นาสวนผสม',
  'วิสาหกิจชุมชนธิดาผักปลอดภัย',
  'วิสาหกิจชุมชนเกษตรอินทรีย์ N-DO Fulltime',
  'วิสาหกิจชุมชน Society farm',
  'วิสาหกิจชุมชนดองได้ดองดี',
  'วิสาหกิจชุมชนไร่ฟุ้งเฟื่องเมืองบางขลัง',
  'วิสาหกิจชุมชนพืชสมุนไพรนครบางขลัง',
  'วิสาหกิจชุมชนผักปลอดภัยจากสารพิษตำบลเกาะตาเลี้ยง',
  'วิสาหกิจชุมชนบ้านแจ่มจ้า เมืองบางขลัง',
  'วิสาหกิจบ้านสวนคุณทองเพียร',
  'วิสาหกิจชุมชนปลูกและแปรรูปสมุนไพรทับยายเชียง',
  'วิสาหกิจชุมชนเกษตรสุขใจ (แทนศูนย์เรียนรู้ดินและปุ๋ยชุมชนตำบลบ้านกร่าง)'
]

const ProductionRoadmap = () => {
  const [currentProduct, setCurrentProduct] = useState(null)
  const [selectedStage, setSelectedStage] = useState(null)
  const [formData, setFormData] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [branches, setBranches] = useState([])
  const [selectedBranch, setSelectedBranch] = useState('')
  const [completedStages, setCompletedStages] = useState([])
  const [existingProducts, setExistingProducts] = useState([])
  const [showProductSelection, setShowProductSelection] = useState(true)
  const [stageData, setStageData] = useState({})
  const qrRef = useRef(null)

  const productionStages = [
    {
      id: 'upstream',
      name: 'ต้นน้ำ - ฟาร์มและการเก็บเกี่ยว',
      icon: 'ri-seedling-line',
      color: 'bg-green-500',
      borderColor: 'border-green-500',
      bgColor: 'bg-green-50',
      stages: [
        {
          id: 'planting',
          name: 'การปลูก',
          icon: 'ri-plant-line',
          fields: [
            { name: 'farm_location', label: 'ที่ตั้งฟาร์ม', type: 'text', required: true },
            { name: 'planting_date', label: 'วันที่ปลูก', type: 'date', required: true },
            { name: 'seed_variety', label: 'พันธุ์ผำอินทรีย์', type: 'text', required: true },
            { name: 'farmer_name', label: 'ชื่อเกษตรกร', type: 'text', required: true },
            { name: 'farm_size', label: 'ขนาดฟาร์ม (เฮกตาร์)', type: 'number', required: true }
          ]
        },
        {
          id: 'growing',
          name: 'การดูแลและเลี้ยง',
          icon: 'ri-leaf-line',
          fields: [
            { name: 'fertilizer_used', label: 'ปุ่ยที่ใช้', type: 'text' },
            { name: 'pest_control', label: 'วิธีกำจัดศัตรูพืช', type: 'text' },
            { name: 'irrigation_method', label: 'วิธีการให้น้ำ', type: 'text' },
            { name: 'care_notes', label: 'หมายเหตุการดูแล', type: 'textarea' }
          ]
        },
        {
          id: 'harvesting',
          name: 'การเก็บเกี่ยว',
          icon: 'ri-scissors-line',
          fields: [
            { name: 'harvest_date', label: 'วันที่เก็บเกี่ยว', type: 'date', required: true },
            { name: 'harvest_quantity', label: 'ปริมาณที่เก็บได้ (กิโลกรัม)', type: 'number', required: true },
            { name: 'quality_grade', label: 'เกรดคุณภาพ', type: 'select', options: ['พรีเมี่ยม', 'เกรด A', 'เกรด B', 'มาตรฐาน'], required: true },
            { name: 'harvest_notes', label: 'หมายเหตุการเก็บเกี่ยว', type: 'textarea' }
          ]
        }
      ]
    },
    {
      id: 'midstream',
      name: 'กลางน้ำ - การแปรรูป',
      icon: 'ri-settings-3-line',
      color: 'bg-yellow-500',
      borderColor: 'border-yellow-500',
      bgColor: 'bg-yellow-50',
      stages: [
        {
          id: 'fresh_packaging',
          name: 'บรรจุแบบสด',
          icon: 'ri-package-line',
          fields: [
            { name: 'packaging_date', label: 'วันที่บรรจุ', type: 'date', required: true },
            { name: 'packaging_weight', label: 'น้ำหนักบรรจุ (กก.)', type: 'number', required: true },
            { name: 'packaging_type', label: 'ประเภทบรรจุภัณฑ์', type: 'select', options: ['ถุงพลาสติก', 'กล่องโฟม', 'ถาดพลาสติก', 'อื่นๆ'], required: true },
            { name: 'storage_temp', label: 'อุณหภูมิเก็บรักษา (°C)', type: 'number' },
            { name: 'fresh_packaging_notes', label: 'หมายเหตุการบรรจุ', type: 'textarea' }
          ]
        },
        {
          id: 'drying',
          name: 'การอบแห้ง',
          icon: 'ri-sun-line',
          fields: [
            { name: 'drying_start', label: 'วันที่เริ่มอบแห้ง', type: 'date', required: true },
            { name: 'drying_method', label: 'วิธีการอบแห้ง', type: 'select', options: ['ตากแดด', 'อบแห้งด้วยเครื่อง', 'วิธีผสม'], required: true },
            { name: 'drying_duration', label: 'ระยะเวลา (วัน)', type: 'number', required: true },
            { name: 'final_moisture', label: 'ความชื้นสุดท้าย (%)', type: 'number' },
            { name: 'drying_notes', label: 'หมายเหตุการอบแห้ง', type: 'textarea' }
          ]
        }
      ]
    },
    {
      id: 'downstream',
      name: 'ปลายน้ำ - บรรจุภัณฑ์และจัดจำหน่าย',
      icon: 'ri-shopping-bag-line',
      color: 'bg-blue-500',
      borderColor: 'border-blue-500',
      bgColor: 'bg-blue-50',
      stages: [
        {
          id: 'b2b',
          name: 'B2B',
          icon: 'ri-building-2-line',
          fields: [
            { name: 'distribution_date', label: 'วันที่จัดจำหน่าย', type: 'date', required: true },
            { name: 'destination', label: 'จุดหมายปลายทาง', type: 'text', required: true },
            { name: 'buyer_name', label: 'ชื่อผู้รับซื้อ', type: 'text', required: true },
            { name: 'distributor_name', label: 'ชื่อผู้จำหน่าย', type: 'text', required: true },
            { name: 'enterprise_name', label: 'ชื่อวิสาหกิจ', type: 'select', options: ENTERPRISE_NAMES, required: true },
            { name: 'shipping_cost', label: 'ค่าขนส่ง (บาท)', type: 'number', required: true },
            { name: 'quantity', label: 'จำนวน (กก.)', type: 'number', required: true },
            { name: 'total_price', label: 'ราคารวม (บาท)', type: 'number', required: true },
            { name: 'notes', label: 'หมายเหตุ', type: 'textarea' }
          ]
        },
        {
          id: 'b2c',
          name: 'B2C',
          icon: 'ri-user-line',
          fields: [
            { name: 'distribution_date', label: 'วันที่จัดจำหน่าย', type: 'date', required: true },
            { name: 'destination', label: 'จุดหมายปลายทาง', type: 'text', required: true },
            { name: 'buyer_name', label: 'ชื่อผู้รับซื้อ', type: 'text', required: true },
            { name: 'distributor_name', label: 'ชื่อผู้จำหน่าย', type: 'text', required: true },
            { name: 'enterprise_name', label: 'ชื่อวิสาหกิจ', type: 'select', options: ENTERPRISE_NAMES, required: true },
            { name: 'shipping_cost', label: 'ค่าขนส่ง (บาท)', type: 'number', required: true },
            { name: 'quantity', label: 'จำนวน (กก.)', type: 'number', required: true },
            { name: 'total_price', label: 'ราคารวม (บาท)', type: 'number', required: true },
            { name: 'notes', label: 'หมายเหตุ', type: 'textarea' }
          ]
        },
        {
          id: 'network_trade',
          name: 'ซื้อขายในเครือข่าย',
          icon: 'ri-links-line',
          fields: [
            { name: 'distribution_date', label: 'วันที่จัดจำหน่าย', type: 'date', required: true },
            { name: 'destination', label: 'จุดหมายปลายทาง', type: 'text', required: true },
            { name: 'buyer_name', label: 'ชื่อผู้รับซื้อ', type: 'text', required: true },
            { name: 'distributor_name', label: 'ชื่อผู้จำหน่าย', type: 'text', required: true },
            { name: 'enterprise_name', label: 'ชื่อวิสาหกิจ', type: 'select', options: ENTERPRISE_NAMES, required: true },
            { name: 'shipping_cost', label: 'ค่าขนส่ง (บาท)', type: 'number', required: true },
            { name: 'quantity', label: 'จำนวน (กก.)', type: 'number', required: true },
            { name: 'total_price', label: 'ราคารวม (บาท)', type: 'number', required: true },
            { name: 'notes', label: 'หมายเหตุ', type: 'textarea' }
          ]
        }
      ]
    }
  ]

  useEffect(() => {
    fetchBranches()
  }, [])

  useEffect(() => {
    if (selectedBranch) {
      fetchExistingProducts()
    }
  }, [selectedBranch])

  useEffect(() => {
    if (currentProduct) {
      fetchCompletedStages()
      fetchAllStageData()
    }
  }, [currentProduct])

  const fetchBranches = async () => {
    try {
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
      }
    }
  }

  const fetchExistingProducts = async () => {
    if (!selectedBranch) return

    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          branches (
            name,
            location
          )
        `)
        .eq('branch_id', selectedBranch)
        .order('created_at', { ascending: false })

      if (error) throw error
      setExistingProducts(data || [])
    } catch (error) {
      console.error('Error fetching existing products:', error)
      setExistingProducts([])
    }
  }

  const fetchAllStageData = async () => {
    if (!currentProduct) return

    try {
      const { data, error } = await supabase
        .from('production_stages')
        .select('*')
        .eq('product_id', currentProduct.id)

      if (error) throw error
      
      // Convert array to object with stage_id as key
      const stageDataObj = {}
      data?.forEach(stage => {
        stageDataObj[stage.stage_id] = stage.stage_data
      })
      
      setStageData(stageDataObj)
    } catch (error) {
      console.error('Error fetching stage data:', error)
      setStageData({})
    }
  }

  const fetchCompletedStages = async () => {
    if (!currentProduct) return

    try {
      const { data, error } = await supabase
        .from('production_stages')
        .select('stage_id')
        .eq('product_id', currentProduct.id)

      if (error) throw error
      setCompletedStages(data?.map(stage => stage.stage_id) || [])
    } catch (error) {
      console.error('Error fetching completed stages:', error)
    }
  }

  const selectExistingProduct = (product) => {
    setCurrentProduct(product)
    setShowProductSelection(false)
  }

  const startNewProduct = async () => {
    if (!selectedBranch) {
      alert('กรุณาเลือกวิสาหกิจก่อนเริ่มการผลิต')
      return
    }

    const productId = uuidv4()
    const batchNumber = `COC-${Date.now()}`
    
    try {
      // Try backend API first
      const response = await apiClient.createProduct({
        id: productId,
        batch_number: batchNumber,
        branch_id: selectedBranch,
        status: 'in_production',
        created_at: new Date().toISOString()
      })

      if (response.success) {
        setCurrentProduct(response.data)
        setCompletedStages([])
        setShowProductSelection(false)
        return
      }
    } catch (error) {
      console.error('Error creating product via API:', error)
    }

    // Fallback to direct Supabase call
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([
          {
            id: productId,
            batch_number: batchNumber,
            branch_id: selectedBranch,
            status: 'in_production',
            created_at: new Date().toISOString()
          }
        ])
        .select(`
          *,
          branches (
            name,
            location
          )
        `)
        .single()

      if (error) throw error

      setCurrentProduct(data)
      setCompletedStages([])
      setShowProductSelection(false)
    } catch (error) {
      console.error('Error creating product:', error)
      alert('เกิดข้อผิดพลาดในการสร้างผลิตภัณฑ์ใหม่')
    }
  }

  const backToProductSelection = () => {
    setCurrentProduct(null)
    setSelectedStage(null)
    setFormData({})
    setStageData({})
    setCompletedStages([])
    setShowProductSelection(true)
    setShowQR(false)
  }

  const handleStageClick = (stage) => {
    setSelectedStage(stage)
    // Load existing data if available
    const existingData = stageData[stage.id] || {}
    setFormData(existingData)
  }

  const handleInputChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }))
  }

  const saveStageData = async () => {
    if (!currentProduct || !selectedStage) return

    setIsLoading(true)
    try {
      const isExistingStage = completedStages.includes(selectedStage.id)
      
      if (isExistingStage) {
        // Update existing stage
        const { error } = await supabase
          .from('production_stages')
          .update({
            stage_data: formData,
            recorded_at: new Date().toISOString()
          })
          .eq('product_id', currentProduct.id)
          .eq('stage_id', selectedStage.id)

        if (error) throw error
        alert('อัพเดทข้อมูลขั้นตอนเรียบร้อยแล้ว!')
      } else {
        // Create new stage - try backend API first
        try {
          const response = await apiClient.createProductionStage({
            product_id: currentProduct.id,
            stage_id: selectedStage.id,
            stage_name: selectedStage.name,
            stage_data: formData,
            recorded_at: new Date().toISOString()
          })

          if (response.success) {
            alert('บันทึกข้อมูลขั้นตอนเรียบร้อยแล้ว!')
          } else {
            throw new Error('API call failed')
          }
        } catch (apiError) {
          console.error('Error saving stage data via API:', apiError)
          
          // Fallback to direct Supabase call
          const { error } = await supabase
            .from('production_stages')
            .insert([
              {
                product_id: currentProduct.id,
                stage_id: selectedStage.id,
                stage_name: selectedStage.name,
                stage_data: formData,
                recorded_at: new Date().toISOString()
              }
            ])

          if (error) throw error
          alert('บันทึกข้อมูลขั้นตอนเรียบร้อยแล้ว!')
        }
      }
      
      // If this is one of the downstream distribution stages, update product status to completed
      if (['b2b', 'b2c', 'network_trade'].includes(selectedStage.id)) {
        try {
          // Try backend API first
          const response = await apiClient.updateProduct(currentProduct.id, {
            status: 'completed'
          })

          if (response.success) {
            // Update local state
            setCurrentProduct(prev => ({ ...prev, status: 'completed' }))
            alert(`บันทึกข้อมูล ${selectedStage.name} เรียบร้อยแล้ว! สถานะผลิตภัณฑ์เปลี่ยนเป็น "เสร็จสิ้น"`)
          } else {
            throw new Error('API call failed')
          }
        } catch (apiError) {
          console.error('Error updating product status via API:', apiError)
          
          // Fallback to direct Supabase call
          const { error: updateError } = await supabase
            .from('products')
            .update({ status: 'completed' })
            .eq('id', currentProduct.id)

          if (updateError) throw updateError
          
          // Update local state
          setCurrentProduct(prev => ({ ...prev, status: 'completed' }))
          alert(`บันทึกข้อมูล ${selectedStage.name} เรียบร้อยแล้ว! สถานะผลิตภัณฑ์เปลี่ยนเป็น "เสร็จสิ้น"`)
        }
        
        setShowQR(true)
      }
      
      setSelectedStage(null)
      setFormData({})
      
      // Refresh data
      await fetchCompletedStages()
      await fetchAllStageData()
      
    } catch (error) {
      console.error('Error saving stage data:', error)
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล')
    } finally {
      setIsLoading(false)
    }
  }

  const renderField = (field) => {
    const value = formData[field.name] || ''
    
    switch (field.type) {
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            required={field.required}
          >
            <option value="">เลือก {field.label}</option>
            {field.options.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        )
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            rows={3}
            required={field.required}
          />
        )
      default:
        return (
          <input
            type={field.type}
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            required={field.required}
          />
        )
    }
  }

  const isStageCompleted = (stageId) => {
    return completedStages.includes(stageId)
  }

  const printQRCodePDF = async () => {
    if (!qrRef.current || !currentProduct) return

    try {
      // Create a temporary container for the QR code
      const tempContainer = document.createElement('div')
      tempContainer.style.position = 'absolute'
      tempContainer.style.left = '-9999px'
      tempContainer.style.background = 'white'
      tempContainer.style.padding = '40px'
      tempContainer.style.fontFamily = 'Arial, sans-serif'
      tempContainer.style.textAlign = 'center'
      tempContainer.style.width = '400px'
      
      tempContainer.innerHTML = `
        <div style="border: 3px solid #000; padding: 30px; background: white;">
          <div style="font-size: 24px; font-weight: bold; margin-bottom: 20px; color: #000;">
            ระบบติดตามผำอินทรีย์
          </div>
          <div id="temp-qr" style="margin: 30px 0; display: flex; justify-content: center;">
            <div style="background: white; padding: 10px;">
              ${qrRef.current.innerHTML}
            </div>
          </div>
          <div style="font-size: 16px; color: #000; line-height: 1.8;">
            <div><strong>ชุดผลิต:</strong> ${currentProduct.batch_number}</div>
            <div><strong>วิสาหกิจ:</strong> ${currentProduct.branches?.name || 'ไม่ระบุ'}</div>
            <div><strong>วันที่:</strong> ${new Date().toLocaleDateString('th-TH')}</div>
          </div>
        </div>
      `
      
      document.body.appendChild(tempContainer)

      // Convert to canvas
      const canvas = await html2canvas(tempContainer, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true
      })

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const imgData = canvas.toDataURL('image/png')
      const imgWidth = 150
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      const x = (210 - imgWidth) / 2 // Center horizontally on A4
      const y = (297 - imgHeight) / 2 // Center vertically on A4

      pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight)
      
      // Save PDF
      pdf.save(`QR-Code-${currentProduct.batch_number}.pdf`)

      // Clean up
      document.body.removeChild(tempContainer)
      
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('เกิดข้อผิดพลาดในการสร้าง PDF')
    }
  }

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          แผนผังการผลิต
        </h1>
        <p className="text-gray-600">
          ติดตามการผลิตผำอินทรีย์ผ่านกระบวนการต้นน้ำ กลางน้ำ และปลายน้ำ
        </p>
      </div>

      {showProductSelection ? (
        <div className="space-y-6">
          {/* Enterprise Selection */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              <i className="ri-building-line mr-2 text-blue-600"></i>
              เลือกวิสาหกิจ
            </h2>
            <div className="max-w-md">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เลือกวิสาหกิจที่ต้องการจัดการ <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                required
              >
                <option value="">-- เลือกวิสาหกิจ --</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedBranch && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Create New Product */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-center">
                  <i className="ri-add-circle-line text-6xl text-amber-600 mb-4"></i>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">สร้างล้อตสินค้าใหม่</h3>
                  <p className="text-gray-600 mb-6">
                    เริ่มติดตามชุดผลิตผำอินทรีย์ใหม่จากฟาร์มสู่ผลิตภัณฑ์สำเร็จรูป
                  </p>
                  <button
                    onClick={startNewProduct}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                  >
                    <i className="ri-play-line mr-2"></i>
                    เริ่มชุดผลิตใหม่
                  </button>
                </div>
              </div>

              {/* Existing Products */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  <i className="ri-list-check-line mr-2 text-green-600"></i>
                  ล้อตสินค้าที่มีอยู่
                </h3>
                
                {existingProducts.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {existingProducts.map((product) => (
                      <div
                        key={product.id}
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => selectExistingProduct(product)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {product.batch_number}
                            </h4>
                            <p className="text-sm text-gray-600">
                              สถานะ: <span className={`font-medium ${
                                product.status === 'completed' ? 'text-green-600' :
                                product.status === 'in_production' ? 'text-yellow-600' :
                                'text-red-600'
                              }`}>
                                {product.status === 'completed' ? 'เสร็จสิ้น' :
                                 product.status === 'in_production' ? 'กำลังผลิต' :
                                 'ยกเลิก'}
                              </span>
                            </p>
                            <p className="text-xs text-gray-500">
                              สร้างเมื่อ: {new Date(product.created_at).toLocaleDateString('th-TH')}
                            </p>
                          </div>
                          <div className="flex items-center">
                            <i className="ri-arrow-right-line text-gray-400"></i>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <i className="ri-inbox-line text-4xl text-gray-400 mb-4"></i>
                    <p className="text-gray-600">ยังไม่มีล้อตสินค้าในวิสาหกิจนี้</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>
          {/* Current Product Info */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-4 md:mb-0">
                <h2 className="text-xl font-bold text-gray-900">
                  ชุดผลิต: {currentProduct.batch_number}
                </h2>
                <p className="text-gray-600">
                  วิสาหกิจ: {currentProduct.branches?.name || 'ไม่ระบุ'}
                </p>
                <p className="text-gray-600">
                  เริ่มเมื่อ: {new Date(currentProduct.created_at).toLocaleDateString('th-TH')}
                </p>
                <div className="mt-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    currentProduct.status === 'completed' 
                      ? 'bg-green-100 text-green-800' 
                      : currentProduct.status === 'in_production'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    <i className={`mr-1 ${
                      currentProduct.status === 'completed' 
                        ? 'ri-checkbox-circle-line' 
                        : currentProduct.status === 'in_production'
                        ? 'ri-time-line'
                        : 'ri-close-circle-line'
                    }`}></i>
                    {currentProduct.status === 'completed' ? 'เสร็จสิ้น' :
                     currentProduct.status === 'in_production' ? 'กำลังผลิต' :
                     'ยกเลิก'}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setShowQR(!showQR)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <i className="ri-qr-code-line mr-2"></i>
                  {showQR ? 'ซ่อน QR' : 'แสดง QR'}
                </button>
                <button
                  onClick={printQRCodePDF}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <i className="ri-file-pdf-line mr-2"></i>
                  พิมพ์ PDF
                </button>
                <button
                  onClick={backToProductSelection}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <i className="ri-arrow-left-line mr-2"></i>
                  กลับไปเลือกล้อต
                </button>
              </div>
            </div>
          </div>

          {/* QR Code Display */}
          {showQR && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6 text-center">
              <h3 className="text-lg font-semibold mb-4">QR Code ผลิตภัณฑ์</h3>
              <div ref={qrRef} className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
                <QRCode
                  value={`${window.location.origin}/product/${currentProduct.id}`}
                  size={200}
                />
              </div>
              <p className="text-sm text-gray-600 mt-4">
                สแกน QR Code นี้เพื่อดูประวัติการผลิตทั้งหมด
              </p>
            </div>
          )}

          {/* Production Stages */}
          <div className="space-y-6">
            {productionStages.map((category) => (
              <div key={category.id} className={`bg-white rounded-lg shadow-md border-l-4 ${category.borderColor}`}>
                <div className={`${category.bgColor} p-4 rounded-t-lg`}>
                  <div className="flex items-center">
                    <div className={`${category.color} rounded-lg p-3 mr-4`}>
                      <i className={`${category.icon} text-white text-xl`}></i>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{category.name}</h3>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {category.stages.map((stage) => {
                      const completed = isStageCompleted(stage.id)
                      return (
                        <button
                          key={stage.id}
                          onClick={() => handleStageClick(stage)}
                          className={`p-4 border-2 rounded-lg transition-all text-left relative ${
                            completed
                              ? 'border-green-400 bg-green-50'
                              : 'border-gray-200 hover:border-amber-300 hover:bg-amber-50'
                          }`}
                        >
                          {completed && (
                            <div className="absolute top-2 right-2 flex space-x-1">
                              <i className="ri-checkbox-circle-fill text-green-500 text-xl"></i>
                              <i className="ri-edit-line text-blue-500 text-sm"></i>
                            </div>
                          )}
                          <div className="flex items-center mb-2">
                            <i className={`${stage.icon} text-xl text-gray-600 mr-2`}></i>
                            <span className="font-semibold text-gray-900">{stage.name}</span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {completed ? 'บันทึกแล้ว - คลิกเพื่อแก้ไข' : 'คลิกเพื่อบันทึกข้อมูล'}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Stage Data Form Modal */}
          {selectedStage && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">
                      <i className={`${selectedStage.icon} mr-2`}></i>
                      {selectedStage.name}
                      {completedStages.includes(selectedStage.id) && (
                        <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          แก้ไขข้อมูล
                        </span>
                      )}
                    </h3>
                    <button
                      onClick={() => setSelectedStage(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <i className="ri-close-line text-xl"></i>
                    </button>
                  </div>

                  <form onSubmit={(e) => { e.preventDefault(); saveStageData(); }}>
                    <div className="space-y-4">
                      {selectedStage.fields.map((field) => (
                        <div key={field.name}>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          {renderField(field)}
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end space-x-4 mt-6">
                      <button
                        type="button"
                        onClick={() => setSelectedStage(null)}
                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors disabled:opacity-50"
                      >
                        {isLoading ? (
                          <>
                            <i className="ri-loader-4-line animate-spin mr-2"></i>
                            กำลังบันทึก...
                          </>
                        ) : (
                          <>
                            <i className={`${completedStages.includes(selectedStage.id) ? 'ri-refresh-line' : 'ri-save-line'} mr-2`}></i>
                            {completedStages.includes(selectedStage.id) ? 'อัพเดทข้อมูล' : 'บันทึกข้อมูล'}
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ProductionRoadmap