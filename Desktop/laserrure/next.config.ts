import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // En dev, pas d'export statique pour que "next dev" fonctionne
  ...(process.env.NODE_ENV === 'production' ? { output: 'export' as const } : {}),
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
