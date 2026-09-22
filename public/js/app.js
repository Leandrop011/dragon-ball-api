/* =============================================================================
 * DRAGON BALL API · PANEL DE PRUEBAS
 * JavaScript vanilla (ES2022+), sin dependencias.
 *
 * Organización del archivo:
 *   1. Constantes y estado
 *   2. Referencias del DOM
 *   3. Utilidades puras (texto, escape, formato)
 *   4. Persistencia (localStorage)
 *   5. Capa `api` (fetch + async/await)
 *   6. Render de la consola (mini Postman)
 *   7. Render de tarjetas y estados de UI
 *   8. Toasts y portapapeles
 *   9. Casos de uso (listar, buscar, crear, seed)
 *  10. Validaciones de formularios
 *  11. Animaciones (IntersectionObserver)
 *  12. Router de cliente (inicio / 404)
 *  13. Arranque y listeners
 * ========================================================================== */

// ! ===================== 1. CONSTANTES Y ESTADO =====================

/** URL base por defecto del backend NestJS (prefijo global `api/v1`). */
const DEFAULT_BASE_URL = 'http://localhost:3000/api/v1';

/** Clave usada para persistir la base URL en el navegador. */
const STORAGE_KEY = 'dragon-ball-api:base-url';

/** Límite por defecto del listado (coincide con el valor por defecto del backend). */
const DEFAULT_LIMIT = 5;

/** Estado mínimo de la interfaz. */
const state = {
  limit: DEFAULT_LIMIT,
  offset: 0,
  /** Nivel de poder más alto visto: sirve de referencia para las barras. */
  maxLevel: 1,
  /** Último cuerpo de respuesta recibido (para el botón "Copiar JSON"). */
  lastBody: null,
  /** Cantidad de personajes devueltos en la última consulta del listado. */
  lastCount: 0,
  /** `true` en cuanto el listado ha respondido al menos una vez. */
  hasLoaded: false,
  /** `true` cuando la carga inicial del panel ya se ha lanzado. */
  appStarted: false,
};

// ! ===================== 2. REFERENCIAS DEL DOM =====================

const dom = {
  // ? Configuración
  baseUrl: document.getElementById('base-url'),
  btnResetUrl: document.getElementById('btn-reset-url'),
  btnPing: document.getElementById('btn-ping'),
  btnSeed: document.getElementById('btn-seed'),
  seedDialog: document.getElementById('seed-dialog'),

  // ? Listado
  formList: document.getElementById('form-list'),
  inputLimit: document.getElementById('list-limit'),
  inputOffset: document.getElementById('list-offset'),
  errLimit: document.getElementById('err-limit'),
  errOffset: document.getElementById('err-offset'),
  btnPrev: document.getElementById('btn-prev'),
  btnNext: document.getElementById('btn-next'),
  pagerInfo: document.getElementById('pager-info'),
  listResult: document.getElementById('list-result'),

  // ? Búsqueda
  formSearch: document.getElementById('form-search'),
  inputTerm: document.getElementById('search-term'),
  searchResult: document.getElementById('search-result'),

  // ? Creación
  formCreate: document.getElementById('form-create'),
  inputNum: document.getElementById('create-num'),
  inputName: document.getElementById('create-name'),
  inputLevel: document.getElementById('create-level'),
  errNum: document.getElementById('err-num'),
  errName: document.getElementById('err-name'),
  errLevel: document.getElementById('err-level'),
  btnCreate: document.getElementById('btn-create'),
  createResult: document.getElementById('create-result'),

  // ? Consola
  consoleMethod: document.getElementById('console-method'),
  consoleStatus: document.getElementById('console-status'),
  consoleTime: document.getElementById('console-time'),
  consoleUrl: document.getElementById('console-url'),
  consoleJson: document.getElementById('console-json'),
  btnCopyResponse: document.getElementById('btn-copy-response'),

  // ? Router de cliente
  view404: document.getElementById('view-404'),
  notFoundPath: document.getElementById('notfound-path'),
  btnHome: document.getElementById('btn-home'),
  appSections: [
    document.querySelector('.hero'),
    document.getElementById('main'),
    document.querySelector('.footer'),
  ],

  // ? Toasts
  toasts: document.getElementById('toasts'),
};

// ! ===================== 3. UTILIDADES PURAS =====================

/**
 * Escapa los caracteres que el navegador podría interpretar como HTML.
 * Se usa siempre que un texto de la API tenga que viajar por `innerHTML`.
 * @param {unknown} value
 * @returns {string}
 */
function escapeHTML(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/**
 * Escape reducido (solo `& < >`) para contenido de texto dentro de una etiqueta.
 * Se usa en el resaltado JSON, donde las comillas deben conservarse tal cual.
 * @param {string} text
 * @returns {string}
 */
function escapeText(text) {
  return String(text ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

/**
 * Capitaliza cada palabra: "son goku" -> "Son Goku".
 * @param {string} text
 * @returns {string}
 */
function capitalize(text) {
  return String(text ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Devuelve hasta dos iniciales del nombre para el avatar.
 * @param {string} name
 * @returns {string}
 */
function getInitials(name) {
  const words = String(name ?? '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/**
 * Color (matiz HSL) derivado del número de personaje, para que cada avatar
 * tenga siempre el mismo color sin necesidad de imágenes.
 * @param {number} numCharacter
 * @returns {number} matiz entre 0 y 359
 */
function hueFromNumber(numCharacter) {
  const n = Number.isFinite(numCharacter) ? Math.abs(Math.trunc(numCharacter)) : 0;
  return (n * 47) % 360;
}

/** Formatea números con separadores de miles en español. */
function formatNumber(value) {
  return Number.isFinite(value) ? value.toLocaleString('es-ES') : String(value ?? '—');
}

/** `true` si el usuario pidió menos movimiento en su sistema operativo. */
function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// ! ===================== 4. PERSISTENCIA =====================

/**
 * Lee la base URL guardada. Envuelto en try/catch porque `localStorage`
 * puede lanzar (modo privado, cookies bloqueadas, etc.).
 * @returns {string}
 */
function loadBaseUrl() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved && saved.trim() ? saved.trim() : DEFAULT_BASE_URL;
  } catch {
    return DEFAULT_BASE_URL;
  }
}

/**
 * Guarda la base URL. Si falla, la app sigue funcionando en memoria.
 * @param {string} url
 */
function saveBaseUrl(url) {
  try {
    window.localStorage.setItem(STORAGE_KEY, url);
  } catch {
    // ? Sin almacenamiento disponible: no es un error bloqueante.
  }
}

// ! ===================== 5. CAPA `api` =====================

/**
 * Base URL normalizada (sin barras finales) tomada del input de configuración.
 * @returns {string}
 */
function getBaseUrl() {
  const raw = (dom.baseUrl.value || '').trim().replace(/\/+$/, '');
  return raw || DEFAULT_BASE_URL;
}

/**
 * Construye la URL final añadiendo los query params que tengan valor.
 * @param {string} path
 * @param {Record<string, string|number>} [query]
 * @returns {string}
 */
function buildUrl(path, query) {
  const url = `${getBaseUrl()}${path}`;
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === '') continue;
    params.append(key, String(value));
  }

  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

/**
 * Lee el cuerpo de la respuesta respetando el `content-type`.
 * El endpoint `/seed` devuelve texto plano, no JSON.
 * @param {Response} response
 * @returns {Promise<unknown>}
 */
async function parseResponseBody(response) {
  const contentType = response.headers.get('content-type') ?? '';
  const raw = await response.text();

  if (!raw) return null;
  if (!contentType.includes('application/json')) return raw;

  try {
    return JSON.parse(raw);
  } catch {
    return raw; // ? JSON inválido: devolvemos el texto tal cual.
  }
}

/**
 * @typedef {Object} ApiResult
 * @property {string}  method        Método HTTP usado.
 * @property {string}  url           URL final de la petición.
 * @property {number}  status        Código de estado (0 si no hubo respuesta).
 * @property {boolean} ok            `true` si el status está en 2xx.
 * @property {unknown} data          Cuerpo ya parseado (objeto, array o texto).
 * @property {number}  ms            Duración en milisegundos.
 * @property {boolean} networkError  `true` si falló la conexión (API apagada o CORS).
 */

/**
 * Wrapper único de `fetch`. Nunca lanza: siempre devuelve un `ApiResult`
 * y pinta el resultado en el panel de respuesta.
 * @param {string} method
 * @param {string} path
 * @param {{ query?: Record<string, unknown>, body?: unknown }} [options]
 * @returns {Promise<ApiResult>}
 */
async function request(method, path, options = {}) {
  const url = buildUrl(path, options.query);
  const startedAt = performance.now();

  /** @type {ApiResult} */
  const result = {
    method, url, status: 0, ok: false, data: null, ms: 0, networkError: false,
  };

  try {
    const response = await fetch(url, {
      method,
      headers: options.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });

    result.ms = Math.round(performance.now() - startedAt);
    result.status = response.status;
    result.ok = response.ok;
    result.data = await parseResponseBody(response);
  } catch (error) {
    result.ms = Math.round(performance.now() - startedAt);
    result.networkError = true;
    result.data = {
      error: 'Network Error',
      message: 'No se pudo conectar con la API. Revisa que el backend esté levantado, que la base URL sea correcta y que CORS permita este origen.',
      detail: error instanceof Error ? error.message : String(error),
    };
  }

  renderConsole(result);
  return result;
}

/** Capa de acceso a los endpoints del backend. */
const api = {
  /**
   * GET /dragon-ball?limit=&offset=
   * `offset` solo viaja cuando es mayor que 0 (la API rechaza 0 con 400).
   * @param {{ limit: number, offset: number }} pagination
   * @returns {Promise<ApiResult>}
   */
  getAll({ limit, offset }) {
    const query = {};
    if (Number.isFinite(limit) && limit >= 1) query.limit = limit;
    if (Number.isFinite(offset) && offset > 0) query.offset = offset;

    return request('GET', '/dragon-ball', { query });
  },

  /**
   * GET /dragon-ball/:term — busca por numCharacter, Mongo ID o name.
   * Los nombres se guardan en minúsculas, así que normalizamos el término.
   * @param {string} term
   * @returns {Promise<ApiResult>}
   */
  getByTerm(term) {
    const normalized = String(term ?? '').trim().toLowerCase();
    return request('GET', `/dragon-ball/${encodeURIComponent(normalized)}`);
  },

  /**
   * POST /dragon-ball — crea un personaje.
   * Solo se envían las 3 propiedades del DTO (forbidNonWhitelisted).
   * @param {{ numCharacter: number, name: string, levelCharacter: number }} payload
   * @returns {Promise<ApiResult>}
   */
  create({ numCharacter, name, levelCharacter }) {
    return request('POST', '/dragon-ball', {
      body: { numCharacter, name, levelCharacter },
    });
  },

  /**
   * GET /seed — vacía y repuebla la base de datos. Devuelve texto plano.
   * @returns {Promise<ApiResult>}
   */
  runSeed() {
    return request('GET', '/seed');
  },
};

/**
 * Normaliza el `message` de un error de NestJS, que puede ser string o array.
 * @param {ApiResult} result
 * @returns {string[]}
 */
function extractMessages(result) {
  const data = result.data;

  if (typeof data === 'string' && data.trim()) return [data.trim()];

  if (data && typeof data === 'object') {
    const message = /** @type {{ message?: unknown }} */ (data).message;
    if (Array.isArray(message)) return message.map((item) => String(item));
    if (typeof message === 'string' && message.trim()) return [message.trim()];
  }

  return [`La petición falló con estado ${result.status || 'desconocido'}.`];
}

// ! ===================== 6. CONSOLA (MINI POSTMAN) =====================

/**
 * Convierte un valor en JSON formateado con resaltado de sintaxis.
 * El texto se escapa ANTES de aplicar el resaltado, por eso es seguro.
 * @param {unknown} value
 * @returns {string} HTML ya escapado
 */
function highlightJSON(value) {
  const json = typeof value === 'string'
    ? value
    : JSON.stringify(value, null, 2) ?? 'null';

  // ? Si es texto plano (por ejemplo "SEED EXECUTED") lo mostramos como cadena.
  if (typeof value === 'string') {
    return `<span class="tk-str">${escapeHTML(json)}</span>`;
  }

  const safe = escapeText(json);

  return safe.replace(
    /("(?:\\.|[^"\\])*"[ \t]*:?)|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g,
    (match) => {
      let cls = 'tk-num';

      if (match.startsWith('"')) {
        cls = match.trimEnd().endsWith(':') ? 'tk-key' : 'tk-str';
      } else if (match === 'true' || match === 'false') {
        cls = 'tk-bool';
      } else if (match === 'null') {
        cls = 'tk-null';
      }

      return `<span class="${cls}">${match}</span>`;
    },
  );
}

/**
 * Pinta el resultado de una petición en el panel de respuesta.
 * @param {ApiResult} result
 */
function renderConsole(result) {
  state.lastBody = result.data;

  dom.consoleMethod.textContent = result.method;
  dom.consoleUrl.textContent = result.url;
  dom.consoleTime.textContent = `${result.ms} ms`;

  // ? Color del status según el rango.
  let statusClass = 'pill--idle';
  let statusText = String(result.status);

  if (result.networkError) {
    statusClass = 'pill--net';
    statusText = 'SIN CONEXIÓN';
  } else if (result.status >= 200 && result.status < 300) {
    statusClass = 'pill--2xx';
  } else if (result.status >= 400 && result.status < 500) {
    statusClass = 'pill--4xx';
  } else if (result.status >= 500) {
    statusClass = 'pill--5xx';
  }

  dom.consoleStatus.className = `pill pill--status ${statusClass}`;
  dom.consoleStatus.textContent = statusText;

  dom.consoleJson.innerHTML = highlightJSON(result.data);
}

// ! ===================== 7. RENDER DE TARJETAS Y ESTADOS =====================

/** Vacía un contenedor sin usar innerHTML. */
function clearNode(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

/**
 * Crea un elemento con clase y texto en una sola línea.
 * @param {string} tag
 * @param {string} [className]
 * @param {string} [text]
 * @returns {HTMLElement}
 */
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/**
 * Construye la tarjeta de un personaje. Todo el contenido dinámico entra
 * con `textContent`, nunca con `innerHTML`.
 * @param {{ _id?: string, numCharacter?: number, name?: string, levelCharacter?: number }} character
 * @param {{ index?: number, featured?: boolean, isNew?: boolean }} [options]
 * @returns {HTMLElement}
 */
function createCharacterCard(character, options = {}) {
  const { index = 0, featured = false, isNew = false } = options;

  const num = Number(character?.numCharacter);
  const level = Number(character?.levelCharacter);
  const name = String(character?.name ?? '');
  const id = String(character?._id ?? '');

  // ? Referencia para la barra de poder: el nivel más alto visto hasta ahora.
  if (Number.isFinite(level)) state.maxLevel = Math.max(state.maxLevel, level);
  const percent = Number.isFinite(level) && state.maxLevel > 0
    ? Math.max(6, Math.min(100, (level / state.maxLevel) * 100))
    : 0;

  const card = el('article', 'char char--enter');
  card.style.setProperty('--i', String(index));
  card.style.setProperty('--hue', String(hueFromNumber(num)));
  if (featured) card.classList.add('char--featured');
  if (isNew && !prefersReducedMotion()) card.classList.add('char--new');

  // ? Avatar con iniciales (no hay imágenes en el modelo todavía).
  const avatar = el('div', 'char__avatar', getInitials(name));
  avatar.setAttribute('aria-hidden', 'true');
  card.appendChild(avatar);

  const body = el('div', 'char__body');

  const top = el('div', 'char__top');
  top.appendChild(el('span', 'char__num', `#${Number.isFinite(num) ? num : '—'}`));
  top.appendChild(el('h3', 'char__name', capitalize(name) || 'Sin nombre'));
  body.appendChild(top);

  const levelLine = el('p', 'char__level');
  levelLine.append('Nivel de poder: ');
  levelLine.appendChild(el('strong', null, formatNumber(level)));
  body.appendChild(levelLine);

  // ? Barra de poder proporcional al nivel máximo conocido.
  const bar = el('div', 'bar');
  bar.setAttribute('role', 'img');
  bar.setAttribute('aria-label', `Nivel de poder ${formatNumber(level)} de ${formatNumber(state.maxLevel)}`);
  const fill = el('span', 'bar__fill');
  fill.style.setProperty('--pct', `${percent.toFixed(1)}%`);
  fill.style.setProperty('--i', String(index));
  bar.appendChild(fill);
  body.appendChild(bar);

  // ? Mongo ID con botón de copiado (sin onclick inline).
  if (id) {
    const idRow = el('div', 'char__id');
    idRow.appendChild(el('code', 'char__id-value', id));

    const copyBtn = el('button', 'btn btn--ghost btn--copy', 'Copiar ID');
    copyBtn.type = 'button';
    copyBtn.setAttribute('aria-label', `Copiar el ID de ${capitalize(name)}`);
    copyBtn.addEventListener('click', () => copyToClipboard(id, 'ID copiado al portapapeles'));
    idRow.appendChild(copyBtn);

    body.appendChild(idRow);
  }

  card.appendChild(body);
  return card;
}

/**
 * Pinta un estado genérico (vacío, error, informativo).
 * @param {HTMLElement} container
 * @param {{ icon?: string, title: string, text?: string, list?: string[], variant?: 'empty'|'error' }} options
 */
function renderState(container, { icon = '·', title, text, list, variant = 'empty' }) {
  clearNode(container);

  const box = el('div', `state${variant === 'error' ? ' state--error' : ''}`);
  const iconNode = el('div', 'state__icon', icon);
  iconNode.setAttribute('aria-hidden', 'true');
  box.appendChild(iconNode);
  box.appendChild(el('p', 'state__title', title));

  if (text) box.appendChild(el('p', 'state__text', text));

  if (Array.isArray(list) && list.length > 0) {
    const ul = el('ul', 'state__list');
    for (const item of list) ul.appendChild(el('li', null, item));
    box.appendChild(ul);
  }

  container.appendChild(box);
}

/**
 * Pinta esqueletos de carga.
 * @param {HTMLElement} container
 * @param {number} count
 */
function renderSkeletons(container, count) {
  clearNode(container);
  container.setAttribute('aria-busy', 'true');

  const grid = el('div', 'char-grid');
  const total = Math.max(1, Math.min(count, 12));

  for (let i = 0; i < total; i++) {
    const sk = el('div', 'skeleton');
    sk.setAttribute('aria-hidden', 'true');
    sk.innerHTML =
      '<div class="sk-box sk-avatar"></div>' +
      '<div class="sk-lines">' +
        '<div class="sk-box sk-line sk-line--short"></div>' +
        '<div class="sk-box sk-line sk-line--mid"></div>' +
        '<div class="sk-box sk-line"></div>' +
      '</div>';
    grid.appendChild(sk);
  }

  container.appendChild(grid);
}

/**
 * Pinta el error de una petición usando el `message` de NestJS.
 * @param {HTMLElement} container
 * @param {ApiResult} result
 */
function renderApiError(container, result) {
  const messages = extractMessages(result);

  if (result.networkError) {
    renderState(container, {
      variant: 'error',
      icon: '⚡',
      title: 'Sin conexión con la API',
      text: 'Comprueba que el backend esté corriendo, que la base URL sea correcta y que CORS permita este origen.',
    });
    return;
  }

  renderState(container, {
    variant: 'error',
    icon: '!',
    title: `Error ${result.status}`,
    text: messages.length === 1 ? messages[0] : undefined,
    list: messages.length > 1 ? messages : undefined,
  });
}

// ! ===================== 8. TOASTS Y PORTAPAPELES =====================

/**
 * Muestra una notificación efímera.
 * @param {string} message
 * @param {'ok'|'err'|'warn'|'info'} [type]
 */
function showToast(message, type = 'info') {
  const toast = el('div', `toast toast--${type}`);

  const dot = el('span', 'toast__dot');
  dot.setAttribute('aria-hidden', 'true');
  toast.appendChild(dot);
  toast.appendChild(el('p', 'toast__text', message));

  dom.toasts.appendChild(toast);

  window.setTimeout(() => {
    toast.classList.add('is-out');
    window.setTimeout(() => toast.remove(), 320);
  }, 4200);
}

/**
 * Copia texto al portapapeles con respaldo para navegadores sin la API async.
 * @param {string} text
 * @param {string} successMessage
 */
async function copyToClipboard(text, successMessage) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const helper = document.createElement('textarea');
      helper.value = text;
      helper.setAttribute('readonly', '');
      helper.style.position = 'fixed';
      helper.style.opacity = '0';
      document.body.appendChild(helper);
      helper.select();
      document.execCommand('copy');
      helper.remove();
    }
    showToast(successMessage, 'ok');
  } catch {
    showToast('No se pudo copiar al portapapeles.', 'err');
  }
}

/**
 * Activa/desactiva el estado de carga de un botón.
 * @param {HTMLButtonElement} button
 * @param {boolean} isLoading
 */
function setButtonLoading(button, isLoading) {
  if (!button) return;
  button.classList.toggle('is-loading', isLoading);
  button.disabled = isLoading;
}

// ! ===================== 9. CASOS DE USO =====================

/**
 * Consulta el listado con la paginación actual y lo pinta.
 */
async function loadCharacters() {
  const submitBtn = dom.formList.querySelector('button[type="submit"]');

  renderSkeletons(dom.listResult, state.limit);
  setButtonLoading(submitBtn, true);
  updatePager();

  const result = await api.getAll({ limit: state.limit, offset: state.offset });

  setButtonLoading(submitBtn, false);
  dom.listResult.setAttribute('aria-busy', 'false');
  state.hasLoaded = true;

  if (!result.ok) {
    renderApiError(dom.listResult, result);
    // ? Ante un error no bloqueamos la paginación: el usuario puede reintentar.
    state.lastCount = 0;
    state.hasLoaded = false;
    updatePager();
    return;
  }

  const characters = Array.isArray(result.data) ? result.data : [];
  state.lastCount = characters.length;

  if (characters.length === 0) {
    renderState(dom.listResult, {
      icon: '○',
      title: 'No hay personajes en este rango',
      text: state.offset > 0
        ? 'Prueba a reducir el offset o a ejecutar el seed para poblar la base de datos.'
        : 'La base de datos está vacía. Ejecuta el seed para llenarla con 58 personajes.',
    });
    updatePager();
    return;
  }

  // ? Referencia de las barras: el mayor nivel de esta página.
  const pageMax = characters.reduce(
    (max, item) => Math.max(max, Number(item?.levelCharacter) || 0),
    1,
  );
  state.maxLevel = Math.max(state.maxLevel, pageMax);

  clearNode(dom.listResult);
  const grid = el('div', 'char-grid');
  characters.forEach((character, index) => {
    grid.appendChild(createCharacterCard(character, { index }));
  });
  dom.listResult.appendChild(grid);

  updatePager();
}

/**
 * Busca un personaje por término y lo muestra destacado.
 * @param {string} term
 */
async function searchCharacter(term) {
  const submitBtn = dom.formSearch.querySelector('button[type="submit"]');

  renderSkeletons(dom.searchResult, 1);
  setButtonLoading(submitBtn, true);

  const result = await api.getByTerm(term);

  setButtonLoading(submitBtn, false);
  dom.searchResult.setAttribute('aria-busy', 'false');

  if (!result.ok) {
    renderApiError(dom.searchResult, result);
    showToast(
      result.status === 404 ? 'Personaje no encontrado.' : extractMessages(result)[0],
      'err',
    );
    return;
  }

  // ? Por si el backend devolviera un array de un elemento.
  const character = Array.isArray(result.data) ? result.data[0] : result.data;

  if (!character || typeof character !== 'object') {
    renderState(dom.searchResult, {
      icon: '○',
      title: 'Sin resultados',
      text: 'La API respondió correctamente pero no devolvió un personaje.',
    });
    return;
  }

  clearNode(dom.searchResult);
  dom.searchResult.appendChild(createCharacterCard(character, { featured: true }));
  showToast(`Personaje encontrado: ${capitalize(character.name)}`, 'ok');
}

/**
 * Crea un personaje y refresca el listado.
 * @param {{ numCharacter: number, name: string, levelCharacter: number }} payload
 */
async function createCharacter(payload) {
  renderSkeletons(dom.createResult, 1);
  setButtonLoading(dom.btnCreate, true);

  const result = await api.create(payload);

  setButtonLoading(dom.btnCreate, false);
  dom.createResult.setAttribute('aria-busy', 'false');

  if (!result.ok) {
    renderApiError(dom.createResult, result);
    showToast(extractMessages(result)[0], 'err');
    return;
  }

  const character = result.data && typeof result.data === 'object' ? result.data : payload;

  clearNode(dom.createResult);
  dom.createResult.appendChild(
    createCharacterCard(character, { featured: true, isNew: true }),
  );

  showToast(`${capitalize(payload.name)} se creó correctamente.`, 'ok');
  dom.formCreate.reset();
  clearCreateErrors();

  await loadCharacters();
}

/**
 * Ejecuta el seed (previa confirmación en el diálogo).
 */
async function runSeed() {
  setButtonLoading(dom.btnSeed, true);

  const result = await api.runSeed();

  setButtonLoading(dom.btnSeed, false);

  if (!result.ok) {
    showToast(extractMessages(result)[0], 'err');
    return;
  }

  showToast('Seed ejecutado: base de datos repoblada.', 'ok');

  // ? Volvemos a la primera página con los datos nuevos.
  state.offset = 0;
  state.maxLevel = 1;
  dom.inputOffset.value = '0';
  await loadCharacters();
}

/**
 * Comprobación rápida de conectividad (un solo personaje).
 */
async function pingApi() {
  setButtonLoading(dom.btnPing, true);
  const result = await api.getAll({ limit: 1, offset: 0 });
  setButtonLoading(dom.btnPing, false);

  if (result.networkError) {
    showToast('No hay conexión con la API.', 'err');
    return;
  }

  showToast(
    result.ok
      ? `Conexión correcta (${result.status} · ${result.ms} ms).`
      : `La API respondió ${result.status}.`,
    result.ok ? 'ok' : 'warn',
  );
}

// ! ===================== 10. VALIDACIONES =====================

/**
 * Marca un campo como válido o inválido y escribe el mensaje asociado.
 * @param {HTMLInputElement} input
 * @param {HTMLElement} errorNode
 * @param {string} message cadena vacía si el campo es válido
 * @returns {boolean} `true` si es válido
 */
function setFieldError(input, errorNode, message) {
  const isValid = !message;
  errorNode.textContent = message;
  input.setAttribute('aria-invalid', isValid ? 'false' : 'true');
  return isValid;
}

/** Limpia los mensajes de error del formulario de creación. */
function clearCreateErrors() {
  setFieldError(dom.inputNum, dom.errNum, '');
  setFieldError(dom.inputName, dom.errName, '');
  setFieldError(dom.inputLevel, dom.errLevel, '');
}

/**
 * Valida un entero >= mínimo.
 * @param {string} rawValue
 * @param {number} min
 * @returns {{ value: number, error: string }}
 */
function validateInteger(rawValue, min) {
  const trimmed = String(rawValue ?? '').trim();

  if (trimmed === '') return { value: NaN, error: 'Este campo es obligatorio.' };

  const value = Number(trimmed);

  if (!Number.isFinite(value)) return { value: NaN, error: 'Debe ser un número.' };
  if (!Number.isInteger(value)) return { value: NaN, error: 'Debe ser un número entero.' };
  if (value < min) return { value: NaN, error: `Debe ser mayor o igual que ${min}.` };

  return { value, error: '' };
}

/**
 * Valida el formulario de creación replicando el `CreateCharacterDTO`.
 * @returns {{ numCharacter: number, name: string, levelCharacter: number } | null}
 */
function validateCreateForm() {
  const num = validateInteger(dom.inputNum.value, 1);
  const level = validateInteger(dom.inputLevel.value, 1);
  const name = String(dom.inputName.value ?? '').trim();

  const okNum = setFieldError(dom.inputNum, dom.errNum, num.error);
  const okName = setFieldError(
    dom.inputName,
    dom.errName,
    name === '' ? 'El nombre es obligatorio.' : '',
  );
  const okLevel = setFieldError(dom.inputLevel, dom.errLevel, level.error);

  if (!okNum || !okName || !okLevel) {
    // ? Llevamos el foco al primer campo con error.
    const firstInvalid = [
      [okNum, dom.inputNum],
      [okName, dom.inputName],
      [okLevel, dom.inputLevel],
    ].find(([ok]) => !ok);
    if (firstInvalid) firstInvalid[1].focus();
    return null;
  }

  // ? Solo las 3 propiedades del DTO: cualquier extra provocaría un 400.
  return {
    numCharacter: num.value,
    name,
    levelCharacter: level.value,
  };
}

/**
 * Valida los controles de paginación.
 * @returns {{ limit: number, offset: number } | null}
 */
function validateListForm() {
  const limit = validateInteger(dom.inputLimit.value, 1);
  const offset = validateInteger(dom.inputOffset.value, 0);

  const okLimit = setFieldError(dom.inputLimit, dom.errLimit, limit.error);
  const okOffset = setFieldError(dom.inputOffset, dom.errOffset, offset.error);

  if (!okLimit || !okOffset) return null;

  return { limit: limit.value, offset: offset.value };
}

/** Actualiza el texto y el estado de los botones de paginación. */
function updatePager() {
  dom.btnPrev.disabled = state.offset <= 0;
  // ? Si la última página trajo menos elementos que el limit, no hay siguiente.
  dom.btnNext.disabled = state.hasLoaded && state.lastCount < state.limit;

  if (!state.hasLoaded || state.lastCount === 0) {
    dom.pagerInfo.textContent = `offset ${state.offset} · limit ${state.limit}`;
    return;
  }

  const from = state.offset + 1;
  const to = state.offset + state.lastCount;
  dom.pagerInfo.textContent = `offset ${state.offset} · mostrando ${from}–${to}`;
}

// ! ===================== 11. ANIMACIONES =====================

/**
 * Revela los paneles con `.reveal` cuando entran en el viewport.
 * Si el usuario prefiere menos movimiento, se muestran de inmediato.
 */
function setupReveal() {
  const panels = document.querySelectorAll('.reveal');

  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    panels.forEach((panel) => panel.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
  );

  panels.forEach((panel) => observer.observe(panel));
}

// ! ===================== 12. ROUTER DE CLIENTE =====================

/**
 * Rutas que muestran el panel. Cualquier otra ruta muestra la vista 404.
 * El backend sirve `index.html` para todas las rutas no controladas (el
 * catch-all de ServeStaticModule), así que el enrutado ocurre en el cliente.
 */
const HOME_PATHS = new Set(['/', '/index.html']);

/** Título original del documento, para restaurarlo al volver al inicio. */
const HOME_TITLE = document.title;

/**
 * @param {string} pathname
 * @returns {boolean}
 */
function isHomePath(pathname) {
  return HOME_PATHS.has(pathname);
}

/**
 * Muestra u oculta las secciones del panel.
 * @param {boolean} visible
 */
function toggleAppSections(visible) {
  for (const section of dom.appSections) {
    if (section) section.hidden = !visible;
  }
}

/**
 * Lanza la carga inicial del panel. Solo se ejecuta una vez por sesión,
 * aunque el usuario vaya y vuelva desde la vista 404.
 */
function startApp() {
  if (state.appStarted) return;
  state.appStarted = true;

  // ? Estado inicial de los paneles que aún no tienen datos.
  renderState(dom.searchResult, {
    icon: '?',
    title: 'Sin búsquedas todavía',
    text: 'Escribe un número, un nombre o un Mongo ID para buscar un personaje.',
  });

  void loadCharacters();
}

/** Pinta la vista que corresponde a `location.pathname`. */
function renderRoute() {
  const path = window.location.pathname;

  if (isHomePath(path)) {
    dom.view404.hidden = true;
    dom.view404.classList.remove('is-active');
    toggleAppSections(true);
    document.title = HOME_TITLE;
    startApp();
    return;
  }

  toggleAppSections(false);
  dom.view404.hidden = false;
  document.title = '404 · Ruta no encontrada';

  // ? La ruta viaja como texto, nunca como HTML.
  let readablePath = path;
  try {
    readablePath = decodeURIComponent(path);
  } catch {
    // ? URL mal codificada: mostramos la ruta tal cual llegó.
  }
  dom.notFoundPath.textContent = readablePath;

  // ? La clase dispara la animación de entrada ahora que la vista es visible.
  //   Se quita y se vuelve a poner (forzando un reflow) para que la animación
  //   se repita si se navega de una ruta inexistente a otra.
  dom.view404.classList.remove('is-active');
  void dom.view404.offsetWidth;
  dom.view404.classList.add('is-active');
}

/**
 * Vuelve al inicio sin recargar la página. Respeta los clics con modificadores
 * para no romper "abrir en una pestaña nueva"; el `href="/"` del enlace sigue
 * funcionando aunque el JavaScript falle.
 * @param {MouseEvent} event
 */
function navigateHome(event) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return;
  }

  event.preventDefault();
  window.history.pushState({}, '', '/');
  renderRoute();
  window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
}

// ! ===================== 13. ARRANQUE Y LISTENERS =====================

/** Registra todos los eventos de la interfaz. */
function bindEvents() {

  // ? --- Configuración de la base URL ---
  dom.baseUrl.addEventListener('change', () => {
    const value = getBaseUrl();
    dom.baseUrl.value = value;
    saveBaseUrl(value);
    showToast('Base URL actualizada.', 'info');
  });

  dom.btnResetUrl.addEventListener('click', () => {
    dom.baseUrl.value = DEFAULT_BASE_URL;
    saveBaseUrl(DEFAULT_BASE_URL);
    showToast('Base URL restaurada al valor por defecto.', 'info');
  });

  dom.btnPing.addEventListener('click', () => { void pingApi(); });

  // ? --- Seed con confirmación (diálogo nativo, no `confirm()`) ---
  dom.btnSeed.addEventListener('click', () => {
    if (typeof dom.seedDialog.showModal === 'function') {
      dom.seedDialog.showModal();
    } else {
      dom.seedDialog.setAttribute('open', '');
    }
  });

  dom.seedDialog.addEventListener('close', () => {
    if (dom.seedDialog.returnValue === 'confirm') void runSeed();
  });

  // ? --- Listado ---
  dom.formList.addEventListener('submit', (event) => {
    event.preventDefault();
    const values = validateListForm();
    if (!values) return;

    state.limit = values.limit;
    state.offset = values.offset;
    void loadCharacters();
  });

  dom.btnPrev.addEventListener('click', () => {
    state.offset = Math.max(0, state.offset - state.limit);
    dom.inputOffset.value = String(state.offset);
    void loadCharacters();
  });

  dom.btnNext.addEventListener('click', () => {
    state.offset += state.limit;
    dom.inputOffset.value = String(state.offset);
    void loadCharacters();
  });

  // ? --- Búsqueda ---
  dom.formSearch.addEventListener('submit', (event) => {
    event.preventDefault();

    const term = dom.inputTerm.value.trim();
    if (!term) {
      renderState(dom.searchResult, {
        icon: '?',
        title: 'Escribe un término',
        text: 'Puedes buscar por número de personaje, nombre o Mongo ID.',
      });
      dom.inputTerm.focus();
      return;
    }

    void searchCharacter(term);
  });

  // ? --- Creación ---
  dom.formCreate.addEventListener('submit', (event) => {
    event.preventDefault();
    const payload = validateCreateForm();
    if (!payload) return;
    void createCharacter(payload);
  });

  dom.formCreate.addEventListener('reset', () => {
    clearCreateErrors();
    clearNode(dom.createResult);
  });

  // ? Limpiamos el error de cada campo mientras el usuario lo corrige.
  const liveFields = [
    [dom.inputNum, dom.errNum],
    [dom.inputName, dom.errName],
    [dom.inputLevel, dom.errLevel],
  ];
  for (const [input, errorNode] of liveFields) {
    input.addEventListener('input', () => {
      if (errorNode.textContent) setFieldError(input, errorNode, '');
    });
  }

  // ? --- Router ---
  dom.btnHome.addEventListener('click', navigateHome);
  window.addEventListener('popstate', renderRoute);

  // ? --- Consola ---
  dom.btnCopyResponse.addEventListener('click', () => {
    if (state.lastBody === null || state.lastBody === undefined) {
      showToast('Todavía no hay ninguna respuesta que copiar.', 'warn');
      return;
    }

    const text = typeof state.lastBody === 'string'
      ? state.lastBody
      : JSON.stringify(state.lastBody, null, 2);

    void copyToClipboard(text, 'Respuesta copiada al portapapeles.');
  });
}

/** Punto de entrada. */
function init() {
  dom.baseUrl.value = loadBaseUrl();

  state.limit = Number(dom.inputLimit.value) || DEFAULT_LIMIT;
  state.offset = Number(dom.inputOffset.value) || 0;

  bindEvents();
  setupReveal();
  updatePager();

  // ? El router decide qué vista mostrar y arranca el panel solo en la raíz.
  renderRoute();
}

init();
