export type Task = {
  id: string; // IDは将来的にUUIDなどを使うためstringが一般的
  title: string;
  isCompleted: boolean;
  createdAt?: string; // オプショナル（あってもなくても良い）な項目
};