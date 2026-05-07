// Shared UI primitives matching shadcn/ui semantics

// ── Icons ───────────────────────────────────────────
const Icon = {
  Package: (p) => (<svg width={p.size||18} height={p.size||18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8 12 13 3 8"/><path d="M3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8z"/></svg>),
  Truck: (p) => (<svg width={p.size||18} height={p.size||18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>),
  Banknote: (p) => (<svg width={p.size||18} height={p.size||18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>),
  Plus: (p) => (<svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5v14"/></svg>),
  Check: (p) => (<svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>),
  X: (p) => (<svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l18 12" transform="scale(0.667)"/></svg>),
  Bike: (p) => (<svg width={p.size||18} height={p.size||18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>),
  Image: (p) => (<svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>),
  Alert: (p) => (<svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4M12 17h.01"/><circle cx="12" cy="12" r="10"/></svg>),
  Lock: (p) => (<svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>),
  Search: (p) => (<svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-4.3-4.3"/></svg>),
};

// ── Helpers ─────────────────────────────────────────
const ARS = (n) => '$ ' + n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d) => d; // already pre-formatted strings
const truncId = (s, n=14) => s.length > n ? s.slice(0, n) + '…' : s;

// ── Primitives ──────────────────────────────────────
const Button = ({variant='default', size='default', children, className='', ...rest}) => (
  <button className={`btn btn-${variant} ${size!=='default'?'btn-'+size:''} ${className}`} {...rest}>{children}</button>
);
const Badge = ({variant='default', children, className=''}) => (
  <span className={`badge badge-${variant} ${className}`}>{children}</span>
);
const Card = ({children, className='', style}) => <div className={`card ${className}`} style={style}>{children}</div>;
const CardHeader = ({children, className=''}) => <div className={`card-header ${className}`}>{children}</div>;
const CardContent = ({children, className=''}) => <div className={`card-content ${className}`}>{children}</div>;
const CardTitle = ({children, className=''}) => <div className={`card-title ${className}`}>{children}</div>;
const CardDescription = ({children, className=''}) => <div className={`card-description ${className}`}>{children}</div>;
const Separator = () => <hr className="separator" />;
const Skeleton = ({w='100%', h=12, className='', style}) => <div className={`skeleton ${className}`} style={{width: w, height: h, ...style}} />;
const Label = ({children, required}) => <label className="label">{children} {required && <span className="req">*</span>}</label>;
const Input = (props) => <input className="input" {...props} />;
const Textarea = (props) => <textarea className="textarea" {...props} />;
const Select = ({value, children}) => <button type="button" className="select-trigger">{value || children}</button>;

// ── Status maps ─────────────────────────────────────
const fulfillmentBadge = (s) => {
  const m = {
    pending:       ['secondary',   'Pendiente'],
    accepted:      ['default',     'Aceptado'],
    preparing:     ['default',     'Preparando'],
    ready_to_ship: ['default',     'Listo para envío'],
    handed_over:   ['outline',     'Despachado'],
    delivered:     ['outline',     'Entregado'],
    rejected:      ['destructive', 'Rechazado'],
    cancelled:     ['destructive', 'Cancelado'],
  };
  const [v, l] = m[s];
  return <Badge variant={v}>{l}</Badge>;
};

const productBadge = (s) => {
  const m = {
    active:   ['default',     'Activo'],
    draft:    ['secondary',   'Borrador'],
    paused:   ['outline',     'Pausado'],
    archived: ['destructive', 'Archivado'],
  };
  const [v, l] = m[s];
  return <Badge variant={v}>{l}</Badge>;
};

const settlementBadge = (s) => {
  const m = {
    pending:       ['secondary',   'Pendiente'],
    paid:          ['default',     'Liquidado'],
    failed:        ['destructive', 'Fallido'],
    manual_review: ['outline',     'Revisión manual'],
  };
  const [v, l] = m[s];
  return <Badge variant={v}>{l}</Badge>;
};

// Bike thumbnail SVG (variety by hue)
const BikeThumb = ({hue=168, size=64}) => (
  <div className="bike-thumb-svg" style={{width: size, height: size, background: `oklch(0.92 0.04 ${hue})`}}>
    <svg width={size*0.7} height={size*0.7} viewBox="0 0 24 24" fill="none" stroke={`oklch(0.4 0.12 ${hue})`} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/>
      <circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/>
    </svg>
  </div>
);

Object.assign(window, {
  Icon, ARS, fmtDate, truncId,
  Button, Badge, Card, CardHeader, CardContent, CardTitle, CardDescription,
  Separator, Skeleton, Label, Input, Textarea, Select,
  fulfillmentBadge, productBadge, settlementBadge, BikeThumb,
});
