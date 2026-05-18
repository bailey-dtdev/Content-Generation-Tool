import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { OutlineEditor } from "@/components/OutlineEditor";

const noopProps = {
  onSave: () => {},
  onRegenerate: () => {},
  onApprove: () => {},
  busy: false,
};

describe("OutlineEditor", () => {
  it("appends a new section", () => {
    const onSectionsChange = vi.fn();
    render(
      <OutlineEditor
        sections={[{ section_id: "s1", heading: "Intro", blurb: "Blurb" }]}
        onSectionsChange={onSectionsChange}
        {...noopProps}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /add section/i }));
    expect(onSectionsChange).toHaveBeenCalledOnce();
    expect(onSectionsChange.mock.calls[0][0]).toHaveLength(2);
  });

  it("removes a section", () => {
    const onSectionsChange = vi.fn();
    render(
      <OutlineEditor
        sections={[
          { section_id: "s1", heading: "Intro", blurb: "Blurb" },
          { section_id: "s2", heading: "Details", blurb: "More" },
        ]}
        onSectionsChange={onSectionsChange}
        {...noopProps}
      />,
    );
    fireEvent.click(screen.getAllByRole("button", { name: /remove/i })[0]);
    expect(onSectionsChange.mock.calls[0][0]).toHaveLength(1);
  });
});
