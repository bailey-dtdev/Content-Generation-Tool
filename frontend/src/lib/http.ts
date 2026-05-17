// Configures the generated OpenAPI client and provides direct helpers for
// the few calls the generated client cannot express (e.g. binary uploads).
import { OpenAPI, type SitemapResponse } from "@/api/generated";

export const API_BASE: string = import.meta.env.VITE_API_BASE_URL ?? "";

OpenAPI.BASE = API_BASE;
OpenAPI.WITH_CREDENTIALS = true;
OpenAPI.CREDENTIALS = "include";

// openapi-typescript-codegen mistypes binary form fields, so the multipart
// sitemap upload is issued directly rather than through the generated client.
export async function uploadSitemap(
  clientId: string,
  input: { file?: File; pastedUrls?: string },
): Promise<SitemapResponse> {
  const form = new FormData();
  if (input.file) form.append("file", input.file);
  if (input.pastedUrls) form.append("pasted_urls", input.pastedUrls);

  const response = await fetch(`${API_BASE}/api/v1/clients/${clientId}/sitemap`, {
    method: "POST",
    body: form,
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error(`Sitemap upload failed: ${response.status}`);
  }
  return (await response.json()) as SitemapResponse;
}
