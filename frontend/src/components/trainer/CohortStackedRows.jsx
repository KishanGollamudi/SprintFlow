import { motion } from 'framer-motion';
import { T } from '@/theme/trainer';
import { TECH_COLORS, getCohortColor } from '@/constants/cohortConfig';

// data shape: { Java: { 'Java cohort 1': { pct, present, late, absent, total }, ... }, ... }
export default function CohortStackedRows({ data = {}, filterTech, filterCohort, allTechs = [], techCohorts = {} }) {
  const techs = filterTech ? [filterTech] : allTechs;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {techs.map((tech, ti) => {
        const cohorts     = techCohorts[tech] ?? [];
        const filtered    = filterCohort ? cohorts.filter((c) => c === filterCohort) : cohorts;
        const techColor   = TECH_COLORS[tech] ?? T.accent;
        const techTotal   = filtered.reduce((s, c) => s + (data[tech]?.[c]?.students ?? 0), 0);

        if (filtered.length === 0) return null;

        return (
          <motion.div key={tech}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: ti * 0.08 }}
            style={{ borderBottom: `1px solid ${T.border}` }}
          >
            {/* Tech header row */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 16px', background: `${techColor}10`,
              borderLeft: `3px solid ${techColor}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: techColor }} />
                <span style={{ fontWeight: 700, fontSize: 13, color: techColor }}>{tech}</span>
              </div>
              <span style={{ fontSize: 11, color: T.muted, fontWeight: 600 }}>
                {techTotal} students · {filtered.length} cohort{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Cohort rows */}
            {filtered.map((cohort, ci) => {
              const cell    = data[tech]?.[cohort];
              const pct     = cell?.pct     ?? 0;
              const present = cell?.present ?? 0;
              const late    = cell?.late    ?? 0;
              const absent  = cell?.absent  ?? 0;
              const students = cell?.students ?? 0;
              const color   = getCohortColor(cohort);

              return (
                <div key={cohort} style={{
                  display: 'grid',
                  gridTemplateColumns: '140px 1fr 60px 50px 50px 50px',
                  alignItems: 'center', gap: 12,
                  padding: '10px 16px 10px 28px',
                  borderTop: `1px solid ${T.border}`,
                  transition: 'background 0.12s',
                }}
                  onMouseEnter={(e) => e.currentTarget.style.background = T.bg}
                  onMouseLeave={(e) => e.currentTarget.style.background = ''}
                >
                  {/* Cohort name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: T.muted, fontSize: 12 }}>└─</span>
                    <span
                      style={{
                        background: `${color}18`, color, fontSize: 11, fontWeight: 700,
                        padding: '2px 8px', borderRadius: 20, border: `1px solid ${color}33`,
                        cursor: 'default',
                      }}
                      title={cohort}
                    >
                      {cohort}
                    </span>
                    <span style={{ fontSize: 10, color: T.muted }}>{students} students</span>
                  </div>

                  {/* Progress bar */}
                  <div style={{ height: 8, background: T.bg2, borderRadius: 99, overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: 0.3 + ci * 0.1, duration: 0.7, ease: 'easeOut' }}
                      style={{ height: '100%', background: color, borderRadius: 99 }}
                    />
                  </div>

                  {/* % */}
                  <span style={{ fontSize: 13, fontWeight: 800, color, textAlign: 'right' }}>{pct}%</span>

                  {/* Present */}
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#059669', textAlign: 'center' }}>{present}P</span>

                  {/* Late */}
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.amber, textAlign: 'center' }}>{late}L</span>

                  {/* Absent */}
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.red, textAlign: 'center' }}>{absent}A</span>
                </div>
              );
            })}
          </motion.div>
        );
      })}
    </div>
  );
}
