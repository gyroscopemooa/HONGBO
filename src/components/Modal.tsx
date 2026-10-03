"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";

/** 네이티브 <dialog> 기반 모달 (포커스 트랩/ESC 닫기 기본 제공) */
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="m-auto w-[min(92vw,460px)] rounded-2xl border-0 bg-white p-0 shadow-pop backdrop:bg-black/40 backdrop:backdrop-blur-[2px]"
    >
      <div className="p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-extrabold tracking-[-0.03em]">{title}</h2>
          <button type="button" onClick={onClose} aria-label="닫기" className="flex size-8 items-center justify-center rounded-full text-muted hover:bg-soft">
            <X size={18} aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
