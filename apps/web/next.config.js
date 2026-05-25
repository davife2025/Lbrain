/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@lbrain/lbank-skills', '@lbrain/ai'],
  experimental: {
    serverComponentsExternalPackages: ['crypto'],
  },
}

module.exports = nextConfig
