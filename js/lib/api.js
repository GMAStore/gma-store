// Klien API Apps Script: POST text/plain (tanpa preflight CORS), reqId idempoten, retry, timeout, SWR.
import { CONFIG } from '../config.js';
import { RUTE } from './routes.js';
import { state, atur, simpan } from './store.js';

const lokal = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
export const URL_API = CONFIG.GAS_URL || (lokal ? '/api' : '');
export class GalatApi extends Error { constructor(pesan, kode, status) { super(pesan); this.kode = kode || 'GALAT'; this.status = status || 0; } }
const acak = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2, 10));
const tidur = (ms) => new Promise(r => setTimeout(r, ms));
let onAuthGagal = () => {};
export const saatSesiHabis = (f) => { onAuthGagal = f; };
export const perf = [];

async function sekali(action, data, reqId, batasMs) {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), batasMs);
  const t0 = performance.now();
  try {
    const r = await fetch(URL_API, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action, token: state.token || '', reqId, data: data || {} }), signal: ctl.signal, redirect: 'follow' });
    let j; try { j = await r.json(); } catch (e) { throw new GalatApi('Server memberi jawaban yang tidak dikenali. Coba lagi.', 'RESPON', r.status); }
    perf.push({ action, total: Math.round(performance.now() - t0), server: j.ms }); if (perf.length > 100) perf.shift();
    return j;
  } catch (e) {
    if (e instanceof GalatApi) throw e;
    if (e.name === 'AbortError') throw new GalatApi('Koneksi lambat. Coba lagi.', 'TIMEOUT');
    throw new GalatApi('Tidak bisa terhubung. Periksa internet Anda.', 'JARINGAN');
  } finally { clearTimeout(t); }
}

/** panggil('katalogCari', {...}) → data, atau melempar GalatApi. Tulis memakai reqId tetap sehingga aman di-ulang. */
export async function panggil(action, data = {}, opsi = {}) {
  if (!URL_API) throw new GalatApi('Alamat server (GAS_URL) belum diisi di js/config.js.', 'KONFIG');
  const r = RUTE[action]; const tulis = r ? !!r.w : true;
  const reqId = opsi.reqId || acak();
  const maks = opsi.coba ?? 3; let j, err;
  for (let i = 0; i < maks; i++) {
    try {
      if (!navigator.onLine) await new Promise(res => { const f = () => { removeEventListener('online', f); res(); }; addEventListener('online', f); setTimeout(f, 8000); });
      j = await sekali(action, data, reqId, i === 0 ? 25000 : CONFIG.TIMEOUT_MS); err = null; break;
    } catch (e) { err = e; if (!['JARINGAN', 'TIMEOUT', 'RESPON'].includes(e.kode) || i === maks - 1) break; await tidur(600 * (i + 1) ** 2); }
  }
  if (err) throw err;
  if (j && j.ok) return j.data;
  const e = j && j.error ? j.error : {};
  const g = new GalatApi(e.message || 'Terjadi kesalahan.', e.code || 'GALAT');
  if (g.kode === 'AUTH' && !opsi.diam) { onAuthGagal(g); }
  throw g;
}
export const api = panggil;

/* ---------- SWR: tampilkan cache dulu, segarkan di latar; render hanya bila berubah ---------- */
const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h + ':' + s.length; };
export async function swr(kunci, action, data, render, { segar = 30000, paksa = false, pribadi = false } = {}) {
  const k = 'c:' + (pribadi ? (state.user ? state.user.id : 'tamu') + ':' : '') + kunci;
  const c = simpan.get(k);
  if (c) render(c.d, true);
  if (c && !paksa && Date.now() - c.t < segar) return c.d;
  try {
    const d = await panggil(action, data, { coba: c ? 1 : 3 });
    const h = hash(JSON.stringify(d)); simpan.set(k, { t: Date.now(), h, d });
    if (!c || c.h !== h) render(d, false);
    return d;
  } catch (e) { if (!c) throw e; return c.d; }
}
export function bersihkanCache() { simpan.hapusPrefix('c:'); }

/** Beberapa pembacaan sekaligus dalam 1 permintaan. */
export async function paket(panggilan) {
  const o = await panggil('batch', { calls: panggilan.map(([action, data]) => ({ action, data })) });
  return panggilan.map(([a]) => (o[a] && o[a].ok ? o[a].data : null));
}

export async function unggahBerkas(file, jenis) {
  const b64 = await new Promise((res, rej) => { const f = new FileReader(); f.onload = () => res(String(f.result).split(',')[1]); f.onerror = () => rej(new GalatApi('Gagal membaca berkas.', 'BERKAS')); f.readAsDataURL(file); });
  return panggil('berkasUnggah', { jenis, base64: b64 });
}
/** Perkecil foto di peramban sebelum unggah (hemat kuota & lolos batas ukuran). */
export async function kecilkanGambar(file, sisiMaks = 1280, mutu = 0.82) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
  const bmp = await createImageBitmap(file); const s = Math.min(1, sisiMaks / Math.max(bmp.width, bmp.height));
  const cv = document.createElement('canvas'); cv.width = Math.round(bmp.width * s); cv.height = Math.round(bmp.height * s);
  cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height);
  const blob = await new Promise(r => cv.toBlob(r, 'image/jpeg', mutu));
  return blob ? new File([blob], 'foto.jpg', { type: 'image/jpeg' }) : file;
}
export { atur };
