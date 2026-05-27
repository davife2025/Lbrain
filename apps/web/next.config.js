/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@lbrain/lbank-skills', '@lbrain/ai'],
  serverExternalPackages: ['crypto'],
}

module.exports = nextConfig