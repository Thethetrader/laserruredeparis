/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD
  },
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
}

module.exports = nextConfig 