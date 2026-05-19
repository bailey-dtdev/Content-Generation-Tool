/* global React */
// Shared components — Sidebar shell, Stepper, Icon, primitives.

const Icon = ({ name, size = 16, stroke = 1.75, className = '' }) => {
  // Lucide-style icons rendered inline so we don't depend on the runtime
  const paths = {
    'users': <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    'sparkles': <><path d="M12 3l1.9 4.3L18 9l-4.1 1.7L12 15l-1.9-4.3L6 9l4.1-1.7z"/><path d="M19 14l.9 2L22 17l-2.1.7-.9 2-.9-2L16 17l2.1-1z"/><path d="M5 17l.6 1.4L7 19l-1.4.6L5 21l-.6-1.4L3 19l1.4-.6z"/></>,
    'bar-chart': <><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></>,
    'list': <><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>,
    'file-text': <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></>,
    'plus': <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    'check': <><polyline points="20 6 9 17 4 12"/></>,
    'chevron-right': <><polyline points="9 18 15 12 9 6"/></>,
    'chevron-down': <><polyline points="6 9 12 15 18 9"/></>,
    'arrow-right': <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
    'arrow-up-right': <><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></>,
    'trash': <><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></>,
    'edit': <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
    'log-out': <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    'search': <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    'settings': <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
    'grip': <><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></>,
    'bold': <><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></>,
    'italic': <><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></>,
    'underline': <><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/><line x1="4" y1="21" x2="20" y2="21"/></>,
    'link': <><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></>,
    'list-ul': <><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>,
    'list-ol': <><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></>,
    'play': <><polygon points="5 3 19 12 5 21 5 3"/></>,
    'refresh': <><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"/><path d="M20.49 15A9 9 0 0 1 5.64 18.36L1 14"/></>,
    'send': <><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>,
    'external': <><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></>,
    'google-docs': <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/><line x1="8" y1="9" x2="10" y2="9"/></>,
    'alert': <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>,
    'info': <><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>,
    'upload': <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>,
    'globe': <><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>,
    'sliders': <><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></>,
    'help': <><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
    'x': <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/></>,
    'dollar': <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>,
    'circle-dot': <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3" fill="currentColor"/></>,
    'circle-empty': <><circle cx="12" cy="12" r="10"/></>,
  };
  const p = paths[name];
  if (!p) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" className={className}>
      {p}
    </svg>
  );
};

const GoogleG = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" fill="#34A853"/>
    <path d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.95l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.65l3.15-3.15C17.45 2.12 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.29 9.14 5.38 12 5.38z" fill="#EA4335"/>
  </svg>
);

/* ─────────── Sidebar shell ─────────── */
const Sidebar = ({ active = 'clients', clientCount = 12, userEmail = 'sam.fielding@digitaltreasury.com.au', userName = 'Sam Fielding', onNav, onSignOut }) => {
  const nav = [
    { key: 'clients', label: 'Clients', icon: 'users', count: clientCount },
    { key: 'new-generation', label: 'New generation', icon: 'sparkles' },
    { key: 'usage', label: 'Usage', icon: 'bar-chart' },
  ];
  return (
    <aside className="side">
      <div className="side__brand">
        <img src="assets/logo.svg" alt="Digital Treasury" />
      </div>
      <div className="side__product">Content Studio</div>
      <div className="side__group">
        <div className="side__label">Workspace</div>
        {nav.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`side__item ${active === item.key ? 'is-active' : ''}`}
            onClick={() => onNav && onNav(item.key)}
          >
            <Icon name={item.icon} />
            <span>{item.label}</span>
            {item.count !== undefined ? <span className="side__count">{item.count}</span> : null}
          </button>
        ))}
      </div>

      <div className="side__group">
        <div className="side__label">Recent generations</div>
        <button type="button" className="side__item">
          <Icon name="file-text" />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Hot water systems</span>
        </button>
        <button type="button" className="side__item">
          <Icon name="file-text" />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Tax depreciation</span>
        </button>
        <button type="button" className="side__item">
          <Icon name="file-text" />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Managed IT pricing</span>
        </button>
      </div>

      <div className="side__foot">
        <div className="side__user">
          <div className="side__avatar">{(userName || '').split(' ').map(s => s[0]).slice(0,2).join('')}</div>
          <div className="side__user-meta">
            <div className="side__user-name">{userName}</div>
            <div className="side__user-email">{userEmail}</div>
          </div>
        </div>
        <button type="button" className="side__signout" onClick={onSignOut}>
          <Icon name="log-out" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
};

/* ─────────── Wizard stepper ─────────── */
const Stepper = ({ current = 0 }) => {
  // current: 0 = input, 1 = outline, 2 = content
  const steps = [
    { label: 'Input', num: 1 },
    { label: 'Outline', num: 2 },
    { label: 'Content', num: 3 },
  ];
  return (
    <div className="stepper">
      {steps.map((step, idx) => {
        const state = idx < current ? 'is-done' : idx === current ? 'is-current' : '';
        return (
          <React.Fragment key={step.label}>
            <div className={`stepper__step ${state}`}>
              <div className="stepper__num">
                {idx < current ? <Icon name="check" size={11} stroke={3} /> : step.num}
              </div>
              <span className="stepper__label">{step.label}</span>
            </div>
            {idx < steps.length - 1 ? (
              <div className="stepper__sep"><Icon name="chevron-right" size={14} stroke={2} /></div>
            ) : null}
          </React.Fragment>
        );
      })}
    </div>
  );
};

/* ─────────── Primitives ─────────── */
const Btn = ({ variant = 'secondary', size, icon, iconRight, children, onClick, disabled, className = '' }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`btn btn--${variant} ${size ? `btn--${size}` : ''} ${className}`}
  >
    {icon ? <Icon name={icon} /> : null}
    {children}
    {iconRight ? <Icon name={iconRight} /> : null}
  </button>
);

const Field = ({ label, hint, required, children, error }) => (
  <div className="field">
    <label className="field__label">
      <span>{label}</span>
      {required ? <span className="field__req">*</span> : null}
      {hint ? <span className="field__hint">{hint}</span> : null}
    </label>
    {children}
    {error ? <div style={{ fontSize: 11.5, color: 'var(--status-danger)' }}>{error}</div> : null}
  </div>
);

const Chip = ({ variant = '', children, icon, dot }) => (
  <span className={`chip ${variant ? 'chip--' + variant : ''}`}>
    {dot ? <span className="chip__dot" /> : null}
    {icon ? <Icon name={icon} size={12} /> : null}
    {children}
  </span>
);

const Toggle = ({ on, label }) => (
  <div className={`toggle ${on ? 'is-on' : ''}`}>
    <div className="toggle__track"><div className="toggle__thumb" /></div>
    {label ? <span className="toggle__label">{label}</span> : null}
  </div>
);

const Cost = ({ total = '0.0142', outline = '0.0021', content = '0.0089', qa = '0.0032' }) => (
  <div className="cost">
    <span className="cost__label">Cost</span>
    <span className="cost__total">${total}</span>
    <span className="cost__pill"><span className="cost__pill-label">Outline</span><span className="cost__pill-val">${outline}</span></span>
    <span className="cost__pill"><span className="cost__pill-label">Content</span><span className="cost__pill-val">${content}</span></span>
    <span className="cost__pill"><span className="cost__pill-label">QA</span><span className="cost__pill-val">${qa}</span></span>
  </div>
);

/* ─────────── App shell wrapper ─────────── */
const Shell = ({ active, children, density = 'comfortable', workspace = 'light', onNav }) => (
  <div className={`app density-${density} workspace-${workspace}`}>
    <Sidebar active={active} onNav={onNav} />
    <main className={`main ${density === 'compact' ? 'main--compact' : ''}`}>
      {children}
    </main>
  </div>
);

Object.assign(window, { Icon, GoogleG, Sidebar, Stepper, Btn, Field, Chip, Toggle, Cost, Shell });
