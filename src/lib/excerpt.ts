const MARKDOWN_SYNTAX = /(^#{1,6}\s+|[*_~`>]|!\[[^\]]*\]\([^)]*\)|\[([^\]]*)\]\([^)]*\)|-{3,})/gm;

export function createExcerpt(markdown: string, maxLength = 140): string {
  const plain = markdown
    .replace(MARKDOWN_SYNTAX, "$2")
    .replace(/\s+/g, " ")
    .trim();

  if (plain.length <= maxLength) return plain;
  return `${plain.slice(0, maxLength).trimEnd()}…`;
}
