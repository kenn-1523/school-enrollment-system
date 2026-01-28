/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  // We deleted the 'eslint' section here.
  // Next.js will still use your other file automatically!
};

export default nextConfig;