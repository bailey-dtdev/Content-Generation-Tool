/* global React, Icon, Btn, Shell, Chip, Field, Stepper */
// New Generation form + Outline Review (pre-gen, generated, error)

const GenerationHead = ({ step = 0, title }) => (
  <div className="main__head">
    <div style={{ fontSize: 12, color: 'var(--ink-5)', display: 'flex', alignItems: 'center', gap: 6 }}>
      <span>Generations</span>
      <Icon name="chevron-right" size={12} />
      <span style={{ color: 'var(--ink-2)', fontWeight: 600 }}>{title}</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
      <div>
        <h1 className="page-title">{title}</h1>
        <p className="page-sub">
          {step === 0 ? "Tell Content Studio what to write. We'll pull competitors and sitemap matches next."
            : step === 1 ? 'Review the section plan before we generate the full content.'
            : 'Streaming content section by section. QA runs after.'}
        </p>
      </div>
      <Stepper current={step} />
    </div>
  </div>
);

const NewGenerationScreen = () => (
  <Shell active="new-generation">
    <GenerationHead step={0} title="New generation" />
    <div className="main__body" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="card">
          <div className="card__head">
            <div>
              <div className="card__title">Subject</div>
              <div className="card__sub">Who this is for and what we're writing.</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Client" required>
              <select className="select" defaultValue="ns">
                <option value="">Select a client…</option>
                <option value="ns">North Shore Plumbing</option>
                <option value="au">Auria Accounting Co.</option>
                <option value="fl">Forrest &amp; Vale Legal</option>
              </select>
            </Field>
            <Field label="Content type">
              <select className="select" defaultValue="service">
                <option value="service">Service page</option>
                <option value="plp">Product listing page</option>
                <option value="pdp">Product detail page</option>
                <option value="blog">Blog post</option>
              </select>
            </Field>
            <Field label="Primary keyword" required>
              <input className="input" defaultValue="hot water system repair sydney" />
            </Field>
            <Field label="Search intent">
              <select className="select" defaultValue="commercial">
                <option value="info">Informational</option>
                <option value="commercial">Commercial</option>
                <option value="transactional">Transactional</option>
                <option value="navigational">Navigational</option>
              </select>
            </Field>
            <Field label="Target URL" hint="Optional — for refreshes">
              <input className="input" placeholder="https://northshoreplumbing.com.au/services/hot-water" />
            </Field>
            <Field label="Target word count">
              <input className="input" type="number" defaultValue={1000} />
            </Field>
          </div>
        </div>

        <div className="card">
          <div className="card__head">
            <div>
              <div className="card__title">Research inputs</div>
              <div className="card__sub">Competitors and supporting keywords. We'll fetch what we can.</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="Secondary keywords" hint="One per line">
              <textarea className="textarea" rows={4} defaultValue={'emergency hot water repair\nrheem hot water system\nelectric vs gas hot water\nhot water system not working'} />
            </Field>
            <Field label="Competitor URLs" hint="One per line · we'll analyse up to 8">
              <textarea className="textarea" rows={4} defaultValue={'https://competitor-one.com.au/hot-water-repair\nhttps://competitor-two.com.au/services/hot-water\nhttps://competitor-three.com.au/sydney/hot-water-systems\nhttps://competitor-four.com.au/hot-water'} />
            </Field>
            <Field label="Additional context" hint="Anything specific for this piece">
              <textarea className="textarea" rows={3} placeholder="Promotions, seasonal angles, specific objections to address…" />
            </Field>
          </div>
        </div>
      </div>

      <aside style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 16 }}>
        <div className="card" style={{ padding: 20 }}>
          <div className="page-eyebrow" style={{ marginBottom: 12 }}>Client snapshot</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--ink-1)', color: 'var(--ink-10)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>NS</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>North Shore Plumbing</div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-5)' }}>Trades · 128 URLs in sitemap</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="kv"><span className="kv__k">Language</span><span className="kv__v">AU English</span></div>
            <div className="kv"><span className="kv__k">Reading level</span><span className="kv__v">Grade 8</span></div>
            <div className="kv"><span className="kv__k">Sentence length</span><span className="kv__v">Mixed</span></div>
            <div className="kv"><span className="kv__k">Banned words</span><span className="kv__v">6</span></div>
            <div className="kv"><span className="kv__k">Oxford comma</span><span className="kv__v">On</span></div>
          </div>
        </div>

        <div className="card" style={{ padding: 20, background: 'var(--ink-1)', color: 'var(--ink-10)', borderColor: 'var(--ink-1)' }}>
          <div className="page-eyebrow" style={{ color: 'var(--ink-5)', marginBottom: 8 }}>Estimated cost</div>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>$0.034 – $0.052</div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-6)', marginTop: 6, lineHeight: 1.5 }}>
            Based on 1,000 words, 4 competitor fetches and a single QA pass.
          </div>
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.14)', display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--ink-6)' }}>Outline</span><span style={{ fontVariantNumeric: 'tabular-nums' }}>~$0.004</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--ink-6)' }}>Content</span><span style={{ fontVariantNumeric: 'tabular-nums' }}>~$0.024</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--ink-6)' }}>QA</span><span style={{ fontVariantNumeric: 'tabular-nums' }}>~$0.006</span></div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Btn variant="primary" size="lg" iconRight="arrow-right">Start generation</Btn>
          <div style={{ fontSize: 11.5, color: 'var(--ink-5)', textAlign: 'center' }}>Next: outline review</div>
        </div>
      </aside>
    </div>
  </Shell>
);

/* ─────────── Outline Review ─────────── */
const OUTLINE = [
  { h: 'What a faulty hot water system looks like', b: 'Symptoms a North Shore homeowner can recognise — lukewarm taps, rust-coloured water, the unit cycling on and off — and which point to repair vs replacement.' },
  { h: 'Common causes we see across Sydney', b: 'Sediment build-up, failing heating elements, thermostat drift, pilot light issues for gas units. Two paragraphs, plain language.' },
  { h: 'Repair, refurbish, or replace?', b: 'A decision framework keyed on age of unit, brand, and repair cost vs replacement. Mention 10-year heuristic.' },
  { h: 'Brands and systems we service', b: 'Rheem, Rinnai, Vulcan, Aquamax, Bosch — with one-line capability notes. Internal link to /brands.' },
  { h: 'What an emergency call-out looks like', b: 'Response time on the North Shore, after-hours availability, what we bring in the van, payment options.' },
  { h: 'Why 42 years on the North Shore matters', b: 'E-E-A-T paragraph — licences, association membership, review counts. Approved phrase: "fully licensed and insured".' },
  { h: 'Frequently asked questions', b: '5-6 short Q&A pairs hitting "how much does it cost", "do you do same-day", "warranty", "rebates", "gas vs electric".' },
];

const ResearchPanel = () => (
  <div className="research">
    <div className="research__stat">
      <div className="research__label">Competitors analysed</div>
      <div className="research__val">4<span className="research__val-sub">of 5 submitted</span></div>
      <div className="research__detail is-warn">1 page failed to fetch · view details</div>
    </div>
    <div className="research__stat">
      <div className="research__label">Internal links picked</div>
      <div className="research__val">12<span className="research__val-sub">from 128 sitemap URLs</span></div>
      <div className="research__detail">Ranked by topical match to "hot water system repair"</div>
    </div>
    <div className="research__stat">
      <div className="research__label">SERP themes</div>
      <div className="research__val">7<span className="research__val-sub">recurring sections</span></div>
      <div className="research__detail">Cost, brands, FAQ, emergency, signs, repair vs replace, warranty</div>
    </div>
  </div>
);

const OutlineScreen = ({ state = 'generated' }) => (
  <Shell active="new-generation">
    <GenerationHead step={1} title="Outline review" />
    <div className="main__body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <ResearchPanel />

      {state === 'pre' ? (
        <div className="empty">
          <div className="empty__icon"><Icon name="sparkles" size={26} stroke={1.5} /></div>
          <div className="empty__h">Ready to draft the outline</div>
          <div className="empty__p">Content Studio will read the 4 competitor pages and pick 12 internal links, then propose a section plan you can edit.</div>
          <Btn variant="primary" size="lg" icon="sparkles">Generate outline</Btn>
        </div>
      ) : state === 'error' ? (
        <>
          <div style={{ display: 'flex', gap: 14, background: 'rgba(198,56,56,0.05)', border: '1px solid rgba(198,56,56,0.25)', borderRadius: 12, padding: '16px 18px' }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--status-danger)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}><Icon name="alert" size={16} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 4 }}>Can't start — you have another generation in progress</div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.5, marginBottom: 10 }}>
                You're streaming content for <strong>"managed IT pricing"</strong> in another tab. Only one generation can run at a time per user — finish or cancel that one to continue here.
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn variant="primary" size="sm" iconRight="external">Open the active generation</Btn>
                <Btn variant="ghost" size="sm">Discard the other &amp; retry</Btn>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
            <div>
              <div className="card__title" style={{ fontSize: 16 }}>Proposed sections</div>
              <div className="card__sub" style={{ marginTop: 4 }}>Drag to reorder · click any field to edit · {OUTLINE.length} sections, ~1,050 words target</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn variant="secondary" size="sm" icon="plus">Add section</Btn>
              <Btn variant="secondary" size="sm" icon="refresh">Regenerate</Btn>
            </div>
          </div>

          <div className="outline-list">
            {OUTLINE.map((s, i) => (
              <div key={i} className="outline-card">
                <div className="outline-card__grip"><Icon name="grip" size={16} /></div>
                <div className="outline-card__num">{i + 1}</div>
                <div className="outline-card__body">
                  <input className="outline-card__h" defaultValue={s.h} />
                  <textarea className="outline-card__b" rows={2} defaultValue={s.b} />
                </div>
                <div className="outline-card__actions">
                  <button type="button" className="icon-btn" title="Duplicate"><Icon name="plus" size={14} /></button>
                  <button type="button" className="icon-btn icon-btn--danger" title="Remove"><Icon name="trash" size={14} /></button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: 'var(--ink-10)', border: '1px solid var(--ink-7)', borderRadius: 14, position: 'sticky', bottom: 16, boxShadow: 'var(--shadow-2)' }}>
            <div style={{ fontSize: 12, color: 'var(--ink-4)', display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--aqua)' }} />Unsaved edits</span>
              <span>Last saved 2 min ago</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn variant="ghost">Save edits</Btn>
              <Btn variant="primary" iconRight="arrow-right">Approve &amp; continue</Btn>
            </div>
          </div>
        </>
      )}
    </div>
  </Shell>
);

Object.assign(window, { NewGenerationScreen, OutlineScreen });
