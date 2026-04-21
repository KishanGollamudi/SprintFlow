import { useState } from 'react';
import { motion } from 'framer-motion';
import { T } from '@/theme/trainer';
import { TECH_COLORS, heatmapColor, getCohortColor } from '@/constants/cohortConfig';

export default function AttendanceHeatmap({ data = {}, filterTech, filterCohort, allTechs = [], techCohorts = {} }) {
  const [tooltip, setTooltip] = useState(null);

  const techs = filterTech ? [filterTech] : allTechs;
  const allCohorts = [...new Set(Object.values(techCohorts).flat())];
  const cohorts = filterCohort ? [filterCohort] : allCohorts;

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            <th style={{ padding: '10px 16px', textAlign: 'left', color: T.muted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', width: 100 }}>
              Tech
            </th>
            {cohorts.map((c) => (
              <th key={c} style={{ padding: '10px 12px', textAlign: 'center', color: T.muted, fontSize: 11, fontWeight: 700, minWidth: 90 }}>
                <span
                  style={{ color: getCohortColor(c), cursor: 'default', borderBottom: `2px solid ${getCohortColor(c)}`, paddingBottom: 2 }}
                  title={c}
                >
                  {c}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {techs.map((tech, ti) => (
            <motion.tr key={tech}
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: ti * 0.06 }}
              style={{ borderTop: `1px solid ${T.border}` }}
            >
              <td style={{ padding: '12px 16px', fontWeight: 700, fontSize: 13, color: TECH_COLORS[tech] ?? T.text, whiteSpace: 'nowrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: TECH_COLORS[tech] ?? T.muted, flexShrink: 0 }} />
                  {tech}
                </div>
              </td>
              {cohorts.map((cohort) => {
                const belongs = (techCohorts[tech] ?? []).includes(cohort);
                const cell    = belongs ? (data[tech]?.[cohort] ?? null) : null;
                const colors  = heatmapColor(cell?.pct ?? null);

                if (!belongs) return (
                  <td key={cohort} style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{ color: '#d1d5db', fontSize: 16 }}>—</span>
                  </td>
                );

                return (
                  <td key={cohort} style={{ padding: '8px 12px', textAlign: 'center' }}>
                    <div
                      onMouseEnter={(e) => {
                        const r = e.currentTarget.getBoundingClientRect();
                        setTooltip({ tech, cohort, cell, x: r.left, y: r.top });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                      style={{
                        display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
                        justifyContent: 'center', width: 72, height: 52, borderRadius: 10,
                        background: cell ? colors.bg : '#f9fafb',
                        border: `1.5px solid ${cell ? colors.bg : T.border}`,
                        cursor: 'default', transition: 'transform 0.15s',
                      }}
                      onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.06)'}
                      onMouseOut={(e)  => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      {cell ? (
                        <>
                          <span style={{ fontSize: 15, fontWeight: 800, color: colors.text, lineHeight: 1 }}>{cell.pct}%</span>
                          <span style={{ fontSize: 10, color: colors.text, opacity: 0.7, marginTop: 2 }}>{cell.students ?? cell.present}/{cell.students ?? 0} st</span>
                        </>
                      ) : (
                        <span style={{ fontSize: 11, color: T.muted }}>No data</span>
                      )}
                    </div>
                  </td>
                );
              })}
            </motion.tr>
          ))}
        </tbody>
      </table>

      {/* Tooltip */}
      {tooltip?.cell && (
        <div style={{
          position: 'fixed', top: tooltip.y - 70, left: tooltip.x,
          background: '#1f2937', color: '#fff', borderRadius: 8,
          padding: '8px 12px', fontSize: 12, zIndex: 9999,
          pointerEvents: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.3)', whiteSpace: 'nowrap',
        }}>
          <p style={{ margin: 0, fontWeight: 700 }}>{tooltip.tech} · {tooltip.cohort}</p>
          <p style={{ margin: '2px 0 0', opacity: 0.85 }}>
            {tooltip.cell.pct}% · {tooltip.cell.students ?? 0} students · {tooltip.cell.present}P · {tooltip.cell.late ?? 0}L · {tooltip.cell.absent ?? 0}A
          </p>
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px 4px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: T.muted, fontWeight: 600 }}>Scale:</span>
        {[
          { label: '≥90%', bg: '#d1fae5', text: '#065f46' },
          { label: '75–89%', bg: '#a7f3d0', text: '#047857' },
          { label: '60–74%', bg: '#fef3c7', text: '#92400e' },
          { label: '<60%', bg: '#fee2e2', text: '#991b1b' },
        ].map((l) => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: l.bg }} />
            <span style={{ fontSize: 10, color: T.muted }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
