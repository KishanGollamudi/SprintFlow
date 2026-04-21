import { motion } from "framer-motion";

/**
 * Reusable stat/KPI card used across all dashboards.
 *
 * Props:
 *   title       — string label shown above the value
 *   value       — number or string to display large
 *   sub         — small subtitle below the value (optional)
 *   icon        — lucide icon component
 *   iconColor   — icon + value color
 *   iconBg      — icon container background
 *   gradient    — top accent bar gradient
 *   glow        — hover box-shadow color
 *   index       — stagger delay index
 *   delay       — base delay offset (default 0)
 *   variant     — "gradient-top" (default) | "hover-fill"
 *   hoverGradient — gradient used when variant="hover-fill" and card is hovered
 *   cardBg      — card background (default white)
 *   cardBorder  — card border color
 *   textColor   — primary text color
 *   mutedColor  — muted text color
 */
const StatCard = ({
  title,
  value,
  sub,
  icon: Icon,
  iconColor,
  iconBg,
  gradient,
  glow,
  index = 0,
  delay = 0,
  variant = "gradient-top",
  hoverGradient,
  cardBg = "#ffffff",
  cardBorder = "#cceeec",
  textColor = "#0f2827",
  mutedColor = "#7fb5b2",
}) => {
  const isHoverFill = variant === "hover-fill";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={
        isHoverFill
          ? undefined
          : { y: -5, boxShadow: `0 16px 40px ${glow}` }
      }
      transition={{ delay: delay + index * 0.08, duration: 0.35 }}
      onMouseEnter={
        isHoverFill
          ? (e) => {
              e.currentTarget.style.background = hoverGradient ?? gradient;
              e.currentTarget.style.borderColor = iconColor;
            }
          : undefined
      }
      onMouseLeave={
        isHoverFill
          ? (e) => {
              e.currentTarget.style.background = cardBg;
              e.currentTarget.style.borderColor = cardBorder;
            }
          : undefined
      }
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 16,
        padding: "20px 20px 16px",
        background: cardBg,
        border: `1.5px solid ${cardBorder}`,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)",
        transition: "background 0.28s, border-color 0.28s, box-shadow 0.28s",
        cursor: "default",
      }}
    >
      {/* Top accent bar */}
      {gradient && (
        <div
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0,
            height: 3,
            background: gradient,
            borderRadius: "16px 16px 0 0",
          }}
        />
      )}

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <p style={{
            color: mutedColor, fontSize: 11, fontWeight: 700,
            textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8,
          }}>
            {title}
          </p>
          <motion.p
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: delay + index * 0.08 + 0.3, type: "spring", stiffness: 200 }}
            style={{ color: textColor, fontSize: 34, fontWeight: 800, lineHeight: 1, marginBottom: 4 }}
          >
            {value}
          </motion.p>
          {sub && (
            <p style={{ color: mutedColor, fontSize: 11, margin: 0 }}>{sub}</p>
          )}
        </div>

        {Icon && (
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: iconBg,
            border: `1.5px solid ${cardBorder}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <Icon size={19} style={{ color: iconColor }} />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default StatCard;
