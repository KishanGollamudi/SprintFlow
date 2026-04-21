// src/components/CohortTag.jsx
// Usage: <CohortTag cohort="Java cohort 1" />
// Shows full cohort name with deterministic color.
const COHORT_PALETTE = [
  { color: "#0d9488", bg: "rgba(13,148,136,0.1)",  bd: "rgba(13,148,136,0.25)" },
  { color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  bd: "rgba(245,158,11,0.25)" },
  { color: "#8b5cf6", bg: "rgba(139,92,246,0.1)",  bd: "rgba(139,92,246,0.25)" },
  { color: "#3b82f6", bg: "rgba(59,130,246,0.1)",  bd: "rgba(59,130,246,0.25)" },
  { color: "#ec4899", bg: "rgba(236,72,153,0.1)",  bd: "rgba(236,72,153,0.25)" },
  { color: "#059669", bg: "rgba(5,150,105,0.1)",   bd: "rgba(5,150,105,0.25)"  },
];

// Deterministic color from cohort string
function cohortPalette(cohort) {
  let hash = 0;
  for (let i = 0; i < cohort.length; i++) hash = cohort.charCodeAt(i) + ((hash << 5) - hash);
  return COHORT_PALETTE[Math.abs(hash) % COHORT_PALETTE.length];
}

export default function CohortTag({ cohort, style = {} }) {
  if (!cohort) return null;

  const palette = cohortPalette(cohort);

  return (
    <span
      title={cohort}
      style={{
        display: "inline-flex", alignItems: "center",
        background: palette.bg,
        color: palette.color,
        border: `1px solid ${palette.bd}`,
        fontSize: 11, fontWeight: 700,
        padding: "2px 8px", borderRadius: 20,
        cursor: "default", whiteSpace: "nowrap",
        transition: "all 0.15s",
        position: "relative",
        ...style,
      }}
    >
      {cohort}
    </span>
  );
}
