/* global React, Icon, Btn, Shell, Chip, Stepper, Cost */
// Content Workspace — the centerpiece. Multiple states on one screen prop.

const PROSE = {
  intro: (
    <>
      <p>When a <strong>hot water system</strong> stops behaving, it almost always does it on a Tuesday morning, fifteen minutes before someone has to be somewhere. We've seen it for forty-two years on the North Shore — the same surprises, the same shower stand-offs, the same calls. This page is the short version of what we tell every homeowner who rings us at 7am: what's likely going on, what it'll cost to find out, and when you should be reaching for a quote rather than a repair.</p>
      <p>You don't need to diagnose the unit yourself. You do need to know enough to ask the right questions. We've kept the language plain and the recommendations specific. If you'd rather skip to talking to a plumber, our team is <a href="#">fully licensed and insured</a> and operates seven days across the North Shore.</p>
    </>
  ),
  signs: (
    <>
      <h3>The four signs we hear most</h3>
      <p>The vast majority of call-outs we see fall into one of a handful of patterns. None of them are dramatic on day one. They get worse if you ignore them.</p>
      <ul>
        <li><strong>Lukewarm taps</strong> — water that used to be hot is now tepid, even after you've let it run. Usually a failing heating element or a thermostat that's drifted out of calibration.</li>
        <li><strong>Rust-coloured water</strong> from the hot tap only — almost always sediment build-up in the tank, or in older units, internal corrosion starting to show.</li>
        <li><strong>Hammering or knocking</strong> when the unit kicks on — sediment again, or in some cases a pressure-relief valve that's begun to fail.</li>
        <li><strong>The unit short-cycles</strong> — switches on, off, on, off — without producing meaningful hot water at the tap. This is the one that gets ignored the longest, and shouldn't be.</li>
      </ul>
      <p>If you're seeing two or more of these at once, the unit isn't going to fix itself. Get it looked at before it picks its own moment.</p>
    </>
  ),
  causes: (
    <>
      <h3>What's actually wrong, most of the time</h3>
      <p>About eighty per cent of the repairs we do are one of five things. We're listing them in order of how often they come up, not severity.</p>
      <ul>
        <li><strong>Sediment build-up.</strong> Sydney water isn't kind to tanks. Sediment insulates the heating element from the water it's meant to heat, which means the element runs longer, burns hotter, and eventually fails. A flush will buy you years.</li>
        <li><strong>A failed heating element.</strong> Electric units. Symptoms: lukewarm water, breaker tripping, longer recovery time after a shower. Cheap part, fast job.</li>
        <li><strong>Thermostat drift.</strong> Both gas and electric. The unit thinks it's set to 60°C; it's actually delivering at 48°C. Easy to test, easy to fix.</li>
        <li><strong>Anode rod end-of-life.</strong> The anode is the sacrificial part that corrodes <em>instead of</em> your tank. If it's gone, the tank is next.</li>
        <li><strong>Pilot light issues</strong> — gas units only. Thermocouple failure, draft problems, or just a dirty pilot assembly.</li>
      </ul>
    </>
  ),
  decision: '',
  // (the rest are placeholders for variety)
};

const SECTIONS = [
  { id: 's1', num: 1, heading: 'What a faulty hot water system looks like', words: 218 },
  { id: 's2', num: 2, heading: 'Common causes we see across Sydney', words: 287 },
  { id: 's3', num: 3, heading: 'Repair, refurbish, or replace?', words: 196 },
  { id: 's4', num: 4, heading: 'Brands and systems we service', words: 142 },
  { id: 's5', num: 5, heading: 'What an emergency call-out looks like', words: 178 },
  { id: 's6', num: 6, heading: 'Why 42 years on the North Shore matters', words: 152 },
  { id: 's7', num: 7, heading: 'Frequently asked questions', words: 264 },
];

const QA_NOTES = [
  { sec: 's2', sev: 'error', cat: 'Banned word', msg: 'Section uses "leverage" in paragraph 2 — it\'s on the banned list. Suggested replacement: "use".' },
  { sec: 's3', sev: 'error', cat: 'E-E-A-T missing', msg: 'No author credentials, licence number, or association mentioned in this section. E-E-A-T target requires one.' },
  { sec: 's6', sev: 'warning', cat: 'Reading level', msg: 'Grade 11.2 — exceeds target of Grade 8. Two sentences are over 32 words.' },
  { sec: 's7', sev: 'warning', cat: 'Internal links', msg: 'Only 1 internal link in 264 words. Target is 2–3 per section.' },
  { sec: 's1', sev: 'warning', cat: 'Keyword usage', msg: 'Primary keyword "hot water system repair" appears 0 times. Target is 1–2 in the first section.' },
  { sec: 's4', sev: 'info', cat: 'Approved phrase', msg: '"Fully licensed and insured" not used yet. It\'s an approved phrase — consider working it in.' },
  { sec: 's5', sev: 'info', cat: 'Tone', msg: 'Two adjacent sentences start with "We". Mild repetition — optional.' },
  { sec: 's7', sev: 'info', cat: 'Schema', msg: 'FAQ section is structured correctly for FAQPage schema. No action needed.' },
];

const EditorToolbar = () => (
  <div className="editor-toolbar">
    <select className="editor-toolbar__select" defaultValue="p">
      <option value="h1">Heading 1</option>
      <option value="h2">Heading 2</option>
      <option value="h3">Heading 3</option>
      <option value="h4">Heading 4</option>
      <option value="p">Paragraph</option>
    </select>
    <div className="editor-toolbar__sep" />
    <button type="button"><Icon name="bold" size={14} /></button>
    <button type="button"><Icon name="italic" size={14} /></button>
    <button type="button"><Icon name="underline" size={14} /></button>
    <div className="editor-toolbar__sep" />
    <button type="button"><Icon name="list-ul" size={14} /></button>
    <button type="button"><Icon name="list-ol" size={14} /></button>
    <div className="editor-toolbar__sep" />
    <button type="button"><Icon name="link" size={14} /></button>
    <div style={{ flex: 1 }} />
    <span style={{ fontSize: 11, color: 'var(--ink-5)', fontVariantNumeric: 'tabular-nums' }}>218 words</span>
  </div>
);

const SectionCard = ({ section, status = 'done', body, qaNotes = [], showQAInline = true, isStreaming = false, isError = false }) => {
  return (
    <div className="section-card">
      <div className="section-card__head">
        <div className="section-card__h-left">
          <div className="section-card__num">{section.num}</div>
          <div>
            <div className="section-card__h">{section.heading}</div>
            <div className="section-card__meta">
              <span><strong>{section.words || 0}</strong> words</span>
              <span>·</span>
              <span>H2</span>
              {qaNotes.length ? <><span>·</span><span style={{ color: 'var(--ink-2)', fontWeight: 600 }}>{qaNotes.length} QA note{qaNotes.length > 1 ? 's' : ''}</span></> : null}
            </div>
          </div>
        </div>
        <div className={`section-status section-status--${status === 'streaming' ? 'streaming' : status === 'queued' ? 'queued' : status === 'error' ? 'error' : 'done'}`}>
          <span className="section-status__pulse" />
          <span>{status === 'streaming' ? 'Streaming' : status === 'queued' ? 'Queued' : status === 'error' ? 'Failed' : 'Done'}</span>
        </div>
      </div>

      {isError ? (
        <div style={{ padding: '18px 24px', display: 'flex', gap: 14, alignItems: 'flex-start', background: 'rgba(198,56,56,0.04)' }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(198,56,56,0.12)', color: 'var(--status-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}><Icon name="alert" size={15} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-1)', marginBottom: 4 }}>Section generation failed</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.5, marginBottom: 10 }}>The model returned an empty response after 2 retries. Likely an upstream timeout — your other sections were unaffected.</div>
            <Btn variant="secondary" size="sm" icon="refresh">Retry section</Btn>
          </div>
        </div>
      ) : status === 'queued' ? (
        <div style={{ padding: '24px 26px', fontSize: 13, color: 'var(--ink-5)', fontStyle: 'italic' }}>Waiting for previous section…</div>
      ) : (
        <>
          {!isStreaming ? <EditorToolbar /> : null}
          <div className="prose">
            {body}
            {isStreaming ? <span className="caret" /> : null}
          </div>
        </>
      )}

      {showQAInline && qaNotes.length > 0 ? (
        <div className="section-qa">
          {qaNotes.map((n, i) => (
            <div key={i} className={`section-qa__row sev-${n.sev}`}>
              <div className={`section-qa__sev-bar sev-${n.sev}`} />
              <div style={{ flex: 1 }}>
                <div className="section-qa__cat">{n.sev} · {n.cat}</div>
                <div className="section-qa__msg">{n.msg}</div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

const QARail = ({ notes = [], state = 'idle', position = 'right' }) => {
  if (state === 'running') {
    return (
      <div className="qa-rail">
        <div className="qa-rail__head">
          <div className="qa-rail__title">QA</div>
          <Chip variant="aqua" dot>Running</Chip>
        </div>
        <div style={{ padding: 24 }}>
          {['Banned words', 'Reading level', 'E-E-A-T signals', 'Internal links', 'Keyword usage', 'Schema markup'].map((label, i) => {
            const done = i < 3;
            const running = i === 3;
            return (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: i < 5 ? '1px solid var(--ink-8)' : '0', fontSize: 12.5 }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', border: `1.5px solid var(${done ? '--status-success' : running ? '--aqua' : '--ink-7'})`, background: done ? 'var(--status-success)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
                  {done ? <Icon name="check" size={11} stroke={3} className="" /> : null}
                </div>
                <span style={{ color: done ? 'var(--ink-3)' : 'var(--ink-1)', fontWeight: done ? 500 : 600, flex: 1 }}>{label}</span>
                {running ? <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--ink-1)', textTransform: 'uppercase' }}>…</span> : null}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  if (notes.length === 0) {
    return (
      <div className="qa-rail">
        <div className="qa-rail__head">
          <div className="qa-rail__title">QA</div>
          <Chip variant="info">Not run</Chip>
        </div>
        <div className="qa-rail__empty">
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--ink-8)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: 'var(--ink-4)' }}>
            <Icon name="check" size={20} stroke={2} />
          </div>
          <div style={{ fontWeight: 600, color: 'var(--ink-2)', marginBottom: 4 }}>No QA notes yet</div>
          <div>Run QA once the content is generated to surface banned words, reading level, E-E-A-T and link issues.</div>
        </div>
      </div>
    );
  }
  const counts = notes.reduce((acc, n) => { acc[n.sev] = (acc[n.sev] || 0) + 1; return acc; }, {});
  return (
    <div className="qa-rail">
      <div className="qa-rail__head">
        <div>
          <div className="qa-rail__title">QA</div>
          <div className="qa-rail__count">{notes.length} notes · sorted worst-first</div>
        </div>
        <Chip variant="ok" icon="check">Passed 6/8</Chip>
      </div>
      <div className="qa-rail__filters">
        <button type="button" className="qa-rail__filter is-active">All <span style={{ opacity: 0.6 }}>{notes.length}</span></button>
        <button type="button" className="qa-rail__filter"><span className="sev-dot sev-dot--error" />Errors <span style={{ opacity: 0.6 }}>{counts.error || 0}</span></button>
        <button type="button" className="qa-rail__filter"><span className="sev-dot sev-dot--warning" />Warnings <span style={{ opacity: 0.6 }}>{counts.warning || 0}</span></button>
        <button type="button" className="qa-rail__filter"><span className="sev-dot sev-dot--info" />Info <span style={{ opacity: 0.6 }}>{counts.info || 0}</span></button>
      </div>
      <div className="qa-rail__list">
        {notes.map((n, i) => (
          <div key={i} className="qa-rail__item">
            <div className="qa-rail__item-head">
              <span className={`qa-rail__sev sev-${n.sev}`}>{n.sev}</span>
              <span className="qa-rail__cat">{n.cat}</span>
            </div>
            <div className="qa-rail__msg">{n.msg}</div>
            <div className="qa-rail__loc"><Icon name="chevron-right" size={11} />Section {SECTIONS.find(s => s.id === n.sec)?.num} — {SECTIONS.find(s => s.id === n.sec)?.heading}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ContentWorkspaceScreen = ({ state = 'editable', density = 'comfortable', workspace = 'light', qaPosition = 'right' }) => {
  // states: empty | streaming | editable | qa-running | qa-results | exported | section-error
  const showQARail = qaPosition === 'right';
  const isExporting = state === 'exporting';
  const isExported = state === 'exported';
  const hasContent = state !== 'empty';

  const sectionStates = (() => {
    if (state === 'empty') return [];
    if (state === 'streaming') {
      return SECTIONS.map((s, i) => {
        if (i < 2) return { ...s, status: 'done', body: i === 0 ? PROSE.intro : PROSE.signs };
        if (i === 2) return { ...s, status: 'streaming', body: PROSE.causes, isStreaming: true, words: 142 };
        return { ...s, status: 'queued', words: 0 };
      });
    }
    if (state === 'section-error') {
      return SECTIONS.map((s, i) => {
        if (i === 0) return { ...s, status: 'done', body: PROSE.intro };
        if (i === 1) return { ...s, status: 'error', isError: true, words: 0 };
        if (i === 2) return { ...s, status: 'done', body: PROSE.causes };
        return { ...s, status: 'done', body: <p className="placeholder">[Section body — drafted, scroll to view]</p>, words: s.words };
      });
    }
    // editable / qa-running / qa-results / exporting / exported
    return SECTIONS.map((s, i) => {
      const body = i === 0 ? PROSE.intro
        : i === 1 ? PROSE.signs
        : i === 2 ? PROSE.causes
        : <p className="placeholder">[Section body — drafted, scroll to view]</p>;
      return { ...s, status: 'done', body };
    });
  })();

  const notesFor = (sid) => state === 'qa-results' ? QA_NOTES.filter(n => n.sec === sid) : [];
  const allNotes = state === 'qa-results' ? QA_NOTES : [];

  return (
    <Shell active="new-generation" density={density} workspace={workspace}>
      <div className="main__head">
        <div style={{ fontSize: 12, color: 'var(--ink-5)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>Generations</span>
          <Icon name="chevron-right" size={12} />
          <span>North Shore Plumbing</span>
          <Icon name="chevron-right" size={12} />
          <span style={{ color: 'var(--ink-2)', fontWeight: 600 }}>Hot water system repair</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <h1 className="page-title">Content</h1>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 8, fontSize: 12.5, color: 'var(--ink-4)', flexWrap: 'wrap' }}>
              <Chip variant="dark">Service page</Chip>
              <Chip variant="outline">Commercial intent</Chip>
              <Chip variant="outline">1,000 words target</Chip>
              <span style={{ color: 'var(--ink-5)' }}>·</span>
              <span><strong style={{ color: 'var(--ink-2)' }}>hot water system repair sydney</strong></span>
            </div>
          </div>
          <Stepper current={2} />
        </div>
      </div>

      <div className="main__body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Control bar */}
        <div className="control-bar">
          <div className="control-bar__group">
            <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--ink-5)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Mode</span>
            <div className="radio-seg">
              <button type="button" className="is-active"><Icon name="list" size={13} />Sequential</button>
              <button type="button"><Icon name="send" size={13} />Single call</button>
            </div>
          </div>
          <div className="control-bar__sep" />
          <div className="control-bar__group">
            <Btn variant="primary" size="sm" icon={state === 'streaming' ? 'circle-dot' : 'sparkles'} disabled={state === 'streaming'}>
              {state === 'streaming' ? 'Generating…' : hasContent ? 'Regenerate' : 'Generate content'}
            </Btn>
            <Btn variant="secondary" size="sm" icon={state === 'qa-running' ? 'circle-dot' : 'check'} disabled={!hasContent || state === 'streaming' || state === 'qa-running'}>
              {state === 'qa-running' ? 'Running QA…' : 'Run QA'}
            </Btn>
            <Btn variant="secondary" size="sm" icon={isExporting ? 'circle-dot' : 'google-docs'} disabled={!hasContent || state === 'streaming'}>
              {isExporting ? 'Exporting…' : 'Export to Docs'}
            </Btn>
          </div>
          <div className="control-bar__spacer" />
          <Cost total={state === 'empty' ? '0.0000' : state === 'qa-results' || isExported ? '0.0427' : state === 'streaming' ? '0.0186' : '0.0395'}
                outline="0.0034"
                content={state === 'empty' ? '0.0000' : state === 'streaming' ? '0.0152' : '0.0361'}
                qa={state === 'qa-results' || isExported ? '0.0032' : '0.0000'}
          />
        </div>

        {isExported ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: 'var(--aqua-soft)', border: '1px solid var(--aqua)', borderRadius: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--ink-10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}><Icon name="check" size={16} stroke={2.5} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--aqua-ink)' }}>Exported to Google Docs · 2 minutes ago</div>
              <div style={{ fontSize: 12, color: 'var(--aqua-ink)', opacity: 0.75 }}><strong>NS Plumbing — Hot water system repair (v1)</strong> · saved to Content Studio shared drive</div>
            </div>
            <Btn variant="primary" size="sm" iconRight="external">Open the Google Doc</Btn>
          </div>
        ) : null}

        {state === 'streaming' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', background: 'var(--ink-1)', borderRadius: 12, color: 'var(--ink-10)' }}>
            <span className="section-status__pulse" style={{ width: 10, height: 10 }} />
            <div style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>Streaming section 3 of 7 · <strong>"Common causes we see across Sydney"</strong></div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-6)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span>~38 sec elapsed</span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>647 / 1,000 words</span>
            </div>
            <Btn variant="ghost" size="sm" className="" >Cancel</Btn>
          </div>
        ) : null}

        <div className={`ws ${qaPosition !== 'right' ? 'ws--qa-bottom' : ''}`}>
          <div className="ws__main">
            {state === 'empty' ? (
              <div className="empty" style={{ padding: '90px 24px' }}>
                <div className="empty__icon"><Icon name="sparkles" size={26} stroke={1.5} /></div>
                <div className="empty__h">Ready to generate</div>
                <div className="empty__p">7 approved sections · 1,000 words target. Sequential mode will stream each section in turn so you can spot drift early.</div>
                <Btn variant="primary" size="lg" icon="sparkles">Generate content</Btn>
                <div style={{ fontSize: 11.5, color: 'var(--ink-5)', marginTop: 4 }}>Est. 90-120 seconds · $0.024 - $0.038</div>
              </div>
            ) : (
              sectionStates.map((s) => (
                <SectionCard
                  key={s.id}
                  section={s}
                  status={s.status}
                  body={s.body}
                  isStreaming={s.isStreaming}
                  isError={s.isError}
                  qaNotes={notesFor(s.id)}
                  showQAInline
                />
              ))
            )}

            {state === 'qa-results' ? (
              <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(22,163,122,0.10)', color: 'var(--status-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}><Icon name="check" size={16} stroke={2.5} /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700 }}>QA complete · 8 notes across 7 sections</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-4)' }}>2 errors block export · address those first, then regenerate or edit in place</div>
                </div>
                <Btn variant="secondary" size="sm" icon="refresh">Re-run QA</Btn>
              </div>
            ) : null}
          </div>

          {showQARail && state !== 'empty' ? (
            <div className="ws__qa">
              <QARail
                notes={state === 'qa-results' ? allNotes : []}
                state={state === 'qa-running' ? 'running' : 'idle'}
              />
            </div>
          ) : null}
        </div>
      </div>
    </Shell>
  );
};

Object.assign(window, { ContentWorkspaceScreen, QARail, SectionCard });
