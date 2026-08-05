/** BETTER_AUTH_URLをアプリの公開オリジンとして再利用し、絶対URLを組み立てる。 */
export function absoluteUrl(path: string): string {
  const base = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  return new URL(path, base).toString();
}
