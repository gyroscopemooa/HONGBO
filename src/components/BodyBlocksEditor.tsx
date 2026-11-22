"use client";

import { useEffect, useRef, useState } from "react";
import { EditorContent, Node, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { closeHistory } from "@tiptap/pm/history";
import { LIMITS } from "@/lib/constants";
import { bodyDocument, documentBody } from "@/lib/body-document";
import { processImage, uploadImage } from "@/lib/image-client";
import { parseYoutubeId } from "@/lib/youtube";
import type { BodyBlock } from "@/lib/types";

const Youtube = Node.create({
  name: "bodyYoutube", group: "block", atom: true, draggable: true,
  addAttributes: () => ({ videoId: { default: "" }, caption: { default: "" } }),
  renderHTML({ node }) {
    const id = /^[\w-]{11}$/.test(node.attrs.videoId) ? node.attrs.videoId : "";
    return ["div", { "data-body-youtube": id, class: "my-4 rounded-xl border border-line bg-soft p-3", contenteditable: "false" },
      ["iframe", { src: `https://www.youtube-nocookie.com/embed/${id}`, title: node.attrs.caption || "유튜브 영상", class: "aspect-video w-full rounded-lg", loading: "lazy", allowfullscreen: "true" }],
      ["p", { class: "mt-2 text-sm text-muted" }, node.attrs.caption || "유튜브 영상 · 선택 후 Delete로 삭제"]];
  },
});

export function BodyBlocksEditor({ description, blocks, rich, onChange, onBusyChange, errors }: {
  description: string; blocks: BodyBlock[]; rich: boolean;
  onChange: (description: string, blocks: BodyBlock[]) => void;
  onBusyChange: (busy: boolean) => void;
  errors: Record<string, string>;
}) {
  const input = useRef<HTMLInputElement>(null);
  const uploading = useRef(false);
  const savedSelection = useRef<{ from: number; to: number } | null>(null);
  const lastDocument = useRef("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const callbacks = useRef({ onChange, onBusyChange });
  useEffect(() => { callbacks.current = { onChange, onBusyChange }; }, [onChange, onBusyChange]);

  const countsAllow = (editor: Editor, type: "image" | "youtube") => {
    const current = documentBody(editor.getJSON()).blocks;
    const count = current.filter(b => b.type === type).length;
    if (count >= (type === "image" ? LIMITS.bodyImagesMax : LIMITS.bodyVideosMax) || current.length >= LIMITS.bodyBlocksMax - 1) {
      setMessage(type === "image" ? "사진은 최대 6장까지 넣을 수 있어요. 본문이 길면 일부 내용을 줄여주세요." : "영상은 최대 3개까지 넣을 수 있어요. 본문이 길면 일부 내용을 줄여주세요.");
      return false;
    }
    return true;
  };
  const insertYoutube = (editor: Editor, text: string, range?: { from: number; to: number }) => {
    const id = parseYoutubeId(text.trim());
    if (!id) return false;
    if (!countsAllow(editor, "youtube")) return true;
    editor.view.dispatch(closeHistory(editor.state.tr));
    const chain = editor.chain().focus();
    if (range) chain.setTextSelection(range);
    chain.insertContent([{ type: "bodyYoutube", attrs: { videoId: id } }, { type: "paragraph" }]).run();
    editor.view.dispatch(closeHistory(editor.state.tr));
    setMessage("");
    return true;
  };
  const upload = async (editor: Editor, file: File) => {
    if (uploading.current || !countsAllow(editor, "image")) return;
    if (!file.type.startsWith("image/") || file.size > 25 * 1024 * 1024) { setMessage("25MB 이하 이미지 파일을 선택해주세요."); return; }
    const selection = savedSelection.current ?? { from: editor.state.selection.from, to: editor.state.selection.to };
    uploading.current = true;
    editor.setEditable(false);
    setBusy(true);
    callbacks.current.onBusyChange(true);
    setMessage("");
    try {
      const image = await processImage(file, { keepOriginal: true, maxWidth: 1600, maxBytes: LIMITS.bodyImageMaxBytes });
      const url = await uploadImage(image, "body");
      if (!editor.isDestroyed) {
        editor.view.dispatch(closeHistory(editor.state.tr));
        editor.chain().setTextSelection(selection).insertContent([{ type: "image", attrs: { src: url, alt: "본문 사진" } }, { type: "paragraph" }]).run();
        editor.view.dispatch(closeHistory(editor.state.tr));
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "사진을 올리지 못했어요.");
    } finally {
      uploading.current = false;
      savedSelection.current = null;
      if (!editor.isDestroyed) { editor.setEditable(true); editor.commands.focus(); }
      setBusy(false);
      callbacks.current.onBusyChange(false);
      if (input.current) input.current.value = "";
    }
  };
  const editor: Editor | null = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit.configure({ bold: false, italic: false, underline: false, strike: false, code: false, codeBlock: false, blockquote: false, heading: false, bulletList: false, orderedList: false, listItem: false, listKeymap: false, horizontalRule: false, link: { openOnClick: false, autolink: true, defaultProtocol: "https", HTMLAttributes: { class: "text-brand underline", rel: "noopener noreferrer nofollow", target: "_blank" } } }), Image.configure({ allowBase64: false }), Youtube],
    content: bodyDocument(description, blocks, rich),
    editorProps: {
      attributes: { id: "description", role: "textbox", "aria-label": "상세 설명", "aria-multiline": "true", class: "min-h-[320px] p-4 leading-relaxed outline-none break-words [&_p]:min-h-[1.6em] [&_p]:my-2 [&_img]:my-4 [&_img]:max-h-[600px] [&_img]:max-w-full [&_img]:rounded-xl [&_img]:object-contain [&_.ProseMirror-selectednode]:outline-2 [&_.ProseMirror-selectednode]:outline-brand" },
      handlePaste: (_view, event) => {
        if (!editor || uploading.current) return true;
        const file = Array.from(event.clipboardData?.items ?? []).find(item => item.kind === "file" && item.type.startsWith("image/"))?.getAsFile();
        if (file) { savedSelection.current = null; void upload(editor, file); return true; }
        const text = event.clipboardData?.getData("text/plain") ?? "";
        if (insertYoutube(editor, text)) return true;
        // Paste plain text only: foreign HTML, remote images and styles are discarded.
        if (text) editor.chain().focus().insertContent(text.replace(/\r\n/g, "\n").split("\n").map(line => ({ type: "paragraph", content: line ? [{ type: "text", text: line }] : [] }))).run();
        return true;
      },
      handleDrop: (view, event, _slice, moved) => {
        if (moved) return false;
        const file = Array.from(event.dataTransfer?.files ?? []).find(f => f.type.startsWith("image/"));
        if (!file || !editor) return false;
        const position = view.posAtCoords({ left: event.clientX, top: event.clientY });
        savedSelection.current = position ? { from: position.pos, to: position.pos } : null;
        void upload(editor, file);
        return true;
      },
      handleKeyDown: (_view, event) => {
        if (!editor || !["Enter", " "].includes(event.key) || event.isComposing) return false;
        const { $from, empty } = editor.state.selection;
        if (!empty || $from.parent.type.name !== "paragraph" || $from.parentOffset !== $from.parent.content.size) return false;
        return insertYoutube(editor, $from.parent.textContent, { from: $from.before(), to: $from.after() });
      },
    },
    onUpdate: ({ editor }) => {
      const doc = editor.getJSON();
      lastDocument.current = JSON.stringify(doc);
      const result = documentBody(doc);
      callbacks.current.onChange(result.description, result.blocks);
      if (result.description.length > LIMITS.descMax || result.blocks.length > LIMITS.bodyBlocksMax) setMessage("본문이 너무 길어요. 설명은 5,000자, 사진·영상 사이의 구간은 16개까지 저장할 수 있어요.");
      else setMessage("");
    },
  });

  useEffect(() => {
    if (!editor || uploading.current) return;
    const current = documentBody(editor.getJSON());
    if (rich && current.description === description && JSON.stringify(current.blocks) === JSON.stringify(blocks)) return;
    const doc = bodyDocument(description, blocks, rich);
    const key = JSON.stringify(doc);
    if (key === lastDocument.current) return;
    editor.commands.setContent(doc, { emitUpdate: false });
    lastDocument.current = key;
  }, [editor, description, blocks, rich]);

  return <div className="space-y-2">
    <div className="overflow-hidden rounded-xl border border-line bg-white focus-within:border-brand">
      <div className="flex items-center gap-2 border-b border-line bg-soft/50 px-3 py-2">
        <button type="button" disabled={!editor || busy} className="btn btn-outline btn-sm" onClick={() => { if (editor) savedSelection.current = { from: editor.state.selection.from, to: editor.state.selection.to }; input.current?.click(); }}>사진 첨부</button>
        <span className="text-xs text-muted">사진·유튜브 주소를 본문에 붙여넣으세요</span>
      </div>
      <EditorContent editor={editor} />
    </div>
    <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" tabIndex={-1} onChange={event => { const file = event.target.files?.[0]; if (editor && file) void upload(editor, file); }} />
    <p className="text-xs leading-relaxed text-muted">사진은 Ctrl+V·마우스 붙여넣기·드래그로 넣을 수 있어요. 유튜브 주소는 붙여넣거나 입력 후 Enter를 누르세요. 사진 최대 6장·장당 350KB, 영상 최대 3개.</p>
    {busy && <p role="status" className="text-sm text-muted">사진을 압축하고 업로드하는 중이에요…</p>}
    {(message || errors.bodyBlocks || Object.entries(errors).find(([key]) => /^(extra\.)?bodyBlocks/.test(key))?.[1]) && <p role="alert" className="text-sm text-brand-dark">{message || errors.bodyBlocks || Object.entries(errors).find(([key]) => /^(extra\.)?bodyBlocks/.test(key))?.[1]}</p>}
  </div>;
}
