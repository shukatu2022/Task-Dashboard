// app/components/TaskDashboard.tsx
"use client";

import { useState } from "react";
import { handleSignOut } from "@/app/actions";
import { User } from "next-auth";

// タスクの型定義（必要に応じて調整してください）
interface Task {
  id: string;
  title: string;
  isCompleted: boolean;
}

export default function TaskDashboard({ user }: { user: User | undefined }) {
  const [inputValue, setInputValue] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);

  // タスク追加処理
  const addTask = () => {
    if (!inputValue.trim()) return;
    const newTask: Task = {
      id: crypto.randomUUID(), // 一時的なフロント側のID生成
      title: inputValue,
      isCompleted: false,
    };
    setTasks([...tasks, newTask]);
    setInputValue("");
  };

  // タスク削除処理
  const deleteTask = (id: string) => {
    setTasks(tasks.filter((task) => task.id !== id));
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

      {/* 3. タスク一覧 */}
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
  );
}