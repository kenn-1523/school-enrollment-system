export const dynamic = "force-static";
export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/admin/'], // Hide private areas if you have them
    },
    sitemap: 'https://elitecroupier.com/sitemap.xml',
  };
}