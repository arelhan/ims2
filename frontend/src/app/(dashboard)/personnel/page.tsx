'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import Link from 'next/link'
import { useRef, useState } from 'react'
import { ChevronDown, ChevronUp, Download, Search, Trash2, Upload } from 'lucide-react'

type Department = {
  id: string
  name: string
  _count?: { personnel: number }
}

type Personnel = {
  id: string
  name: string
  email: string
  phone?: string
  department?: { id: string; name: string }
  assignments?: Array<unknown>
}

type ImportRow = {
  name: string
  email: string
  department: string
  phone?: string
}

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  result.push(current.trim())
  return result
}

function parsePersonnelCsv(content: string): ImportRow[] {
  const lines = content
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)

  if (lines.length < 2) {
    throw new Error('CSV must include a header and at least one row.')
  }

  const header = parseCsvLine(lines[0]).map(item => item.toLowerCase())
  const expected = ['name', 'email', 'department', 'phone']
  const valid = expected.every((key, index) => header[index] === key)
  if (!valid) {
    throw new Error('Template header must be: name,email,department,phone')
  }

  return lines.slice(1).map((line, index) => {
    const [name, email, department, phone] = parseCsvLine(line)
    if (!name || !email || !department) {
      throw new Error(`Row ${index + 2}: name, email and department are required.`)
    }
    return { name, email, department, phone: phone || undefined }
  })
}

export default function PersonnelPage() {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ name: '', email: '', departmentId: '', departmentName: '', phone: '' })
  const [newDepartmentName, setNewDepartmentName] = useState('')
  const [importFile, setImportFile] = useState<File | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [actionError, setActionError] = useState('')
  const [showTools, setShowTools] = useState(false)

  const { data: departments = [], isError: isDepartmentsError, isLoading: isDepartmentsLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => (await api.get('/departments')).data,
    retry: 1,
  })

  const { data: personnel = [], isLoading } = useQuery({
    queryKey: ['personnel', search],
    queryFn: async () => (await api.get(`/personnel?search=${search}`)).data,
  })

  const createMutation = useMutation({
    mutationFn: async (data: any) => (await api.post('/personnel', data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personnel'] })
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      setForm({ name: '', email: '', departmentId: '', departmentName: '', phone: '' })
      setActionMessage('Personnel added successfully')
      setActionError('')
    },
    onError: (err: any) => setActionError(err.response?.data?.error || 'Failed to add personnel'),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/personnel/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['personnel'] }); setDeleteError('') },
    onError: (err: any) => setDeleteError(err.response?.data?.error || 'Delete failed'),
  })

  const createDepartmentMutation = useMutation({
    mutationFn: async (name: string) => (await api.post('/departments', { name })).data,
    onSuccess: (created: Department) => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      setForm(prev => ({ ...prev, departmentId: created.id }))
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

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const content = await file.text()
      const rows = parsePersonnelCsv(content)
      const errors: string[] = []
      let createdCount = 0

      for (const row of rows) {
        const matchingDepartment = (departments as Department[]).find(
          dep => dep.name.toLowerCase() === row.department.toLowerCase()
        )

        const payload: Record<string, string> = {
          name: row.name,
          email: row.email,
        }

        if (row.phone) payload.phone = row.phone
        if (matchingDepartment) {
          payload.departmentId = matchingDepartment.id
        } else {
          payload.department = row.department
        }

        try {
          await api.post('/personnel', payload)
          createdCount += 1
        } catch (err: any) {
          const reason = err.response?.data?.error || err.message || 'Unknown error'
          errors.push(`${row.email}: ${reason}`)
        }
      }

      return {
        totalRows: rows.length,
        createdCount,
        skippedCount: errors.length,
        errors,
      }
    },
    onSuccess: (result: { createdCount: number; skippedCount: number; totalRows: number; errors?: string[] }) => {
      queryClient.invalidateQueries({ queryKey: ['personnel'] })
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      setImportFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      const details = result.errors?.length ? ` Hatalar: ${result.errors.join(' | ')}` : ''
      setActionMessage(`Toplu ekleme tamamlandı. Toplam: ${result.totalRows}, Eklenen: ${result.createdCount}, Atlanan: ${result.skippedCount}.${details}`)
      setActionError('')
    },
    onError: (err: any) => setActionError(err.response?.data?.error || 'Bulk import failed'),
  })

  async function downloadTemplate() {
    const template = [
      'name,email,department,phone',
      'Ayse Yilmaz,ayse.yilmaz@firma.com,IT,05551234567',
      'Mehmet Demir,mehmet.demir@firma.com,Finance,',
    ].join('\n')

    const blobUrl = window.URL.createObjectURL(new Blob([template], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = 'personnel-template.csv'
    a.click()
    window.URL.revokeObjectURL(blobUrl)
  }

  function createPerson() {
    const payload: Record<string, string> = {
      name: form.name,
      email: form.email,
    }

    if (form.phone) payload.phone = form.phone
    if (form.departmentId) {
      payload.departmentId = form.departmentId
    } else if (form.departmentName.trim()) {
      payload.department = form.departmentName.trim()
    }

    createMutation.mutate(payload)
  }

  const hasDepartmentInput = Boolean(form.departmentId || form.departmentName.trim())
  const canCreatePerson = Boolean(form.name && form.email && hasDepartmentInput && !createMutation.isPending)

  const showDepartmentManager = !isDepartmentsError
  const departmentRows = departments as Department[]

  const browseLabel = importFile ? importFile.name : 'No file selected'

  const inputCls = "border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400"

  if (isDepartmentsError) {
    // Departments endpoint is optional for older backend versions.
  }

  const rows = personnel as Personnel[]

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Personnel</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{rows.length} people</p>
      </div>

      {/* Search — at top */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search personnel..."
          className="w-full sm:max-w-xs pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400" />
      </div>

      {/* Add Person form — always visible */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
        <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">New Personnel</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full name *"
            className={inputCls} />
          <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email *" type="email"
            className={inputCls} />
          <div className="space-y-2">
            {!isDepartmentsError && (
              <select
                value={form.departmentId}
                onChange={e => setForm({ ...form, departmentId: e.target.value })}
                className={`${inputCls} w-full`}
              >
                <option value="">Select department</option>
                {departmentRows.map(dep => (
                  <option key={dep.id} value={dep.id}>{dep.name}</option>
                ))}
              </select>
            )}
            <input
              value={form.departmentName}
              onChange={e => setForm({ ...form, departmentName: e.target.value })}
              placeholder={isDepartmentsError ? 'Department *' : 'Or type a new department'}
              className={`${inputCls} w-full`}
            />
          </div>
          <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Phone"
            className={inputCls} />
        </div>
        <div className="flex gap-2 mt-3">
          <button type="button" onClick={createPerson} disabled={!canCreatePerson}
            className="bg-slate-900 dark:bg-sky-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-800 dark:hover:bg-sky-500 disabled:opacity-50">
            {createMutation.isPending ? 'Adding...' : 'Add'}
          </button>
        </div>
      </div>

      {/* Messages */}
      {deleteError && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-2xl px-4 py-3 text-sm">{deleteError}</div>
      )}
      {actionError && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-2xl px-4 py-3 text-sm">{actionError}</div>
      )}
      {actionMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 rounded-2xl px-4 py-3 text-sm">{actionMessage}</div>
      )}

      {/* Personnel table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {isLoading ? <div className="p-8 text-center text-slate-400">Loading...</div> :
          rows.length === 0 ? <div className="p-12 text-center text-slate-400">No personnel found</div> : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-700">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Department</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Phone</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Devices</th>
                      <th className="px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                    {rows.map((p: Personnel) => (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                        <td className="px-6 py-3">
                          <Link href={`/personnel/${p.id}`} className="text-sm font-medium text-slate-900 dark:text-slate-100 hover:underline">
                            {p.name}
                          </Link>
                        </td>
                        <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-400">{p.department?.name || '—'}</td>
                        <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-400">{p.email}</td>
                        <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-400">{p.phone || '—'}</td>
                        <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-400">{p.assignments?.length || 0}</td>
                        <td className="px-6 py-3 text-right">
                          <button type="button" onClick={() => { if (confirm('Delete this person?')) deleteMutation.mutate(p.id) }}
                            className="text-slate-400 hover:text-red-600 transition">
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile card list */}
              <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-700">
                {rows.map((p: Personnel) => (
                  <div key={p.id} className="flex items-center justify-between p-4 gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                    <div className="flex-1 min-w-0">
                      <Link href={`/personnel/${p.id}`} className="text-sm font-semibold text-slate-900 dark:text-slate-100 hover:underline">
                        {p.name}
                      </Link>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{p.department?.name || '—'}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{p.email}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-slate-500 dark:text-slate-400">{p.assignments?.length || 0} devices</span>
                      <button type="button" onClick={() => { if (confirm('Delete this person?')) deleteMutation.mutate(p.id) }}
                        className="text-slate-400 hover:text-red-600 transition p-1">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
      </div>

      {/* Collapsible Tools Section — Bulk Import & Departments */}
      <div>
        <button
          type="button"
          onClick={() => setShowTools(v => !v)}
          className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition"
        >
          {showTools ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          Bulk Import & Departments
        </button>

        {showTools && (
          <div className="mt-3 space-y-4">
            {/* Bulk Import */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Bulk Personnel Import</p>
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="inline-flex items-center gap-2 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-slate-300"
                >
                  <Download size={15} /> Download CSV Template
                </button>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={e => setImportFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center justify-center px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Browse CSV
                </button>
                <p className="flex-1 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm text-slate-500 dark:text-slate-400 truncate">{browseLabel}</p>
                <button
                  type="button"
                  onClick={() => importFile && importMutation.mutate(importFile)}
                  disabled={!importFile || importMutation.isPending}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 dark:bg-sky-600 text-white rounded-xl text-sm font-medium hover:bg-slate-800 dark:hover:bg-sky-500 disabled:opacity-50"
                >
                  <Upload size={15} /> {importMutation.isPending ? 'Uploading...' : 'Import'}
                </button>
              </div>
            </div>

            {/* Department Manager */}
            {showDepartmentManager ? (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
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
                {isDepartmentsLoading ? <p className="text-xs text-slate-400">Loading departments...</p> : null}
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
            ) : (
              <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 rounded-2xl px-4 py-3 text-sm">
                Department API ulasilamiyor. Personel ekleme yine calisir; birim adini manuel girebilirsin.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
