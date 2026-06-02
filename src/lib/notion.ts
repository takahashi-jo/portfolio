import { NotionAPI } from 'notion-client'
import { cache } from 'react'
import type { ExtendedRecordMap } from 'notion-types'

const notion = new NotionAPI()

function unwrap(record: unknown): Record<string, unknown> | null {
  if (!record || typeof record !== 'object') return null
  let r = record as Record<string, unknown>
  while (r.value && typeof r.value === 'object' && !Array.isArray(r.value)) {
    r = r.value as Record<string, unknown>
  }
  return r
}

function getDateMs(block: Record<string, unknown> | null, property: string): number {
  if (!block) return 0
  try {
    if (property === 'created_time') return (block.created_time as number) ?? 0
    if (property === 'last_edited_time') return (block.last_edited_time as number) ?? 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prop = (block.properties as any)?.[property]
    const dateVal = prop?.[0]?.[1]?.[0]?.[1]
    if (dateVal?.start_date) return new Date(dateVal.start_date).getTime()
    return 0
  } catch {
    return 0
  }
}

function applySorts(recordMap: ExtendedRecordMap): void {
  for (const [, blockRecord] of Object.entries(recordMap.block)) {
    const block = unwrap(blockRecord)
    if (!block) continue
    if (block.type !== 'collection_view' && block.type !== 'collection_view_page') continue

    const collectionId = block.collection_id as string | undefined
    if (!collectionId) continue

    const viewIds = block.view_ids as string[] | undefined
    if (!viewIds?.length) continue

    for (const viewId of viewIds) {
      const view = unwrap(recordMap.collection_view[viewId])
      const sorts = ((view?.query2 as Record<string, unknown>)?.sort ?? []) as Array<{
        property: string
        direction: string
      }>
      if (!sorts.length) continue

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const collectionData = recordMap.collection_query?.[collectionId]?.[viewId] as any
      if (!collectionData) continue

      // react-notion-x reads collection_group_results.blockIds first, then blockIds
      const blockIds: string[] | undefined =
        collectionData?.collection_group_results?.blockIds ?? collectionData?.blockIds
      if (!blockIds?.length) continue

      blockIds.sort((a, b) => {
        for (const { property, direction } of sorts) {
          const aMs = getDateMs(unwrap(recordMap.block[a]), property)
          const bMs = getDateMs(unwrap(recordMap.block[b]), property)
          if (aMs === bMs) continue
          return direction === 'descending' ? bMs - aMs : aMs - bMs
        }
        return 0
      })
    }
  }
}

export const getPage = cache(async (pageId: string) => {
  const recordMap = await notion.getPage(pageId)
  applySorts(recordMap)
  return recordMap
})
