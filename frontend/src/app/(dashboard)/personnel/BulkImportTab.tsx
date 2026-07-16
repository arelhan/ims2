'use client'
import { useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Download, Upload } from 'lucide-react'

type ImportResult = {
  totalRows: number
  createdCount: number
  skippedCount: number
  errors: string[]
}

export default function BulkImportTab() {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [actionMessage, setActionMessage] = useState('')
  const [actionError, setActionError] = useState('')

  const importMutation = useMutation({
    mutationFn: async (file: File): Promise<ImportResult> => {
      const formData = new FormData()
      formData.append('file', file)
      // The backend parses/validates the CSV and inserts atomically per row.
      const res = await api.post('/personnel/bulk-import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return res.data
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
    // Fetch the canonical template from the backend so it always matches
    // the parser's expected header.
    api.get('/personnel/template', { responseType: 'blob' })
      .then(res => {
        const blobUrl = window.URL.createObjectURL(res.data)
        const a = document.createElement('a')
        a.href = blobUrl
        a.download = 'personnel-template.csv'
        a.click()
        window.URL.revokeObjectURL(blobUrl)
      })
      .catch(() => setActionError('Could not download template'))
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
        <p className="text-xs text-slate-400 dark:text-slate-500">
          CSV format: <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">name,email,department,phone</code>. Missing departments are created automatically.
        </p>
      </div>
    </div>
  )
}
