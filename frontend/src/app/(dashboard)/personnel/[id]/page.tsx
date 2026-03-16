'use client'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { STATUS_COLORS, STATUS_LABELS, formatDate } from '@/lib/utils'

export default function PersonnelDetailPage({ params }: { params: { id: string } }) {
  const { data: person, isLoading } = useQuery({
    queryKey: ['personnel', params.id],
    queryFn: async () => (await api.get(`/personnel/${params.id}`)).data,
  })

  if (isLoading) return <div className="p-8 text-slate-400">Loading...</div>
  if (!person) return <div className="p-8 text-slate-400">Not found</div>

  const activeAssignments = person.assignments?.filter((a: any) => a.isActive) || []
  const history = person.assignments?.filter((a: any) => !a.isActive) || []

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-3xl">
      <Link href="/personnel" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft size={16} /> Back
      </Link>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
        <h1 className="text-2xl font-bold text-slate-900">{person.name}</h1>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <div>
            <p className="text-xs text-slate-400">Department</p>
            <p className="text-sm font-medium text-slate-900">{person.department?.name || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Email</p>
            <p className="text-sm font-medium text-slate-900 break-all">{person.email}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Phone</p>
            <p className="text-sm font-medium text-slate-900">{person.phone || '—'}</p>
          </div>
        </div>
      </div>

      {/* Active Devices */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
        <h2 className="font-semibold text-slate-900 mb-3">
          Currently Assigned Devices ({activeAssignments.length})
        </h2>
        {activeAssignments.length === 0 ? (
          <p className="text-sm text-slate-400">No active assignments</p>
        ) : (
          <div className="space-y-2">
            {activeAssignments.map((a: any) => (
              <div key={a.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 border-b border-slate-50 last:border-0 gap-1.5">
                <div>
                  <Link href={`/devices/${a.device?.id}`} className="text-sm font-medium text-slate-900 hover:underline">
                    {a.device?.name}
                  </Link>
                  <p className="text-xs text-slate-400">{a.device?.category?.name} · {a.device?.serialNumber}</p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[a.device?.status]}`}>
                    {STATUS_LABELS[a.device?.status]}
                  </span>
                  <span className="text-xs text-slate-400">Since {formatDate(a.assignedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
          <h2 className="font-semibold text-slate-900 mb-3">Assignment History ({history.length})</h2>
          <div className="space-y-2">
            {history.map((a: any) => (
              <div key={a.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 border-b border-slate-50 last:border-0 gap-1">
                <div>
                  <Link href={`/devices/${a.device?.id}`} className="text-sm font-medium text-slate-900 hover:underline">
                    {a.device?.name}
                  </Link>
                  <p className="text-xs text-slate-400">{a.device?.category?.name}</p>
                </div>
                <div className="text-xs text-slate-400 sm:text-right">
                  <p>{formatDate(a.assignedAt)}</p>
                  <p>→ {formatDate(a.returnedAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
