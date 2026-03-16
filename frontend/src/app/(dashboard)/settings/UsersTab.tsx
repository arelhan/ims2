'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { useState, useEffect } from 'react'
import { Plus, Trash2, Shield, Eye, KeyRound, X } from 'lucide-react'
import { formatDate, normalizeUsername } from '@/lib/utils'

export default function UsersTab() {
  const queryClient = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', username: '', password: '', role: 'VIEWER' })
  const [createError, setCreateError] = useState('')
  const [resetUserId, setResetUserId] = useState<string | null>(null)
  const [resetInput, setResetInput] = useState('')
  const [resetError, setResetError] = useState('')
  const [resetDone, setResetDone] = useState(false)

  // Auto-close reset form after success (with cleanup to prevent setState on unmounted component)
  useEffect(() => {
    if (!resetDone) return
    const timer = setTimeout(() => { setResetUserId(null); setResetDone(false) }, 1500)
    return () => clearTimeout(timer)
  }, [resetDone])

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await api.get('/admin/users')).data,
  })

  const createMutation = useMutation({
    mutationFn: async () => (await api.post('/admin/users', form)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setForm({ name: '', username: '', password: '', role: 'VIEWER' })
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

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id, password }: { id: string; password: string }) =>
      api.patch(`/admin/users/${id}`, { password }),
    onSuccess: () => {
      setResetDone(true)
      setResetInput('')
    },
    onError: (err: any) => setResetError(err.response?.data?.error || 'Failed'),
  })

  function openReset(id: string) {
    setResetUserId(id)
    setResetInput('')
    setResetError('')
    setResetDone(false)
  }

  // Compute once per render, not once per row
  const adminCount = (users as any[]).filter((u: any) => u.role === 'ADMIN').length

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
            <input value={form.username} onChange={e => setForm({ ...form, username: normalizeUsername(e.target.value) })} placeholder="Username *"
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
            <input value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Password *" type="password"
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
            <div className="flex gap-2">
              <button onClick={() => setForm({ ...form, role: 'VIEWER' })}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-medium transition ${form.role === 'VIEWER' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}>
                <Eye size={13} /> Viewer
              </button>
              <button onClick={() => setForm({ ...form, role: 'ADMIN' })}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-medium transition ${form.role === 'ADMIN' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}>
                <Shield size={13} /> Admin
              </button>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={() => createMutation.mutate()} disabled={!form.name || !form.username || !form.password || createMutation.isPending}
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
            {(users as any[]).map((user: any) => {
              const isLastAdmin = user.role === 'ADMIN' && adminCount <= 1
              return (
                <div key={user.id}>
                  <div className="flex items-center gap-4 px-4 py-3.5">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold text-slate-600">{user.name?.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">{user.name}</p>
                      <p className="text-xs text-slate-400">@{user.username}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select value={user.role} onChange={e => updateRoleMutation.mutate({ id: user.id, role: e.target.value })}
                        className="border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white">
                        <option value="ADMIN">Admin</option>
                        <option value="VIEWER">Viewer</option>
                      </select>
                      <span className="text-xs text-slate-400 hidden sm:block">{formatDate(user.createdAt)}</span>
                      <button onClick={() => openReset(user.id)} title="Reset password"
                        className="p-1.5 text-slate-300 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition">
                        <KeyRound size={14} />
                      </button>
                      <button
                        onClick={() => { if (confirm('Delete user?')) deleteMutation.mutate(user.id) }}
                        disabled={isLastAdmin}
                        title={isLastAdmin ? 'Cannot delete the last admin' : 'Delete user'}
                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-slate-300 disabled:hover:bg-transparent"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Inline reset password form */}
                  {resetUserId === user.id && (
                    <div className="px-4 pb-4 pt-1 bg-amber-50 border-t border-amber-100">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-amber-700">Set new password:</span>
                        {resetDone ? (
                          <span className="text-xs text-green-600 font-medium">Password updated!</span>
                        ) : (
                          <>
                            <input
                              type="password"
                              value={resetInput}
                              onChange={e => { setResetInput(e.target.value); setResetError('') }}
                              placeholder="New password (min 6)"
                              className="flex-1 border border-amber-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                            />
                            <button
                              onClick={() => {
                                if (resetInput.length < 6) { setResetError('Min 6 characters'); return }
                                resetPasswordMutation.mutate({ id: user.id, password: resetInput })
                              }}
                              disabled={resetPasswordMutation.isPending}
                              className="bg-amber-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-amber-600 disabled:opacity-50 transition"
                            >
                              Save
                            </button>
                            <button onClick={() => setResetUserId(null)}
                              className="p-1.5 text-amber-400 hover:text-amber-600 rounded-lg transition">
                              <X size={14} />
                            </button>
                          </>
                        )}
                      </div>
                      {resetError && <p className="text-xs text-red-600 mt-1">{resetError}</p>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
