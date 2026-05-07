// Dashboard shell + Pedidos / Catálogo / Liquidaciones / Mi perfil tabs
// Static — accepts current tab as prop, plus state variant flags.

const DashShell = ({tab='pedidos', userName='Mariana Suárez', mobile=false, children, hideUserName=false}) => (
  <div className={`bici-root ${mobile?'mobile':''}`} style={{minHeight: '100%'}}>
    <header className="header-bar">
      <div className="header-inner">
        <div className="brand">
          <div className="brand-mark">
            <Icon.Bike size={16}/>
          </div>
          <span>BiciMarket Vendedor</span>
        </div>
        <div className="row" style={{gap: '0.625rem'}}>
          {!hideUserName && <span className="text-sm text-muted">{userName}</span>}
          <div className="avatar">MS</div>
        </div>
      </div>
    </header>
    <div className="container-x">
      <div className="tabs-list" role="tablist">
        <button className={`tabs-trigger ${tab==='pedidos'?'active':''}`}>Pedidos</button>
        <button className={`tabs-trigger ${tab==='catalogo'?'active':''}`}>Catálogo</button>
        <button className={`tabs-trigger ${tab==='liquidaciones'?'active':''}`}>Liquidaciones</button>
        <button className={`tabs-trigger ${tab==='perfil'?'active':''}`}>Mi perfil</button>
      </div>
      {children}
    </div>
  </div>
);

// ── Order Card ─────────────────────────────────────
const OrderCard = ({order}) => {
  const s = order.status;
  return (
    <Card>
      <CardHeader>
        <div className="row-between" style={{alignItems: 'flex-start'}}>
          <div style={{minWidth: 0}}>
            <div className="mono text-xs text-muted truncate">{truncId(order.id, 16)}</div>
            <div className="text-xs text-muted" style={{marginTop: 2}}>Orden {order.id.slice(0,12)}… · {order.date}</div>
          </div>
          {fulfillmentBadge(s)}
        </div>
      </CardHeader>
      <CardContent>
        <ul style={{listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6}}>
          {order.items.map((it, i) => (
            <li key={i} className="row-between text-sm">
              <span className="text-muted truncate" style={{flex: 1, minWidth: 0}}>
                <span style={{color: 'var(--foreground)'}}>{it.qty}x</span> {it.name}
              </span>
              <span className="text-semibold mono" style={{flexShrink: 0, marginLeft: 8}}>{ARS(it.price * it.qty)}</span>
            </li>
          ))}
        </ul>
        <Separator/>
        <div className="stack" style={{gap: 4}}>
          <div className="row-between text-sm text-muted">
            <span>Subtotal productos</span><span className="mono">{ARS(order.subtotal)}</span>
          </div>
          <div className="row-between text-sm text-muted">
            <span>Costo de envío</span><span className="mono">{ARS(order.shipping)}</span>
          </div>
          <div className="row-between text-sm text-semibold" style={{marginTop: 2}}>
            <span>Total</span><span className="mono">{ARS(order.total)}</span>
          </div>
        </div>
        <div className="text-xs text-muted" style={{marginTop: 12}}>Envío a: {order.address}</div>
        <div style={{marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap'}}>
          {s === 'pending' && <>
            <Button style={{flex: 1}}>Aceptar pedido</Button>
            <Button variant="destructive" style={{flex: 1}}>Rechazar</Button>
          </>}
          {s === 'accepted' && <Button style={{width: '100%'}}>Iniciar preparación</Button>}
          {s === 'preparing' && <Button style={{width: '100%'}}>Listo para envío — notificar logística</Button>}
          {s === 'ready_to_ship' && <div className="text-xs text-muted" style={{textAlign: 'center', width: '100%', padding: 8}}>Esperando retiro por logística</div>}
          {s === 'handed_over' && <div className="text-xs text-muted" style={{textAlign: 'center', width: '100%', padding: 8}}>En camino al comprador</div>}
          {s === 'delivered' && <div className="text-xs text-muted" style={{textAlign: 'center', width: '100%', padding: 8}}>Entregado al comprador ✓</div>}
          {s === 'rejected' && <div className="text-xs text-muted" style={{textAlign: 'center', width: '100%', padding: 8}}>Pedido rechazado · reembolso emitido</div>}
        </div>
      </CardContent>
    </Card>
  );
};

const SkeletonOrderCard = () => (
  <Card>
    <CardHeader>
      <div className="row-between">
        <div className="stack" style={{flex:1, gap: 6}}>
          <Skeleton w={140} h={10}/>
          <Skeleton w={180} h={9}/>
        </div>
        <Skeleton w={70} h={18}/>
      </div>
    </CardHeader>
    <CardContent>
      <div className="stack" style={{gap: 8}}>
        <Skeleton w="100%" h={12}/><Skeleton w="80%" h={12}/>
        <div style={{height: 1, background: 'var(--border)', margin: '8px 0'}}/>
        <Skeleton w="60%" h={10}/><Skeleton w="55%" h={10}/>
        <Skeleton w="100%" h={32} style={{marginTop: 10}}/>
      </div>
    </CardContent>
  </Card>
);

// ── Pedidos Tab ────────────────────────────────────
const PedidosTab = ({orders=SAMPLE_ORDERS, history=SAMPLE_HISTORY, showRejectDialog=false, empty=false, loading=false}) => {
  if (loading) {
    return (
      <>
        <h2 className="section-title">Pedidos activos</h2>
        <div className="grid-cards"><SkeletonOrderCard/><SkeletonOrderCard/><SkeletonOrderCard/></div>
      </>
    );
  }
  if (empty) {
    return (
      <>
        <h2 className="section-title">Pedidos activos (0)</h2>
        <div className="card" style={{padding: '3rem 1.5rem', textAlign: 'center'}}>
          <div style={{display: 'inline-flex', padding: 14, borderRadius: 999, background: 'var(--secondary)', color: 'var(--primary)', marginBottom: 12}}><Icon.Package size={22}/></div>
          <div className="text-sm text-muted">No hay pedidos activos.</div>
        </div>
      </>
    );
  }
  return (
    <>
      <h2 className="section-title">Pedidos activos ({orders.length})</h2>
      <div className="grid-cards">
        {orders.map(o => <OrderCard key={o.id} order={o}/>)}
      </div>
      <div style={{height: 28}}/>
      <h2 className="section-title muted">Historial</h2>
      <div className="grid-cards">
        {history.map(o => <OrderCard key={o.id} order={o}/>)}
      </div>
      {showRejectDialog && <RejectDialog/>}
    </>
  );
};

const RejectDialog = () => (
  <div className="dialog-backdrop">
    <div className="dialog">
      <div className="dialog-header">
        <div className="dialog-title">Rechazar pedido</div>
        <div className="dialog-description">Se iniciará un reembolso al comprador. Indicá el motivo del rechazo.</div>
      </div>
      <div className="dialog-content">
        <Label>Motivo</Label>
        <Textarea rows={4} placeholder="Ej: Producto dañado al revisar antes del despacho" defaultValue=""/>
      </div>
      <div className="dialog-footer">
        <Button variant="outline">Cancelar</Button>
        <Button variant="destructive">Confirmar rechazo</Button>
      </div>
    </div>
  </div>
);

window.DashShell = DashShell;
window.OrderCard = OrderCard;
window.PedidosTab = PedidosTab;
window.RejectDialog = RejectDialog;
window.SkeletonOrderCard = SkeletonOrderCard;
