'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import Link from 'next/link'
import { useState } from 'react'
import { Search, Trash2, Users, Upload, Building2 } from 'lucide-react'
import BulkImportTab from './BulkImportTab'
import DepartmentsTab from './DepartmentsTab'

type Department = {
  id: string
  name: string
  _count?: { personnel: number }
}

type Personnel = {
  id: string
  name: string
  email: string
  phone?: string
  department?: { id: string; name: string }
  assignments?: Array<unknown>
}

const tabs = [
  { id: 'personnel', label: 'Personnel', icon: Users },
  { id: 'import', label: 'Bulk Import', icon: Upload },
  { id: 'departments', label: 'Departments', icon: Building2 },
]

export default function PersonnelPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('personnel')
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ name: '', email: '', departmentId: '', departmentName: '', phone: '' })
  const [deleteError, setDeleteError] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [actionError, setActionError] = useState('')

  const { data: departments = [], isError: isDepartmentsError } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => (await api.get('/departments')).data,
    retry: 1,
  })

  const { data: personnel = [], isLoading } = useQuery({
    queryKey: ['personnel', search],
    queryFn: async () => (await api.get(`/personnel?search=${search}`)).data,
  })

  const createMutation = useMutation({
    mutationFn: async (data: any) => (await api.post('/personnel', data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personnel'] })
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      setForm({ name: '', email: '', departmentId: '', departmentName: '', phone: '' })
      setActionMessage('Personnel added successfully')
      setActionError('')
    },
    onError: (err: any) => setActionError(err.response?.data?.error || 'Failed to add personnel'),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/personnel/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['personnel'] }); setDeleteError('') },
    onError: (err: any) => setDeleteError(err.response?.data?.error || 'Delete failed'),
  })

  function createPerson() {
    const payload: Record<string, string> = {
      name: form.name,
      email: form.email,
    }

    if (form.phone) payload.phone = form.phone
    if (form.departmentId) {
      payload.departmentId = form.departmentId
    } else if (form.departmentName.trim()) {
      payload.department = form.departmentName.trim()
    }

    createMutation.mutate(payload)
  }

  const hasDepartmentInput = Boolean(form.departmentId || form.departmentName.trim())
  const canCreatePerson = Boolean(form.name && form.email && hasDepartmentInput && !createMutation.isPending)

  const departmentRows = departments as Department[]
  const rows = personnel as Personnel[]

  const inputCls = "border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400"

  if (isDepartmentsError) {
    // Departments endpoint is optional for older backend versions.
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Personnel</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{rows.length} people</p>
      </div>

      {/* Horizontal Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all text-sm font-medium ${
              activeTab === id
                ? 'bg-slate-900 dark:bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Icon size={15} className={activeTab === id ? 'text-sky-400' : 'text-slate-400 dark:text-slate-500'} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'personnel' && (
        <div className="space-y-5">
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search personnel..."
              className="w-full sm:max-w-xs pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400" />
          </div>

          {/* Add Person form */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
            <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">New Personnel</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full name *"
                className={inputCls} />
              <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email *" type="email"
                className={inputCls} />
              <div className="space-y-2">
                {!isDepartmentsError && (
                  <select
                    value={form.departmentId}
                    onChange={e => setForm({ ...form, departmentId: e.target.value })}
                    className={`${inputCls} w-full`}
                  >
                    <option value="">Select department</option>
                    {departmentRows.map(dep => (
                      <option key={dep.id} value={dep.id}>{dep.name}</option>
                    ))}
                  </select>
                )}
                <input
                  value={form.departmentName}
                  onChange={e => setForm({ ...form, departmentName: e.target.value })}
                  placeholder={isDepartmentsError ? 'Department *' : 'Or type a new department'}
                  className={`${inputCls} w-full`}
                />
              </div>
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Phone"
                className={inputCls} />
            </div>
            <div className="flex gap-2 mt-3">
              <button type="button" onClick={createPerson} disabled={!canCreatePerson}
                className="bg-slate-900 dark:bg-sky-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-800 dark:hover:bg-sky-500 disabled:opacity-50">
                {createMutation.isPending ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>

          {/* Messages */}
          {deleteError && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-2xl px-4 py-3 text-sm">{deleteError}</div>
          )}
          {actionError && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-2xl px-4 py-3 text-sm">{actionError}</div>
          )}
          {actionMessage && (
            <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 rounded-2xl px-4 py-3 text-sm">{actionMessage}</div>
          )}

          {/* Personnel table */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            {isLoading ? <div className="p-8 text-center text-slate-400">Loading...</div> :
              rows.length === 0 ? <div className="p-12 text-center text-slate-400">No personnel found</div> : (
                <>
                  {/* Desktop table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-700">
                          <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
                          <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Department</th>
                          <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email</th>
                          <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Phone</th>
                          <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Devices</th>
                          <th className="px-6 py-3"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                        {rows.map((p: Personnel) => (
                          <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                            <td className="px-6 py-3">
                              <Link href={`/personnel/${p.id}`} className="text-sm font-medium text-slate-900 dark:text-slate-100 hover:underline">
                                {p.name}
                              </Link>
                            </td>
                            <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-400">{p.department?.name || '—'}</td>
                            <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-400">{p.email}</td>
                            <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-400">{p.phone || '—'}</td>
                            <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-400">{p.assignments?.length || 0}</td>
                            <td className="px-6 py-3 text-right">
                              <button type="button" onClick={() => { if (confirm('Delete this person?')) deleteMutation.mutate(p.id) }}
                                className="text-slate-400 hover:text-red-600 transition">
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile card list */}
                  <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-700">
                    {rows.map((p: Personnel) => (
                      <div key={p.id} className="flex items-center justify-between p-4 gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                        <div className="flex-1 min-w-0">
                          <Link href={`/personnel/${p.id}`} className="text-sm font-semibold text-slate-900 dark:text-slate-100 hover:underline">
                            {p.name}
                          </Link>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{p.department?.name || '—'}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{p.email}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs text-slate-500 dark:text-slate-400">{p.assignments?.length || 0} devices</span>
                          <button type="button" onClick={() => { if (confirm('Delete this person?')) deleteMutation.mutate(p.id) }}
                            className="text-slate-400 hover:text-red-600 transition p-1">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
          </div>
        </div>
      )}

      {activeTab === 'import' && <BulkImportTab />}
      {activeTab === 'departments' && <DepartmentsTab />}
    </div>
  )
}
