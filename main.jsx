import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Bot, Video, Store, Calendar, MessageCircle, Plus, Play, Square, Copy, Download, Trash2, CheckCircle2, Mic, Volume2, Film, Loader2, AlertTriangle, Send, HelpCircle } from 'lucide-react';
import './style.css';
import { makeScript, makeVideoPrompt } from './scriptEngine.js';

const initial = [
  { id: 1, name: 'Punto de venta RMARC', price: '$700', desc: 'Sistema para celular, tablet o computadora. Ventas, inventario y reportes.' },
  { id: 2, name: 'POS para billar', price: '$700', desc: 'Control de mesas, cronómetro, cobros y reportes en tiempo real.' }
];
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d } catch { return d } };

function App() {
  // ---------- Estado base (conservado de V2/V3) ----------
  const [tab, setTab] = useState('panel');
  const [products, setProducts] = useState(() => load('rmarc-products', initial));
  const [campaigns, setCampaigns] = useState(() => load('rmarc-campaigns', []));
  const [leads, setLeads] = useState(() => load('rmarc-leads', []));
  const [active, setActive] = useState(false);
  const [product, setProduct] = useState('1');
  const [style, setStyle] = useState('directo');
  const [business, setBusiness] = useState('RMARC');
  const [name, setName] = useState(''), [price, setPrice] = useState(''), [desc, setDesc] = useState('');
  const [customer, setCustomer] = useState(''), [contact, setContact] = useState(''), [notes, setNotes] = useState('');
  const [selected, setSelected] = useState(null);
  const [speaking, setSpeaking] = useState(false);
  const [notice, setNotice] = useState('');
  const [avatar, setAvatar] = useState('');
  const [studioText, setStudioText] = useState('');
  const [studioMode, setStudioMode] = useState('');
  const [femaleVoice, setFemaleVoice] = useState('');
  const [voices, setVoices] = useState([]);
  const lastScriptRef = useRef('');

  // ---------- Estado Kling (generación de video con la API oficial) ----------
  const [klingStatus, setKlingStatus] = useState('idle'); // idle | sending | en_cola | procesando | listo | fallido
  const [klingMsg, setKlingMsg] = useState('');
  const [klingErr, setKlingErr] = useState(null);
  const [klingVideo, setKlingVideo] = useState('');
  const [klingTask, setKlingTask] = useState(null);
  const [klingElapsed, setKlingElapsed] = useState(0);
  const [klingDuration, setKlingDuration] = useState('10');
  const [klingModel, setKlingModel] = useState('kling-v1-6');
  const [klingAspect, setKlingAspect] = useState('9:16');
  const [klingQuality, setKlingQuality] = useState('std');
  const [klingPrompt, setKlingPrompt] = useState('');
  const [klingUsePhoto, setKlingUsePhoto] = useState(true);
  const [videosArchive, setVideosArchive] = useState(() => load('rmarc-videos', []));
  const [klingInfo, setKlingInfo] = useState(null);

  useEffect(() => localStorage.setItem('rmarc-products', JSON.stringify(products)), [products]);
  useEffect(() => localStorage.setItem('rmarc-campaigns', JSON.stringify(campaigns)), [campaigns]);
  useEffect(() => localStorage.setItem('rmarc-leads', JSON.stringify(leads)), [leads]);
  useEffect(() => localStorage.setItem('rmarc-videos', JSON.stringify(videosArchive)), [videosArchive]);
  useEffect(() => {
    const t = setInterval(() => {
      if (!active) return;
      const today = new Date().toISOString().slice(0, 10);
      const key = 'rmarc-auto-' + today;
      if (localStorage.getItem(key)) return;
      const p = products[0];
      if (p) { setCampaigns(c => [makeCampaign(p, business, 'promoción'), ...c]); localStorage.setItem(key, '1') }
    }, 30000);
    return () => clearInterval(t);
  }, [active, products, business]);

  // ---------- Guion IA local (motor AIDA con variación real) ----------
  const makeCampaign = (p, b, s) => ({
    id: Date.now() + Math.random(),
    date: new Date().toLocaleString('es-MX'),
    product: p.name,
    script: makeScript({ product: p, business: b, style: s, avoid: lastScriptRef.current }),
    status: 'Guion IA listo'
  });
  const create = () => {
    const p = products.find(x => String(x.id) === String(product)) || products[0];
    if (!p) return;
    const c = makeCampaign(p, business, style);
    lastScriptRef.current = c.script;
    setCampaigns(x => [c, ...x]);
    setSelected(c.id);
    setTab('videos');
    setNotice('Guion IA creado con estructura publicitaria y redacción variada. Puedes escucharlo en español.');
  };

  const speak = (s) => {
    if (!('speechSynthesis' in window)) { setNotice('Este navegador no admite lectura de voz.'); return }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(s);
    u.lang = 'es-MX'; u.rate = .95;
    const v = speechSynthesis.getVoices();
    u.voice = v.find(x => x.lang.toLowerCase() === 'es-mx') || v.find(x => x.lang.startsWith('es')) || null;
    u.onstart = () => setSpeaking(true); u.onend = () => setSpeaking(false); u.onerror = () => setSpeaking(false);
    speechSynthesis.speak(u);
  };
  const copy = async (s) => { try { await navigator.clipboard.writeText(s); setNotice('Texto copiado') } catch { setNotice('No fue posible copiar') } };
  const download = (c) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([c.script], { type: 'text/plain;charset=utf-8' }));
    a.download = `RMARC-guion-${String(c.id).split('.')[0]}.txt`; a.click(); URL.revokeObjectURL(a.href);
  };

  // ---------- Voz del estudio (conservada) ----------
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const refresh = () => setVoices(speechSynthesis.getVoices().filter(v => v.lang.toLowerCase().startsWith('es')));
    refresh();
    speechSynthesis.addEventListener?.('voiceschanged', refresh);
    return () => speechSynthesis.removeEventListener?.('voiceschanged', refresh);
  }, []);
  const speakStudio = () => {
    if (!studioText.trim()) return setNotice('Primero escribe o selecciona un guion');
    if (!('speechSynthesis' in window)) return setNotice('Este navegador no permite reproducir voz');
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(studioText);
    u.lang = 'es-MX'; u.rate = 1.04; u.pitch = 1.18;
    const preferred = voices.find(v => v.name === femaleVoice)
      || voices.find(v => /paulina|monica|mónica|sabina|female|mujer|sofia|sofía|paloma|luciana|helena/i.test(v.name))
      || voices.find(v => v.lang.toLowerCase() === 'es-mx') || voices[0];
    if (preferred) u.voice = preferred;
    u.onstart = () => setSpeaking(true); u.onend = () => setSpeaking(false);
    u.onerror = () => { setSpeaking(false); setNotice('La voz no pudo reproducirse en este navegador') };
    speechSynthesis.speak(u);
  };

  const nav = [['panel', Bot, 'Panel'], ['productos', Store, 'Productos'], ['crear', Video, 'Crear'], ['videos', Calendar, 'Contenido'], ['estudio', Video, 'Estudio'], ['clientes', MessageCircle, 'Clientes']];

  // ---------- Kling: helpers ----------
  const klingBusy = klingStatus === 'sending' || klingStatus === 'en_cola' || klingStatus === 'procesando';
  const klingApi = async (payload) => {
    const r = await fetch('/api/kling', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    let j = null; try { j = await r.json() } catch { }
    if (!r.ok) {
      const e = new Error((j && j.mensaje) || ('Error HTTP ' + r.status + ' en /api/kling'));
      e.data = j; throw e;
    }
    return j;
  };
  const normalizeErr = (e) => ({
    codigo: e?.data?.codigoKling,
    mensaje: e?.message || 'Error desconocido',
    pista: e?.data?.pista || (e?.data && e?.data.error === 'faltan_credenciales' ? 'Configura KLING_API_KEY en Vercel (Settings → Environment Variables) y redespliega.' : 'Pulsa «Probar conexión Kling» para ver el diagnóstico completo.')
  });
  const probarKling = async () => {
    setKlingInfo(null); setKlingErr(null); setKlingMsg('Verificando conexión con la API oficial de Kling…');
    try {
      const j = await klingApi({ action: 'verify' });
      setKlingInfo(j);
      setKlingMsg(j.ok ? 'Conexión con Kling verificada: credenciales aceptadas.' : 'El diagnóstico detectó un problema. Revisa el detalle.');
    } catch (e) {
      setKlingInfo({ ok: false, diagnostico: e.message });
      setKlingMsg('No se pudo completar la verificación.');
    }
  };
  const generarKling = async () => {
    setKlingErr(null); setKlingInfo(null); setKlingVideo('');
    if (!klingPrompt.trim()) { setNotice('Escribe el guion o pulsa «Preparar prompt con IA» primero'); return }
    const useImage = Boolean(avatar) && klingUsePhoto;
    const model = klingDuration === '15' ? 'kling-v3' : klingModel;
    const mode = useImage ? 'image' : 'text';
    setKlingStatus('sending'); setKlingElapsed(0);
    setKlingMsg(useImage ? 'Enviando tu fotografía y el guion a Kling…' : 'Enviando el guion a Kling…');
    try {
      const j = await klingApi({
        action: 'create', mode, model,
        duration: klingDuration, aspect: klingAspect, quality: klingQuality,
        prompt: klingPrompt.slice(0, 2500), image: useImage ? avatar : ''
      });
      setKlingTask({ taskId: j.taskId, mode, model });
      setKlingStatus('en_cola');
      setKlingMsg(`Tarea creada en Kling (${String(j.taskId).slice(0, 12)}…). Modelo ${model}, ${klingDuration} s. Esperando turno de generación…`);
    } catch (e) {
      setKlingStatus('fallido'); setKlingErr(normalizeErr(e)); setKlingMsg('No se pudo iniciar la generación.');
    }
  };
  const pollKling = async () => {
    const t = klingTask;
    if (!t) return;
    try {
      const j = await klingApi({ action: 'status', taskId: t.taskId, mode: t.mode });
      if (j.estado === 'listo' && j.videos && j.videos[0]) {
        const url = j.videos[0].url;
        setKlingStatus('listo'); setKlingVideo(url);
        setKlingMsg(`Video de ${klingDuration} s listo. Descárgalo pronto: el enlace de Kling tiene vigencia limitada.`);
        setVideosArchive(a => [{ id: Date.now(), date: new Date().toLocaleString('es-MX'), url, duration: klingDuration, model: t.model }, ...a].slice(0, 20));
      } else if (j.estado === 'fallido') {
        setKlingStatus('fallido');
        setKlingErr({ codigo: null, mensaje: j.mensajeKling || 'Kling reportó la tarea como fallida.', pista: 'Ajusta el guion (evita solicitudes no permitidas), prueba otro modelo o reintenta. También puede faltar saldo/paquete en tu cuenta Kling (errores 1101/1102).' });
        setKlingMsg('La generación falló.');
      } else {
        setKlingStatus(j.estado === 'en_cola' ? 'en_cola' : 'procesando');
        setKlingMsg(j.progreso || 'Kling sigue trabajando en tu video…');
      }
    } catch (e) {
      setKlingMsg('Reintento en curso: ' + (e.message || 'error de red'));
      setKlingStatus('procesando');
    }
  };
  // Encuesta de progreso cada 8 s mientras haya tarea activa
  useEffect(() => {
    if (!klingBusy || klingStatus === 'sending' || !klingTask) return;
    const id = setTimeout(() => { pollKling() }, 8000);
    return () => clearTimeout(id);
  }, [klingStatus, klingTask]);
  useEffect(() => {
    if (!klingBusy) return;
    const id = setInterval(() => setKlingElapsed(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [klingBusy]);
  const detenerKling = () => { setKlingStatus('idle'); setKlingMsg('Monitoreo detenido. La tarea puede seguir en Kling; revisa la consola si necesario.'); };
  const fmtElapsed = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const currentProduct = products.find(x => String(x.id) === String(product)) || products[0];

  return (
    <div className="app">
      <aside>
        <div className="brand"><span className="logo">R</span><div><strong>RMARC VIDEO AI</strong><small>Granja de bots · versión Kling</small></div></div>
        <nav>{nav.map(([id, I, label]) => <button className={tab === id ? 'chosen' : ''} onClick={() => setTab(id)} key={id}><I size={19} />{label}</button>)}</nav>
        <div className="sidefoot">Los datos se guardan en este dispositivo.<br />Sin cuentas falsas ni envíos masivos.</div>
      </aside>
      <main>
        <header>
          <div>
            <h1>{({ panel: 'Centro de operaciones', productos: 'Catálogo de productos', crear: 'Creador de contenido', videos: 'Contenido generado', clientes: 'Prospectos de venta', estudio: 'Estudio de video' })[tab]}</h1>
            <p>Administra publicidad y ventas desde tu celular</p>
          </div>
          <span className="tag">DEMO FUNCIONAL</span>
        </header>
        {notice && <div className="notice" onClick={() => setNotice('')}>{notice} ×</div>}

        {tab === 'panel' && <>
          <div className="stats">
            <article><small>Productos</small><b>{products.length}</b></article>
            <article><small>Guiones</small><b>{campaigns.length}</b></article>
            <article><small>Videos Kling</small><b>{videosArchive.length}</b></article>
          </div>
          <section>
            <h2><Bot size={21} /> Bot coordinador</h2>
            <p>En esta versión de prueba, el bot crea un guion diario con el motor IA local mientras la aplicación esté abierta. Los videos se generan manualmente con Kling desde el Estudio.</p>
            <div className="inline">
              <button className={active ? 'danger' : 'primary'} onClick={() => setActive(!active)}>
                {active ? <><Square size={17} /> Detener bot</> : <><Play size={17} /> Activar bot de prueba</>}
              </button>
              <span className={active ? 'on' : 'off'}>{active ? 'Bot activo en esta pestaña' : 'Bot detenido'}</span>
            </div>
          </section>
          <section>
            <h2>Secuencia del proyecto</h2>
            <div className="steps">
              <div><CheckCircle2 /> Panel, productos y guiones</div>
              <div><CheckCircle2 /> Lectura de voz del navegador</div>
              <div><CheckCircle2 /> Guiones con IA local (estructura AIDA, sin repetición)</div>
              <div><CheckCircle2 /> Conexión con la API oficial de Kling (API Key en Vercel)</div>
              <div>◯ Sincronización de labios de la presentadora (lip sync)</div>
              <div>◯ Automatización en servidor 24/7</div>
              <div>◯ WhatsApp y publicación autorizada en redes</div>
            </div>
          </section>
        </>}

        {tab === 'productos' && <>
          <section>
            <h2><Plus size={20} /> Agregar producto o negocio</h2>
            <form onSubmit={e => {
              e.preventDefault();
              if (!name.trim()) return;
              setProducts(p => [...p, { id: Date.now(), name, price: price || 'Consultar', desc }]);
              setName(''); setPrice(''); setDesc('');
            }}>
              <div className="fields">
                <label>Nombre<input value={name} onChange={e => setName(e.target.value)} required placeholder="Ej. Catálogo digital" /></label>
                <label>Precio<input value={price} onChange={e => setPrice(e.target.value)} placeholder="$700" /></label>
              </div>
              <label>Descripción<textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Características y beneficios" /></label>
              <button className="primary">Guardar producto</button>
            </form>
          </section>
          <div className="cards">
            {products.map(p => (
              <section key={p.id}>
                <h3>{p.name}</h3>
                <strong>{p.price}</strong>
                <p>{p.desc}</p>
                <button className="light" onClick={() => { setProduct(String(p.id)); setTab('crear') }}>Crear anuncio</button>
                {' '}
                <button className="light" onClick={() => setProducts(v => v.filter(x => x.id !== p.id))}><Trash2 size={15} /></button>
              </section>
            ))}
          </div>
        </>}

        {tab === 'crear' && <section>
          <h2><Video size={20} /> Preparar publicidad</h2>
          <p>El motor IA local redacta el anuncio con estructura publicitaria (AIDA) y redacción distinta en cada generación: ya no repite el mismo texto.</p>
          <label>Nombre del negocio<input value={business} onChange={e => setBusiness(e.target.value)} /></label>
          <label>Producto<select value={product} onChange={e => setProduct(e.target.value)}>{products.map(p => <option value={p.id} key={p.id}>{p.name}</option>)}</select></label>
          <label>Estilo<select value={style} onChange={e => setStyle(e.target.value)}>
            <option value="directo">Venta directa</option>
            <option value="promoción">Promoción</option>
            <option value="informativo">Informativo</option>
          </select></label>
          <button className="primary" onClick={create}><Bot size={18} /> Generar guion con IA</button>
          <p className="hint">La voz usa la función de lectura del navegador. Para convertir el guion en video usa el Estudio → «Generar video con Kling».</p>
        </section>}

        {tab === 'videos' && <>
          {campaigns.length === 0 ? <section>No hay guiones. Ve a «Crear» para generar el primero.</section> : campaigns.map(c => (
            <section key={c.id}>
              <div className="between"><h3>{c.product}</h3><span className="tag">{c.status}</span></div>
              <small>{c.date}</small>
              <p className="script">{c.script}</p>
              <div className="inline">
                <button className="primary" onClick={() => speak(c.script)}><Volume2 size={17} /> Escuchar</button>
                <button className="light" onClick={() => copy(c.script)}><Copy size={17} /> Copiar</button>
                <button className="light" onClick={() => download(c)}><Download size={17} /> TXT</button>
                <button className="light" onClick={() => setCampaigns(v => v.filter(x => x.id !== c.id))}><Trash2 size={17} /></button>
              </div>
            </section>
          ))}
        </>}

        {tab === 'estudio' && <>
          <section>
            <h2><Video size={20} /> Estudio de video — presentadora animada</h2>
            <p>Prueba la presentadora de estilo 3D con una voz femenina en español. Esta es una vista animada de prueba; el video MP4 se genera aparte con Kling.</p>
            <div className={'presenter ' + (speaking ? 'talking' : '')}>
              <div className="presenter-stage">
                <div className="presenter-halo" />
                <div className="presenter-person">
                  <div className="presenter-hair-back" />
                  <div className="presenter-neck" />
                  <div className="presenter-body">
                    <div className="presenter-shirt" />
                    <div className="presenter-lapel left" />
                    <div className="presenter-lapel right" />
                  </div>
                  <div className="presenter-head">
                    <div className="presenter-hair-top" />
                    <div className="presenter-eyes"><i /><i /></div>
                    <div className="presenter-nose" />
                    <div className="presenter-mouth" />
                  </div>
                </div>
              </div>
              <strong>Presentadora RMARC</strong>
              <small>Voz joven y alegre · español</small>
            </div>
            <label>Guion para narración<textarea value={studioText} onChange={e => setStudioText(e.target.value)} placeholder="Escribe el texto o carga un guion guardado" /></label>
            <label>Utilizar guion guardado<select value={studioMode} onChange={e => { setStudioMode(e.target.value); const c = campaigns.find(c => String(c.id) === e.target.value); if (c) setStudioText(c.script) }}>
              <option value="">Selecciona un guion</option>
              {campaigns.map(c => <option key={c.id} value={c.id}>{c.product} — {c.date}</option>)}
            </select></label>
            <label>Voz en español<select value={femaleVoice} onChange={e => setFemaleVoice(e.target.value)}>
              <option value="">Automática (preferencia femenina)</option>
              {voices.map(v => <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>)}
            </select></label>
            <div className="inline">
              <button className="primary" onClick={speakStudio}><Volume2 size={17} /> {speaking ? 'Reiniciar voz' : 'Escuchar presentadora'}</button>
              <button className="light" onClick={() => { speechSynthesis.cancel(); setSpeaking(false) }}><Square size={17} /> Detener</button>
              <button className="light" onClick={() => {
                if (!studioText.trim()) return setNotice('Selecciona un guion');
                const blob = new Blob([studioText], { type: 'text/plain;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = 'RMARC-guion-estudio.txt'; a.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
              }}><Download size={17} /> Descargar guion</button>
            </div>
            <details className="studio-optional">
              <summary>Usar mi propia fotografía (opcional)</summary>
              <label>Fotografía del personaje (JPG o PNG)
                <input type="file" accept="image/png,image/jpeg" onChange={e => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  if (f.size > 5000000) { setNotice('Imagen demasiado grande: máximo 5 MB'); return }
                  const r = new FileReader();
                  r.onload = () => setAvatar(String(r.result));
                  r.readAsDataURL(f);
                }} />
              </label>
              {avatar && <img src={avatar} alt="Vista previa de fotografía" style={{ width: '100%', maxWidth: 280, borderRadius: 12, marginTop: 12 }} />}
            </details>
            <p className="hint">La voz depende de las voces instaladas en el dispositivo y puede variar. La animación acompaña la reproducción, pero no es sincronización labial fonética.</p>
          </section>

          {/* ============ Panel Kling: API oficial ============ */}
          <section>
            <h2><Film size={20} /> Generar video con Kling — API oficial</h2>
            <p>Convierte el guion en video real con Kling. Si subiste una fotografía arriba, se anima esa imagen (image-to-video); si no, se genera desde el texto (text-to-video). Las claves Kling viven solo en Vercel: nunca se piden ni se muestran aquí.</p>
            <label>Prompt para el video<textarea value={klingPrompt} onChange={e => setKlingPrompt(e.target.value)} placeholder="Guion o descripción del movimiento para Kling (máximo 2500 caracteres)" /></label>
            <div className="inline" style={{ marginBottom: 10 }}>
              <button className="light" onClick={() => { const t = studioText.trim(); if (!t) return setNotice('Primero escribe o carga un guion en el Estudio'); setKlingPrompt(t.slice(0, 2500)); setNotice('Guion copiado al prompt de Kling') }}><Copy size={16} /> Usar guion del Estudio</button>
              <button className="light" onClick={() => { const base = studioText.trim() || klingPrompt.trim(); if (!base) return setNotice('Primero escribe o carga un guion'); setKlingPrompt(makeVideoPrompt({ product: currentProduct, guion: base, mode: avatar && klingUsePhoto ? 'image' : 'text' })); setNotice('Prompt visual preparado con IA local') }}><Bot size={16} /> Preparar prompt con IA</button>
            </div>
            <div className="fields">
              <label>Duración del video<select value={klingDuration} onChange={e => setKlingDuration(e.target.value)}>
                <option value="5">5 segundos (Kling 3.0)</option>
                <option value="10">10 segundos (Kling 3.0)</option>
                <option value="15">15 segundos (Kling 3.0 · kling-v3)</option>
              </select></label>
              <label>Modelo de Kling<select value={klingDuration === '15' ? 'kling-v3' : klingModel} disabled={klingDuration === '15'} onChange={e => setKlingModel(e.target.value)}>
                {klingDuration === '15'
                  ? <option value="kling-v3">Kling 3.0 (kling-v3) — fijo para 15 s</option>
                  : <>
                    <option value="kling-v1-6">Kling 3.0 — estándar (API Key)</option>
                    <option value="kling-v2-1-master">Kling 3.0 — calidad alta (API Key)</option>
                  </>}
              </select></label>
              <label>Formato<select value={klingAspect} onChange={e => setKlingAspect(e.target.value)}>
                <option value="9:16">Vertical 9:16 (Reels / TikTok)</option>
                <option value="16:9">Horizontal 16:9 (YouTube)</option>
                <option value="1:1">Cuadrado 1:1</option>
              </select></label>
              <label>Calidad<select value={klingQuality} onChange={e => setKlingQuality(e.target.value)}>
                <option value="std">Estándar (más rápida)</option>
                <option value="pro">Profesional (más detalle)</option>
              </select></label>
            </div>
            <label className="check">
              <input type="checkbox" checked={avatar ? klingUsePhoto : false} disabled={!avatar} onChange={e => setKlingUsePhoto(e.target.checked)} />
              {!avatar
                ? 'Animar mi fotografía (sube una foto arriba para activar)'
                : 'Animar mi fotografía subida (image-to-video)'}
            </label>
            <div className="inline">
              <button className="primary" onClick={generarKling} disabled={klingBusy}>
                {klingStatus === 'sending' ? <><Loader2 size={17} className="spin" /> Enviando a Kling…</> : <><Send size={17} /> Generar video con Kling</>}
              </button>
              <button className="light" onClick={probarKling} disabled={klingStatus === 'sending'}><HelpCircle size={16} /> Probar conexión Kling</button>
              {klingBusy && <button className="danger" onClick={detenerKling}><Square size={16} /> Detener monitoreo</button>}
            </div>

            {(klingMsg || klingBusy) && (
              <div className={'kling-status ' + (klingStatus === 'listo' ? 'ok' : klingStatus === 'fallido' ? 'bad' : 'busy')}>
                {klingBusy && <Loader2 size={17} className="spin" />}
                <div>
                  <b>{klingMsg}</b>
                  {klingBusy && <small> Tiempo transcurrido: {fmtElapsed(klingElapsed)}{klingElapsed > 600 ? ' · Kling está tardando más de lo habitual; puedes seguir esperando o verificar tu cuenta en kling.ai/dev' : ''}</small>}
                </div>
              </div>
            )}

            {klingErr && (
              <div className="kling-err">
                <div className="kling-err-title"><AlertTriangle size={17} /> Error{typeof klingErr.codigo === 'number' ? ` (código Kling ${klingErr.codigo})` : ''}</div>
                <p>{klingErr.mensaje}</p>
                {klingErr.pista && <p className="kling-err-hint">{klingErr.pista}</p>}
              </div>
            )}

            {klingStatus === 'listo' && klingVideo && (
              <div className="kling-result">
                <video src={klingVideo} controls playsInline style={{ width: '100%', maxWidth: 340, borderRadius: 14, border: '1px solid #e1e6f0' }} />
                <div className="inline" style={{ marginTop: 10 }}>
                  <a className="whatsapp" href={klingVideo} target="_blank" rel="noreferrer"><Download size={15} /> Abrir / guardar MP4</a>
                </div>
              </div>
            )}

            {klingInfo && (
              <div className={'kling-diag ' + (klingInfo.ok ? 'ok' : 'bad')}>
                <b>{klingInfo.ok ? 'Diagnóstico: conexión correcta' : 'Diagnóstico: atención'}</b>
                {klingInfo.variables && (
                  <ul>
                    {Object.entries(klingInfo.variables).filter(([k]) => k.startsWith('KLING')).map(([k, v]) => (
                      <li key={k}><code>{k}</code>: {v.configurada ? `configurada (longitud ${v.longitud}, valor oculto)` : 'NO configurada'}</li>
                    ))}
                    <li>Esquema de autenticación: {klingInfo.variables.esquemaUsado}</li>
                  </ul>
                )}
                <p>{klingInfo.diagnostico}</p>
                {klingInfo.detalle && <p className="kling-err-hint">Respuesta de Kling: {JSON.stringify(klingInfo.detalle).slice(0, 220)}</p>}
                {klingInfo.pista && <p className="kling-err-hint">{klingInfo.pista}</p>}
                {klingInfo.pasos && <ol>{klingInfo.pasos.map((p, i) => <li key={i}>{p}</li>)}</ol>}
              </div>
            )}

            <p className="hint">El video se genera en los servidores de Kling y suele tardar de 1 a 5 minutos; aquí verás el progreso (en cola → procesando → listo) y cualquier error en español. Con el esquema de API Key la generación se realiza por los endpoints de Kling 3.0, que admiten 5, 10 y 15 segundos; la calidad estándar/profesional se aplica como resolución 720p/1080p. Los enlaces MP4 de Kling expiran: descarga tus videos a tiempo. Esta función no incluye sincronización de labios de la presentadora.</p>

            {videosArchive.length > 0 && (
              <div className="kling-archive">
                <h3>Videos generados ({videosArchive.length})</h3>
                {videosArchive.map(v => (
                  <div className="kling-archive-item" key={v.id}>
                    <video src={v.url} controls playsInline style={{ width: 150, borderRadius: 10 }} />
                    <div>
                      <small>{v.date} · {v.duration} s · {v.model}</small>
                      <div className="inline">
                        <a className="whatsapp" href={v.url} target="_blank" rel="noreferrer">Abrir MP4</a>
                        <button className="light" onClick={() => setVideosArchive(a => a.filter(x => x.id !== v.id))}><Trash2 size={14} /></button>
                      </div>
                    </div>
                  </div>
                ))}
                <p className="hint">Los enlaces provienen de Kling y pueden expirar; guarda los archivos que quieras conservar.</p>
              </div>
            )}
          </section>
        </>}

        {tab === 'clientes' && <>
          <section>
            <h2>Registrar interesado</h2>
            <form onSubmit={e => {
              e.preventDefault();
              setLeads(v => [{ id: Date.now(), customer, contact, notes, date: new Date().toLocaleDateString('es-MX') }, ...v]);
              setCustomer(''); setContact(''); setNotes('');
            }}>
              <label>Nombre<input value={customer} onChange={e => setCustomer(e.target.value)} required /></label>
              <label>Teléfono o contacto<input value={contact} onChange={e => setContact(e.target.value)} required /></label>
              <label>Producto de interés / notas<textarea value={notes} onChange={e => setNotes(e.target.value)} /></label>
              <button className="primary">Guardar prospecto</button>
            </form>
          </section>
          {leads.map(l => (
            <section key={l.id}>
              <div className="between"><h3>{l.customer}</h3>
                <button className="light" onClick={() => setLeads(v => v.filter(x => x.id !== l.id))}><Trash2 size={16} /></button>
              </div>
              <p>{l.contact} · {l.date}</p>
              <p>{l.notes}</p>
              {/^[+\d\s()-]+$/.test(l.contact) && <a className="whatsapp" target="_blank" rel="noreferrer" href={'https://wa.me/' + l.contact.replace(/\D/g, '')}>Abrir WhatsApp</a>}
            </section>
          ))}
        </>}

        <footer>RMARC · Estudio con la API oficial de Kling conectada mediante función segura en Vercel (claves nunca en el navegador). No incluye publicación automática en redes.</footer>
      </main>
    </div>
  );
}
createRoot(document.getElementById('root')).render(<App />);
