// RMARC VIDEO AI — Motor de guiones publicitarios (IA local, sin clave externa)
// Genera guiones VARIADOS con estructura publicitaria real (AIDA):
//   Atención → Interés → Deseo → Acción
// Cada llamada reordena piezas, cambia ganchos y redacciones para que no se
// repita el mismo texto entre guiones consecutivos del mismo producto.
// Solo texto en español (es-MX), sin emojis, listo para narración y para Kling.

function pick(list, seed) {
  return list[Math.floor(seed() * list.length) % list.length];
}

function clean(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

function firstSentence(text) {
  const t = clean(text);
  const m = t.split(/(?<=[.!?])\s+/)[0] || t;
  return clean(m.replace(/\.$/, ''));
}

function restSentences(text) {
  const parts = clean(text).split(/(?<=[.!?])\s+/);
  return parts.length > 1 ? clean(parts.slice(1).join(' ')) : '';
}

// Ganchos de apertura por estilo (bloque "Atención")
const HOOKS = {
  directo: [
    'Si llevas tus ventas en papel y te pierdes pedidos, {producto} es justo lo que necesitas.',
    'Atención {negocio}: dejar de perder clientes empieza por ordenar tu operación, y {producto} lo resuelve.',
    '¿Cuánto cuesta cada venta que se escapa por no tener control? {producto} cierra esa fuga.',
    'Te presentamos {producto}, hecho para {negocio} y para cualquiera que venda todos los días.',
    'Olvídate del desorden: {producto} pone tus ventas, inventario y reportes en un solo lugar.',
  ],
  'promoción': [
    'Solo por tiempo limitado: {producto} está disponible con condiciones especiales.',
    'Esta semana {negocio} lanza algo que no se repetirá pronto: {producto} al alcance de tu negocio.',
    'Aprovecha ahora: {producto} llega con precio de lanzamiento y apoyo directo de {negocio}.',
    'Si estabas esperando la señal para modernizar tu negocio, esta es: {producto} ya está aquí.',
    'Oportunidad de temporada: {producto} con {precio}, directo de {negocio} para ti.',
  ],
  informativo: [
    '¿Sabías que automatizar el control de ventas puede ahorrarte horas cada semana? Con {producto} lo haces sin experiencia técnica.',
    'Datos que importan: quienes ordenan su inventario con una herramienta como {producto} toman mejores decisiones y venden más.',
    'Hay una razón por la que negocios como el tuyo están migrando a sistemas en el celular: velocidad y control. {producto} lo demuestra.',
    'Hoy te explicamos, sin tecnicismos, cómo {producto} organiza ventas, inventario y reportes de {negocio}.',
    'El control de tu negocio no debería depender de la memoria. {producto} lo convierte en datos claros.',
  ],
};

// Conectores para redactar la descripción con palabras distintas (bloque "Interés")
const CONECTORES = [
  'Con {producto}, {frase}',
  'Gracias a {producto}, {frase}',
  'Lo mejor: {frase}, todo desde {producto}.',
  'Esto significa que {frase} —sin complicaciones y sin curva de aprendizaje.',
  'En la práctica, {frase}, y {producto} se encarga del resto.',
];

// Bloques de deseo (beneficios ampliados)
const DESEO = [
  'Funciona en celular, tablet o computadora, así lo revisas donde estés.',
  'Todo queda guardado y ordenado: menos errores y decisiones con datos reales.',
  'Diseñado para negocios que no pueden permitirse perder tiempo ni pedidos.',
  'Cada movimiento de tu negocio se refleja al momento, sin adivinar cifras.',
  'Empiezas el mismo día: se instala rápido y se usa con pasos simples.',
];

// Formas de presentar el precio (bloque "Deseo" económico)
const PRECIO = [
  'Todo por {precio}.',
  'Inversión de {precio}, pensada para recuperarse con las primeras ventas extra.',
  'A partir de {precio}, sin mensualidades escondidas.',
  'Precio: {precio}. Una sola vez y queda trabajando para ti.',
];

// Llamadas a la acción por estilo (bloque "Acción")
const CTA = {
  directo: [
    'Escríbenos por WhatsApp y en minutos te mostramos cómo funciona con tu propio negocio.',
    'Manda un mensaje hoy y te preparamos una demostración paso a paso.',
    'Contáctanos ahora mismo: te decimos exactamente cómo implementarlo esta misma semana.',
  ],
  'promoción': [
    'Escríbenos hoy y asegura tu precio especial antes de que termine la temporada.',
    'Los cupones de lanzamiento son limitados: manda tu mensaje y aparta el tuyo.',
    'Haz clic en WhatsApp ahora y pregunta por las condiciones de esta promoción.',
  ],
  informativo: [
    'Si quieres verlo en acción, escríbenos y te compartimos una explicación con ejemplos reales.',
    'Te compartimos toda la información sin compromiso: manda tu mensaje y resolvemos tus dudas.',
    'Solicita la ficha completa por WhatsApp y compara por ti mismo.',
  ],
};

const CIERRE = [
  'Somos {negocio} y te acompañamos en todo el proceso.',
  'Atiende {negocio}, con soporte directo y en español.',
  'De {negocio} para negocios como el tuyo.',
];

// Semilla aleatoria criptográfica ligera (funciona en navegador y en Node)
function makeSeed() {
  return function () {
    return Math.random();
  };
}

export function makeScript({ product, business, style = 'directo', avoid = '' }) {
  const seed = makeSeed();
  const name = clean(product && product.name) || 'nuestro producto';
  const price = clean(product && product.price) || 'consultar precio';
  const desc = clean(product && product.desc);
  const neg = clean(business) || 'RMARC';

  const fill = (tpl) => tpl
    .replaceAll('{producto}', name)
    .replaceAll('{negocio}', neg)
    .replaceAll('{precio}', price);

  // 1) Atención: gancho distinto al guion anterior
  let hook = fill(pick(HOOKS[style] || HOOKS.directo, seed));
  for (let i = 0; i < 5 && avoid && hook === avoid; i++) hook = fill(pick(HOOKS[style] || HOOKS.directo, seed));

  // 2) Interés: reescritura de la descripción con conector y orden distinto
  const s1 = firstSentence(desc);
  const s2 = restSentences(desc);
  let interes = s1 ? fill(pick(CONECTORES, seed)).replaceAll('{frase}', s1.charAt(0).toLowerCase() + s1.slice(1)) : `Con ${name} tu operación diaria queda ordenada desde el primer día.`;
  if (s2) interes += (/[.!?]$/.test(interes) ? ' ' : '. ') + s2;

  // 3) Deseo: dos beneficios (aleatorios y no repetidos) + precio
  const beneficios = [...DESEO].sort(() => seed() - 0.5).slice(0, 2);
  const precioFrase = fill(pick(PRECIO, seed));

  // 4) Acción: CTA + cierre
  const accion = pick(CTA[style] || CTA.directo, seed);
  const cierre = fill(pick(CIERRE, seed));

  return [hook, interes, beneficios.join(' '), precioFrase, accion, cierre].filter(Boolean).join(' ');
}

// Prompt visual para Kling a partir del guion (limitado a 2500 caracteres)
export function makeVideoPrompt({ product, guion, mode }) {
  const name = clean(product && product.name) || 'nuestro producto';
  const base = mode === 'image'
    ? `Anima esta fotografía como un anuncio profesional: movimiento suave de cámara, luz cálida de tienda, ambiente de negocio moderno y confiable. Presenta ${name} de forma atractiva. Guion de apoyo: `
    : `Anuncio publicitario en video para redes sociales sobre ${name}: estilo comercial moderno, tomas nítidas, luz profesional, sin texto sobreimpreso. Idea central: `;
  const guionLimpio = clean(guion).slice(0, 1800);
  return (base + guionLimpio).slice(0, 2500);
}

export default makeScript;
