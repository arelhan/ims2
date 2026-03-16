'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/login', { username, password })
      const nextPath = searchParams.get('next')
      const isSafeNext = !!nextPath && nextPath.startsWith('/') && !nextPath.startsWith('//')
      if (isSafeNext) {
        router.push(nextPath)
      } else {
        router.push('/')
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-900 rounded-xl mb-4">
            <span className="text-white text-xl">📦</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory System</h1>
          <p className="text-slate-500 mt-1">Admin Panel</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              placeholder="admin"
              required
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white rounded-lg py-2 text-sm font-medium hover:bg-slate-800 transition disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="text-center mt-4 text-sm text-slate-500">
          <Link href="/forgot-password" className="text-slate-700 hover:underline">
            Forgot password?
          </Link>
        </p>
      </div>
    </div>
  )
}
