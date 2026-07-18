import { MetadataRoute } from 'next'
import { vertical } from '@/lib/vertical';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/api/',
    },
    sitemap: `${vertical.domain}/sitemap.xml`,
  }
}
