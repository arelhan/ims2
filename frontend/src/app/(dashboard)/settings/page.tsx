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
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Manage your inventory system configuration</p>
      </div>

      {/* Horizontal Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all text-sm font-medium ${
              activeTab === id
                ? 'bg-slate-900 dark:bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Icon size={15} className={activeTab === id ? 'text-sky-400' : 'text-slate-400 dark:text-slate-500'} />
            {label}
          </button>
        ))}
        <Link
          href="/settings/backup"
          className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-sm font-medium"
        >
          <HardDrive size={15} className="text-slate-400 dark:text-slate-500" />
          Backup
        </Link>
      </div>

      {/* Tab Content */}
      <div>
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{active.label}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{active.desc}</p>
        </div>

        {activeTab === 'categories' && <CategoriesTab />}
        {activeTab === 'fields' && <CustomFieldsTab />}
        {activeTab === 'users' && <UsersTab />}
      </div>
    </div>
  )
}
