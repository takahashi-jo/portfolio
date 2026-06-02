import { NotionAPI } from 'notion-client'
import { cache } from 'react'

const notion = new NotionAPI()

export const getPage = cache(async (pageId: string) => {
  return notion.getPage(pageId)
})
