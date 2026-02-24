/** @type {import('next').NextConfig} */
const nextConfig = {
  /**
   * Static export mode
   * Required because you're deploying the /out folder
   */
  output: "export",

  /**
   * Since this is static hosting,
   * Next Image optimization must be disabled
   */
  images: {
    unoptimized: true,
  },

  /**
   * Adds trailing slash to all routes
   * Example: /about → /about/
   * Useful for static hosting compatibility
   */
  trailingSlash: true,

  /**
   * Enable source maps in production
   * So you can debug readable code even if bundled
   */
  productionBrowserSourceMaps: true,

  /**
   * Disable minification ONLY if you want readable JS in /out
   * ⚠ Not recommended for final production (larger files)
   */
  // swcMinify: false,
};

export default nextConfig;