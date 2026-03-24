'use client'
import { useState } from 'react'
import CategoriesTab from './CategoriesTab'
import CustomFieldsTab from './CustomFieldsTab'
import UsersTab from './UsersTab'
import Link from 'next/link'
import { Tag, Sliders, Users, HardDrive } from 'lucide-react'

const tabs = [
  { id: 'categories', label: 'Categories', icon: Tag, desc: 'Manage device categories' },
  { id: 'fields', label: 'Custom Fields', icon: Sliders, desc: 'Per-category custom fields' },
  { id: 'users', label: 'Users', icon: Users, desc: 'Admin accounts' },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('categories')
  const active = tabs.find(t => t.id === activeTab)!

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage your inventory system configuration</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Sidebar nav — horizontal scroll on mobile, vertical on desktop */}
        <aside className="lg:w-52 lg:shrink-0">
          <div className="flex lg:flex-col gap-1 overflow-x-auto pb-1 lg:pb-0 lg:space-y-1 -mx-4 px-4 lg:mx-0 lg:px-0">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`shrink-0 flex items-center gap-2.5 px-4 py-2.5 rounded-xl transition-all lg:w-full lg:text-left ${
                  activeTab === id
                    ? 'bg-slate-900 dark:bg-sky-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Icon size={15} className={activeTab === id ? 'text-sky-400' : 'text-slate-400 dark:text-slate-500'} />
                <span className="text-sm font-medium whitespace-nowrap">{label}</span>
              </button>
            ))}

            <div className="lg:pt-4 lg:mt-4 lg:border-t lg:border-slate-200 dark:lg:border-slate-700 shrink-0">
              <Link
                href="/settings/backup"
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
              >
                <HardDrive size={15} className="text-slate-400 dark:text-slate-500" />
                <span className="text-sm font-medium whitespace-nowrap">Backup</span>
              </Link>
            </div>
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{active.label}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{active.desc}</p>
          </div>

          {activeTab === 'categories' && <CategoriesTab />}
          {activeTab === 'fields' && <CustomFieldsTab />}
          {activeTab === 'users' && <UsersTab />}
        </div>
      </div>
    </div>
  )
}
