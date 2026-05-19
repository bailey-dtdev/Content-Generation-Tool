/* global React, Icon, Btn, Shell, Chip */

const BY_CLIENT = [
  { name: 'Mainline Managed IT', val: 11.20 },
  { name: 'North Shore Plumbing', val: 8.42 },
  { name: 'Auria Accounting Co.', val: 5.91 },
  { name: 'Kuranda Coffee Roasters', val: 4.45 },
  { name: 'Forrest & Vale Legal', val: 3.78 },
  { name: 'Brightwater Dental', val: 2.88 },
  { name: 'Eastern Cardiology', val: 2.14 },
  { name: 'Sandstone Removals', val: 1.62 },
];

const BY_USER = [
  { email: 'sam.fielding@digitaltreasury.com.au', val: 14.18, role: 'Senior strategist' },
  { email: 'priya.menon@digitaltreasury.com.au', val: 11.93, role: 'Content lead' },
  { email: 'cal.ostrowski@digitaltreasury.com.au', val: 6.82, role: 'SEO specialist' },
  { email: 'rhea.lim@digitaltreasury.com.au', val: 4.55, role: 'Editor' },
  { email: 'jess.donnelly@digitaltreasury.com.au', val: 2.92, role: 'Editor' },
];

const initials2 = (s) => s.replace(/@.*/,'').split('.').map(w => w[0]).slice(0,2).join('').toUpperCase();

const UsageScreen = () => {
  const orgTotal = BY_USER.reduce((a, b) => a + b.val, 0);
  const userMax = Math.max(...BY_USER.map(u => u.val));
  const clientMax = Math.max(...BY_CLIENT.map(c => c.val));

  return (
    <Shell active="usage">
      <div className="main__head">
        <div className="page-head">
          <div>
            <div className="page-eyebrow">Workspace</div>
            <h1 className="page-title">Usage</h1>
            <p className="page-sub">Token spend across Content Studio · this billing month (May 1 — 19)</p>
          </div>
          <div className="page-actions">
            <div className="radio-seg">
              <button type="button">7d</button>
              <button type="button" className="is-active">Month</button>
              <button type="button">Quarter</button>
              <button type="button">All time</button>
            </div>
            <Btn variant="secondary" size="sm" icon="external">Export CSV</Btn>
          </div>
        </div>
      </div>

      <div className="main__body" style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        {/* Top: your spend + org spend */}
        <div className="usage-grid">
          <div className="usage-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="usage-card__h">Your spend · this month</div>
                <div className="usage-card__big">$14.18</div>
                <div className="usage-card__big-sub">2,147,892 input · 318,440 output tokens</div>
              </div>
              <Chip variant="ok" icon="check">+18% vs Apr</Chip>
            </div>
            <div className="usage-card__strip">
              <div style={{ flex: 1 }}>
                <div className="usage-card__metric-label">Generations</div>
                <div className="usage-card__metric-val">38</div>
              </div>
              <div style={{ flex: 1 }}>
                <div className="usage-card__metric-label">Avg per generation</div>
                <div className="usage-card__metric-val">$0.373</div>
              </div>
              <div style={{ flex: 1 }}>
                <div className="usage-card__metric-label">QA pass rate</div>
                <div className="usage-card__metric-val">86%</div>
              </div>
              <div style={{ flex: 1 }}>
                <div className="usage-card__metric-label">Exports</div>
                <div className="usage-card__metric-val">31</div>
              </div>
            </div>
          </div>

          <div className="usage-card usage-card--dark">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="usage-card__h">Organisation · this month</div>
                <div className="usage-card__big">${orgTotal.toFixed(2)}</div>
                <div className="usage-card__big-sub">Across 5 users · 120 generations</div>
              </div>
              <span style={{ background: 'var(--aqua)', color: 'var(--aqua-ink)', fontSize: 10.5, fontWeight: 700, padding: '4px 10px', borderRadius: 999, letterSpacing: '0.06em' }}>$50 budget</span>
            </div>
            {/* monthly progress */}
            <div style={{ marginTop: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-6)', marginBottom: 6 }}>
                <span>Used ${orgTotal.toFixed(2)}</span>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{Math.round(orgTotal/50*100)}%</span>
              </div>
              <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, orgTotal/50*100)}%`, height: '100%', background: 'var(--aqua)', borderRadius: 4 }} />
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-6)', marginTop: 8 }}>$9.60 remaining · resets June 1</div>
            </div>
          </div>
        </div>

        {/* Trend strip */}
        <div className="card">
          <div className="card__head">
            <div>
              <div className="card__title">Daily spend</div>
              <div className="card__sub">May 1 — 19 · all users combined</div>
            </div>
            <Chip variant="outline" icon="bar-chart">Peak Tue May 14 · $5.42</Chip>
          </div>
          <div style={{ height: 140, display: 'flex', alignItems: 'flex-end', gap: 6, padding: '8px 0' }}>
            {[1.8,2.4,3.1,1.6,0.8,0.2,0.1, 2.9,3.8,4.2,3.5,4.1,1.4,0.3, 3.8,4.6,5.4,3.9,2.6].map((v, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ width: '100%', background: i === 16 ? 'var(--aqua)' : 'var(--ink-2)', height: `${v/5.4*100}%`, minHeight: 3, borderRadius: 3 }} />
                <div style={{ fontSize: 10, color: 'var(--ink-5)', fontVariantNumeric: 'tabular-nums' }}>{i+1}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="card">
            <div className="card__head">
              <div>
                <div className="card__title">By client</div>
                <div className="card__sub">{BY_CLIENT.length} clients with activity this month</div>
              </div>
              <button type="button" className="btn btn--ghost btn--sm">View all <Icon name="arrow-right" size={13} /></button>
            </div>
            <div>
              {BY_CLIENT.map((c, i) => (
                <div key={c.name}>
                  <div className="usage-bar-row">
                    <span className="usage-bar-row__rank">{String(i+1).padStart(2,'0')}</span>
                    <span className="usage-bar-row__name">
                      <span className="swatch">{c.name.split(' ').map(w => w[0]).slice(0,2).join('')}</span>
                      {c.name}
                    </span>
                    <span className="usage-bar-row__val">${c.val.toFixed(2)}</span>
                  </div>
                  <div className="usage-bar-row__bar" style={{ marginBottom: 0 }}>
                    <div style={{ width: `${c.val/clientMax*100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card__head">
              <div>
                <div className="card__title">By user</div>
                <div className="card__sub">{BY_USER.length} active members</div>
              </div>
              <button type="button" className="btn btn--ghost btn--sm">Invite <Icon name="plus" size={13} /></button>
            </div>
            <div>
              {BY_USER.map((u, i) => (
                <div key={u.email}>
                  <div className="usage-bar-row">
                    <span className="usage-bar-row__rank">{String(i+1).padStart(2,'0')}</span>
                    <span className="usage-bar-row__name">
                      <span className="swatch" style={{ background: 'var(--ink-2)' }}>{initials2(u.email)}</span>
                      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <span style={{ fontSize: 12.5, color: 'var(--ink-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</span>
                        <span style={{ fontSize: 10.5, color: 'var(--ink-5)' }}>{u.role}</span>
                      </div>
                    </span>
                    <span className="usage-bar-row__val">${u.val.toFixed(2)}</span>
                  </div>
                  <div className="usage-bar-row__bar" style={{ marginBottom: 0 }}>
                    <div style={{ width: `${u.val/userMax*100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
};

Object.assign(window, { UsageScreen });
