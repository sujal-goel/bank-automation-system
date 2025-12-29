/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  
  // Output configuration for Vercel
  output: 'standalone',
  
  // Turbopack configuration
  turbopack: {
    root: process.cwd(),
  },
  
  // API proxy to backend server
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: process.env.NODE_ENV === 'production' 
          ? '/api/backend/:path*'  // In production, handled by Vercel routing
          : 'http://localhost:3000/api/:path*'  // In development, proxy to backend
      },
      {
        source: '/health',
        destination: process.env.NODE_ENV === 'production'
          ? '/health'  // In production, handled by Vercel routing
          : 'http://localhost:3000/health'  // In development, proxy to backend
      },
      {
        source: '/api-docs',
        destination: process.env.NODE_ENV === 'production'
          ? '/api-docs'  // In production, handled by Vercel routing
          : 'http://localhost:3000/api-docs'  // In development, proxy to backend
      }
    ];
  },
  
  // Custom headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          }
        ]
      }
    ];
  },
  
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.vercel.app',
        port: '',
        pathname: '/**',
      }
    ],
    formats: ['image/webp', 'image/avif']
  },
  
  // Environment variables for client-side
  env: {
    NEXT_PUBLIC_API_URL: process.env.NODE_ENV === 'production' 
      ? process.env.NEXT_PUBLIC_API_URL || ''
      : 'http://localhost:3000',
    NEXT_PUBLIC_FRONTEND_URL: process.env.NODE_ENV === 'production'
      ? process.env.NEXT_PUBLIC_FRONTEND_URL || ''
      : 'http://localhost:3001'
  },
  
  // Experimental features
  experimental: {
    optimizePackageImports: ['lucide-react', '@headlessui/react']
  },
  
  // Webpack configuration for better optimization
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Optimize bundle size
    if (!dev && !isServer) {
      config.optimization.splitChunks.chunks = 'all';
    }
    
    return config;
  }
};

export default nextConfig;
