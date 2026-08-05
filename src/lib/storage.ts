import "server-only";
import { randomUUID } from "node:crypto";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const BUCKET = process.env.S3_BUCKET!;

function getClient() {
  return new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: "auto",
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
    // aws-sdk v3のデフォルト(WHEN_SUPPORTED)は署名付きURLにも自動でチェックサムの
    // クエリパラメータを付与するが、R2/RustFS等のS3互換サービスはこれを正しく検証できず
    // PUT時に署名エラーとなることがある。PutObjectはチェックサム必須の操作ではないため、
    // WHEN_REQUIREDに変更して付与しないようにする。
    requestChecksumCalculation: "WHEN_REQUIRED",
  });
}

export function buildObjectKey(resourceType: string, resourceId: string, fileName: string) {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${resourceType}/${resourceId}/${randomUUID()}-${safeName}`;
}

/** クライアントが直接オブジェクトストレージへPUTするための署名付きアップロードURL(5分間有効)。 */
export async function createPresignedUploadUrl(key: string, contentType: string) {
  const command = new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType });
  return getSignedUrl(getClient(), command, { expiresIn: 300 });
}

/** 閲覧用の署名付きダウンロードURL(5分間有効)。canView()通過後にのみ発行すること。 */
export async function createPresignedDownloadUrl(key: string) {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(getClient(), command, { expiresIn: 300 });
}

/** リソース削除時に添付ファイルの実体もオブジェクトストレージから削除する。 */
export async function deleteObject(key: string) {
  await getClient().send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}
