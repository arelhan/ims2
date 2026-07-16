'use client'
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import { CheckCircle } from 'lucide-react'

export default function PasswordTab() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const mutation = useMutation({
    mutationFn: async () =>
      api.post('/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      }),
    onSuccess: () => {
      setDone(true)
      setForm({ currentPassword: '', newPassword: '', confirm: '' })
      setError('')
      setTimeout(() => setDone(false), 3000)
    },
    onError: (err: any) => setError(err.response?.data?.error || 'Failed to change password'),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (form.newPassword.length < 6) {
      setError('New password must be at least 6 characters')
      return
    }
    if (form.newPassword !== form.confirm) {
      setError('New passwords do not match')
      return
    }
    mutation.mutate()
  }

  const inputCls = "w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400"

  return (
    <form onSubmit={handleSubmit} className="max-w-md bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 sm:p-6 space-y-4">
      {done && (
        <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-xl px-4 py-3 text-sm">
          <CheckCircle size={16} /> Password changed successfully
        </div>
      )}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 text-sm">{error}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Current Password</label>
        <input type="password" value={form.currentPassword} autoComplete="current-password"
          onChange={e => setForm({ ...form, currentPassword: e.target.value })} className={inputCls} required />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">New Password</label>
        <input type="password" value={form.newPassword} autoComplete="new-password"
          onChange={e => setForm({ ...form, newPassword: e.target.value })} className={inputCls} placeholder="Min. 6 characters" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Confirm New Password</label>
        <input type="password" value={form.confirm} autoComplete="new-password"
          onChange={e => setForm({ ...form, confirm: e.target.value })} className={inputCls} required />
      </div>

      <button type="submit" disabled={mutation.isPending || !form.currentPassword || !form.newPassword}
        className="bg-slate-900 dark:bg-sky-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-800 dark:hover:bg-sky-500 transition disabled:opacity-50">
        {mutation.isPending ? 'Saving...' : 'Change Password'}
      </button>
    </form>
  )
}
