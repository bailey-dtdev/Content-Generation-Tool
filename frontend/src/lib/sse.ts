// SSE consumer for POST-with-body streaming endpoints. Native EventSource only
// supports GET, so this reads the fetch ReadableStream directly. See arch §7.4.
import { API_BASE } from "@/lib/http";

export interface SSEHandlers {
  onEvent: (event: string, data: unknown) => void;
  onError: (error: Error) => void;
  onDone: () => void;
}

export function parseSSEChunk(
  chunk: string,
): { event: string; data: unknown } | null {
  let event = "message";
  let data = "";
  for (const line of chunk.split("\n")) {
    if (line.startsWith("event:")) {
      event = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      data += line.slice(5).trim();
    }
  }
  if (!data) return null;
  try {
    return { event, data: JSON.parse(data) as unknown };
  } catch {
    return null;
  }
}

export async function streamPost(
  path: string,
  body: unknown,
  handlers: SSEHandlers,
  signal?: AbortSignal,
): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      credentials: "include",
      signal,
    });
  } catch (caught) {
    handlers.onError(caught instanceof Error ? caught : new Error("network error"));
    return;
  }

  if (!response.ok || !response.body) {
    handlers.onError(new Error(`stream failed: ${response.status}`));
    return;
  }

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += value;
      const chunks = buffer.split("\n\n");
      buffer = chunks.pop() ?? "";
      for (const chunk of chunks) {
        const parsed = parseSSEChunk(chunk);
        if (parsed) handlers.onEvent(parsed.event, parsed.data);
      }
    }
    handlers.onDone();
  } catch (caught) {
    if (signal?.aborted) {
      handlers.onDone();
      return;
    }
    handlers.onError(caught instanceof Error ? caught : new Error("stream error"));
  }
}
