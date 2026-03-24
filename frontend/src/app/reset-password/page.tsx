'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { KeyRound, CheckCircle } from 'lucide-react'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [form, setForm] = useState({
    username: searchParams.get('username') || '',
    code: '',
    password: '',
    confirm: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirm) {
      setError('Passwords do not match')
      return
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/reset-password', {
        username: form.username,
        code: form.code,
        newPassword: form.password,
      })
      setDone(true)
      setTimeout(() => router.push('/login'), 2000)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Reset failed')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 flex flex-col items-center gap-3 text-center">
        <CheckCircle size={40} className="text-green-500" />
        <p className="font-semibold text-slate-900 dark:text-slate-100">Password updated!</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">Redirecting to login...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-4">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 text-sm">{error}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Username</label>
        <input
          type="text"
          value={form.username}
          onChange={e => setForm({ ...form, username: e.target.value })}
          className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400"
          placeholder="your-username"
          required
          autoComplete="username"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Reset Code</label>
        <input
          type="text"
          value={form.code}
          onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
          className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm font-mono tracking-widest bg-white dark:bg-slate-700 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 uppercase"
          placeholder="XXXXXX"
          maxLength={6}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">New Password</label>
        <input
          type="password"
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
          className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400"
          placeholder="Min. 6 characters"
          required
          autoComplete="new-password"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Confirm Password</label>
        <input
          type="password"
          value={form.confirm}
          onChange={e => setForm({ ...form, confirm: e.target.value })}
          className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400"
          placeholder="••••••••"
          required
          autoComplete="new-password"
        />
      </div>

      <button type="submit" disabled={loading}
        className="w-full bg-slate-900 dark:bg-sky-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-slate-800 dark:hover:bg-sky-500 transition disabled:opacity-50">
        {loading ? 'Resetting...' : 'Reset Password'}
      </button>

      <Link href="/forgot-password" className="block text-center text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition">
        ← Get a new code
      </Link>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-900 dark:bg-sky-600 rounded-xl mb-4">
            <KeyRound size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Reset Password</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Enter your reset code and new password</p>
        </div>
        <Suspense fallback={<div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 text-center text-slate-400 text-sm">Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  )
}
