// Catálogo, Liquidaciones, Mi perfil tabs
const ProductCard = ({p, unverified=false}) => {
  const s = p.status;
  const canActivate = !unverified;
  return (
    <Card>
      <CardHeader>
        <div className="row-between" style={{alignItems: 'flex-start'}}>
          <div style={{minWidth: 0, flex: 1}}>
            <div className="text-semibold text-sm truncate">{p.title}</div>
            <div className="text-xs text-muted truncate">{p.brand} · {p.model} · {p.cat}</div>
          </div>
          {productBadge(s)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="row-between" style={{marginBottom: 10}}>
          <span className="text-xs text-muted">{p.condition}</span>
          <span className="text-semibold mono text-sm">{ARS(p.price)}</span>
        </div>
        <div className="img-strip">
          {p.images > 0 ? Array.from({length: Math.min(p.images, 4)}).map((_,i) =>
            <BikeThumb key={i} hue={p.hue + i*15} size={64}/>
          ) : <div style={{fontSize: 12, color: 'var(--muted-foreground)', padding: '20px 0'}}>Sin imágenes</div>}
        </div>
        <Separator/>
        <div style={{display: 'flex', flexWrap: 'wrap', gap: 6}}>
          <Button variant="outline" size="sm"><Icon.Plus size={12}/>Imagen</Button>
          {s === 'draft' && <Button size="sm" disabled={!canActivate} title={!canActivate?'Tu perfil debe estar verificado para activar productos.':''}>Activar</Button>}
          {s === 'active' && <Button variant="outline" size="sm">Pausar</Button>}
          {s === 'paused' && <Button size="sm" disabled={!canActivate}>Reactivar</Button>}
          {s !== 'archived' && <Button variant="destructive" size="sm">Archivar</Button>}
        </div>
      </CardContent>
    </Card>
  );
};

const CatalogoTab = ({verified=true, showCreateDialog=false, products=SAMPLE_PRODUCTS, archived=SAMPLE_PRODUCTS_ARCHIVED}) => (
  <>
    <div className="row-between" style={{marginBottom: 16}}>
      <h2 className="section-title" style={{margin: 0}}>Catálogo ({products.length})</h2>
      {verified
        ? <Button size="sm"><Icon.Plus size={12}/>Nuevo producto</Button>
        : <span className="text-xs text-muted row" style={{gap: 6}}><Icon.Lock size={12}/>Verificá tu perfil para publicar productos</span>}
    </div>
    <div className="grid-cards">
      {products.map(p => <ProductCard key={p.id} p={p} unverified={!verified}/>)}
    </div>
    <div style={{height: 28}}/>
    <h2 className="section-title muted">Archivados</h2>
    <div className="grid-cards">
      {archived.map(p => <ProductCard key={p.id} p={p}/>)}
    </div>
    {showCreateDialog && <CreateProductDialog/>}
  </>
);

const CreateProductDialog = () => (
  <div className="dialog-backdrop">
    <div className="dialog" style={{maxWidth: '34rem'}}>
      <div className="dialog-header">
        <div className="dialog-title">Nuevo producto</div>
        <div className="dialog-description">Se crea como borrador. Para activarlo necesitás al menos una imagen y datos completos.</div>
      </div>
      <div className="dialog-content">
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12}}>
          <div><Label required>Título</Label><Input placeholder="Trek Marlin 5 — Rodado 29"/></div>
          <div><Label required>Marca</Label><Input placeholder="Trek"/></div>
          <div><Label required>Modelo</Label><Input placeholder="Marlin 5"/></div>
          <div><Label required>Precio (ARS)</Label><Input placeholder="685000"/></div>
          <div><Label>Categoría</Label><Select value="MTB"/></div>
          <div><Label>Condición</Label><Select value="Nuevo"/></div>
        </div>
        <div style={{marginTop: 12}}><Label required>Peso (gramos)</Label><Input placeholder="14500"/></div>
        <div style={{marginTop: 12}}><Label>Descripción</Label><Textarea rows={3} placeholder="Bicicleta de montaña rodado 29, talle M, frenos a disco hidráulicos…"/></div>
      </div>
      <div className="dialog-footer">
        <Button variant="outline">Cancelar</Button>
        <Button>Crear producto</Button>
      </div>
    </div>
  </div>
);

const StatCard = ({title, value, sub, accent=false}) => (
  <Card><CardContent style={{padding: '1.125rem 1.25rem'}}>
    <div className="text-xs text-muted" style={{textTransform: 'uppercase', letterSpacing: 0.4, fontSize: 11, fontWeight: 500}}>{title}</div>
    <div className={`mono`} style={{fontSize: 26, fontWeight: 600, marginTop: 6, color: accent?'var(--primary)':'var(--foreground)', letterSpacing: '-0.02em'}}>{value}</div>
    {sub && <div className="text-xs text-muted" style={{marginTop: 4}}>{sub}</div>}
  </CardContent></Card>
);

const LiquidacionesTab = ({rows=SAMPLE_SETTLEMENTS, mobile=false, loading=false, empty=false}) => {
  if (loading) {
    return <div className="card"><div style={{padding: 16}}>{Array.from({length:5}).map((_,i)=>(<div key={i} style={{display:'flex', gap: 16, padding: '12px 0', borderBottom: i<4?'1px solid var(--border)':'none'}}>
      <Skeleton w={120} h={12}/><Skeleton w={120} h={12}/><Skeleton w={70} h={12}/><Skeleton w={90} h={12}/><Skeleton w={70} h={12} style={{marginLeft: 'auto'}}/>
    </div>))}</div></div>;
  }
  const monthPaid = rows.filter(r=>r.status==='paid').reduce((s,r)=>s+r.net,0);
  const pending = rows.filter(r=>r.status==='pending').reduce((s,r)=>s+r.net,0);
  const fees = rows.reduce((s,r)=>s+r.fee,0);
  return (
    <>
      <div className="alert info" style={{marginBottom: 16}}>
        <Icon.Banknote size={16}/>
        <span>Las liquidaciones se acreditan después de la entrega confirmada. La comisión del marketplace ya se descuenta en el monto neto.</span>
      </div>
      <div className="stat-card-row">
        <StatCard title="Total liquidado este mes" value={ARS(monthPaid)} accent/>
        <StatCard title="Pendiente de acreditación" value={ARS(pending)}/>
        <StatCard title="Comisión cobrada" value={ARS(fees)} sub="10% sobre el bruto"/>
      </div>
      {empty
        ? <div className="card" style={{padding: '3rem', textAlign: 'center'}}><div className="text-sm text-muted">No tenés liquidaciones todavía.</div></div>
        : (mobile ? <div className="stack" style={{gap: 10}}>{rows.map(r=>(
            <Card key={r.id}><CardContent style={{paddingTop: 14}}>
              <div className="row-between" style={{marginBottom: 8}}>
                <span className="mono text-xs text-muted">{truncId(r.id, 14)}</span>
                {settlementBadge(r.status)}
              </div>
              <div className="text-xs text-muted mono">Orden {truncId(r.order, 14)}</div>
              <div className="text-xs text-muted" style={{marginTop: 2}}>{r.date}</div>
              <Separator/>
              <div className="row-between text-sm"><span className="text-muted">Bruto</span><span className="mono">{ARS(r.gross)}</span></div>
              <div className="row-between text-sm"><span className="text-muted">Comisión</span><span className="mono" style={{color: 'var(--destructive)'}}>− {ARS(r.fee)}</span></div>
              <div className="row-between text-sm text-semibold" style={{marginTop: 4}}><span>Neto</span><span className="mono" style={{color: 'var(--primary)'}}>{ARS(r.net)}</span></div>
            </CardContent></Card>
          ))}</div>
        : <Card><table className="stt-table"><thead><tr>
            <th>ID</th><th>Orden</th><th>Fecha</th><th style={{textAlign:'right'}}>Bruto</th><th style={{textAlign:'right'}}>Comisión</th><th style={{textAlign:'right'}}>Neto</th><th>Estado</th>
          </tr></thead><tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td className="mono text-xs text-muted">{truncId(r.id, 14)}</td>
                <td className="mono text-xs text-muted">{truncId(r.order, 14)}</td>
                <td className="text-sm">{r.date}</td>
                <td className="mono text-sm" style={{textAlign:'right'}}>{ARS(r.gross)}</td>
                <td className="mono text-sm" style={{textAlign:'right', color: 'var(--destructive)'}}>− {ARS(r.fee)}</td>
                <td className="mono text-sm text-semibold" style={{textAlign:'right', color: 'var(--primary)'}}>{ARS(r.net)}</td>
                <td>{settlementBadge(r.status)}</td>
              </tr>
            ))}
          </tbody></table>
          <div className="pagination">
            <span className="text-xs text-muted">Mostrando {rows.length} de 24 liquidaciones</span>
            <div className="row" style={{gap: 4}}>
              <Button variant="outline" size="sm">Anterior</Button>
              <Button variant="outline" size="sm">Siguiente</Button>
            </div>
          </div>
        </Card>)
      }
    </>
  );
};

const PerfilTab = ({verification='verified', adminView=false, hasProfile=true}) => (
  <div style={{maxWidth: '40rem'}}>
    <Card style={{marginBottom: 16}}>
      <CardContent style={{paddingTop: '1.125rem'}}>
        <div className="row-between" style={{flexWrap: 'wrap', gap: 12}}>
          <div className="row" style={{gap: 10}}>
            <span className="text-sm text-muted">Estado de verificación:</span>
            {verification==='verified' && <Badge variant="default"><Icon.Check size={11}/>Verificado</Badge>}
            {verification==='pending_review' && <Badge variant="secondary">Pendiente de revisión</Badge>}
            {verification==='suspended' && <Badge variant="destructive">Suspendido</Badge>}
          </div>
          {adminView && <div className="row" style={{gap: 6, flexWrap: 'wrap'}}>
            {verification!=='verified' && <Button variant="outline" size="sm">Verificar</Button>}
            {verification!=='pending_review' && <Button variant="outline" size="sm">Pasar a pendiente</Button>}
            {verification!=='suspended' && <Button variant="destructive" size="sm">Suspender</Button>}
          </div>}
        </div>
      </CardContent>
    </Card>

    {!hasProfile && (
      <div className="alert warning" style={{marginBottom: 16}}>
        <Icon.Alert size={16}/>
        <span>Completá tu perfil de vendedor para poder publicar productos.</span>
      </div>
    )}

    <Card style={{marginBottom: 16}}>
      <CardHeader><CardTitle>Datos fiscales</CardTitle></CardHeader>
      <CardContent>
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12}}>
          <div><Label required>Razón social</Label><Input defaultValue="Bicicletería del Sur S.R.L."/></div>
          <div><Label required>Nombre público</Label><Input defaultValue="Bicicletería del Sur"/></div>
          <div><Label required>CUIT / CUIL</Label><Input defaultValue="30-71458963-2"/></div>
          <div><Label>Condición fiscal</Label><Select value="Responsable inscripto"/></div>
        </div>
        <div style={{marginTop: 12}}><Label required>CBU / Alias bancario</Label><Input defaultValue="bicidelsur.mp"/></div>
      </CardContent>
    </Card>

    <Card style={{marginBottom: 16}}>
      <CardHeader><CardTitle>Dirección de retiro</CardTitle></CardHeader>
      <CardContent>
        <div style={{display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12}}>
          <div><Label required>Calle</Label><Input defaultValue="Av. del Libertador"/></div>
          <div><Label>Número</Label><Input defaultValue="2840"/></div>
        </div>
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12}}>
          <div><Label required>Ciudad</Label><Input defaultValue="CABA"/></div>
          <div><Label required>Provincia</Label><Input defaultValue="Buenos Aires"/></div>
        </div>
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12}}>
          <div><Label>Código postal</Label><Input defaultValue="C1425"/></div>
          <div><Label>País</Label><Input defaultValue="Argentina"/></div>
        </div>
      </CardContent>
    </Card>

    <Button style={{width: '100%'}} size="lg">{hasProfile ? 'Guardar cambios' : 'Crear perfil de vendedor'}</Button>
  </div>
);

window.ProductCard = ProductCard;
window.CatalogoTab = CatalogoTab;
window.CreateProductDialog = CreateProductDialog;
window.LiquidacionesTab = LiquidacionesTab;
window.PerfilTab = PerfilTab;
window.StatCard = StatCard;
