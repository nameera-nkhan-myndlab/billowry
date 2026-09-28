import React from 'react';

export interface MonthlyTotal {
  month: string;
  paid: number;
  outstanding: number;
}

const PAID = '#00D5D8';
const OUT = '#7C3AED';

function label(m: string): string {
  const [y, mo] = m.split('-').map(Number);
  if (!y || !mo) return m;
  return new Date(y, mo - 1, 1).toLocaleString('en-US', { month: 'short' });
}

export default function MonthlyTotalsChart({ data }: { data: MonthlyTotal[] }) {
  const rows = data ?? [];
  const max = Math.max(1, ...rows.map((r) => Math.max(r.paid, r.outstanding)));
  const W = 720;
  const H = 240;
  const pad = 28;
  const slot = rows.length ? (W - pad * 2) / rows.length : 0;
  const bw = Math.max(4, slot / 2 - 4);
  const ch = H - pad * 2;

  return (
    <section
      aria-label="Monthly paid and outstanding totals"
      style={{ background: 'var(--surface, #111827)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 20, margin: '20px 0', fontFamily: 'inherit' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ margin: 0, fontSize: 16 }}>Last 12 months</h2>
        <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: PAID, marginRight: 6 }} />Paid</span>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: OUT, marginRight: 6 }} />Outstanding</span>
        </div>
      </div>
      {rows.length === 0 ? (
        <p style={{ opacity: 0.7 }}>No data yet.</p>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Bar chart">
          <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="rgba(255,255,255,0.15)" />
          {rows.map((r, idx) => {
            const x = pad + idx * slot + (slot - bw * 2 - 2) / 2;
            const ph = (r.paid / max) * ch;
            const oh = (r.outstanding / max) * ch;
            return (
              <g key={r.month}>
                <rect x={x} y={H - pad - ph} width={bw} height={ph} rx={3} fill={PAID}>
                  <title>{`${r.month} paid: ${r.paid.toFixed(2)}`}</title>
                </rect>
                <rect x={x + bw + 2} y={H - pad - oh} width={bw} height={oh} rx={3} fill={OUT}>
                  <title>{`${r.month} outstanding: ${r.outstanding.toFixed(2)}`}</title>
                </rect>
                <text x={pad + idx * slot + slot / 2} y={H - 8} textAnchor="middle" fontSize={11} fill="currentColor" opacity={0.7}>
                  {label(r.month)}
                </text>
              </g>
            );
          })}
        </svg>
      )}
    </section>
  );
}
