'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { useState } from 'react'
import { Plus, Trash2, Shield, Eye } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function UsersTab() {
  const queryClient = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'VIEWER' })
  const [createError, setCreateError] = useState('')

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await api.get('/admin/users')).data,
  })

  const createMutation = useMutation({
    mutationFn: async () => (await api.post('/admin/users', form)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setForm({ name: '', email: '', password: '', role: 'VIEWER' })
      setShowAdd(false)
      setCreateError('')
    },
    onError: (err: any) => setCreateError(err.response?.data?.error || 'Create failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/admin/users/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) =>
      (await api.patch(`/admin/users/${id}`, { role })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })

  return (
    <div className="max-w-2xl space-y-4">
      {/* Add button */}
      {!showAdd && (
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-800 transition">
          <Plus size={15} /> Add User
        </button>
      )}

      {/* Add form */}
      {showAdd && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
          <h3 className="font-semibold text-slate-900 text-sm">New User</h3>
          {createError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2 text-sm">{createError}</div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full name *"
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
            <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email *" type="email"
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
            <input value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Password *" type="password"
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
            <div className="flex gap-2">
              <button
                onClick={() => setForm({ ...form, role: 'VIEWER' })}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-medium transition ${
                  form.role === 'VIEWER' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                }`}
              >
                <Eye size={13} /> Viewer
              </button>
              <button
                onClick={() => setForm({ ...form, role: 'ADMIN' })}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-medium transition ${
                  form.role === 'ADMIN' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                }`}
              >
                <Shield size={13} /> Admin
              </button>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={() => createMutation.mutate()} disabled={!form.name || !form.email || !form.password || createMutation.isPending}
              className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition">
              {createMutation.isPending ? 'Creating...' : 'Create User'}
            </button>
            <button onClick={() => { setShowAdd(false); setCreateError('') }}
              className="px-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* User list */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {(users as any[]).length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-sm">No users yet</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {(users as any[]).map((user: any) => (
              <div key={user.id} className="flex items-center gap-4 px-4 py-3.5">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                  <span className="text-xs font-semibold text-slate-600">
                    {user.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{user.name}</p>
                  <p className="text-xs text-slate-400 truncate">{user.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={user.role}
                    onChange={e => updateRoleMutation.mutate({ id: user.id, role: e.target.value })}
                    className="border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="VIEWER">Viewer</option>
                  </select>
                  <span className="text-xs text-slate-400 hidden sm:block">{formatDate(user.createdAt)}</span>
                  <button onClick={() => { if (confirm('Delete user?')) deleteMutation.mutate(user.id) }}
                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
