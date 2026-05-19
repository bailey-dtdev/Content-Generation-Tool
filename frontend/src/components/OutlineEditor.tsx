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
import { Icon } from "@/components/ui/Icon";

function SortableCard({
  index,
  section,
  onChange,
  onDelete,
  onDuplicate,
}: {
  index: number;
  section: OutlineSection;
  onChange: (next: OutlineSection) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const id = section.section_id ?? "";
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="outline-card"
    >
      <div
        className="outline-card__grip"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <Icon name="grip" size={16} />
      </div>
      <div className="outline-card__num">{index + 1}</div>
      <div className="outline-card__body">
        <input
          className="outline-card__h"
          value={section.heading}
          aria-label="Section heading"
          onChange={(event) => onChange({ ...section, heading: event.target.value })}
        />
        <textarea
          className="outline-card__b"
          rows={2}
          value={section.blurb}
          aria-label="Section blurb"
          onChange={(event) => onChange({ ...section, blurb: event.target.value })}
        />
      </div>
      <div className="outline-card__actions">
        <button
          type="button"
          className="icon-btn"
          title="Duplicate"
          onClick={onDuplicate}
        >
          <Icon name="plus" size={14} />
        </button>
        <button
          type="button"
          className="icon-btn icon-btn--danger"
          title="Remove"
          onClick={onDelete}
        >
          <Icon name="trash" size={14} />
        </button>
      </div>
    </div>
  );
}

export function OutlineEditor({
  sections,
  onSectionsChange,
}: {
  sections: OutlineSection[];
  onSectionsChange: (sections: OutlineSection[]) => void;
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

  const duplicateAt = (index: number) => {
    const copy = [...sections];
    copy.splice(index + 1, 0, {
      ...sections[index],
      section_id: crypto.randomUUID(),
    });
    onSectionsChange(copy);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={sections.map((s) => s.section_id ?? "")}
        strategy={verticalListSortingStrategy}
      >
        <div className="outline-list">
          {sections.map((section, index) => (
            <SortableCard
              key={section.section_id}
              index={index}
              section={section}
              onChange={(next) => updateAt(index, next)}
              onDelete={() => deleteAt(index)}
              onDuplicate={() => duplicateAt(index)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
