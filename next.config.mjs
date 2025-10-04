/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    typedRoutes: false,
    serverActions: false,
  },
  swcMinify: false,
  reactStrictMode: false,
  poweredByHeader: false,
  transpilePackages: ['@supabase/auth-helpers-nextjs'],
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  images: {
    domains: ['localhost']
  }
}

export default nextConfig