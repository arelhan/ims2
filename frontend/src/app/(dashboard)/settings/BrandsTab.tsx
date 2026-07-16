'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { useState } from 'react'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'

export default function BrandsTab() {
  const queryClient = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [error, setError] = useState('')

  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => (await api.get('/brands')).data,
  })

  const createMutation = useMutation({
    mutationFn: async () => (await api.post('/brands', { name: newName })).data,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['brands'] }); setNewName(''); setShowAdd(false); setError('') },
    onError: (err: any) => setError(err.response?.data?.error || 'Failed to add brand'),
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) =>
      (await api.put(`/brands/${id}`, { name })).data,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['brands'] }); setEditId(null); setError('') },
    onError: (err: any) => setError(err.response?.data?.error || 'Failed to update brand'),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/brands/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['brands'] }); setError('') },
    onError: (err: any) => setError(err.response?.data?.error || 'Delete failed'),
  })

  const rows = brands as any[]

  return (
    <div className="max-w-lg space-y-4">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 text-sm">{error}</div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">{rows.length} brands</p>
        <button onClick={() => setShowAdd(v => !v)}
          className="flex items-center gap-2 bg-slate-900 dark:bg-sky-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-sky-500 transition">
          <Plus size={14} /> Add Brand
        </button>
      </div>

      {showAdd && (
        <div className="flex gap-2">
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Brand name" autoFocus
            className="flex-1 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 dark:bg-slate-700 dark:text-slate-100"
            onKeyDown={e => e.key === 'Enter' && newName && createMutation.mutate()} />
          <button onClick={() => newName && createMutation.mutate()} disabled={!newName || createMutation.isPending}
            className="px-3 py-2 bg-slate-900 dark:bg-sky-600 text-white rounded-lg text-sm disabled:opacity-50 hover:bg-slate-800 dark:hover:bg-sky-500 transition">
            <Check size={16} />
          </button>
          <button onClick={() => { setShowAdd(false); setNewName('') }}
            className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-10 text-center text-slate-400 dark:text-slate-500 text-sm">No brands yet</div>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-slate-700">
            {rows.map((brand: any) => (
              <div key={brand.id} className="flex items-center justify-between px-4 py-3.5">
                {editId === brand.id ? (
                  <div className="flex gap-2 flex-1 mr-2">
                    <input value={editName} onChange={e => setEditName(e.target.value)} autoFocus
                      className="flex-1 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 dark:bg-slate-700 dark:text-slate-100"
                      onKeyDown={e => e.key === 'Enter' && updateMutation.mutate({ id: brand.id, name: editName })} />
                    <button onClick={() => updateMutation.mutate({ id: brand.id, name: editName })}
                      className="px-2 py-1.5 bg-slate-900 dark:bg-sky-600 text-white rounded-lg text-sm hover:bg-slate-800 dark:hover:bg-sky-500 transition">
                      <Check size={14} />
                    </button>
                    <button onClick={() => setEditId(null)}
                      className="px-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{brand.name}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{brand._count?.devices || 0} devices</p>
                  </div>
                )}
                {editId !== brand.id && (
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setEditId(brand.id); setEditName(brand.name); setError('') }}
                      className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => { if (confirm('Delete brand?')) deleteMutation.mutate(brand.id) }}
                      className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition">
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
