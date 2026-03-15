'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { useState } from 'react'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'

export default function CategoriesTab() {
  const queryClient = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [deleteError, setDeleteError] = useState('')

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get('/categories')).data,
  })

  const createMutation = useMutation({
    mutationFn: async () => (await api.post('/categories', { name: newName })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setNewName('')
      setShowAdd(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) =>
      (await api.put(`/categories/${id}`, { name })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setEditId(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); setDeleteError('') },
    onError: (err: any) => setDeleteError(err.response?.data?.error || 'Delete failed'),
  })

  return (
    <div className="max-w-lg space-y-4">
      {deleteError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{deleteError}</div>
      )}

      {/* Add form */}
      {showAdd ? (
        <div className="flex gap-2">
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Category name"
            autoFocus
            className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            onKeyDown={e => e.key === 'Enter' && newName && createMutation.mutate()}
          />
          <button onClick={() => newName && createMutation.mutate()} disabled={!newName || createMutation.isPending}
            className="px-3 py-2 bg-slate-900 text-white rounded-xl text-sm disabled:opacity-50 hover:bg-slate-800 transition">
            <Check size={16} />
          </button>
          <button onClick={() => { setShowAdd(false); setNewName('') }}
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm hover:bg-slate-50 transition">
            <X size={16} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-800 transition"
        >
          <Plus size={15} /> Add Category
        </button>
      )}

      {/* List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {(categories as any[]).length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-sm">No categories yet</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {(categories as any[]).map((cat: any) => (
              <div key={cat.id} className="flex items-center justify-between px-4 py-3.5">
                {editId === cat.id ? (
                  <div className="flex gap-2 flex-1 mr-2">
                    <input
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      autoFocus
                      className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                      onKeyDown={e => e.key === 'Enter' && updateMutation.mutate({ id: cat.id, name: editName })}
                    />
                    <button onClick={() => updateMutation.mutate({ id: cat.id, name: editName })}
                      className="px-2 py-1.5 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800 transition">
                      <Check size={14} />
                    </button>
                    <button onClick={() => setEditId(null)}
                      className="px-2 py-1.5 border border-slate-200 rounded-lg text-sm hover:bg-slate-50 transition">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-slate-900">{cat.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {cat._count?.devices ?? 0} devices · {cat._count?.customFields ?? 0} custom fields
                    </p>
                  </div>
                )}
                {editId !== cat.id && (
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setEditId(cat.id); setEditName(cat.name) }}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => { if (confirm('Delete category?')) deleteMutation.mutate(cat.id) }}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
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
