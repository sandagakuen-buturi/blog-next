"use client";

import { Button } from "@/components/ui/button";

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-muted-foreground text-sm font-medium">エラー</p>
      <h1 className="text-xl font-semibold tracking-tight">問題が発生しました</h1>
      <p className="text-muted-foreground text-sm">
        ページの読み込み中にエラーが発生しました。時間をおいて再度お試しください。
      </p>
      <Button onClick={() => reset()}>もう一度試す</Button>
    </main>
  );
}
