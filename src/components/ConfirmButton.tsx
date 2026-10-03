"use client";

import { cn } from "@/lib/utils";

/** 확인창을 거치는 제출 버튼 (관리자 삭제 등) */
export function ConfirmButton({
  message,
  children,
  className,
}: {
  message: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="submit"
      className={cn("btn btn-danger btn-sm", className)}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
