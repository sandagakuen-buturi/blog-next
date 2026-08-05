"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type AuditLogRow = {
  id: string;
  createdAt: Date;
  action: string;
  targetType: string | null;
  targetId: string | null;
  before: unknown;
  after: unknown;
  actor: { name: string; email: string };
};

export function AuditLogTable({ logs }: { logs: AuditLogRow[] }) {
  const [selected, setSelected] = useState<AuditLogRow | null>(null);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>日時</TableHead>
            <TableHead>実行者</TableHead>
            <TableHead>操作</TableHead>
            <TableHead>対象</TableHead>
            <TableHead>変更前</TableHead>
            <TableHead>変更後</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow
              key={log.id}
              className="cursor-pointer"
              onClick={() => setSelected(log)}
            >
              <TableCell className="text-xs whitespace-nowrap hover:underline">
                {log.createdAt.toLocaleString("ja-JP")}
              </TableCell>
              <TableCell>{log.actor.name}</TableCell>
              <TableCell>{log.action}</TableCell>
              <TableCell className="text-xs">
                {log.targetType}
                {log.targetId ? `:${log.targetId}` : ""}
              </TableCell>
              <TableCell className="max-w-48 truncate text-xs">
                {log.before ? JSON.stringify(log.before) : "-"}
              </TableCell>
              <TableCell className="max-w-48 truncate text-xs">
                {log.after ? JSON.stringify(log.after) : "-"}
              </TableCell>
            </TableRow>
          ))}
          {logs.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-muted-foreground text-center text-sm">
                監査ログはまだありません。
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>監査ログ詳細</DialogTitle>
          </DialogHeader>
          {selected && (
            <dl className="flex flex-col gap-3">
              <div>
                <dt className="text-muted-foreground text-xs">日時</dt>
                <dd className="text-sm">{selected.createdAt.toLocaleString("ja-JP")}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">実行者</dt>
                <dd className="text-sm">
                  {selected.actor.name}({selected.actor.email})
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">操作</dt>
                <dd className="text-sm">{selected.action}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">対象</dt>
                <dd className="text-sm">
                  {selected.targetType ?? "-"}
                  {selected.targetId ? `: ${selected.targetId}` : ""}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">変更前</dt>
                <dd>
                  <pre className="bg-muted overflow-x-auto rounded p-3 text-xs whitespace-pre-wrap">
                    {selected.before ? JSON.stringify(selected.before, null, 2) : "-"}
                  </pre>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">変更後</dt>
                <dd>
                  <pre className="bg-muted overflow-x-auto rounded p-3 text-xs whitespace-pre-wrap">
                    {selected.after ? JSON.stringify(selected.after, null, 2) : "-"}
                  </pre>
                </dd>
              </div>
            </dl>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
