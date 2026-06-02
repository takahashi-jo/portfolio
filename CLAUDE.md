@AGENTS.md

# Portfolio — Claude Code Reference

## Overview

Jo Takahashi (高橋青) のポートフォリオサイト。Notion をヘッドレス CMS として使用し、react-notion-x でレンダリングする Next.js アプリ。

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router + Turbopack) | 16.2.6 |
| UI | React | 19.2.4 |
| CSS | TailwindCSS v4 | ^4 |
| Notion renderer | react-notion-x | ^7.10.0 |
| Notion data fetcher | notion-client (unofficial API) | ^7.10.0 |
| Language | TypeScript (strict) | ^5 |
| Image optimizer | sharp | ^0.34.5 |

## Commands

```bash
npm run dev      # dev server (Turbopack)
npm run build    # production build
npm run start    # production server
npm run lint     # ESLint
```

## npm install policy — MUST follow

**パッケージを追加する前に必ずリストアップしてユーザーの承認を得ること。勝手にインストールしない。**

- npm registry: `https://npm.flatt.tech/` (takumi guard、`.npmrc` で設定済み)
- `min-release-age=7` が設定されているため、リリースから7日未満のパッケージはインストール不可
- `.npmrc` を変更しないこと

## Architecture

```
Notion (CMS) ──notion-client──▶ getPage() ──▶ NotionPage component ──▶ NotionRenderer
```

- **データ取得**: `notion-client` の非公式 API でページデータ (`ExtendedRecordMap`) を取得
- **キャッシュ**: `export const revalidate = 3600` — ISR で1時間ごと再生成
- **ルーティング**: `/` → ROOT_PAGE_ID、`/[pageId]` → 任意のページ
- **URL マッピング**: pageId のハイフンを除去して URL に使用

## Key Files

```
src/
  app/
    layout.tsx          # ルートレイアウト。CSS インポート順が重要
    page.tsx            # トップページ (ROOT_PAGE_ID を fetch)
    [pageId]/page.tsx   # 個別ページ
    globals.css         # グローバル CSS (Tailwind + react-notion-x 修正)
  components/
    NotionPage.tsx      # NotionRenderer ラッパー。動的インポートを含む
  lib/
    notion.ts           # notion-client インスタンスと getPage()
    constants.ts        # ROOT_PAGE_ID
next.config.ts          # 画像の remotePatterns 設定
```

## CSS Import Order (layout.tsx)

```ts
import './globals.css'                       // Tailwind + カスタム修正
import 'react-notion-x/src/styles.css'       // Notion スタイル
import 'prismjs/themes/prism-tomorrow.css'   // コードブロック
```

`react-notion-x/src/styles.css` と `react-notion-x/styles.css` は同じファイルを指す（package.json の exports エイリアス）。

## react-notion-x 動的インポート

```ts
// 正しいパス (build/third-party/* を使う)
import('react-notion-x/build/third-party/code')
import('react-notion-x/build/third-party/collection')
import('react-notion-x/build/third-party/modal')
// これらは react-notion-x/third-party/* とエイリアスで同じ
```

Collection は `ssr: false` — クライアントでハイドレーション後に描画される。

## Allowed Image Hosts (next.config.ts)

- `www.notion.so`, `notion.so`
- `prod-files-secure.s3.us-west-2.amazonaws.com`
- `s3.us-west-2.amazonaws.com`
- `images.unsplash.com`

新しい画像ドメインを追加する場合は `next.config.ts` の `remotePatterns` に追加する。

## globals.css — Table View Fix

react-notion-x の Table View でコンテンツが左側に見切れる問題の修正が入っている。

**根本原因**: JS が `.notion-table` に `width: windowWidth`（=100vw）と `align-self:center` を設定する。
中央配置によりテーブルの左半分が x<0 の領域へはみ出し、ブラウザがスクロールできない。

**修正**:
- `.notion-collection:has(.notion-table)` に `overflow-x: auto` → コレクションをスクロールコンテナ化し、テーブルを左端に固定
- `.notion-table-view` の `padding-left/right` を `0 !important` → JS が計算した誤ったオフセットを除去

**この修正を変更・削除しないこと。**

## Turbopack の注意事項

- Turbopack は PostCSS を使用しない（Turbopack ネイティブ CSS 処理）
- CSS 変更後にキャッシュが古くなる場合は `.next` ディレクトリを削除して `npm run dev` で再起動
- `@import "tailwindcss"` は Tailwind v4 の記法（`tailwind.config.js` は不要）

## Notion Page Settings

- `ROOT_PAGE_ID = '1cc0427942bc80e0ad0df75681e18701'` — メインページ（Full width 有効）
- Full width ページには `.notion-full-width` クラスが付与され `--notion-max-width` が `calc(min(1920px, 98vw))` になる
- 個別ページ（Work Experience 等）の表示は Notion 側の Full width 設定に依存する

## TypeScript

- `strict: true`
- path alias: `@/*` → `./src/*`
- `moduleResolution: bundler`（Next.js 推奨）
