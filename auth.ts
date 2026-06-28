import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GitHub from "next-auth/providers/github";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // データベースとAuth.jsを結びつける設定
  adapter: PrismaAdapter(prisma),
  // 認証のプロバイダー（まずはテスト用にシンプルな設定から始めます）
  providers: [
    GitHub,
  ],
  // セッションの管理方法（JWTトークンを使用）
  session: { strategy: "jwt" },
  callbacks: {
    session({ session, token }) {
      // JWTのidをsession.user.idに追加
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
});