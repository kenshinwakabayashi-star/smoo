# smoo アプリ開発手順書

同棲カップル向け家計簿アプリ「smoo」の作成手順をまとめたドキュメントです。

---

## 目次

1. [使用ツール・技術の概要](#1-使用ツール技術の概要)
2. [環境構築](#2-環境構築)
3. [Supabase セットアップ](#3-supabase-セットアップ)
4. [Next.js プロジェクト作成](#4-nextjs-プロジェクト作成)
5. [shadcn/ui コンポーネントの追加](#5-shadcnui-コンポーネントの追加)
6. [データベース設計](#6-データベース設計)
7. [認証機能の実装](#7-認証機能の実装)
8. [主要機能の実装](#8-主要機能の実装)
9. [よくある質問・トラブルシューティング](#9-よくある質問トラブルシューティング)

---

## 用語集（先に読んでおくと理解しやすい）

| 用語 | 説明 |
|------|------|
| **マイグレーション** | データベースの構造（テーブルや列）を定義・変更するためのSQLファイル。変更履歴を管理できる |
| **RPC** | Remote Procedure Call の略。データベース内で定義した関数をアプリから呼び出す仕組み |
| **ミドルウェア** | ページ表示前に実行される処理。認証チェックなどに使う |
| **upsert** | INSERT or UPDATE の略。データがなければ追加、あれば更新する |
| **.gitignore** | Git で管理しないファイルを指定するファイル。パスワードなどの秘密情報を誤ってアップロードしないために使う |

---

## 1. 使用ツール・技術の概要

### フレームワーク・ライブラリ

| ツール | 役割 | 開発に疎い人向けの説明 |
|--------|------|------------------------|
| **Next.js** | Webアプリのフレームワーク | Reactを使ったWebサイト/アプリを作るための土台。ページの表示やURLの管理を自動でやってくれる |
| **React** | UI構築ライブラリ | 画面の見た目（ボタン、フォームなど）を作るための部品を提供してくれる |
| **TypeScript** | プログラミング言語 | JavaScriptに「型」という仕組みを追加したもの。間違いを事前に発見しやすくなる |
| **Tailwind CSS** | スタイリング | 見た目（色、サイズ、配置など）をクラス名で簡単に指定できるツール |
| **shadcn/ui** | UIコンポーネント集 | ボタン、カード、フォームなど、よく使う部品があらかじめ用意されている |

### バックエンド・データベース

| ツール | 役割 | 開発に疎い人向けの説明 |
|--------|------|------------------------|
| **Supabase** | バックエンドサービス | データベースとユーザー認証をまとめて提供してくれるサービス。自分でサーバーを用意しなくてよい |
| **PostgreSQL** | データベース | データを保存する場所。Supabaseの中で動いている |
| **Row Level Security (RLS)** | セキュリティ機能 | 「誰がどのデータを見れるか」を自動で制御する仕組み |

### フォーム・バリデーション

| ツール | 役割 | 開発に疎い人向けの説明 |
|--------|------|------------------------|
| **React Hook Form** | フォーム管理 | 入力フォームの状態管理を簡単にしてくれる |
| **Zod** | バリデーション | 「メールアドレスが正しい形式か」「文字数は適切か」などをチェックしてくれる |

### その他

| ツール | 役割 | 開発に疎い人向けの説明 |
|--------|------|------------------------|
| **Recharts** | グラフライブラリ | 棒グラフや円グラフを簡単に表示できる |
| **Lucide React** | アイコン集 | 矢印、メニュー、ユーザーなどのアイコンが使える |
| **npm** | パッケージマネージャー | 必要なツールを簡単にインストールするためのもの |

---

## 2. 環境構築

### 必要なもの

1. **Node.js** (バージョン 18 以上)
   - [https://nodejs.org](https://nodejs.org) からダウンロード
   - インストール後、ターミナルで `node -v` と打って確認

2. **コードエディタ**
   - VS Code がおすすめ
   - [https://code.visualstudio.com](https://code.visualstudio.com)

3. **Supabase アカウント**
   - [https://supabase.com](https://supabase.com) で無料登録

### ターミナルの基本操作

```bash
# 現在いるフォルダを確認
pwd

# フォルダを移動
cd フォルダ名

# コマンドを実行（例: npm を使う）
npm install
```

---

## 3. Supabase セットアップ

### 3.1 プロジェクト作成

1. Supabase にログイン
2. 「New Project」をクリック
3. プロジェクト名を入力（例: `smoo-app`）
4. パスワードを設定（これはデータベースの管理パスワード）
5. リージョンは「Northeast Asia (Tokyo)」を選択
6. 作成を待つ（1-2分かかります）

### 3.2 API キーの取得

作成後、以下の情報をメモしておきます：

1. 左メニューの「Settings」→「API」を開く
2. 必要な情報：
   - **Project URL**: `https://xxxxxx.supabase.co` の形式
   - **anon public**: 公開キー（アプリから使う）

### 3.3 認証設定

1. 左メニューの「Authentication」→「Providers」
2. 「Email」が有効になっていることを確認
3. 必要に応じて「Confirm email」をオフにする（開発中は確認メールなしでログインできて便利）

---

## 4. Next.js プロジェクト作成

### 4.1 プロジェクトの初期化

```bash
# プロジェクトを作りたいフォルダに移動
cd ~/Documents

# Next.js プロジェクトを作成
npx create-next-app@latest roomshare-finance
```

質問に対する回答（キーボードで選択してEnterキーを押す）:
- Would you like to use TypeScript? → **Yes** を選択
- Would you like to use ESLint? → **Yes** を選択
- Would you like to use Tailwind CSS? → **Yes** を選択
- Would you like to use `src/` directory? → **Yes** を選択
- Would you like to use App Router? → **Yes** を選択
- Would you like to customize the default import alias? → そのまま **Enter キーを押す**

### 4.2 追加パッケージのインストール

```bash
# プロジェクトフォルダに移動
cd roomshare-finance

# Supabase 関連
npm install @supabase/supabase-js @supabase/ssr

# フォーム・バリデーション
npm install react-hook-form @hookform/resolvers zod

# グラフ
npm install recharts

# アイコン
npm install lucide-react
```

### 4.3 環境変数の設定

環境変数とは、アプリが動作するために必要な設定値（APIキーなど）を保存する仕組みです。

**ファイルの作成手順:**

1. VS Code でプロジェクトフォルダを開く
2. 左のファイル一覧で右クリック → 「New File」を選択
3. ファイル名を `.env.local` と入力（先頭のドットを忘れずに！）
4. 以下の内容をコピー&ペースト

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

5. `your-project` と `your-anon-key` を Supabase のダッシュボードからコピーした値に置き換える

**注意**: この `.env.local` ファイルには秘密の情報が含まれるため、Git にアップロードしてはいけません（`.gitignore` に含まれているので自動的に除外される）

### 4.4 動作確認

ここまでできたら、開発サーバーを起動して動作確認しましょう。

```bash
npm run dev
```

ブラウザで `http://localhost:3000` を開くと、Next.js のウェルカムページが表示されます。
（まだ Supabase との接続設定は完了していないので、エラーが出る場合があります）

---

## 5. shadcn/ui コンポーネントの追加

shadcn/ui は、美しいUIコンポーネント（ボタン、カード、フォームなど）を簡単に追加できるツールです。

### 5.1 初期化

```bash
npx shadcn@latest init
```

質問に対する回答:
- Which style would you like to use? → **Default** を選択
- Which color would you like to use as the base color? → **Slate** を選択
- Would you like to use CSS variables for theming? → **Yes** を選択

### 5.2 必要なコンポーネントを追加

以下のコマンドを1つずつ実行します（各コンポーネントがダウンロードされる）:

```bash
# ボタン
npx shadcn@latest add button

# カード（情報を囲む枠）
npx shadcn@latest add card

# 入力フォーム
npx shadcn@latest add input

# ラベル（入力欄の説明文）
npx shadcn@latest add label

# タブ切り替え
npx shadcn@latest add tabs

# バッジ（小さなラベル）
npx shadcn@latest add badge

# 進捗バー
npx shadcn@latest add progress

# 区切り線
npx shadcn@latest add separator
```

これで `src/components/ui/` フォルダに各コンポーネントのファイルが追加されます。

---

## 6. データベース設計

### 6.1 テーブル構成

このアプリでは以下のテーブルを使用：

| テーブル名 | 役割 |
|------------|------|
| `households` | 家計（同棲グループ）の情報 |
| `user_profiles` | ユーザー情報（Supabase Auth と連携） |
| `categories` | 支出カテゴリ（食費、光熱費など） |
| `transactions` | 支出・収入の明細 |
| `budgets` | 月ごとの予算設定 |
| `settlements` | 精算記録 |

### 6.2 マイグレーションの実行

**マイグレーション**とは、データベースの構造（テーブルや列）を定義するSQLファイルのことです。

**実行手順:**
1. Supabase のダッシュボードにログイン
2. 左メニューの「SQL Editor」をクリック
3. 「New Query」をクリック
4. 以下のSQLをコピー&ペースト
5. 「Run」ボタンをクリック

```sql
-- households: 同棲ペア・グループ単位
create table households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text unique not null default substring(gen_random_uuid()::text, 1, 8),
  created_at timestamptz default now()
);

-- users: Supabase Auth のユーザーと紐付け
create table user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  household_id uuid references households(id),
  created_at timestamptz default now()
);

-- categories: 支出カテゴリ
create table categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  icon text not null,
  color text not null,
  is_default boolean default false
);

-- transactions: 支出・収入の明細
create table transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  user_id uuid references user_profiles(id) on delete set null,
  amount integer not null check (amount > 0),
  type text not null check (type in ('expense', 'income')),
  category_id uuid references categories(id) on delete set null,
  description text,
  date date not null default current_date,
  is_shared boolean not null default true,
  is_recurring boolean not null default false,
  created_at timestamptz default now()
);

-- budgets: 予算設定
create table budgets (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  category_id uuid references categories(id) on delete cascade,
  amount integer not null check (amount > 0),
  month date not null,
  unique (household_id, category_id, month)
);

-- settlements: 精算記録（誰が誰にいくら払ったか）
create table settlements (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  from_user_id uuid references user_profiles(id),
  to_user_id uuid references user_profiles(id),
  amount integer not null check (amount > 0),
  month date not null,
  settled_at timestamptz
);
```

### 6.3 Row Level Security (RLS) の設定

**RLS とは**: 「誰がどのデータを見れるか」をデータベースレベルで制御する仕組みです。

**なぜ重要か**: RLS を有効にしないと、悪意のあるユーザーが他人のデータを見たり、改ざんしたりできてしまいます。家計簿アプリでは、自分の家計のデータだけを見れるようにする必要があります。

```sql
-- RLS を有効化（全テーブルに対して）
alter table households enable row level security;
alter table user_profiles enable row level security;
alter table categories enable row level security;
alter table transactions enable row level security;
alter table budgets enable row level security;
alter table settlements enable row level security;

-- ポリシーを作成（同じ household のメンバーだけが見れる）
create policy "household members can view" on households
  for select using (
    id in (
      select household_id from user_profiles where id = auth.uid()
    )
  );
```

**完全な RLS 設定**: プロジェクト内の `supabase/migrations/001_initial.sql` ファイルに全てのポリシーが記載されています。VS Code で開いて内容を確認し、SQL Editor で実行してください。

### 6.4 SECURITY DEFINER 関数

**SECURITY DEFINER とは**: 通常、ユーザーは RLS で許可されたデータしかアクセスできません。しかし「招待コードで家計に参加する」ような操作では、まだ参加していない家計のデータを一時的に参照する必要があります。SECURITY DEFINER 関数は、RLS の制限を一時的にバイパスして、管理者権限で処理を実行できる特別な関数です。

**このアプリで使用する SECURITY DEFINER 関数:**

1. **`create_household_with_categories`**: 家計作成 + カテゴリ初期化 + ユーザー登録を一括で行う
2. **`join_household_by_invite_code`**: 招待コードで家計に参加する

これらの関数も `supabase/migrations/001_initial.sql` に定義されています。SQL Editor で実行してください。

```sql
-- 例: 家計作成関数の概要
create or replace function create_household_with_categories(
  p_household_name text,  -- 家計名（入力）
  p_display_name   text   -- ユーザーの表示名（入力）
)
returns json              -- 結果をJSON形式で返す
language plpgsql          -- PostgreSQLの手続き型言語を使用
security definer          -- RLSをバイパスして実行
set search_path = public
as $$
  -- ここに処理を記述
  -- 1. 家計（household）を作成
  -- 2. デフォルトカテゴリを挿入
  -- 3. ユーザープロフィールを作成
$$;
```

---

## 7. 認証機能の実装

### 7.1 Supabase クライアントの設定

Supabase と通信するためのクライアントを設定します。Next.js では「クライアントサイド（ブラウザ）」と「サーバーサイド（サーバー）」で別々のクライアントが必要です。

**クライアントサイド用** (`src/lib/supabase/client.ts`):
ブラウザ上で動作するコンポーネント（`'use client'` がついたファイル）から使用します。

```typescript
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**サーバーサイド用** (`src/lib/supabase/server.ts`):
サーバー上で動作するページ（Server Component）から使用します。

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component から呼ばれた場合は無視
          }
        },
      },
    }
  )
}
```

**補足**: `Database` 型は `src/types/database.ts` に定義します。Supabase のダッシュボードから自動生成できますが、手動で定義しても構いません。

### 7.2 ミドルウェアの設定

**ミドルウェア**とは、ページが表示される前に実行される処理のことです。このアプリでは「ログインしていないユーザーをログインページへ誘導する」ために使います。

`src/middleware.ts` を作成:

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  // Supabase クライアントを作成
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 現在のユーザー情報を取得
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isAuthPage = pathname.startsWith('/auth')
  const isApiRoute = pathname.startsWith('/api/')

  // 未ログインで認証ページ以外にアクセス → ログインページへリダイレクト
  if (!user && !isAuthPage && !isApiRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth'
    return NextResponse.redirect(url)
  }

  // ログイン済みで認証ページにアクセス → ダッシュボードへリダイレクト
  if (user && isAuthPage && !isApiRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

// ミドルウェアを適用するURLパターンを指定
// 静的ファイル（画像など）は除外する
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### 7.3 ログインページ

`src/app/(auth)/auth/page.tsx` で以下を実装:
- メールアドレス + パスワードでのログイン
- 新規登録（確認メール送信）
- Zod によるバリデーション

---

## 8. 主要機能の実装

### 8.1 ディレクトリ構成

```
src/
├── app/
│   ├── (app)/              # 認証後のページ
│   │   ├── page.tsx        # ダッシュボード
│   │   ├── transactions/   # 取引一覧
│   │   ├── calendar/       # カレンダー
│   │   ├── reports/        # レポート
│   │   ├── settings/       # 設定
│   │   └── setup/          # 初回セットアップ
│   ├── (auth)/             # 認証ページ
│   │   └── auth/page.tsx
│   └── api/                # API ルート
│       └── auth/callback/
├── components/
│   ├── ui/                 # shadcn/ui コンポーネント
│   └── ...                 # アプリ固有のコンポーネント
├── lib/
│   ├── supabase/           # Supabase クライアント
│   └── utils.ts            # ユーティリティ関数
└── types/
    └── database.ts         # TypeScript 型定義
```

### 8.2 ページ構成

| パス | 機能 |
|------|------|
| `/` | ダッシュボード（月次サマリー、精算、最近の取引） |
| `/transactions` | 取引一覧・検索・編集 |
| `/calendar` | カレンダービュー |
| `/reports` | グラフ・分析 |
| `/settings` | カテゴリ・予算設定 |
| `/setup` | 初回セットアップ（家計作成 or 参加） |
| `/auth` | ログイン・新規登録 |

### 8.3 精算計算のロジック

2人で共有支出を折半するロジック:

```typescript
// 共有支出を抽出
const sharedTx = transactions.filter(t => t.type === 'expense' && t.is_shared)

// 各メンバーの支払い額を集計
const memberPayments = members.reduce((acc, m) => {
  acc[m.id] = sharedTx
    .filter(t => t.user_id === m.id)
    .reduce((sum, t) => sum + t.amount, 0)
  return acc
}, {})

// 差額を計算（多く払った人に、少なく払った人が返す）
const [a, b] = members
const diff = memberPayments[a.id] - memberPayments[b.id]
const settlementAmount = Math.abs(diff) / 2
```

---

## 9. よくある質問・トラブルシューティング

### エラー対処の基本

プログラミングでエラーが出たとき、最も重要なのは**エラーメッセージを読む**ことです。

1. **赤い文字を探す**: ターミナルに表示される赤い文字がエラーメッセージ
2. **ファイル名と行番号を確認**: `src/app/page.tsx:15` のような表示があれば、そのファイルの15行目に問題がある
3. **エラー内容を Google で検索**: エラーメッセージをそのまま検索すると、解決策が見つかることが多い

---

### Q: `npm run dev` でエラーが出る

**考えられる原因:**
1. Node.js のバージョンが古い → `node -v` で確認、18以上にアップデート
2. パッケージが不足 → `npm install` を再実行
3. 環境変数が未設定 → `.env.local` を確認

### Q: Supabase に接続できない

**確認事項:**
1. `.env.local` の URL と Key が正しいか
2. Supabase プロジェクトが起動しているか
3. RLS ポリシーが正しく設定されているか

### Q: ログインしても画面が進まない

**考えられる原因:**
1. ミドルウェアの設定ミス
2. コールバック URL の設定漏れ
3. 確認メールが未送信（開発中は「Confirm email」をオフに）

### Q: 「Invalid invite code」と表示される

- 招待コードは8文字
- 大文字小文字を区別
- コピペ時の余分な空白に注意

### Q: コンポーネントが見つからないエラー

shadcn/ui のコンポーネントは手動で追加が必要:
```bash
npx shadcn-ui@latest add [コンポーネント名]
```

---

## 開発時のコマンド一覧

```bash
# 開発サーバー起動
npm run dev

# ビルド（本番用）
npm run build

# ビルド結果の確認
npm run start

# コードチェック
npm run lint
```

---

## 参考リンク

- [Next.js ドキュメント](https://nextjs.org/docs)
- [Supabase ドキュメント](https://supabase.com/docs)
- [shadcn/ui ドキュメント](https://ui.shadcn.com/)
- [Tailwind CSS ドキュメント](https://tailwindcss.com/docs)
- [React Hook Form ドキュメント](https://react-hook-form.com/)

---

*このドキュメントは 2026年3月31日 に作成されました。*
