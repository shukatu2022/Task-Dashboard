import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// 入力値の検証ルール
// zod とは：「この値は文字列で最大100文字」のようなルールを定義するライブラリ
const taskSchema = z.object({
  title: z.string()
    .min(1, "タスク名は必須です")
    .max(100, "100文字以内で入力してください")
    .trim(),
});

// --------------------------
// GET /api/tasks
// タスク一覧を取得する
// --------------------------
export async function GET() {
  // ① 認証チェック：ログインしていなければ401を返す
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "ログインが必要です" }, { status: 401 });
  }

  // ② 自分のタスクだけ取得
  const tasks = await prisma.task.findMany({
    where: { userId: session.user.id },
    select: {
    id: true,
    title: true,
    completed: true,
    createdAt: true,
    dueDate: true, // 追加
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(tasks);
}

// --------------------------
// POST /api/tasks
// タスクを新規作成する
// --------------------------
export async function POST(req: Request) {
  // ① 認証チェック
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "ログインが必要です" }, { status: 401 });
  }

  // ② リクエストの中身を取得
  const body = await req.json();

  // ③ 入力値の検証
  const result = taskSchema.safeParse(body);
  if (!result.success) {
    return Response.json({ error: result.error.issues }, { status: 400 });
  }

  // ④ DBに保存
  const task = await prisma.task.create({
    data: {
      title: result.data.title,
      userId: session.user.id,
    },
  });

  return Response.json(task, { status: 201 });
}

// --------------------------
// PATCH /api/tasks
// タスクの完了状態を切り替える
// --------------------------
export async function PATCH(req: Request) {
  // ① 認証チェック
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const body = await req.json();

  // ② 自分のタスクかどうか確認してから更新
  const task = await prisma.task.updateMany({
    where: {
      id: body.id,
      userId: session.user.id, // 他人のタスクは更新できない
    },
    data: { completed: body.completed },
  });

  return Response.json(task);
}

// --------------------------
// DELETE /api/tasks
// タスクを削除する
// --------------------------
export async function DELETE(req: Request) {
  // ① 認証チェック
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const body = await req.json();

  // ② 自分のタスクかどうか確認してから削除
  await prisma.task.deleteMany({
    where: {
      id: body.id,
      userId: session.user.id, // 他人のタスクは削除できない
    },
  });

  return Response.json({ success: true });
}