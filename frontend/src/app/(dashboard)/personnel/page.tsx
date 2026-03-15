'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import Link from 'next/link'
import { useState } from 'react'
import { Plus, Search, Trash2 } from 'lucide-react'

export default function PersonnelPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', department: '', phone: '' })
  const [deleteError, setDeleteError] = useState('')

  const { data: personnel = [], isLoading } = useQuery({
    queryKey: ['personnel', search],
    queryFn: async () => (await api.get(`/personnel?search=${search}`)).data,
  })

  const createMutation = useMutation({
    mutationFn: async (data: any) => (await api.post('/personnel', data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personnel'] })
      setShowAdd(false)
      setForm({ name: '', email: '', department: '', phone: '' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/personnel/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['personnel'] }); setDeleteError('') },
    onError: (err: any) => setDeleteError(err.response?.data?.error || 'Delete failed'),
  })

  const rows = personnel as any[]
  const inputCls = "border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Personnel</h1>
          <p className="text-slate-500 text-sm mt-0.5">{rows.length} people</p>
        </div>
        <button onClick={() => setShowAdd(v => !v)}
          className="flex items-center justify-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-800 transition">
          <Plus size={16} /> Add Person
        </button>
      </div>

      {showAdd && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">New Personnel</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full name *"
              className={inputCls} />
            <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email *" type="email"
              className={inputCls} />
            <input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} placeholder="Department *"
              className={inputCls} />
            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Phone"
              className={inputCls} />
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={() => createMutation.mutate(form)} disabled={!form.name || !form.email || !form.department || createMutation.isPending}
              className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-800 disabled:opacity-50">
              {createMutation.isPending ? 'Adding...' : 'Add'}
            </button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-xl text-sm text-slate-600 hover:bg-slate-100">
              Cancel
            </button>
          </div>
        </div>
      )}

      {deleteError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 text-sm">{deleteError}</div>
      )}

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search personnel..."
          className="w-full sm:max-w-xs pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {isLoading ? <div className="p-8 text-center text-slate-400">Loading...</div> :
          rows.length === 0 ? <div className="p-12 text-center text-slate-400">No personnel found</div> : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Department</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Devices</th>
                      <th className="px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {rows.map((p: any) => (
                      <tr key={p.id} className="hover:bg-slate-50 transition">
                        <td className="px-6 py-3">
                          <Link href={`/personnel/${p.id}`} className="text-sm font-medium text-slate-900 hover:underline">
                            {p.name}
                          </Link>
                        </td>
                        <td className="px-6 py-3 text-sm text-slate-600">{p.department}</td>
                        <td className="px-6 py-3 text-sm text-slate-600">{p.email}</td>
                        <td className="px-6 py-3 text-sm text-slate-600">{p.phone || '—'}</td>
                        <td className="px-6 py-3 text-sm text-slate-600">{p.assignments?.length || 0}</td>
                        <td className="px-6 py-3 text-right">
                          <button onClick={() => { if (confirm('Delete this person?')) deleteMutation.mutate(p.id) }}
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
              <div className="md:hidden divide-y divide-slate-100">
                {rows.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between p-4 gap-3 hover:bg-slate-50 transition">
                    <div className="flex-1 min-w-0">
                      <Link href={`/personnel/${p.id}`} className="text-sm font-semibold text-slate-900 hover:underline">
                        {p.name}
                      </Link>
                      <p className="text-xs text-slate-500 mt-0.5">{p.department}</p>
                      <p className="text-xs text-slate-400 truncate">{p.email}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-slate-500">{p.assignments?.length || 0} devices</span>
                      <button onClick={() => { if (confirm('Delete this person?')) deleteMutation.mutate(p.id) }}
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
  )
}
