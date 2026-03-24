'use client'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { STATUS_COLORS, STATUS_LABELS, formatDate } from '@/lib/utils'

export default function DevicesPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [categoryId, setCategoryId] = useState('')

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get('/categories')).data,
  })

  const { data: devices = [], isLoading } = useQuery({
    queryKey: ['devices', search, status, categoryId],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (status) params.set('status', status)
      if (categoryId) params.set('categoryId', categoryId)
      return (await api.get(`/devices?${params}`)).data
    },
  })

  const deviceRows = devices as any[]

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Devices</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{deviceRows.length} total devices</p>
        </div>
        <Link
          href="/devices/new"
          className="flex items-center justify-center gap-2 bg-slate-900 dark:bg-sky-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-800 dark:hover:bg-sky-500 transition sm:w-auto"
        >
          <Plus size={16} /> Add Device
        </Link>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search device, serial, person, department..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400"
          />
        </div>
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 bg-white dark:bg-slate-800"
        >
          <option value="">All Status</option>
          <option value="IN_WAREHOUSE">In Warehouse</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="MAINTENANCE">Maintenance</option>
          <option value="RETIRED">Retired</option>
        </select>
        <select
          value={categoryId}
          onChange={e => setCategoryId(e.target.value)}
          className="border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 bg-white dark:bg-slate-800"
        >
          <option value="">All Categories</option>
          {(categories as any[]).map((c: any) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400 dark:text-slate-500">Loading...</div>
        ) : deviceRows.length === 0 ? (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500">No devices found</div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Device</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Category</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Brand</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Assigned To</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Added</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                  {deviceRows.map((device: any) => (
                    <tr key={device.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                      <td className="px-6 py-3">
                        <Link href={`/devices/${device.id}`} className="hover:underline">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{device.name}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">{device.serialNumber}</p>
                        </Link>
                      </td>
                      <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-400">{device.category?.name}</td>
                      <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-400">{device.brand?.name || '—'}</td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[device.status]}`}>
                          {STATUS_LABELS[device.status]}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-400">
                        {device.assignments?.[0]?.personnel?.name || '—'}
                      </td>
                      <td className="px-6 py-3 text-sm text-slate-400 dark:text-slate-500">{formatDate(device.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-700">
              {deviceRows.map((device: any) => (
                <Link
                  key={device.id}
                  href={`/devices/${device.id}`}
                  className="flex items-start justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{device.name}</p>
                    <p className="text-xs font-mono text-slate-400 dark:text-slate-500 mt-0.5">{device.serialNumber}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {device.category?.name}{device.brand?.name ? ` · ${device.brand.name}` : ''}
                    </p>
                    {device.assignments?.[0]?.personnel?.name && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">→ {device.assignments[0].personnel.name}</p>
                    )}
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_COLORS[device.status]}`}>
                      {STATUS_LABELS[device.status]}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">{formatDate(device.createdAt)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
