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
}
module.exports = nextConfig
