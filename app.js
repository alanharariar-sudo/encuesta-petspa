/* Encuesta de satisfacción PetSpa — tablet de recepción + resultados + ajustes */
'use strict';

const SUPABASE_URL = 'https://ivfvxppakrshvmxxsiaz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_0OTpmxLEl2xns_y6N5G-pg_rCuGFnAC';
const DOMINIO_USUARIOS = '@petspa-encuestas.local';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, storageKey: 'petspa-encuestas-auth' }
});

/* ------------------------------------------------------------------ */
/* Ajustes por defecto (se combinan con lo guardado en la base)        */
/* ------------------------------------------------------------------ */
const DEF = {
  preguntas: [
    { id: 'espera', texto: 'Tiempo de espera al llegar', icono: 'reloj', activa: true,
      motivos: ['Esperé mucho para que me atendieran', 'No había nadie para recibirme'] },
    { id: 'recepcion', texto: 'Cómo te recibimos a ti y a tu perrito', icono: 'corazon', activa: true,
      motivos: ['Mala atención del personal', 'Instalaciones sucias', 'No me explicaron el servicio'] },
    { id: 'calidad', texto: 'Calidad del servicio', icono: 'tijeras', activa: true,
      motivos: ['Perro húmedo o mal secado', 'Corte distinto al que pedí', 'Mal olor', 'Servicio incompleto'] },
    { id: 'estado', texto: 'Cómo te entregamos a tu perrito', icono: 'huella', activa: true,
      motivos: ['Llegó estresado o nervioso', 'Tiene irritación o alguna cortadita', 'No quedó limpio'] },
    { id: 'entrega', texto: 'Tiempo de entrega', icono: 'check', activa: true,
      motivos: ['Demora en la entrega', 'No me avisaron que estaba listo'] },
    { id: 'precio', texto: 'Precio', icono: 'etiqueta', activa: true,
      motivos: ['Caro para lo que recibí', 'Me cobraron algo que no esperaba'] }
  ],
  recomendar: { activa: true, texto: '¿Nos recomendarías con tus amigos?' },
  lo_mejor: { activa: true, opciones: ['El trato a mi perrito', 'Cómo quedó el corte', 'La rapidez', 'La atención en recepción', 'Las instalaciones'] },
  comentario: true,
  folio_obligatorio: true,
  dias_entre_encuestas: 30,
  rechazos_sugerir: 2,
  verificar_cada: 7,
  segundos_sospechosos: 12,
  inactividad_seg: 120,
  regalos: {
    activos: true, vigencia_dias: 60, whatsapp_spa: '',
    opciones: ['Shampoo premium gratis', 'Cepillado bucal', 'Bolsa de premios']
  },
  mensajes: {
    insatisfecho: 'Hola {cliente}, te escribimos de PetSpa. Vimos que la visita de {mascota} no fue lo que esperabas y queremos arreglarlo. ¿Nos cuentas qué pasó?',
    no_contesto: 'Hola {cliente}, gracias por traer a {mascota} a PetSpa. Del 1 al 5, ¿qué tan contento quedaste con el servicio? Tu opinión nos ayuda mucho.',
    verificacion: 'Hola {cliente}, te escribimos de PetSpa. ¿Nos confirmas que el {fecha} contestaste nuestra encuesta en recepción por el servicio de {mascota}? ¡Gracias!',
    codigo: '¡Hola {cliente}! Este es tu código de regalo de PetSpa: {codigo} ({regalo}) para la próxima visita de {mascota}. Válido hasta el {vence}.',
    guardar_codigo: 'Hola PetSpa, guardo aquí mi código de regalo {codigo} ({regalo}). Válido hasta el {vence}.'
  }
};

const ESCALA = [
  { v: 1, t: 'Muy mal', c: '#e5534b' },
  { v: 2, t: 'Mal', c: '#f59a5b' },
  { v: 3, t: 'Bien', c: '#7cc47a' },
  { v: 4, t: 'Excelente', c: '#2fa86a' }
];
const CHART = { 1: '#d03b3b', 2: '#ec835a', 3: '#86b6ef', 4: '#2a78d6' };
const ICON_BG = {
  reloj: ['#fff1e6', '#e07b39'], corazon: ['#ffe9ee', '#e0456b'], tijeras: ['#e7f1ff', '#2f6fd0'],
  huella: ['#fff4dc', '#c98a12'], check: ['#e3f4f2', '#1b8f86'], etiqueta: ['#f1ebff', '#7653d6'],
  estrella: ['#fff6d6', '#d39b00'], regalo: ['#ffeee8', '#ff7a59']
};

/* ------------------------------------------------------------------ */
/* Íconos e ilustraciones                                               */
/* ------------------------------------------------------------------ */
const ICONS = {
  reloj: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2"/><path d="M9 2h6"/></svg>',
  corazon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.3 3 4.5 6.7 4.5c2.1 0 3.6 1.1 4.3 2.4.7-1.3 2.2-2.4 4.3-2.4 3.7 0 5.8 3.8 4.3 7.2C19.5 16.4 12 21 12 21z"/></svg>',
  tijeras: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12"/></svg>',
  huella: '<svg viewBox="0 0 24 24" fill="currentColor"><ellipse cx="6" cy="9.5" rx="2.1" ry="2.7"/><ellipse cx="10" cy="5.5" rx="2.1" ry="2.8"/><ellipse cx="14.5" cy="5.5" rx="2.1" ry="2.8"/><ellipse cx="18.4" cy="9.5" rx="2.1" ry="2.7"/><path d="M12.2 11.2c-2.6 0-6 3.6-6 6.3 0 1.9 1.6 2.8 3.2 2.5 1.2-.2 1.8-.7 2.8-.7s1.6.5 2.8.7c1.6.3 3.2-.6 3.2-2.5 0-2.7-3.4-6.3-6-6.3z"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8 12.5 2.7 2.7L16.5 9.5"/></svg>',
  etiqueta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.4" fill="currentColor"/></svg>',
  estrella: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="m12 2.8 2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z"/></svg>',
  regalo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5"/></svg>',
  gota: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.7s6.5 7 6.5 11.6a6.5 6.5 0 0 1-13 0C5.5 9.7 12 2.7 12 2.7z"/><path d="M9 14.5a3 3 0 0 0 3 3"/></svg>',
  diente: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3c-2.5 0-4 2-4 4.5 0 3 1.5 4.5 2 7 .5 2.6 1 6.5 3 6.5s1.6-5 4-5 2 5 4 5 2.5-3.9 3-6.5c.5-2.5 2-4 2-7C21 5 19.5 3 17 3c-2 0-3 1-5 1S9 3 7 3z"/></svg>',
  wa: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.1.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3z"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6 8.5 7 8.5-7"/></svg>',
  subir: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3M7 8l5-5 5 5"/><path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/></svg>',
  alerta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',
  descargar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>'
};
function giftIcon(nombre) {
  const n = (nombre || '').toLowerCase();
  if (n.includes('dent') || n.includes('diente') || n.includes('bucal')) return ICONS.diente;
  if (n.includes('premio') || n.includes('bolsa')) return ICONS.regalo;
  if (n.includes('uña') || n.includes('una') || n.includes('corte')) return ICONS.tijeras;
  if (n.includes('shampoo') || n.includes('baño') || n.includes('champ')) return ICONS.gota;
  return ICONS.regalo;
}

const ILLUSTRATION = `
<svg class="ill" viewBox="0 0 320 200" role="img" aria-label="Perrito feliz con burbujas de spa">
  <ellipse cx="160" cy="186" rx="96" ry="10" fill="#efe6da"/>
  <g fill="#cfeaf6" stroke="#9fd2ea" stroke-width="2">
    <circle cx="52" cy="70" r="16"/><circle cx="34" cy="112" r="9"/><circle cx="272" cy="58" r="13"/>
    <circle cx="292" cy="104" r="8"/><circle cx="248" cy="24" r="6"/><circle cx="74" cy="30" r="7"/>
  </g>
  <g fill="#fff" opacity=".9"><circle cx="47" cy="65" r="4"/><circle cx="268" cy="54" r="3"/></g>
  <path d="M104 182c-6-42 18-74 56-74s62 32 56 74z" fill="#e9b97a"/>
  <path d="M136 182c2-22 10-36 24-36s22 14 24 36z" fill="#fbe6c8"/>
  <path d="M96 64c-22 4-32 40-20 70 6 14 22 10 26-4 4-16 4-46-6-66z" fill="#a8723f"/>
  <path d="M224 64c22 4 32 40 20 70-6 14-22 10-26-4-4-16-4-46 6-66z" fill="#a8723f"/>
  <ellipse cx="160" cy="92" rx="66" ry="60" fill="#e9b97a"/>
  <ellipse cx="160" cy="118" rx="38" ry="30" fill="#fbe6c8"/>
  <g fill="#fff" stroke="#e8eef3" stroke-width="2">
    <circle cx="128" cy="40" r="16"/><circle cx="150" cy="30" r="19"/><circle cx="174" cy="32" r="17"/><circle cx="194" cy="42" r="14"/><circle cx="112" cy="50" r="10"/>
  </g>
  <circle cx="136" cy="88" r="8" fill="#2b2420"/><circle cx="184" cy="88" r="8" fill="#2b2420"/>
  <circle cx="139" cy="85" r="2.6" fill="#fff"/><circle cx="187" cy="85" r="2.6" fill="#fff"/>
  <ellipse cx="160" cy="108" rx="11" ry="8" fill="#2b2420"/>
  <path d="M146 122c6 8 22 8 28 0" fill="none" stroke="#2b2420" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M155 126c0 12 10 12 10 0z" fill="#ef7f8f"/>
  <circle cx="120" cy="108" r="7" fill="#f4a3a3" opacity=".55"/><circle cx="200" cy="108" r="7" fill="#f4a3a3" opacity=".55"/>
</svg>`;

const LOGO = `<svg viewBox="0 0 32 32"><rect width="32" height="32" rx="9" fill="#1b8f86"/><g fill="#fff" transform="translate(4 4)">${ICONS.huella.replace(/<\/?svg[^>]*>/g, '')}</g></svg>`;

function face(v) {
  const c = ESCALA[v - 1].c;
  const mouths = {
    1: '<path d="M22 46c5-8 15-8 20 0" fill="none" stroke="#3a2a22" stroke-width="3.5" stroke-linecap="round"/>',
    2: '<path d="M23 44c5-3 13-3 18 0" fill="none" stroke="#3a2a22" stroke-width="3.5" stroke-linecap="round"/>',
    3: '<path d="M22 40c5 5 15 5 20 0" fill="none" stroke="#3a2a22" stroke-width="3.5" stroke-linecap="round"/>',
    4: '<path d="M19 37c3 12 23 12 26 0z" fill="#3a2a22"/><path d="M26 44c3 3 9 3 12 0" fill="#ef7f8f"/>'
  };
  const brows = v === 1 ? '<path d="M18 21l8 3M46 21l-8 3" stroke="#3a2a22" stroke-width="3" stroke-linecap="round"/>' : '';
  return `<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="29" fill="${c}"/><circle cx="32" cy="32" r="29" fill="#fff" opacity=".18"/>${brows}<circle cx="23" cy="28" r="3.6" fill="#3a2a22"/><circle cx="41" cy="28" r="3.6" fill="#3a2a22"/>${mouths[v]}</svg>`;
}

/* ------------------------------------------------------------------ */
/* Utilidades                                                           */
/* ------------------------------------------------------------------ */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pct = (a, b) => (b ? Math.round((a / b) * 100) : null);
const pctTxt = (a, b) => (b ? `${Math.round((a / b) * 100)}%` : '—');
const pad = (n) => String(n).padStart(2, '0');
function ymd(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function hoy() { return ymd(new Date()); }
function parseYmd(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }
function addDays(s, n) { const d = parseYmd(s); d.setDate(d.getDate() + n); return ymd(d); }
function diffDays(a, b) { return Math.round((parseYmd(b) - parseYmd(a)) / 86400000); }
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
function fFecha(s) { if (!s) return ''; const d = parseYmd(String(s).slice(0, 10)); return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`; }
function fFechaCorta(s) { if (!s) return ''; const d = parseYmd(String(s).slice(0, 10)); return `${d.getDate()} ${MESES[d.getMonth()]}`; }
function fechaLocalDeTs(ts) { return ymd(new Date(ts)); }
function normTel(t) {
  let d = String(t ?? '').replace(/\D/g, '');
  if (d.length > 10) d = d.slice(-10);
  return d.length === 10 ? d : '';
}
function waLink(tel, msg) {
  const d = String(tel || '').replace(/\D/g, '');
  const full = d.length === 10 ? '52' + d : d;
  return `https://wa.me/${full}?text=${encodeURIComponent(msg)}`;
}
function fill(tpl, v) { return String(tpl || '').replace(/\{(\w+)\}/g, (m, k) => (v[k] ?? '').toString() || m.replace(/[{}]/g, '')); }
function primerNombre(n) { return String(n || '').trim().split(/\s+/)[0] || ''; }
function toast(msg, err = false) {
  const t = document.createElement('div');
  t.className = 'toast' + (err ? ' err' : '');
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), err ? 5200 : 2800);
}
function lsGet(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } }
function errMsg(e) {
  const m = (e && (e.message || e.error_description)) || String(e);
  if (/encuestas_folio_uq|duplicate key.*folio/i.test(m)) return 'Ese folio ya tiene una encuesta registrada.';
  if (/Failed to fetch|NetworkError|network/i.test(m)) return 'Sin conexión a internet. Revisa el wifi e intenta de nuevo.';
  if (/Invalid login/i.test(m)) return 'Usuario o contraseña incorrectos.';
  return m;
}
function nuevoCodigo() {
  const a = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let s = 'PS-';
  const r = new Uint32Array(4); crypto.getRandomValues(r);
  for (const x of r) s += a[x % a.length];
  return s;
}

/* ------------------------------------------------------------------ */
/* Estado                                                               */
/* ------------------------------------------------------------------ */
const S = {
  user: null, rol: null, nombre: '',
  aj: structuredClone(DEF),
  estilistas: [], servicios: [],
  tab: 'encuesta',
  citas: [], citaInfo: {}, selCita: null,
  form: { servicio: '', estilista: '', mascota: '', cliente: '', telefono: '', folio: '', cita_id: null },
  freq: null,
  alerts: lsGet('petspa-alertas', []),
  res: { periodo: 'quincena', desde: null, hasta: null, demo: false, data: null },
  k: null
};

function mergeAjustes(d) {
  d = d || {};
  const a = structuredClone(DEF);
  for (const k of Object.keys(d)) {
    if (d[k] && typeof d[k] === 'object' && !Array.isArray(d[k]) && a[k] && typeof a[k] === 'object' && !Array.isArray(a[k])) a[k] = { ...a[k], ...d[k] };
    else if (d[k] !== undefined && d[k] !== null) a[k] = d[k];
  }
  return a;
}
const preguntasActivas = () => S.aj.preguntas.filter((p) => p.activa);

/* ------------------------------------------------------------------ */
/* Arranque y sesión                                                    */
/* ------------------------------------------------------------------ */
async function boot() {
  const { data } = await sb.auth.getSession();
  if (!data.session) return renderLogin();
  S.user = data.session.user;
  const { data: p, error } = await sb.from('perfiles').select('rol,nombre').eq('user_id', S.user.id).maybeSingle();
  if (error) return renderLogin(errMsg(error));
  if (!p) return renderLogin('Esta cuenta no tiene permisos en el sistema de encuestas.');
  S.rol = p.rol; S.nombre = p.nombre || S.user.email;
  await cargarCatalogos();
  S.tab = 'encuesta';
  render();
  cargarCitas();
}

async function cargarCatalogos() {
  const [aj, es, se] = await Promise.all([
    sb.from('ajustes').select('datos').eq('id', 1).maybeSingle(),
    sb.from('estilistas').select('*').order('nombre'),
    sb.from('servicios').select('*').order('nombre')
  ]);
  S.aj = mergeAjustes(aj.data && aj.data.datos);
  S.estilistas = es.data || [];
  S.servicios = se.data || [];
}

function renderLogin(msg) {
  document.body.classList.remove('kiosk');
  $('#app').innerHTML = `
  <div class="login"><div class="card">
    ${ILLUSTRATION}
    <h2>Encuesta PetSpa</h2>
    <p class="muted" style="margin:6px 0 0">Inicia sesión una sola vez en esta tablet.</p>
    ${msg ? `<div class="notice bad" style="margin-top:12px">${esc(msg)}</div>` : ''}
    <form id="loginForm">
      <label class="f">Usuario o correo<input type="text" name="u" autocomplete="username" autocapitalize="off" required></label>
      <label class="f">Contraseña<input type="password" name="p" autocomplete="current-password" required></label>
      <button class="btn primary big" type="submit">Entrar</button>
    </form>
  </div></div>`;
  $('#loginForm').onsubmit = async (e) => {
    e.preventDefault();
    const f = e.target;
    let u = f.u.value.trim().toLowerCase();
    if (!u.includes('@')) u += DOMINIO_USUARIOS;
    const b = f.querySelector('button'); b.disabled = true; b.textContent = 'Entrando…';
    const { error } = await sb.auth.signInWithPassword({ email: u, password: f.p.value });
    if (error) { renderLogin(errMsg(error)); return; }
    boot();
  };
}

async function logout() {
  if (!confirm('¿Cerrar sesión en esta tablet?')) return;
  await sb.auth.signOut();
  location.reload();
}

/* ------------------------------------------------------------------ */
/* Render general                                                       */
/* ------------------------------------------------------------------ */
function render() {
  const admin = S.rol === 'admin';
  const tabs = [['encuesta', 'Encuesta']];
  if (admin) tabs.push(['resultados', 'Resultados'], ['ajustes', 'Ajustes']);
  $('#app').innerHTML = `
  <header class="topbar">
    <div class="logo">${LOGO}<span>PetSpa</span></div>
    <nav class="tabs">${tabs.map(([k, t]) => `<button class="tab ${S.tab === k ? 'on' : ''}" data-tab="${k}">${t}</button>`).join('')}</nav>
    <div class="spacer"></div>
    <span class="who">${esc(S.nombre)}</span>
    <button class="btn small ghost" id="btnSalir">Salir</button>
  </header>
  <main id="main"></main>`;
  $$('.tab').forEach((b) => (b.onclick = () => { S.tab = b.dataset.tab; render(); }));
  $('#btnSalir').onclick = logout;
  if (S.tab === 'encuesta') renderEncuesta();
  else if (S.tab === 'resultados') renderResultados();
  else if (S.tab === 'ajustes') renderAjustes();
}

/* ================================================================== */
/* PANTALLA DEL PERSONAL                                                */
/* ================================================================== */
function renderEncuesta() {
  const m = $('#main');
  m.innerHTML = `
  <div id="alertas"></div>
  <div class="grid2">
    <div>
      <section class="card" id="cardCitas"></section>
      <section class="card" id="cardForm"></section>
    </div>
    <div>
      <section class="card" id="cardCanje"></section>
      <section class="card" id="cardEnvios"></section>
    </div>
  </div>`;
  renderAlertas();
  renderCitas();
  renderForm();
  renderCanje();
  cargarEnvios();
}

function renderAlertas() {
  const el = $('#alertas'); if (!el) return;
  el.innerHTML = S.alerts.map((a, i) => `
    <div class="notice bad" style="margin-bottom:12px">
      <span style="width:22px;flex:none">${ICONS.alerta}</span>
      <div class="grow">Cliente insatisfecho: <b>${esc(a.mascota)}</b>${a.cliente ? ` (${esc(a.cliente)})` : ''} calificó ${esc(a.detalle)}.
        <div style="font-weight:600;margin-top:2px">Pide a un encargado que hable con el cliente antes de que se vaya.</div></div>
      <button class="btn small" data-cerrar="${i}">Enterado</button>
    </div>`).join('');
  $$('[data-cerrar]', el).forEach((b) => (b.onclick = () => { S.alerts.splice(+b.dataset.cerrar, 1); lsSet('petspa-alertas', S.alerts); renderAlertas(); }));
}

/* ---------- citas del día ---------- */
async function cargarCitas() {
  const f = hoy();
  const { data: citas, error } = await sb.from('citas').select('*').eq('fecha', f).order('hora');
  if (error) { toast(errMsg(error), true); return; }
  S.citas = citas || [];
  const ids = S.citas.map((c) => c.id);
  const tels = [...new Set(S.citas.map((c) => c.telefono).filter(Boolean))];
  const info = {};
  if (ids.length) {
    const { data: enc } = await sb.from('encuestas').select('cita_id,estado').in('cita_id', ids);
    (enc || []).forEach((e) => { info[e.cita_id] = { ...(info[e.cita_id] || {}), hecha: e.estado }; });
  }
  if (tels.length) {
    const desde = addDays(f, -S.aj.dias_entre_encuestas);
    const [{ data: prev }, { data: cli }] = await Promise.all([
      sb.from('encuestas').select('telefono,fecha,estado').in('telefono', tels).eq('estado', 'contesto').gte('fecha', desde).lt('fecha', f),
      sb.from('clientes').select('telefono,no_encuestar').in('telefono', tels)
    ]);
    const noEnc = new Set((cli || []).filter((c) => c.no_encuestar).map((c) => c.telefono));
    const ult = {};
    (prev || []).forEach((e) => { if (!ult[e.telefono] || e.fecha > ult[e.telefono]) ult[e.telefono] = e.fecha; });
    S.citas.forEach((c) => {
      const i = info[c.id] || {};
      if (c.telefono && noEnc.has(c.telefono)) i.noEnc = true;
      if (c.telefono && ult[c.telefono]) i.reciente = diffDays(ult[c.telefono], f);
      info[c.id] = i;
    });
  }
  S.citaInfo = info;
  renderCitas();
}

function renderCitas() {
  const el = $('#cardCitas'); if (!el) return;
  const total = S.citas.length;
  const aplica = S.citas.filter((c) => { const i = S.citaInfo[c.id] || {}; return !i.noEnc && i.reciente === undefined; });
  const aplicaHechas = aplica.filter((c) => (S.citaInfo[c.id] || {}).hecha === 'contesto').length;
  el.innerHTML = `
    <div class="row between">
      <div><h2>Citas de hoy</h2><div class="tiny">${fFecha(hoy())}</div></div>
      <div class="row">
        <button class="btn small" id="btnCitaManual">+ Agregar cita</button>
        <label class="btn small" style="cursor:pointer">${ICONS.subir} Subir citas de AgendaPro
          <input type="file" id="fileAgenda" accept=".xlsx,.xls,.csv" hidden></label>
      </div>
    </div>
    ${total ? `
      <div style="margin:12px 0 10px">
        <div class="row between tiny" style="margin-bottom:5px"><span><b style="color:var(--ink)">${aplicaHechas} de ${aplica.length}</b> con encuesta</span>
        <span>${total - aplica.length ? `${total - aplica.length} no aplican hoy` : ''}</span></div>
        <div class="progress-line"><i style="width:${aplica.length ? (aplicaHechas / aplica.length) * 100 : 0}%"></i></div>
      </div>
      <div class="citas">${S.citas.map(citaHtml).join('')}</div>`
    : `<div class="empty">No hay citas cargadas para hoy.<br>Agrega las citas a mano con “+ Agregar cita” o sube el reporte de AgendaPro.</div>`}
`;
  $('#fileAgenda').onchange = (e) => { const f = e.target.files[0]; e.target.value = ''; if (f) importarAgenda(f); };
  $('#btnCitaManual').onclick = () => formCitaManual();
  $$('.cita', el).forEach((b) => (b.onclick = (ev) => {
    if (ev.target.closest('[data-quitar]')) return;
    elegirCita(+b.dataset.id);
  }));
  $$('[data-quitar]', el).forEach((x) => (x.onclick = (ev) => { ev.stopPropagation(); quitarCitaManual(+x.dataset.quitar, x); }));
}

function formCitaManual() {
  const est = S.estilistas.filter((e) => e.activo).map((e) => e.nombre);
  const ser = S.servicios.filter((e) => e.activo).map((e) => e.nombre);
  const bg = document.createElement('div');
  bg.className = 'modal-bg';
  bg.innerHTML = `<form class="modal" id="citaForm">
    <h2>Agregar cita</h2>
    <p class="muted" style="margin-top:0">Queda guardada en la lista para pasarle la encuesta al entregar al perrito.</p>
    <div class="fields">
      <label class="f">Fecha<input type="date" id="cFecha" value="${hoy()}" required></label>
      <label class="f">Hora<input type="time" id="cHora" required></label>
      <label class="f">Perrito<input type="text" id="cMascota" placeholder="Nombre del perrito" required></label>
      <label class="f">Dueño<input type="text" id="cCliente" placeholder="Nombre del cliente"></label>
      <label class="f">Servicio<input type="text" id="cServicio" list="lServiciosC" placeholder="Elige o escribe" required></label>
      <label class="f">Estilista<input type="text" id="cEstilista" list="lEstilistasC" placeholder="Elige o escribe" required></label>
      <label class="f">WhatsApp del cliente<input type="tel" id="cTel" inputmode="numeric" placeholder="10 dígitos"></label>
      <label class="f">Folio del ticket (opcional)<input type="text" id="cFolio" placeholder="Si ya lo tienes"></label>
    </div>
    <datalist id="lServiciosC">${ser.map((s) => `<option value="${esc(s)}">`).join('')}</datalist>
    <datalist id="lEstilistasC">${est.map((s) => `<option value="${esc(s)}">`).join('')}</datalist>
    <div class="row" style="margin-top:16px;justify-content:flex-end">
      <button class="btn ghost" type="button" id="cCancel">Cancelar</button>
      <button class="btn" type="submit" data-otra="1">Guardar y agregar otra</button>
      <button class="btn primary" type="submit">Guardar cita</button></div>
  </form>`;
  document.body.appendChild(bg);
  $('#cCancel', bg).onclick = () => bg.remove();
  setTimeout(() => $('#cHora', bg).focus(), 50);
  $('#citaForm', bg).onsubmit = async (e) => {
    e.preventDefault();
    const otra = e.submitter && e.submitter.dataset.otra;
    const v = (id) => $('#' + id, bg).value.trim();
    const telRaw = v('cTel');
    const tel = normTel(telRaw);
    if (telRaw && !tel) return toast('El WhatsApp debe tener 10 dígitos.', true);
    const row = {
      clave: `manual|${Date.now()}|${Math.random().toString(36).slice(2, 8)}`,
      fecha: v('cFecha'), hora: v('cHora'), mascota: v('cMascota'), cliente: v('cCliente') || null,
      servicio: v('cServicio'), estilista: v('cEstilista'), telefono: tel || null, folio: v('cFolio') || null, estado: 'Manual'
    };
    const btns = $$('button[type=submit]', bg); btns.forEach((b) => (b.disabled = true));
    const { error } = await sb.from('citas').insert(row);
    btns.forEach((b) => (b.disabled = false));
    if (error) return toast(errMsg(error), true);
    toast(row.fecha === hoy() ? `Cita de ${row.mascota} guardada.` : `Cita de ${row.mascota} guardada para el ${fFecha(row.fecha)}.`);
    cargarCitas();
    if (otra) {
      ['cHora', 'cMascota', 'cCliente', 'cTel', 'cFolio'].forEach((id) => ($('#' + id, bg).value = ''));
      $('#cHora', bg).focus();
    } else bg.remove();
  };
}

async function quitarCitaManual(id, btn) {
  if (btn.dataset.seguro !== '1') { btn.dataset.seguro = '1'; btn.textContent = '¿Quitar?'; setTimeout(() => { if (btn.isConnected) { btn.dataset.seguro = ''; btn.textContent = '×'; } }, 3000); return; }
  const { error } = await sb.from('citas').delete().eq('id', id);
  if (error) return toast(errMsg(error), true);
  if (S.selCita === id) limpiarForm();
  toast('Cita quitada.');
  cargarCitas();
}

function citaHtml(c) {
  const i = S.citaInfo[c.id] || {};
  let pill = '';
  let done = false;
  if (i.hecha === 'contesto') { pill = '<span class="pill good">Encuesta hecha</span>'; done = true; }
  else if (i.hecha === 'no_contesto') { pill = '<span class="pill gray">No contestó</span>'; done = true; }
  else if (i.hecha === 'incompleta') { pill = '<span class="pill gray">Sin terminar</span>'; done = true; }
  else if (i.noEnc) { pill = '<span class="pill bad">No encuestar</span>'; done = true; }
  else if (i.reciente !== undefined) { pill = `<span class="pill warn">Contestó hace ${i.reciente} d</span>`; }
  else pill = '<span class="pill brand">Pendiente</span>';
  const manual = String(c.clave || '').startsWith('manual|');
  const quitar = manual && !i.hecha ? `<span class="quitar" role="button" tabindex="0" data-quitar="${c.id}" title="Quitar cita">×</span>` : '';
  return `<div class="cita ${done ? 'done' : ''} ${S.selCita === c.id ? 'sel' : ''}" data-id="${c.id}" role="button" tabindex="0">
    <span class="hora">${esc(c.hora || '—')}</span>
    <span><div class="who2">${esc(c.mascota || c.cliente || 'Sin nombre')}${manual ? ' <span class="pill gray" style="margin-left:4px">Manual</span>' : ''}</div>
      <div class="meta">${esc([c.mascota ? c.cliente : '', c.servicio, c.estilista].filter(Boolean).join(' · '))}</div></span>
    <span class="row" style="gap:6px;flex-wrap:nowrap">${pill}${quitar}</span></div>`;
}

function elegirCita(id) {
  const c = S.citas.find((x) => x.id === id); if (!c) return;
  S.selCita = id;
  S.form = { servicio: c.servicio || '', estilista: c.estilista || '', mascota: c.mascota || '', cliente: c.cliente || '', telefono: c.telefono || '', folio: c.folio || '', cita_id: c.id };
  renderCitas(); renderForm(); revisarFrecuencia();
  $('#cardForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ---------- formulario de la visita ---------- */
function renderForm() {
  const el = $('#cardForm'); if (!el) return;
  const f = S.form;
  const est = S.estilistas.filter((e) => e.activo).map((e) => e.nombre);
  const ser = S.servicios.filter((e) => e.activo).map((e) => e.nombre);
  const sinCatalogo = !est.length || !ser.length;
  el.innerHTML = `
    <div class="row between"><h2>Datos de la visita</h2>
      ${f.cita_id ? '<span class="pill brand">De la agenda</span>' : '<span class="pill gray">Captura manual</span>'}</div>
    ${sinCatalogo && S.rol === 'admin' ? `<div class="notice warn" style="margin-top:10px">Da de alta tus estilistas y servicios en Ajustes para que aparezcan como opciones.</div>` : ''}
    <div class="fields" style="margin-top:12px">
      <label class="f">Perrito<input type="text" id="fMascota" value="${esc(f.mascota)}" placeholder="Nombre del perrito"></label>
      <label class="f">Dueño<input type="text" id="fCliente" value="${esc(f.cliente)}" placeholder="Nombre del cliente"></label>
      <label class="f">Servicio<input type="text" id="fServicio" list="lServicios" value="${esc(f.servicio)}" placeholder="Elige o escribe"></label>
      <label class="f">Estilista<input type="text" id="fEstilista" list="lEstilistas" value="${esc(f.estilista)}" placeholder="Elige o escribe"></label>
      <label class="f">WhatsApp del cliente<input type="tel" id="fTel" inputmode="numeric" value="${esc(f.telefono)}" placeholder="10 dígitos"></label>
      <label class="f">Folio del ticket${S.aj.folio_obligatorio ? '' : ' (opcional)'}<input type="text" id="fFolio" value="${esc(f.folio)}" placeholder="Folio de venta"></label>
    </div>
    <datalist id="lServicios">${ser.map((s) => `<option value="${esc(s)}">`).join('')}</datalist>
    <datalist id="lEstilistas">${est.map((s) => `<option value="${esc(s)}">`).join('')}</datalist>
    <div id="freq" style="margin-top:12px"></div>
    <div class="row" style="margin-top:14px">
      <button class="btn primary big" id="btnPasar">Pasar al cliente</button>
      <button class="btn" id="btnNoQuiso">No quiso contestar</button>
      <button class="btn ghost" id="btnLimpiar">Limpiar</button>
    </div>
    <p class="tiny" style="margin:10px 0 0">Siempre ofrece la tablet y captura el WhatsApp: así ningún cliente se queda sin evaluar.</p>`;
  const bind = (id, k) => { const i = $('#' + id); i.oninput = () => { S.form[k] = i.value; if (k === 'telefono') { clearTimeout(bind.t); bind.t = setTimeout(revisarFrecuencia, 450); } }; };
  bind('fMascota', 'mascota'); bind('fCliente', 'cliente'); bind('fServicio', 'servicio');
  bind('fEstilista', 'estilista'); bind('fTel', 'telefono'); bind('fFolio', 'folio');
  $('#btnPasar').onclick = () => pasarAlCliente(false);
  $('#btnNoQuiso').onclick = () => registrarSinRespuesta('no_contesto');
  $('#btnLimpiar').onclick = limpiarForm;
  renderFreq();
}

function limpiarForm() {
  S.form = { servicio: '', estilista: '', mascota: '', cliente: '', telefono: '', folio: '', cita_id: null };
  S.selCita = null; S.freq = null;
  renderCitas(); renderForm();
}

async function revisarFrecuencia() {
  const tel = normTel(S.form.telefono);
  if (!tel) { S.freq = null; renderFreq(); return; }
  const [{ data: enc }, { data: cli }] = await Promise.all([
    sb.from('encuestas').select('fecha,estado,creado').eq('telefono', tel).order('creado', { ascending: false }).limit(30),
    sb.from('clientes').select('*').eq('telefono', tel).maybeSingle()
  ]);
  const lista = enc || [];
  const ultC = lista.find((e) => e.estado === 'contesto');
  let rechazos = 0;
  for (const e of lista) { if (e.estado === 'contesto') break; if (e.estado === 'no_contesto') rechazos++; }
  S.freq = {
    tel, noEnc: !!(cli && cli.no_encuestar), noEncDesde: cli && cli.no_encuestar_desde,
    dias: ultC ? diffDays(ultC.fecha, hoy()) : null, rechazos
  };
  renderFreq();
}

function renderFreq() {
  const el = $('#freq'); if (!el) return;
  const q = S.freq; const btn = $('#btnPasar');
  let h = '';
  if (btn) { btn.disabled = false; btn.textContent = 'Pasar al cliente'; }
  if (!q) {
    if (S.form.telefono && !normTel(S.form.telefono)) h = '<div class="notice warn">El WhatsApp debe tener 10 dígitos.</div>';
    el.innerHTML = h; return;
  }
  if (q.noEnc) {
    h = `<div class="notice bad"><div class="grow">Este cliente pidió no recibir encuestas${q.noEncDesde ? ` (desde el ${fFecha(fechaLocalDeTs(q.noEncDesde))})` : ''}.</div>
      <button class="btn small" id="btnIncluir">Volver a incluir</button></div>`;
    if (btn) btn.disabled = true;
  } else {
    if (q.dias !== null && q.dias < S.aj.dias_entre_encuestas) {
      h += `<div class="notice warn"><div class="grow">Contestó hace ${q.dias === 0 ? 'unas horas' : q.dias + (q.dias === 1 ? ' día' : ' días')}. No hace falta pedírsela hoy.</div></div>`;
      if (btn) btn.textContent = 'Pasar de todos modos';
    }
    if (q.rechazos >= S.aj.rechazos_sugerir) {
      h += `<div class="notice warn" style="margin-top:8px"><div class="grow">Ya dijo que no ${q.rechazos} veces seguidas. ¿Lo marcamos para no volver a preguntarle?</div></div>`;
    }
    h += `<div style="margin-top:8px"><button class="btn small ghost" id="btnNoPreguntar">No volver a preguntarle a este cliente</button></div>`;
  }
  el.innerHTML = h;
  const bi = $('#btnIncluir'); if (bi) bi.onclick = () => marcarNoEncuestar(false);
  const bn = $('#btnNoPreguntar'); if (bn) bn.onclick = () => marcarNoEncuestar(true);
}

async function marcarNoEncuestar(valor) {
  const tel = normTel(S.form.telefono); if (!tel) return;
  if (valor && !confirm('¿Marcar a este cliente para no volver a pedirle la encuesta?')) return;
  const { error } = await sb.from('clientes').upsert({
    telefono: tel, nombre: S.form.cliente || null, no_encuestar: valor,
    no_encuestar_desde: valor ? new Date().toISOString() : null, actualizado: new Date().toISOString()
  });
  if (error) return toast(errMsg(error), true);
  toast(valor ? 'Listo, ya no se le pedirá la encuesta.' : 'Cliente incluido de nuevo.');
  await revisarFrecuencia();
  cargarCitas();
}

function validarForm() {
  const f = S.form;
  const falta = [];
  if (!f.mascota.trim()) falta.push('perrito');
  if (!f.servicio.trim()) falta.push('servicio');
  if (!f.estilista.trim()) falta.push('estilista');
  if (S.aj.folio_obligatorio && !f.folio.trim()) falta.push('folio del ticket');
  if (falta.length) { toast('Falta: ' + falta.join(', '), true); return false; }
  if (f.telefono && !normTel(f.telefono)) { toast('El WhatsApp debe tener 10 dígitos.', true); return false; }
  return true;
}

async function folioLibre() {
  const folio = S.form.folio.trim();
  if (!folio) return true;
  const { data, error } = await sb.from('encuestas').select('id').eq('folio', folio).limit(1);
  if (error) { toast(errMsg(error), true); return false; }
  if (data && data.length) { toast('Ese folio ya tiene una encuesta registrada.', true); return false; }
  return true;
}

function visitaBase() {
  const f = S.form;
  return {
    cita_id: f.cita_id, folio: f.folio.trim() || null, servicio: f.servicio.trim(), estilista: f.estilista.trim(),
    mascota: f.mascota.trim(), cliente: f.cliente.trim() || null, telefono: normTel(f.telefono) || null, fecha: hoy()
  };
}

async function pasarAlCliente() {
  if (!validarForm()) return;
  if (S.freq && S.freq.noEnc) return;
  if (!(await folioLibre())) return;
  startKiosk(visitaBase());
}

async function registrarSinRespuesta(estado, base, parcial) {
  if (!base) {
    if (!validarForm()) return false;
    if (!(await folioLibre())) return false;
    base = visitaBase();
  }
  const row = { ...base, estado };
  if (parcial) Object.assign(row, parcial);
  const { error } = await sb.from('encuestas').insert(row);
  if (error) { toast(errMsg(error), true); return false; }
  toast(estado === 'no_contesto' ? 'Visita registrada como "no contestó".' : 'Visita registrada como "sin terminar".');
  limpiarForm();
  cargarCitas();
  return true;
}

/* ---------- canje ---------- */
function renderCanje(res) {
  const el = $('#cardCanje'); if (!el) return;
  el.innerHTML = `
    <h2>Canjear un regalo</h2>
    <p class="tiny" style="margin:4px 0 10px">Pregunta al recibir al perrito: “¿traes algún código de regalo?”</p>
    <form class="row" id="canjeForm" style="flex-wrap:nowrap">
      <input type="text" id="canjeCod" placeholder="PS-XXXX" autocapitalize="characters" style="text-transform:uppercase">
      <button class="btn primary" type="submit">Buscar</button>
    </form>
    <div id="canjeRes" style="margin-top:10px">${res || ''}</div>`;
  $('#canjeForm').onsubmit = async (e) => {
    e.preventDefault();
    let c = $('#canjeCod').value.trim().toUpperCase().replace(/\s/g, '');
    if (!c) return;
    if (!c.startsWith('PS-')) c = 'PS-' + c.replace(/^PS/, '');
    const { data, error } = await sb.from('regalos').select('*, encuestas(mascota,cliente,folio,fecha)').eq('codigo', c).maybeSingle();
    const out = $('#canjeRes');
    if (error) { out.innerHTML = `<div class="notice bad">${esc(errMsg(error))}</div>`; return; }
    if (!data) { out.innerHTML = `<div class="notice bad">No existe el código ${esc(c)}.</div>`; return; }
    const e2 = data.encuestas || {};
    const det = `<div style="font-weight:600;margin-top:4px">${esc(data.opcion)} · ${esc(e2.mascota || '')}${e2.cliente ? ' (' + esc(e2.cliente) + ')' : ''}${e2.folio ? ' · folio ' + esc(e2.folio) : ''}</div>`;
    if (data.canjeado_en) { out.innerHTML = `<div class="notice bad"><div class="grow">Ya se canjeó el ${fFecha(fechaLocalDeTs(data.canjeado_en))}.${det}</div></div>`; return; }
    if (data.vence < hoy()) { out.innerHTML = `<div class="notice warn"><div class="grow">Venció el ${fFecha(data.vence)}.${det}</div></div>`; return; }
    out.innerHTML = `<div class="notice good"><div class="grow">Válido hasta el ${fFecha(data.vence)}.${det}</div>
      <button class="btn small primary" id="btnCanjear">Canjear</button></div>`;
    $('#btnCanjear').onclick = async () => {
      const { data: up, error: er } = await sb.from('regalos').update({ canjeado_en: new Date().toISOString() }).eq('codigo', c).is('canjeado_en', null).select();
      if (er) return toast(errMsg(er), true);
      if (!up || !up.length) return toast('Ese código ya se había canjeado.', true);
      renderCanje(`<div class="notice good">Regalo canjeado: ${esc(data.opcion)} para ${esc(e2.mascota || '')}.</div>`);
    };
  };
}

/* ---------- códigos por enviar ---------- */
async function cargarEnvios() {
  const el = $('#cardEnvios'); if (!el) return;
  const { data, error } = await sb.from('regalos').select('*, encuestas(mascota,cliente)').not('envio', 'is', null).is('enviado_en', null).order('creado');
  if (error) { el.innerHTML = `<h2>Códigos por enviar</h2><div class="notice bad">${esc(errMsg(error))}</div>`; return; }
  const rows = data || [];
  el.innerHTML = `<h2>Códigos por enviar</h2>
    <p class="tiny" style="margin:4px 0 10px">Clientes que pidieron que les mandemos su código de regalo.</p>
    ${rows.length ? rows.map((r) => {
      const e = r.encuestas || {};
      const msg = fill(S.aj.mensajes.codigo, { cliente: primerNombre(e.cliente), mascota: e.mascota, codigo: r.codigo, regalo: r.opcion, vence: fFecha(r.vence) });
      const link = r.envio === 'whatsapp' ? waLink(r.envio_destino, msg)
        : `mailto:${encodeURIComponent(r.envio_destino)}?subject=${encodeURIComponent('Tu código de regalo PetSpa')}&body=${encodeURIComponent(msg)}`;
      return `<div class="row between" style="padding:10px 0;border-top:1px solid var(--line)">
        <div><b>${esc(e.mascota || '')}</b> · ${esc(r.codigo)}<div class="tiny">${r.envio === 'whatsapp' ? 'WhatsApp' : 'Correo'}: ${esc(r.envio_destino)}</div></div>
        <div class="row"><a class="btn small" href="${link}" target="_blank" rel="noopener">${r.envio === 'whatsapp' ? ICONS.wa : ICONS.mail} Enviar</a>
        <button class="btn small" data-enviado="${esc(r.codigo)}">Marcar enviado</button></div></div>`;
    }).join('') : '<div class="empty">No hay códigos pendientes.</div>'}`;
  $$('[data-enviado]', el).forEach((b) => (b.onclick = async () => {
    const { error: er } = await sb.from('regalos').update({ enviado_en: new Date().toISOString() }).eq('codigo', b.dataset.enviado);
    if (er) return toast(errMsg(er), true);
    cargarEnvios();
  }));
}

/* ---------- importar AgendaPro ---------- */
const CAMPOS_AGENDA = [
  ['fecha', 'Fecha', /fecha|date|d[ií]a/i],
  ['hora', 'Hora', /hora|inicio|time|horario/i],
  ['cliente', 'Cliente', /cliente|customer|nombre/i],
  ['mascota', 'Perrito', /mascota|paciente|perr|pet|animal/i],
  ['servicio', 'Servicio', /servicio|service|tratamiento/i],
  ['estilista', 'Estilista', /prestador|profesional|estilista|staff|empleado|recurso|groomer/i],
  ['telefono', 'Teléfono', /tel[eé]fono|celular|whats|m[oó]vil|phone|cel/i],
  ['estado', 'Estado', /estado|status|asistencia/i],
  ['folio', 'Folio (opcional)', /folio|ticket|venta|id reserva/i]
];

function cargarXLSX() {
  if (window.XLSX) return Promise.resolve();
  return new Promise((ok, ko) => { const s = document.createElement('script'); s.src = 'xlsx.full.min.js'; s.onload = ok; s.onerror = () => ko(new Error('No se pudo cargar el lector de Excel')); document.head.appendChild(s); });
}

async function importarAgenda(file) {
  try {
    await cargarXLSX();
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: true });
    let hi = rows.findIndex((r) => r.filter((x) => typeof x === 'string' && x.trim()).length >= 3);
    if (hi < 0) throw new Error('No encontré los encabezados de columnas en el archivo.');
    const headers = rows[hi].map((x) => String(x).trim());
    const data = rows.slice(hi + 1).filter((r) => r.some((x) => String(x).trim() !== ''));
    const guardado = lsGet('petspa-columnas-agenda', null) || S.aj.agendapro_columnas;
    const map = {};
    CAMPOS_AGENDA.forEach(([k, , re]) => {
      if (guardado && guardado[k] && headers.includes(guardado[k])) map[k] = guardado[k];
      else {
        const usadas = Object.values(map);
        const h = headers.find((x) => re.test(x) && !usadas.includes(x));
        map[k] = h || '';
      }
    });
    const ok = guardado && CAMPOS_AGENDA.every(([k]) => !guardado[k] || headers.includes(guardado[k]));
    if (ok && map.fecha && (map.cliente || map.mascota)) return procesarAgenda(headers, data, map);
    mostrarMapeo(headers, data, map);
  } catch (e) { toast(errMsg(e), true); }
}

function mostrarMapeo(headers, data, map) {
  const bg = document.createElement('div');
  bg.className = 'modal-bg';
  const ej = data[0] || [];
  bg.innerHTML = `<div class="modal">
    <h2>Revisa las columnas</h2>
    <p class="muted" style="margin-top:0">Indica qué columna del archivo de AgendaPro corresponde a cada dato. Se guarda para las próximas veces.</p>
    <div class="fields">${CAMPOS_AGENDA.map(([k, t]) => `<label class="f">${t}<select data-k="${k}"><option value="">— No viene —</option>
      ${headers.map((h, i) => `<option value="${esc(h)}" ${map[k] === h ? 'selected' : ''}>${esc(h)}${ej[i] !== undefined && ej[i] !== '' ? ` (ej. ${esc(String(typeof ej[i] === 'number' && ej[i] > 30000 ? parseFechaHora(ej[i]).fecha : ej[i]).slice(0, 22))})` : ''}</option>`).join('')}
      </select></label>`).join('')}</div>
    <div class="row" style="margin-top:16px;justify-content:flex-end">
      <button class="btn ghost" id="mapCancel">Cancelar</button><button class="btn primary" id="mapOk">Importar citas</button></div>
  </div>`;
  document.body.appendChild(bg);
  $('#mapCancel', bg).onclick = () => bg.remove();
  $('#mapOk', bg).onclick = async () => {
    const m = {}; $$('select', bg).forEach((s) => (m[s.dataset.k] = s.value));
    if (!m.fecha) return toast('Elige la columna de fecha.', true);
    if (!m.cliente && !m.mascota) return toast('Elige la columna de cliente o de perrito.', true);
    lsSet('petspa-columnas-agenda', m);
    if (S.rol === 'admin') { S.aj.agendapro_columnas = m; guardarAjustes(true); }
    bg.remove();
    procesarAgenda(headers, data, m);
  };
}

function parseFechaHora(v) {
  if (v instanceof Date && !isNaN(v)) {
    return { fecha: ymd(v), hora: (v.getHours() || v.getMinutes()) ? `${pad(v.getHours())}:${pad(v.getMinutes())}` : '' };
  }
  if (typeof v === 'number' && window.XLSX) {
    const d = XLSX.SSF.parse_date_code(v);
    if (d) return { fecha: `${d.y}-${pad(d.m)}-${pad(d.d)}`, hora: (d.H || d.M) ? `${pad(d.H)}:${pad(d.M)}` : '' };
  }
  const s = String(v || '').trim();
  let m = s.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  let fecha = '';
  if (m) fecha = `${m[1]}-${pad(m[2])}-${pad(m[3])}`;
  else if ((m = s.match(/(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/))) {
    const y = m[3].length === 2 ? '20' + m[3] : m[3];
    fecha = `${y}-${pad(m[2])}-${pad(m[1])}`; // formato día/mes/año
  }
  const h = s.match(/(\d{1,2}):(\d{2})\s*([ap]\.?\s?m\.?)?/i);
  let hora = '';
  if (h) {
    let H = +h[1];
    if (h[3]) { const pm = /p/i.test(h[3]); if (pm && H < 12) H += 12; if (!pm && H === 12) H = 0; }
    hora = `${pad(H)}:${h[2]}`;
  }
  return { fecha, hora };
}
function parseHora(v) {
  if (v instanceof Date) return `${pad(v.getHours())}:${pad(v.getMinutes())}`;
  if (typeof v === 'number' && v < 1) { const min = Math.round(v * 1440); return `${pad(Math.floor(min / 60))}:${pad(min % 60)}`; }
  return parseFechaHora(v).hora || String(v || '').trim();
}

async function procesarAgenda(headers, data, map) {
  const idx = {}; Object.entries(map).forEach(([k, h]) => (idx[k] = h ? headers.indexOf(h) : -1));
  const get = (r, k) => (idx[k] >= 0 ? r[idx[k]] : '');
  const filas = []; let omitidas = 0;
  for (const r of data) {
    const est = String(get(r, 'estado') || '');
    if (/cancel|no asist|no-show|no show|anulad|elimin/i.test(est)) { omitidas++; continue; }
    const fh = parseFechaHora(get(r, 'fecha'));
    if (!fh.fecha) continue;
    const hora = idx.hora >= 0 ? parseHora(get(r, 'hora')) : fh.hora;
    const cliente = String(get(r, 'cliente') || '').trim();
    const mascota = String(get(r, 'mascota') || '').trim();
    if (!cliente && !mascota) continue;
    const telefono = normTel(get(r, 'telefono')) || null;
    const clave = [fh.fecha, hora, cliente.toLowerCase(), mascota.toLowerCase(), String(get(r, 'servicio')).toLowerCase()].join('|');
    filas.push({ clave, fecha: fh.fecha, hora: hora || null, cliente: cliente || null, mascota: mascota || null,
      servicio: String(get(r, 'servicio') || '').trim() || null, estilista: String(get(r, 'estilista') || '').trim() || null,
      telefono, folio: String(get(r, 'folio') || '').trim() || null, estado: est || null });
  }
  const unicas = Object.values(Object.fromEntries(filas.map((f) => [f.clave, f])));
  if (!unicas.length) return toast('No encontré citas con fecha en el archivo. Revisa las columnas.', true);
  const { error } = await sb.from('citas').upsert(unicas, { onConflict: 'clave' });
  if (error) return toast(errMsg(error), true);
  const deHoy = unicas.filter((f) => f.fecha === hoy()).length;
  toast(`Se cargaron ${unicas.length} citas (${deHoy} de hoy)${omitidas ? `; ${omitidas} canceladas omitidas` : ''}.`);
  cargarCitas();
}

/* ================================================================== */
/* PANTALLA DEL CLIENTE (KIOSCO)                                        */
/* ================================================================== */
let kTimer = null; let wakeLock = null;

function startKiosk(base) {
  S.k = { base, resp: {}, motivos: {}, reco: null, mejor: [], comentario: '', t0: Date.now(), last: Date.now(), step: 'survey', regalo: null };
  document.body.classList.add('kiosk');
  window.scrollTo(0, 0);
  renderKiosk();
  clearInterval(kTimer);
  kTimer = setInterval(tickKiosk, 3000);
  try { if (navigator.wakeLock) navigator.wakeLock.request('screen').then((w) => (wakeLock = w)).catch(() => {}); } catch (e) { /* sin wake lock */ }
}
function toque() { if (S.k) S.k.last = Date.now(); }
document.addEventListener('pointerdown', toque, true);
document.addEventListener('keydown', toque, true);

function tickKiosk() {
  const k = S.k; if (!k) return;
  const ocioso = (Date.now() - k.last) / 1000;
  if (k.step === 'survey' && ocioso > S.aj.inactividad_seg) {
    const base = k.base; const parcial = { respuestas: k.resp, motivos: k.motivos, segundos: Math.round((Date.now() - k.t0) / 1000) };
    salirKiosk();
    registrarSinRespuesta('incompleta', base, parcial);
  } else if (k.step !== 'survey' && ocioso > 75) {
    salirKiosk();
  }
}

function salirKiosk() {
  clearInterval(kTimer); kTimer = null;
  try { if (wakeLock) wakeLock.release(); } catch (e) { /* nada */ } wakeLock = null;
  S.k = null;
  document.body.classList.remove('kiosk');
  $('#kiosk').innerHTML = '';
  limpiarForm();
  renderAlertas();
  cargarCitas(); cargarEnvios();
  window.scrollTo(0, 0);
}

function totalPasos() { return preguntasActivas().length + (S.aj.recomendar.activa ? 1 : 0); }
function pasosHechos() { const k = S.k; return preguntasActivas().filter((p) => k.resp[p.id]).length + (S.aj.recomendar.activa && k.reco ? 1 : 0); }

function renderKiosk() {
  const k = S.k; if (!k) return;
  const el = $('#kiosk');
  if (k.step === 'survey') return renderEncuestaCliente(el);
  if (k.step === 'regalo') return renderEligeRegalo(el);
  if (k.step === 'codigo') return renderCodigo(el);
  if (k.step === 'gracias') return renderGracias(el);
}

function renderEncuestaCliente(el) {
  const k = S.k; const pq = preguntasActivas();
  const total = totalPasos(); const hechos = pasosHechos();
  const algunaMala = pq.some((p) => k.resp[p.id] && k.resp[p.id] <= 2);
  const mostrarMejor = S.aj.lo_mejor.activa && S.aj.lo_mejor.opciones.length && !algunaMala && pq.some((p) => k.resp[p.id]);
  const listo = hechos === total;
  el.innerHTML = `<div class="kwrap">
    <div class="khead">${ILLUSTRATION}
      <h1>¿Cómo les fue hoy${k.base.mascota ? ` a ti y a ${esc(k.base.mascota)}` : ''}?</h1>
      <p>Toca una carita en cada pregunta. Toma menos de un minuto.</p>
      ${S.aj.regalos.activos && S.aj.regalos.opciones.length ? `<div class="gift-hint">${ICONS.regalo} Al terminar, elige un regalo para su próxima visita. Lo recibes califiques como califiques.</div>` : ''}
    </div>
    <div class="paws">${Array.from({ length: total }, (_, i) => `<svg class="${i < hechos ? 'on' : ''}" viewBox="0 0 24 24" fill="currentColor">${ICONS.huella.replace(/<\/?svg[^>]*>/g, '')}</svg>`).join('')}</div>
    <div class="paws-label">Llevas ${hechos} de ${total}</div>
    ${pq.map((p) => preguntaHtml(p)).join('')}
    ${S.aj.recomendar.activa ? `
      <div class="q ${k.reco ? 'answered' : ''}">
        <div class="qt"><span class="qi" style="background:${ICON_BG.estrella[0]};color:${ICON_BG.estrella[1]}">${ICONS.estrella}</span>${esc(S.aj.recomendar.texto)}</div>
        <div class="reco ${k.reco ? 'dim' : ''}">
          ${[['si', 'Sí', 4], ['tal_vez', 'Tal vez', 2], ['no', 'No', 1]].map(([v, t, f]) => `<button class="face ${k.reco === v ? 'on' : ''}" data-v="${f}" data-reco="${v}">${face(f === 2 ? 2 : f)}${t}</button>`).join('')}
        </div>
      </div>` : ''}
    ${mostrarMejor ? `
      <div class="q">
        <div class="qt"><span class="qi" style="background:${ICON_BG.corazon[0]};color:${ICON_BG.corazon[1]}">${ICONS.corazon}</span>¿Qué fue lo que más te gustó? <span class="tiny">(opcional)</span></div>
        <div class="chips" style="margin-top:12px">${S.aj.lo_mejor.opciones.map((o) => `<button class="chip good ${k.mejor.includes(o) ? 'on' : ''}" data-mejor="${esc(o)}">${esc(o)}</button>`).join('')}</div>
      </div>` : ''}
    ${S.aj.comentario ? `
      <div class="q">
        <div class="qt" style="font-size:1.05rem">¿Algo más que quieras contarnos? <span class="tiny">(opcional)</span></div>
        <textarea id="kComent" style="margin-top:10px" placeholder="Escribe aquí…">${esc(k.comentario)}</textarea>
      </div>` : ''}
    <div class="kfoot">
      <button class="btn accent big" id="kEnviar" ${listo ? '' : 'disabled style="opacity:.45"'}>${listo ? 'Enviar' : `Faltan ${total - hechos}`}</button>
      <div class="staff-links">
        <span class="tiny" style="align-self:center">Solo personal:</span>
        <button class="btn small ghost" id="kNoQuiso">El cliente no quiso contestar</button>
        <button class="btn small ghost" id="kCorregir">Corregir datos</button>
      </div>
    </div>
  </div>`;
  $$('[data-q]', el).forEach((b) => (b.onclick = () => {
    const id = b.dataset.q; const v = +b.dataset.v;
    k.resp[id] = v;
    if (v > 2) delete k.motivos[id];
    renderKiosk();
  }));
  $$('[data-mot]', el).forEach((b) => (b.onclick = () => {
    const [id, mot] = [b.dataset.mot, b.dataset.m];
    const arr = k.motivos[id] || (k.motivos[id] = []);
    const i = arr.indexOf(mot); if (i >= 0) arr.splice(i, 1); else arr.push(mot);
    renderKiosk();
  }));
  $$('[data-reco]', el).forEach((b) => (b.onclick = () => { k.reco = b.dataset.reco; renderKiosk(); }));
  $$('[data-mejor]', el).forEach((b) => (b.onclick = () => {
    const o = b.dataset.mejor; const i = k.mejor.indexOf(o); if (i >= 0) k.mejor.splice(i, 1); else k.mejor.push(o); renderKiosk();
  }));
  const ta = $('#kComent'); if (ta) ta.oninput = () => (k.comentario = ta.value);
  $('#kEnviar').onclick = () => { if (pasosHechos() === totalPasos()) enviarEncuesta(); };
  $('#kNoQuiso').onclick = () => { const base = k.base; salirKiosk(); registrarSinRespuesta('no_contesto', base); };
  $('#kCorregir').onclick = () => {
    const base = k.base; salirKiosk();
    S.form = { servicio: base.servicio, estilista: base.estilista, mascota: base.mascota, cliente: base.cliente || '', telefono: base.telefono || '', folio: base.folio || '', cita_id: base.cita_id };
    S.selCita = base.cita_id; renderCitas(); renderForm(); revisarFrecuencia();
  };
}

function preguntaHtml(p) {
  const k = S.k; const v = k.resp[p.id];
  const [bg, fg] = ICON_BG[p.icono] || ICON_BG.huella;
  const mal = v && v <= 2 && p.motivos && p.motivos.length;
  return `<div class="q ${v ? 'answered' : ''}">
    <div class="qt"><span class="qi" style="background:${bg};color:${fg}">${ICONS[p.icono] || ICONS.huella}</span>${esc(p.texto)}</div>
    <div class="faces ${v ? 'dim' : ''}">${ESCALA.map((e) => `<button class="face ${v === e.v ? 'on' : ''}" data-q="${p.id}" data-v="${e.v}">${face(e.v)}${e.t}</button>`).join('')}</div>
    ${mal ? `<div class="why"><p>¿Qué pasó? <span class="tiny">(opcional, puedes elegir varias)</span></p>
      <div class="chips">${p.motivos.map((m) => `<button class="chip ${(k.motivos[p.id] || []).includes(m) ? 'on' : ''}" data-mot="${p.id}" data-m="${esc(m)}">${esc(m)}</button>`).join('')}</div></div>` : ''}
  </div>`;
}

async function enviarEncuesta() {
  const k = S.k; const btn = $('#kEnviar');
  btn.disabled = true; btn.textContent = 'Enviando…';
  const pq = preguntasActivas();
  const resp = {}; pq.forEach((p) => (resp[p.id] = k.resp[p.id]));
  const motivos = {}; Object.entries(k.motivos).forEach(([id, a]) => { if (a.length && resp[id] && resp[id] <= 2) motivos[id] = a; });
  const satisfecho = pq.every((p) => resp[p.id] >= 3);
  const verificar = satisfecho && !!k.base.telefono && Math.random() < 1 / Math.max(1, S.aj.verificar_cada);
  const row = { ...k.base, estado: 'contesto', respuestas: resp, motivos, lo_mejor: satisfecho ? k.mejor : [],
    recomendaria: S.aj.recomendar.activa ? k.reco : null, comentario: (k.comentario || '').trim() || null,
    segundos: Math.round((Date.now() - k.t0) / 1000), satisfecho, verificar };
  const { data, error } = await sb.from('encuestas').insert(row).select('id').single();
  if (error) { toast(errMsg(error), true); btn.disabled = false; btn.textContent = 'Enviar'; return; }
  k.encuestaId = data.id;
  if (!satisfecho) {
    const malas = pq.filter((p) => resp[p.id] <= 2).map((p) => `${ESCALA[resp[p.id] - 1].t.toLowerCase()} en “${p.texto}”${motivos[p.id] ? ` (${motivos[p.id].join(', ')})` : ''}`);
    S.alerts.unshift({ mascota: k.base.mascota, cliente: k.base.cliente, detalle: malas.join('; '), ts: Date.now() });
    S.alerts = S.alerts.slice(0, 5); lsSet('petspa-alertas', S.alerts);
  }
  k.last = Date.now();
  k.step = S.aj.regalos.activos && S.aj.regalos.opciones.length ? 'regalo' : 'gracias';
  window.scrollTo(0, 0);
  renderKiosk();
}

function corazones(el) {
  const h = document.createElement('div'); h.className = 'hearts';
  for (let i = 0; i < 14; i++) {
    const s = document.createElement('span'); s.textContent = '♥';
    s.style.left = Math.random() * 100 + '%'; s.style.animationDelay = Math.random() * 1.6 + 's'; s.style.fontSize = 18 + Math.random() * 22 + 'px';
    h.appendChild(s);
  }
  el.appendChild(h); setTimeout(() => h.remove(), 6500);
}

function renderGracias(el) {
  const k = S.k;
  el.innerHTML = `<div class="kwrap"><div class="center-screen">${ILLUSTRATION}
    <h1>¡Gracias!</h1><p>Tu opinión nos ayuda a consentir mejor a ${esc(k.base.mascota || 'tu perrito')}.</p></div></div>`;
  corazones(el);
  setTimeout(() => { if (S.k === k) salirKiosk(); }, 6000);
}

function renderEligeRegalo(el) {
  const k = S.k; const ops = S.aj.regalos.opciones;
  el.innerHTML = `<div class="kwrap"><div class="center-screen">${ILLUSTRATION}
    <h1>¡Gracias!</h1>
    <p>Elige el regalo para la próxima visita de ${esc(k.base.mascota || 'tu perrito')}.</p>
    <div class="gifts">${ops.map((o, i) => `<button class="gift" data-g="${i}"><span class="gi">${giftIcon(o)}</span>${esc(o)}<small class="muted">Próxima visita</small></button>`).join('')}</div>
    <button class="btn ghost" id="kSinRegalo" style="margin-top:10px">No, gracias</button>
  </div></div>`;
  corazones(el);
  $$('[data-g]', el).forEach((b) => (b.onclick = () => elegirRegalo(ops[+b.dataset.g], b)));
  $('#kSinRegalo').onclick = salirKiosk;
}

async function elegirRegalo(opcion, btn) {
  const k = S.k; if (k.guardando) return; k.guardando = true;
  btn.style.opacity = '.6';
  const vence = addDays(hoy(), +S.aj.regalos.vigencia_dias || 60);
  let codigo, error;
  for (let i = 0; i < 5; i++) {
    codigo = nuevoCodigo();
    ({ error } = await sb.from('regalos').insert({ codigo, encuesta_id: k.encuestaId, opcion, vence }));
    if (!error || !/duplicate/i.test(error.message)) break;
  }
  k.guardando = false;
  if (error) { btn.style.opacity = ''; return toast(errMsg(error), true); }
  k.regalo = { codigo, opcion, vence };
  k.step = 'codigo'; k.vista = null; k.last = Date.now();
  renderKiosk();
}

function renderCodigo(el) {
  const k = S.k; const r = k.regalo;
  const vars = { cliente: primerNombre(k.base.cliente), mascota: k.base.mascota, codigo: r.codigo, regalo: r.opcion, vence: fFecha(r.vence) };
  const waSpa = String(S.aj.regalos.whatsapp_spa || '').replace(/\D/g, '');
  let extra = '';
  if (k.vista === 'qr') {
    extra = `<div class="qrbox" id="qr"></div><p class="tiny">Escanéalo con la cámara de tu celular y toca Enviar en WhatsApp.</p>`;
  } else if (k.vista === 'enviar') {
    const tipo = k.envTipo || 'whatsapp';
    extra = `<div class="card" style="width:min(460px,100%);text-align:left">
      <div class="row" style="margin-bottom:10px">
        <button class="chip ${tipo === 'whatsapp' ? 'on' : ''}" data-tipo="whatsapp">WhatsApp</button>
        <button class="chip ${tipo === 'correo' ? 'on' : ''}" data-tipo="correo">Correo</button></div>
      ${tipo === 'whatsapp'
        ? `<label class="f">Tu WhatsApp<input type="tel" id="envDest" inputmode="numeric" value="${esc(k.base.telefono || '')}" placeholder="10 dígitos"></label>`
        : `<label class="f">Tu correo<input type="email" id="envDest" placeholder="nombre@correo.com"></label>`}
      <button class="btn primary" id="envOk" style="margin-top:12px;width:100%">Enviármelo</button></div>`;
  } else if (k.vista === 'enviado') {
    extra = `<div class="notice good">¡Listo! Te lo mandamos en un momento.</div>`;
  }
  el.innerHTML = `<div class="kwrap"><div class="center-screen">
    <div class="gift" style="pointer-events:none;box-shadow:none;border:0;background:transparent;padding:0"><span class="gi">${giftIcon(r.opcion)}</span></div>
    <h1 style="font-size:clamp(1.6rem,4vw,2.3rem)">${esc(r.opcion)} de regalo</h1>
    <p>Muestra este código en caja en la próxima visita de ${esc(k.base.mascota || 'tu perrito')}.</p>
    <div class="code">${esc(r.codigo)}</div>
    <p class="tiny" style="font-size:1rem">Válido hasta el ${fFecha(r.vence)}. Tómale foto o guárdalo:</p>
    <div class="row" style="justify-content:center">
      ${waSpa ? `<button class="btn" id="kQR">${ICONS.wa} Guardarlo en mi WhatsApp</button>` : ''}
      <button class="btn" id="kEnviarme">${ICONS.mail} Que me lo envíen</button>
    </div>
    ${extra}
    <button class="btn primary big" id="kListo" style="margin-top:8px">Listo</button>
  </div></div>`;
  const q = $('#kQR', el); if (q) q.onclick = () => { k.vista = 'qr'; renderKiosk(); };
  $('#kEnviarme', el).onclick = () => { k.vista = 'enviar'; renderKiosk(); };
  $('#kListo', el).onclick = salirKiosk;
  if (k.vista === 'qr') {
    const link = `https://wa.me/${waSpa.length === 10 ? '52' + waSpa : waSpa}?text=${encodeURIComponent(fill(S.aj.mensajes.guardar_codigo, vars))}`;
    const qr = qrcode(0, 'M'); qr.addData(link); qr.make();
    $('#qr', el).innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
  }
  $$('[data-tipo]', el).forEach((b) => (b.onclick = () => { k.envTipo = b.dataset.tipo; renderKiosk(); }));
  const ok = $('#envOk', el);
  if (ok) ok.onclick = async () => {
    const tipo = k.envTipo || 'whatsapp';
    let dest = $('#envDest').value.trim();
    if (tipo === 'whatsapp') { dest = normTel(dest); if (!dest) return toast('Escribe un WhatsApp de 10 dígitos.', true); }
    else if (!/^\S+@\S+\.\S+$/.test(dest)) return toast('Escribe un correo válido.', true);
    const { error } = await sb.from('regalos').update({ envio: tipo, envio_destino: dest }).eq('codigo', r.codigo);
    if (error) return toast(errMsg(error), true);
    k.vista = 'enviado'; renderKiosk();
  };
}

/* ================================================================== */
/* RESULTADOS                                                           */
/* ================================================================== */
function rangoPeriodo(p) {
  const h = hoy(); const d = parseYmd(h); const dia = d.getDate();
  const y = d.getFullYear(); const m = d.getMonth();
  const f = (yy, mm, dd) => ymd(new Date(yy, mm, dd));
  const quincena = (yy, mm, dd) => (dd >= 8 && dd <= 23) ? [f(yy, mm, 8), f(yy, mm, 23)]
    : dd >= 24 ? [f(yy, mm, 24), f(yy, mm + 1, 7)] : [f(yy, mm - 1, 24), f(yy, mm, 7)];
  switch (p) {
    case 'hoy': return [h, h];
    case '7': return [addDays(h, -6), h];
    case '30': return [addDays(h, -29), h];
    case 'quincena': return quincena(y, m, dia);
    case 'quincena_ant': { const [a] = quincena(y, m, dia); const pd = parseYmd(addDays(a, -1)); return quincena(pd.getFullYear(), pd.getMonth(), pd.getDate()); }
    case 'mes': return [f(y, m, 1), f(y, m + 1, 0)];
    case 'mes_ant': return [f(y, m - 1, 1), f(y, m, 0)];
    default: return [S.res.desde || addDays(h, -29), S.res.hasta || h];
  }
}

function renderResultados() {
  const r = S.res;
  const [d, h] = rangoPeriodo(r.periodo);
  r.desde = d; r.hasta = h;
  $('#main').innerHTML = `
    <div class="filters">
      <label class="f">Periodo<select id="rPer">
        ${[['quincena', 'Quincena actual'], ['quincena_ant', 'Quincena anterior'], ['hoy', 'Hoy'], ['7', 'Últimos 7 días'], ['30', 'Últimos 30 días'], ['mes', 'Este mes'], ['mes_ant', 'Mes anterior'], ['custom', 'Personalizado']]
          .map(([v, t]) => `<option value="${v}" ${r.periodo === v ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
      <label class="f">Desde<input type="date" id="rDesde" value="${d}" ${r.periodo === 'custom' ? '' : 'disabled'}></label>
      <label class="f">Hasta<input type="date" id="rHasta" value="${h}" ${r.periodo === 'custom' ? '' : 'disabled'}></label>
      <div class="spacer" style="flex:1"></div>
      <button class="btn" id="rCsv">${ICONS.descargar} Exportar CSV</button>
    </div>
    <div id="rBody"><div class="empty">Cargando…</div></div>`;
  $('#rPer').onchange = (e) => { r.periodo = e.target.value; renderResultados(); };
  $('#rDesde').onchange = (e) => { r.desde = e.target.value; r.periodo = 'custom'; cargarResultados(); };
  $('#rHasta').onchange = (e) => { r.hasta = e.target.value; r.periodo = 'custom'; cargarResultados(); };
  $('#rCsv').onclick = exportarCSV;
  cargarResultados();
}

async function cargarResultados() {
  const r = S.res;
  if (r.periodo === 'custom') { r.desde = $('#rDesde').value; r.hasta = $('#rHasta').value; }
  if (r.demo) { r.data = datosDemo(); return pintarResultados(); }
  const desdeTs = parseYmd(r.desde).toISOString(); const hastaTs = parseYmd(addDays(r.hasta, 1)).toISOString();
  const [enc, reg, cli, ver] = await Promise.all([
    sb.from('encuestas').select('*').gte('fecha', r.desde).lte('fecha', r.hasta).order('creado', { ascending: false }).limit(5000),
    sb.from('regalos').select('*').gte('creado', desdeTs).lt('creado', hastaTs).limit(5000),
    sb.from('clientes').select('*').eq('no_encuestar', true).order('no_encuestar_desde', { ascending: false }),
    sb.from('encuestas').select('*').eq('verificar', true).is('verificacion', null).order('creado', { ascending: false }).limit(200)
  ]);
  const err = enc.error || reg.error || cli.error || ver.error;
  if (err) { $('#rBody').innerHTML = `<div class="notice bad">${esc(errMsg(err))}</div>`; return; }
  const encs = enc.data || [];
  const tels = [...new Set(encs.filter((e) => e.estado === 'contesto' && e.telefono).map((e) => e.telefono))];
  let citas = [];
  if (tels.length) {
    const { data } = await sb.from('citas').select('telefono,fecha').in('telefono', tels.slice(0, 900)).gt('fecha', r.desde);
    citas = data || [];
  }
  r.data = { encuestas: encs, regalos: reg.data || [], noEnc: cli.data || [], verificar: ver.data || [], citas };
  pintarResultados();
}

function stats(rows) {
  const c = rows.filter((e) => e.estado === 'contesto');
  const sat = c.filter((e) => e.satisfecho).length;
  const reco = c.filter((e) => e.recomendaria); const recoSi = reco.filter((e) => e.recomendaria === 'si').length;
  const mot = {}; c.forEach((e) => Object.values(e.motivos || {}).flat().forEach((m) => (mot[m] = (mot[m] || 0) + 1)));
  const top = Object.entries(mot).sort((a, b) => b[1] - a[1])[0];
  return { reg: rows.length, con: c.length, sat, recoN: reco.length, recoSi, top: top ? top[0] : '' };
}

function groupBy(rows, k) { const g = {}; rows.forEach((r) => { const key = r[k] || '(sin dato)'; (g[key] || (g[key] = [])).push(r); }); return g; }

function pintarResultados() {
  const r = S.res; const D = r.data; const A = S.aj;
  const E = D.encuestas; const C = E.filter((e) => e.estado === 'contesto');
  const st = stats(E);
  const body = $('#rBody');
  if (!E.length && !r.demo) {
    body.innerHTML = `<div class="card"><div class="empty">Todavía no hay encuestas en este periodo.<br><br>
      <button class="btn" id="rDemo">Ver un ejemplo con datos ficticios</button></div></div>${seccionVerificar(D)}${seccionNoEnc(D)}`;
    $('#rDemo').onclick = () => { r.demo = true; cargarResultados(); };
    bindResultados();
    return;
  }
  const hoyS = hoy();
  /* regreso: clientes que contestaron y volvieron (cita posterior en AgendaPro, 7 a 60 días después) */
  const conTel = C.filter((e) => e.telefono);
  const elegibles = conTel.filter((e) => diffDays(e.fecha, hoyS) >= 7);
  const volvio = elegibles.filter((e) => D.citas.some((c) => c.telefono === e.telefono && diffDays(e.fecha, c.fecha) >= 7 && diffDays(e.fecha, c.fecha) <= 60)).length;
  const R = D.regalos; const canj = R.filter((x) => x.canjeado_en).length;

  /* preguntas presentes */
  const preguntas = A.preguntas.filter((p) => p.activa || C.some((e) => e.respuestas && e.respuestas[p.id]));
  const dist = preguntas.map((p) => {
    const n = [0, 0, 0, 0, 0]; C.forEach((e) => { const v = e.respuestas && e.respuestas[p.id]; if (v) n[v]++; });
    const tot = n[1] + n[2] + n[3] + n[4];
    return { p, n, tot };
  });
  const motivos = {}; C.forEach((e) => Object.entries(e.motivos || {}).forEach(([id, arr]) => arr.forEach((m) => (motivos[m] = (motivos[m] || 0) + 1))));
  const motTop = Object.entries(motivos).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const mejor = {}; C.forEach((e) => (e.lo_mejor || []).forEach((m) => (mejor[m] = (mejor[m] || 0) + 1)));
  const mejorTop = Object.entries(mejor).sort((a, b) => b[1] - a[1]).slice(0, 8);

  body.innerHTML = `
    ${r.demo ? `<div class="notice info demo-banner"><div class="grow">Estás viendo datos ficticios de ejemplo.</div><button class="btn small" id="rDemoOff">Ver datos reales</button></div>` : ''}
    <div class="kpis">
      ${kpi('Clientes satisfechos', pctTxt(st.sat, st.con), `${st.sat} de ${st.con} encuestas sin ninguna calificación Mal o Muy mal`)}
      ${kpi('Tasa de respuesta', pctTxt(st.con, st.reg), `${st.con} contestaron · ${st.reg - st.con} no contestaron`)}
      ${kpi('Nos recomendarían', pctTxt(st.recoSi, st.recoN), `${st.recoSi} de ${st.recoN} dijeron “Sí”`)}
      ${kpi('Regresaron', elegibles.length ? pctTxt(volvio, elegibles.length) : '—', elegibles.length ? `${volvio} de ${elegibles.length} con cita posterior en AgendaPro (7–60 días)` : 'Se mide 7 días después de la encuesta, con las citas subidas de AgendaPro')}
    </div>
    ${seccionTendencia(C)}
    <section class="card sec">
      <h2>Calificación por punto</h2>
      <p class="desc">Porcentaje de respuestas Bien o Excelente en cada pregunta.</p>
      <div class="legend">${ESCALA.map((e) => `<span><i style="background:${CHART[e.v]}"></i>${e.t}</span>`).join('')}</div>
      ${dist.map(({ p, n, tot }) => `<div class="dist"><span class="name">${esc(p.texto)}</span>
        <div class="stack-bar">${tot ? [1, 2, 3, 4].filter((v) => n[v]).map((v) => `<i style="flex:${n[v]};background:${CHART[v]}" data-tip="${esc(p.texto)}: ${ESCALA[v - 1].t} ${n[v]} (${pctTxt(n[v], tot)})"></i>`).join('') : '<i style="flex:1;background:#f0ede8"></i>'}</div>
        <span class="pct">${pctTxt(n[3] + n[4], tot)}</span></div>`).join('')}
    </section>
    <div class="grid2 even">
      <section class="card sec"><h2>Quejas más repetidas</h2><p class="desc">Motivos que eligieron quienes calificaron Mal o Muy mal.</p>
        ${hbars(motTop, 'Sin quejas en este periodo.')}</section>
      <section class="card sec"><h2>Lo que más les gustó</h2><p class="desc">Elegido por los clientes satisfechos.</p>
        ${hbars(mejorTop, 'Sin respuestas todavía.')}</section>
    </div>
    ${tablaGrupo('Por estilista', groupBy(E, 'estilista'), 'Estilista')}
    ${tablaGrupo('Por servicio', groupBy(E, 'servicio'), 'Servicio')}
    ${seccionRecuperar(C)}
    ${seccionNoContestaron(E)}
    ${seccionConfiabilidad(E)}
    ${seccionVerificar(D)}
    ${seccionRegalos(R)}
    ${seccionComentarios(C)}
    ${seccionNoEnc(D)}`;
  const off = $('#rDemoOff'); if (off) off.onclick = () => { r.demo = false; cargarResultados(); };
  bindResultados();
}

function kpi(lab, val, sub) { return `<div class="kpi"><div class="lab">${lab}</div><div class="val">${val}</div><div class="sub">${sub}</div></div>`; }
function hbars(list, vacio) {
  if (!list.length) return `<div class="empty">${vacio}</div>`;
  const max = Math.max(...list.map((x) => x[1]));
  return list.map(([t, n]) => `<div class="hbar"><span>${esc(t)}</span><div class="track"><i style="width:${(n / max) * 100}%" data-tip="${esc(t)}: ${n}"></i></div><b>${n}</b></div>`).join('');
}

function seccionTendencia(C) {
  const sem = {};
  C.forEach((e) => { const d = parseYmd(e.fecha); const lun = new Date(d); lun.setDate(d.getDate() - ((d.getDay() + 6) % 7)); const k = ymd(lun); const s = sem[k] || (sem[k] = { n: 0, s: 0 }); s.n++; if (e.satisfecho) s.s++; });
  const keys = Object.keys(sem).sort();
  if (keys.length < 2) return '';
  const W = 760, H = 190, L = 40, Rr = 34, T = 14, B = 30;
  const x = (i) => L + (i * (W - L - Rr)) / (keys.length - 1);
  const y = (v) => T + (1 - v / 100) * (H - T - B);
  const pts = keys.map((k, i) => [x(i), y((sem[k].s / sem[k].n) * 100), k]);
  const grid = [0, 50, 100].map((v) => `<line x1="${L}" x2="${W - Rr}" y1="${y(v)}" y2="${y(v)}" stroke="#ece7df"/><text x="${L - 8}" y="${y(v) + 4}" text-anchor="end" font-size="11" fill="#8a93a3">${v}%</text>`).join('');
  return `<section class="card sec trend"><h2>Clientes satisfechos por semana</h2><p class="desc">Semanas de lunes a domingo.</p>
    <svg viewBox="0 0 ${W} ${H}">${grid}
      <polyline fill="none" stroke="${CHART[4]}" stroke-width="2" points="${pts.map((p) => p[0] + ',' + p[1]).join(' ')}" vector-effect="non-scaling-stroke"/>
      ${pts.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="5" fill="${CHART[4]}" stroke="#fff" stroke-width="2"/>
        <rect x="${p[0] - 18}" y="${T}" width="36" height="${H - T - B}" fill="transparent" data-tip="Semana del ${fFechaCorta(p[2])}: ${Math.round((sem[p[2]].s / sem[p[2]].n) * 100)}% (${sem[p[2]].s} de ${sem[p[2]].n})"/>
        <text x="${p[0]}" y="${H - 8}" text-anchor="middle" font-size="11" fill="#8a93a3">${fFechaCorta(keys[i])}</text>`).join('')}
    </svg></section>`;
}

function tablaGrupo(titulo, g, col) {
  const rows = Object.entries(g).map(([k, rs]) => ({ k, ...stats(rs) })).sort((a, b) => b.reg - a.reg);
  if (!rows.length) return '';
  return `<section class="card sec"><h2>${titulo}</h2>
    <p class="desc">Una tasa de respuesta mucho menor que la del resto suele significar que no se está ofreciendo la tablet.</p>
    <div class="tablewrap"><table><thead><tr><th>${col}</th><th class="n">Visitas</th><th class="n">Contestaron</th><th class="n">Tasa resp.</th><th class="n">Satisfechos</th><th class="n">Recomiendan</th><th>Queja más repetida</th></tr></thead>
    <tbody>${rows.map((x) => `<tr><td><b>${esc(x.k)}</b></td><td class="n">${x.reg}</td><td class="n">${x.con}</td><td class="n">${pctTxt(x.con, x.reg)}</td>
      <td class="n">${pctTxt(x.sat, x.con)}</td><td class="n">${pctTxt(x.recoSi, x.recoN)}</td><td>${esc(x.top) || '<span class="tiny">—</span>'}</td></tr>`).join('')}</tbody></table></div></section>`;
}

function peoresTxt(e) {
  return S.aj.preguntas.filter((p) => e.respuestas && e.respuestas[p.id] && e.respuestas[p.id] <= 2)
    .map((p) => `${p.texto}: ${ESCALA[e.respuestas[p.id] - 1].t}${e.motivos && e.motivos[p.id] ? ` (${e.motivos[p.id].join(', ')})` : ''}`).join(' · ');
}

function seccionRecuperar(C) {
  const todos = C.filter((e) => !e.satisfecho).sort((a, b) => (!!a.contactado_en - !!b.contactado_en));
  const pend = todos.filter((e) => !e.contactado_en).length;
  const rows = S.res.verTodo === 'rec' ? todos : todos.slice(0, 12);
  return `<section class="card sec"><h2>Clientes por recuperar</h2>
    <p class="desc">Calificaron algo como Mal o Muy mal. Escríbeles el mismo día. ${todos.length ? `${pend} sin contactar de ${todos.length}.` : ''}</p>
    ${rows.length ? `<div class="tablewrap"><table><thead><tr><th>Fecha</th><th>Perrito / dueño</th><th>Estilista</th><th>Qué falló</th><th></th></tr></thead><tbody>
      ${rows.map((e) => `<tr><td>${fFechaCorta(e.fecha)}</td><td><b>${esc(e.mascota)}</b><div class="tiny">${esc(e.cliente || '')}</div></td><td>${esc(e.estilista || '')}</td>
        <td>${esc(peoresTxt(e))}${e.comentario ? `<div class="tiny">“${esc(e.comentario)}”</div>` : ''}</td>
        <td><div class="row" style="flex-wrap:nowrap">
          ${e.telefono ? `<a class="btn small" target="_blank" rel="noopener" href="${waLink(e.telefono, fill(S.aj.mensajes.insatisfecho, { cliente: primerNombre(e.cliente), mascota: e.mascota }))}">${ICONS.wa} WhatsApp</a>` : '<span class="tiny">Sin teléfono</span>'}
          ${e.contactado_en ? `<span class="pill good">Contactado</span>` : `<button class="btn small" data-contactado="${e.id}">Marcar contactado</button>`}
        </div></td></tr>`).join('')}</tbody></table></div>${verTodos('rec', todos.length, rows.length)}` : '<div class="empty">Nadie por recuperar en este periodo.</div>'}
  </section>`;
}

function verTodos(k, total, vistos) {
  return total > vistos ? `<div style="text-align:center;margin-top:10px"><button class="btn small" data-vertodo="${k}">Ver los ${total}</button></div>` : '';
}

function seccionNoContestaron(E) {
  const rows = E.filter((e) => e.estado !== 'contesto');
  const conTel = rows.filter((e) => e.telefono);
  return `<section class="card sec"><h2>No contestaron en tablet</h2>
    <p class="desc">${rows.length} visitas sin encuesta (${rows.filter((e) => e.estado === 'incompleta').length} dejadas a medias). Mándales un WhatsApp para pedir su calificación.</p>
    ${conTel.length ? `<div class="tablewrap"><table><thead><tr><th>Fecha</th><th>Perrito / dueño</th><th>Estilista</th><th>Estado</th><th></th></tr></thead><tbody>
      ${(S.res.verTodo === 'noc' ? conTel : conTel.slice(0, 12)).map((e) => `<tr><td>${fFechaCorta(e.fecha)}</td><td><b>${esc(e.mascota)}</b><div class="tiny">${esc(e.cliente || '')}</div></td><td>${esc(e.estilista || '')}</td>
        <td>${e.estado === 'incompleta' ? '<span class="pill gray">Sin terminar</span>' : '<span class="pill gray">No quiso</span>'}</td>
        <td><a class="btn small" target="_blank" rel="noopener" href="${waLink(e.telefono, fill(S.aj.mensajes.no_contesto, { cliente: primerNombre(e.cliente), mascota: e.mascota }))}">${ICONS.wa} WhatsApp</a></td></tr>`).join('')}
      </tbody></table></div>${verTodos('noc', conTel.length, Math.min(conTel.length, S.res.verTodo === 'noc' ? conTel.length : 12))}` : '<div class="empty">Sin visitas pendientes con teléfono.</div>'}
  </section>`;
}

function seccionConfiabilidad(E) {
  const C = E.filter((e) => e.estado === 'contesto');
  if (!C.length) return '';
  const umbral = S.aj.segundos_sospechosos;
  const todoExc = (e) => { const v = Object.values(e.respuestas || {}); return v.length && v.every((x) => x === 4); };
  const equipoExc = pct(C.filter(todoExc).length, C.length);
  const g = groupBy(E, 'estilista');
  const rows = Object.entries(g).map(([k, rs]) => {
    const c = rs.filter((e) => e.estado === 'contesto');
    const rap = c.filter((e) => e.segundos !== null && e.segundos < umbral).length;
    const exc = c.filter(todoExc).length;
    const sinTel = rs.filter((e) => !e.telefono).length;
    const flags = [];
    if (c.length >= 3 && pct(rap, c.length) >= 20) flags.push('Muchas encuestas muy rápidas');
    if (c.length >= 5 && pct(exc, c.length) - equipoExc >= 20) flags.push('“Todo Excelente” muy arriba del equipo');
    if (rs.length >= 5 && pct(sinTel, rs.length) >= 50) flags.push('Casi nunca trae teléfono');
    return { k, n: c.length, rap, exc, sinTel, reg: rs.length, flags };
  }).sort((a, b) => b.flags.length - a.flags.length || b.n - a.n);
  return `<section class="card sec"><h2>Confiabilidad de las respuestas</h2>
    <p class="desc">Señales de encuestas contestadas por el personal. El promedio del equipo con “todo Excelente” es ${equipoExc}%. Una alerta no prueba nada por sí sola: úsala para verificar con el cliente.</p>
    <div class="tablewrap"><table><thead><tr><th>Estilista</th><th class="n">Contestadas</th><th class="n">Menos de ${umbral} s</th><th class="n">Todo Excelente</th><th class="n">Sin teléfono</th><th>Revisar</th></tr></thead><tbody>
    ${rows.map((x) => `<tr><td><b>${esc(x.k)}</b></td><td class="n">${x.n}</td><td class="n">${pctTxt(x.rap, x.n)}</td><td class="n">${pctTxt(x.exc, x.n)}</td><td class="n">${pctTxt(x.sinTel, x.reg)}</td>
      <td>${x.flags.length ? x.flags.map((f) => `<span class="pill warn" style="margin:2px">${ICONS.alerta.replace('<svg', '<svg width="12" height="12"')} ${esc(f)}</span>`).join('') : '<span class="pill good">Sin alertas</span>'}</td></tr>`).join('')}
    </tbody></table></div></section>`;
}

function seccionVerificar(D) {
  const rows = D.verificar || [];
  const noRec = (D.encuestas || []).filter((e) => e.verificacion === 'no_reconocida');
  return `<section class="card sec"><h2>Verificación con clientes</h2>
    <p class="desc">El sistema elige al azar 1 de cada ${S.aj.verificar_cada} encuestas buenas con teléfono. Alguien fuera del spa le escribe al cliente para confirmar que sí la contestó.</p>
    ${noRec.length ? `<div class="notice bad" style="margin-bottom:10px">${noRec.length} encuesta(s) que el cliente no reconoce en este periodo: ${noRec.map((e) => `${esc(e.mascota)} (${esc(e.estilista || '')}, ${fFechaCorta(e.fecha)})`).join(', ')}.</div>` : ''}
    ${rows.length ? `<div class="tablewrap"><table><thead><tr><th>Fecha</th><th>Perrito / dueño</th><th>Estilista</th><th></th></tr></thead><tbody>
      ${rows.map((e) => `<tr><td>${fFechaCorta(e.fecha)}</td><td><b>${esc(e.mascota)}</b><div class="tiny">${esc(e.cliente || '')}</div></td><td>${esc(e.estilista || '')}</td>
        <td><div class="row" style="flex-wrap:nowrap">
          <a class="btn small" target="_blank" rel="noopener" href="${waLink(e.telefono, fill(S.aj.mensajes.verificacion, { cliente: primerNombre(e.cliente), mascota: e.mascota, fecha: fFecha(e.fecha) }))}">${ICONS.wa} WhatsApp</a>
          <button class="btn small" data-ver="confirmada" data-id="${e.id}">Confirmó</button>
          <button class="btn small danger" data-ver="no_reconocida" data-id="${e.id}">No la reconoce</button></div></td></tr>`).join('')}
      </tbody></table></div>` : '<div class="empty">No hay verificaciones pendientes.</div>'}
  </section>`;
}

function seccionRegalos(R) {
  if (!S.aj.regalos.activos && !R.length) return '';
  const h = hoy();
  const g = groupBy(R, 'opcion');
  const rows = Object.entries(g).map(([k, rs]) => ({ k, n: rs.length, c: rs.filter((x) => x.canjeado_en).length,
    p: rs.filter((x) => !x.canjeado_en && x.vence >= h).length, v: rs.filter((x) => !x.canjeado_en && x.vence < h).length })).sort((a, b) => b.n - a.n);
  return `<section class="card sec"><h2>Regalos</h2>
    <p class="desc">Regalos elegidos en el periodo. Cada regalo canjeado es un cliente que regresó.</p>
    ${rows.length ? `<div class="tablewrap"><table><thead><tr><th>Regalo</th><th class="n">Elegido</th><th class="n">% clientes</th><th class="n">Canjeados</th><th class="n">Pendientes</th><th class="n">Vencidos</th></tr></thead><tbody>
      ${rows.map((x) => `<tr><td><b>${esc(x.k)}</b></td><td class="n">${x.n}</td><td class="n">${pctTxt(x.n, R.length)}</td><td class="n">${x.c} (${pctTxt(x.c, x.n)})</td><td class="n">${x.p}</td><td class="n">${x.v}</td></tr>`).join('')}
      </tbody></table></div>` : '<div class="empty">Sin regalos elegidos en este periodo.</div>'}
  </section>`;
}

function seccionComentarios(C) {
  const rows = C.filter((e) => e.comentario).slice(0, 30);
  if (!rows.length) return '';
  return `<section class="card sec"><h2>Comentarios</h2>
    ${rows.map((e) => `<div style="padding:10px 0;border-top:1px solid var(--line)">
      <div class="row between"><b>${esc(e.mascota)} <span class="tiny">· ${esc(e.estilista || '')} · ${fFechaCorta(e.fecha)}</span></b>
      ${e.satisfecho ? '<span class="pill good">Satisfecho</span>' : '<span class="pill bad">Insatisfecho</span>'}</div>
      <div style="margin-top:4px">“${esc(e.comentario)}”</div></div>`).join('')}</section>`;
}

function seccionNoEnc(D) {
  const rows = D.noEnc || [];
  return `<section class="card sec"><h2>Clientes que pidieron no recibir encuestas</h2>
    <p class="desc">Si la lista crece mucho, revisa si se concentra en los clientes de un solo estilista.</p>
    ${rows.length ? `<div class="tablewrap"><table><thead><tr><th>Cliente</th><th>WhatsApp</th><th>Desde</th></tr></thead><tbody>
      ${rows.map((c) => `<tr><td>${esc(c.nombre || '—')}</td><td>${esc(c.telefono)}</td><td>${c.no_encuestar_desde ? fFecha(fechaLocalDeTs(c.no_encuestar_desde)) : ''}</td></tr>`).join('')}
    </tbody></table></div>` : '<div class="empty">Nadie en la lista.</div>'}</section>`;
}

function bindResultados() {
  const body = $('#rBody');
  $$('[data-contactado]', body).forEach((b) => (b.onclick = async () => {
    if (S.res.demo) return toast('Es un ejemplo.');
    const { error } = await sb.from('encuestas').update({ contactado_en: new Date().toISOString() }).eq('id', b.dataset.contactado);
    if (error) return toast(errMsg(error), true);
    cargarResultados();
  }));
  $$('[data-ver]', body).forEach((b) => (b.onclick = async () => {
    if (S.res.demo) return toast('Es un ejemplo.');
    const { error } = await sb.from('encuestas').update({ verificacion: b.dataset.ver, verificado_en: new Date().toISOString() }).eq('id', b.dataset.id);
    if (error) return toast(errMsg(error), true);
    cargarResultados();
  }));
  $$('[data-vertodo]', body).forEach((b) => (b.onclick = () => { S.res.verTodo = b.dataset.vertodo; pintarResultados(); }));
  /* tooltips */
  let tip = null;
  body.onpointermove = (ev) => {
    const t = ev.target.closest('[data-tip]');
    if (!t) { if (tip) { tip.remove(); tip = null; } return; }
    if (!tip) { tip = document.createElement('div'); tip.className = 'tip'; document.body.appendChild(tip); }
    tip.textContent = t.dataset.tip;
    tip.style.left = Math.min(ev.clientX + 12, innerWidth - 270) + 'px'; tip.style.top = ev.clientY + 14 + 'px';
  };
  body.onpointerleave = () => { if (tip) { tip.remove(); tip = null; } };
}

function exportarCSV() {
  const D = S.res.data; if (!D || !D.encuestas.length) return toast('No hay datos para exportar.', true);
  const pq = S.aj.preguntas;
  const head = ['fecha', 'hora', 'estado', 'folio', 'servicio', 'estilista', 'perrito', 'cliente', 'whatsapp', ...pq.map((p) => p.texto), 'motivos', 'recomendaria', 'lo_mejor', 'comentario', 'segundos', 'satisfecho', 'contactado', 'verificacion'];
  const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = D.encuestas.map((e) => [e.fecha, new Date(e.creado).toTimeString().slice(0, 5), e.estado, e.folio, e.servicio, e.estilista, e.mascota, e.cliente, e.telefono,
    ...pq.map((p) => (e.respuestas && e.respuestas[p.id] ? ESCALA[e.respuestas[p.id] - 1].t : '')),
    Object.values(e.motivos || {}).flat().join('; '), e.recomendaria || '', (e.lo_mejor || []).join('; '), e.comentario, e.segundos,
    e.estado === 'contesto' ? (e.satisfecho ? 'sí' : 'no') : '', e.contactado_en ? 'sí' : '', e.verificacion || ''].map(q).join(','));
  const blob = new Blob(['﻿' + [head.map(q).join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `encuestas-petspa_${S.res.desde}_${S.res.hasta}.csv`; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

/* datos ficticios para ver cómo se ve el tablero */
function datosDemo() {
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const estil = ['Estilista A', 'Estilista B', 'Estilista C', 'Estilista D'];
  const serv = ['Baño', 'Baño y corte', 'Corte de raza', 'Deslanado'];
  const perros = ['Coco', 'Luna', 'Max', 'Toby', 'Kira', 'Rocky', 'Nala', 'Bruno', 'Lola', 'Simba'];
  const duenos = ['Ana', 'Luis', 'Sofía', 'Diego', 'Mariana', 'Pablo', 'Regina', 'Andrés'];
  const enc = []; const reg = [];
  const pq = preguntasActivas();
  const d0 = S.res.desde; const d1 = S.res.hasta > hoy() ? hoy() : S.res.hasta;
  const dias = Math.max(1, diffDays(d0, d1) + 1);
  for (let i = 0; i < 140; i++) {
    const es = pick(estil); const fecha = addDays(d0, Math.floor(rnd() * dias));
    const tramposo = es === 'Estilista A' && rnd() < 0.45;
    const r = rnd();
    const estado = es === 'Estilista C' ? (r < 0.45 ? 'no_contesto' : r < 0.52 ? 'incompleta' : 'contesto') : (r < 0.12 ? 'no_contesto' : r < 0.16 ? 'incompleta' : 'contesto');
    const resp = {}; const mot = {};
    if (estado === 'contesto') pq.forEach((p) => {
      let v = tramposo ? 4 : (rnd() < 0.012 ? 1 : rnd() < 0.03 ? 2 : rnd() < 0.4 ? 3 : 4);
      if (p.id === 'precio' && !tramposo && rnd() < 0.08) v = 2;
      resp[p.id] = v; if (v <= 2 && p.motivos.length) mot[p.id] = [pick(p.motivos)];
    });
    const sat = estado === 'contesto' && pq.every((p) => resp[p.id] >= 3);
    const id = 'demo' + i;
    enc.push({ id, fecha, creado: fecha + 'T12:00:00', estado, estilista: es, servicio: pick(serv), mascota: pick(perros), cliente: pick(duenos),
      telefono: tramposo && rnd() < 0.8 ? null : '55' + String(10000000 + Math.floor(rnd() * 89999999)), folio: 'F' + (1000 + i),
      respuestas: resp, motivos: mot, lo_mejor: sat && rnd() < 0.6 ? [pick(S.aj.lo_mejor.opciones)] : [],
      recomendaria: estado === 'contesto' ? (sat ? (rnd() < 0.85 ? 'si' : 'tal_vez') : pick(['no', 'tal_vez'])) : null,
      comentario: estado === 'contesto' && rnd() < 0.12 ? (sat ? '¡Quedó precioso, gracias!' : 'Me lo entregaron todavía húmedo.') : null,
      segundos: estado === 'contesto' ? (tramposo ? 6 + Math.floor(rnd() * 6) : 18 + Math.floor(rnd() * 50)) : null,
      satisfecho: estado === 'contesto' ? sat : null, verificacion: tramposo && rnd() < 0.08 ? 'no_reconocida' : null, verificar: false });
    if (estado === 'contesto' && rnd() < 0.85) {
      const can = rnd() < 0.35;
      reg.push({ codigo: 'PS-D' + i, encuesta_id: id, opcion: pick(S.aj.regalos.opciones), creado: fecha, vence: addDays(fecha, 60), canjeado_en: can ? fecha : null });
    }
  }
  const citas = enc.filter((e) => e.telefono && rnd() < 0.4).map((e) => ({ telefono: e.telefono, fecha: addDays(e.fecha, 20 + Math.floor(rnd() * 25)) }));
  return { encuestas: enc, regalos: reg, noEnc: [], verificar: enc.filter((e) => e.estado === 'contesto' && e.satisfecho && e.telefono).slice(0, 3), citas };
}

/* ================================================================== */
/* AJUSTES                                                              */
/* ================================================================== */
function renderAjustes() {
  const a = S.aj;
  const lines = (arr) => (arr || []).join('\n');
  $('#main').innerHTML = `
  <div class="grid2 even">
    <div>
      <section class="card"><h2>Estilistas</h2><p class="desc muted" style="margin:4px 0 12px">Aparecen como opciones en la pantalla del personal.</p>
        <div id="lstEst"></div></section>
      <section class="card"><h2>Servicios</h2><div style="height:12px"></div><div id="lstSer"></div></section>
      <section class="card"><h2>Regalos para el cliente</h2>
        <label class="switch" style="margin-top:10px"><input type="checkbox" id="aRegAct" ${a.regalos.activos ? 'checked' : ''}> Ofrecer regalo al terminar</label>
        <div class="fields" style="margin-top:12px">
          <label class="f">Vigencia (días)<input type="number" id="aRegVig" min="7" max="365" value="${a.regalos.vigencia_dias}"></label>
          <label class="f">WhatsApp del spa (para el QR)<input type="tel" id="aRegWa" value="${esc(a.regalos.whatsapp_spa)}" placeholder="10 dígitos"></label>
          <label class="f full">Opciones (una por línea, todas para la próxima visita)<textarea id="aRegOps">${esc(lines(a.regalos.opciones))}</textarea></label>
        </div></section>
      <section class="card"><h2>Reglas</h2>
        <div class="fields" style="margin-top:12px">
          <label class="switch full" style="grid-column:1/-1"><input type="checkbox" id="aFolio" ${a.folio_obligatorio ? 'checked' : ''}> Pedir folio del ticket (no deja repetir folios)</label>
          <label class="f">No pedir encuesta al mismo cliente antes de (días)<input type="number" id="aDias" min="0" value="${a.dias_entre_encuestas}"></label>
          <label class="f">Sugerir “no volver a preguntar” tras (rechazos)<input type="number" id="aRech" min="1" value="${a.rechazos_sugerir}"></label>
          <label class="f">Verificar 1 de cada (encuestas buenas)<input type="number" id="aVer" min="1" value="${a.verificar_cada}"></label>
          <label class="f">Encuesta sospechosa si dura menos de (segundos)<input type="number" id="aSeg" min="3" value="${a.segundos_sospechosos}"></label>
          <label class="f">Registrar como “sin terminar” tras (segundos sin tocar)<input type="number" id="aInac" min="30" value="${a.inactividad_seg}"></label>
        </div></section>
    </div>
    <div>
      <section class="card"><h2>Preguntas</h2><p class="muted" style="margin:4px 0 12px">Cada una se califica con 4 caritas. Si eligen Mal o Muy mal, aparecen los motivos (uno por línea).</p>
        ${a.preguntas.map((p, i) => `<div class="qedit">
          <label class="switch"><input type="checkbox" data-pa="${i}" ${p.activa ? 'checked' : ''}> Activa</label>
          <label class="f" style="margin-top:8px">Pregunta<input type="text" data-pt="${i}" value="${esc(p.texto)}"></label>
          <label class="f" style="margin-top:8px">Motivos de queja<textarea data-pm="${i}">${esc(lines(p.motivos))}</textarea></label></div>`).join('')}
        <div class="qedit"><label class="switch"><input type="checkbox" id="aReco" ${a.recomendar.activa ? 'checked' : ''}> Pregunta final Sí / Tal vez / No</label>
          <label class="f" style="margin-top:8px">Texto<input type="text" id="aRecoT" value="${esc(a.recomendar.texto)}"></label></div>
        <div class="qedit"><label class="switch"><input type="checkbox" id="aMej" ${a.lo_mejor.activa ? 'checked' : ''}> Preguntar “¿qué fue lo que más te gustó?” a los satisfechos</label>
          <label class="f" style="margin-top:8px">Opciones (una por línea)<textarea id="aMejO">${esc(lines(a.lo_mejor.opciones))}</textarea></label></div>
        <div class="qedit"><label class="switch"><input type="checkbox" id="aCom" ${a.comentario ? 'checked' : ''}> Caja de comentario opcional</label></div>
      </section>
      <section class="card"><h2>Mensajes de WhatsApp</h2>
        <p class="tiny" style="margin:4px 0 10px">Puedes usar {cliente}, {mascota}, {fecha}, {codigo}, {regalo} y {vence}.</p>
        ${[['insatisfecho', 'Cliente insatisfecho'], ['no_contesto', 'No contestó en tablet'], ['verificacion', 'Verificación'], ['codigo', 'Enviar código de regalo'], ['guardar_codigo', 'QR “guardarlo en mi WhatsApp”']]
          .map(([k, t]) => `<label class="f" style="margin-top:8px">${t}<textarea data-msg="${k}">${esc(a.mensajes[k])}</textarea></label>`).join('')}
      </section>
      <section class="card"><h2>Mi contraseña</h2>
        <form id="pwForm" class="row" style="margin-top:10px;flex-wrap:nowrap"><input type="password" id="pwNew" placeholder="Nueva contraseña (mín. 8)" autocomplete="new-password"><button class="btn" type="submit">Cambiar</button></form>
        <p class="tiny" style="margin:8px 0 0">Para cambiar la de recepción, entra con esa cuenta y cámbiala en este mismo lugar.</p></section>
    </div>
  </div>
  <div style="position:sticky;bottom:12px;margin-top:16px;display:flex;justify-content:flex-end">
    <button class="btn primary big" id="aGuardar" style="box-shadow:var(--shadow)">Guardar ajustes</button></div>`;
  renderLista('lstEst', 'estilistas', S.estilistas, 'Nombre del estilista');
  renderLista('lstSer', 'servicios', S.servicios, 'Nombre del servicio');
  $('#aGuardar').onclick = () => guardarAjustes(false);
  $('#pwForm').onsubmit = async (e) => {
    e.preventDefault(); const p = $('#pwNew').value;
    if (p.length < 8) return toast('Usa al menos 8 caracteres.', true);
    const { error } = await sb.auth.updateUser({ password: p });
    if (error) return toast(errMsg(error), true);
    $('#pwNew').value = ''; toast('Contraseña actualizada.');
  };
}

function renderLista(elId, tabla, items, ph) {
  const el = $('#' + elId);
  el.innerHTML = `<div class="list-edit">
    ${items.map((x) => `<div class="item"><input type="text" value="${esc(x.nombre)}" data-ren="${x.id}">
      <label class="switch tiny"><input type="checkbox" data-act="${x.id}" ${x.activo ? 'checked' : ''}> Activo</label>
      <button class="btn small danger" data-del="${x.id}">Quitar</button></div>`).join('') || '<div class="tiny">Todavía no hay ninguno.</div>'}
    <form class="item" data-add><input type="text" placeholder="${ph}"><button class="btn small primary" type="submit">Agregar</button></form></div>`;
  const recargar = async () => { await cargarCatalogos(); renderLista(elId, tabla, tabla === 'estilistas' ? S.estilistas : S.servicios, ph); };
  $('[data-add]', el).onsubmit = async (e) => {
    e.preventDefault(); const v = e.target.querySelector('input').value.trim(); if (!v) return;
    const { error } = await sb.from(tabla).insert({ nombre: v }); if (error) return toast(errMsg(error), true); recargar();
  };
  $$('[data-ren]', el).forEach((i) => (i.onchange = async () => {
    const v = i.value.trim(); if (!v) return;
    const { error } = await sb.from(tabla).update({ nombre: v }).eq('id', i.dataset.ren); if (error) return toast(errMsg(error), true); toast('Guardado.'); recargar();
  }));
  $$('[data-act]', el).forEach((i) => (i.onchange = async () => {
    const { error } = await sb.from(tabla).update({ activo: i.checked }).eq('id', i.dataset.act); if (error) return toast(errMsg(error), true); recargar();
  }));
  $$('[data-del]', el).forEach((b) => (b.onclick = async () => {
    if (!confirm('¿Quitar de la lista? Las encuestas anteriores conservan el nombre.')) return;
    const { error } = await sb.from(tabla).delete().eq('id', b.dataset.del); if (error) return toast(errMsg(error), true); recargar();
  }));
}

async function guardarAjustes(silencioso) {
  const a = structuredClone(S.aj);
  if (!silencioso && $('#aGuardar')) {
    const lines = (t) => t.split('\n').map((x) => x.trim()).filter(Boolean);
    const num = (id, min) => Math.max(min, parseInt($('#' + id).value, 10) || min);
    a.preguntas.forEach((p, i) => {
      p.activa = $(`[data-pa="${i}"]`).checked;
      p.texto = $(`[data-pt="${i}"]`).value.trim() || p.texto;
      p.motivos = lines($(`[data-pm="${i}"]`).value);
    });
    if (!a.preguntas.some((p) => p.activa)) return toast('Deja al menos una pregunta activa.', true);
    a.recomendar = { activa: $('#aReco').checked, texto: $('#aRecoT').value.trim() || DEF.recomendar.texto };
    a.lo_mejor = { activa: $('#aMej').checked, opciones: lines($('#aMejO').value) };
    a.comentario = $('#aCom').checked;
    a.folio_obligatorio = $('#aFolio').checked;
    a.dias_entre_encuestas = num('aDias', 0); a.rechazos_sugerir = num('aRech', 1); a.verificar_cada = num('aVer', 1);
    a.segundos_sospechosos = num('aSeg', 3); a.inactividad_seg = num('aInac', 30);
    const wa = $('#aRegWa').value.replace(/\D/g, '');
    if (wa && wa.length !== 10 && wa.length !== 12) return toast('El WhatsApp del spa debe tener 10 dígitos.', true);
    a.regalos = { activos: $('#aRegAct').checked, vigencia_dias: num('aRegVig', 7), whatsapp_spa: wa, opciones: lines($('#aRegOps').value) };
    $$('[data-msg]').forEach((t) => (a.mensajes[t.dataset.msg] = t.value.trim() || DEF.mensajes[t.dataset.msg]));
  }
  const { error } = await sb.from('ajustes').update({ datos: a, actualizado: new Date().toISOString() }).eq('id', 1);
  if (error) return toast(errMsg(error), true);
  S.aj = a;
  if (!silencioso) toast('Ajustes guardados.');
}

/* ------------------------------------------------------------------ */
sb.auth.onAuthStateChange((ev) => { if (ev === 'SIGNED_OUT') renderLogin(); });
boot().catch((e) => renderLogin(errMsg(e)));
