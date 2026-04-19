/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@pitch-therapy/core", "@pitch-therapy/ui"],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
