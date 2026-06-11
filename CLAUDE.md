@AGENTS.md

# Portfolio — Claude Code Reference

## Overview

Jo Takahashi (高橋青) のポートフォリオサイト。Notion をヘッドレス CMS として使用し、react-notion-x でレンダリングする Next.js アプリ。デプロイ先は Vercel、カスタムドメインは `jo-takahashi.me`。

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
| Analytics | @vercel/analytics | ^2.0.1 |
| Performance monitoring | @vercel/speed-insights | ^2.0.0 |

## Commands

```bash
npm run dev      # dev server (Turbopack)
npm run build    # production build
npm run start    # production server
npm run lint     # ESLint
```

キャッシュ起因の問題が出たら `.next` を削除してから `npm run dev` を再起動すること。

## npm install policy — MUST follow

**パッケージを追加する前に必ずリストアップしてユーザーの承認を得ること。勝手にインストールしない。**

- npm registry: `https://npm.flatt.tech/` (takumi guard、`.npmrc` で設定済み)
- `min-release-age=7` — リリースから7日未満のパッケージはインストール不可
- `.npmrc` を変更しないこと

## Architecture

```
Notion (CMS) ──notion-client──▶ getPage() ──applySorts()──▶ NotionPage ──▶ NotionRenderer
```

- **データ取得**: `notion-client` の非公式 API でページデータ (`ExtendedRecordMap`) を取得
- **ソート**: `getPage()` 内で `applySorts()` を呼び、`collection_query[*][*].collection_group_results.blockIds` を `query2.sort` の設定に従いソートしてから返す
- **キャッシュ**: `export const revalidate = 3600` — ISR で1時間ごと再生成。`getPage` は `React.cache` でラップ済み（同一リクエスト内で `generateMetadata` とページコンポーネントが API コールを共有）
- **ルーティング**: `/` → ROOT_PAGE_ID、`/[pageId]` → 任意のページ（pageId はハイフンなし）
- **エラーハンドリング**: `[pageId]/page.tsx` は try/catch で無効な pageId を `notFound()` にフォールバック（ボットの `.env` スキャン等への対策）

## Key Files

```
src/
  app/
    layout.tsx          # ルートレイアウト。CSS インポート順・SEO メタデータ・JSON-LD・Analytics
    page.tsx            # トップページ (ROOT_PAGE_ID を fetch)
    [pageId]/page.tsx   # 個別ページ。generateMetadata + notFound() エラーハンドリング
    sitemap.ts          # /sitemap.xml 自動生成 (revalidate=3600)
    robots.ts           # /robots.txt 生成
    icon.png            # ファビコン
    globals.css         # グローバル CSS (Tailwind + react-notion-x Table View 修正)
  components/
    NotionPage.tsx      # 'use client'。NotionRenderer ラッパー、動的インポートを含む
  lib/
    notion.ts           # NotionAPI インスタンス、getPage() (React.cache)、applySorts()
    constants.ts        # ROOT_PAGE_ID
next.config.ts          # 画像の remotePatterns 設定
```

## react-notion-x

### CSS インポート順 (layout.tsx)

```ts
import './globals.css'                       // Tailwind + カスタム修正
import 'react-notion-x/src/styles.css'       // Notion スタイル
import 'prismjs/themes/prism-tomorrow.css'   // コードブロック
```

`react-notion-x/src/styles.css` と `react-notion-x/styles.css` は同じファイル（package.json の exports エイリアス）。

### フォント (Noto Sans JP)

`next/font/google` で Noto Sans JP を読み込み、サイト全体に適用している（パッケージ追加は不要、Next.js 標準機能）。

- **layout.tsx**: `Noto_Sans_JP({ subsets: ['latin'], weight: [...], variable: '--font-sans' })` を呼び、`<html className={fontSans.variable}>` で CSS 変数を注入。CSS 変数名は中立的に `--font-sans` としているため、**フォント変更は layout.tsx のフォント関数を差し替えるだけ**で済む（globals.css は触らない）
- **globals.css**: `--notion-font`（react-notion-x が描画に使う変数）と `body` の font-family を `var(--font-sans)` で上書き

**詳細度の注意（ハマりポイント）:** react-notion-x の `styles.css` は globals.css より**後に**インポートされ、`:root { --notion-font }` を再定義する。同じ詳細度の `:root` で上書きしても後勝ちで打ち消されるため、globals.css 側は **`html:root`（詳細度を上げる）** で宣言してインポート順に関係なく勝たせている。`:root` のままだと Notion 描画内容にフォントが効かない。

### 動的インポート (NotionPage.tsx)

```ts
// build/third-party/* を使う（react-notion-x/third-party/* とエイリアスで同じ）
import('react-notion-x/build/third-party/code')
import('react-notion-x/build/third-party/collection')
import('react-notion-x/build/third-party/modal')
```

Collection・Modal は `ssr: false` — クライアントでハイドレーション後に描画される。そのため、ソートの変更はページロード直後ではなくクライアントレンダリング後に反映される。

### コレクションのソート (notion.ts — applySorts)

react-notion-x は `query2.sort` を実装していないため、`getPage()` 内で独自にソートを適用している。

**実装の要点:**
- `recordMap.block` を走査して `collection_view` / `collection_view_page` ブロックを特定
- ブロックの `collection_id` を使って `collection_query[collectionId][viewId].collection_group_results.blockIds` を取得
- `collection_view[viewId].query2.sort` の設定（property・direction）に従い blockIds を in-place ソート

**データ構造の注意点:**
- `collection_view` のエントリは `{ spaceId, value: { value: {...実データ...}, role } }` と2重ラップされている。`unwrap()` は while ループで完全に展開する
- `collection_query` のキーは `view.parent_id` ではなく、ブロックの `collection_id`（別物なので混同しない）
- blockIds の実体は `collection_group_results.blockIds`（`collectionData.blockIds` は通常 undefined）

**対応プロパティ型:** `date`、`created_time`、`last_edited_time`

**ソート設定は Notion 側で行う:** Notion のデータベースビュー設定でソートを追加すれば自動的に反映される。

### Table View の CSS 修正 (globals.css)

**削除・変更禁止。**

react-notion-x の Table View でコンテンツ左側が切れる問題の修正。

**根本原因:** JS が `.notion-table` に `width: 100vw` + `align-self: center` を設定するため、テーブルが x<0 にはみ出しブラウザがスクロールできない。

**修正内容:**
- `.notion-collection:has(.notion-table)` に `overflow-x: auto` → スクロールコンテナ化
- `.notion-table-view` の `padding-left/right: 0 !important` → JS の誤ったオフセットを除去

### コレクションビューのページアイコン非表示 (globals.css)

**削除・変更禁止。**

Gallery/Table ビューで各アイテムの左に 📃 アイコンが表示される問題の修正。

**根本原因:** `PageTitle` が `PageIcon` を `hideDefaultIcon=true` なしで呼び出すため、個別にアイコンを設定していないページには必ずデフォルトの SVG アイコンが描画される。`defaultPageIcon={null}` prop は無効（デフォルト値がすでに `null`）。

**修正内容:** アイコンのラッパー div（`notion-page-icon-inline`）ごと非表示にしてスペースも消す。
- `.notion-collection-card-body .notion-page-icon-inline` → Gallery カード
- `.notion-table-view .notion-page-icon-inline` → Table ビュー

### 既知の制限

- **Bar/Ring 数値フォーマット非対応**: `collection.js` の `switch(schema.number_format)` に `bar`/`ring` のケースがなく、生の数値テキストとして描画される

## Notion

- `ROOT_PAGE_ID = '1cc0427942bc80e0ad0df75681e18701'` — メインページ（Full width 有効）
- Full width ページには `.notion-full-width` クラスが付与され `--notion-max-width` が `calc(min(1920px, 98vw))` になる
- コレクションのソート順は Notion のビュー設定（ビュー右上 → ソート）で制御する
- 画像ホストを追加する場合は `next.config.ts` の `remotePatterns` に追加すること
  - 許可済み: `www.notion.so`、`notion.so`、`prod-files-secure.s3.us-west-2.amazonaws.com`、`s3.us-west-2.amazonaws.com`、`images.unsplash.com`

## SEO

- **metadataBase**: `https://jo-takahashi.me`（非 www が正規 URL。www は Vercel 側で 308 で非 www へリダイレクト）
- **title**: トップは `高橋青 (Jo Takahashi)`、個別ページは `%s | Jo Takahashi`（`%s` は `getPageTitle(recordMap)` で取得した Notion のページタイトル）
  - 「高橋青」で検索ヒットさせる目的で title に漢字名を含めている。会社名は誤ヒット回避のため意図的に含めない
- **JSON-LD**: `layout.tsx` の `<body>` 末尾に Person スキーマを出力（`高橋青` / `Jo Takahashi`）
- **sitemap**: `src/app/sitemap.ts` — ROOT_PAGE_ID の recordMap から page ブロックを列挙して自動生成
- **robots**: `src/app/robots.ts` — 全クロール許可、sitemap URL を明示
- **Search Console**: `jo-takahashi.me` を**ドメインプロパティ**で登録（www / 非 www 両方カバー）。sitemap 送信済み

## Analytics & Speed Insights

`layout.tsx` の `<body>` 末尾に `<Analytics />` と `<SpeedInsights />` を配置済み。Vercel ダッシュボードの Analytics / Speed Insights タブで確認できる。Hobby プランは上限超過時に自動課金されない（データ収集が止まるだけ）。

## TypeScript

- `strict: true`
- path alias: `@/*` → `./src/*`
- `moduleResolution: bundler`（Next.js 推奨）
- Turbopack は PostCSS を使用しない（Turbopack ネイティブ CSS 処理）。`@import "tailwindcss"` は Tailwind v4 の記法（`tailwind.config.js` 不要）
