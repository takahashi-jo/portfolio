import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getPageTitle } from 'notion-utils'
import { NotionPage } from '@/components/NotionPage'
import { getPage } from '@/lib/notion'

export const revalidate = 3600

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pageId: string }>
}): Promise<Metadata> {
  const { pageId } = await params
  try {
    const recordMap = await getPage(pageId)
    const title = getPageTitle(recordMap)
    return {
      title: title || undefined,
      alternates: { canonical: `/${pageId}` },
    }
  } catch {
    return {}
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ pageId: string }>
}) {
  const { pageId } = await params
  try {
    const recordMap = await getPage(pageId)
    return <NotionPage recordMap={recordMap} />
  } catch {
    notFound()
  }
}
