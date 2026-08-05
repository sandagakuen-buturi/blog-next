"use client";

import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";

/**
 * 通常のフォーム送信(サーバーアクション直呼び)はそのまま維持しつつ、送信前に確認を挟む。
 * useTransition + try/catch でラップしないのは、削除先のアクションが成功時に redirect() する
 * 場合、その特殊例外をクライアント側の catch が誤って握りつぶしてしまうため
 * (createBlogPost等で踏んだのと同じ問題)。
 */
export function ConfirmSubmitButton({
  confirmMessage,
  onClick,
  ...props
}: ComponentProps<typeof Button> & { confirmMessage: string }) {
  return (
    <Button
      type="submit"
      onClick={(e) => {
        if (!window.confirm(confirmMessage)) {
          e.preventDefault();
          return;
        }
        onClick?.(e);
      }}
      {...props}
    />
  );
}
