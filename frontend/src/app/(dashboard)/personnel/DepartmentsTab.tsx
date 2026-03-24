'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Trash2 } from 'lucide-react'

type Department = {
  id: string
  name: string
  _count?: { personnel: number }
}

export default function DepartmentsTab() {
  const queryClient = useQueryClient()
  const [newDepartmentName, setNewDepartmentName] = useState('')
  const [actionError, setActionError] = useState('')
  const [actionMessage, setActionMessage] = useState('')

  const { data: departments = [], isLoading, isError } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => (await api.get('/departments')).data,
    retry: 1,
  })

  const createDepartmentMutation = useMutation({
    mutationFn: async (name: string) => (await api.post('/departments', { name })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      setNewDepartmentName('')
      setActionMessage('Department added')
      setActionError('')
    },
    onError: (err: any) => setActionError(err.response?.data?.error || 'Failed to add department'),
  })

  const deleteDepartmentMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/departments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      setActionError('')
    },
    onError: (err: any) => setActionError(err.response?.data?.error || 'Department delete failed'),
  })

  const departmentRows = departments as Department[]

  const inputCls = "border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400"

  if (isError) {
    return (
      <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 rounded-2xl px-4 py-3 text-sm">
        Department API ulasilamiyor.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {actionError && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-2xl px-4 py-3 text-sm">{actionError}</div>
      )}
      {actionMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 rounded-2xl px-4 py-3 text-sm">{actionMessage}</div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Departments</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={newDepartmentName}
            onChange={e => setNewDepartmentName(e.target.value)}
            placeholder="New department name"
            className={`${inputCls} flex-1`}
          />
          <button
            type="button"
            onClick={() => newDepartmentName.trim() && createDepartmentMutation.mutate(newDepartmentName)}
            disabled={!newDepartmentName.trim() || createDepartmentMutation.isPending}
            className="px-4 py-2 bg-slate-900 dark:bg-sky-600 text-white rounded-xl text-sm font-medium hover:bg-slate-800 dark:hover:bg-sky-500 disabled:opacity-50"
          >
            Add Department
          </button>
        </div>
        {isLoading && <p className="text-xs text-slate-400">Loading departments...</p>}
        {departmentRows.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {departmentRows.map(dep => (
              <div key={dep.id} className="inline-flex items-center gap-2 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-1.5 text-sm dark:text-slate-300">
                <span>{dep.name}</span>
                <span className="text-xs text-slate-400">{dep._count?.personnel ?? 0}</span>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Delete department "${dep.name}"?`)) deleteDepartmentMutation.mutate(dep.id)
                  }}
                  className="text-slate-400 hover:text-red-600"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
