'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { useState } from 'react'
import { Plus, Trash2, Type, AlignLeft, Hash, Calendar, ToggleLeft, Mail, Phone, ChevronDown } from 'lucide-react'

const FIELD_TYPES = [
  { value: 'TEXT',     label: 'Text',      icon: Type,        desc: 'Single line text' },
  { value: 'TEXTAREA', label: 'Long Text', icon: AlignLeft,   desc: 'Multi-line text' },
  { value: 'NUMBER',   label: 'Number',    icon: Hash,        desc: 'Numeric value' },
  { value: 'DATE',     label: 'Date',      icon: Calendar,    desc: 'Date picker' },
  { value: 'BOOLEAN',  label: 'Yes / No',  icon: ToggleLeft,  desc: 'Checkbox' },
  { value: 'EMAIL',    label: 'Email',     icon: Mail,        desc: 'Email address' },
  { value: 'SELECT',   label: 'Dropdown',  icon: ChevronDown, desc: 'Choose from options' },
  { value: 'PHONE',    label: 'Phone',     icon: Phone,       desc: 'Phone number' },
]

const FIELD_TYPES_MAP = Object.fromEntries(FIELD_TYPES.map(t => [t.value, t]))

function toFieldKey(label: string): string {
  return label.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
}

export default function CustomFieldsTab() {
  const queryClient = useQueryClient()
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ label: '', fieldType: 'TEXT', isRequired: false, placeholder: '', selectOptions: '' })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get('/categories')).data,
  })

  const { data: fields = [] } = useQuery({
    queryKey: ['fields', selectedCategory],
    queryFn: async () => (await api.get(`/categories/${selectedCategory}/fields`)).data,
    enabled: !!selectedCategory,
  })

  const createMutation = useMutation({
    mutationFn: async () => (await api.post(`/categories/${selectedCategory}/fields`, {
      label: form.label,
      fieldKey: toFieldKey(form.label),
      fieldType: form.fieldType,
      isRequired: form.isRequired,
      placeholder: form.fieldType === 'SELECT' ? form.selectOptions : form.placeholder,
    })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fields', selectedCategory] })
      setForm({ label: '', fieldType: 'TEXT', isRequired: false, placeholder: '', selectOptions: '' })
      setShowAdd(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (fid: string) => api.delete(`/categories/${selectedCategory}/fields/${fid}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fields', selectedCategory] }),
  })

  const selectedFieldType = FIELD_TYPES_MAP[form.fieldType]

  return (
    <div className="max-w-xl space-y-5">
      {/* Category picker */}
      <div className="flex gap-2 flex-wrap">
        {(categories as any[]).map((c: any) => (
          <button
            key={c.id}
            onClick={() => { setSelectedCategory(c.id); setShowAdd(false) }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              selectedCategory === c.id
                ? 'bg-slate-900 dark:bg-sky-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400'
            }`}
          >
            {c.name}
            <span className="ml-2 text-xs opacity-60">{c._count?.customFields ?? ''}</span>
          </button>
        ))}
        {categories.length === 0 && (
          <p className="text-sm text-slate-400 dark:text-slate-500">No categories yet. Add one in the Categories tab.</p>
        )}
      </div>

      {selectedCategory && (
        <>
          {!showAdd && (
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 bg-slate-900 dark:bg-sky-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-800 dark:hover:bg-sky-500 transition"
            >
              <Plus size={15} /> Add Field
            </button>
          )}

          {showAdd && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">New Custom Field</h3>

              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Field Label *</label>
                <input
                  value={form.label}
                  onChange={e => setForm({ ...form, label: e.target.value })}
                  placeholder="e.g. RAM, Processor, Screen Size"
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 dark:bg-slate-700 dark:text-slate-100"
                  autoFocus
                />
                {form.label && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Key: <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">{toFieldKey(form.label)}</code></p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Field Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {FIELD_TYPES.map(t => {
                    const Icon = t.icon
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setForm({ ...form, fieldType: t.value })}
                        className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                          form.fieldType === t.value
                            ? 'bg-slate-900 dark:bg-sky-600 text-white border-slate-900 dark:border-sky-600'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                        }`}
                      >
                        <Icon size={15} />
                        {t.label}
                      </button>
                    )
                  })}
                </div>
                {selectedFieldType && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">{selectedFieldType.desc}</p>
                )}
              </div>

              {/* SELECT options input */}
              {form.fieldType === 'SELECT' ? (
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Options *</label>
                  <input
                    value={form.selectOptions}
                    onChange={e => setForm({ ...form, selectOptions: e.target.value })}
                    placeholder="e.g. Laptop,Desktop,Tablet"
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 dark:bg-slate-700 dark:text-slate-100"
                  />
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Seçenekleri virgülle ayırın</p>
                  {form.selectOptions && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {form.selectOptions.split(',').map(o => o.trim()).filter(Boolean).map(opt => (
                        <span key={opt} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs">{opt}</span>
                      ))}
                    </div>
                  )}
                </div>
              ) : form.fieldType !== 'BOOLEAN' && (
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Placeholder</label>
                  <input
                    value={form.placeholder}
                    onChange={e => setForm({ ...form, placeholder: e.target.value })}
                    placeholder="Optional hint text..."
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 dark:bg-slate-700 dark:text-slate-100"
                  />
                </div>
              )}

              {/* Required toggle */}
              <label className="flex items-center gap-3 cursor-pointer select-none" onClick={() => setForm({ ...form, isRequired: !form.isRequired })}>
                <div className={`w-9 h-5 rounded-full transition-colors relative ${form.isRequired ? 'bg-slate-900 dark:bg-sky-600' : 'bg-slate-200 dark:bg-slate-600'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isRequired ? 'translate-x-4' : ''}`} />
                </div>
                <span className="text-sm text-slate-700 dark:text-slate-300">Required field</span>
              </label>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => createMutation.mutate()}
                  disabled={!form.label || (form.fieldType === 'SELECT' && !form.selectOptions) || createMutation.isPending}
                  className="bg-slate-900 dark:bg-sky-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-800 dark:hover:bg-sky-500 disabled:opacity-50 transition"
                >
                  {createMutation.isPending ? 'Adding...' : 'Add Field'}
                </button>
                <button
                  onClick={() => { setShowAdd(false); setForm({ label: '', fieldType: 'TEXT', isRequired: false, placeholder: '', selectOptions: '' }) }}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Fields list */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            {(fields as any[]).length === 0 ? (
              <div className="p-10 text-center text-slate-400 dark:text-slate-500 text-sm">No fields yet for this category</div>
            ) : (
              <div className="divide-y divide-slate-50 dark:divide-slate-700">
                {(fields as any[]).map((field: any) => {
                  const typeInfo = FIELD_TYPES_MAP[field.fieldType]
                  const Icon = typeInfo?.icon ?? Type
                  const optionCount = field.fieldType === 'SELECT'
                    ? (field.placeholder || '').split(',').filter(Boolean).length
                    : 0
                  return (
                    <div key={field.id} className="flex items-center gap-3 px-4 py-3.5">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                        <Icon size={13} className="text-slate-500 dark:text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{field.label}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                          {typeInfo?.label ?? field.fieldType}
                          {field.fieldType === 'SELECT' && ` · ${optionCount} options`}
                          {field.isRequired && <span className="text-red-400 ml-1">· Required</span>}
                        </p>
                      </div>
                      <button
                        onClick={() => { if (confirm('Delete this field? Existing values will be removed.')) deleteMutation.mutate(field.id) }}
                        className="p-1.5 text-slate-300 dark:text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
