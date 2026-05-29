This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.



# 🛠️ Next.js完結版：Prisma & Auth.js 認証実装ドキュメント

このドキュメントは、Next.js (App Router) に Prisma (ORM) と Render PostgreSQL、および Auth.js (v5) を用いた GitHub OAuth 認証を導入する手順とコードの記録です。

## 1. ディレクトリ構成
最終的な認証関連のファイル配置は以下の通りです（`src` ディレクトリを使用していない場合の構成）。

```text
my-app/
├── .env                              # 環境変数（Git管理対象外）
├── auth.ts                           # ✨ Auth.js 設定の核
├── prisma.config.ts                  # ✨ Prisma 7 用の設定ファイル
├── app/
│   ├── page.tsx                      # ✨ ログイン・ログアウト画面
│   └── api/
│       └── auth/
│           └── [...nextauth]/
│               └── route.ts          # ✨ 認証APIエンドポイント
└── prisma/
    └── schema.prisma                 # ✨ DBスキーマ定義
```

---

## 2. 環境設定 (`.env`)
プロジェクトのルート直下に配置。※GitHubには絶対にプッシュしないこと。

```env
# Render PostgreSQL 接続URL
DATABASE_URL="postgres://<user>:<password>@<host>/task_manager"

# Auth.js 暗号化用シークレット (任意の文字列)
AUTH_SECRET="super-secret-random-string-12345"

# GitHub OAuth 鍵 (GitHub Developer Settingsから取得)
AUTH_GITHUB_ID="ユーザーのClient ID"
AUTH_GITHUB_SECRET="ユーザーのClient Secret"
```

---

## 3. 各種設定ファイルとソースコード

### ① `prisma.config.ts`
Prisma 7 の仕様に基づき、環境変数から接続URLを安全に読み込むための設定。

```typescript
import { defineConfig } from '@prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
```

### ② `prisma/schema.prisma`
Auth.js が必要とする標準的なテーブル構造（User, Account, Session, VerificationToken）と、アプリケーション固有の `Task` テーブルの定義。

```prisma
datasource db {
  provider = "postgresql"
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  accounts      Account[]
  sessions      Session[]
  tasks         Task[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model Task {
  id          String   @id @default(cuid())
  title       String
  description String?
  completed   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### ③ `auth.ts`
認証ロジックの中心。Prismaを介してRender PostgreSQLと接続し、GitHubプロバイダーを使用する設定。

```typescript
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import GitHub from "next-auth/providers/github";

const prisma = new PrismaClient();

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHub,
  ],
  session: { strategy: "jwt" },
});
```

### ④ `app/api/auth/[...nextauth]/route.ts`
Auth.js の認証リクエスト（サインイン・ログアウト・コールバック）を受け付けるための全ルート共通ハンドラー。

```typescript
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
```

### ⑤ `app/page.tsx`
サーバーコンポーネントでセッション（`auth()`）を監視し、ログイン状態に応じて「GitHubログインボタン」と「ユーザー情報・ログアウトボタン」を切り替えるフロントエンド画面。

```tsx
import { auth, signIn, signOut } from "@/auth";

export default async function Home() {
  const session = await auth();

  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>タスク管理アプリ</h1>
      <p>PostgreSQL + Auth.js ログインテスト</p>

      <hr style={{ margin: "2rem 0" }} />

      {session ? (
        <div>
          <p>おかえりなさい、<strong>{session.user?.name}</strong> さん！</p>
          {session.user?.image && (
            <img
              src={session.user.image}
              alt="User Avatar"
              style={{ width: "50px", height: "50px", borderRadius: "50%", marginBottom: "1rem" }}
            />
          )}
          <p>ログイン中のメールアドレス: {session.user?.email}</p>
          
          <form
            action={async () => {
              "use server";
              await signOut();
            }}
          >
            <button style={{ padding: "0.5rem 1rem", cursor: "pointer" }}>
              ログアウトする
            </button>
          </form>
        </div>
      ) : (
        <div>
          <p>現在はログインしていません。</p>
          
          <form
            action={async () => {
              "use server";
              await signIn("github");
            }}
          >
            <button style={{ padding: "0.5rem 1rem", background: "#24292e", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
              GitHubアカウントでログイン
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
```

---

## 4. 実行・反映コマンド
設定完了後、環境を同期・起動するためのコマンド。

```bash
# 1. スキーマの変更をデータベース（Render）に強制同期
npx prisma db push

# 2. 最新のスキーマに基づいて型定義ファイルを生成
npx prisma generate

# 3. Next.js 開発サーバーの起動
npm run dev
```
