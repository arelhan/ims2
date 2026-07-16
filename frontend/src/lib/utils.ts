import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date | null | undefined) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

export const STATUS_LABELS: Record<string, string> = {
  IN_WAREHOUSE: 'In Warehouse',
  ASSIGNED: 'Assigned',
  MAINTENANCE: 'Maintenance',
  RETIRED: 'Retired',
}

export function normalizeUsername(value: string) {
  return value.toLowerCase().replace(/\s+/g, '')
}

export function isSafeRedirectPath(path: string | null | undefined): path is string {
  return !!path && path.startsWith('/') && !path.startsWith('//')
}

export const STATUS_COLORS: Record<string, string> = {
  IN_WAREHOUSE: 'bg-blue-100 text-blue-800',
  ASSIGNED: 'bg-green-100 text-green-800',
  MAINTENANCE: 'bg-amber-100 text-amber-800',
  RETIRED: 'bg-slate-100 text-slate-600',
}

// Quote a single CSV cell, escaping embedded quotes and wrapping when needed.
function csvCell(value: unknown): string {
  const s = value == null ? '' : String(value)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

// Build a CSV string from column definitions and rows, then trigger a download.
export function exportToCsv<T>(
  filename: string,
  columns: { header: string; get: (row: T) => unknown }[],
  rows: T[]
) {
  const headerLine = columns.map(c => csvCell(c.header)).join(',')
  const dataLines = rows.map(row => columns.map(c => csvCell(c.get(row))).join(','))
  // Prepend BOM (U+FEFF) so Excel opens UTF-8 correctly (Turkish characters).
  const csv = '﻿' + [headerLine, ...dataLines].join('\r\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  window.URL.revokeObjectURL(url)
}
