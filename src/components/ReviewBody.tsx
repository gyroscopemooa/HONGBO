import { splitBody } from "@/lib/reviews";

/** 후기 본문: 줄바꿈을 유지하고, 안전한 http(s) 주소만 클릭 가능한 링크로 바꿉니다. */
export function ReviewBody({ body }: { body: string }) {
  return (
    <div className="whitespace-pre-wrap break-words text-[15.5px] leading-[1.75] text-ink-2">
      {splitBody(body).map((p, i) =>
        p.type === "link" ? (
          <a key={i} href={p.url} target="_blank" rel="nofollow ugc noopener noreferrer" className="break-all font-medium text-brand underline underline-offset-2">
            {p.text}
          </a>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </div>
  );
}
