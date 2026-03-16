'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Edit, Trash2, QrCode, Download } from 'lucide-react'
import { STATUS_COLORS, STATUS_LABELS, formatDate } from '@/lib/utils'
import { useMemo, useState } from 'react'

export default function DeviceDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [showQR, setShowQR] = useState(false)
  const [assignPersonnelId, setAssignPersonnelId] = useState('')
  const [personnelSearch, setPersonnelSearch] = useState('')
  const [showPersonnelOptions, setShowPersonnelOptions] = useState(false)
  const [assignNotes, setAssignNotes] = useState('')
  const [deleteError, setDeleteError] = useState('')

  const { data: device, isLoading } = useQuery({
    queryKey: ['device', params.id],
    queryFn: async () => (await api.get(`/devices/${params.id}`)).data,
  })

  const { data: personnel = [] } = useQuery({
    queryKey: ['personnel'],
    queryFn: async () => (await api.get('/personnel')).data,
  })

  const deleteMutation = useMutation({
    mutationFn: async () => api.delete(`/devices/${params.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] })
      router.push('/devices')
    },
    onError: (err: any) => setDeleteError(err.response?.data?.error || 'Delete failed'),
  })

  const assignMutation = useMutation({
    mutationFn: async () => api.post('/assignments', {
      deviceId: params.id,
      personnelId: assignPersonnelId,
      notes: assignNotes,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device', params.id] })
      queryClient.invalidateQueries({ queryKey: ['devices'] })
      setAssignPersonnelId('')
      setPersonnelSearch('')
      setAssignNotes('')
    },
  })

  const returnMutation = useMutation({
    mutationFn: async (assignmentId: string) => api.patch(`/assignments/${assignmentId}/return`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device', params.id] })
      queryClient.invalidateQueries({ queryKey: ['devices'] })
    },
  })

  const filteredPersonnel = useMemo(() => {
    const allPersonnel = personnel as any[]
    const q = personnelSearch.trim().toLowerCase()

    if (!q) return allPersonnel.slice(0, 12)

    return allPersonnel
      .filter((p: any) => {
        const name = (p.name || '').toLowerCase()
        const department = (p.department?.name || '').toLowerCase()
        return name.includes(q) || department.includes(q)
      })
      .slice(0, 12)
  }, [personnel, personnelSearch])

  function selectPersonnel(p: any) {
    const departmentName = p.department?.name || '—'
    setAssignPersonnelId(p.id)
    setPersonnelSearch(`${p.name} (${departmentName})`)
    setShowPersonnelOptions(false)
  }

  if (isLoading) return <div className="p-8 text-slate-400">Loading...</div>
  if (!device) return <div className="p-8 text-slate-400">Device not found</div>

  const activeAssignment = device.assignments?.find((a: any) => a.isActive)

  function downloadQR() {
    if (!device.qrCodeUrl) return
    const a = document.createElement('a')
    a.href = device.qrCodeUrl
    a.download = `qr-${device.serialNumber}.png`
    a.click()
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-4xl">
      {deleteError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 text-sm">{deleteError}</div>
      )}

      <div className="flex items-center justify-between gap-3">
        <Link href="/devices" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft size={16} /> Back
        </Link>
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => setShowQR(v => !v)}
            className={`flex items-center gap-2 px-3 py-1.5 border rounded-xl text-sm hover:bg-slate-50 transition ${
              showQR ? 'border-slate-900 bg-slate-50' : 'border-slate-200'
            }`}
          >
            <QrCode size={16} /> <span className="hidden sm:inline">QR Code</span>
          </button>
          <Link href={`/devices/${params.id}/edit`}
            className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-xl text-sm hover:bg-slate-50">
            <Edit size={16} /> <span className="hidden sm:inline">Edit</span>
          </Link>
          <button onClick={() => { if (confirm('Delete this device?')) deleteMutation.mutate() }}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm hover:bg-red-100">
            <Trash2 size={16} /> <span className="hidden sm:inline">Delete</span>
          </button>
        </div>
      </div>

      {/* QR Panel */}
      {showQR && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col sm:flex-row items-center gap-6">
          {device.qrCodeUrl ? (
            <>
              <img src={device.qrCodeUrl} alt="QR Code" className="w-36 h-36 rounded-xl border border-slate-100 shrink-0" />
              <div>
                <p className="font-semibold text-slate-900 mb-1">Device QR Code</p>
                <p className="text-sm text-slate-500 mb-4">
                  Yazdırıp cihaza yapıştırın. QR kodu okutunca herkes cihaz bilgilerini görebilir.
                </p>
                <button
                  onClick={downloadQR}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition"
                >
                  <Download size={15} /> Download QR
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-400">Bu cihaz için QR kod henüz oluşturulmamış.</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
            <div className="flex items-start justify-between mb-4 gap-3">
              <div className="min-w-0">
                <h1 className="text-2xl font-bold text-slate-900">{device.name}</h1>
                <p className="text-slate-500 text-sm mt-1">
                  {device.brand?.name && <>{device.brand.name} · </>}
                  {device.category?.name}
                </p>
              </div>
              <span className={`shrink-0 px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[device.status]}`}>
                {STATUS_LABELS[device.status]}
              </span>
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <dt className="text-xs text-slate-400">Serial Number</dt>
                <dd className="font-mono text-sm text-slate-900 break-all">{device.serialNumber}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Purchase Date</dt>
                <dd className="text-sm text-slate-900">{formatDate(device.purchaseDate)}</dd>
              </div>
              {device.notes && (
                <div className="sm:col-span-2">
                  <dt className="text-xs text-slate-400">Notes</dt>
                  <dd className="text-sm text-slate-900">{device.notes}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Custom Fields */}
          {device.customValues?.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
              <h2 className="font-semibold text-slate-900 mb-3">Specifications</h2>
              <dl className="space-y-2">
                {device.customValues.map((cv: any) => (
                  <div key={cv.id} className="flex justify-between py-1.5 border-b border-slate-50 last:border-0">
                    <dt className="text-sm text-slate-500">{cv.customField.label}</dt>
                    <dd className="text-sm font-medium text-slate-900">
                      {cv.value === 'true' ? 'Yes' : cv.value === 'false' ? 'No' : cv.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* Assignment History */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
            <h2 className="font-semibold text-slate-900 mb-3">Assignment History</h2>
            {device.assignments?.length === 0 ? (
              <p className="text-sm text-slate-400">No assignment history</p>
            ) : (
              <div className="space-y-2">
                {device.assignments?.map((a: any) => (
                  <div key={a.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 border-b border-slate-50 last:border-0 gap-1.5">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{a.personnel?.name}</p>
                      <p className="text-xs text-slate-400">{a.personnel?.department?.name || '—'} · {formatDate(a.assignedAt)}</p>
                    </div>
                    {a.isActive ? (
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">Active</span>
                        <button onClick={() => returnMutation.mutate(a.id)} className="text-xs text-red-600 hover:underline">
                          Return
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">Returned {formatDate(a.returnedAt)}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {!activeAssignment && device.status !== 'RETIRED' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-900 mb-3 text-sm">Assign Device</h3>
              <div className="space-y-2">
                <div className="relative">
                  <input
                    value={personnelSearch}
                    onFocus={() => setShowPersonnelOptions(true)}
                    onBlur={() => setShowPersonnelOptions(false)}
                    onChange={e => {
                      setPersonnelSearch(e.target.value)
                      setAssignPersonnelId('')
                      setShowPersonnelOptions(true)
                    }}
                    placeholder="Search person or department"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />

                  {showPersonnelOptions && (
                    <div className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                      {filteredPersonnel.length > 0 ? (
                        filteredPersonnel.map((p: any) => (
                          <button
                            key={p.id}
                            type="button"
                            onMouseDown={e => {
                              e.preventDefault()
                              selectPersonnel(p)
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
                          >
                            <span className="font-medium text-slate-900">{p.name}</span>
                            <span className="text-slate-500"> ({p.department?.name || '—'})</span>
                          </button>
                        ))
                      ) : (
                        <p className="px-3 py-2 text-sm text-slate-500">No personnel found</p>
                      )}
                    </div>
                  )}
                </div>

                {assignPersonnelId && (
                  <p className="text-xs text-green-700">Person selected.</p>
                )}

                <input value={assignNotes} onChange={e => setAssignNotes(e.target.value)}
                  placeholder="Notes (optional)"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
                <button
                  onClick={() => assignPersonnelId && assignMutation.mutate()}
                  disabled={!assignPersonnelId || assignMutation.isPending}
                  className="w-full bg-slate-900 text-white rounded-xl py-2 text-sm font-medium hover:bg-slate-800 transition disabled:opacity-50">
                  {assignMutation.isPending ? 'Assigning...' : 'Assign'}
                </button>
              </div>
            </div>
          )}

          {activeAssignment && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-1">Currently Assigned</p>
              <p className="font-semibold text-slate-900">{activeAssignment.personnel?.name}</p>
              <p className="text-sm text-slate-500">{activeAssignment.personnel?.department?.name || '—'}</p>
              <p className="text-xs text-slate-400 mt-1">Since {formatDate(activeAssignment.assignedAt)}</p>
              <button
                onClick={() => returnMutation.mutate(activeAssignment.id)}
                className="mt-3 w-full text-xs text-red-600 border border-red-200 bg-white rounded-xl py-1.5 hover:bg-red-50 transition"
              >
                Return Device
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
