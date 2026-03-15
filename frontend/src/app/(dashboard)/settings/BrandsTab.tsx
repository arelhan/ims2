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

  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => (await api.get('/brands')).data,
  })

  const createMutation = useMutation({
    mutationFn: async () => (await api.post('/brands', { name: newName })).data,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['brands'] }); setNewName(''); setShowAdd(false) },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) =>
      (await api.put(`/brands/${id}`, { name })).data,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['brands'] }); setEditId(null) },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/brands/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['brands'] }),
  })

  return (
    <div className="max-w-lg space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{brands.length} brands</p>
        <button onClick={() => setShowAdd(v => !v)}
          className="flex items-center gap-2 bg-slate-900 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-slate-800">
          <Plus size={14} /> Add Brand
        </button>
      </div>

      {showAdd && (
        <div className="flex gap-2">
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Brand name"
            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            onKeyDown={e => e.key === 'Enter' && newName && createMutation.mutate()} />
          <button onClick={() => newName && createMutation.mutate()} disabled={!newName}
            className="px-3 py-2 bg-slate-900 text-white rounded-lg text-sm disabled:opacity-50">
            <Check size={16} />
          </button>
          <button onClick={() => setShowAdd(false)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-50">
        {brands.map((brand: any) => (
          <div key={brand.id} className="flex items-center justify-between px-4 py-3">
            {editId === brand.id ? (
              <div className="flex gap-2 flex-1 mr-2">
                <input value={editName} onChange={e => setEditName(e.target.value)}
                  className="flex-1 border border-slate-200 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
                <button onClick={() => updateMutation.mutate({ id: brand.id, name: editName })}
                  className="px-2 py-1 bg-slate-900 text-white rounded text-sm">
                  <Check size={14} />
                </button>
                <button onClick={() => setEditId(null)} className="px-2 py-1 border border-slate-200 rounded text-sm">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium text-slate-900">{brand.name}</p>
                <p className="text-xs text-slate-400">{brand._count?.devices || 0} devices</p>
              </div>
            )}
            {editId !== brand.id && (
              <div className="flex items-center gap-1">
                <button onClick={() => { setEditId(brand.id); setEditName(brand.name) }}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded">
                  <Pencil size={14} />
                </button>
                <button onClick={() => { if (confirm('Delete brand?')) deleteMutation.mutate(brand.id) }}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded">
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
