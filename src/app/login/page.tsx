import { Suspense } from "react";
import { LoginButton } from "./login-button";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold">物理部ブログ</h1>
        <p className="text-muted-foreground text-sm">
          @sandagakuen.ed.jp のGoogleアカウントでログインしてください。
        </p>
      </div>
      <Suspense>
        <LoginButton />
      </Suspense>
    </main>
  );
}
