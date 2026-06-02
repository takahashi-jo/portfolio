'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import Image from 'next/image'
import { NotionRenderer } from 'react-notion-x'
import type { ExtendedRecordMap } from 'notion-types'
import { ROOT_PAGE_ID } from '@/lib/constants'

const Code = dynamic(
  () => import('react-notion-x/build/third-party/code').then((m) => m.Code),
  { ssr: false }
)
const Collection = dynamic(
  () => import('react-notion-x/build/third-party/collection').then((m) => m.Collection),
  { ssr: false }
)
const Modal = dynamic(
  () => import('react-notion-x/build/third-party/modal').then((m) => m.Modal),
  { ssr: false }
)

function mapPageUrl(pageId: string) {
  const id = pageId.replace(/-/g, '')
  if (id === ROOT_PAGE_ID) return '/'
  return `/${id}`
}

export function NotionPage({ recordMap }: { recordMap: ExtendedRecordMap }) {
  return (
    <NotionRenderer
      recordMap={recordMap}
      fullPage={true}
      darkMode={false}
      rootPageId={ROOT_PAGE_ID}
      mapPageUrl={mapPageUrl}
      components={{
        nextLink: Link,
        nextImage: Image,
        Code,
        Collection,
        Modal,
      }}
    />
  )
}
