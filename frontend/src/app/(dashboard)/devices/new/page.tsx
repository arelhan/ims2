'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { useRouter } from 'next/navigation'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { CustomFieldInput } from '@/components/CustomFieldInput'

export default function NewDevicePage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<any>({
    name: '', serialNumber: '', categoryId: '',
    status: 'IN_WAREHOUSE', purchaseDate: '', notes: '',
  })
  const [customValues, setCustomValues] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [assignPersonnelId, setAssignPersonnelId] = useState('')
  const [personnelSearch, setPersonnelSearch] = useState('')
  const [showPersonnelOptions, setShowPersonnelOptions] = useState(false)

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get('/categories')).data,
  })

  const { data: personnel = [] } = useQuery({
    queryKey: ['personnel'],
    queryFn: async () => (await api.get('/personnel')).data,
  })

  const selectedCategory = categories.find((c: any) => c.id === form.categoryId)

  const filteredPersonnel = useMemo(() => {
    const allPersonnel = personnel as any[]
    const q = personnelSearch.trim().toLowerCase()
    if (!q) return allPersonnel.slice(0, 12)
    return allPersonnel
      .filter((p: any) => {
        const name = (p.name || '').toLowerCase()
        const department = (p.department?.name || '').toLowerCase()
        return name.includes(q) || department.includes(q)
      })
      .slice(0, 12)
  }, [personnel, personnelSearch])

  function selectPersonnel(p: any) {
    const departmentName = p.department?.name || '—'
    setAssignPersonnelId(p.id)
    setPersonnelSearch(`${p.name} (${departmentName})`)
    setShowPersonnelOptions(false)
  }

  const { data: fields = [] } = useQuery({
    queryKey: ['fields', form.categoryId],
    queryFn: async () => (await api.get(`/categories/${form.categoryId}/fields`)).data,
    enabled: !!form.categoryId,
  })

  const mutation = useMutation({
    mutationFn: async (data: any) => (await api.post('/devices', data)).data,
    onSuccess: async (device) => {
      if (form.status === 'ASSIGNED' && assignPersonnelId) {
        try {
          await api.post('/assignments', { deviceId: device.id, personnelId: assignPersonnelId })
        } catch (err: any) {
          setError(err.response?.data?.error || 'Device created but assignment failed')
        }
      }
      queryClient.invalidateQueries({ queryKey: ['devices'] })
      router.push(`/devices/${device.id}`)
    },
    onError: (err: any) => setError(err.response?.data?.error || 'Failed to create device'),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const data = {
      ...form,
      status: form.status === 'ASSIGNED' ? 'IN_WAREHOUSE' : form.status,
      purchaseDate: form.purchaseDate || undefined,
      customValues: Object.entries(customValues).map(([customFieldId, value]) => ({ customFieldId, value })),
    }
    mutation.mutate(data)
  }

  const inputCls = "w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400"

  return (
    <div className="p-4 sm:p-8 max-w-2xl">
      <Link href="/devices" className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mb-6">
        <ArrowLeft size={16} /> Back to Devices
      </Link>

      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">Add New Device</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-2xl px-4 py-3 text-sm">{error}</div>
        )}

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 sm:p-6 space-y-4">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">Basic Info</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Device Name *</label>
              <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className={inputCls} placeholder="MacBook Pro 14" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Serial Number *</label>
              <input required value={form.serialNumber} onChange={e => setForm({ ...form, serialNumber: e.target.value })}
                className={inputCls} placeholder="SN-2024-001" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category *</label>
              <select required value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}
                className={inputCls}>
                <option value="">Select category</option>
                {(categories as any[]).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Initial Status</label>
              <select value={form.status} onChange={e => { setForm({ ...form, status: e.target.value }); setAssignPersonnelId(''); setPersonnelSearch('') }}
                className={inputCls}>
                <option value="IN_WAREHOUSE">In Warehouse</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="RETIRED">Retired</option>
              </select>
            </div>
          </div>

          {form.status === 'ASSIGNED' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Assign To *</label>
              <div className="relative">
                <input
                  value={personnelSearch}
                  onFocus={() => setShowPersonnelOptions(true)}
                  onBlur={() => setShowPersonnelOptions(false)}
                  onChange={e => {
                    setPersonnelSearch(e.target.value)
                    setAssignPersonnelId('')
                    setShowPersonnelOptions(true)
                  }}
                  placeholder="Personel ara (isim veya departman)"
                  className={inputCls}
                />
                {showPersonnelOptions && (
                  <div className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
                    {filteredPersonnel.length > 0 ? (
                      filteredPersonnel.map((p: any) => (
                        <button
                          key={p.id}
                          type="button"
                          onMouseDown={e => { e.preventDefault(); selectPersonnel(p) }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50"
                        >
                          <span className="font-medium text-slate-900 dark:text-slate-100">{p.name}</span>
                          <span className="text-slate-500 dark:text-slate-400"> ({p.department?.name || '—'})</span>
                        </button>
                      ))
                    ) : (
                      <p className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">Personel bulunamadı</p>
                    )}
                  </div>
                )}
              </div>
              {assignPersonnelId && (
                <p className="text-xs text-green-700 dark:text-green-400">Personel seçildi.</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Purchase Date</label>
            <input type="date" value={form.purchaseDate} onChange={e => setForm({ ...form, purchaseDate: e.target.value })}
              className={inputCls} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2}
              className={inputCls} />
          </div>
        </div>

        {fields.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 sm:p-6 space-y-4">
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">
              {selectedCategory?.name} Specifications
            </h2>
            {(fields as any[]).map((field: any) => (
              <div key={field.id}>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {field.label} {field.isRequired && <span className="text-red-500">*</span>}
                </label>
                <CustomFieldInput
                  field={field}
                  value={customValues[field.id] || ''}
                  onChange={val => setCustomValues({ ...customValues, [field.id]: val })}
                />
              </div>
            ))}
          </div>
        )}

        <button type="submit" disabled={mutation.isPending}
          className="w-full bg-slate-900 dark:bg-sky-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-slate-800 dark:hover:bg-sky-500 transition disabled:opacity-50">
          {mutation.isPending ? 'Creating...' : 'Create Device'}
        </button>
      </form>
    </div>
  )
}
