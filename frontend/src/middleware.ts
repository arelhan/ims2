import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isSafeRedirectPath } from '@/lib/utils'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000'

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  const { pathname, search } = request.nextUrl
  const nextParam = request.nextUrl.searchParams.get('next')

  const isPublicPage =
    pathname === '/login' ||
    pathname === '/setup' ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password'

  if (!token && !isPublicPage) {
    // No token -> check if setup is needed first
    const needsSetup = await checkNeedsSetup()
    if (needsSetup) {
      return NextResponse.redirect(new URL('/setup', request.url))
    }
    // Setup done, go to login and keep original target for post-login redirect.
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', `${pathname}${search}`)
    return NextResponse.redirect(loginUrl)
  }
  if (token && isPublicPage) {
    if (pathname === '/login' && isSafeRedirectPath(nextParam)) {
      return NextResponse.redirect(new URL(nextParam, request.url))
    }
    return NextResponse.redirect(new URL('/', request.url))
  }
  return NextResponse.next()
}

async function checkNeedsSetup(): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/setup/status`, {
      signal: AbortSignal.timeout(2000),
    })
    const data = await res.json()
    return data.needsSetup === true
  } catch {
    return false
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
