import type { ReactNode } from "react";

import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { type Editor, EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

const HEADING_LEVELS = [1, 2, 3, 4] as (1 | 2 | 3 | 4)[];

function ToolbarButton({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded px-2 py-1 text-xs ${
        active ? "bg-slate-900 text-white" : "hover:bg-slate-100"
      }`}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const editLink = () => {
    const current = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", current ?? "");
    if (url === null) return;
    const chain = editor.chain().focus().extendMarkRange("link");
    if (url === "") {
      chain.unsetLink().run();
    } else {
      chain.setLink({ href: url }).run();
    }
  };

  return (
    <div className="flex flex-wrap gap-1 border-b p-1">
      {HEADING_LEVELS.map((level) => (
        <ToolbarButton
          key={level}
          active={editor.isActive("heading", { level })}
          onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
        >
          H{level}
        </ToolbarButton>
      ))}
      <ToolbarButton
        active={editor.isActive("paragraph")}
        onClick={() => editor.chain().focus().setParagraph().run()}
      >
        P
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        B
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        I
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        U
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        • List
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        1. List
      </ToolbarButton>
      <ToolbarButton active={editor.isActive("link")} onClick={editLink}>
        Link
      </ToolbarButton>
    </div>
  );
}

export function ContentEditor({
  initialHtml,
  onChange,
}: {
  initialHtml: string;
  onChange: (html: string) => void;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: HEADING_LEVELS },
        codeBlock: false,
        blockquote: false,
        code: false,
        strike: false,
        horizontalRule: false,
      }),
      Underline,
      Link.configure({ openOnClick: false }),
    ],
    content: initialHtml,
    onUpdate: (props) => onChange(props.editor.getHTML()),
  });

  if (!editor) return null;

  return (
    <div className="rounded-md border bg-white">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} className="px-3 py-2 text-sm text-slate-800" />
    </div>
  );
}
