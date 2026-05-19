import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { OutlineEditor } from "@/components/OutlineEditor";

describe("OutlineEditor", () => {
  it("removes a section", () => {
    const onSectionsChange = vi.fn();
    render(
      <OutlineEditor
        sections={[
          { section_id: "s1", heading: "Intro", blurb: "Blurb" },
          { section_id: "s2", heading: "Details", blurb: "More" },
        ]}
        onSectionsChange={onSectionsChange}
      />,
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Remove" })[0]);
    expect(onSectionsChange.mock.calls[0][0]).toHaveLength(1);
  });

  it("duplicates a section", () => {
    const onSectionsChange = vi.fn();
    render(
      <OutlineEditor
        sections={[{ section_id: "s1", heading: "Intro", blurb: "Blurb" }]}
        onSectionsChange={onSectionsChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Duplicate" }));
    expect(onSectionsChange.mock.calls[0][0]).toHaveLength(2);
  });
});
