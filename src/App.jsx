import { useState } from 'react';

const finca = () => ({ nombre: '', tenencia: '', departamento: '', distrito: '', cultivo: '', observaciones: '', plusCode: '', referencia: '', latitud: '', longitud: '', finca: '', superficie: '', valor: '', gravamen: '', area: '', perimetro: '' });
const bien = () => ({ tipo: '', marca: '', anio: '', valor: '', deuda: '' });
const ganado = () => ({ especie: '', cantidad: '', unitario: '', total: '', gravamen: '' });
const cultivoBase = ['SOJA', 'MAIZ', 'TRIGO', 'CHIA', 'GIRASOL', 'SESAMO', 'MANI', 'CAÑA', 'PASTURA'];
const referenciaBase = ['BANCO 1', 'BANCO 2', 'PROV. 1', 'PROV. 2', 'PROV. 3'];
const filas = (factory, cantidad) => Array.from({ length: cantidad }, factory);

const nuevoEstado = () => ({
  fecha: '', tipo: 'Persona Física', nombre: '', ci: '', telefono: '', domicilio: '', email: '',
  actividad: [], fincas: filas(finca, 4), reventa: [], servicios: [],
  prod: cultivoBase.map(c => ({ cultivo: c, ant: '', rnd: '', actual: '', tn: '' })),
  siembra: '', inicio: '', fin: '', bienes: filas(bien, 9), ganado: filas(ganado, 5),
  refs: referenciaBase.map(tipo => ({ tipo, entidad: '', contacto: '', telefono: '' })),
  declarantes: [{ titular: '', ruc: '' }, { titular: '', ruc: '' }, { titular: '', ruc: '' }],
  aclaracion: ''
});

function Field({ label, value, onChange, type = 'text', className = '', placeholder = '' }) {
  return <label className={`field ${className}`}><span>{label}</span><input type={type} value={value || ''} placeholder={placeholder} onChange={e => onChange(e.target.value)} /></label>;
}

function Checks({ items, value, onChange }) {
  return <div className="checks">{items.map(item => <label className="check" key={item}><input type="checkbox" checked={value.includes(item)} onChange={() => onChange(value.includes(item) ? value.filter(v => v !== item) : [...value, item])} />{item}</label>)}</div>;
}

function Section({ number, title, children }) {
  return <section className="section"><h2>{number}. {title}</h2>{children}</section>;
}

function mapUrl(lat, lon) {
  const la = Number(lat), lo = Number(lon);
  if (!Number.isFinite(la) || !Number.isFinite(lo)) return '';
  const delta = 0.006;
  const bbox = [lo-delta, la-delta, lo+delta, la+delta].join(',');
  const params = new URLSearchParams({
    bbox,
    bboxSR: '4326',
    imageSR: '4326',
    size: '1200,420',
    format: 'jpg',
    f: 'image',
    dpi: '96'
  });
  return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?${params.toString()}`;
}
function openMap(lat, lon) {
  if (lat && lon) window.open(`https://www.google.com/maps/@${lat},${lon},16z/data=!3m1!1e3`, '_blank');
}
function LocationMap({ lat, lon }) {
  const src = mapUrl(lat, lon);
  return src
    ? <div className="satellite-map-wrap">
        <img className="location-map satellite-map" src={src} alt="Vista satelital de la ubicación" />
        <div className="satellite-badge">VISTA SATELITAL</div>
      </div>
    : <div className="location-map-empty">Ingrese latitud y longitud para visualizar la ubicación.</div>;
}

function Table({ heads, children, className = '' }) {
  return <div className={`table-wrap ${className}`}><table><thead><tr>{heads.map(head => <th key={head}>{head}</th>)}</tr></thead><tbody>{children}</tbody></table></div>;
}

function EditableRow({ data, index, fields, collection, setData }) {
  return <tr>{fields.map(field => <td key={field}><input value={data[field] || ''} onChange={e => setData(collection, index, field, e.target.value)} /></td>)}</tr>;
}

function LogoHeader() {
  return <header className="document-header">
    <img src={`${import.meta.env.BASE_URL}logo-mas-fertil-v8.svg`} alt="másfertil fertilizantes" className="mas-logo" />
    <div className="granu"><span>GRANU</span><b>+</b></div>
  </header>;
}

function PageFooter() {
  return <footer>FORM. IBCTIM. V6 MFS SETIEMBRE 26</footer>;
}

export default function App() {
  const [d, setD] = useState(nuevoEstado);
  const [page, setPage] = useState(1);

  const set = (key, value) => setD(prev => ({ ...prev, [key]: value }));
  const setRow = (collection, index, field, value) => setD(prev => ({ ...prev, [collection]: prev[collection].map((row, i) => i === index ? { ...row, [field]: value } : row) }));
  const addRow = (collection, factory) => setD(prev => ({ ...prev, [collection]: [...prev[collection], factory()] }));
  const obtenerUbicacion = (index) => { if (!navigator.geolocation) return; navigator.geolocation.getCurrentPosition(pos => { setD(prev => ({ ...prev, fincas: prev.fincas.map((row, i) => i === index ? { ...row, latitud: pos.coords.latitude.toFixed(6), longitud: pos.coords.longitude.toFixed(6) } : row) })); }, () => {}); };
  const removeRow = (collection, index) => setD(prev => ({ ...prev, [collection]: prev[collection].filter((_, i) => i !== index) }));
  const nuevo = () => { setD(nuevoEstado()); setPage(1); };

  return <div className="app-shell">
    <header className="app-header no-print">
      <div className="brand-block">
        <img src={`${import.meta.env.BASE_URL}logo-mas-fertil-v8.svg`} alt="másfertil fertilizantes" className="app-logo" />
      </div>
      <div className="app-title">
        <strong>(IBC) TÉCNICO INTEGRAL Y MULTISECTORIAL</strong>
        <span>Información para un mejor análisis y acompañamiento</span>
      </div>
      <div className="header-actions">
        <label className="header-date"><span>FECHA</span><input type="date" value={d.fecha || ''} onChange={e => set('fecha', e.target.value)} /></label>
        <button className="btn-gold" onClick={() => window.print()}>▣ &nbsp; GENERAR PDF</button>
        <button className="btn-outline" onClick={nuevo}>⊕ &nbsp; NUEVO IBC</button>
      </div>
    </header>

    <div className="workspace">
      <aside className="sidebar no-print">
        <button className={`side-item ${page === 1 ? 'active' : ''}`} onClick={() => setPage(1)}><span className="side-icon">▤</span><span><b>Página 1</b><small>Datos del cliente y actividad</small></span></button>
        <button className={`side-item ${page === 2 ? 'active' : ''}`} onClick={() => setPage(2)}><span className="side-icon">▥</span><span><b>Página 2</b><small>Activos productivos</small></span></button>
        <button className={`side-item ${page === 3 ? 'active' : ''}`} onClick={() => setPage(3)}><span className="side-icon">▧</span><span><b>Página 3</b><small>Referencias y declaración</small></span></button>
        <div className="side-divider" />
        <button className="side-link" onClick={() => window.print()}><span>◉</span> Vista previa / PDF</button>
        <button className="side-link" onClick={() => window.print()}><span>▣</span> Imprimir</button>
        <button className="side-link" onClick={nuevo}><span>⊕</span> Nuevo IBC</button>
        <div className="side-divider" />
        <div className="side-help"><span className="help-icon">?</span><div><b>IBC MAS FERTIL</b><small>Complete cada campo manualmente. El formulario conserva las 3 páginas para impresión A4.</small></div></div>
        <div className="sidebar-brand"><img src={`${import.meta.env.BASE_URL}logo-mas-fertil-v8.svg`} alt="MAS FERTIL" /></div>
      </aside>

      <main className="system-content">
        <div className="screen-heading no-print">
          <div><h1>IBC - Técnico Integral y Multisectorial</h1><p>Página {page} de 3</p></div>
          <div className="status-pill">● Formulario manual</div>
        </div>

        <div className="document">
          <article className={`print-page page-one ${page === 1 ? 'screen-active' : ''}`}>
            <LogoHeader />
            <h1>(IBC) TÉCNICO INTEGRAL Y MULTISECTORIAL</h1>
            <Field label="FECHA" value={d.fecha} onChange={v => set('fecha', v)} type="date" className="date-field" />
            <Section number="1" title="DATOS DEL CLIENTE">
              <div className="checks client-type"><label className="check"><input type="radio" checked={d.tipo === 'Persona Física'} onChange={() => set('tipo', 'Persona Física')} /> Persona Física</label><label className="check"><input type="radio" checked={d.tipo === 'Persona Jurídica'} onChange={() => set('tipo', 'Persona Jurídica')} /> Persona Jurídica</label></div>
              <div className="grid two client-fields"><Field label="NOMBRE / RAZÓN SOCIAL" value={d.nombre} onChange={v => set('nombre', v)} /><Field label="C.I. / RUC" value={d.ci} onChange={v => set('ci', v)} /><Field label="TELÉFONO" value={d.telefono} onChange={v => set('telefono', v)} /><Field label="DOMICILIO / CIUDAD" value={d.domicilio} onChange={v => set('domicilio', v)} /><Field label="E-MAIL" value={d.email} onChange={v => set('email', v)} className="full" /></div>
            </Section>
            <Section number="2" title="PERFIL DE ACTIVIDAD Y SUPERFICIE">
              <div className="label-line">ACTIVIDAD:</div>
              <Checks items={['Agrícola', 'Ganadera', 'Comercial/Revendedor', 'Servicios']} value={d.actividad} onChange={v => set('actividad', v)} />
              <div className="locations-screen">
                <div className="locations-head"><div><b>UBICACIONES PRODUCTIVAS ({d.fincas.length})</b><small>Registrar cada finca o unidad productiva con sus datos y georreferenciación.</small></div><button className="location-add" onClick={() => addRow('fincas', finca)}>+ Agregar finca / ubicación</button></div>
                {d.fincas.map((row, i) => <div className="location-card" key={i}>
                  <div className="location-card-title"><b>FINCA / UNIDAD PRODUCTIVA {i + 1}</b>{d.fincas.length > 1 && <button className="remove-location" onClick={() => removeRow('fincas', i)}>×</button>}</div>
                  <div className="location-grid">
                    <Field label="Nombre / Identificación" value={row.nombre} onChange={v => setRow('fincas', i, 'nombre', v)} placeholder="Ej.: Finca San José" />
                    <label className="field"><span>Tenencia</span><select value={row.tenencia || ''} onChange={e => setRow('fincas', i, 'tenencia', e.target.value)}><option value="">Seleccionar</option><option>Propia</option><option>Arrendada</option><option>Comodato</option><option>Otra</option></select></label>
                    <Field label="Departamento" value={row.departamento} onChange={v => setRow('fincas', i, 'departamento', v)} />
                    <Field label="Distrito" value={row.distrito} onChange={v => setRow('fincas', i, 'distrito', v)} />
                    <Field label="Cultivo / actividad principal" value={row.cultivo} onChange={v => setRow('fincas', i, 'cultivo', v)} />
                    <Field label="Finca / Padrón / Cta. Cte. / Lote / Manzana" value={row.finca} onChange={v => setRow('fincas', i, 'finca', v)} className="full" />
                  </div>
                  <div className="location-gps">
                    <div className="location-gps-head"><b>UBICACIÓN GPS / LOCALIDAD</b><button className="gps-current" onClick={() => obtenerUbicacion(i)}>Obtener ubicación actual</button></div>
                    <div className="location-gps-grid">
                      <Field label="Plus Code compartido" value={row.plusCode} onChange={v => setRow('fincas', i, 'plusCode', v)} placeholder="Ej.: 86Q8+PF" />
                      <Field label="Referencia de localidad" value={row.referencia} onChange={v => setRow('fincas', i, 'referencia', v)} placeholder="Localidad + distrito + departamento" />
                      <Field label="Latitud" value={row.latitud} onChange={v => setRow('fincas', i, 'latitud', v)} />
                      <Field label="Longitud" value={row.longitud} onChange={v => setRow('fincas', i, 'longitud', v)} />
                    </div>
                    <div className="gps-actions"><button className="gps-search" onClick={() => openMap(row.latitud, row.longitud)}>Abrir en mapa</button><span>Puede ingresar las coordenadas compartidas por el cliente o utilizar el GPS del dispositivo.</span></div>
                    <div className="map-title"><b>VERIFICACIÓN DE UBICACIÓN</b><small>La posición se visualiza automáticamente con las coordenadas cargadas.</small></div>
                    <LocationMap lat={row.latitud} lon={row.longitud} />
                  </div>
                  <div className="location-bottom-grid">
                    <Field label="Superficie ha." value={row.superficie} onChange={v => setRow('fincas', i, 'superficie', v)} />
                    <Field label="Valor estimado Gs/Usd" value={row.valor} onChange={v => setRow('fincas', i, 'valor', v)} />
                    <label className="field"><span>Hipoteca / Gravamen</span><select value={row.gravamen || ''} onChange={e => setRow('fincas', i, 'gravamen', e.target.value)}><option value="">Seleccionar</option><option>NO</option><option>SI</option></select></label>
                    <Field label="Área delimitada" value={row.area} onChange={v => setRow('fincas', i, 'area', v)} placeholder="Opcional" />
                    <Field label="Perímetro" value={row.perimetro} onChange={v => setRow('fincas', i, 'perimetro', v)} placeholder="Opcional" />
                    <Field label="Observaciones" value={row.observaciones} onChange={v => setRow('fincas', i, 'observaciones', v)} className="full" />
                  </div>
                </div>)}
              </div>
              <div className="locations-print"><Table heads={['Ubicación GPS / Localidad', 'Finca / Padrón / Cta. Cte. / Lote / Manzana', 'Superficie ha.', 'Tenencia', 'Valor estimado Gs/Usd', 'Hipoteca / Gravamen']}>{d.fincas.map((row, i) => <tr key={i}><td>{row.referencia || row.nombre || (row.latitud + ' / ' + row.longitud)}</td><td>{row.finca}</td><td>{row.superficie}</td><td>{row.tenencia}</td><td>{row.valor}</td><td>{row.gravamen}</td></tr>)}</Table></div>
            </Section>
            <Section number="2.1" title="MÓDULO COMERCIAL Y DE SERVICIOS"><div className="label-line">REVENTA:</div><Checks items={['Agroquímicos', 'Fertilizantes', 'Semillas']} value={d.reventa} onChange={v => set('reventa', v)} /><div className="label-line">SERVICIOS:</div><Checks items={['Consultoría', 'Maquinaria Pesada', 'Logística', 'Asistencia Técnica', 'Acopio Silo']} value={d.servicios} onChange={v => set('servicios', v)} /></Section>
            <Section number="3" title="PLAN DE PRODUCCIÓN"><Table heads={['CULTIVO', 'Has. ANT.', 'Rnd. Kg', 'Has. Actual', 'TN Estimada']} className="production-table">{d.prod.map((row, i) => <tr key={row.cultivo}><td><b>{row.cultivo}</b></td>{['ant', 'rnd', 'actual', 'tn'].map(field => <td key={field}><input value={row[field]} onChange={e => setRow('prod', i, field, e.target.value)} /></td>)}</tr>)}</Table></Section><PageFooter />
          </article>

          <article className={`print-page page-two ${page === 2 ? 'screen-active' : ''}`}>
            <LogoHeader /><Section number="3.1" title="FECHAS PRODUCTIVAS"><div className="date-lines"><Field label="Fecha estimada de siembra" value={d.siembra} onChange={v => set('siembra', v)} type="date" /><Field label="Inicio cosecha" value={d.inicio} onChange={v => set('inicio', v)} type="date" /><Field label="Fin cosecha" value={d.fin} onChange={v => set('fin', v)} type="date" /></div></Section>
            <Section number="4" title="MANIFESTACIÓN DE BIENES Y ACTIVOS PRODUCTIVOS"><p className="hint">Completar los principales bienes utilizados o vinculados a la actividad declarada. Indicar valor estimado y existencia de deuda o gravamen.</p><h3>4.1 MAQUINARIAS, EQUIPOS AGRÍCOLAS, VEHÍCULOS Y RODADOS</h3>
              <Table heads={['Tipo / Equipo / Vehículo', 'Marca / Modelo', 'Año', 'Valor mercado Gs/Usd', 'Deuda / Prenda (SI/NO)']} className="assets-table">{d.bienes.map((row, i) => <EditableRow key={i} data={row} index={i} collection="bienes" fields={['tipo', 'marca', 'anio', 'valor', 'deuda']} setData={setRow} />)}</Table>
              <div className="no-print table-actions"><button className="link" onClick={() => addRow('bienes', bien)}>+ Agregar bien</button>{d.bienes.length > 1 && <button className="link danger" onClick={() => removeRow('bienes', d.bienes.length - 1)}>- Quitar última</button>}</div>
              <h3>4.2 GANADO / SEMOVIENTES</h3><Table heads={['Especie / Categoría', 'Cantidad', 'Valor unitario Gs/Usd', 'Valor total Gs/Usd', 'Gravamen (SI/NO)']} className="livestock-table">{d.ganado.map((row, i) => <EditableRow key={i} data={row} index={i} collection="ganado" fields={['especie', 'cantidad', 'unitario', 'total', 'gravamen']} setData={setRow} />)}</Table>
              <div className="no-print table-actions"><button className="link" onClick={() => addRow('ganado', ganado)}>+ Agregar ganado</button>{d.ganado.length > 1 && <button className="link danger" onClick={() => removeRow('ganado', d.ganado.length - 1)}>- Quitar última</button>}</div>
            </Section><PageFooter />
          </article>

          <article className={`print-page page-three ${page === 3 ? 'screen-active' : ''}`}>
            <LogoHeader /><Section number="5" title="REFERENCIAS"><Table heads={['ENTIDAD', 'CONTACTO', 'TELÉFONO']} className="references-table">{d.refs.map((row, i) => <tr key={row.tipo}><td><input value={row.entidad} placeholder={`${row.tipo}:`} onChange={e => setRow('refs', i, 'entidad', e.target.value)} /></td><td><input value={row.contacto} onChange={e => setRow('refs', i, 'contacto', e.target.value)} /></td><td><input value={row.telefono} onChange={e => setRow('refs', i, 'telefono', e.target.value)} /></td></tr>)}</Table></Section>
            <Section number="6" title="DECLARACIÓN Y AUTORIZACIÓN">
              <p>Declaro bajo fe de juramento que la información consignada en el presente formulario es verdadera, completa y corresponde a mi situación patrimonial y productiva a la fecha de su suscripción. Asimismo, me comprometo a informar cualquier modificación relevante de los bienes, obligaciones, garantías o situación productiva declarada.</p>
              <p>En cumplimiento de la Ley N° 6.534/20 "De Protección de Datos Personales Crediticios" y demás disposiciones concordantes, autorizo en forma expresa, libre e irrevocable a MAS FERTIL SAE, conforme al Art. 917 inc. a) del Código Civil Paraguayo, a recabar, verificar y confirmar por sí o a través de terceros habilitados, información sobre mi situación patrimonial, solvencia económica y cumplimiento de obligaciones comerciales, financieras y tributarias, ante registros públicos o empresas de información crediticia privadas, con la finalidad exclusiva de análisis de créditos u operaciones presentes o futuras.</p>
              <Table heads={['TITULAR/REPRESENTANTE LEGAL', 'RUC/CI N°']} className="declarants-table">{d.declarantes.map((row, i) => <tr key={i}><td><input value={row.titular} onChange={e => setRow('declarantes', i, 'titular', e.target.value)} /></td><td><input value={row.ruc} onChange={e => setRow('declarantes', i, 'ruc', e.target.value)} /></td></tr>)}</Table>
              <div className="signature"><div className="signature-line" /><b>TITULAR/REPRESENTANTE LEGAL</b><Field label="ACLARACION" value={d.aclaracion} onChange={v => set('aclaracion', v)} /></div>
            </Section><PageFooter />
          </article>
        </div>

        <div className="screen-navigation no-print">
          <button className="nav-prev" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>← &nbsp; Anterior</button>
          <div className="page-dots">{[1, 2, 3].map(n => <button key={n} className={page === n ? 'current' : ''} onClick={() => setPage(n)}>{n}</button>)}</div>
          <button className="nav-next" disabled={page === 3} onClick={() => setPage(p => Math.min(3, p + 1))}>Siguiente &nbsp; →</button>
        </div>
      </main>
    </div>
  </div>;
}
