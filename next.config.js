/** @type {import('next').NextConfig} */
module.exports = {
  // ensure static export works with folder-style routes
  output: 'export',
  trailingSlash: true,
  // preserve existing settings if any
  images: {
    unoptimized: true,
  },
};
