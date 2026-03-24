'use client'
import { useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import { KeyRound, Copy, Check } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resetCode, setResetCode] = useState('')
  const [copied, setCopied] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/forgot-password', { username })
      setResetCode(res.data.resetCode)
    } catch (err: any) {
      setError(err.response?.data?.error || 'User not found')
    } finally {
      setLoading(false)
    }
  }

  function copyCode() {
    navigator.clipboard.writeText(resetCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-900 dark:bg-sky-600 rounded-xl mb-4">
            <KeyRound size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Forgot Password</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Enter your username to get a reset code</p>
        </div>

        {resetCode ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
            <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-center space-y-3">
              <p className="text-sm text-amber-800 dark:text-amber-400 font-medium">Your reset code (valid 15 min):</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl font-mono font-bold tracking-widest text-slate-900 dark:text-slate-100">{resetCode}</span>
                <button onClick={copyCode} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition">
                  {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
              Use this code on the reset password page to set a new password.
            </p>
            <Link href={`/reset-password?username=${encodeURIComponent(username)}`}
              className="block w-full bg-slate-900 dark:bg-sky-600 text-white text-center rounded-xl py-2.5 text-sm font-medium hover:bg-slate-800 dark:hover:bg-sky-500 transition">
              Continue to Reset Password →
            </Link>
            <Link href="/login" className="block text-center text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition">
              Back to login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-4">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 text-sm">{error}</div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400"
                placeholder="your-username"
                required
                autoComplete="username"
              />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-slate-900 dark:bg-sky-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-slate-800 dark:hover:bg-sky-500 transition disabled:opacity-50">
              {loading ? 'Generating code...' : 'Get Reset Code'}
            </button>
            <Link href="/login" className="block text-center text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition">
              Back to login
            </Link>
          </form>
        )}
      </div>
    </div>
  )
}
