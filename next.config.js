/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: __dirname,
  async redirects() {
    return [{ source: '/profil', destination: '/izleme-kodlari', permanent: false }]
  },
}
module.exports = nextConfig
