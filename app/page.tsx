"use client"; // ← これが重要！「画面を動かす」宣言です

import { useState, useEffect} from "react";
import { Task } from "@/types"; // index.tsを作ったのでこのように書けます
                                // @/は一番上の階層を指すエイリアス　
                                // 問題があれば../typesと書いてもOK
import { auth, signIn, signOut } from "@/auth";

export default function Home() {
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

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-blue-600">Task Dashboard</h1>

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
    </main>
  );
}