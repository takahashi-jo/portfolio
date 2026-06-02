import type { MetadataRoute } from 'next'
import { getPage } from '@/lib/notion'
import { ROOT_PAGE_ID } from '@/lib/constants'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const recordMap = await getPage(ROOT_PAGE_ID)
  const base = 'https://jo-takahashi.me'

  const pageIds = Object.entries(recordMap.block)
    .filter(
      ([id, block]) =>
        block.value?.type === 'page' &&
        id.replace(/-/g, '') !== ROOT_PAGE_ID
    )
    .map(([id]) => id.replace(/-/g, ''))

  return [
    { url: base, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    ...pageIds.map((id) => ({
      url: `${base}/${id}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ]
}
