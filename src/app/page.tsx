import { NotionPage } from '@/components/NotionPage'
import { getPage } from '@/lib/notion'
import { ROOT_PAGE_ID } from '@/lib/constants'

export const revalidate = 3600

export default async function HomePage() {
  const recordMap = await getPage(ROOT_PAGE_ID)
  return <NotionPage recordMap={recordMap} />
}
