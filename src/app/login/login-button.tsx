"use client";

import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function LoginButton() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/";

  return (
    <Button
      onClick={() =>
        authClient.signIn.social({
          provider: "google",
          callbackURL: redirectTo,
        })
      }
    >
      Googleでログイン
    </Button>
  );
}
