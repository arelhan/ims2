'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { ArrowLeft, Pencil, X } from 'lucide-react'
import { STATUS_COLORS, STATUS_LABELS, formatDate } from '@/lib/utils'

type Department = {
  id: string
  name: string
}

export default function PersonnelDetailPage({ params }: { params: { id: string } }) {
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', departmentId: '', departmentName: '' })
  const [error, setError] = useState('')

  const { data: person, isLoading } = useQuery({
    queryKey: ['personnel', params.id],
    queryFn: async () => (await api.get(`/personnel/${params.id}`)).data,
  })

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: async () => (await api.get('/departments')).data,
    retry: 1,
  })

  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, string>) => (await api.put(`/personnel/${params.id}`, data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personnel', params.id] })
      queryClient.invalidateQueries({ queryKey: ['personnel'] })
      setIsEditing(false)
      setError('')
    },
    onError: (err: any) => setError(err.response?.data?.error || 'Failed to update personnel'),
  })

  useEffect(() => {
    if (person) {
      setEditForm({
        name: person.name || '',
        email: person.email || '',
        phone: person.phone || '',
        departmentId: person.department?.id || '',
        departmentName: '',
      })
    }
  }, [person])

  function handleSave() {
    const payload: Record<string, string> = {
      name: editForm.name,
      email: editForm.email,
    }
    if (editForm.phone) payload.phone = editForm.phone
    if (editForm.departmentId) {
      payload.departmentId = editForm.departmentId
    } else if (editForm.departmentName.trim()) {
      payload.department = editForm.departmentName.trim()
    }
    updateMutation.mutate(payload)
  }

  function startEdit() {
    if (person) {
      setEditForm({
        name: person.name || '',
        email: person.email || '',
        phone: person.phone || '',
        departmentId: person.department?.id || '',
        departmentName: '',
      })
    }
    setError('')
    setIsEditing(true)
  }

  const inputCls = "border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 w-full"

  if (isLoading) return <div className="p-8 text-slate-400">Loading...</div>
  if (!person) return <div className="p-8 text-slate-400">Not found</div>

  const activeAssignments = person.assignments?.filter((a: any) => a.isActive) || []
  const history = person.assignments?.filter((a: any) => !a.isActive) || []

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-3xl">
      <Link href="/personnel" className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
        <ArrowLeft size={16} /> Back
      </Link>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          {isEditing ? (
            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-slate-900 dark:text-slate-100">Edit Personnel</h2>
                <button onClick={() => { setIsEditing(false); setError('') }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  <X size={18} />
                </button>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 text-sm">{error}</div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 dark:text-slate-500 mb-1">Name</label>
                  <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    placeholder="Full name *" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 dark:text-slate-500 mb-1">Email</label>
                  <input value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                    placeholder="Email *" type="email" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 dark:text-slate-500 mb-1">Department</label>
                  <select
                    value={editForm.departmentId}
                    onChange={e => setEditForm({ ...editForm, departmentId: e.target.value })}
                    className={inputCls}
                  >
                    <option value="">Select department</option>
                    {(departments as Department[]).map(dep => (
                      <option key={dep.id} value={dep.id}>{dep.name}</option>
                    ))}
                  </select>
                  <input
                    value={editForm.departmentName}
                    onChange={e => setEditForm({ ...editForm, departmentName: e.target.value })}
                    placeholder="Or type a new department"
                    className={`${inputCls} mt-2`}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 dark:text-slate-500 mb-1">Phone</label>
                  <input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="Phone" className={inputCls} />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={handleSave}
                  disabled={!editForm.name || !editForm.email || updateMutation.isPending}
                  className="bg-slate-900 dark:bg-sky-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-800 dark:hover:bg-sky-500 disabled:opacity-50">
                  {updateMutation.isPending ? 'Saving...' : 'Save'}
                </button>
                <button type="button" onClick={() => { setIsEditing(false); setError('') }}
                  className="px-4 py-2 rounded-xl text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{person.name}</h1>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                  <div>
                    <p className="text-xs text-slate-400 dark:text-slate-500">Department</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{person.department?.name || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 dark:text-slate-500">Email</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 break-all">{person.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 dark:text-slate-500">Phone</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{person.phone || '—'}</p>
                  </div>
                </div>
              </div>
              <button onClick={startEdit}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition shrink-0">
                <Pencil size={14} /> Edit
              </button>
            </>
          )}
        </div>
      </div>

      {/* Active Devices */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 sm:p-6">
        <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">
          Currently Assigned Devices ({activeAssignments.length})
        </h2>
        {activeAssignments.length === 0 ? (
          <p className="text-sm text-slate-400">No active assignments</p>
        ) : (
          <div className="space-y-2">
            {activeAssignments.map((a: any) => (
              <div key={a.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 border-b border-slate-50 dark:border-slate-700 last:border-0 gap-1.5">
                <div>
                  <Link href={`/devices/${a.device?.id}`} className="text-sm font-medium text-slate-900 dark:text-slate-100 hover:underline">
                    {a.device?.name}
                  </Link>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{a.device?.category?.name} · {a.device?.serialNumber}</p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[a.device?.status]}`}>
                    {STATUS_LABELS[a.device?.status]}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">Since {formatDate(a.assignedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 sm:p-6">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">Assignment History ({history.length})</h2>
          <div className="space-y-2">
            {history.map((a: any) => (
              <div key={a.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 border-b border-slate-50 dark:border-slate-700 last:border-0 gap-1">
                <div>
                  <Link href={`/devices/${a.device?.id}`} className="text-sm font-medium text-slate-900 dark:text-slate-100 hover:underline">
                    {a.device?.name}
                  </Link>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{a.device?.category?.name}</p>
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500 sm:text-right">
                  <p>{formatDate(a.assignedAt)}</p>
                  <p>→ {formatDate(a.returnedAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
