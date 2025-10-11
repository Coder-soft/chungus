import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    // Match all request paths except for:
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - _next/internal (Next.js internal helpers)
    // - favicon and common image assets
    // - auth/callback (OAuth code exchange)
    '/((?!_next/static|_next/image|_next/internal|favicon.ico|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
