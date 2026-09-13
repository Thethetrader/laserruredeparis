/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD
  },
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
        dns: false,
        child_process: false,
        dgram: false,
      }
    }
    return config
  },
}

module.exports = nextConfig