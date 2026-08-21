export type AttachmentResourceType = "BLOG_POST" | "APPLICATION";
export type UploadResourceType = AttachmentResourceType;

export type AttachmentItem = {
  id: string;
  fileName: string;
  contentType: string;
  createdAt: string;
  url: string;
};

type CreateUploadInput = {
  resourceType: AttachmentResourceType;
  resourceId: string;
  fileName: string;
  contentType: string;
};

type CreateUploadResponse = {
  attachmentId: string;
  uploadUrl: string;
};

async function parseErrorResponse(response: Response, fallbackMessage: string) {
  const data = (await response.json().catch(() => null)) as { error?: string } | null;
  return data?.error ?? fallbackMessage;
}

async function createUploadUrl(input: CreateUploadInput) {
  const response = await fetch("/api/uploads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response, "アップロードURLの取得に失敗しました。"));
  }

  return (await response.json()) as CreateUploadResponse;
}

export const attachmentKeys = {
  all: ["attachments"] as const,
  byResource: (resourceType: AttachmentResourceType, resourceId: string) =>
    [...attachmentKeys.all, resourceType, resourceId] as const,
};

export async function fetchAttachments({
  resourceType,
  resourceId,
}: {
  resourceType: AttachmentResourceType;
  resourceId: string;
}) {
  const params = new URLSearchParams({ resourceType, resourceId });
  const response = await fetch(`/api/attachments?${params.toString()}`);

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response, "添付ファイルの取得に失敗しました。"));
  }

  const data = (await response.json()) as { attachments: AttachmentItem[] };
  return data.attachments;
}

export async function uploadAttachment({
  resourceType,
  resourceId,
  file,
}: {
  resourceType: UploadResourceType;
  resourceId: string;
  file: File;
}) {
  const upload = await createUploadUrl({
    resourceType,
    resourceId,
    fileName: file.name,
    contentType: file.type,
  });

  const response = await fetch(upload.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  if (!response.ok) {
    throw new Error("ファイルのアップロードに失敗しました。");
  }

  return { attachmentId: upload.attachmentId };
}
