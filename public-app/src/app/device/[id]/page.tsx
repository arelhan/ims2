import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import DownloadCardButton from './DownloadCardButton'

interface CustomValue {
  value: string
  customField: { label: string; order: number; fieldType: string }
}

interface Assignment {
  assignedAt: string
  personnel: { name: string; department: { name: string } }
}

interface Device {
  id: string
  name: string
  serialNumber: string
  status: 'IN_WAREHOUSE' | 'ASSIGNED' | 'MAINTENANCE' | 'RETIRED'
  qrCodeUrl: string | null
  category: { name: string }
  brand: { name: string } | null
  customValues: CustomValue[]
  assignments: Assignment[]
}

async function getDevice(id: string): Promise<Device | null> {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000'
    const res = await fetch(`${backendUrl}/api/public/devices/${id}`, { cache: 'no-store' })
    if (!res.ok) return null
    return res.json()
  } catch (err) {
    console.error('[public-app] fetch error:', err)
    return null
  }
}

const statusConfig = {
  IN_WAREHOUSE: { label: 'In Warehouse', color: 'bg-blue-100 text-blue-800 border-blue-200', style: { background: '#dbeafe', color: '#1e40af', borderColor: '#bfdbfe' } },
  ASSIGNED:     { label: 'Assigned',     color: 'bg-green-100 text-green-800 border-green-200', style: { background: '#dcfce7', color: '#166534', borderColor: '#bbf7d0' } },
  MAINTENANCE:  { label: 'Maintenance',  color: 'bg-amber-100 text-amber-800 border-amber-200', style: { background: '#fef3c7', color: '#92400e', borderColor: '#fde68a' } },
  RETIRED:      { label: 'Retired',      color: 'bg-slate-100 text-slate-600 border-slate-200', style: { background: '#f1f5f9', color: '#475569', borderColor: '#e2e8f0' } },
}

export default async function DevicePage({ params }: { params: { id: string } }) {
  const device = await getDevice(params.id)
  if (!device) notFound()

  const status = statusConfig[device.status]
  const activeAssignment = device.assignments[0] || null
  const hostname = (headers().get('host') || 'localhost:3000').split(':')[0]
  const adminPort = process.env.FRONTEND_PORT || '3001'
  const frontendUrl = process.env.FRONTEND_URL || `http://${hostname}:${adminPort}`
  const adminDeviceUrl = `${frontendUrl}/devices/${device.id}`

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-800 rounded-xl mb-3">
            <span className="text-white text-xl">📦</span>
          </div>
          <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">Office Inventory</p>
          <a
            href={adminDeviceUrl}
            className="mt-3 inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Open In Admin Panel
          </a>
        </div>

        {/* Device Card */}
        <div id="device-card" className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Device Name & Brand */}
          <div className="p-6 border-b border-slate-100">
            <h1 className="text-2xl font-bold text-slate-900">{device.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              {device.brand && (
                <span className="text-slate-500 text-sm font-medium">{device.brand.name}</span>
              )}
              {device.brand && <span className="text-slate-300">·</span>}
              <span className="text-slate-500 text-sm">{device.category.name}</span>
            </div>
          </div>

          {/* Status Badge */}
          <div className="px-6 py-4 border-b border-slate-100">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${status.color} w-full`} style={status.style}>
              <span className="text-sm font-semibold" style={{ color: status.style.color }}>{status.label}</span>
              {activeAssignment && (
                <span className="ml-auto text-sm" style={{ color: status.style.color }}>
                  {activeAssignment.personnel.name} — {activeAssignment.personnel.department.name}
                </span>
              )}
            </div>
          </div>

          {/* Specifications */}
          <div className="p-6">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Specifications
            </h2>
            <dl className="space-y-2">
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <dt className="text-sm text-slate-500">Serial No.</dt>
                <dd className="text-sm font-medium text-slate-900 font-mono">{device.serialNumber}</dd>
              </div>
              {device.customValues.map((cv, i) => (
                <div key={i} className="flex justify-between py-1.5 border-b border-slate-50 last:border-0">
                  <dt className="text-sm text-slate-500">{cv.customField.label}</dt>
                  <dd className="text-sm font-medium text-slate-900">
                    {cv.customField.fieldType === 'BOOLEAN' ? (cv.value === 'true' ? 'Yes' : 'No') : cv.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* QR Code */}
          {device.qrCodeUrl && (
            <div className="px-6 pb-6">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                QR Code
              </h2>
              <div className="flex justify-center">
                <img
                  src={device.qrCodeUrl}
                  alt="Device QR Code"
                  className="w-32 h-32 rounded-lg border border-slate-200"
                />
              </div>
            </div>
          )}
        </div>

        <div className="mt-4">
          <DownloadCardButton deviceName={device.name} />
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Office Electronics Inventory System
        </p>
      </div>
    </div>
  )
}
