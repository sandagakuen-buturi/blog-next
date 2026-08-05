import ReactMarkdown, { type UrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";

const SAFE_URI_SCHEMES = ["http:", "https:", "mailto:"];

/**
 * ブログ/QA/掲示板の全ての本文表示はこのコンポーネントを経由する。
 * rehype-raw は使わず生HTML埋め込みを一切許可しない。加えて javascript: 等の
 * 危険なURIスキームを持つリンクは urlTransform で無効化する(軽量な追加防御)。
 */
const sanitizeUrl: UrlTransform = (url) => {
  try {
    const parsed = new URL(url, "https://example.invalid");
    if (!SAFE_URI_SCHEMES.includes(parsed.protocol)) return "";
  } catch {
    // 相対パス等、URLとして解釈できないものはそのまま許可する。
  }
  return url;
};

export function SafeMarkdown({ children }: { children: string }) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} urlTransform={sanitizeUrl} skipHtml>
        {children}
      </ReactMarkdown>
    </div>
  );
}
