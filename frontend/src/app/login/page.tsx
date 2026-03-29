import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import LoginForm from './LoginForm'

async function checkSetupStatus(): Promise<boolean> {
  try {
    const res = await fetch(
      `${process.env.BACKEND_URL || 'http://localhost:4000'}/api/setup/status`,
      { cache: 'no-store', signal: AbortSignal.timeout(3000) }
    )
    const data = await res.json()
    return data.needsSetup === true
  } catch {
    return false
  }
}

export default async function LoginPage() {
  const needsSetup = await checkSetupStatus()
  if (needsSetup) redirect('/setup')
  return <Suspense><LoginForm /></Suspense>
}
