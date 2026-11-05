/** 페이지 이동 즉시 보여주는 뼈대 화면 — 서버 응답을 기다리는 동안 멈춘 것처럼 보이지 않게 합니다. */
export default function Loading() {
  return (
    <div className="wrap animate-pulse py-6" aria-busy="true" aria-label="불러오는 중">
      <div className="h-[200px] rounded-2xl bg-soft sm:h-[260px]" />
      <div className="mt-6 h-6 w-40 rounded bg-soft" />
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="aspect-[4/3] rounded-2xl bg-soft" />
        ))}
      </div>
    </div>
  );
}
