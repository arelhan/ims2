'use client'
import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Download, Upload } from 'lucide-react'

type Department = {
  id: string
  name: string
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

export default function BulkImportTab() {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [actionMessage, setActionMessage] = useState('')
  const [actionError, setActionError] = useState('')

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => (await api.get('/departments')).data,
    retry: 1,
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
    onSuccess: (result) => {
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

  function downloadTemplate() {
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

  const browseLabel = importFile ? importFile.name : 'No file selected'

  return (
    <div className="space-y-4">
      {actionError && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-2xl px-4 py-3 text-sm">{actionError}</div>
      )}
      {actionMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 rounded-2xl px-4 py-3 text-sm">{actionMessage}</div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
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
    </div>
  )
}
