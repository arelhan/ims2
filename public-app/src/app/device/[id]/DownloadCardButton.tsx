'use client'
import { useState } from 'react'

export default function DownloadCardButton({ deviceName }: { deviceName: string }) {
  const [loading, setLoading] = useState(false)

  async function handleDownload() {
    const card = document.getElementById('device-card')
    if (!card) return
    setLoading(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(card, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        scale: 2,
        onclone: (_doc, el) => {
          // Force all text inside the card to be visible
          el.querySelectorAll<HTMLElement>('span, p, h1, h2, dt, dd').forEach(node => {
            const computed = window.getComputedStyle(node)
            if (!node.style.color) {
              node.style.color = computed.color || '#0f172a'
            }
          })
          // Ensure flex containers render correctly
          el.querySelectorAll<HTMLElement>('[class*="flex"]').forEach(node => {
            const computed = window.getComputedStyle(node)
            if (computed.display.includes('flex')) {
              node.style.display = computed.display
            }
          })
        },
      })
      const link = document.createElement('a')
      link.download = `${deviceName.replace(/\s+/g, '-').toLowerCase()}-card.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition disabled:opacity-60"
    >
      {loading ? (
        <>
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Preparing...
        </>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Download Device Card
        </>
      )}
    </button>
  )
}
