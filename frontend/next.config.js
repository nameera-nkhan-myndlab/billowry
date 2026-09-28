/** @type {import('next').NextConfig} */
const nextConfig = {
  // No rewrites — /api/* routes are handled natively by Next.js API routes.
  allowedDevOrigins: ['*.preview.myndlab.ai', '*.hotload.myndlab.ai', '*.localhost', 'localhost'],
  serverExternalPackages: ['better-sqlite3'],
};

module.exports = nextConfig;