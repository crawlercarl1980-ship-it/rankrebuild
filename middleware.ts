import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Check for Supabase session cookie (sb-*-auth-token)
  const cookies = request.cookies.getAll()
  const hasSession = cookies.some(c => c.name.includes('auth-token') && c.value.length > 10)

  // Protect dashboard and chat routes
  if (!hasSession && (pathname.startsWith('/dashboard') || pathname.startsWith('/chat'))) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth'
    return NextResponse.redirect(url)
  }

  // Redirect logged-in users away from auth page
  if (hasSession && pathname === '/auth') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/chat/:path*', '/auth'],
}
