import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isSafeRedirectPath } from '@/lib/utils'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  const { pathname, search } = request.nextUrl
  const nextParam = request.nextUrl.searchParams.get('next')

  const isPublicPage =
    pathname === '/login' ||
    pathname === '/setup' ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password'

  if (!token && !isPublicPage) {
    // No token -> go to login and keep original target for post-login redirect.
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

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
