import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Device Info',
  description: 'Office inventory device information',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 min-h-screen">{children}</body>
    </html>
  )
}
