import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/expenses', '/budget', '/savings', '/history', '/settings', '/couple', '/invite/', '/api/'],
      },
    ],
    sitemap: 'https://onkhalass.netlify.app/sitemap.xml',
    host: 'https://onkhalass.netlify.app',
  }
}
