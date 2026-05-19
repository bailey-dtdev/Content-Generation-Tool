/* global React, Icon, Btn, Shell, Chip, Field, Toggle */
// Client screens — list (populated / empty / loading) + edit (new / existing with sitemap)

const CLIENTS = [
  { name: 'North Shore Plumbing', industry: 'Trades & home services', generations: 24, last: '2 hours ago', spend: '$8.42' },
  { name: 'Auria Accounting Co.', industry: 'Professional services', generations: 18, last: 'Yesterday', spend: '$5.91' },
  { name: 'Forrest & Vale Legal', industry: 'Legal', generations: 11, last: '2 days ago', spend: '$3.78' },
  { name: 'Mainline Managed IT', industry: 'IT services', generations: 32, last: '3 days ago', spend: '$11.20' },
  { name: 'Eastern Cardiology', industry: 'Healthcare', generations: 7, last: 'Last week', spend: '$2.14' },
  { name: 'Brightwater Dental', industry: 'Healthcare', generations: 9, last: 'Last week', spend: '$2.88' },
  { name: 'Sandstone Removals', industry: 'Trades & home services', generations: 5, last: '2 weeks ago', spend: '$1.62' },
  { name: 'Kuranda Coffee Roasters', industry: 'F&B retail', generations: 14, last: '2 weeks ago', spend: '$4.45' },
];

const initials = (s) => s.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase();

const ClientListScreen = ({ state = 'populated' }) => (
  <Shell active="clients">
    <div className="main__head">
      <div className="page-head">
        <div>
          <div className="page-eyebrow">Workspace</div>
          <h1 className="page-title">Clients</h1>
          <p className="page-sub">{state === 'populated' ? `${CLIENTS.length} clients · 120 generations this month` : 'Add your first client to start generating content.'}</p>
        </div>
        <div className="page-actions">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--ink-10)', border: '1px solid var(--ink-7)', borderRadius: 999, padding: '7px 12px', width: 280 }}>
            <Icon name="search" size={14} />
            <input className="input" style={{ border: 0, background: 'transparent', padding: 0, fontSize: 13 }} placeholder="Search clients…" />
          </div>
          <Btn variant="primary" icon="plus">New client</Btn>
        </div>
      </div>
    </div>

    <div className="main__body">
      {state === 'empty' ? (
        <div className="empty">
          <div className="empty__icon"><Icon name="users" size={26} stroke={1.5} /></div>
          <div className="empty__h">No clients yet</div>
          <div className="empty__p">Clients hold the voice, audience and sitemap that Content Studio uses to write SEO content. Add your first to get started.</div>
          <Btn variant="primary" icon="plus">New client</Btn>
        </div>
      ) : state === 'loading' ? (
        <div className="client-list">
          <div className="client-list__head">
            <div>Client</div>
            <div>Industry</div>
            <div style={{ textAlign: 'right' }}>Total spend</div>
            <div></div>
          </div>
          {[1,2,3,4,5].map(i => <div key={i} className="loading-row" />)}
        </div>
      ) : (
        <div className="client-list">
          <div className="client-list__head">
            <div>Client</div>
            <div>Industry</div>
            <div style={{ textAlign: 'right' }}>Total spend</div>
            <div></div>
          </div>
          {CLIENTS.map((c, i) => (
            <div key={i} className="client-row">
              <div className="client-row__name">
                <div className="client-row__avatar">{initials(c.name)}</div>
                <div>
                  <div>{c.name}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-5)', fontWeight: 500, marginTop: 2 }}>{c.generations} generations · {c.last}</div>
                </div>
              </div>
              <div className="client-row__industry">{c.industry}</div>
              <div className="client-row__spend">{c.spend}</div>
              <div className="client-row__actions">
                <button type="button" className="icon-btn" title="Edit"><Icon name="edit" size={14} /></button>
                <button type="button" className="icon-btn icon-btn--danger" title="Delete"><Icon name="trash" size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </Shell>
);

const ClientEditScreen = ({ mode = 'new' }) => {
  const isEdit = mode === 'edit';
  return (
    <Shell active="clients">
      <div className="main__head">
        <div style={{ fontSize: 12, color: 'var(--ink-5)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>Clients</span>
          <Icon name="chevron-right" size={12} />
          <span style={{ color: 'var(--ink-2)', fontWeight: 600 }}>{isEdit ? 'North Shore Plumbing' : 'New client'}</span>
        </div>
        <div className="page-head">
          <div>
            <h1 className="page-title">{isEdit ? 'North Shore Plumbing' : 'New client'}</h1>
            {isEdit ? (
              <div style={{ display: 'flex', gap: 14, marginTop: 8, alignItems: 'center', fontSize: 12.5, color: 'var(--ink-4)' }}>
                <Chip variant="outline" icon="dollar">$8.42 lifetime spend</Chip>
                <span>·</span>
                <span>24 generations</span>
                <span>·</span>
                <span>Created Mar 2026</span>
              </div>
            ) : (
              <p className="page-sub">Set up the client's voice, audience and sitemap so generations are on-brand.</p>
            )}
          </div>
          <div className="page-actions">
            <Btn variant="ghost">Cancel</Btn>
            <Btn variant="primary" icon="check">Save client</Btn>
          </div>
        </div>
      </div>

      <div className="main__body" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Identity */}
          <div className="card">
            <div className="card__head">
              <div>
                <div className="card__title">Identity</div>
                <div className="card__sub">Name, industry, and where their site lives.</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Name" required>
                <input className="input" defaultValue={isEdit ? 'North Shore Plumbing' : ''} placeholder="e.g. Auria Accounting Co." />
              </Field>
              <Field label="Industry">
                <input className="input" defaultValue={isEdit ? 'Trades & home services' : ''} placeholder="e.g. Healthcare" />
              </Field>
              <Field label="Website URL" hint="Used for E-E-A-T and internal links">
                <input className="input" defaultValue={isEdit ? 'https://northshoreplumbing.com.au' : ''} placeholder="https://example.com.au" />
              </Field>
              <Field label="Language variant">
                <select className="select" defaultValue="au">
                  <option value="au">Australian English</option>
                  <option value="us">US English</option>
                  <option value="uk">UK English</option>
                </select>
              </Field>
            </div>
          </div>

          {/* Voice */}
          <div className="card">
            <div className="card__head">
              <div>
                <div className="card__title">Voice & audience</div>
                <div className="card__sub">Anchors the model's tone and reading-level decisions.</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Field label="Brand voice" hint="3-5 sentences">
                <textarea className="textarea" rows={4} defaultValue={isEdit ? 'Trusted local trade. Plain-spoken but technically precise — the homeowner should feel informed, not patronised. Avoid hype, avoid jargon, lead with experience and reliability.' : ''} placeholder="Describe how the brand should sound…" />
              </Field>
              <Field label="Audience">
                <textarea className="textarea" rows={3} defaultValue={isEdit ? 'North Shore homeowners 35-65 dealing with everyday plumbing problems. Decision-makers in their own household. Will compare 2-3 providers before booking.' : ''} placeholder="Who the content is for…" />
              </Field>
              <Field label="E-E-A-T signals" hint="Experience, expertise, authority, trust">
                <textarea className="textarea" rows={3} defaultValue={isEdit ? '42 years operating on the North Shore. Master plumber license #L-22845. Member of Master Plumbers Association NSW. 4.9★ across 380 Google reviews.' : ''} placeholder="Certifications, tenure, awards…" />
              </Field>
            </div>
          </div>

          {/* Style rules */}
          <div className="card">
            <div className="card__head">
              <div>
                <div className="card__title">Style rules</div>
                <div className="card__sub">Hard constraints applied during generation and QA.</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Reading level target">
                <select className="select" defaultValue="8">
                  <option value="6">Grade 6 — very accessible</option>
                  <option value="8">Grade 8 — general public</option>
                  <option value="10">Grade 10 — informed reader</option>
                  <option value="12">Grade 12+ — technical</option>
                </select>
              </Field>
              <Field label="Sentence length">
                <select className="select" defaultValue="mixed">
                  <option value="none">No preference</option>
                  <option value="short">Short</option>
                  <option value="mixed">Mixed</option>
                  <option value="longer">Longer</option>
                </select>
              </Field>
              <Field label="Banned words" hint="One per line">
                <textarea className="textarea" rows={4} defaultValue={isEdit ? 'leverage\nsynergy\ngame-changer\nworld-class\nrobust\nseamlessly' : ''} placeholder="leverage\nsynergy\n…" />
              </Field>
              <Field label="Approved phrases" hint="One per line">
                <textarea className="textarea" rows={4} defaultValue={isEdit ? 'fully licensed and insured\n42 years on the North Shore\nfree, no-obligation quote' : ''} placeholder="signature phrases that should appear" />
              </Field>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--ink-8)' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Oxford comma</div>
                <div style={{ fontSize: 12, color: 'var(--ink-4)', marginTop: 2 }}>Apply consistently across all sections.</div>
              </div>
              <Toggle on />
            </div>
          </div>

          {/* Sitemap — only on edit */}
          {isEdit ? (
            <div className="card">
              <div className="card__head">
                <div>
                  <div className="card__title">Sitemap</div>
                  <div className="card__sub">Feeds the internal-link picker during outline & content.</div>
                </div>
                <Chip variant="ok" icon="check">128 URLs from upload</Chip>
              </div>
              <div className="dropzone">
                <div className="dropzone__icon"><Icon name="upload" size={20} /></div>
                <div style={{ flex: 1 }}>
                  <div className="dropzone__t">Upload sitemap.xml</div>
                  <div className="dropzone__p">Drag &amp; drop or click to browse. Replaces the existing list.</div>
                </div>
                <Btn variant="secondary" size="sm">Choose file</Btn>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0 10px' }}>
                <div style={{ flex: 1, height: 1, background: 'var(--ink-8)' }} />
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-5)' }}>or paste URLs</span>
                <div style={{ flex: 1, height: 1, background: 'var(--ink-8)' }} />
              </div>
              <Field label="Paste URLs" hint="One per line">
                <textarea className="textarea" rows={4} defaultValue={'https://northshoreplumbing.com.au/services/hot-water\nhttps://northshoreplumbing.com.au/services/blocked-drains\nhttps://northshoreplumbing.com.au/services/gas-fitting\n…'} />
              </Field>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                <Btn variant="secondary" size="sm" icon="refresh">Replace URL list</Btn>
              </div>
            </div>
          ) : null}
        </div>

        {/* Side rail — preview/help */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 16 }}>
          <div className="card" style={{ padding: 18 }}>
            <div className="page-eyebrow" style={{ marginBottom: 8 }}>Preview</div>
            <div style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--ink-2)' }}>
              "We've been keeping <span className="dt-highlight">North Shore</span> homes flowing for 42 years."
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-5)', marginTop: 12, lineHeight: 1.5 }}>
              Sample paragraph the model would produce given this voice. Aqua highlight is a brand convention, not editorial.
            </div>
          </div>

          <div className="card" style={{ padding: 18 }}>
            <div className="page-eyebrow" style={{ marginBottom: 8 }}>QA rules applied</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12.5, color: 'var(--ink-3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="check" size={13} /> Banned words → <strong style={{ color: 'var(--ink-1)' }}>6</strong></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="check" size={13} /> Approved phrases → <strong style={{ color: 'var(--ink-1)' }}>3</strong></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="check" size={13} /> Reading level → <strong style={{ color: 'var(--ink-1)' }}>Grade 8</strong></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="check" size={13} /> Oxford comma → <strong style={{ color: 'var(--ink-1)' }}>on</strong></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="check" size={13} /> AU English → <strong style={{ color: 'var(--ink-1)' }}>on</strong></div>
            </div>
          </div>
        </aside>
      </div>
    </Shell>
  );
};

Object.assign(window, { ClientListScreen, ClientEditScreen });
