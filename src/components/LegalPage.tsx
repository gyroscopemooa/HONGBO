export function LegalPage({ title, updated, children }: { title: string; updated?: string; children: React.ReactNode }) {
  return (
    <div className="wrap max-w-[820px] py-8 sm:py-12">
      <h1 className="text-[28px] font-black tracking-[-0.045em] sm:text-[34px]">{title}</h1>
      {updated && <p className="mt-2 text-sm text-faint">시행일: {updated}</p>}
      <div className="legal mt-6 rounded-2xl border border-line bg-white p-5 shadow-card sm:p-8">{children}</div>
    </div>
  );
}
