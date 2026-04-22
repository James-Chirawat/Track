import { useCallback, useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { apiClient } from '../lib/api'
import QRCode from 'react-qr-code'
import { createProductUrl } from '../lib/qr'
import labCertificate1 from '../assets/certificates/lab1.png'
import labCertificate2 from '../assets/certificates/lab2.png'
import labCertificate3 from '../assets/certificates/lab3.png'

const MOCK_BATCH = {
  batchNumber: 'LOT-INKNAAM-2569-001',
  productionDate: '25/4/2569',
  enterpriseName: 'วิสาหกิจชุมชนรักษ์ดินทอง'
}

const SOP_DAYS = [
  {
    day: 0,
    icon: 'ri-seedling-line',
    tone: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    activity: 'ลงแม่พันธุ์ 900 กรัม'
  },
  { day: 1 },
  { day: 2 },
  {
    day: 3,
    icon: 'ri-restaurant-line',
    tone: 'bg-sky-100 text-sky-700 border-sky-200',
    activity: 'ให้อาหารสูตร T2 ครั้งที่ 1 900 มล'
  },
  { day: 4 },
  {
    day: 5,
    icon: 'ri-test-tube-line',
    tone: 'bg-violet-100 text-violet-700 border-violet-200',
    activity: 'ตรวจค่า PH : 7.5 EC : 350 TDS : 200'
  },
  { day: 6 },
  {
    day: 7,
    icon: 'ri-restaurant-line',
    tone: 'bg-sky-100 text-sky-700 border-sky-200',
    activity: 'ให้อาหารสูตร T2 ครั้งที่ 2 900 มล'
  },
  {
    day: 8,
    icon: 'ri-test-tube-line',
    tone: 'bg-violet-100 text-violet-700 border-violet-200',
    activity: 'ตรวจค่า PH : 7.7 EC : 450 TDS : 250'
  },
  { day: 9 },
  { day: 10 },
  {
    day: 11,
    icon: 'ri-restaurant-line',
    tone: 'bg-sky-100 text-sky-700 border-sky-200',
    activity: 'ให้อาหารสูตร T2 ครั้งที่ 3 900 มล'
  },
  { day: 12 },
  {
    day: 13,
    icon: 'ri-drop-line',
    tone: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    activity: 'ตรวจค่า PH : 7.8 EC : 470 TDS : 300 และพักน้ำหยุดให้อาหารรอเก็บเกี่ยว'
  },
  {
    day: 14,
    icon: 'ri-scissors-cut-line',
    tone: 'bg-lime-100 text-lime-700 border-lime-200',
    activity: 'เก็บเกี่ยวผลผลิต 25/4/2569'
  }
]

const CERTIFICATES = [
  {
    title: 'ผลตรวจ Lab 1',
    image: labCertificate1
  },
  {
    title: 'ผลตรวจ Lab 2',
    image: labCertificate2
  },
  {
    title: 'ผลตรวจ Lab 3',
    image: labCertificate3
  }
]

const LAB_RESULTS = [
  { label: 'pH ล่าสุด', value: '7.8', status: 'ผ่านเกณฑ์' },
  { label: 'EC ล่าสุด', value: '470', status: 'เหมาะสม' },
  { label: 'TDS ล่าสุด', value: '300', status: 'เหมาะสม' },
  { label: 'ผลสรุป Lab', value: 'ไม่พบสารตกค้าง', status: 'ปลอดภัย' }
]

const ProductDetails = () => {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showQR, setShowQR] = useState(false)

  const fetchProductDetails = useCallback(async () => {
    try {
      setLoading(true)

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 6000)
      )

      try {
        const apiPromise = apiClient.getProduct(id)
        const response = await Promise.race([apiPromise, timeoutPromise])

        if (response?.success) {
          setProduct(response.data.product)
          return
        }
      } catch (err) {
        console.error('Error fetching product details via API:', err)
      }

      try {
        const { data, error } = await supabase
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

        if (!error) {
          setProduct(data)
        }
      } catch (err) {
        console.error('Error fetching product details via Supabase:', err)
      }
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (id) {
      fetchProductDetails()
    }
  }, [fetchProductDetails, id])

  const batchInfo = {
    batchNumber: product?.batch_number || MOCK_BATCH.batchNumber,
    productionDate: MOCK_BATCH.productionDate,
    enterpriseName: product?.branches?.name || MOCK_BATCH.enterpriseName
  }
  const productUrl = createProductUrl(id)

  return (
    <div className="min-h-screen bg-stone-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-emerald-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-md items-center px-4">
          <i className="ri-qr-scan-2-line mr-2 text-xl text-emerald-700"></i>
          <h1 className="truncate text-base font-bold">ข้อมูลหลังสแกน QR Code</h1>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-4">
        {loading ? (
          <div className="flex min-h-48 items-center justify-center rounded-lg border border-emerald-100 bg-white">
            <div className="text-center">
              <i className="ri-loader-4-line mb-3 block text-3xl text-emerald-700 animate-spin"></i>
              <p className="text-sm text-slate-600">กำลังโหลดข้อมูลล็อตการผลิต...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <section className="overflow-hidden rounded-lg border border-emerald-100 bg-white shadow-sm">
              <div className="bg-emerald-700 px-4 py-4 text-white">
                <p className="text-xs font-medium uppercase tracking-wide text-emerald-100">ล็อตการผลิต</p>
                <h2 className="mt-1 text-xl font-bold leading-tight">{batchInfo.batchNumber}</h2>
              </div>
              <div className="grid grid-cols-1 gap-3 p-4 text-sm">
                <div className="flex items-start gap-3">
                  <i className="ri-calendar-check-line mt-0.5 text-lg text-emerald-700"></i>
                  <div>
                    <p className="font-semibold">วันที่ {batchInfo.productionDate}</p>
                    <p className="text-slate-500">วันอ้างอิงของล็อตการผลิต</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <i className="ri-community-line mt-0.5 text-lg text-emerald-700"></i>
                  <div>
                    <p className="font-semibold">{batchInfo.enterpriseName}</p>
                    <p className="text-slate-500">วิสาหกิจชุมชนผู้ผลิต</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-emerald-700">SOP</p>
                  <h2 className="text-lg font-bold">กระบวนการเลี้ยงไข่น้ำอินทรีย์</h2>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <i className="ri-leaf-line text-xl"></i>
                </div>
              </div>

              <div className="space-y-2">
                {SOP_DAYS.map((item) => {
                  const hasActivity = Boolean(item.activity)
                  const icon = item.icon || 'ri-checkbox-blank-circle-line'
                  const tone = item.tone || 'bg-slate-100 text-slate-400 border-slate-200'

                  return (
                    <div
                      key={item.day}
                      className={`flex gap-3 rounded-lg border p-3 ${
                        hasActivity ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50'
                      }`}
                    >
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${tone}`}>
                        <i className={`${icon} text-lg`}></i>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-bold">Day {item.day}</h3>
                          {!hasActivity && (
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">
                              ไม่มีกิจกรรม
                            </span>
                          )}
                        </div>
                        {hasActivity && (
                          <p className="mt-1 text-sm leading-6 text-slate-700">{item.activity}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <i className="ri-award-line text-xl text-amber-600"></i>
                <h2 className="text-lg font-bold">ใบรับรอง</h2>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {CERTIFICATES.map((certificate) => (
                  <figure key={certificate.title} className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                    <img
                      src={certificate.image}
                      alt={certificate.title}
                      className="w-full rounded-md border border-white object-contain shadow-sm"
                    />
                    <figcaption className="mt-2 text-center text-xs font-semibold leading-5 text-slate-700">
                      {certificate.title}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <i className="ri-flask-line text-xl text-violet-700"></i>
                <h2 className="text-lg font-bold">ผล Lab</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {LAB_RESULTS.map((result) => (
                  <div key={result.label} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-semibold text-slate-500">{result.label}</p>
                    <p className="mt-1 text-lg font-bold text-slate-900">{result.value}</p>
                    <p className="mt-1 text-xs text-emerald-700">{result.status}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-4 text-center shadow-sm">
              <div className="flex gap-2">
                <button
                  onClick={() => setShowQR(!showQR)}
                  className="flex-1 rounded-lg bg-slate-800 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-slate-900"
                >
                  <i className="ri-qr-code-line mr-2"></i>
                  {showQR ? 'ซ่อน QR' : 'แสดง QR'}
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex-1 rounded-lg bg-emerald-700 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-800"
                >
                  <i className="ri-printer-line mr-2"></i>
                  พิมพ์
                </button>
              </div>
              {showQR && (
                <div className="mt-4 border-t border-slate-200 pt-4">
                  <div className="inline-block rounded-lg border-2 border-slate-200 bg-white p-3">
                    <QRCode value={productUrl} size={132} />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">QR Code สำหรับล็อตนี้</p>
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  )
}

export default ProductDetails
