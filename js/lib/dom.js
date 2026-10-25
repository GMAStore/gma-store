// Pembantu DOM + format. Teks selalu masuk lewat textContent (aman dari XSS); innerHTML hanya via sanitasi().
import { ikon } from './icons.js';
export { ikon };

export function h(tag, props, ...anak) {
  const el = document.createElement(tag);
  if (props) for (const [k, v] of Object.entries(props)) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class' || k === 'kelas') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'value' || k === 'checked' || k === 'selected' || k === 'disabled' || k === 'indeterminate') el[k] = v;
    else if (k === 'html') el.innerHTML = sanitasi(v);
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, v);
  }
  tambah(el, anak);
  return el;
}
export function tambah(el, anak) {
  for (const a of anak.flat(Infinity)) {
    if (a === null || a === undefined || a === false) continue;
    el.append(a instanceof Node ? a : document.createTextNode(String(a)));
  }
  return el;
}
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
export function kosongkan(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }
export function ganti(el, ...anak) { kosongkan(el); return tambah(el, anak); }

/* ---------- Sanitasi HTML buatan admin (halaman statis) ---------- */
const TAG_OK = new Set('a abbr b blockquote br caption code div em figure figcaption h1 h2 h3 h4 h5 h6 hr i img li ol p pre small span strong sub sup table tbody td tfoot th thead tr u ul'.split(' '));
const ATTR_OK = new Set(['href', 'src', 'alt', 'title', 'colspan', 'rowspan', 'target', 'rel', 'class']);
export function sanitasi(html) {
  const doc = new DOMParser().parseFromString('<body>' + String(html ?? '') + '</body>', 'text/html');
  (function bersih(node) {
    for (const c of Array.from(node.childNodes)) {
      if (c.nodeType === 8) { c.remove(); continue; }
      if (c.nodeType !== 1) continue;
      const t = c.tagName.toLowerCase();
      if (!TAG_OK.has(t)) { if (['script', 'style', 'iframe', 'object', 'embed', 'link', 'meta', 'form', 'input', 'button', 'svg', 'math', 'base'].includes(t)) c.remove(); else { bersih(c); c.replaceWith(...Array.from(c.childNodes)); } continue; }
      for (const a of Array.from(c.attributes)) {
        const n = a.name.toLowerCase(), v = a.value.trim();
        if (!ATTR_OK.has(n) || n.startsWith('on')) c.removeAttribute(a.name);
        else if ((n === 'href' || n === 'src') && !/^(https?:|mailto:|\/|#)/i.test(v)) c.removeAttribute(a.name);
      }
      if (t === 'a') { c.setAttribute('rel', 'noopener noreferrer'); if (c.getAttribute('target')) c.setAttribute('target', '_blank'); }
      bersih(c);
    }
  })(doc.body);
  return doc.body.innerHTML;
}
/** SVG buatan server (banner AI) → elemen aman: hanya tag grafis, tanpa script/event. */
export function svgAman(teks) {
  const doc = new DOMParser().parseFromString(String(teks || ''), 'image/svg+xml');
  const svg = doc.documentElement;
  if (!svg || svg.nodeName !== 'svg' || doc.querySelector('parsererror')) return null;
  const OK = new Set(['svg', 'defs', 'lineargradient', 'stop', 'rect', 'circle', 'text', 'g', 'path', 'ellipse', 'line', 'polygon']);
  (function w(n) { for (const c of Array.from(n.children)) { if (!OK.has(c.nodeName.toLowerCase())) { c.remove(); continue; } for (const a of Array.from(c.attributes)) if (/^on/i.test(a.name) || /javascript:/i.test(a.value)) c.removeAttribute(a.name); w(c); } })(svg);
  return document.importNode(svg, true);
}

/* ---------- Format ---------- */
export const rp = (n) => 'Rp' + Math.round(Number(n) || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
export const angka = (n) => Math.round(Number(n) || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
export const singkat = (n) => { n = Number(n) || 0; return n >= 1e6 ? (n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace('.0', '') + ' jt' : n >= 1e3 ? (n / 1e3).toFixed(n >= 1e4 ? 0 : 1).replace('.0', '') + ' rb' : String(n); };
const BLN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
export function tgl(iso, denganJam = false) {
  if (!iso) return '-'; const d = new Date(iso); if (isNaN(d)) return String(iso);
  const s = `${d.getDate()} ${BLN[d.getMonth()]} ${d.getFullYear()}`;
  return denganJam ? `${s}, ${String(d.getHours()).padStart(2, '0')}.${String(d.getMinutes()).padStart(2, '0')}` : s;
}
export function jam(iso) { const d = new Date(iso); return isNaN(d) ? '' : `${String(d.getHours()).padStart(2, '0')}.${String(d.getMinutes()).padStart(2, '0')}`; }
export function rel(iso) {
  if (!iso) return ''; const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 0) { const f = -s; return f < 3600 ? `${Math.ceil(f / 60)} menit lagi` : f < 86400 ? `${Math.floor(f / 3600)} jam lagi` : `${Math.floor(f / 86400)} hari lagi`; }
  if (s < 60) return 'baru saja'; if (s < 3600) return `${Math.floor(s / 60)} menit lalu`; if (s < 86400) return `${Math.floor(s / 3600)} jam lalu`;
  if (s < 604800) return `${Math.floor(s / 86400)} hari lalu`; return tgl(iso);
}
export const inisial = (n) => String(n || '?').trim().split(/\s+/).slice(0, 2).map(x => x[0]).join('').toUpperCase();
export function bintang(nilai, n = 5) {
  const w = h('span', { class: 'bintang', role: 'img', 'aria-label': `${Number(nilai).toFixed(1)} dari ${n} bintang` });
  for (let i = 1; i <= n; i++) { const s = ikon('star'); if (i > Math.round(nilai)) s.classList.add('bintang-kosong'); w.append(s); }
  return w;
}
export function debounce(fn, ms = 300) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
export function parseQuery(s) { return Object.fromEntries(new URLSearchParams(s || location.search)); }
export function qs(obj) { const p = new URLSearchParams(); for (const [k, v] of Object.entries(obj)) if (v !== '' && v !== undefined && v !== null && v !== false) p.set(k, v); const s = p.toString(); return s ? '?' + s : ''; }
export const FOTO_KOSONG = "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" fill="#ECEAFF"/><path d="M30 80l20-24 14 16 10-10 16 18z" fill="#B8B0FF"/><circle cx="42" cy="42" r="8" fill="#B8B0FF"/></svg>');
export function gambar(src, alt = '', kelas = '', lebar) {
  const i = h('img', { src: src || FOTO_KOSONG, alt, class: kelas, loading: 'lazy', decoding: 'async', referrerpolicy: 'no-referrer' });
  if (lebar) i.width = lebar;
  i.addEventListener('error', () => { if (i.src !== FOTO_KOSONG) i.src = FOTO_KOSONG; }, { once: true });
  return i;
}
export function salin(teks) { return navigator.clipboard ? navigator.clipboard.writeText(teks) : Promise.reject(new Error('Salin tidak didukung')); }
export function simpanFile(nama, mime, base64) {
  const bin = atob(base64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  const url = URL.createObjectURL(new Blob([u], { type: mime })); const a = h('a', { href: url, download: nama }); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
}
export function simpanTeks(nama, teks, mime = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([teks], { type: mime })); const a = h('a', { href: url, download: nama }); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
}
