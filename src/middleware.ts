import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This middleware handles shop routing and context resolution
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip middleware for static files, API routes, and other special paths
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/logo.') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }
  
  // Handle shop-specific routes: /shop/{slug} and /admin/{slug}
  const shopMatch = pathname.match(/^\/(shop|admin)\/([^\/]+)(?:\/(.*))?$/)
  
  if (shopMatch) {
    const [, routeType, shopSlug, subPath] = shopMatch
    
    // TODO: Validate shop exists in database
    // For now, we'll allow all shop slugs and let the components handle validation
    
    // Add shop context to headers for use in components
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-shop-slug', shopSlug)
    requestHeaders.set('x-route-type', routeType)
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }
  
  // Handle root path - redirect to default shop or show shop selector
  if (pathname === '/') {
    // For now, redirect to SD Electric Bike (legacy behavior)
    // Later we can show a shop selector or landing page
    return NextResponse.redirect(new URL('/shop/sd-electric-bike', request.url))
  }
  
  // Handle legacy /admin path - redirect to default shop admin
  if (pathname === '/admin') {
    return NextResponse.redirect(new URL('/admin/sd-electric-bike', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}