import QRCode from 'qrcode'
import os from 'os'

export function getServerIP(): string {
  // If explicitly configured, use that
  if (process.env.PUBLIC_APP_URL) return process.env.PUBLIC_APP_URL

  // Auto-detect the first non-internal IPv4 address
  const interfaces = os.networkInterfaces()
  for (const name of Object.keys(interfaces)) {
    for (const iface of (interfaces[name] || [])) {
      if (iface.family === 'IPv4' && !iface.internal) {
        const port = process.env.PUBLIC_APP_PORT || '3002'
        return `http://${iface.address}:${port}`
      }
    }
  }
  return `http://localhost:${process.env.PUBLIC_APP_PORT || '3002'}`
}

export async function generateDeviceQR(deviceId: string): Promise<string> {
  const base = getServerIP()
  const url = `${base}/device/${deviceId}`
  return QRCode.toDataURL(url, {
    width: 300,
    margin: 2,
    color: { dark: '#0f172a', light: '#ffffff' },
    errorCorrectionLevel: 'M',
  })
}
