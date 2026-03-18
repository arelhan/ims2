/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/devices/:id',
        destination: '/device/:id',
        permanent: false,
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.BACKEND_URL || 'http://localhost:4000'}/api/:path*`,
      },
    ]
  },
}
module.exports = nextConfig
