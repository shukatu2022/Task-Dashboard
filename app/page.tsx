"use client"; // ← これが重要！「画面を動かす」宣言です

import { useState, useEffect} from "react";
import { Task } from "@/types"; // index.tsを作ったのでこのように書けます
                                // @/は一番上の階層を指すエイリアス　
                                // 問題があれば../typesと書いてもOK
import { auth, signIn, signOut } from "@/auth";

export default async function Home() {
  // 1. タスク一覧を管理する「状態(state)」
  // const [tasks, setTasks] = useState<Task[]>([
  //   { id: "1", title: "Next.jsの基礎を学ぶ", isCompleted: true },
  // ]);
  const [tasks, setTasks] = useState<Task[]>([]); // 最初は空のリスト

  // 2. 入力フォームの文字を管理する「状態(state)」
  const [inputValue, setInputValue] = useState("");

  // 画面がブラウザで読み込まれたか（マウントされたか）を判定する状態
  const [isMounted, setIsMounted] = useState(false);

  // 【追加1】 最初の1回だけ実行：ローカルストレージからタスクを読み込む
  useEffect(() => {
    const savedTasks = localStorage.getItem("tasks");
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks)); // 文字列を配列（オブジェクト）に戻す
    }
    setIsMounted(true); // 読み込み完了フラグを立てる
  }, []); // ← 最後が [] なので、画面表示時の1回だけ動きます

  // 【追加2】 タスクが変化するたびに実行：ローカルストレージに保存する
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("tasks", JSON.stringify(tasks)); // 配列を文字列にして保存
    }
  }, [tasks, isMounted]); // ← tasksかisMountedが変化するたびに動きます

  // 3. タスクを追加する関数
  const addTask = () => {
    if (inputValue.trim() === "") return; // 空入力防止

    const newTask: Task = {
      id: crypto.randomUUID(), // ランダムなIDを生成
      title: inputValue,
      isCompleted: false,
    };

    setTasks([...tasks, newTask]); // 今のリストに新しいタスクを合体
    setInputValue(""); // 入力欄を空にする
  };

  // 4. タスクを削除する関数
  const deleteTask = (id: string) => {
    // 指定されたID「以外」のタスクを残すことで削除を実現する
    const newTasks = tasks.filter((task) => task.id !== id);
    setTasks(newTasks);
  };

  // 【追加3】 Hydration（ハイドレーション）エラーを防ぐためのおまじない
  // ブラウザでの読み込みが完了するまでは何も表示しない
  if (!isMounted) {
    return null; 
  }

  const session = await auth();


  return (
    <main className="p-8 max-w-2xl mx-auto">
      {/* ヘッダーエリア（ログイン状態に応じて表示を切り替え） */}
      <div className="flex justify-between items-center mb-8 pb-4 border-b">
        <div>
          <h1 className="text-3xl font-bold text-blue-600">Task Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">PostgreSQL + Auth.js</p>
        </div>

        {session && (
          <div className="flex items-center gap-3">
            {session.user?.image && (
              <img
                src={session.user.image}
                alt="User Avatar"
                className="w-10 h-10 rounded-full border shadow-sm"
              />
            )}
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-800">{session.user?.name} さん</p>
              <p className="text-xs text-gray-400">{session.user?.email}</p>
            </div>
            
            <form
              action={async () => {
                "use server";
                await signOut();
              }}
            >
              <button className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition">
                ログアウト
              </button>
            </form>
          </div>
        )}
      </div>

      {/* メインコンテンツエリア */}
      {session ? (
        <>
          {/* 入力エリア */}
          <div className="flex gap-2 mb-8">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="新しいタスクを入力..."
              className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-black"
            />
            <button
              onClick={addTask}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              追加
            </button>
          </div>

          {/* タスク一覧 */}
          <div className="space-y-3">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center p-4 border rounded-lg bg-white shadow-sm">
                <input
                  type="checkbox"
                  checked={task.isCompleted}
                  onChange={() => {
                    // 完了状態を切り替える処理
                    setTasks(tasks.map(t => t.id === task.id ? { ...t, isCompleted: !t.isCompleted } : t));
                  }}
                  className="mr-4 h-5 w-5 cursor-pointer"
                />
                <span className={`text-black ${task.isCompleted ? "line-through text-gray-400" : ""}`}>
                  {task.title}
                </span>

                <button
                  onClick={() => deleteTask(task.id)}
                  className="ml-auto px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition"
                >
                  削除
                </button>
              </div>
            ))}
          </div>
        </>
      ) : (
        /* 未ログイン時のログイン誘導カード（元デザインのテイストに調整） */
        <div className="text-center py-12 px-4 border rounded-2xl bg-gray-50 shadow-sm">
          <p className="text-gray-600 mb-6 font-medium">
            タスクを管理するにはログインが必要です。
          </p>
          <form
            action={async () => {
              "use server";
              await signIn("github");
            }}
          >
            <button className="inline-flex items-center gap-2 px-6 py-3 bg-[#24292e] hover:bg-black text-white font-medium rounded-xl shadow transition">
              {/* 簡易的なGitHubアイコン（お好みでReact Iconsなどに差し替え可能） */}
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.1.39-1.99 1.03-2.69-.1-.25-.45-1.29.1-2.65 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.36.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.69 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"/>
              </svg>
              GitHubアカウントでログイン
            </button>
          </form>
        </div>
      )}
    </main>
  );
}