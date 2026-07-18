import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://fishkeeper.ai';
  const lastModified = new Date();

  return [
    { url: baseUrl, lastModified, changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/pricing`, lastModified, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/tools`, lastModified, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/enterprise`, lastModified, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/partner`, lastModified, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/signup`, lastModified, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/connect/mcp`, lastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/catalogue`, lastModified, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/verify`, lastModified, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/legal`, lastModified, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/privacy`, lastModified, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/terms`, lastModified, changeFrequency: 'monthly', priority: 0.5 },
  ];
}
