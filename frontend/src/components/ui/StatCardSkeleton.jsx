/**
 * Reusable loading skeleton for stat card grids.
 * Shows pulsing placeholder cards while data loads.
 */
const StatCardSkeleton = ({ count = 4, cardBg = "#ffffff", borderColor = "#e5e7eb" }) => (
  <div style={{
    display: "grid",
    gridTemplateColumns: `repeat(auto-fit, minmax(200px, 1fr))`,
    gap: 14,
  }}>
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        style={{
          borderRadius: 16,
          padding: "20px 20px 16px",
          background: cardBg,
          border: `1.5px solid ${borderColor}`,
          animation: "pulse 1.5s ease-in-out infinite",
        }}
      >
        <div style={{ width: "60%", height: 10, borderRadius: 6, background: borderColor, marginBottom: 12 }} />
        <div style={{ width: "40%", height: 32, borderRadius: 8, background: borderColor, marginBottom: 8 }} />
        <div style={{ width: "80%", height: 8, borderRadius: 6, background: borderColor }} />
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
      </div>
    ))}
  </div>
);

export default StatCardSkeleton;
