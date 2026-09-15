import { useState } from 'react';

const finca = () => ({ ubicacion: '', finca: '', superficie: '', tenencia: '', valor: '', gravamen: '' });
const bien = () => ({ tipo: '', marca: '', anio: '', valor: '', deuda: '' });
const ganado = () => ({ especie: '', cantidad: '', unitario: '', total: '', gravamen: '' });
const cultivoBase = ['SOJA', 'MAIZ', 'TRIGO', 'CHIA', 'GIRASOL', 'SESAMO', 'MANI', 'CAÑA', 'PASTURA'];
const referenciaBase = ['BANCO 1', 'BANCO 2', 'PROV. 1', 'PROV. 2', 'PROV. 3'];

const nuevoEstado = () => ({
  fecha: '', tipo: 'Persona Física', nombre: '', ci: '', telefono: '', domicilio: '', email: '',
  actividad: [], fincas: [finca()], reventa: [], servicios: [],
  prod: cultivoBase.map(c => ({ cultivo: c, ant: '', rnd: '', actual: '', tn: '' })),
  siembra: '', inicio: '', fin: '', bienes: [bien()], ganado: [ganado()],
  refs: referenciaBase.map(tipo => ({ tipo, entidad: '', contacto: '', telefono: '' })),
  titular: '', ruc: '', aclaracion: ''
});

function Field({ label, value, onChange, type = 'text', className = '' }) {
  return <label className={`field ${className}`}><span>{label}</span><input type={type} value={value || ''} onChange={e => onChange(e.target.value)} /></label>;
}
function Checks({ items, value, onChange }) {
  return <div className="checks">{items.map(item => <label className="check" key={item}><input type="checkbox" checked={value.includes(item)} onChange={() => onChange(value.includes(item) ? value.filter(v => v !== item) : [...value, item])} />{item}</label>)}</div>;
}
function Section({ number, title, children }) { return <section className="section"><h2>{number}. {title}</h2>{children}</section>; }
function Table({ heads, children, className = '' }) { return <div className={`table-wrap ${className}`}><table><thead><tr>{heads.map(head => <th key={head}>{head}</th>)}</tr></thead><tbody>{children}</tbody></table></div>; }
function EditableRow({ data, index, fields, collection, setData }) {
  return <tr>{fields.map(field => <td key={field}><input value={data[field] || ''} onChange={e => setData(collection, index, field, e.target.value)} /></td>)}</tr>;
}

export default function App() {
  const [d, setD] = useState(nuevoEstado);
  const set = (key, value) => setD(prev => ({ ...prev, [key]: value }));
  const setRow = (collection, index, field, value) => setD(prev => ({ ...prev, [collection]: prev[collection].map((row, i) => i === index ? { ...row, [field]: value } : row) }));
  const addRow = (collection, factory) => setD(prev => ({ ...prev, [collection]: [...prev[collection], factory()] }));
  const removeRow = (collection, index) => setD(prev => ({ ...prev, [collection]: prev[collection].filter((_, i) => i !== index) }));

  return <>
    <div className="toolbar no-print">
      <div><b>IBC MAS FERTIL</b><small>Relevamiento Técnico Integral y Multisectorial</small></div>
      <div className="toolbar-actions"><button className="secondary" onClick={() => setD(nuevoEstado())}>NUEVO IBC</button><button onClick={() => window.print()}>GENERAR PDF / IMPRIMIR</button></div>
    </div>
    <main className="document">
      <article className="print-page">
        <header className="document-header"><div className="logo">más<span>fertil</span><small>FERTILIZANTES</small></div><div className="granu">GRANU+</div></header>
        <h1>(IBC) TÉCNICO INTEGRAL Y MULTISECTORIAL</h1>
        <Field label="FECHA" value={d.fecha} onChange={v => set('fecha', v)} type="date" className="date-field" />
        <Section number="1" title="DATOS DEL CLIENTE">
          <div className="checks client-type"><label className="check"><input type="radio" checked={d.tipo === 'Persona Física'} onChange={() => set('tipo', 'Persona Física')} /> Persona Física</label><label className="check"><input type="radio" checked={d.tipo === 'Persona Jurídica'} onChange={() => set('tipo', 'Persona Jurídica')} /> Persona Jurídica</label></div>
          <div className="grid two"><Field label="NOMBRE / RAZÓN SOCIAL" value={d.nombre} onChange={v => set('nombre', v)} /><Field label="C.I. / RUC" value={d.ci} onChange={v => set('ci', v)} /><Field label="TELÉFONO" value={d.telefono} onChange={v => set('telefono', v)} /><Field label="DOMICILIO / CIUDAD" value={d.domicilio} onChange={v => set('domicilio', v)} /><Field label="E-MAIL" value={d.email} onChange={v => set('email', v)} /></div>
        </Section>
        <Section number="2" title="PERFIL DE ACTIVIDAD Y SUPERFICIE">
          <div className="label-line">ACTIVIDAD:</div><Checks items={['Agrícola', 'Ganadera', 'Comercial/Revendedor', 'Servicios']} value={d.actividad} onChange={v => set('actividad', v)} />
          <Table heads={['Ubicación GPS/Localidad', 'Finca / Padrón / Cta. Cte./Lote/Manzana', 'Superficie ha.', 'Tenencia (Propia/Arrendada)', 'Valor estimado Gs/Usd', 'Hipoteca / Gravamen (SI/NO)']}>
            {d.fincas.map((row, i) => <EditableRow key={i} data={row} index={i} collection="fincas" fields={['ubicacion', 'finca', 'superficie', 'tenencia', 'valor', 'gravamen']} setData={setRow} />)}
          </Table>
          <div className="no-print table-actions"><button className="link" onClick={() => addRow('fincas', finca)}>+ Agregar ubicación</button>{d.fincas.length > 1 && <button className="link danger" onClick={() => removeRow('fincas', d.fincas.length - 1)}>- Quitar última</button>}</div>
        </Section>
        <Section number="2.1" title="MÓDULO COMERCIAL Y DE SERVICIOS">
          <div className="label-line">REVENTA:</div><Checks items={['Agroquímicos', 'Fertilizantes', 'Semillas']} value={d.reventa} onChange={v => set('reventa', v)} />
          <div className="label-line">SERVICIOS:</div><Checks items={['Consultoría', 'Maquinaria Pesada', 'Logística', 'Asistencia Técnica', 'Acopio Silo']} value={d.servicios} onChange={v => set('servicios', v)} />
        </Section>
        <Section number="3" title="PLAN DE PRODUCCIÓN">
          <Table heads={['CULTIVO', 'Has. ANT.', 'Rnd. Kg', 'Has. Actual', 'TN Estimada']} className="production-table">
            {d.prod.map((row, i) => <tr key={row.cultivo}><td><b>{row.cultivo}</b></td>{['ant', 'rnd', 'actual', 'tn'].map(field => <td key={field}><input value={row[field]} onChange={e => setRow('prod', i, field, e.target.value)} /></td>)}</tr>)}
          </Table>
        </Section><PageFooter />
      </article>

      <article className="print-page">
        <header className="document-header compact-header"><div className="logo">más<span>fertil</span><small>FERTILIZANTES</small></div><div className="granu">GRANU+</div></header>
        <Section number="3.1" title="FECHAS PRODUCTIVAS"><div className="grid three"><Field label="Fecha estimada de siembra" value={d.siembra} onChange={v => set('siembra', v)} type="date" /><Field label="Inicio cosecha" value={d.inicio} onChange={v => set('inicio', v)} type="date" /><Field label="Fin cosecha" value={d.fin} onChange={v => set('fin', v)} type="date" /></div></Section>
        <Section number="4" title="MANIFESTACIÓN DE BIENES Y ACTIVOS PRODUCTIVOS">
          <p className="hint">Completar los principales bienes utilizados o vinculados a la actividad declarada. Indicar valor estimado y existencia de deuda o gravamen.</p>
          <h3>4.1 MAQUINARIAS, EQUIPOS AGRÍCOLAS, VEHÍCULOS Y RODADOS</h3>
          <Table heads={['Tipo / Equipo / Vehículo', 'Marca / Modelo', 'Año', 'Valor mercado Gs/Usd', 'Deuda / Prenda (SI/NO)']}>{d.bienes.map((row, i) => <EditableRow key={i} data={row} index={i} collection="bienes" fields={['tipo', 'marca', 'anio', 'valor', 'deuda']} setData={setRow} />)}</Table>
          <div className="no-print table-actions"><button className="link" onClick={() => addRow('bienes', bien)}>+ Agregar bien</button>{d.bienes.length > 1 && <button className="link danger" onClick={() => removeRow('bienes', d.bienes.length - 1)}>- Quitar última</button>}</div>
          <h3>4.2 GANADO / SEMOVIENTES</h3>
          <Table heads={['Especie / Categoría', 'Cantidad', 'Valor unitario Gs/Usd', 'Valor total Gs/Usd', 'Gravamen (SI/NO)']}>{d.ganado.map((row, i) => <EditableRow key={i} data={row} index={i} collection="ganado" fields={['especie', 'cantidad', 'unitario', 'total', 'gravamen']} setData={setRow} />)}</Table>
          <div className="no-print table-actions"><button className="link" onClick={() => addRow('ganado', ganado)}>+ Agregar ganado</button>{d.ganado.length > 1 && <button className="link danger" onClick={() => removeRow('ganado', d.ganado.length - 1)}>- Quitar última</button>}</div>
        </Section><PageFooter />
      </article>

      <article className="print-page">
        <header className="document-header compact-header"><div className="logo">más<span>fertil</span><small>FERTILIZANTES</small></div><div className="granu">GRANU+</div></header>
        <Section number="5" title="REFERENCIAS">
          <Table heads={['ENTIDAD', 'CONTACTO', 'TELÉFONO']}>
            {d.refs.map((row, i) => <tr key={row.tipo}><td><input value={row.entidad} placeholder={row.tipo} onChange={e => setRow('refs', i, 'entidad', e.target.value)} /></td><td><input value={row.contacto} onChange={e => setRow('refs', i, 'contacto', e.target.value)} /></td><td><input value={row.telefono} onChange={e => setRow('refs', i, 'telefono', e.target.value)} /></td></tr>)}
          </Table>
        </Section>
        <Section number="6" title="DECLARACIÓN Y AUTORIZACIÓN">
          <p>Declaro bajo fe de juramento que la información consignada en el presente formulario es verdadera, completa y corresponde a mi situación patrimonial y productiva a la fecha de su suscripción. Asimismo, me comprometo a informar cualquier modificación relevante de los bienes, obligaciones, garantías o situación productiva declarada.</p>
          <p>En cumplimiento de la Ley N° 6.534/20 "De Protección de Datos Personales Crediticios" y demás disposiciones concordantes, autorizo en forma expresa, libre e irrevocable a MAS FERTIL SAE, conforme al Art. 917 inc. a) del Código Civil Paraguayo, a recabar, verificar y confirmar por sí o a través de terceros habilitados, información sobre mi situación patrimonial, solvencia económica y cumplimiento de obligaciones comerciales, financieras y tributarias, ante registros públicos o empresas de información crediticia privadas, con la finalidad exclusiva de análisis de créditos u operaciones presentes o futuras.</p>
          <div className="grid two declaration-fields"><Field label="TITULAR/REPRESENTANTE LEGAL" value={d.titular} onChange={v => set('titular', v)} /><Field label="RUC/CI N°" value={d.ruc} onChange={v => set('ruc', v)} /></div>
          <div className="signature"><div className="signature-line" /><b>TITULAR/REPRESENTANTE LEGAL</b><Field label="ACLARACION" value={d.aclaracion} onChange={v => set('aclaracion', v)} /><Field label="RUC/CI N°" value={d.ruc} onChange={v => set('ruc', v)} /></div>
        </Section><PageFooter />
      </article>
    </main>
  </>;
}
function PageFooter() { return <footer>FORM. IBCTIM. V6 MFS SETIEMBRE 26</footer>; }
