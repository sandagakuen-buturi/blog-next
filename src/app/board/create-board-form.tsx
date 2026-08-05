"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createBoard } from "./actions";

export function CreateBoardForm() {
  const [state, formAction, isPending] = useActionState(createBoard, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      )}
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">板名</Label>
        <Input id="name" name="name" required maxLength={100} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="scope">公開範囲</Label>
        <Select name="scope" defaultValue="PUBLIC_STUDENT">
          <SelectTrigger id="scope">
            <SelectValue>
              {(v: string) => (v === "MEMBERS_ONLY" ? "物理部員のみ" : "学生に開放")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PUBLIC_STUDENT">学生に開放</SelectItem>
            <SelectItem value="MEMBERS_ONLY">物理部員のみ</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={isPending} className="w-fit">
        作成
      </Button>
    </form>
  );
}
