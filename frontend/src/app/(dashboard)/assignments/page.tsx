'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { useState } from 'react'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

export default function AssignmentsPage() {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState('true')

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['assignments', filter],
    queryFn: async () => (await api.get(`/assignments?isActive=${filter}`)).data,
  })

  const returnMutation = useMutation({
    mutationFn: async (id: string) => api.patch(`/assignments/${id}/return`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['assignments'] }),
  })

  const rows = assignments as any[]

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Assignments</h1>
        <p className="text-slate-500 text-sm mt-0.5">Device assignment audit log</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { value: 'true', label: 'Active' },
          { value: 'false', label: 'Returned' },
          { value: '', label: 'All' },
        ].map(opt => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`px-4 py-1.5 rounded-xl text-sm font-medium transition ${
              filter === opt.value
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {isLoading ? <div className="p-8 text-center text-slate-400">Loading...</div> :
          rows.length === 0 ? <div className="p-12 text-center text-slate-400">No assignments found</div> : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Device</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Personnel</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Returned</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {rows.map((a: any) => (
                      <tr key={a.id} className="hover:bg-slate-50 transition">
                        <td className="px-6 py-3">
                          <Link href={`/devices/${a.device?.id}`} className="text-sm font-medium text-slate-900 hover:underline">
                            {a.device?.name}
                          </Link>
                          <p className="text-xs text-slate-400 font-mono">{a.device?.serialNumber}</p>
                        </td>
                        <td className="px-6 py-3">
                          <Link href={`/personnel/${a.personnel?.id}`} className="text-sm font-medium text-slate-900 hover:underline">
                            {a.personnel?.name}
                          </Link>
                          <p className="text-xs text-slate-400">{a.personnel?.department?.name || '—'}</p>
                        </td>
                        <td className="px-6 py-3 text-sm text-slate-600">{formatDate(a.assignedAt)}</td>
                        <td className="px-6 py-3 text-sm text-slate-400">{a.returnedAt ? formatDate(a.returnedAt) : '—'}</td>
                        <td className="px-6 py-3">
                          {a.isActive
                            ? <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-medium">Active</span>
                            : <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">Returned</span>
                          }
                        </td>
                        <td className="px-6 py-3 text-right">
                          {a.isActive && (
                            <button onClick={() => returnMutation.mutate(a.id)} className="text-xs text-red-600 hover:underline">
                              Return
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile card list */}
              <div className="md:hidden divide-y divide-slate-100">
                {rows.map((a: any) => (
                  <div key={a.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link href={`/devices/${a.device?.id}`} className="text-sm font-semibold text-slate-900 hover:underline">
                          {a.device?.name}
                        </Link>
                        <p className="text-xs font-mono text-slate-400">{a.device?.serialNumber}</p>
                      </div>
                      {a.isActive
                        ? <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-medium shrink-0">Active</span>
                        : <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-medium shrink-0">Returned</span>
                      }
                    </div>
                    <div className="flex items-center justify-between">
                      <Link href={`/personnel/${a.personnel?.id}`} className="text-sm text-slate-700 hover:underline">
                        {a.personnel?.name}
                        <span className="text-slate-400 ml-1">({a.personnel?.department?.name || '—'})</span>
                      </Link>
                      {a.isActive && (
                        <button onClick={() => returnMutation.mutate(a.id)} className="text-xs text-red-600 hover:underline shrink-0">
                          Return
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      {formatDate(a.assignedAt)}{a.returnedAt ? ` → ${formatDate(a.returnedAt)}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
      </div>
    </div>
  )
}
