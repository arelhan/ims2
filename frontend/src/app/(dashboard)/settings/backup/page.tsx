'use client'
import api from '@/lib/api'
import { useState, useRef } from 'react'
import { Download, Upload, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function BackupPage() {
  const [downloadLoading, setDownloadLoading] = useState(false)
  const [restoreStatus, setRestoreStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleDownload() {
    setDownloadLoading(true)
    try {
      const res = await api.get('/admin/backup/download', {
        responseType: 'arraybuffer',
      })
      const blob = new Blob([res.data], { type: 'application/octet-stream' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      a.download = `backup-${timestamp}.db`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      setMessage('Download failed: ' + (err.response?.data?.error || err.message))
      setRestoreStatus('error')
    } finally {
      setDownloadLoading(false)
    }
  }

  async function handleRestore(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!confirm('Bu işlem mevcut veritabanının üzerine yazacak. Devam edilsin mi?')) {
      if (fileRef.current) fileRef.current.value = ''
      return
    }

    setRestoreStatus('loading')
    setMessage('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      await api.post('/admin/backup/restore', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setRestoreStatus('success')
      setMessage('Veritabanı başarıyla geri yüklendi.')
    } catch (err: any) {
      setRestoreStatus('error')
      setMessage(err.response?.data?.error || 'Geri yükleme başarısız.')
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="p-4 sm:p-8 max-w-lg space-y-6">
      <Link href="/settings" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft size={16} /> Back to Settings
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Backup & Restore</h1>
        <p className="text-slate-500 text-sm mt-1">Veritabanını indir veya geri yükle</p>
      </div>

      {restoreStatus === 'success' && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">
          <CheckCircle size={16} /> {message}
        </div>
      )}
      {restoreStatus === 'error' && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          <AlertCircle size={16} /> {message}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-slate-900">Backup İndir</h2>
          <p className="text-sm text-slate-500 mt-1">Mevcut SQLite veritabanını .db dosyası olarak indir.</p>
        </div>
        <button
          onClick={handleDownload}
          disabled={downloadLoading}
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition disabled:opacity-50"
        >
          {downloadLoading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          {downloadLoading ? 'İndiriliyor...' : 'Backup İndir'}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-slate-900">Veritabanı Geri Yükle</h2>
          <p className="text-sm text-slate-500 mt-1">
            Daha önce indirilen .db dosyasını yükle. Mevcut veritabanı otomatik olarak yedeklenir.
          </p>
        </div>
        <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center">
          <Upload size={24} className="mx-auto text-slate-300 mb-2" />
          <p className="text-sm text-slate-500 mb-3">Bir .db dosyası seç</p>
          <input
            ref={fileRef}
            type="file"
            accept=".db"
            onChange={handleRestore}
            className="hidden"
            id="restore-file"
            disabled={restoreStatus === 'loading'}
          />
          <label
            htmlFor="restore-file"
            className={`inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-200 cursor-pointer transition ${
              restoreStatus === 'loading' ? 'opacity-50 pointer-events-none' : ''
            }`}
          >
            {restoreStatus === 'loading' ? (
              <><Loader2 size={15} className="animate-spin" /> Yükleniyor...</>
            ) : 'Dosya Seç'}
          </label>
        </div>
      </div>
    </div>
  )
}
