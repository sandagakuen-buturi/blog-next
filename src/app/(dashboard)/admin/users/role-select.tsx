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
import { assignUserRole } from "../roles/actions";

type Role = { id: string; name: string; level: number };

export function RoleSelect({
  userId,
  currentRoleId,
  roles,
  disabled,
}: {
  userId: string;
  currentRoleId: string;
  roles: Role[];
  disabled?: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      defaultValue={currentRoleId}
      disabled={disabled || isPending}
      onValueChange={(roleId) => {
        if (!roleId) return;
        startTransition(async () => {
          const formData = new FormData();
          formData.set("userId", userId);
          formData.set("roleId", roleId);
          try {
            await assignUserRole(formData);
            toast.success("ロールを変更しました。");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "変更に失敗しました。");
          }
        });
      }}
    >
      <SelectTrigger className="w-48">
        <SelectValue>
          {(roleId: string) => roles.find((role) => role.id === roleId)?.name ?? roleId}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {roles.map((role) => (
          <SelectItem key={role.id} value={role.id}>
            {role.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
