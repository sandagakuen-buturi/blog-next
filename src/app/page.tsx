import { verifySession } from "@/lib/dal";
import { SignOutButton } from "./sign-out-button";

export default async function Home() {
  const user = await verifySession();

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-8">
      <h1 className="text-2xl font-semibold">物理部ブログ</h1>
      <p>
        ようこそ、{user.name} さん(ロール: {user.role.name}
        {user.department ? ` / ${user.department}課` : ""})
      </p>
      <SignOutButton />
    </main>
  );
}
