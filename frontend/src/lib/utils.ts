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
