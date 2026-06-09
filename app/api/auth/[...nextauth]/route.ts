import { handlers } from "@/auth"; // 先ほど作成した auth.ts から handlers をインポート

// GET と POST のリクエストをすべて Auth.js のハンドラーに丸投げする
export const { GET, POST } = handlers;