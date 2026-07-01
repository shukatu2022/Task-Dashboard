export type Task = {
  id: string; // IDは将来的にUUIDなどを使うためstringが一般的
  title: string;
  isCompleted: boolean;
  createdAt?: string; // オプショナル（あってもなくても良い）な項目
  dueDate?: string; // 追加：ISO文字列（例: "2026-07-10"）を想定
                    // オプショナル（?）にしておくことで、
                    // 既存タスクや日付未設定タスクにも対応できます 
};