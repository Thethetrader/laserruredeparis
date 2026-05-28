import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  watchOptions: {
    ignored: [
      "**/node_modules/**",
      "**/.git/**",
      "/Users/theodorebrey/Library/**",
      "/Users/theodorebrey/Desktop/**",
      "!/Users/theodorebrey/Desktop/Carafe/**",
    ],
  },
};

export default nextConfig;
