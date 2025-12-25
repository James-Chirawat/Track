import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { apiClient } from '../lib/api'
import LoadingSpinner from '../components/LoadingSpinner'
import Swal from 'sweetalert2'

// Enterprise names list
const ENTERPRISE_NAMES = [
  'วิสาหกิจชุมชนรักษ์ดินทอง',
  'วิสาหกิจชุมชนสวนไผ่พลังงานพัฒนาตำบลชัยนาม',
  'วิสาหกิจชุมชนเศรษฐกิจพอเพียงแบบยั่งยืนอำเภอวังทอง',
  'วิสาหกิจชุมชนบ้านเนินสะอาดไร่นาสวนผสม',
  'วิสาหกิจชุมชนธิดาผักปลอดภัย',
  'วิสาหกิจชุมชนเกษตรอินทรีย์ N-DO Fulltime',
  'วิสาหกิจชุมชนSociety farm',
  'วิสาหกิจชุมชนดองได้ดองดี',
  'วิสาหกิจชุมชนไร่ฟุ้งเฟื่องเมืองบางขลัง',
  'วิสาหกิจชุมชนพืชสมุนไพรนครบางขลัง',
  'วิสาหกิจชุมชนผักปลอดภัยจากสารพิษตำบลเกาะตาเลี้ยง',
  'วิสาหกิจชุมชนบ้านแจ่มจ้า เมืองบางขลัง',
  'วิสาหกิจบ้านสวนคุณทองเพียร',
  'วิสาหกิจชุมชนปลูกและแปรรูปสมุนไพรทับยายเชียง',
  'วิสาหกิจชุมชนเกษตรสุขใจ (แทนศูนย์เรียนรู้ดินและปุ๋ยชุมชนตำบลบ้านกร่าง)'
]

// PSB quantity options
const PSB_QUANTITIES = [10, 15, 20, 500, 1000]
const NUTRIENT_QUANTITIES = [10, 15, 20]

// Color options for water fern
const COLOR_OPTIONS = [
  { id: 'pale_partial', label: 'สีซีดบางส่วน' },
  { id: 'pale_many', label: 'สีซีดจำนวนมาก' },
  { id: 'dark_green', label: 'เขียวเข้ม' },
  { id: 'light_green', label: 'เขียวอ่อน' },
  { id: 'yellow_green', label: 'เขียวปนเหลือง' },
  { id: 'yellow', label: 'เหลือง' },
  { id: 'brown', label: 'น้ำตาล' }
]

// Foam options
const FOAM_OPTIONS = [
  { id: 'no_foam', label: 'ไม่เกิดฟอง' },
  { id: 'some_spots', label: 'เกิดบางจุด' },
  { id: 'heavy_foam', label: 'เกิดฟองมากทั้งบ่อ' }
]

// Smell options
const SMELL_OPTIONS = [
  { id: 'normal', label: 'กลิ่นปกติ' },
  { id: 'sour', label: 'เหม็นเปรี้ยว' },
  { id: 'starting_rotten', label: 'เริ่มมีกลิ่นเน่า' },
  { id: 'rotten', label: 'มีกลิ่นเน่า' }
]

// Sinking options
const SINKING_OPTIONS = [
  { id: 'normal', label: 'จมแบบปกติ' },
  { id: 'abnormal', label: 'จมแบบผิดปกติ' }
]

// Overall characteristics options
const OVERALL_OPTIONS = [
  { id: 'normal', label: 'ปกติ' },
  { id: 'clumped', label: 'จับตัวเป็นก้อน' },
  { id: 'sheet', label: 'จับตัวเป็นแผ่น' },
  { id: 'layered', label: 'แยกตัวเป็นชั้น ๆ' },
  { id: 'slimy', label: 'มีเมือก' }
]

// Contaminant options
const CONTAMINANT_OPTIONS = [
  { id: 'none', label: 'ไม่พบ' },
  { id: 'duckweed', label: 'แหน' },
  { id: 'algae', label: 'ตะไคร่' },
  { id: 'insects', label: 'แมลง' },
  { id: 'seaweed', label: 'สาหร่าย' },
  { id: 'other', label: 'อื่น ๆ (ระบุ)' }
]

// Font size levels for accessibility (using zoom for full page scaling)
const FONT_SIZES = {
  small: { label: 'เล็ก', scale: 0.85 },
  normal: { label: 'ปกติ', scale: 1 },
  large: { label: 'ใหญ่', scale: 1.15 },
  xlarge: { label: 'ใหญ่มาก', scale: 1.35 }
}

const DailyRecord = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  
  // Font size for accessibility
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem('dailyRecord_fontSize')
    return saved || 'normal'
  })
  const [showFontControl, setShowFontControl] = useState(false)
  
  // Existing records tracking
  const [existingRecords, setExistingRecords] = useState([])
  const [recordedDays, setRecordedDays] = useState({}) // { cycleNumber: [days] }
  const [recordsMap, setRecordsMap] = useState({}) // { "cycleNumber-dayNumber": recordId }
  const [availableCycles, setAvailableCycles] = useState([])
  const [isLoadingRecords, setIsLoadingRecords] = useState(false)
  
  // Edit mode tracking
  const [editingRecordId, setEditingRecordId] = useState(null)
  const [isEditMode, setIsEditMode] = useState(false)
  
  // Save font size preference
  useEffect(() => {
    localStorage.setItem('dailyRecord_fontSize', fontSize)
  }, [fontSize])

  // Header data
  const [headerData, setHeaderData] = useState({
    enterpriseName: '',
    cycleNumber: '',
    startDate: '',
    dayNumber: null, // default to null - no day selected
    recorderName: '',
    activities: {
      addMotherStrain: false,
      addNutrients: false,
      measureObserve: false,
      harvest: false
    }
  })

  // Section 1: Pre-cultivation water resting (per pond)
  const [section1Data, setSection1Data] = useState({
    ponds: [1, 2, 3, 4].map(num => ({
      pondNumber: num,
      waterRestedTwoDays: null, // true/false/null
      phBeforeCultivation: '',
      phInRange: null, // true/false/null
      waterLevelSetup: false, // ระดับน้ำอยู่ที่ 30 เซ็นติเมตร
      pumpPositionSetup: false, // ตำแหน่งปั๊มน้ำทั้ง 2 ลึกจากผิวน้ำ 10-15 เซ็นติเมตร
      pumpScheduleSetup: false, // ตั้งระบบน้ำวนให้ทำงาน 2 ช่วงเวลา
      oxygenSystemSetup: false // ตั้งระบบการให้ออกซิเจนให้เปิดตลอดเวลา
    }))
  })

  // Section 2: Mother strain quantity (per pond)
  const [section2Data, setSection2Data] = useState({
    ponds: [1, 2, 3, 4].map(num => ({
      pondNumber: num,
      quantity: '' // kg
    }))
  })

  // Section 3: pH measurement during cultivation (per pond)
  const [section3Data, setSection3Data] = useState({
    beforeFeeding: [1, 2, 3, 4].map(num => ({
      pondNumber: num,
      phValue: '',
      phInRange: null
    })),
    afterFeeding: [1, 2, 3, 4].map(num => ({
      pondNumber: num,
      phValue: '',
      phInRange: null
    }))
  })

  // Section 4: Fertilizer/nutrients (per pond)
  const [section4Data, setSection4Data] = useState({
    ponds: [1, 2, 3, 4].map(num => ({
      pondNumber: num,
      psb: { checked: false, quantity: '' },
      peanut: { checked: false },
      soybean: { checked: false, quantity: '' },
      fruit: { checked: false, quantity: '' },
      hormone: { checked: false, quantity: '' },
      coconutWater: { checked: false, quantity: '' }
    }))
  })

  // Section 5: Water fern characteristics (per pond)
  const [section5Data, setSection5Data] = useState({
    ponds: [1, 2, 3, 4].map(num => ({
      pondNumber: num,
      colors: [], // multiple selection
      foam: '',
      smell: '',
      sinking: '',
      overall: [],
      overallNotes: '', // ระบุเพิ่มเติมหากเจอกรณีอื่น ๆ สำหรับลักษณะโดยรวม
      contaminants: [],
      otherContaminant: '',
      otherNotes: ''
    }))
  })

  // Section 6: Harvest data (per pond)
  const [section6Data, setSection6Data] = useState({
    ponds: [1, 2, 3, 4].map(num => ({
      pondNumber: num,
      weight: '', // kg
      soldTo: '',
      quantity: '',
      price: '',
      revenue: ''
    }))
  })

  // Calculate pH range status
  const calculatePhRange = (phValue) => {
    const ph = parseFloat(phValue)
    if (isNaN(ph)) return null
    return ph >= 6.5 && ph <= 7.5
  }

  // Fetch existing records for an enterprise
  const fetchExistingRecords = async (enterpriseName) => {
    if (!enterpriseName) {
      setExistingRecords([])
      setRecordedDays({})
      setRecordsMap({})
      setAvailableCycles([])
      return
    }

    setIsLoadingRecords(true)
    try {
      const { data, error } = await supabase
        .from('daily_cultivation_records')
        .select('*')
        .eq('enterprise_name', enterpriseName)
        .order('cycle_number', { ascending: true })
        .order('day_number', { ascending: true })

      if (error) throw error

      setExistingRecords(data || [])

      // Group recorded days by cycle number (as string for consistent comparison)
      const daysByCycle = {}
      const cycles = new Set()
      const recordMap = {}
      const allRecordedDays = new Set() // Track all days that have any record
      const dayToRecords = {} // Map day -> array of records for that day
      
      data?.forEach(record => {
        // Convert cycle_number to string for consistent comparison
        const cycleNum = record.cycle_number ? String(record.cycle_number) : 'ไม่ระบุรอบ'
        cycles.add(cycleNum)
        
        if (!daysByCycle[cycleNum]) {
          daysByCycle[cycleNum] = []
        }
        if (record.day_number && !daysByCycle[cycleNum].includes(record.day_number)) {
          daysByCycle[cycleNum].push(record.day_number)
        }
        
        // Track all recorded days (across all cycles)
        if (record.day_number) {
          allRecordedDays.add(record.day_number)
          if (!dayToRecords[record.day_number]) {
            dayToRecords[record.day_number] = []
          }
          dayToRecords[record.day_number].push(record)
        }
        
        // Create a map for quick lookup: "cycleNum-dayNum" -> record
        const key = `${cycleNum}-${record.day_number}`
        recordMap[key] = record
      })

      // Add special key for all days
      daysByCycle['_all'] = Array.from(allRecordedDays)
      recordMap['_dayToRecords'] = dayToRecords

      setRecordedDays(daysByCycle)
      setRecordsMap(recordMap)
      setAvailableCycles(Array.from(cycles).sort((a, b) => {
        if (a === 'ไม่ระบุรอบ') return 1
        if (b === 'ไม่ระบุรอบ') return -1
        return Number(a) - Number(b)
      }))

    } catch (error) {
      console.error('Error fetching existing records:', error)
    } finally {
      setIsLoadingRecords(false)
    }
  }

  // Load a specific record for editing
  const loadRecordForEditing = async (record) => {
    if (!record) return

    setIsLoading(true)
    try {
      // Set edit mode
      setEditingRecordId(record.id)
      setIsEditMode(true)

      // Load header data
      setHeaderData({
        enterpriseName: record.enterprise_name || '',
        cycleNumber: record.cycle_number ? String(record.cycle_number) : '',
        startDate: record.start_date || '',
        dayNumber: record.day_number || 1,
        recorderName: record.recorder_name || '',
        activities: record.activities || {
          addMotherStrain: false,
          addNutrients: false,
          measureObserve: false,
          harvest: false
        }
      })

      // Load section data
      if (record.section1_data?.ponds) {
        setSection1Data(record.section1_data)
      }
      if (record.section2_data?.ponds) {
        setSection2Data(record.section2_data)
      }
      if (record.section3_data?.beforeFeeding) {
        setSection3Data(record.section3_data)
      }
      if (record.section4_data?.ponds) {
        setSection4Data(record.section4_data)
      }
      if (record.section5_data?.ponds) {
        setSection5Data(record.section5_data)
      }
      if (record.section6_data?.ponds) {
        setSection6Data(record.section6_data)
      }

      Swal.fire({
        icon: 'info',
        title: 'โหลดข้อมูลสำเร็จ',
        html: `กำลังแก้ไขข้อมูล<br/>รอบที่ <strong>${record.cycle_number || 'ไม่ระบุ'}</strong> วันที่ <strong>${record.day_number}</strong>`,
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#10b981',
        timer: 2000,
        timerProgressBar: true
      })

    } catch (error) {
      console.error('Error loading record:', error)
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถโหลดข้อมูลได้',
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#ef4444'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Reset to new record mode
  const resetToNewRecord = () => {
    setEditingRecordId(null)
    setIsEditMode(false)
    
    // Reset all form data
    setHeaderData(prev => ({
      ...prev,
      cycleNumber: '',
      startDate: '',
      dayNumber: null,
      recorderName: '',
      activities: {
        addMotherStrain: false,
        addNutrients: false,
        measureObserve: false,
        harvest: false
      }
    }))
    
    // Reset sections to default
    setSection1Data({
      ponds: [1, 2, 3, 4].map(num => ({
        pondNumber: num,
        waterRestedTwoDays: null,
        phBeforeCultivation: '',
        phInRange: null,
        waterLevelSetup: false,
        pumpPositionSetup: false,
        pumpScheduleSetup: false,
        oxygenSystemSetup: false
      }))
    })
    
    setSection2Data({
      ponds: [1, 2, 3, 4].map(num => ({
        pondNumber: num,
        quantity: ''
      }))
    })
    
    setSection3Data({
      beforeFeeding: [1, 2, 3, 4].map(num => ({
        pondNumber: num,
        phValue: '',
        phInRange: null
      })),
      afterFeeding: [1, 2, 3, 4].map(num => ({
        pondNumber: num,
        phValue: '',
        phInRange: null
      }))
    })
    
    setSection4Data({
      ponds: [1, 2, 3, 4].map(num => ({
        pondNumber: num,
        psb: { checked: false, quantity: '' },
        peanut: { checked: false },
        soybean: { checked: false, quantity: '' },
        fruit: { checked: false, quantity: '' },
        hormone: { checked: false, quantity: '' },
        coconutWater: { checked: false, quantity: '' }
      }))
    })
    
    setSection5Data({
      ponds: [1, 2, 3, 4].map(num => ({
        pondNumber: num,
        colors: [],
        foam: '',
        smell: '',
        sinking: '',
        overall: [],
        overallNotes: '',
        contaminants: [],
        otherContaminant: '',
        otherNotes: ''
      }))
    })
    
    setSection6Data({
      ponds: [1, 2, 3, 4].map(num => ({
        pondNumber: num,
        weight: '',
        soldTo: '',
        quantity: '',
        price: '',
        revenue: ''
      }))
    })
  }

  // Handle day click - check if record exists and offer to load it
  const handleDayClick = async (day, cycleNum = null) => {
    // If cycle is provided, look for specific record
    if (cycleNum) {
      const key = `${cycleNum}-${day}`
      const existingRecord = recordsMap[key]
      
      if (existingRecord) {
        const result = await Swal.fire({
          icon: 'question',
          title: 'พบข้อมูลที่บันทึกแล้ว',
          html: `รอบที่ <strong>${cycleNum}</strong> วันที่ <strong>${day}</strong><br/>มีการบันทึกข้อมูลแล้ว`,
          showCancelButton: true,
          confirmButtonText: '<i class="ri-edit-line"></i> แก้ไขข้อมูล',
          cancelButtonText: 'ยกเลิก',
          confirmButtonColor: '#10b981',
          cancelButtonColor: '#6b7280'
        })
        
        if (result.isConfirmed) {
          loadRecordForEditing(existingRecord)
        }
        return
      }
    }
    
    // If no cycle provided, check all records for this day
    const dayRecords = recordsMap['_dayToRecords']?.[day] || []
    
    if (dayRecords.length > 0) {
      if (dayRecords.length === 1) {
        // Only one record for this day
        const record = dayRecords[0]
        const result = await Swal.fire({
          icon: 'question',
          title: 'พบข้อมูลที่บันทึกแล้ว',
          html: `วันที่ <strong>${day}</strong> มีการบันทึกแล้ว<br/>
                 รอบที่ <strong>${record.cycle_number || 'ไม่ระบุ'}</strong>`,
          showCancelButton: true,
          confirmButtonText: '<i class="ri-edit-line"></i> แก้ไขข้อมูล',
          cancelButtonText: 'ยกเลิก',
          confirmButtonColor: '#10b981',
          cancelButtonColor: '#6b7280'
        })
        
        if (result.isConfirmed) {
          loadRecordForEditing(record)
        }
      } else {
        // Multiple records for this day - show list to choose
        const recordOptions = dayRecords.map((r, idx) => 
          `<div class="text-left p-2 border-b last:border-0">
            <strong>รอบที่ ${r.cycle_number || 'ไม่ระบุ'}</strong> 
            - บันทึกเมื่อ ${new Date(r.recorded_at).toLocaleDateString('th-TH')}
          </div>`
        ).join('')
        
        const result = await Swal.fire({
          icon: 'info',
          title: `วันที่ ${day} มีการบันทึก ${dayRecords.length} รายการ`,
          html: `<div class="max-h-48 overflow-y-auto border rounded my-2">${recordOptions}</div>
                 <p class="text-sm text-gray-600 mt-2">เลือกรอบที่ต้องการแก้ไข</p>`,
          input: 'select',
          inputOptions: dayRecords.reduce((acc, r, idx) => {
            acc[idx] = `รอบที่ ${r.cycle_number || 'ไม่ระบุ'}`
            return acc
          }, {}),
          inputPlaceholder: 'เลือกรอบ',
          showCancelButton: true,
          confirmButtonText: '<i class="ri-edit-line"></i> แก้ไขข้อมูล',
          cancelButtonText: 'ยกเลิก',
          confirmButtonColor: '#10b981',
          cancelButtonColor: '#6b7280',
          inputValidator: (value) => {
            if (!value && value !== 0) {
              return 'กรุณาเลือกรอบที่ต้องการแก้ไข'
            }
          }
        })
        
        if (result.isConfirmed && result.value !== undefined) {
          loadRecordForEditing(dayRecords[parseInt(result.value)])
        }
      }
    } else {
      // No record for this day - just select the day
      handleHeaderChange('dayNumber', day)
      setEditingRecordId(null)
      setIsEditMode(false)
    }
  }

  // Handle header changes
  const handleHeaderChange = (field, value) => {
    setHeaderData(prev => {
      const newData = { ...prev, [field]: value }
      
      // Reset dayNumber when enterprise changes
      if (field === 'enterpriseName') {
        newData.dayNumber = null
        newData.cycleNumber = ''
      }
      
      // Auto-select day number when cycle number is entered (1-14)
      if (field === 'cycleNumber' && value) {
        const cycleNum = parseInt(value)
        if (cycleNum >= 1 && cycleNum <= 14) {
          newData.dayNumber = cycleNum
        }
      }
      
      return newData
    })

    // Fetch existing records when enterprise name changes
    if (field === 'enterpriseName') {
      fetchExistingRecords(value)
      // Reset edit mode
      setEditingRecordId(null)
      setIsEditMode(false)
    }
  }

  const handleActivityChange = (activity, checked) => {
    setHeaderData(prev => ({
      ...prev,
      activities: {
        ...prev.activities,
        [activity]: checked
      }
    }))
  }

  // Handle Section 1 changes
  const handleSection1PondChange = (pondIndex, field, value) => {
    setSection1Data(prev => ({
      ...prev,
      ponds: prev.ponds.map((pond, idx) => 
        idx === pondIndex ? { ...pond, [field]: value } : pond
      )
    }))
  }

  // Handle Section 2 changes
  const handleSection2Change = (pondIndex, value) => {
    setSection2Data(prev => ({
      ...prev,
      ponds: prev.ponds.map((pond, idx) => 
        idx === pondIndex ? { ...pond, quantity: value } : pond
      )
    }))
  }

  // Handle Section 3 changes
  const handleSection3Change = (type, pondIndex, field, value) => {
    setSection3Data(prev => ({
      ...prev,
      [type]: prev[type].map((pond, idx) => 
        idx === pondIndex ? { ...pond, [field]: value } : pond
      )
    }))
  }

  // Handle Section 4 changes
  const handleSection4Change = (pondIndex, nutrient, field, value) => {
    setSection4Data(prev => ({
      ...prev,
      ponds: prev.ponds.map((pond, idx) => 
        idx === pondIndex ? {
          ...pond,
          [nutrient]: {
            ...pond[nutrient],
            [field]: value
          }
        } : pond
      )
    }))
  }

  // Handle Section 5 changes
  const handleSection5Change = (pondIndex, field, value) => {
    setSection5Data(prev => ({
      ...prev,
      ponds: prev.ponds.map((pond, idx) => 
        idx === pondIndex ? { ...pond, [field]: value } : pond
      )
    }))
  }

  // Handle Section 5 multi-select changes
  const handleSection5MultiSelect = (pondIndex, field, optionId) => {
    setSection5Data(prev => ({
      ...prev,
      ponds: prev.ponds.map((pond, idx) => {
        if (idx !== pondIndex) return pond
        const currentValues = pond[field] || []
        const newValues = currentValues.includes(optionId)
          ? currentValues.filter(v => v !== optionId)
          : [...currentValues, optionId]
        return { ...pond, [field]: newValues }
      })
    }))
  }

  // Handle Section 6 changes
  const handleSection6Change = (pondIndex, field, value) => {
    setSection6Data(prev => ({
      ...prev,
      ponds: prev.ponds.map((pond, idx) => {
        if (idx !== pondIndex) return pond
        const updated = { ...pond, [field]: value }
        // Auto calculate revenue
        if (field === 'quantity' || field === 'price') {
          const qty = parseFloat(field === 'quantity' ? value : pond.quantity) || 0
          const price = parseFloat(field === 'price' ? value : pond.price) || 0
          updated.revenue = (qty * price).toString()
        }
        return updated
      })
    }))
  }

  // Save all data (create or update)
  const handleSave = async () => {
    if (!headerData.enterpriseName) {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณากรอกข้อมูล',
        text: 'กรุณาเลือกชื่อวิสาหกิจก่อนบันทึก',
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#10b981'
      })
      return
    }

    if (!headerData.dayNumber) {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณากรอกข้อมูล',
        text: 'กรุณาเลือกวันที่บันทึกก่อน',
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#10b981'
      })
      return
    }

    // If not in edit mode, check if this day is already recorded
    if (!isEditMode) {
      const currentCycle = headerData.cycleNumber ? String(headerData.cycleNumber) : 'ไม่ระบุรอบ'
      const key = `${currentCycle}-${headerData.dayNumber}`
      const existingRecord = recordsMap[key]
      
      if (existingRecord) {
        const result = await Swal.fire({
          icon: 'warning',
          title: 'มีข้อมูลวันนี้แล้ว',
          html: `รอบที่ <strong>${headerData.cycleNumber || 'ไม่ระบุ'}</strong> 
                 วันที่ <strong>${headerData.dayNumber}</strong><br/>
                 มีการบันทึกข้อมูลแล้ว<br/><br/>
                 ต้องการดำเนินการอย่างไร?`,
          showDenyButton: true,
          showCancelButton: true,
          confirmButtonText: 'อัปเดตข้อมูลเดิม',
          denyButtonText: 'บันทึกเพิ่ม',
          cancelButtonText: 'ยกเลิก',
          confirmButtonColor: '#f59e0b',
          denyButtonColor: '#10b981',
          cancelButtonColor: '#6b7280'
        })
        
        if (result.isConfirmed) {
          // Switch to edit mode and update
          setEditingRecordId(existingRecord.id)
          setIsEditMode(true)
        } else if (result.isDenied) {
          // Continue with new record
        } else {
          return
        }
      }
    }

    setIsSaving(true)
    setError('')
    setSuccessMessage('')

    try {
      // Prepare complete record data with all fields
      const fullRecordData = {
        enterprise_name: headerData.enterpriseName,
        cycle_number: headerData.cycleNumber ? parseInt(headerData.cycleNumber) : null,
        start_date: headerData.startDate || null,
        day_number: headerData.dayNumber ? parseInt(headerData.dayNumber) : 1,
        recorder_name: headerData.recorderName || null,
        activities: headerData.activities || {},
        section1_data: {
          ponds: section1Data.ponds.map(pond => ({
            pondNumber: pond.pondNumber,
            waterRestedTwoDays: pond.waterRestedTwoDays,
            phBeforeCultivation: pond.phBeforeCultivation,
            phInRange: pond.phInRange,
            waterLevelSetup: pond.waterLevelSetup,
            pumpPositionSetup: pond.pumpPositionSetup,
            pumpScheduleSetup: pond.pumpScheduleSetup,
            oxygenSystemSetup: pond.oxygenSystemSetup
          }))
        },
        section2_data: {
          ponds: section2Data.ponds.map(pond => ({
            pondNumber: pond.pondNumber,
            quantity: pond.quantity
          }))
        },
        section3_data: {
          beforeFeeding: section3Data.beforeFeeding.map(pond => ({
            pondNumber: pond.pondNumber,
            phValue: pond.phValue,
            phInRange: pond.phInRange
          })),
          afterFeeding: section3Data.afterFeeding.map(pond => ({
            pondNumber: pond.pondNumber,
            phValue: pond.phValue,
            phInRange: pond.phInRange
          }))
        },
        section4_data: {
          ponds: section4Data.ponds.map(pond => ({
            pondNumber: pond.pondNumber,
            psb: pond.psb,
            peanut: pond.peanut,
            soybean: pond.soybean,
            fruit: pond.fruit,
            hormone: pond.hormone,
            coconutWater: pond.coconutWater
          }))
        },
        section5_data: {
          ponds: section5Data.ponds.map(pond => ({
            pondNumber: pond.pondNumber,
            colors: pond.colors,
            foam: pond.foam,
            smell: pond.smell,
            sinking: pond.sinking,
            overall: pond.overall,
            overallNotes: pond.overallNotes,
            contaminants: pond.contaminants,
            otherContaminant: pond.otherContaminant,
            otherNotes: pond.otherNotes
          }))
        },
        section6_data: {
          ponds: section6Data.ponds.map(pond => ({
            pondNumber: pond.pondNumber,
            weight: pond.weight,
            soldTo: pond.soldTo,
            quantity: pond.quantity,
            price: pond.price,
            revenue: pond.revenue
          }))
        },
        recorded_at: new Date().toISOString()
      }

      let saveSuccess = false

      if (isEditMode && editingRecordId) {
        // Update existing record
        const { data, error } = await supabase
          .from('daily_cultivation_records')
          .update(fullRecordData)
          .eq('id', editingRecordId)
          .select()
          .single()

        if (error) throw error
        saveSuccess = true

        // Show success SweetAlert
        await Swal.fire({
          icon: 'success',
          title: 'อัปเดตสำเร็จ!',
          html: `ข้อมูลรอบที่ <strong>${headerData.cycleNumber || 'ไม่ระบุ'}</strong> 
                 วันที่ <strong>${headerData.dayNumber}</strong><br/>
                 ถูกอัปเดตเรียบร้อยแล้ว`,
          confirmButtonText: 'ตกลง',
          confirmButtonColor: '#10b981',
          allowOutsideClick: false,
          allowEscapeKey: false
        })
      } else {
        // Create new record
        const { data, error } = await supabase
          .from('daily_cultivation_records')
          .insert([fullRecordData])
          .select()
          .single()

        if (error) throw error
        saveSuccess = true

        // Show success SweetAlert
        await Swal.fire({
          icon: 'success',
          title: 'บันทึกสำเร็จ!',
          text: 'ข้อมูลการเลี้ยงไข่น้ำอินทรีย์ถูกบันทึกเรียบร้อยแล้ว',
          confirmButtonText: 'ตกลง',
          confirmButtonColor: '#10b981',
          allowOutsideClick: false,
          allowEscapeKey: false
        })
      }

      if (saveSuccess) {
        // Refresh the page after clicking OK
        window.location.reload()
      }

    } catch (error) {
      console.error('Error saving record:', error)
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถบันทึกข้อมูลได้: ' + error.message,
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#ef4444'
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Render checkbox
  const renderCheckbox = (checked, onChange, label) => (
    <label className="flex items-center space-x-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-5 h-5 text-emerald-600 border-2 border-gray-300 rounded focus:ring-emerald-500"
      />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  )

  // Render radio group for Yes/No
  const renderYesNo = (value, onChange, name) => (
    <div className="flex space-x-4">
      <label className="flex items-center space-x-2 cursor-pointer">
        <input
          type="radio"
          name={name}
          checked={value === true}
          onChange={() => onChange(true)}
          className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
        />
        <span className="text-sm text-gray-700">ใช่</span>
      </label>
      <label className="flex items-center space-x-2 cursor-pointer">
        <input
          type="radio"
          name={name}
          checked={value === false}
          onChange={() => onChange(false)}
          className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
        />
        <span className="text-sm text-gray-700">ไม่ใช่</span>
      </label>
    </div>
  )

  // Render pH range indicator
  const renderPhRange = (value, onChange, name) => (
    <div className="flex space-x-4">
      <label className="flex items-center space-x-2 cursor-pointer">
        <input
          type="radio"
          name={name}
          checked={value === true}
          onChange={() => onChange(true)}
          className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
        />
        <span className="text-sm text-green-700">อยู่ในช่วง</span>
      </label>
      <label className="flex items-center space-x-2 cursor-pointer">
        <input
          type="radio"
          name={name}
          checked={value === false}
          onChange={() => onChange(false)}
          className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
        />
        <span className="text-sm text-red-700">นอกช่วง</span>
      </label>
    </div>
  )

  // Get current font scale
  const fontScale = FONT_SIZES[fontSize]?.scale || 1

  return (
    <div 
      className="px-0 pb-8 transition-all duration-200 origin-top"
      style={{ 
        zoom: fontScale,
        // Fallback for browsers that don't support zoom
        WebkitTextSizeAdjust: `${fontScale * 100}%`
      }}
    >
      {/* Animation keyframes */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      {/* Floating Font Size Control Button - Using portal-like fixed positioning with inverse zoom */}
      <div 
        className="fixed bottom-24 right-4 z-50 sm:bottom-28 sm:right-6"
        style={{ zoom: 1 / fontScale }} // Inverse zoom to keep button same size
      >
        <button
          onClick={() => setShowFontControl(!showFontControl)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white p-4 sm:p-5 rounded-full shadow-lg transition-all hover:scale-110 active:scale-95"
          title="ปรับขนาดตัวอักษร"
          aria-label="ปรับขนาดตัวอักษร"
        >
          <i className="ri-font-size text-2xl sm:text-3xl"></i>
        </button>
        
        {/* Font Size Panel */}
        {showFontControl && (
          <div 
            className="absolute bottom-20 right-0 bg-white rounded-xl shadow-2xl border-2 border-gray-200 p-5 min-w-[260px] sm:min-w-[280px]"
            style={{ animation: 'fadeInUp 0.2s ease-out' }}
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-emerald-200">
              <span className="font-bold text-gray-800 flex items-center text-lg">
                <i className="ri-text mr-2 text-emerald-600 text-xl"></i>
                ขนาดตัวอักษร
              </span>
              <button 
                onClick={() => setShowFontControl(false)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-all"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
            <div className="space-y-3">
              {Object.entries(FONT_SIZES).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => {
                    setFontSize(key)
                    setShowFontControl(false)
                  }}
                  className={`w-full text-left px-5 py-4 rounded-xl transition-all flex items-center justify-between text-lg ${
                    fontSize === key
                      ? 'bg-emerald-100 text-emerald-800 font-bold border-2 border-emerald-400 shadow-md'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-2 border-transparent'
                  }`}
                >
                  <span style={{ fontSize: key === 'small' ? '14px' : key === 'normal' ? '16px' : key === 'large' ? '18px' : '22px' }}>
                    {value.label}
                  </span>
                  {fontSize === key && <i className="ri-check-line text-emerald-600 text-xl"></i>}
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-4 text-center bg-gray-50 p-2 rounded-lg">
              <i className="ri-information-line mr-1"></i>
              การตั้งค่าจะถูกบันทึกไว้
            </p>
          </div>
        )}
      </div>

      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
          <i className="ri-file-list-3-line mr-2 text-emerald-600"></i>
          แบบบันทึกการเลี้ยงไข่น้ำอินทรีย์
        </h1>
        <p className="text-gray-600 text-base sm:text-lg">
          บันทึกข้อมูลการเพาะเลี้ยงไข่น้ำอินทรีย์ประจำวัน
        </p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <i className="ri-error-warning-line mr-2"></i>
          {error}
        </div>
      )}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          <i className="ri-checkbox-circle-line mr-2"></i>
          {successMessage}
        </div>
      )}

      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-emerald-200 flex items-center">
          <i className="ri-information-line mr-2 text-emerald-600"></i>
          ข้อมูลทั่วไป
        </h2>
        
        {/* Row 1: Enterprise Name (full width) */}
        <div className="mb-4 sm:mb-6">
          <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">
            <i className="ri-building-line mr-1 text-emerald-600"></i>
            ชื่อวิสาหกิจ <span className="text-red-500">*</span>
          </label>
          <select
            value={headerData.enterpriseName}
            onChange={(e) => handleHeaderChange('enterpriseName', e.target.value)}
            className="w-full p-3 sm:p-4 text-base sm:text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white transition-all"
          >
            <option value="">-- เลือกวิสาหกิจ --</option>
            {ENTERPRISE_NAMES.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        {/* Row 2: Cycle Number, Start Date, Recorder Name */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6">
          {/* Cycle Number */}
          <div>
            <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">
              <i className="ri-repeat-line mr-1 text-emerald-600"></i>
              รอบการเพาะเลี้ยงที่
            </label>
            <input
              type="number"
              value={headerData.cycleNumber}
              onChange={(e) => handleHeaderChange('cycleNumber', e.target.value)}
              placeholder="ระบุรอบ"
              className="w-full p-3 sm:p-4 text-base sm:text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">
              <i className="ri-calendar-line mr-1 text-emerald-600"></i>
              วันที่เริ่ม
            </label>
            <input
              type="date"
              value={headerData.startDate}
              onChange={(e) => handleHeaderChange('startDate', e.target.value)}
              className="w-full p-3 sm:p-4 text-base sm:text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Recorder Name */}
          <div>
            <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">
              <i className="ri-user-line mr-1 text-emerald-600"></i>
              ผู้บันทึก
            </label>
            <input
              type="text"
              value={headerData.recorderName}
              onChange={(e) => handleHeaderChange('recorderName', e.target.value)}
              placeholder="ชื่อผู้บันทึก"
              className="w-full p-3 sm:p-4 text-base sm:text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
            />
          </div>
        </div>

        {/* Recorded Cycles Summary */}
        {headerData.enterpriseName && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2 flex items-center">
              <i className="ri-history-line mr-2"></i>
              ประวัติการบันทึกของวิสาหกิจนี้
            </h3>
            {isLoadingRecords ? (
              <p className="text-blue-600 text-sm">
                <i className="ri-loader-4-line animate-spin mr-2"></i>
                กำลังโหลดข้อมูล...
              </p>
            ) : existingRecords.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-blue-700">
                  พบข้อมูลที่บันทึกแล้ว <strong>{existingRecords.length}</strong> รายการ
                </p>
                <div className="flex flex-wrap gap-2">
                  {availableCycles.map(cycle => {
                    const isCurrentCycle = headerData.cycleNumber && String(cycle) === String(headerData.cycleNumber)
                    return (
                      <div 
                        key={cycle} 
                        className={`px-3 py-2 rounded-lg border ${
                          isCurrentCycle 
                            ? 'bg-emerald-100 border-emerald-400 ring-2 ring-emerald-300' 
                            : 'bg-white border-blue-200'
                        }`}
                      >
                        <span className={`text-sm font-medium ${isCurrentCycle ? 'text-emerald-800' : 'text-blue-800'}`}>
                          รอบที่ {cycle}:
                        </span>
                        <span className={`text-sm ml-2 ${isCurrentCycle ? 'text-emerald-600 font-bold' : 'text-blue-600'}`}>
                          วันที่ {recordedDays[cycle]?.sort((a, b) => a - b).join(', ') || '-'}
                        </span>
                        {isCurrentCycle && (
                          <span className="ml-2 text-emerald-600 text-xs">← รอบที่เลือก</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <p className="text-sm text-blue-600">ยังไม่มีข้อมูลที่บันทึกสำหรับวิสาหกิจนี้</p>
            )}
          </div>
        )}

        {/* Edit Mode Indicator */}
        {isEditMode && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-300 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <i className="ri-edit-line text-amber-600 mr-2 text-xl"></i>
                <div>
                  <span className="font-semibold text-amber-800">โหมดแก้ไข</span>
                  <span className="text-amber-700 ml-2">
                    รอบที่ {headerData.cycleNumber || 'ไม่ระบุ'} วันที่ {headerData.dayNumber}
                  </span>
                </div>
              </div>
              <button
                onClick={resetToNewRecord}
                className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
              >
                <i className="ri-add-line mr-1"></i>
                สร้างรายการใหม่
              </button>
            </div>
          </div>
        )}

        {/* Day Number Selection */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <label className="text-sm sm:text-base font-semibold text-gray-700 flex items-center">
              <i className="ri-calendar-check-line mr-2 text-emerald-600"></i>
              กระบวนการเพาะเลี้ยงวันที่ (เลือกวัน)
            </label>
            {headerData.enterpriseName && recordedDays['_all']?.length > 0 && (
              <span className="bg-amber-100 text-amber-800 text-xs sm:text-sm px-3 py-1.5 rounded-full font-medium">
                <i className="ri-checkbox-circle-line mr-1"></i>
                บันทึกแล้ว {recordedDays['_all'].length} วัน
              </span>
            )}
          </div>
          <div className="grid grid-cols-7 sm:flex sm:flex-wrap gap-2 sm:gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((day) => {
              // Check if this day is recorded in any cycle
              const isRecordedAny = recordedDays['_all']?.includes(day)
              // Check if this day is recorded for the current cycle (if specified)
              const currentCycle = headerData.cycleNumber ? String(headerData.cycleNumber) : null
              const isRecordedInCycle = currentCycle && recordedDays[currentCycle]?.includes(day)
              const isSelected = headerData.dayNumber === day
              
              // Get record count for this day
              const dayRecords = recordsMap['_dayToRecords']?.[day] || []
              const recordCount = dayRecords.length
              
              // Determine button style
              let buttonClass = ''
              if (isSelected) {
                buttonClass = isEditMode 
                  ? 'bg-amber-600 text-white shadow-xl ring-4 ring-amber-300 scale-110'
                  : 'bg-emerald-600 text-white shadow-xl ring-4 ring-emerald-300 scale-110'
              } else if (isRecordedInCycle) {
                // Recorded in current cycle - green highlight
                buttonClass = 'bg-emerald-100 text-emerald-800 border-3 border-emerald-400 hover:bg-emerald-200 hover:scale-105 cursor-pointer'
              } else if (isRecordedAny) {
                // Recorded in other cycles - amber highlight
                buttonClass = 'bg-amber-100 text-amber-800 border-3 border-amber-400 hover:bg-amber-200 hover:scale-105 cursor-pointer'
              } else {
                buttonClass = 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105 border-2 border-gray-200'
              }
              
              return (
                <button
                  key={day}
                  onClick={() => handleDayClick(day, currentCycle)}
                  className={`relative w-full sm:w-14 md:w-16 h-14 sm:h-14 md:h-16 rounded-xl font-bold text-lg sm:text-xl transition-all duration-200 active:scale-95 ${buttonClass}`}
                  title={isRecordedInCycle 
                    ? `วันที่ ${day} รอบที่ ${currentCycle} - บันทึกแล้ว (คลิกเพื่อแก้ไข)` 
                    : isRecordedAny 
                    ? `วันที่ ${day} มีการบันทึกแล้ว ${recordCount} รายการ - คลิกเพื่อดู/แก้ไข` 
                    : `วันที่ ${day}`}
                  aria-label={`วันที่ ${day}`}
                >
                  {day}
                  {isRecordedInCycle ? (
                    <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold shadow-md">
                      ✓
                    </span>
                  ) : isRecordedAny && (
                    <span className={`absolute -top-1.5 -right-1.5 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold shadow-md ${
                      recordCount > 1 ? 'bg-blue-500' : 'bg-amber-500'
                    }`}>
                      {recordCount > 1 ? recordCount : '✓'}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
          {headerData.cycleNumber && recordedDays[headerData.cycleNumber]?.length > 0 && (
            <p className="text-sm text-emerald-700 mt-2">
              <i className="ri-checkbox-circle-line mr-1"></i>
              รอบที่ {headerData.cycleNumber} บันทึกแล้ว: วันที่ {recordedDays[headerData.cycleNumber].sort((a, b) => a - b).join(', ')}
              <span className="text-emerald-600 ml-2">(ไฮไลท์สีเขียว - คลิกเพื่อแก้ไข)</span>
            </p>
          )}
          {headerData.cycleNumber && !recordedDays[headerData.cycleNumber] && existingRecords.length > 0 && (
            <p className="text-sm text-blue-600 mt-2">
              <i className="ri-add-circle-line mr-1"></i>
              รอบที่ {headerData.cycleNumber} ยังไม่มีการบันทึก (รอบใหม่) - เลือกวันที่ต้องการบันทึก
            </p>
          )}
          {!headerData.cycleNumber && headerData.enterpriseName && recordedDays['_all']?.length > 0 && (
            <p className="text-sm text-amber-700 mt-2">
              <i className="ri-information-line mr-1"></i>
              วันที่บันทึกแล้ว (ทุกรอบ): {recordedDays['_all'].sort((a, b) => a - b).join(', ')}
              <span className="text-amber-600 ml-2">(ไฮไลท์สีเหลือง - คลิกเพื่อแก้ไข)</span>
            </p>
          )}
        </div>

        {/* Activities */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            กิจกรรมที่ดำเนินการในวันนี้ (เลือกได้มากกว่า 1 ข้อ)
          </label>
          <div className="flex flex-wrap gap-4">
            {renderCheckbox(
              headerData.activities.addMotherStrain,
              (v) => handleActivityChange('addMotherStrain', v),
              'ลงแม่พันธุ์'
            )}
            {renderCheckbox(
              headerData.activities.addNutrients,
              (v) => handleActivityChange('addNutrients', v),
              'ให้สารอาหารเพาะเลี้ยง'
            )}
            {renderCheckbox(
              headerData.activities.measureObserve,
              (v) => handleActivityChange('measureObserve', v),
              'วัดค่า / สังเกต'
            )}
            {renderCheckbox(
              headerData.activities.harvest,
              (v) => handleActivityChange('harvest', v),
              'เก็บเกี่ยว'
            )}
          </div>
        </div>
      </div>

      {/* Section 1: Pre-cultivation Water Resting */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-6">
        <div className="flex items-center mb-4 pb-3 border-b-2 border-emerald-200">
          <span className="bg-emerald-600 text-white w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-bold mr-3 text-lg sm:text-xl shadow-md">1</span>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            การพักน้ำก่อนเลี้ยง (แยกตามบ่อ)
          </h2>
        </div>
        <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-lg mb-4">
          <i className="ri-information-line mr-2"></i>
          ค่า pH ที่เหมาะสมอยู่ในช่วง 6.5-7.5
        </p>

        {/* Per Pond Data */}
        <div className="space-y-4 mb-6">
          {section1Data.ponds.map((pond, idx) => (
            <div key={pond.pondNumber} className="p-4 bg-gray-50 rounded-lg">
              <div className="font-semibold text-gray-900 mb-3">บ่อที่ {pond.pondNumber}</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">พักน้ำ ≥ 2 วัน</label>
                  {renderYesNo(
                    pond.waterRestedTwoDays,
                    (v) => handleSection1PondChange(idx, 'waterRestedTwoDays', v),
                    `waterRested-${pond.pondNumber}`
                  )}
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">ค่า pH น้ำก่อนเลี้ยง</label>
                  <input
                    type="number"
                    step="0.1"
                    value={pond.phBeforeCultivation}
                    onChange={(e) => handleSection1PondChange(idx, 'phBeforeCultivation', e.target.value)}
                    placeholder="ค่า pH"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">สถานะ pH</label>
                  {renderPhRange(
                    pond.phInRange,
                    (v) => handleSection1PondChange(idx, 'phInRange', v),
                    `phRange-${pond.pondNumber}`
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Setup Options */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">การ Setup ระดับน้ำและตำแหน่งปั๊มน้ำวน / เวลาเปิด-ปิดปั๊ม / ระบบออกซิเจน</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {section1Data.ponds.map((pond, idx) => (
              <div key={pond.pondNumber} className="p-4 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-700 mb-3 text-lg border-b pb-2">บ่อที่ {pond.pondNumber}</div>
                <div className="space-y-3">
                  <div className="font-medium text-gray-600 text-sm">การ Setup ระดับน้ำและตำแหน่งปั๊มน้ำวน</div>
                  {renderCheckbox(
                    pond.waterLevelSetup,
                    (v) => handleSection1PondChange(idx, 'waterLevelSetup', v),
                    'ระดับน้ำอยู่ที่ 30 เซ็นติเมตร'
                  )}
                  {renderCheckbox(
                    pond.pumpPositionSetup,
                    (v) => handleSection1PondChange(idx, 'pumpPositionSetup', v),
                    'ตำแหน่งปั๊มน้ำทั้ง 2 ลึกจากผิวน้ำ 10-15 เซ็นติเมตร'
                  )}
                  
                  <div className="font-medium text-gray-600 text-sm mt-3 pt-2 border-t">การ Setup เวลาเปิด-ปิดปั๊มน้ำวน</div>
                  {renderCheckbox(
                    pond.pumpScheduleSetup,
                    (v) => handleSection1PondChange(idx, 'pumpScheduleSetup', v),
                    'ตั้งระบบน้ำวนให้ทำงาน 2 ช่วงเวลา'
                  )}
                  <p className="text-xs text-gray-500 ml-7">ได้แก่ 6.00-14.00 น., 16.00-18.00 น., 20.00-22.00 น. และ 2.00-4.00 น.</p>
                  <p className="text-xs text-gray-500 ml-7">หลังจากนั้นให้ปิดระบบการทำงาน</p>

                  <div className="font-medium text-gray-600 text-sm mt-3 pt-2 border-t">การ Setup ระบบการให้ออกซิเจน</div>
                  {renderCheckbox(
                    pond.oxygenSystemSetup,
                    (v) => handleSection1PondChange(idx, 'oxygenSystemSetup', v),
                    'ตั้งระบบการให้ออกซิเจนให้เปิดตลอดเวลา'
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 2: Mother Strain Quantity */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-6">
        <div className="flex items-center mb-4 pb-3 border-b-2 border-emerald-200">
          <span className="bg-emerald-600 text-white w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-bold mr-3 text-lg sm:text-xl shadow-md">2</span>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            ปริมาณแม่พันธุ์ไข่น้ำ (แยกตามบ่อ)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {section2Data.ponds.map((pond, idx) => (
            <div key={pond.pondNumber} className="p-4 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                บ่อที่ {pond.pondNumber}
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  step="0.1"
                  value={pond.quantity}
                  onChange={(e) => handleSection2Change(idx, e.target.value)}
                  placeholder="จำนวน"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
                <span className="ml-2 text-gray-600 font-medium">(กก.)</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: pH Measurement During Cultivation */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-6">
        <div className="flex items-center mb-4 pb-3 border-b-2 border-emerald-200">
          <span className="bg-emerald-600 text-white w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-bold mr-3 text-lg sm:text-xl shadow-md">3</span>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            การวัดค่า pH ระหว่างการเลี้ยง (แยกตามบ่อ)
          </h2>
        </div>

        {/* 3.1 Before Feeding */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">3.1 ค่า pH ก่อนให้สารอาหาร</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {section3Data.beforeFeeding.map((pond, idx) => (
              <div key={pond.pondNumber} className="p-4 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-700 mb-2">บ่อที่ {pond.pondNumber}</div>
                <div className="flex flex-wrap items-center gap-4">
                  <input
                    type="number"
                    step="0.1"
                    value={pond.phValue}
                    onChange={(e) => handleSection3Change('beforeFeeding', idx, 'phValue', e.target.value)}
                    placeholder="ค่า pH"
                    className="w-24 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                  {renderPhRange(
                    pond.phInRange,
                    (v) => handleSection3Change('beforeFeeding', idx, 'phInRange', v),
                    `ph-before-${pond.pondNumber}`
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3.2 After Feeding */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">3.2 ค่า pH หลังให้สารอาหาร 1 ชั่วโมง</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {section3Data.afterFeeding.map((pond, idx) => (
              <div key={pond.pondNumber} className="p-4 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-700 mb-2">บ่อที่ {pond.pondNumber}</div>
                <div className="flex flex-wrap items-center gap-4">
                  <input
                    type="number"
                    step="0.1"
                    value={pond.phValue}
                    onChange={(e) => handleSection3Change('afterFeeding', idx, 'phValue', e.target.value)}
                    placeholder="ค่า pH"
                    className="w-24 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                  {renderPhRange(
                    pond.phInRange,
                    (v) => handleSection3Change('afterFeeding', idx, 'phInRange', v),
                    `ph-after-${pond.pondNumber}`
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 4: Fertilizer/Nutrients */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-6">
        <div className="flex items-center mb-4 pb-3 border-b-2 border-emerald-200">
          <span className="bg-emerald-600 text-white w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-bold mr-3 text-lg sm:text-xl shadow-md">4</span>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            การใส่ปุ๋ย / สารอาหาร (ตารางบันทึกทีละบ่อ)
          </h2>
        </div>

        {/* Nutrients Table */}
        <div className="overflow-x-auto mb-6">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 text-sm">บ่อ</th>
                <th className="border border-gray-300 p-2 text-sm">PSB</th>
                <th className="border border-gray-300 p-2 text-sm">PSB (ซีซี)</th>
                <th className="border border-gray-300 p-2 text-sm">ถั่วลิสง</th>
                <th className="border border-gray-300 p-2 text-sm">ถั่วเหลือง (ซีซี)</th>
                <th className="border border-gray-300 p-2 text-sm">ผลไม้</th>
                <th className="border border-gray-300 p-2 text-sm">ผลไม้ (ซีซี)</th>
                <th className="border border-gray-300 p-2 text-sm">ฮอร์โมน</th>
                <th className="border border-gray-300 p-2 text-sm">ฮอร์โมน (ซีซี)</th>
                <th className="border border-gray-300 p-2 text-sm">น้ำมะพร้าว</th>
                <th className="border border-gray-300 p-2 text-sm">น้ำมะพร้าว (ซีซี)</th>
              </tr>
            </thead>
            <tbody>
              {section4Data.ponds.map((pond, idx) => (
                <tr key={pond.pondNumber}>
                  <td className="border border-gray-300 p-2 text-center font-medium">บ่อ {pond.pondNumber}</td>
                  <td className="border border-gray-300 p-2 text-center">
                    <input
                      type="checkbox"
                      checked={pond.psb.checked}
                      onChange={(e) => handleSection4Change(idx, 'psb', 'checked', e.target.checked)}
                      className="w-5 h-5"
                    />
                  </td>
                  <td className="border border-gray-300 p-2">
                    <select
                      value={pond.psb.quantity}
                      onChange={(e) => handleSection4Change(idx, 'psb', 'quantity', e.target.value)}
                      className="w-full p-1 border border-gray-300 rounded text-sm"
                      disabled={!pond.psb.checked}
                    >
                      <option value="">-</option>
                      {PSB_QUANTITIES.map(q => (
                        <option key={q} value={q}>{q}</option>
                      ))}
                    </select>
                  </td>
                  <td className="border border-gray-300 p-2 text-center">
                    <input
                      type="checkbox"
                      checked={pond.peanut.checked}
                      onChange={(e) => handleSection4Change(idx, 'peanut', 'checked', e.target.checked)}
                      className="w-5 h-5"
                    />
                  </td>
                  <td className="border border-gray-300 p-2">
                    <select
                      value={pond.soybean.quantity}
                      onChange={(e) => handleSection4Change(idx, 'soybean', 'quantity', e.target.value)}
                      className="w-full p-1 border border-gray-300 rounded text-sm"
                    >
                      <option value="">-</option>
                      {NUTRIENT_QUANTITIES.map(q => (
                        <option key={q} value={q}>{q}</option>
                      ))}
                    </select>
                  </td>
                  <td className="border border-gray-300 p-2 text-center">
                    <input
                      type="checkbox"
                      checked={pond.fruit.checked}
                      onChange={(e) => handleSection4Change(idx, 'fruit', 'checked', e.target.checked)}
                      className="w-5 h-5"
                    />
                  </td>
                  <td className="border border-gray-300 p-2">
                    <select
                      value={pond.fruit.quantity}
                      onChange={(e) => handleSection4Change(idx, 'fruit', 'quantity', e.target.value)}
                      className="w-full p-1 border border-gray-300 rounded text-sm"
                      disabled={!pond.fruit.checked}
                    >
                      <option value="">-</option>
                      {NUTRIENT_QUANTITIES.map(q => (
                        <option key={q} value={q}>{q}</option>
                      ))}
                    </select>
                  </td>
                  <td className="border border-gray-300 p-2 text-center">
                    <input
                      type="checkbox"
                      checked={pond.hormone.checked}
                      onChange={(e) => handleSection4Change(idx, 'hormone', 'checked', e.target.checked)}
                      className="w-5 h-5"
                    />
                  </td>
                  <td className="border border-gray-300 p-2">
                    <select
                      value={pond.hormone.quantity}
                      onChange={(e) => handleSection4Change(idx, 'hormone', 'quantity', e.target.value)}
                      className="w-full p-1 border border-gray-300 rounded text-sm"
                      disabled={!pond.hormone.checked}
                    >
                      <option value="">-</option>
                      {NUTRIENT_QUANTITIES.map(q => (
                        <option key={q} value={q}>{q}</option>
                      ))}
                    </select>
                  </td>
                  <td className="border border-gray-300 p-2 text-center">
                    <input
                      type="checkbox"
                      checked={pond.coconutWater.checked}
                      onChange={(e) => handleSection4Change(idx, 'coconutWater', 'checked', e.target.checked)}
                      className="w-5 h-5"
                    />
                  </td>
                  <td className="border border-gray-300 p-2">
                    <select
                      value={pond.coconutWater.quantity}
                      onChange={(e) => handleSection4Change(idx, 'coconutWater', 'quantity', e.target.value)}
                      className="w-full p-1 border border-gray-300 rounded text-sm"
                      disabled={!pond.coconutWater.checked}
                    >
                      <option value="">-</option>
                      {NUTRIENT_QUANTITIES.map(q => (
                        <option key={q} value={q}>{q}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Instructions */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h4 className="font-semibold text-amber-800 mb-2">
            <i className="ri-information-line mr-2"></i>
            การใส่ปุ๋ย / สารอาหารแบบฉีดพ่นต้องทำตามขั้นตอนดังนี้เท่านั้น
          </h4>
          <ol className="list-decimal list-inside text-sm text-amber-700 space-y-1">
            <li>พ่นสารอาหารในปริมาณ 1-1.25 ลิตรต่อบ่อขนาด 3 ตารางเมตร หรือคิดเป็น 410 มล./ตารางเมตร</li>
            <li>ผสมสารอาหารกับน้ำในสัดส่วนที่กำหนดเท่านั้น</li>
            <li>จะต้องพ่น 1 วัน เว้น 2 วัน เท่านั้น และให้จุลินทรีย์สังเคราะห์แสง 500 ml ลงบ่อเพาะเลี้ยงโดยตรงทุกบ่อ</li>
            <li>พ่นสารอาหารในช่วงเวลาไม่เกิน 16.00-19.00 เท่านั้น</li>
            <li>ให้ฮอร์โมนสารเร่งหลังการเก็บเกี่ยวผลผลิตทุกครั้ง</li>
            <li>วันที่มีการเก็บเกี่ยวหลังจากตักผ้าออกแล้วจะต้องให้ฮอร์โมนสารเร่งเพิ่มเป็น 5 ปั๊ม ทุกครั้ง</li>
          </ol>
        </div>
      </div>

      {/* Section 5: Water Fern Characteristics */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-6">
        <div className="flex items-center mb-4 pb-3 border-b-2 border-emerald-200">
          <span className="bg-emerald-600 text-white w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-bold mr-3 text-lg sm:text-xl shadow-md">5</span>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            ลักษณะไข่น้ำอินทรีย์
          </h2>
        </div>

        {section5Data.ponds.map((pond, pondIdx) => (
          <div key={pond.pondNumber} className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-bold text-gray-900 mb-4 text-lg">บ่อที่ {pond.pondNumber}</h3>
            
            {/* 5.1 Color */}
            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">5.1 สีของไข่น้ำ (เลือกได้มากกว่า 1 ข้อ)</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {COLOR_OPTIONS.map(option => (
                  <label key={option.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pond.colors.includes(option.id)}
                      onChange={() => handleSection5MultiSelect(pondIdx, 'colors', option.id)}
                      className="w-4 h-4 text-emerald-600"
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 5.2 Foam */}
            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">5.2 การเกิดฟอง</h4>
              <div className="flex flex-wrap gap-4">
                {FOAM_OPTIONS.map(option => (
                  <label key={option.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name={`foam-${pond.pondNumber}`}
                      checked={pond.foam === option.id}
                      onChange={() => handleSection5Change(pondIdx, 'foam', option.id)}
                      className="w-4 h-4 text-emerald-600"
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 5.3 Smell */}
            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">5.3 กลิ่น</h4>
              <div className="flex flex-wrap gap-4">
                {SMELL_OPTIONS.map(option => (
                  <label key={option.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name={`smell-${pond.pondNumber}`}
                      checked={pond.smell === option.id}
                      onChange={() => handleSection5Change(pondIdx, 'smell', option.id)}
                      className="w-4 h-4 text-emerald-600"
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 5.4 Sinking */}
            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">5.4 การจม</h4>
              <div className="flex flex-wrap gap-4">
                {SINKING_OPTIONS.map(option => (
                  <label key={option.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name={`sinking-${pond.pondNumber}`}
                      checked={pond.sinking === option.id}
                      onChange={() => handleSection5Change(pondIdx, 'sinking', option.id)}
                      className="w-4 h-4 text-emerald-600"
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 5.5 Overall */}
            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">5.5 ลักษณะโดยรวม</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {OVERALL_OPTIONS.map(option => (
                  <label key={option.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pond.overall.includes(option.id)}
                      onChange={() => handleSection5MultiSelect(pondIdx, 'overall', option.id)}
                      className="w-4 h-4 text-emerald-600"
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
              <div className="mt-3">
                <label className="block text-sm text-gray-600 mb-1">ระบุเพิ่มเติมหากเจอกรณีอื่น ๆ</label>
                <input
                  type="text"
                  value={pond.overallNotes}
                  onChange={(e) => handleSection5Change(pondIdx, 'overallNotes', e.target.value)}
                  placeholder="ระบุลักษณะอื่น ๆ ที่พบ..."
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>
            </div>

            {/* 5.6 Contaminants */}
            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">5.6 สิ่งเจือปน</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {CONTAMINANT_OPTIONS.map(option => (
                  <label key={option.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pond.contaminants.includes(option.id)}
                      onChange={() => handleSection5MultiSelect(pondIdx, 'contaminants', option.id)}
                      className="w-4 h-4 text-emerald-600"
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
              {pond.contaminants.includes('other') && (
                <input
                  type="text"
                  value={pond.otherContaminant}
                  onChange={(e) => handleSection5Change(pondIdx, 'otherContaminant', e.target.value)}
                  placeholder="ระบุสิ่งเจือปนอื่น ๆ"
                  className="mt-2 w-full md:w-1/2 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              )}
            </div>

            {/* Additional Notes */}
            <div>
              <h4 className="font-medium text-gray-700 mb-2">ระบุเพิ่มเติมหากเจอกรณีอื่น ๆ</h4>
              <textarea
                value={pond.otherNotes}
                onChange={(e) => handleSection5Change(pondIdx, 'otherNotes', e.target.value)}
                placeholder="หมายเหตุเพิ่มเติม..."
                rows={2}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Section 6: Harvest */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-6">
        <div className="flex items-center mb-4 pb-3 border-b-2 border-emerald-200">
          <span className="bg-emerald-600 text-white w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-bold mr-3 text-lg sm:text-xl shadow-md">6</span>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            การเก็บเกี่ยว (นับเฉพาะวันที่กรอกข้อมูล)
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-3 text-sm">บ่อ</th>
                <th className="border border-gray-300 p-3 text-sm">กก.</th>
                <th className="border border-gray-300 p-3 text-sm">ขายให้ใคร</th>
                <th className="border border-gray-300 p-3 text-sm">จำนวน</th>
                <th className="border border-gray-300 p-3 text-sm">ราคา</th>
                <th className="border border-gray-300 p-3 text-sm">รายได้</th>
              </tr>
            </thead>
            <tbody>
              {section6Data.ponds.map((pond, idx) => (
                <tr key={pond.pondNumber}>
                  <td className="border border-gray-300 p-2 text-center font-medium bg-gray-50">
                    {pond.pondNumber}
                  </td>
                  <td className="border border-gray-300 p-2">
                    <input
                      type="number"
                      step="0.1"
                      value={pond.weight}
                      onChange={(e) => handleSection6Change(idx, 'weight', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500"
                      placeholder="น้ำหนัก"
                    />
                  </td>
                  <td className="border border-gray-300 p-2">
                    <input
                      type="text"
                      value={pond.soldTo}
                      onChange={(e) => handleSection6Change(idx, 'soldTo', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500"
                      placeholder="ชื่อผู้ซื้อ"
                    />
                  </td>
                  <td className="border border-gray-300 p-2">
                    <input
                      type="number"
                      step="0.1"
                      value={pond.quantity}
                      onChange={(e) => handleSection6Change(idx, 'quantity', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500"
                      placeholder="จำนวน"
                    />
                  </td>
                  <td className="border border-gray-300 p-2">
                    <input
                      type="number"
                      step="0.01"
                      value={pond.price}
                      onChange={(e) => handleSection6Change(idx, 'price', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500"
                      placeholder="ราคา/หน่วย"
                    />
                  </td>
                  <td className="border border-gray-300 p-2 bg-green-50">
                    <input
                      type="text"
                      value={pond.revenue ? `฿${parseFloat(pond.revenue).toLocaleString()}` : ''}
                      readOnly
                      className="w-full p-2 bg-green-50 border-0 font-medium text-green-700"
                      placeholder="รายได้"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-emerald-100">
                <td colSpan="5" className="border border-gray-300 p-3 text-right font-bold">
                  รวมรายได้ทั้งหมด:
                </td>
                <td className="border border-gray-300 p-3 font-bold text-emerald-700 text-lg">
                  ฿{section6Data.ponds
                    .reduce((sum, pond) => sum + (parseFloat(pond.revenue) || 0), 0)
                    .toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 mb-20">
        {isEditMode && (
          <button
            onClick={resetToNewRecord}
            className="w-full sm:w-auto bg-gray-500 hover:bg-gray-600 active:bg-gray-700 text-white font-bold py-4 sm:py-5 px-6 sm:px-8 rounded-xl transition-all flex items-center justify-center text-lg sm:text-xl shadow-lg hover:shadow-xl active:scale-95"
          >
            <i className="ri-close-line mr-2 text-xl sm:text-2xl"></i>
            ยกเลิกแก้ไข
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`w-full sm:w-auto ${
            isEditMode 
              ? 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800' 
              : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
          } text-white font-bold py-4 sm:py-5 px-8 sm:px-12 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center text-lg sm:text-xl shadow-lg hover:shadow-xl active:scale-95`}
        >
          {isSaving ? (
            <>
              <i className="ri-loader-4-line animate-spin mr-2 text-xl sm:text-2xl"></i>
              {isEditMode ? 'กำลังอัปเดต...' : 'กำลังบันทึก...'}
            </>
          ) : (
            <>
              <i className={`${isEditMode ? 'ri-refresh-line' : 'ri-save-line'} mr-2 text-xl sm:text-2xl`}></i>
              {isEditMode ? 'อัปเดตข้อมูล' : 'บันทึกข้อมูล'}
            </>
          )}
        </button>
      </div>
    </div>
  )
}

export default DailyRecord

