'use client'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Monitor, Users } from 'lucide-react'
import { STATUS_COLORS, STATUS_LABELS, formatDate } from '@/lib/utils'
import Link from 'next/link'

interface Stats {
  totalDevices: number
  inWarehouse: number
  assigned: number
  maintenance: number
  retired: number
  totalPersonnel: number
  activeAssignments: number
  recentDevices: any[]
}

function StatCard({ title, value, icon: Icon, color }: {
  title: string; value: number; icon: any; color: string
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={18} />
        </div>
      </div>
      <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  )
}

export default function DashboardPage() {
  const { data: stats, isLoading, isError } = useQuery<Stats>({
    queryKey: ['dashboard'],
    queryFn: async () => (await api.get('/dashboard/stats')).data,
    staleTime: 0,
  })

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-48"></div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-slate-200 dark:bg-slate-700 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (isError) {
    return <div className="p-8 text-center text-red-600 dark:text-red-400">Dashboard data could not be loaded. Please try again.</div>
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Overview of your inventory</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard title="Total Devices" value={stats?.totalDevices || 0} icon={Monitor} color="bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400" />
        <StatCard title="Personnel" value={stats?.totalPersonnel || 0} icon={Users} color="bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400" />
      </div>

      {/* Status breakdown */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {['ASSIGNED', 'IN_WAREHOUSE', 'MAINTENANCE', 'RETIRED'].map(status => (
          <div key={status} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 text-center">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[status]}`}>
              {STATUS_LABELS[status]}
            </span>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
              {status === 'ASSIGNED' ? stats?.assigned
                : status === 'IN_WAREHOUSE' ? stats?.inWarehouse
                : status === 'MAINTENANCE' ? stats?.maintenance
                : stats?.retired || 0}
            </p>
          </div>
        ))}
      </div>

      {/* Status distribution */}
      {(stats?.totalDevices ?? 0) > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Status Distribution</h2>
          <div className="flex h-4 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
            {([
              ['assigned', stats?.assigned ?? 0, 'bg-green-500'],
              ['inWarehouse', stats?.inWarehouse ?? 0, 'bg-blue-500'],
              ['maintenance', stats?.maintenance ?? 0, 'bg-amber-500'],
              ['retired', stats?.retired ?? 0, 'bg-slate-400'],
            ] as [string, number, string][]).map(([key, value, color]) => {
              const total = stats?.totalDevices || 1
              const pct = (value / total) * 100
              return pct > 0 ? <div key={key} className={color} style={{ width: `${pct}%` }} title={`${key}: ${value}`} /> : null
            })}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Assigned {stats?.assigned ?? 0}</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> In Warehouse {stats?.inWarehouse ?? 0}</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Maintenance {stats?.maintenance ?? 0}</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Retired {stats?.retired ?? 0}</span>
          </div>
        </div>
      )}

      {/* Recent Devices */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">Recently Added Devices</h2>
          <Link href="/devices" className="text-sm text-sky-600 dark:text-sky-400 hover:underline">View all</Link>
        </div>
        <div className="divide-y divide-slate-50 dark:divide-slate-700">
          {stats?.recentDevices.map((device: any) => (
            <Link
              key={device.id}
              href={`/devices/${device.id}`}
              className="flex items-start sm:items-center justify-between px-4 sm:px-6 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition gap-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{device.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{device.category?.name} · {device.serialNumber}</p>
              </div>
              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-3 shrink-0">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_COLORS[device.status]}`}>
                  {STATUS_LABELS[device.status]}
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500 hidden sm:block">{formatDate(device.createdAt)}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
