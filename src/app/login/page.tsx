import { Suspense } from "react";
import { LoginButton } from "./login-button";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <section className="flex w-full max-w-sm flex-col items-center gap-6 rounded-lg border bg-card px-6 py-8 text-center shadow-sm">
        <div className="flex size-12 items-center justify-center rounded-lg bg-primary text-base font-bold text-primary-foreground shadow-xs">
          物
        </div>
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-[1.7rem] leading-tight font-semibold tracking-tight">
            物理部ブログ
          </h1>
          <p className="text-muted-foreground text-sm leading-6">
            @sandagakuen.ed.jp のGoogleアカウントでログインしてください。
          </p>
        </div>
        <Suspense>
          <LoginButton />
        </Suspense>
      </section>
    </main>
  );
}
