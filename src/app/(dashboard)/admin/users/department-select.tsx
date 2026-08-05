"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setUserDepartment } from "./actions";

const LABELS: Record<string, string> = {
  NONE: "なし",
  IT: "IT課",
  ROBOT: "ロボット課",
  HYBRID: "ハイブリッド",
};

export function DepartmentSelect({
  userId,
  currentDepartment,
}: {
  userId: string;
  currentDepartment: "IT" | "ROBOT" | "HYBRID" | null;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      defaultValue={currentDepartment ?? "NONE"}
      disabled={isPending}
      onValueChange={(department) => {
        if (!department) return;
        startTransition(async () => {
          const formData = new FormData();
          formData.set("userId", userId);
          formData.set("department", department);
          try {
            await setUserDepartment(formData);
            toast.success("所属課を変更しました。");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "変更に失敗しました。");
          }
        });
      }}
    >
      <SelectTrigger className="w-36">
        <SelectValue>{(value: string) => LABELS[value] ?? value}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(LABELS).map(([value, label]) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
