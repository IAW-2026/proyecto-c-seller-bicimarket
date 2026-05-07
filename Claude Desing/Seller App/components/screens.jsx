// Landing, Sign-in, Sign-up, Suspended, Toasts
const Landing = ({mobile=false}) => (
  <div className={`bici-root ${mobile?'mobile':''}`} style={{minHeight: '100%', display: 'flex', flexDirection: 'column'}}>
    <header className="header-bar">
      <div className="header-inner">
        <div className="brand">
          <div className="brand-mark"><Icon.Bike size={16}/></div>
          <span>BiciMarket Vendedor</span>
        </div>
        <Button variant="outline" size="sm">Ingresar</Button>
      </div>
    </header>
    <div style={{flex: 1}}>
      <section className="hero">
        <h1>Vendé tus bicicletas en BiciMarket</h1>
        <p className="lead">Gestioná tu catálogo, pedidos y liquidaciones en un solo lugar.</p>
        <div className="ctas">
          <Button size="lg">Crear cuenta de vendedor</Button>
          <a className="text-sm" style={{color: 'var(--primary)', textDecoration: 'none', fontWeight: 500}}>Ya tengo cuenta → Ingresar</a>
        </div>
      </section>
      <div style={{maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem 4rem'}}>
        <div className={mobile?'grid-cards':'grid-cards'} style={mobile?{gridTemplateColumns: '1fr'}:{gridTemplateColumns: 'repeat(3, 1fr)'}}>
          {[
            {icon: <Icon.Package size={20}/>, title: 'Catálogo sin límites', body: 'Publicá bicicletas, repuestos y accesorios. Toda publicación activa tiene disponibilidad ilimitada.'},
            {icon: <Icon.Truck size={20}/>, title: 'Logística integrada', body: 'Generá envíos y etiquetas automáticamente cuando marcás un pedido como listo.'},
            {icon: <Icon.Banknote size={20}/>, title: 'Liquidaciones automáticas', body: 'Recibís el pago neto tras la entrega confirmada, descontando solo la comisión del marketplace.'},
          ].map((f, i) => (
            <Card key={i}><CardContent style={{paddingTop: '1.5rem', paddingBottom: '1.5rem'}}>
              <div className="feature-icon">{f.icon}</div>
              <CardTitle>{f.title}</CardTitle>
              <div className="text-sm text-muted" style={{marginTop: 6}}>{f.body}</div>
            </CardContent></Card>
          ))}
        </div>
      </div>
    </div>
    <footer className="landing-footer">© 2026 BiciMarket</footer>
  </div>
);

const ClerkWidget = ({mode='sign-in'}) => (
  <div style={{padding: '1.5rem 2rem 2rem'}}>
    <div style={{textAlign: 'center', marginBottom: 20}}>
      <div className="text-semibold" style={{fontSize: 18}}>{mode==='sign-in' ? 'Bienvenido' : 'Crear cuenta'}</div>
      <div className="text-sm text-muted" style={{marginTop: 4}}>{mode==='sign-in' ? 'Iniciá sesión para continuar' : 'Comenzá a vender en BiciMarket'}</div>
    </div>
    <div className="stack" style={{gap: 8, marginBottom: 16}}>
      <Button variant="outline" style={{width: '100%'}}>
        <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18a11 11 0 0 0 0 9.86l2.85-2.22.81-.62z"/><path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
        Continuar con Google
      </Button>
    </div>
    <div className="row" style={{gap: 10, alignItems: 'center', margin: '14px 0'}}>
      <div style={{flex: 1, height: 1, background: 'var(--border)'}}/>
      <span className="text-xs text-muted">o</span>
      <div style={{flex: 1, height: 1, background: 'var(--border)'}}/>
    </div>
    <div className="stack" style={{gap: 12}}>
      <div><Label>Email</Label><Input type="email" placeholder="vos@ejemplo.com"/></div>
      <div><Label>Contraseña</Label><Input type="password" placeholder="••••••••"/></div>
      <Button style={{width: '100%'}}>{mode==='sign-in' ? 'Ingresar' : 'Crear cuenta'}</Button>
    </div>
    <div className="text-xs text-muted" style={{textAlign: 'center', marginTop: 16}}>
      {mode==='sign-in'
        ? <>¿Sin cuenta? <a style={{color: 'var(--primary)', fontWeight: 500}}>Crear cuenta</a></>
        : <>¿Ya tenés cuenta? <a style={{color: 'var(--primary)', fontWeight: 500}}>Ingresar</a></>}
    </div>
  </div>
);

const AuthScreen = ({mode='sign-in'}) => (
  <div className="bici-root" style={{minHeight: '100%', background: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem'}}>
    <div style={{width: '100%', maxWidth: 420}}>
      <div style={{textAlign: 'center', marginBottom: 22}}>
        <div className="row" style={{justifyContent: 'center', gap: 10, marginBottom: 4}}>
          <div className="brand-mark"><Icon.Bike size={16}/></div>
          <span className="text-semibold" style={{fontSize: 17}}>BiciMarket Vendedor</span>
        </div>
      </div>
      <Card><ClerkWidget mode={mode}/></Card>
      {mode==='sign-up' && (
        <div className="text-xs text-muted" style={{textAlign: 'center', marginTop: 14, padding: '0 1rem'}}>
          Luego de registrarte, completá tu perfil de vendedor para publicar productos.
        </div>
      )}
    </div>
  </div>
);

const Suspended = () => (
  <div className="bici-root" style={{minHeight: '100%'}}>
    <header className="header-bar">
      <div className="header-inner">
        <div className="brand"><div className="brand-mark"><Icon.Bike size={16}/></div><span>BiciMarket Vendedor</span></div>
        <div className="avatar">MS</div>
      </div>
    </header>
    <div style={{maxWidth: 540, margin: '0 auto', padding: '4rem 1.5rem'}}>
      <Card>
        <CardContent style={{paddingTop: '1.75rem', paddingBottom: '1.75rem', textAlign: 'center'}}>
          <div style={{display: 'inline-flex', padding: 16, borderRadius: 999, background: 'oklch(0.96 0.06 27)', color: 'var(--destructive)', marginBottom: 14}}>
            <Icon.Alert size={28}/>
          </div>
          <Badge variant="destructive">Cuenta suspendida</Badge>
          <h2 style={{fontSize: '1.25rem', fontWeight: 600, marginTop: 16, marginBottom: 8}}>Tu cuenta de vendedor está suspendida</h2>
          <p className="text-sm text-muted" style={{marginBottom: 20, lineHeight: 1.55}}>
            No podés acceder al panel hasta resolver la situación. Contactá a soporte para más información.
          </p>
          <Button>Contactar a soporte</Button>
        </CardContent>
      </Card>
    </div>
  </div>
);

const ToastsOverlay = () => (
  <div style={{position: 'absolute', bottom: 20, right: 20, display: 'flex', flexDirection: 'column', gap: 10, zIndex: 80}}>
    <div className="toast success">
      <div className="toast-icon"><Icon.Check size={12}/></div>
      <div><div className="text-semibold text-sm">Pedido aceptado</div><div className="text-xs text-muted">sor_01H8XQR2NK4P pasó a Aceptado</div></div>
    </div>
    <div className="toast success">
      <div className="toast-icon"><Icon.Check size={12}/></div>
      <div><div className="text-semibold text-sm">Producto creado en borrador</div></div>
    </div>
    <div className="toast success">
      <div className="toast-icon"><Icon.Check size={12}/></div>
      <div><div className="text-semibold text-sm">Imagen agregada</div></div>
    </div>
    <div className="toast error">
      <div className="toast-icon">!</div>
      <div><div className="text-semibold text-sm">No se pudo aceptar el pedido</div><div className="text-xs text-muted">Reintentá en unos segundos.</div></div>
    </div>
  </div>
);

window.Landing = Landing;
window.AuthScreen = AuthScreen;
window.Suspended = Suspended;
window.ToastsOverlay = ToastsOverlay;
