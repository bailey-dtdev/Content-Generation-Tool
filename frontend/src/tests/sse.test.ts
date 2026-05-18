import { describe, expect, it } from "vitest";

import { parseSSEChunk } from "@/lib/sse";

describe("parseSSEChunk", () => {
  it("parses an event name and JSON data", () => {
    const result = parseSSEChunk(
      'event: delta\ndata: {"section_id":"s1","text":"hi"}',
    );
    expect(result).toEqual({
      event: "delta",
      data: { section_id: "s1", text: "hi" },
    });
  });

  it("returns null when a chunk carries no data line", () => {
    expect(parseSSEChunk("event: ping")).toBeNull();
  });

  it("returns null when the data is not valid JSON", () => {
    expect(parseSSEChunk("event: delta\ndata: not-json")).toBeNull();
  });
});
