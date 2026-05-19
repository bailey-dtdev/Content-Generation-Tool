import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { type Editor, EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

import { Icon } from "@/components/ui/Icon";

const HEADING_LEVELS = [1, 2, 3, 4] as (1 | 2 | 3 | 4)[];

function blockValue(editor: Editor): string {
  for (const level of HEADING_LEVELS) {
    if (editor.isActive("heading", { level })) return `h${level}`;
  }
  return "p";
}

function Toolbar({ editor }: { editor: Editor }) {
  const setBlock = (value: string) => {
    const chain = editor.chain().focus();
    if (value === "p") {
      chain.setParagraph().run();
    } else {
      chain.setHeading({ level: Number(value.slice(1)) as 1 | 2 | 3 | 4 }).run();
    }
  };

  const setLink = () => {
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

  const text = editor.getText().trim();
  const words = text ? text.split(/\s+/).length : 0;

  return (
    <div className="editor-toolbar">
      <select
        className="editor-toolbar__select"
        value={blockValue(editor)}
        onChange={(event) => setBlock(event.target.value)}
        aria-label="Block type"
      >
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
        <option value="h4">Heading 4</option>
        <option value="p">Paragraph</option>
      </select>
      <div className="editor-toolbar__sep" />
      <button
        type="button"
        title="Bold"
        className={editor.isActive("bold") ? "is-active" : ""}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Icon name="bold" size={14} />
      </button>
      <button
        type="button"
        title="Italic"
        className={editor.isActive("italic") ? "is-active" : ""}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Icon name="italic" size={14} />
      </button>
      <button
        type="button"
        title="Underline"
        className={editor.isActive("underline") ? "is-active" : ""}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <Icon name="underline" size={14} />
      </button>
      <div className="editor-toolbar__sep" />
      <button
        type="button"
        title="Bullet list"
        className={editor.isActive("bulletList") ? "is-active" : ""}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <Icon name="list-ul" size={14} />
      </button>
      <button
        type="button"
        title="Numbered list"
        className={editor.isActive("orderedList") ? "is-active" : ""}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <Icon name="list-ol" size={14} />
      </button>
      <div className="editor-toolbar__sep" />
      <button
        type="button"
        title="Link"
        className={editor.isActive("link") ? "is-active" : ""}
        onClick={setLink}
      >
        <Icon name="link" size={14} />
      </button>
      <div style={{ flex: 1 }} />
      <span style={{ fontSize: 11, color: "var(--ink-5)" }}>{words} words</span>
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
    <>
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </>
  );
}
