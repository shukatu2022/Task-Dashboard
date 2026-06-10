
import { auth } from "@/auth";
import TaskDashboard from "@/app/components/TaskDashboard"; // 👈 後で作るコンポーネント
import { handleSignIn } from "@/app/actions";

export default async function Page() {
  // サーバーサイドで安全にセッションを取得
  const session = await auth();

  return (
    <main className="p-8 max-w-2xl mx-auto">
      {/* ログイン・ログアウトやヘッダーの表示ロジックはここに残す */}
      {session ? (
        // ログインしていれば、タスク管理のメインUI（クライアント側）を呼び出す
        // その際、sessionのユーザー情報をプロップスとして渡す
        <TaskDashboard user={session.user} />
      ) : (
        /* 未ログイン時の表示 */
        <div className="text-center py-12 px-4 border rounded-2xl bg-gray-50 shadow-sm">
          <p className="text-gray-600 mb-6 font-medium">タスクを管理するにはログインが必要です。</p>
          <form action={handleSignIn}>
            <button type="submit" className="inline-flex items-center gap-2 px-6 py-3 bg-[#24292e] hover:bg-black text-white font-medium rounded-xl shadow transition">
              GitHubアカウントでログイン
            </button>
          </form>
        </div>
      )}
    </main>
  );
}