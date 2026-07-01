"use client";

import { useState, useEffect } from "react";
import { handleSignOut } from "@/app/actions";
import { User } from "next-auth";

// タスクの型定義
// schema.prisma の Task モデルに合わせた型
interface Task {
  id: string;
  title: string;
  completed: boolean; // schema.prisma は completed（isCompleted ではない）
  createdAt: string;
  dueDate?: string; // 追加：ISO文字列（例: "2026-07-10"）を想定
                    // オプショナル（?）にしておくことで、
                    // 既存タスクや日付未設定タスクにも対応できます 
}

export default function TaskDashboard({ user }: { user: User | undefined }) {
  const [inputValue, setInputValue] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true); // 読み込み中の状態管理
  const [dueDateValue, setDueDateValue] = useState(""); // 日付入力用

  // -----------------------------------------------
  // ページ読み込み時にタスク一覧を取得
  // useEffect：コンポーネントが画面に表示された直後に実行される
  // -----------------------------------------------
  useEffect(() => {
    const fetchTasks = async () => {
      const res = await fetch("/api/tasks");

      // 401 = セッション切れ → トップページに戻す
      if (res.status === 401) {
        window.location.href = "/";
        return;
      }

      const data = await res.json();
      setTasks(data);
      setIsLoading(false);
    };

    fetchTasks();
  }, []); // 第二引数は依存配列と呼ばれ、ここに指定した値が変化したときだけ
          // useEffect 内の処理が再実行される
          // [] なら最初の1回だけ実行

  // -----------------------------------------------
  // タスク追加処理
  // -----------------------------------------------
  const addTask = async () => {
    if (!inputValue.trim()) return;

    // dueDate が空なら undefined を送る（または送らない）
    const body: { title: string; dueDate?: string } = {
      title: inputValue,
    };
    if (dueDateValue.trim()) {
      body.dueDate = dueDateValue;
    }

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/";
          return;
        }
        throw new Error(`HTTP ${res.status}`);
      }

      // DB に保存されたタスク（id が確定している）を取得
      const newTask: Task = await res.json();

      // 画面のタスク一覧に追加
      setTasks([newTask, ...tasks]);
      setInputValue("");
      setDueDateValue(""); // 日付入力欄もクリア
    } catch (error) {
      console.error("タスク追加エラー:", error);
    alert("タスクの追加に失敗しました。");
    }
  };

  // -----------------------------------------------
  // タスク削除処理
  // -----------------------------------------------
  const deleteTask = async (id: string) => {
    const res = await fetch("/api/tasks", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (res.status === 401) {
      window.location.href = "/";
      return;
    }

    // 画面からも削除
    setTasks(tasks.filter((task) => task.id !== id));
  };

  // -----------------------------------------------
  // タスク完了状態の切り替え処理
  // -----------------------------------------------
  const toggleTask = async (id: string, completed: boolean) => {
    const res = await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, completed: !completed }),
    });

    if (res.status === 401) {
      window.location.href = "/";
      return;
    }

    // 画面の状態も更新
    setTasks(tasks.map((t) =>
      t.id === id ? { ...t, completed: !completed } : t
    ));
  };

  // -----------------------------------------------
  // Enterキーでタスク追加
  // -----------------------------------------------
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") addTask();
  };

  // -----------------------------------------------
  // 期限が近いかどうかを判定する関数
  // -----------------------------------------------
  const isDueSoon = (dueDateStr?: string): boolean => {
    if (!dueDateStr) return false;

    const dueDate = new Date(dueDateStr);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // 3日以内なら「近い」と判定（閾値は調整可能）
    return diffDays <= 3 && diffDays >= 0;
  };

  return (
    <>
      {/* 1. ヘッダー（ユーザー情報とログアウトボタン） */}
      <div className="flex justify-between items-center mb-8 pb-4 border-b">
        <div className="flex items-center gap-3">
          {user?.image && (
            <img
              src={user.image}
              alt="Avatar"
              className="w-10 h-10 rounded-full border shadow-sm"
            />
          )}
          <div className="text-left hidden sm:block">
            <p className="text-sm font-medium text-gray-800">{user?.name} さん</p>
            <p className="text-xs text-gray-400">{user?.email}</p>
          </div>
        </div>

        <form action={handleSignOut}>
          <button
            type="submit"
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition"
          >
            ログアウト
          </button>
        </form>
      </div>

      {/* 2. 入力エリア */}
      <div className="flex flex-col sm:flex-row gap-2 mb-8">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="新しいタスクを入力..."
          className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-black"
        />
        <input
          type="date"
          value={dueDateValue}
          onChange={(e) => setDueDateValue(e.target.value)}
          className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-black"
        />
        <button
          onClick={addTask}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          追加
        </button>
      </div>

      {/* 3. タスク一覧 */}
      {isLoading ? (
        // 読み込み中の表示
        <p className="text-center text-gray-400 py-8">読み込み中...</p>
      ) : tasks.length === 0 ? (
        // タスクが0件の表示
        <p className="text-center text-gray-400 py-8">タスクがありません</p>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const dueSoon = isDueSoon(task.dueDate);
            return (
              <div
                key={task.id}
                className={`flex items-center p-4 border rounded-lg bg-white shadow-sm ${
                  dueSoon ? "border-red-300 bg-red-50" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTask(task.id, task.completed)}
                  className="mr-4 h-5 w-5 cursor-pointer"
                />
                <div className="flex-1">
                  <span
                    className={`text-black ${
                      task.completed ? "line-through text-gray-400" : ""
                    }`}
                  >
                    {task.title}
                  </span>
                  {task.dueDate && (
                    <p className="text-xs text-gray-500 mt-1">
                      期限: {new Date(task.dueDate).toLocaleDateString("ja-JP")}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => deleteTask(task.id)}
                  className="ml-4 px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition"
                >
                  削除
                </button>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}