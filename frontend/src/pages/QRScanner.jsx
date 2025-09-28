import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import QrScanner from 'qr-scanner'

const QRScanner = () => {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState('')
  const [manualInput, setManualInput] = useState('')
  const videoRef = useRef(null)
  const scannerRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop()
      }
    }
  }, [])

  const startScanning = async () => {
    try {
      setError('')
      setIsScanning(true)

      if (!videoRef.current) {
        throw new Error('Video element not found')
      }

      scannerRef.current = new QrScanner(
        videoRef.current,
        (result) => {
          handleScanResult(result.data)
        },
        {
          onDecodeError: (err) => {
            console.log('Decode error:', err)
          },
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      )

      await scannerRef.current.start()
    } catch (err) {
      console.error('Error starting scanner:', err)
      setError('Failed to start camera. Please check permissions.')
      setIsScanning(false)
    }
  }

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.stop()
      scannerRef.current = null
    }
    setIsScanning(false)
  }

  const handleScanResult = (data) => {
    console.log('QR Code scanned:', data)
    stopScanning()
    
    // Extract product ID from URL
    try {
      const url = new URL(data)
      const pathParts = url.pathname.split('/')
      const productIndex = pathParts.indexOf('product')
      
      if (productIndex !== -1 && pathParts[productIndex + 1]) {
        const productId = pathParts[productIndex + 1]
        navigate(`/product/${productId}`)
      } else {
        setError('Invalid QR code format')
      }
    } catch (err) {
      setError('Invalid QR code format')
    }
  }

  const handleManualSubmit = (e) => {
    e.preventDefault()
    if (manualInput.trim()) {
      // Try to extract product ID from manual input
      try {
        if (manualInput.includes('/product/')) {
          const url = new URL(manualInput)
          const pathParts = url.pathname.split('/')
          const productIndex = pathParts.indexOf('product')
          const productId = pathParts[productIndex + 1]
          navigate(`/product/${productId}`)
        } else {
          // Assume it's a direct product ID
          navigate(`/product/${manualInput.trim()}`)
        }
      } catch (err) {
        // Assume it's a direct product ID
        navigate(`/product/${manualInput.trim()}`)
      }
    }
  }

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          สแกน QR Code
        </h1>
        <p className="text-gray-600">
          สแกน QR Code เพื่อดูประวัติการผลิตผำอินทรีย์ทั้งหมด
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Scanner Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            <i className="ri-qr-scan-line mr-2 text-blue-600"></i>
            สแกนด้วยกล้อง
          </h2>
          
          {!isScanning ? (
            <div className="text-center">
              <div className="bg-gray-100 rounded-lg p-8 mb-4">
                <i className="ri-camera-line text-6xl text-gray-400 mb-4"></i>
                <p className="text-gray-600 mb-4">
                  คลิกปุ่มด้านล่างเพื่อเริ่มสแกน QR Code
                </p>
                <button
                  onClick={startScanning}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  <i className="ri-camera-line mr-2"></i>
                  เปิดกล้อง
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="relative bg-black rounded-lg overflow-hidden mb-4">
                <video
                  ref={videoRef}
                  className="w-full h-64 object-cover"
                  playsInline
                />
                <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none">
                  <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-blue-500"></div>
                  <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-blue-500"></div>
                  <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-blue-500"></div>
                  <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-blue-500"></div>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                วาง QR Code ให้อยู่ในกรอบเพื่อสแกน
              </p>
              <button
                onClick={stopScanning}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                <i className="ri-stop-line mr-2"></i>
                หยุดกล้อง
              </button>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <i className="ri-error-warning-line text-red-500 mr-2"></i>
                <span className="text-red-700">{error}</span>
              </div>
            </div>
          )}
        </div>

        {/* Manual Input Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            <i className="ri-keyboard-line mr-2 text-green-600"></i>
            ป้อนข้อมูลด้วยตนเอง
          </h2>
          <p className="text-gray-600 mb-4">
            ป้อนรหัสผลิตภัณฑ์หรือ URL ด้วยตนเองหากไม่สามารถสแกน QR Code ได้
          </p>
          
          <form onSubmit={handleManualSubmit}>
            <div className="flex space-x-4">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="ป้อนรหัสผลิตภัณฑ์หรือ URL..."
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                <i className="ri-search-line mr-2"></i>
                ค้นหา
              </button>
            </div>
          </form>
        </div>

        {/* Instructions */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-amber-800 mb-3">
            <i className="ri-information-line mr-2"></i>
            วิธีการใช้งาน
          </h3>
          <ul className="space-y-2 text-amber-700">
            <li className="flex items-start">
              <i className="ri-checkbox-circle-line mr-2 mt-0.5 text-amber-600"></i>
              <span>ใช้กล้องสแกน QR Code บนผลิตภัณฑ์ผำอินทรีย์</span>
            </li>
            <li className="flex items-start">
              <i className="ri-checkbox-circle-line mr-2 mt-0.5 text-amber-600"></i>
              <span>อนุญาตการเข้าถึงกล้องเมื่อระบบขอสิทธิ์</span>
            </li>
            <li className="flex items-start">
              <i className="ri-checkbox-circle-line mr-2 mt-0.5 text-amber-600"></i>
              <span>วาง QR Code ให้อยู่ในกรอบกล้องอย่างชัดเจน</span>
            </li>
            <li className="flex items-start">
              <i className="ri-checkbox-circle-line mr-2 mt-0.5 text-amber-600"></i>
              <span>ใช้การป้อนข้อมูลด้วยตนเองหากกล้องไม่พร้อมใช้งาน</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default QRScanner
