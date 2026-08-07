import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-muted-foreground text-sm font-medium">404</p>
      <h1 className="text-xl font-semibold tracking-tight">ページが見つかりません</h1>
      <p className="text-muted-foreground text-sm">
        お探しのページは存在しないか、削除された可能性があります。
      </p>
      <Button render={<Link href="/" />} nativeButton={false}>
        ダッシュボードに戻る
      </Button>
    </main>
  );
}
