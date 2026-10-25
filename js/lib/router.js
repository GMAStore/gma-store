// Router History API (tanpa hash), sadar folder dasar GitHub Pages, halaman dimuat malas.
import { CONFIG } from '../config.js';
import { state } from './store.js';
import { h, ganti, kosongkan, parseQuery } from './dom.js';

export const AKAR_RUTE = ['cari', 'kategori', 'produk', 'toko', 'live', 'flash-sale', 'h', 'verifikasi', 'masuk', 'daftar', 'lupa-sandi', 'keranjang', 'checkout', 'bayar', 'pesanan', 'ulasan', 'chat', 'wishlist', 'alamat', 'notifikasi', 'akun', 'apresiasi', 'dokumen', 'jual', 'penjual', 'admin', 'kurir', 'offline', 'index.html', '404.html', 'assets', 'css', 'js'];
function deteksiBase() {
  if (CONFIG.BASE) return CONFIG.BASE.replace(/\/$/, '');
  if (!/\.github\.io$/.test(location.hostname)) return '';
  const seg = location.pathname.split('/')[1];
  return seg && !AKAR_RUTE.includes(seg) ? '/' + seg : '';
}
export const BASE = deteksiBase();
export const href = (p) => BASE + (p.startsWith('/') ? p : '/' + p);
export const jalurSaatIni = () => { let p = location.pathname; if (BASE && p.startsWith(BASE)) p = p.slice(BASE.length); return p.replace(/\/index\.html$/, '/') || '/'; };

/* [pola, modul, nama ekspor, opsi]  — opsi: layout, auth, peran */
const ADM = ['SUPER_ADMIN', 'ADMIN_OPS', 'ADMIN_KOMUNITAS', 'ADMIN_KEU'];
const OPS = ['SUPER_ADMIN', 'ADMIN_OPS', 'ADMIN_KOMUNITAS'], KEU = ['SUPER_ADMIN', 'ADMIN_KEU'], OPSK = ['SUPER_ADMIN', 'ADMIN_OPS', 'ADMIN_KEU'], SUP = ['SUPER_ADMIN'], TOKO = ['PENJUAL', 'STAF_TOKO'], OPSS = ['SUPER_ADMIN', 'ADMIN_OPS'];
const P = (pola, modul, nama, o = {}) => ({ pola, modul, nama, ...o, bagian: pola.split('/').filter(Boolean) });
export const PETA = [
  P('/', 'katalog', 'beranda', { layout: 'publik' }),
  P('/cari', 'katalog', 'cari', { layout: 'publik' }),
  P('/kategori/:slug', 'katalog', 'kategori', { layout: 'publik' }),
  P('/produk/:slug', 'katalog', 'produk', { layout: 'publik' }),
  P('/toko/:slug', 'katalog', 'toko', { layout: 'publik' }),
  P('/flash-sale', 'katalog', 'flash', { layout: 'publik' }),
  P('/h/:slug', 'katalog', 'halamanStatis', { layout: 'publik' }),
  P('/verifikasi', 'katalog', 'verifikasi', { layout: 'publik' }),
  P('/verifikasi/:kode', 'katalog', 'verifikasi', { layout: 'publik' }),
  P('/live', 'live', 'daftar', { layout: 'publik' }),
  P('/live/:id', 'live', 'ruang', { layout: 'publik' }),
  P('/masuk', 'auth', 'masuk', { layout: 'auth' }),
  P('/daftar', 'auth', 'daftar', { layout: 'auth' }),
  P('/lupa-sandi', 'auth', 'lupa', { layout: 'auth' }),
  P('/keranjang', 'pembeli', 'keranjang', { layout: 'publik', auth: true }),
  P('/checkout', 'pembeli', 'checkout', { layout: 'publik', auth: true }),
  P('/bayar/:orderId', 'pembeli', 'bayar', { layout: 'publik', auth: true }),
  P('/pesanan', 'pembeli', 'pesanan', { layout: 'publik', auth: true }),
  P('/pesanan/:id', 'pembeli', 'pesananDetail', { layout: 'publik', auth: true }),
  P('/ulasan', 'pembeli', 'ulasan', { layout: 'publik', auth: true }),
  P('/chat', 'chat', 'obrolan', { layout: 'publik', auth: true }),
  P('/chat/:id', 'chat', 'obrolan', { layout: 'publik', auth: true }),
  P('/wishlist', 'pembeli', 'wishlist', { layout: 'publik', auth: true }),
  P('/alamat', 'pembeli', 'alamat', { layout: 'publik', auth: true }),
  P('/notifikasi', 'pembeli', 'notifikasi', { layout: 'publik', auth: true }),
  P('/akun', 'pembeli', 'akun', { layout: 'publik', auth: true }),
  P('/apresiasi', 'pembeli', 'apresiasi', { layout: 'publik', auth: true }),
  P('/dokumen', 'pembeli', 'dokumen', { layout: 'publik', auth: true }),
  P('/jual/daftar', 'penjual', 'daftarPenjual', { layout: 'publik', auth: true }),
  // Penjual
  P('/penjual', 'penjual', 'dasbor', { layout: 'penjual', auth: true, peran: TOKO }),
  P('/penjual/produk', 'penjual', 'produk', { layout: 'penjual', auth: true, peran: TOKO }),
  P('/penjual/produk/baru', 'penjual', 'produkForm', { layout: 'penjual', auth: true, peran: TOKO }),
  P('/penjual/produk/:id', 'penjual', 'produkForm', { layout: 'penjual', auth: true, peran: TOKO }),
  P('/penjual/pesanan', 'penjual', 'pesanan', { layout: 'penjual', auth: true, peran: TOKO }),
  P('/penjual/live', 'live', 'studio', { layout: 'penjual', auth: true, peran: TOKO }),
  P('/penjual/chat', 'chat', 'obrolan', { layout: 'penjual', auth: true, peran: TOKO }),
  P('/penjual/ulasan', 'penjual', 'ulasan', { layout: 'penjual', auth: true, peran: TOKO }),
  P('/penjual/dompet', 'penjual', 'dompet', { layout: 'penjual', auth: true, peran: ['PENJUAL'] }),
  P('/penjual/laporan', 'penjual', 'laporan', { layout: 'penjual', auth: true, peran: TOKO }),
  P('/penjual/penalti', 'penjual', 'penalti', { layout: 'penjual', auth: true, peran: TOKO }),
  P('/penjual/toko', 'penjual', 'tokoPengaturan', { layout: 'penjual', auth: true, peran: TOKO }),
  P('/penjual/studio-ai', 'penjual', 'studioAi', { layout: 'penjual', auth: true, peran: TOKO }),
  // Admin
  P('/admin', 'admin', 'dasbor', { layout: 'admin', auth: true, peran: ADM }),
  P('/admin/statistik', 'admin', 'statistik', { layout: 'admin', auth: true, peran: ADM }),
  P('/admin/verifikasi', 'admin', 'verifikasiPenjual', { layout: 'admin', auth: true, peran: OPS }),
  P('/admin/produk', 'admin', 'moderasiProduk', { layout: 'admin', auth: true, peran: OPS }),
  P('/admin/pembayaran', 'admin2', 'pembayaran', { layout: 'admin', auth: true, peran: KEU }),
  P('/admin/penarikan', 'admin2', 'penarikan', { layout: 'admin', auth: true, peran: KEU }),
  P('/admin/kas-cod', 'admin2', 'kasCod', { layout: 'admin', auth: true, peran: KEU }),
  P('/admin/keuangan', 'admin2', 'keuangan', { layout: 'admin', auth: true, peran: KEU }),
  P('/admin/sengketa', 'admin2', 'sengketa', { layout: 'admin', auth: true, peran: OPSS }),
  P('/admin/laporan', 'admin2', 'laporanWarga', { layout: 'admin', auth: true, peran: OPS }),
  P('/admin/penalti', 'admin2', 'penaltiBanding', { layout: 'admin', auth: true, peran: OPSS }),
  P('/admin/ulasan', 'admin2', 'ulasanModerasi', { layout: 'admin', auth: true, peran: OPSS }),
  P('/admin/live', 'admin2', 'liveModerasi', { layout: 'admin', auth: true, peran: OPSS }),
  P('/admin/pengguna', 'admin3', 'pengguna', { layout: 'admin', auth: true, peran: OPSS }),
  P('/admin/komunitas', 'admin3', 'komunitas', { layout: 'admin', auth: true, peran: OPSS }),
  P('/admin/kategori', 'admin3', 'kategori', { layout: 'admin', auth: true, peran: OPSK }),
  P('/admin/kurir', 'admin3', 'kurir', { layout: 'admin', auth: true, peran: OPSK }),
  P('/admin/voucher', 'admin3', 'voucher', { layout: 'admin', auth: true, peran: OPSS }),
  P('/admin/pengaturan', 'admin3', 'pengaturan', { layout: 'admin', auth: true, peran: OPSK }),
  P('/admin/kunci', 'admin3', 'kunci', { layout: 'admin', auth: true, peran: SUP }),
  P('/admin/blokir', 'admin3', 'blokir', { layout: 'admin', auth: true, peran: OPSS }),
  P('/admin/audit', 'admin3', 'audit', { layout: 'admin', auth: true, peran: OPSK }),
  P('/admin/landing', 'admin4', 'landing', { layout: 'admin', auth: true, peran: OPS }),
  P('/admin/banner', 'admin4', 'banner', { layout: 'admin', auth: true, peran: OPS }),
  P('/admin/flash-sale', 'admin4', 'flashSale', { layout: 'admin', auth: true, peran: OPSS }),
  P('/admin/halaman', 'admin4', 'halaman', { layout: 'admin', auth: true, peran: OPSS }),
  P('/admin/notifikasi', 'admin4', 'notifikasi', { layout: 'admin', auth: true, peran: OPSS }),
  P('/admin/crm', 'admin4', 'crm', { layout: 'admin', auth: true, peran: OPS }),
  P('/admin/dokumen', 'admin4', 'dokumen', { layout: 'admin', auth: true, peran: OPSK }),
  // Kurir
  P('/kurir', 'kurir', 'tersedia', { layout: 'kurir', auth: true, peran: ['KURIR'] }),
  P('/kurir/tugas', 'kurir', 'tugas', { layout: 'kurir', auth: true, peran: ['KURIR'] }),
  P('/kurir/kas', 'kurir', 'kas', { layout: 'kurir', auth: true, peran: ['KURIR'] }),
  P('/kurir/akun', 'kurir', 'akun', { layout: 'kurir', auth: true, peran: ['KURIR'] }),
];
function cocok(jalur) {
  const bag = jalur.split('/').filter(Boolean);
  for (const r of PETA) {
    if (r.bagian.length !== bag.length) continue; const params = {}; let ok = true;
    for (let i = 0; i < bag.length; i++) { const p = r.bagian[i]; if (p[0] === ':') params[p.slice(1)] = decodeURIComponent(bag[i]); else if (p !== bag[i]) { ok = false; break; } }
    if (ok) return { rute: r, params };
  } return null;
}

let hooks = { pasangLayout: null, saatSelesai: null, saatMulai: null };
export function pasangHooks(o) { hooks = { ...hooks, ...o }; }
let pembersih = []; export const saatPergi = (f) => pembersih.push(f);
let tiket = 0;

export function navigasi(tujuan, { ganti: ubah = false, diam = false } = {}) {
  const url = new URL(tujuan, location.origin);
  let p = url.pathname; if (BASE && !p.startsWith(BASE + '/') && p !== BASE) p = BASE + p;
  const penuh = p + url.search + url.hash;
  if (penuh === location.pathname + location.search + location.hash && !diam) { return render(); }
  history[ubah ? 'replaceState' : 'pushState']({}, '', penuh);
  return render();
}
export const ganti_ = (t) => navigasi(t, { ganti: true });
export function aturQuery(patch, ubah = true) {
  const q = new URLSearchParams(location.search); for (const [k, v] of Object.entries(patch)) (v === '' || v === null || v === undefined || v === false) ? q.delete(k) : q.set(k, v);
  const s = q.toString(); history[ubah ? 'replaceState' : 'pushState']({}, '', location.pathname + (s ? '?' + s : '')); 
}

const modulCache = {};
async function ambilModul(nama) { return modulCache[nama] || (modulCache[nama] = import('../pages/' + nama + '.js')); }

export function setJudul(judul, deskripsi, opsi = {}) {
  const nama = (state.situs && state.situs.nama) || CONFIG.NAMA;
  document.title = judul ? judul + ' — ' + nama : nama + ' — ' + (CONFIG.TAGLINE);
  const set = (sel, atr, val, buat) => { let el = document.head.querySelector(sel); if (!el && buat) { el = buat(); document.head.append(el); } if (el) el.setAttribute(atr, val); };
  if (deskripsi !== undefined) { set('meta[name="description"]', 'content', deskripsi || CONFIG.TAGLINE, () => h('meta', { name: 'description' })); set('meta[property="og:description"]', 'content', deskripsi || CONFIG.TAGLINE, () => h('meta', { property: 'og:description' })); }
  set('meta[property="og:title"]', 'content', document.title, () => h('meta', { property: 'og:title' }));
  if (opsi.gambar) set('meta[property="og:image"]', 'content', opsi.gambar, () => h('meta', { property: 'og:image' }));
  set('link[rel="canonical"]', 'href', location.origin + BASE + jalurSaatIni(), () => h('link', { rel: 'canonical' }));
  let ld = document.getElementById('jsonld'); if (opsi.jsonLd) { if (!ld) { ld = h('script', { type: 'application/ld+json', id: 'jsonld' }); document.head.append(ld); } ld.textContent = JSON.stringify(opsi.jsonLd); } else if (ld) ld.remove();
  const rb = document.head.querySelector('meta[name="robots"]'); if (opsi.noindex) { if (!rb) document.head.append(h('meta', { name: 'robots', content: 'noindex' })); } else if (rb) rb.remove();
}

export async function render() {
  const mine = ++tiket; const jalur = jalurSaatIni(); const query = parseQuery(location.search);
  pembersih.splice(0).forEach(f => { try { f(); } catch (e) { /* abaikan */ } });
  const hasil = cocok(jalur);
  const rute = hasil ? hasil.rute : null, params = hasil ? hasil.params : {};
  if (rute && rute.auth && !state.user) { return navigasi(href('/masuk') + '?lanjut=' + encodeURIComponent(jalur + location.search), { ganti: true }); }
  if (rute && rute.peran && state.user && !(state.user.peran || []).some(x => rute.peran.includes(x))) { return tampilTolak(); }
  if (hooks.saatMulai) hooks.saatMulai(rute);
  const layout = rute ? rute.layout : 'publik';
  const isi = hooks.pasangLayout ? hooks.pasangLayout(layout, jalur) : document.getElementById('app');
  if (!rute) { ganti(isi, h('div', { class: 'wadah seksi' }, h('div', { class: 'kosong' }, h('h1', null, '404'), h('p', null, 'Halaman tidak ditemukan.'), h('a', { class: 'btn', href: href('/') , 'data-link': ''}, 'Ke beranda')))); setJudul('Halaman tidak ditemukan', '', { noindex: true }); return; }
  const wadah = h('div', { class: 'halaman' }); ganti(isi, wadah); scrollTo(0, 0);
  const ctx = { params, query, jalur, wadah, layout, saatPergi, navigasi, aturQuery, setJudul, href };
  try {
    const mod = await ambilModul(rute.modul); if (mine !== tiket) return;
    const fn = mod[rute.nama]; if (!fn) throw new Error('Halaman belum tersedia: ' + rute.modul + '.' + rute.nama);
    setJudul(null, undefined, { noindex: rute.auth });
    const hsl = await fn(ctx); if (mine !== tiket) return;
    if (hsl instanceof Node) ganti(wadah, hsl);
  } catch (e) { if (mine !== tiket) return; console.error(e); ganti(wadah, h('div', { class: 'wadah seksi' }, h('div', { class: 'galat-kotak', role: 'alert' }, h('div', { class: 'tebal' }, 'Halaman gagal dimuat'), h('div', null, e.message || 'Coba muat ulang.'), h('button', { class: 'btn sm sekunder', style: { marginTop: '10px' }, onclick: () => render() }, 'Coba lagi')))); }
  if (hooks.saatSelesai) hooks.saatSelesai(rute, jalur);
  if (location.hash) { const el = document.getElementById(decodeURIComponent(location.hash.slice(1))); if (el) el.scrollIntoView(); }
  const fokus = wadah.querySelector('h1'); if (fokus) { fokus.setAttribute('tabindex', '-1'); fokus.focus({ preventScroll: true }); }
}
function tampilTolak() {
  const isi = hooks.pasangLayout('publik', jalurSaatIni());
  ganti(isi, h('div', { class: 'wadah seksi' }, h('div', { class: 'kosong' }, h('h2', null, 'Anda tidak punya akses ke halaman ini'), h('p', null, 'Masuk dengan akun yang sesuai atau kembali ke beranda.'), h('a', { class: 'btn', href: href('/'), 'data-link': '' }, 'Ke beranda'))));
  setJudul('Akses ditolak', '', { noindex: true });
}
export function mulaiRouter() {
  addEventListener('popstate', () => render());
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
    if (a.target && a.target !== '_self' || a.hasAttribute('download')) return;
    const u = new URL(a.href, location.href); if (u.origin !== location.origin) return;
    if (BASE && !(u.pathname === BASE || u.pathname.startsWith(BASE + '/'))) return;
    if (/\.(pdf|png|jpe?g|webp|svg|xml|txt|json|webmanifest)$/i.test(u.pathname)) return;
    e.preventDefault(); navigasi(u.pathname + u.search + u.hash);
  });
  return render();
}
