// Plain text <-> HTML helpers for moving streamed content into the editor.

const escapeHtml = (text: string): string =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

/** Wrap blank-line-separated plain text into paragraphs for the editor. */
export function textToHtml(text: string): string {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
  if (paragraphs.length === 0) return "<p></p>";
  return paragraphs.map((block) => `<p>${escapeHtml(block)}</p>`).join("");
}

/** Strip HTML to plain text — used before sending content to the QA pass. */
export function htmlToText(html: string): string {
  const parsed = new DOMParser().parseFromString(html, "text/html");
  return parsed.body.textContent?.trim() ?? "";
}
