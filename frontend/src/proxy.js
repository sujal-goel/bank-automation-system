import { NextResponse } from 'next/server';

const isProd = process.env.NODE_ENV === 'production';

export default function proxy(request) {
  // Generate a simple nonce for this request
  const nonce = Math.random().toString(36).substring(2, 15);
  
  const csp = [
    // Default lock-down
    "default-src 'self'",

    // Scripts: allow self + Next.js internals with nonce and unsafe-eval for development
    isProd 
      ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`
      : 'script-src \'self\' \'unsafe-eval\' \'unsafe-inline\'',

    // Styles: Next.js needs inline styles
    "style-src 'self' 'unsafe-inline'",

    // Images
    "img-src 'self' data: blob: https:",

    // Fonts
    "font-src 'self' data:",

    // Network access
    isProd
      ? "connect-src 'self' https://api.yourdomain.com"
      : "connect-src 'self' http://localhost:3000 ws://localhost:3000",

    // No plugins, ever
    "object-src 'none'",

    // Prevent <base> tag attacks
    "base-uri 'self'",

    // Prevent form hijacking
    "form-action 'self'",

    // Prevent clickjacking
    "frame-ancestors 'none'",

    // Allow workers (Next.js uses them)
    "worker-src 'self' blob:",

    // Block mixed content in production only
    ...(isProd ? ['upgrade-insecure-requests'] : []),
  ].join('; ');

  const res = NextResponse.next();

  res.headers.set('Content-Security-Policy', csp);
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Only set HSTS in production
  if (isProd) {
    res.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload',
    );
  }
  
  res.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()',
  );
  
  // Add the nonce to the request headers so it can be used in pages
  res.headers.set('x-nonce', nonce);

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};