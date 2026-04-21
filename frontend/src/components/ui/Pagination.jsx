import { ChevronLeft, ChevronRight } from 'lucide-react';

// theme: { accent, border, text, muted, card, bg } — pass null to use Tailwind mode
export default function Pagination({ page, totalPages, onChange, theme = null }) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  // Show at most 5 page buttons with ellipsis logic
  const visible = pages.filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
  );
  // Insert ellipsis markers
  const withEllipsis = [];
  visible.forEach((p, i) => {
    if (i > 0 && p - visible[i - 1] > 1) withEllipsis.push(`ellipsis-${p}`);
    withEllipsis.push(p);
  });

  if (theme) {
    // Inline-style mode (HR / Trainer modules)
    const btn = (disabled, onClick, children, active = false) => (
      <button
        onClick={onClick}
        disabled={disabled}
        style={{
          height: 32, minWidth: 32, paddingInline: 8,
          borderRadius: 8, fontSize: 13, fontWeight: active ? 700 : 500,
          border: `1.5px solid ${active ? theme.accent : theme.border}`,
          background: active ? theme.accent : theme.card,
          color: active ? '#fff' : disabled ? theme.muted : theme.text,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.45 : 1,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s',
        }}
      >
        {children}
      </button>
    );

    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 20 }}>
        {btn(page === 1, () => onChange(page - 1), <ChevronLeft size={14} />)}
        {withEllipsis.map((p) =>
          typeof p === 'string'
            ? <span key={p} style={{ color: theme.muted, fontSize: 13, paddingInline: 4 }}>…</span>
            : btn(false, () => onChange(p), p, p === page)
        )}
        {btn(page === totalPages, () => onChange(page + 1), <ChevronRight size={14} />)}
      </div>
    );
  }

  // Tailwind mode (Manager / Sprint modules)
  return (
    <div className="flex items-center justify-center gap-1.5 pt-5">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="h-8 w-8 rounded-lg border border-gray-200 bg-white text-gray-500 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:border-indigo-400 hover:text-indigo-600 transition-colors"
      >
        <ChevronLeft size={14} />
      </button>
      {withEllipsis.map((p) =>
        typeof p === 'string'
          ? <span key={p} className="text-gray-400 text-sm px-1">…</span>
          : (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={`h-8 min-w-8 px-2 rounded-lg border text-sm font-medium transition-colors ${
                p === page
                  ? 'border-indigo-500 bg-indigo-600 text-white font-bold'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-400 hover:text-indigo-600'
              }`}
            >
              {p}
            </button>
          )
      )}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className="h-8 w-8 rounded-lg border border-gray-200 bg-white text-gray-500 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:border-indigo-400 hover:text-indigo-600 transition-colors"
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
}
