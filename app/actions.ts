// page.tsx に "use server" と記述するとコンパイラがエラーになるため、
// サーバーアクションを別ファイルに分割しています。
"use server";

import { signIn, signOut } from "@/auth"; // ※authのパスは環境に合わせて調整してください

export async function handleSignIn() {
  await signIn("github");
}

export async function handleSignOut() {
  await signOut();
}