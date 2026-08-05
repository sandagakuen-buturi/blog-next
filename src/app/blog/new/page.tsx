import { requirePermission } from "@/lib/dal";
import { PERMISSIONS } from "@/lib/permissions";
import { NewPostForm } from "./new-post-form";

export default async function NewBlogPostPage() {
  const author = await requirePermission(PERMISSIONS.CAN_POST_BLOG);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold">ブログを投稿</h1>
      <NewPostForm department={author.department} />
    </main>
  );
}
