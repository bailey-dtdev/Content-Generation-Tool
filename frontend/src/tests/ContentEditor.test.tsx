import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ContentEditor } from "@/components/ContentEditor";

describe("ContentEditor", () => {
  it("renders the formatting toolbar", async () => {
    render(<ContentEditor initialHtml="<p>Hello</p>" onChange={() => {}} />);
    expect(await screen.findByRole("button", { name: "Bold" })).toBeTruthy();
    expect(await screen.findByRole("button", { name: "Link" })).toBeTruthy();
    expect(
      await screen.findByRole("combobox", { name: /block type/i }),
    ).toBeTruthy();
  });
});
