'use client'
import { useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Menu } from 'lucide-react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="flex-1 overflow-auto bg-slate-50 min-w-0">
        {/* Mobile top bar */}
        <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition"
          >
            <Menu size={20} />
          </button>
          <span className="text-sm font-semibold text-slate-900">IMS Admin</span>
        </div>
        {children}
      </main>
    </div>
  )
}
