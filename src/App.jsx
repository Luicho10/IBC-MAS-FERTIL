import { useEffect, useRef, useState } from 'react';

// IBC MAS FERTIL - aplicación principal

const finca = () => ({ nombre: '', tenencia: '', departamento: '', distrito: '', cultivo: '', observaciones: '', plusCode: '', referencia: '', latitud: '', longitud: '', finca: '', superficie: '', valor: '', gravamen: '', area: '', perimetro: '', areaData: { drawing: false, points: [] } });
const bien = () => ({ tipo: '', marca: '', anio: '', valor: '', deuda: '' });
const ganado = () => ({ especie: '', cantidad: '', unitario: '', total: '', gravamen: '' });
const cultivoBase = ['SOJA', 'MAIZ', 'TRIGO', 'CHIA', 'GIRASOL', 'SESAMO', 'MANI', 'CAÑA', 'PASTURA'];
const referenciaBase = ['BANCO 1', 'BANCO 2', 'PROV. 1', 'PROV. 2', 'PROV. 3'];
const filas = (factory, cantidad) => Array.from({ length: cantidad }, factory);

const nuevoEstado = () => ({
  fecha: '', tipo: 'Persona Física', nombre: '', ci: '', telefono: '', domicilio: '', email: '',
  actividad: [], fincas: [finca()], reventa: [], servicios: [],
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

const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

function cargarLeaflet() {
  return new Promise((resolve, reject) => {
    if (window.L) return resolve(window.L);
    if (!document.querySelector('link[data-ibc-leaflet]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = LEAFLET_CSS;
      link.dataset.ibcLeaflet = 'true';
      document.head.appendChild(link);
    }
    const existente = document.querySelector('script[data-ibc-leaflet]');
    if (existente) {
      existente.addEventListener('load', () => resolve(window.L), { once: true });
      existente.addEventListener('error', reject, { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = LEAFLET_JS;
    script.async = true;
    script.dataset.ibcLeaflet = 'true';
    script.onload = () => resolve(window.L);
    script.onerror = reject;
    document.body.appendChild(script);
  });
}


const EARTH_RADIUS_M = 6371008.8;

function distanciaHaversine(p1, p2) {
  const lat1 = Number(p1?.lat) * Math.PI / 180;
  const lat2 = Number(p2?.lat) * Math.PI / 180;
  const dLat = (Number(p2?.lat) - Number(p1?.lat)) * Math.PI / 180;
  const dLon = (Number(p2?.lon) - Number(p1?.lon)) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(a)));
}

function calcularAreaPerimetro(points = []) {
  const validPoints = points
    .map(p => ({ lat: Number(p?.lat), lon: Number(p?.lon) }))
    .filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lon));

  if (validPoints.length < 3) return { areaHa: 0, perimeterM: 0 };

  const lat0 = validPoints.reduce((s, p) => s + p.lat, 0) / validPoints.length * Math.PI / 180;
  const projected = validPoints.map(p => ({
    x: EARTH_RADIUS_M * (p.lon * Math.PI / 180) * Math.cos(lat0),
    y: EARTH_RADIUS_M * (p.lat * Math.PI / 180)
  }));

  let twiceArea = 0;
  for (let i = 0; i < projected.length; i++) {
    const a = projected[i];
    const b = projected[(i + 1) % projected.length];
    twiceArea += a.x * b.y - b.x * a.y;
  }

  let perimeterM = 0;
  for (let i = 0; i < validPoints.length; i++) {
    perimeterM += distanciaHaversine(validPoints[i], validPoints[(i + 1) % validPoints.length]);
  }

  return {
    areaHa: Math.abs(twiceArea) / 2 / 10000,
    perimeterM
  };
}

function formatAreaHa(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n.toLocaleString('es-PY', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—';
}

function formatPerimetroM(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n.toLocaleString('es-PY', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '—';
}

function AreaPrintPreview({ points = [] }) {
  const validPoints = points
    .map(p => ({ lat: Number(p?.lat), lon: Number(p?.lon) }))
    .filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lon));

  if (validPoints.length < 3) return null;

  const minLat = Math.min(...validPoints.map(p => p.lat));
  const maxLat = Math.max(...validPoints.map(p => p.lat));
  const minLon = Math.min(...validPoints.map(p => p.lon));
  const maxLon = Math.max(...validPoints.map(p => p.lon));
  const spanLat = Math.max(maxLat - minLat, 0.00001);
  const spanLon = Math.max(maxLon - minLon, 0.00001);
  const width = 360;
  const height = 150;
  const pad = 18;
  const path = validPoints.map((p, i) => {
    const x = pad + ((p.lon - minLon) / spanLon) * (width - pad * 2);
    const y = height - pad - ((p.lat - minLat) / spanLat) * (height - pad * 2);
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(' ') + ' Z';

  return (
    <div className="area-print-preview">
      <div className="area-print-title">ÁREA DELIMITADA — CROQUIS</div>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Croquis del área delimitada">
        <rect x="0" y="0" width={width} height={height} className="area-print-background" />
        <path d={path} className="area-print-polygon" />
        {validPoints.map((p, i) => {
          const x = pad + ((p.lon - minLon) / spanLon) * (width - pad * 2);
          const y = height - pad - ((p.lat - minLat) / spanLat) * (height - pad * 2);
          return <circle key={i} cx={x} cy={y} r="3" className="area-print-point" />;
        })}
      </svg>
      <div className="area-print-coordinates">
        {validPoints.map((p, i) => `P${i + 1}: ${p.lat.toFixed(6)}, ${p.lon.toFixed(6)}`).join('  •  ')}
      </div>
    </div>
  );
}

function SatelliteMap({ lat, lon, area, onAreaChange, onCoordinateChange }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);
  const polygonRef = useRef(null);
  const pointMarkersRef = useRef([]);

  const la = Number(String(lat ?? '').replace(',', '.'));
  const lo = Number(String(lon ?? '').replace(',', '.'));
  const valid = Number.isFinite(la) && Number.isFinite(lo) && la >= -90 && la <= 90 && lo >= -180 && lo <= 180;
  const points = Array.isArray(area?.points) ? area.points : [];
  const pointsKey = JSON.stringify(points);
  const areaRef = useRef(area);
  const onAreaChangeRef = useRef(onAreaChange);
  const onCoordinateChangeRef = useRef(onCoordinateChange);
  areaRef.current = area;
  onAreaChangeRef.current = onAreaChange;
  onCoordinateChangeRef.current = onCoordinateChange;

  useEffect(() => {
    let cancelled = false;
    cargarLeaflet().then(L => {
      if (cancelled || !mapRef.current || mapInstance.current) return;

      const initialLat = valid ? la : -23.4425;
      const initialLon = valid ? lo : -58.4438;
      const initialZoom = valid ? 16 : 6;

      const map = L.map(mapRef.current, {
        scrollWheelZoom: true,
        zoomControl: true
      }).setView([initialLat, initialLon], initialZoom);

      const satelliteLayer = L.tileLayer(
        'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          minZoom: 1,
          maxZoom: 19,
          maxNativeZoom: 19,
          keepBuffer: 8,
          updateWhenIdle: false,
          updateWhenZooming: true,
          attribution: '&copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community'
        }
      ).addTo(map);

      satelliteLayer.on('tileerror', () => {
        setTimeout(() => satelliteLayer.redraw(), 1200);
      });

      mapInstance.current = map;

      map.on('click', e => {
        const currentArea = areaRef.current || {};
        const clicked = {
          latitud: e.latlng.lat.toFixed(6),
          longitud: e.latlng.lng.toFixed(6)
        };

        if (currentArea.drawing && !currentArea.closed) {
          const nextPoints = [
            ...(Array.isArray(currentArea.points) ? currentArea.points : []),
            { lat: Number(e.latlng.lat.toFixed(6)), lon: Number(e.latlng.lng.toFixed(6)) }
          ];
          onAreaChangeRef.current({
            ...(currentArea || {}),
            drawing: true,
            closed: false,
            points: nextPoints
          });
          return;
        }

        if (onCoordinateChangeRef.current) {
          onCoordinateChangeRef.current(clicked);
        }
      });

      const resizeObserver = new ResizeObserver(() => {
        map.invalidateSize({ pan: false, animate: false });
      });
      resizeObserver.observe(mapRef.current);

      setTimeout(() => map.invalidateSize({ pan: false, animate: false }), 100);
      setTimeout(() => map.invalidateSize({ pan: false, animate: false }), 500);
    }).catch(() => {
      if (!cancelled && mapRef.current) {
        mapRef.current.innerHTML = '<div class="map-leaflet-error">No se pudo cargar el mapa satelital. Verifique su conexión a Internet.</div>';
      }
    });

    return () => {
      cancelled = true;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapInstance.current;
    const L = window.L;
    if (!map || !L || !valid) return;

    const nueva = [la, lo];
    if (!markerRef.current) {
      markerRef.current = L.marker(nueva, { draggable: true }).addTo(map);
      markerRef.current.on('dragend', () => {
        const p = markerRef.current.getLatLng();
        const inputEvent = new CustomEvent('ibc-map-coordinate-change', {
          detail: { latitud: p.lat.toFixed(6), longitud: p.lng.toFixed(6) }
        });
        if (onCoordinateChangeRef.current) onCoordinateChangeRef.current(inputEvent.detail);
      });
    } else {
      markerRef.current.setLatLng(nueva);
    }

    markerRef.current.bindPopup(
      'Ubicación registrada<br><strong>' + la.toFixed(6) + ', ' + lo.toFixed(6) + '</strong>'
    );

    map.setView(nueva, Math.max(map.getZoom(), 16), { animate: false });

    pointMarkersRef.current.forEach(m => map.removeLayer(m));
    pointMarkersRef.current = [];

    if (polygonRef.current) {
      map.removeLayer(polygonRef.current);
      polygonRef.current = null;
    }

    if (points.length) {
      pointMarkersRef.current = points.map(p =>
        L.circleMarker([Number(p.lat), Number(p.lon)], {
          radius: 4,
          weight: 2,
          fillOpacity: 0.9
        }).addTo(map)
      );

      if (points.length >= 2) {
        polygonRef.current = L.polygon(
          points.map(p => [Number(p.lat), Number(p.lon)]),
          { weight: 3, fillOpacity: 0.24 }
        ).addTo(map);
      }
    }

    setTimeout(() => map.invalidateSize(), 50);
  }, [lat, lon, pointsKey, area?.drawing, area?.closed]);

  return (
    <div className="satellite-map-container">
      <div ref={mapRef} className="ibc-leaflet-map" aria-label="Mapa satelital para verificar la ubicación" />
      <div className="map-layer">Mapa satelital</div>
    </div>
  );
}
function openMap(lat, lon) {
  if (lat && lon) window.open(`https://www.google.com/maps/@${lat},${lon},16z/data=!3m1!1e3`, '_blank');
}
function LocationMap({ row, onAreaChange, onCoordinateChange }) {
  const initial = row.areaData || { drawing: false, closed: false, points: [] };
  const coordinateCallback = onCoordinateChange || (() => {});
  const [drawing, setDrawing] = useState(Boolean(initial.drawing));
  const [closed, setClosed] = useState(Boolean(initial.closed));
  const [points, setPoints] = useState(Array.isArray(initial.points) ? initial.points : []);

  const saveArea = (nextDrawing, nextClosed, nextPoints) => {
    const metrics = calcularAreaPerimetro(nextPoints);
    setDrawing(nextDrawing);
    setClosed(nextClosed);
    setPoints(nextPoints);
    onAreaChange({
      drawing: nextDrawing,
      closed: nextClosed,
      points: nextPoints,
      areaHa: metrics.areaHa,
      perimeterM: metrics.perimeterM
    });
  };

  const startDrawing = () => saveArea(true, false, points);

  const closeDrawing = () => {
    if (points.length < 3) return;
    saveArea(false, true, points);
  };

  const clearDrawing = () => saveArea(false, false, []);

  const handleMapArea = next => {
    if (!drawing || closed) return;
    const nextPoints = Array.isArray(next?.points) ? next.points : points;
    saveArea(true, false, nextPoints);
  };

  const metrics = calcularAreaPerimetro(points);

  return <div className="map-verification">
    <div className="map-title">
      <div>
        <b>VERIFICACIÓN DE UBICACIÓN</b>
        <small>Haga clic sobre el mapa para marcar manualmente la ubicación.</small>
      </div>
      <button type="button" className="map-satellite-pill">Mapa satelital</button>
    </div>

    <SatelliteMap
      lat={row.latitud}
      lon={row.longitud}
      area={{ drawing, closed, points }}
      onAreaChange={handleMapArea}
      onCoordinateChange={v => {
        coordinateCallback(v);
      }}
    />

    <div className="map-status">
      {drawing
        ? 'Modo delimitación activo: haga clic sobre el mapa para agregar puntos.'
        : closed
          ? 'Área cerrada. Puede borrar el área y volver a delimitar.'
          : 'Seleccione “Delimitar área” para comenzar.'}
    </div>

    <div className="map-actions">
      <button type="button" className={`area-btn ${drawing ? 'active' : ''}`} onClick={startDrawing}>▱ Delimitar área</button>
      <button type="button" className="area-btn secondary" onClick={closeDrawing}>Cerrar área</button>
      <button type="button" className="area-delete" onClick={clearDrawing}>Borrar área</button>
    </div>

    <div className="area-results">
      <label><span>Área delimitada (ha)</span><strong>{formatAreaHa(metrics.areaHa)}</strong></label>
      <label><span>Perímetro</span><strong>{formatPerimetroM(metrics.perimeterM)}{metrics.perimeterM > 0 ? ' m' : ''}</strong></label>
    </div>
  </div>;
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

const PLUS_ALPHABET = '23456789CFGHJMPQRVWX';
const PLUS_RESOLUTIONS = [20, 1, 0.05, 0.0025, 0.000125];

function encodePlusCode(lat, lon) {
  let la = Number(lat);
  let lo = Number(lon);
  if (!Number.isFinite(la) || !Number.isFinite(lo)) return null;
  la = Math.max(-90, Math.min(90, la)) + 90;
  lo = ((lo + 180) % 360 + 360) % 360;
  let code = '';
  for (let i = 0; i < PLUS_RESOLUTIONS.length; i++) {
    const r = PLUS_RESOLUTIONS[i];
    const latDigit = Math.min(19, Math.floor(la / r));
    const lonDigit = Math.min(19, Math.floor(lo / r));
    code += PLUS_ALPHABET[latDigit] + PLUS_ALPHABET[lonDigit];
    la -= latDigit * r;
    lo -= lonDigit * r;
  }
  return code.slice(0, 8) + '+' + code.slice(8, 10);
}

function decodePlusCode(fullCode) {
  const raw = String(fullCode || '').trim().toUpperCase().replace(/\\s/g, '');
  const plus = raw.indexOf('+');
  if (plus < 0) return null;
  const code = raw.replace('+', '');
  if (code.length < 8) return null;
  const digits = code.slice(0, 10);
  let lat = -90, lon = -180;
  for (let i = 0; i < 10; i += 2) {
    const a = PLUS_ALPHABET.indexOf(digits[i]);
    const b = PLUS_ALPHABET.indexOf(digits[i + 1]);
    if (a < 0 || b < 0) return null;
    const r = PLUS_RESOLUTIONS[i / 2];
    lat += a * r;
    lon += b * r;
  }
  const r = PLUS_RESOLUTIONS[4];
  return { latitud: (lat + r / 2).toFixed(6), longitud: (lon + r / 2).toFixed(6) };
}

async function geocodeLocality(ref) {
  const query = String(ref || '').trim();
  if (!query) return null;
  const providers = [
    'https://photon.komoot.io/api/?limit=1&q=' + encodeURIComponent(query + ', Paraguay'),
    'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=py&q=' + encodeURIComponent(query)
  ];
  for (const url of providers) {
    try {
      const response = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!response.ok) continue;
      const data = await response.json();
      const item = Array.isArray(data) ? data[0] : data?.features?.[0];
      const lat = Number(item?.lat ?? item?.geometry?.coordinates?.[1]);
      const lon = Number(item?.lon ?? item?.geometry?.coordinates?.[0]);
      if (Number.isFinite(lat) && Number.isFinite(lon)) return { lat, lon };
    } catch {}
  }
  return null;
}

async function convertirPlusCode(codigo, referencia = '') {
  const raw = String(codigo || '').trim().toUpperCase().replace(/\\s/g, '');
  const plus = raw.indexOf('+');
  if (plus < 0) return { error: 'El Plus Code debe contener el signo +.' };
  const before = raw.slice(0, plus);
  if (before.length >= 8) {
    const result = decodePlusCode(raw);
    return result || { error: 'El Plus Code completo no es válido.' };
  }
  if (before.length < 4) return { error: 'El Plus Code corto no es válido.' };

  const ref = String(referencia || '').trim();
  if (!ref) return { error: 'Complete la Referencia de localidad.' };

  const location = await geocodeLocality(ref);
  if (!location) {
    return { error: 'No se pudo localizar la referencia de localidad. Verifique que incluya localidad, distrito y departamento.' };
  }

  // Recover the missing leading characters of the short code around the
  // geocoded reference area. Try the nearest possible prefixes and select
  // the decoded cell closest to the reference point.
  const missing = 8 - before.length;
  const refCode = encodePlusCode(location.lat, location.lon);
  if (!refCode) return { error: 'No se pudo obtener la coordenada de referencia.' };
  const suffix = raw.slice(plus + 1);
  let best = null;
  const alphabet = PLUS_ALPHABET;
  const total = alphabet.length ** missing;
  for (let n = 0; n < total; n++) {
    let x = n, prefix = '';
    for (let j = 0; j < missing; j++) {
      prefix = alphabet[x % alphabet.length] + prefix;
      x = Math.floor(x / alphabet.length);
    }
    const candidate = prefix + before + '+' + suffix;
    const decoded = decodePlusCode(candidate);
    if (!decoded) continue;
    const dLat = Number(decoded.latitud) - location.lat;
    const dLon = Number(decoded.longitud) - location.lon;
    const dist = dLat * dLat + dLon * dLon;
    if (!best || dist < best.dist) best = { dist, result: decoded };
  }
  return best?.result || { error: 'No se pudo recuperar el Plus Code corto.' };
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
                  <div className="location-model-grid">
                    <div><Field label="Nombre / identificación" value={row.nombre} onChange={v=>setRow('fincas',i,'nombre',v)} placeholder="Ej.: Finca San José"/></div>
                    <div><label className="field"><span>Tenencia</span><select value={row.tenencia||''} onChange={e=>setRow('fincas',i,'tenencia',e.target.value)}><option value="">Seleccione</option><option>Propia</option><option>Arrendada</option><option>Comodato</option><option>Otra</option></select></label></div>
                    <div><Field label="Superficie (ha)" value={row.superficie} onChange={v=>setRow('fincas',i,'superficie',v)} placeholder="Ej.: 180"/></div>
                    <div><Field label="Departamento" value={row.departamento} onChange={v=>setRow('fincas',i,'departamento',v)}/></div>
                    <div><Field label="Distrito" value={row.distrito} onChange={v=>setRow('fincas',i,'distrito',v)}/></div>
                    <div><Field label="Cultivo / actividad" value={row.cultivo} onChange={v=>setRow('fincas',i,'cultivo',v)} placeholder="Ej.: Soja"/></div>
                  </div>
                  <div className="location-registry"><Field label="Finca / Padrón / Cta. Cte. / Lote / Manzana" value={row.finca} onChange={v=>setRow('fincas',i,'finca',v)}/></div>
                  <div className="location-gps">
                    <div className="location-gps-head"><b>UBICACIÓN GPS / LOCALIDAD</b><button className="gps-current" onClick={() => obtenerUbicacion(i)}>Obtener ubicación actual</button></div>
                    <div className="location-gps-grid">
                      <Field label="Plus Code compartido" value={row.plusCode} onChange={v => setRow('fincas', i, 'plusCode', v)} placeholder="Ej.: 86Q8+PF" />
                      <div className="reference-plus-field"><Field label="Referencia de localidad" value={row.referencia} onChange={v => setRow('fincas', i, 'referencia', v)} placeholder="Ej.: 3 de Noviembre 2da Línea, Repatriación, Caaguazú" /><button type="button" className="plus-convert" onClick={async () => { const r=await convertirPlusCode(row.plusCode,row.referencia); if(r?.latitud && r?.longitud){setRow('fincas',i,'latitud',r.latitud);setRow('fincas',i,'longitud',r.longitud);setRow('fincas',i,'mapRefresh',Date.now());} else { alert(r?.error || 'No se pudo convertir el Plus Code.'); } }}>Convertir Plus Code</button></div>
                    </div>
                    <div className="gps-row-secondary">
                      <Field label="Latitud" value={row.latitud} onChange={v => setRow('fincas', i, 'latitud', v)} />
                      <Field label="Longitud" value={row.longitud} onChange={v => setRow('fincas', i, 'longitud', v)} />
                    </div>
                    <div className="gps-actions"><button className="gps-search" onClick={() => setRow('fincas', i, 'mapRefresh', Date.now())}>Buscar ubicación por coordenadas</button><span>Puede ingresar las coordenadas compartidas por el cliente o utilizar el GPS del dispositivo.</span></div>
                    <LocationMap
                      row={row}
                      onAreaChange={v=>setRow('fincas',i,'areaData',v)}
                      onCoordinateChange={v => {
                        setRow('fincas', i, 'latitud', v.latitud);
                        setRow('fincas', i, 'longitud', v.longitud);
                      }}
                    />
                    <Field label="Observaciones" value={row.observaciones} onChange={v=>setRow('fincas', i, 'observaciones', v)} placeholder="Referencia de acceso, camino, colonia, etc." />
                  </div>
                </div>)}
              </div>
              <div className="locations-print">
                <Table heads={['Ubicación GPS / Localidad', 'Finca / Padrón / Cta. Cte. / Lote / Manzana', 'Superficie ha.', 'Tenencia', 'Valor estimado Gs/Usd', 'Hipoteca / Gravamen']}>
                  {d.fincas.map((row, i) => <tr key={i}><td>{row.referencia || row.nombre || (row.latitud + ' / ' + row.longitud)}</td><td>{row.finca}</td><td>{row.superficie}</td><td>{row.tenencia}</td><td>{row.valor}</td><td>{row.gravamen}</td></tr>)}
                </Table>
                {d.fincas.map((row, i) => {
                  const metrics = calcularAreaPerimetro(row.areaData?.points || []);
                  return <div className="print-location-detail" key={`print-location-${i}`}>
                    <div className="print-location-heading">FINCA / UNIDAD PRODUCTIVA {i + 1}</div>
                    <div className="print-location-metrics">
                      <span><b>Área delimitada:</b> {formatAreaHa(metrics.areaHa)} ha</span>
                      <span><b>Perímetro:</b> {formatPerimetroM(metrics.perimeterM)} m</span>
                      <span><b>Latitud:</b> {row.latitud || '—'}</span>
                      <span><b>Longitud:</b> {row.longitud || '—'}</span>
                    </div>
                    <AreaPrintPreview points={row.areaData?.points || []} />
                    {row.observaciones && <div className="print-observations"><b>Observaciones:</b> {row.observaciones}</div>}
                  </div>;
                })}
              </div>
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
