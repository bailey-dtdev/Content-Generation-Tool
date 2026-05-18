import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { OutlineSection } from "@/api/generated";
import { inputClass } from "@/components/ui/Field";

const actionButton =
  "rounded-md border px-3 py-1.5 text-sm hover:bg-slate-100 disabled:opacity-50";

function SortableSection({
  section,
  onChange,
  onDelete,
}: {
  section: OutlineSection;
  onChange: (next: OutlineSection) => void;
  onDelete: () => void;
}) {
  const id = section.section_id ?? "";
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="flex items-start gap-2 rounded-md border bg-white p-3"
    >
      <button
        type="button"
        className="cursor-grab px-1 text-slate-400"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        ⠿
      </button>
      <div className="flex-1 space-y-2">
        <input
          className={inputClass}
          value={section.heading}
          onChange={(event) => onChange({ ...section, heading: event.target.value })}
        />
        <textarea
          rows={2}
          className={inputClass}
          value={section.blurb}
          onChange={(event) => onChange({ ...section, blurb: event.target.value })}
        />
      </div>
      <button
        type="button"
        onClick={onDelete}
        className="text-sm text-red-600 hover:underline"
      >
        Remove
      </button>
    </div>
  );
}

export function OutlineEditor({
  sections,
  onSectionsChange,
  onSave,
  onRegenerate,
  onApprove,
  busy,
}: {
  sections: OutlineSection[];
  onSectionsChange: (sections: OutlineSection[]) => void;
  onSave: () => void;
  onRegenerate: () => void;
  onApprove: () => void;
  busy: boolean;
}) {
  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = sections.findIndex((s) => s.section_id === active.id);
    const to = sections.findIndex((s) => s.section_id === over.id);
    if (from !== -1 && to !== -1) {
      onSectionsChange(arrayMove(sections, from, to));
    }
  };

  const updateAt = (index: number, next: OutlineSection) => {
    onSectionsChange(sections.map((s, i) => (i === index ? next : s)));
  };

  const deleteAt = (index: number) => {
    onSectionsChange(sections.filter((_, i) => i !== index));
  };

  const addSection = () => {
    onSectionsChange([
      ...sections,
      { section_id: crypto.randomUUID(), heading: "New section", blurb: "" },
    ]);
  };

  return (
    <div className="space-y-3">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sections.map((s) => s.section_id ?? "")}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {sections.map((section, index) => (
              <SortableSection
                key={section.section_id}
                section={section}
                onChange={(next) => updateAt(index, next)}
                onDelete={() => deleteAt(index)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={addSection} className={actionButton}>
          Add section
        </button>
        <button type="button" onClick={onSave} disabled={busy} className={actionButton}>
          Save edits
        </button>
        <button
          type="button"
          onClick={onRegenerate}
          disabled={busy}
          className={actionButton}
        >
          Regenerate outline
        </button>
        <button
          type="button"
          onClick={onApprove}
          disabled={busy}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          Approve &amp; continue
        </button>
      </div>
    </div>
  );
}
