'use client';

const strategies = [
  {
    id: 'TREND_PULLBACK',
    name: 'Trend Pullback Scalper',
    purpose: 'Join established directional structure after controlled retracement and renewed execution confirmation.',
  },
  {
    id: 'LIQUIDITY_SWEEP',
    name: 'Liquidity Sweep Reversal',
    purpose: 'Detect failed liquidity runs and structure change before considering a reversal.',
  },
  {
    id: 'BREAKOUT_RETEST',
    name: 'Breakout-Retest Scalper',
    purpose: 'Require expansion through structure followed by acceptable retest and execution evidence.',
  },
];

export default function StrategiesWorkspace() {
  return (
    <main style={{ padding: 12 }}>
      <h1 style={{ fontSize: 18, margin: 0 }}>STRATEGIES</h1>
      <p style={{ fontSize: 11, opacity: .65 }}>
        Strategy definitions used by ASURA competition. A strategy never bypasses Sentinel or Portfolio Governor.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 10, marginTop: 12 }}>
        {strategies.map((strategy) => (
          <section key={strategy.id} style={{ border: '1px solid var(--border,#d9e3dd)', background: 'var(--surface,#fff)', padding: 12, borderRadius: 5 }}>
            <small>{strategy.id}</small>
            <h3 style={{ margin: '6px 0', fontSize: 13 }}>{strategy.name}</h3>
            <p style={{ fontSize: 11, lineHeight: 1.5 }}>{strategy.purpose}</p>
            <div style={{ fontSize: 10, opacity: .65 }}>Runtime score and eligibility are shown in Strategy Lab when market evidence exists.</div>
          </section>
        ))}
      </div>
    </main>
  );
}
