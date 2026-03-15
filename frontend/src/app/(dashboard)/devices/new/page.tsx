'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
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

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get('/categories')).data,
  })

  const selectedCategory = categories.find((c: any) => c.id === form.categoryId)

  const { data: fields = [] } = useQuery({
    queryKey: ['fields', form.categoryId],
    queryFn: async () => (await api.get(`/categories/${form.categoryId}/fields`)).data,
    enabled: !!form.categoryId,
  })

  const mutation = useMutation({
    mutationFn: async (data: any) => (await api.post('/devices', data)).data,
    onSuccess: (device) => {
      queryClient.invalidateQueries({ queryKey: ['devices'] })
      router.push(`/devices/${device.id}`)
    },
    onError: (err: any) => setError(err.response?.data?.error || 'Failed to create device'),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const data = {
      ...form,
      purchaseDate: form.purchaseDate || undefined,
      customValues: Object.entries(customValues).map(([customFieldId, value]) => ({ customFieldId, value })),
    }
    mutation.mutate(data)
  }

  const inputCls = "w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"

  return (
    <div className="p-4 sm:p-8 max-w-2xl">
      <Link href="/devices" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6">
        <ArrowLeft size={16} /> Back to Devices
      </Link>

      <h1 className="text-2xl font-bold text-slate-900 mb-6">Add New Device</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 text-sm">{error}</div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
          <h2 className="font-semibold text-slate-900">Basic Info</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Device Name *</label>
              <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className={inputCls} placeholder="MacBook Pro 14" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Serial Number *</label>
              <input required value={form.serialNumber} onChange={e => setForm({ ...form, serialNumber: e.target.value })}
                className={inputCls} placeholder="SN-2024-001" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
              <select required value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}
                className={inputCls}>
                <option value="">Select category</option>
                {(categories as any[]).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Initial Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                className={inputCls}>
                <option value="IN_WAREHOUSE">In Warehouse</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="RETIRED">Retired</option>
              </select>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 text-xs text-blue-700">
            Cihazı birine atamak için önce kaydedin, ardından detay sayfasından atama yapın.
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Purchase Date</label>
            <input type="date" value={form.purchaseDate} onChange={e => setForm({ ...form, purchaseDate: e.target.value })}
              className={inputCls} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2}
              className={inputCls} />
          </div>
        </div>

        {fields.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
            <h2 className="font-semibold text-slate-900">
              {selectedCategory?.name} Specifications
            </h2>
            {(fields as any[]).map((field: any) => (
              <div key={field.id}>
                <label className="block text-sm font-medium text-slate-700 mb-1">
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
          className="w-full bg-slate-900 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-slate-800 transition disabled:opacity-50">
          {mutation.isPending ? 'Creating...' : 'Create Device'}
        </button>
      </form>
    </div>
  )
}
