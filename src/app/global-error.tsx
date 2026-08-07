"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ja">
      <body className="flex min-h-screen items-center justify-center bg-background p-8 text-foreground antialiased">
        <main className="mx-auto flex max-w-md flex-col items-center gap-4 text-center">
          <p className="text-sm font-medium text-muted-foreground">エラー</p>
          <h1 className="text-xl font-semibold tracking-tight">アプリケーションエラー</h1>
          <p className="text-sm text-muted-foreground">
            予期しない問題が発生しました。ページを再読み込みしてください。
          </p>
          <button
            onClick={() => reset()}
            className="rounded-md border border-transparent bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground shadow-xs hover:bg-primary/90"
          >
            もう一度試す
          </button>
        </main>
      </body>
    </html>
  );
}
