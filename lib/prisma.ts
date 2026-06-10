// const prisma = new PrismaClient() を直接書くと、
// 開発中にホットリロードが発生するたびに新しい PrismaClient インスタンスが作成されてしまいます。
// これを防ぐために、グローバルオブジェクトを利用して 
// PrismaClient のインスタンスを共有する方法が一般的です。
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    // 開発中にコンソールにSQLクエリを出してデバッグしやすくする設定（任意）
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;