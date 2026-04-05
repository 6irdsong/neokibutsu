import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Block AI crawlers
      { userAgent: 'GPTBot', disallow: '/' },
      { userAgent: 'CCBot', disallow: '/' },
      { userAgent: 'ChatGPT-User', disallow: '/' },
      { userAgent: 'anthropic-ai', disallow: '/' },
      { userAgent: 'Bytespider', disallow: '/' },
      { userAgent: 'PetalBot', disallow: '/' },
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/*?*'],
      },
    ],
    sitemap: 'https://www.neokibutsu.net/sitemap.xml',
  }
}
