'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import { useTheme } from '@/components/ThemeProvider'
import {
  LayoutDashboard, Monitor, Users, ArrowLeftRight,
  Settings, LogOut, Package, X, Sun, Moon
} from 'lucide-react'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/devices', label: 'Devices', icon: Monitor },
  { href: '/personnel', label: 'Personnel', icon: Users },
  { href: '/assignments', label: 'Assignments', icon: ArrowLeftRight },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const [username, setUsername] = useState('')

  useEffect(() => {
    api.get('/auth/me').then(res => setUsername(res.data.username)).catch(() => {})
  }, [])

  async function handleLogout() {
    await api.post('/auth/logout')
    router.push('/login')
  }

  return (
    <aside className={cn(
      'fixed top-0 left-0 h-full w-72 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col z-40 transition-transform duration-300',
      'lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:translate-x-0 lg:z-auto lg:transition-none lg:shrink-0',
      open ? 'translate-x-0' : '-translate-x-full'
    )}>
      {/* Branding */}
      <div className="px-5 py-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-900 dark:bg-sky-600 rounded-xl flex items-center justify-center shrink-0">
            <Package size={17} className="text-white" />
          </div>
          <div>
            <p className="text-slate-900 dark:text-slate-100 font-bold text-sm leading-tight">IMS Admin</p>
            <p className="text-slate-400 dark:text-slate-500 text-xs leading-tight mt-0.5">Inventory System</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 mb-2">Menu</p>
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                isActive
                  ? 'bg-slate-900 text-white dark:bg-sky-600'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100'
              )}
            >
              <Icon size={17} strokeWidth={isActive ? 2.5 : 2} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Theme toggle & Sign out */}
      <div className="px-3 py-4 border-t border-slate-100 dark:border-slate-700 space-y-0.5">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100 transition-colors w-full"
        >
          {theme === 'dark' ? <Sun size={17} strokeWidth={2} /> : <Moon size={17} strokeWidth={2} />}
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors w-full"
        >
          <LogOut size={17} strokeWidth={2} />
          Sign out{username ? ` (${username})` : ''}
        </button>
      </div>
    </aside>
  )
}
