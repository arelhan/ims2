'use client'
import { useState } from 'react'
import api from '@/lib/api'
import { CheckCircle } from 'lucide-react'

export default function AccountTab() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (form.newPassword !== form.confirm) {
      setError('New passwords do not match')
      return
    }
    if (form.newPassword.length < 6) {
      setError('New password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      })
      setSuccess(true)
      setForm({ currentPassword: '', newPassword: '', confirm: '' })
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-sm space-y-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <h3 className="font-semibold text-slate-900 text-sm">Change Password</h3>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>
        )}
        {success && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">
            <CheckCircle size={15} /> Password changed successfully
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
          <input
            type="password"
            value={form.currentPassword}
            onChange={e => setForm({ ...form, currentPassword: e.target.value })}
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
          <input
            type="password"
            value={form.newPassword}
            onChange={e => setForm({ ...form, newPassword: e.target.value })}
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            placeholder="Min. 6 characters"
            required
            autoComplete="new-password"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
          <input
            type="password"
            value={form.confirm}
            onChange={e => setForm({ ...form, confirm: e.target.value })}
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            placeholder="••••••••"
            required
            autoComplete="new-password"
          />
        </div>

        <button type="submit" disabled={loading}
          className="w-full bg-slate-900 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-slate-800 transition disabled:opacity-50">
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  )
}
