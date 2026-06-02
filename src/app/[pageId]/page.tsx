import { NotionPage } from '@/components/NotionPage'
import { getPage } from '@/lib/notion'

export const revalidate = 3600

export default async function Page({
  params,
}: {
  params: Promise<{ pageId: string }>
}) {
  const { pageId } = await params
  const recordMap = await getPage(pageId)
  return <NotionPage recordMap={recordMap} />
}
