// HR Module Theme — Sea Blue palette (#1d6fa4, #38bdf8)
export const H = {
  bg:        "#f0f6ff",
  bg2:       "#e4eef9",
  card:      "#ffffff",
  border:    "#c8daf0",
  accent:    "#1d6fa4",
  accentBg:  "rgba(29,111,164,0.07)",
  accentBd:  "rgba(29,111,164,0.2)",
  accentGlow:"0 4px 16px rgba(29,111,164,0.25)",
  stone:     "#38bdf8",
  gradient:  "linear-gradient(135deg,#1d6fa4 0%,#38bdf8 100%)",
  gradientR: "linear-gradient(135deg,#38bdf8 0%,#1d6fa4 100%)",
  text:      "#0c1e30",
  sub:       "#3d6080",
  muted:     "#7fa3c0",
  green:     "#10b981",
  greenBg:   "rgba(16,185,129,0.08)",
  greenBd:   "rgba(16,185,129,0.2)",
  amber:     "#f59e0b",
  amberBg:   "rgba(245,158,11,0.08)",
  amberBd:   "rgba(245,158,11,0.2)",
  red:       "#ef4444",
  redBg:     "rgba(239,68,68,0.08)",
  redBd:     "rgba(239,68,68,0.2)",
  purple:    "#8b5cf6",
  purpleBg:  "rgba(139,92,246,0.08)",
  shadow:    "0 1px 2px rgba(29,111,164,0.05), 0 4px 12px rgba(29,111,164,0.08)",
  shadowMd:  "0 4px 20px rgba(29,111,164,0.12)",
};

export const hInp = {
  background:   "#ffffff",
  border:       "1.5px solid #c8daf0",
  borderRadius: 10,
  color:        "#0c1e30",
  padding:      "9px 13px",
  fontSize:     13,
  outline:      "none",
  width:        "100%",
  boxSizing:    "border-box",
  fontFamily:   "inherit",
  transition:   "border-color 0.15s",
};

export const hSel = { ...hInp, height: 40, cursor: "pointer" };

export const hLbl = {
  color:         "#7fa3c0",
  fontSize:      11,
  fontWeight:    700,
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  display:       "block",
  marginBottom:  6,
};
