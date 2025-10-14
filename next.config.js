/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export', // Commented out for development
  // distDir: 'out', // Commented out for development
  images: {
    unoptimized: true,
  },
  trailingSlash: true
};

module.exports = nextConfig;
