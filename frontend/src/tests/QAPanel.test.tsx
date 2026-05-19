import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { QANote } from "@/api/generated";
import { QAPanel } from "@/components/QAPanel";

describe("QAPanel", () => {
  it("shows an empty state when there are no notes", () => {
    render(<QAPanel notes={[]} />);
    expect(screen.getByText(/no qa notes yet/i)).toBeTruthy();
  });

  it("lists notes with their message", () => {
    const notes: QANote[] = [
      {
        severity: QANote.severity.WARNING,
        category: "banned_word",
        message: "Banned term: 'synergy'.",
        section_id: "s1",
      },
    ];
    render(<QAPanel notes={notes} />);
    expect(screen.getByText(/banned term: 'synergy'/i)).toBeTruthy();
  });

  it("shows a running state", () => {
    render(<QAPanel notes={[]} running />);
    expect(screen.getByText(/running/i)).toBeTruthy();
  });
});
