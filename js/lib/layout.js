// Rangka halaman: publik (header, bottom-nav, footer), portal (penjual/admin), kurir, auth.
import { CONFIG } from '../config.js';
import { h, ikon, ganti, kosongkan, inisial, gambar, $ } from './dom.js';
import { state, atur, pantau, punyaPeran, terapkanTema, simpan } from './store.js';
import { PETA, href, navigasi, jalurSaatIni, BASE as BASE_ } from './router.js';
import { panggil, paket, bersihkanCache } from './api.js';
import { konfirmasi, toast, laporGalat } from './ui.js';

let layoutAktif = null, isiEl = null, rangka = null;
const app = () => document.getElementById('app');
const A = (p, kelas, ...anak) => h('a', { href: href(p), class: kelas || null }, ...anak);

/* ---------- Tema situs (hanya layout publik) ---------- */
function lum(hex) { const m = /^#?([0-9a-f]{6})$/i.exec(hex || ''); if (!m) return 0.5; const n = parseInt(m[1], 16); const f = (c) => { c /= 255; return c <= .03928 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4; }; return .2126 * f(n >> 16) + .7152 * f((n >> 8) & 255) + .0722 * f(n & 255); }
export function terapkanTemaSitus(on) {
  const s = document.documentElement.style; const t = state.situs && state.situs.tema;
  ['--primer', '--primer-tua', '--primer-muda', '--di-primer', '--segar', '--hangat', '--kasih', '--latar'].forEach(k => s.removeProperty(k));
  if (document.documentElement.dataset.siteDark) { delete document.documentElement.dataset.siteDark; terapkanTema(); }
  if (!on || !t) return;
  if (t.primer) { s.setProperty('--primer', t.primer); s.setProperty('--primer-tua', `color-mix(in srgb, ${t.primer} 82%, black)`); s.setProperty('--primer-muda', `color-mix(in srgb, ${t.primer} 12%, var(--kartu))`); s.setProperty('--di-primer', lum(t.primer) > .42 ? '#1b1b2f' : '#ffffff'); }
  if (t.segar) s.setProperty('--segar', t.segar); if (t.hangat) s.setProperty('--hangat', t.hangat); if (t.kasih) s.setProperty('--kasih', t.kasih);
  if (t.latar && state.tema === 'auto') { s.setProperty('--latar', t.latar); if (lum(t.latar) < .18) { document.documentElement.dataset.theme = 'dark'; document.documentElement.dataset.siteDark = '1'; } }
}

/* ---------- Komponen bersama ---------- */
function tombolTema() {
  const ikn = () => state.tema === 'gelap' ? 'sun' : 'moon';
  const b = h('button', { class: 'tombol-ikon', type: 'button', 'aria-label': 'Ganti tema terang/gelap', onclick: () => { const gelap = document.documentElement.dataset.theme === 'dark' || (state.tema === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches); atur({ tema: gelap ? 'terang' : 'gelap' }); terapkanTema(); ganti(b, ikon(ikn())); } }, ikon(ikn()));
  return b;
}
export async function keluar() {
  if (!(await konfirmasi({ judul: 'Keluar?', pesan: 'Anda akan keluar dari akun ini.', ya: 'Keluar' }))) return;
  try { await panggil('authKeluarSemua', {}, { diam: true, coba: 1 }); } catch (e) { /* tetap keluar secara lokal */ }
  bersihSesi(); navigasi(href('/')); toast('Anda sudah keluar.', 'info');
}
export function bersihSesi() { atur({ token: '', user: null, saldo: null, notif: 0, keranjang: 0, chat: 0 }); bersihkanCache(); }
const lencana = (n) => n > 0 ? h('span', { class: 'lencana-angka', 'aria-label': n + ' baru' }, n > 99 ? '99+' : n) : null;

/* ---------- Layout publik ---------- */
function bangunPublik() {
  const nama = (state.situs && state.situs.nama) || CONFIG.NAMA; const logo = state.situs && state.situs.logo;
  const q = h('input', { class: 'input', type: 'search', name: 'q', placeholder: 'Cari produk, toko…', 'aria-label': 'Cari produk', autocomplete: 'off', enterkeyhint: 'search' });
  const form = h('form', { class: 'cari', role: 'search', onsubmit: (e) => { e.preventDefault(); const v = q.value.trim(); navigasi(href('/cari') + (v ? '?q=' + encodeURIComponent(v) : '')); } }, ikon('search'), q);
  const bNotif = h('a', { class: 'tombol-ikon', href: href('/notifikasi'), 'aria-label': 'Notifikasi' }, ikon('bell')), bKeranjang = h('a', { class: 'tombol-ikon', href: href('/keranjang'), 'aria-label': 'Keranjang' }, ikon('cart')), bChat = h('a', { class: 'tombol-ikon', href: href('/chat'), 'aria-label': 'Pesan' }, ikon('message'));
  const akun = h('div', { class: 'baris-rapat' }); const komunitas = h('span');
  const menuAkun = () => {
    const u = state.user; if (!u) return h('div', { class: 'auth-tombol' }, A('/masuk', 'btn sekunder sm', 'Masuk'), A('/daftar', 'btn sm', 'Daftar'));
    const dd = h('div', { class: 'dropdown', hidden: true, role: 'menu' });
    const item = (p, ik, t) => h('a', { href: href(p), role: 'menuitem' }, ikon(ik), t);
    dd.append(h('div', { style: { padding: '8px 12px' } }, h('div', { class: 'tebal potong' }, u.nama), h('small', { class: 'potong' }, u.email)), h('hr'),
      item('/akun', 'user', 'Akun saya'), item('/pesanan', 'package', 'Pesanan saya'), item('/wishlist', 'heart', 'Wishlist'), item('/apresiasi', 'gift', 'Poin & lencana'), item('/dokumen', 'file', 'Dokumen'), item('/alamat', 'pin', 'Alamat'));
    if (punyaPeran('PENJUAL', 'STAF_TOKO')) dd.append(h('hr'), item('/penjual', 'store', 'Dasbor penjual')); else dd.append(h('hr'), item('/jual/daftar', 'store', 'Buka toko'));
    if (punyaPeran('SUPER_ADMIN', 'ADMIN_OPS', 'ADMIN_KEU', 'ADMIN_KOMUNITAS')) dd.append(item('/admin', 'shield', 'Panel admin'));
    if (punyaPeran('KURIR')) dd.append(item('/kurir', 'truck', 'Aplikasi kurir'));
    dd.append(h('hr'), h('button', { type: 'button', role: 'menuitem', onclick: keluar }, ikon('logout'), 'Keluar'));
    const btn = h('button', { class: 'tombol-ikon', type: 'button', 'aria-haspopup': 'menu', 'aria-expanded': 'false', 'aria-label': 'Menu akun', onclick: (e) => { e.stopPropagation(); dd.hidden = !dd.hidden; btn.setAttribute('aria-expanded', String(!dd.hidden)); } }, h('span', { class: 'avatar', style: { width: '34px', height: '34px', fontSize: '13px' } }, inisial(u.nama)));
    const tutup = (e) => { if (!wrap.contains(e.target)) { dd.hidden = true; btn.setAttribute('aria-expanded', 'false'); } }; document.addEventListener('click', tutup);
    const wrap = h('div', { class: 'menu-akun' }, btn, dd); dd.addEventListener('click', () => { dd.hidden = true; }); wrap.addEventListener('keydown', (e) => { if (e.key === 'Escape') { dd.hidden = true; btn.focus(); } }); return wrap;
  };
  const segarAkun = () => { ganti(akun, state.user ? [bChat, bNotif, bKeranjang] : [bKeranjang], tombolTema(), menuAkun()); bNotif.append(...[lencana(state.notif)].filter(Boolean)); bKeranjang.append(...[lencana(state.keranjang)].filter(Boolean)); bChat.append(...[lencana(state.chat)].filter(Boolean)); };
  const segarLencana = () => { [[bNotif, state.notif], [bKeranjang, state.keranjang], [bChat, state.chat]].forEach(([b, n]) => { const l = b.querySelector('.lencana-angka'); if (l) l.remove(); const x = lencana(n); if (x) b.append(x); }); };
  segarAkun(); ['notif', 'keranjang', 'chat'].forEach(k => pantau(k, segarLencana)); pantau('user', segarAkun);
  const header = h('header', { class: 'header' }, h('div', { class: 'wadah dalam' },
    h('a', { class: 'logo', href: href('/'), 'aria-label': nama + ' — beranda' }, logo ? gambar(logo, nama) : ikon('store'), h('span', null, nama)), form,
    h('nav', { class: 'nav-atas', 'aria-label': 'Menu utama' }, A('/live', 'btn ghost sm', ikon('video'), 'Live'), A('/flash-sale', 'btn ghost sm', ikon('zap'), 'Flash Sale')), komunitas, akun));
  const sel = () => { const p = jalurSaatIni(); return (r) => r === '/' ? p === '/' : p.startsWith(r); }; const aktif = sel();
  const bn = (p, ik, t, k) => h('a', { href: href(p), class: aktif(p) ? 'aktif' : '', 'aria-current': aktif(p) ? 'page' : null }, ikon(ik), t);
  const bottom = h('nav', { class: 'bottom-nav', 'aria-label': 'Navigasi bawah' }, bn('/', 'home', 'Beranda'), bn('/live', 'video', 'Live'), bn('/cari', 'search', 'Cari'),
    (() => { const a = bn('/keranjang', 'cart', 'Keranjang'); a.style.position = 'relative'; if (state.keranjang) a.append(lencana(state.keranjang)); return a; })(), bn(state.user ? '/akun' : '/masuk', 'user', state.user ? 'Akun' : 'Masuk'));
  const isi = h('main', { id: 'isi', tabindex: '-1' });
  const st = (state.situs && state.situs.halaman) || [];
  const footer = h('footer', { class: 'footer' }, h('div', { class: 'wadah' }, h('div', { class: 'kolom-footer' },
    h('div', null, h('div', { class: 'logo' }, ikon('store'), nama), h('p', { class: 'redup', style: { marginTop: '8px', fontSize: '14px' } }, (state.situs && state.situs.tagline) || CONFIG.TAGLINE)),
    h('div', null, h('h4', null, 'Bantuan'), st.slice(0, 4).map(x => A('/h/' + x.slug, null, x.judul))),
    h('div', null, h('h4', null, 'Kebijakan'), st.slice(4).map(x => A('/h/' + x.slug, null, x.judul)), A('/verifikasi', null, 'Cek keaslian dokumen')),
    h('div', null, h('h4', null, 'Jualan'), A('/jual/daftar', null, 'Buka toko'), A('/live', null, 'Live shopping'))),
    h('div', { class: 'hak' }, '© ' + new Date().getFullYear() + ' ' + nama + '. Dana pembeli aman di escrow sampai barang diterima.')));
  const frag = [h('a', { class: 'lompat', href: '#isi', onclick: (e) => { e.preventDefault(); isi.focus(); } }, 'Lompat ke konten'), header, isi, footer, bottom];
  return { akar: frag, isi, destroy: () => {} };
}

/* ---------- Portal (penjual / admin) ---------- */
const NAV_PENJUAL = [['Utama', [['/penjual', 'Dasbor', 'chart'], ['/penjual/pesanan', 'Pesanan', 'package'], ['/penjual/produk', 'Produk', 'box']]],
  ['Jualan', [['/penjual/live', 'Live studio', 'video'], ['/penjual/chat', 'Pesan pembeli', 'message'], ['/penjual/ulasan', 'Ulasan', 'star'], ['/penjual/studio-ai', 'Studio AI', 'sparkles']]],
  ['Keuangan', [['/penjual/dompet', 'Dompet & tarik dana', 'wallet'], ['/penjual/laporan', 'Laporan & dokumen', 'file']]],
  ['Toko', [['/penjual/toko', 'Pengaturan toko', 'settings'], ['/penjual/penalti', 'Penalti & banding', 'flag']]]];
const NAV_ADMIN = [['Ringkasan', [['/admin', 'Dasbor', 'chart'], ['/admin/statistik', 'Statistik', 'chart']]],
  ['Operasional', [['/admin/verifikasi', 'Verifikasi penjual', 'shield'], ['/admin/produk', 'Moderasi produk', 'box'], ['/admin/sengketa', 'Sengketa', 'flag'], ['/admin/laporan', 'Laporan warga', 'alert'], ['/admin/penalti', 'Penalti & banding', 'flag'], ['/admin/ulasan', 'Moderasi ulasan', 'star'], ['/admin/live', 'Moderasi live', 'video']]],
  ['Keuangan', [['/admin/pembayaran', 'Verifikasi pembayaran', 'card'], ['/admin/penarikan', 'Penarikan dana', 'wallet'], ['/admin/kas-cod', 'Kas COD', 'cash'], ['/admin/keuangan', 'Laporan keuangan', 'file']]],
  ['Konten & promosi', [['/admin/landing', 'Landing page', 'layers'], ['/admin/banner', 'Banner', 'image'], ['/admin/flash-sale', 'Flash sale', 'zap'], ['/admin/voucher', 'Voucher', 'tag'], ['/admin/halaman', 'Halaman statis', 'file']]],
  ['Komunikasi', [['/admin/notifikasi', 'WhatsApp & notifikasi', 'send'], ['/admin/crm', 'CRM kontak', 'users'], ['/admin/dokumen', 'Dokumen & template', 'file']]],
  ['Data & sistem', [['/admin/pengguna', 'Pengguna', 'users'], ['/admin/komunitas', 'Komunitas', 'globe'], ['/admin/kategori', 'Kategori', 'grid'], ['/admin/kurir', 'Kurir & tarif', 'truck'], ['/admin/pengaturan', 'Pengaturan', 'settings'], ['/admin/kunci', 'Kunci & integrasi', 'lock'], ['/admin/blokir', 'Blokir (2 orang)', 'shield'], ['/admin/audit', 'Audit & kesehatan', 'clock']]]];
function bolehLihat(path) { const r = PETA.find(x => x.pola === path); return !r || !r.peran || (state.user && state.user.peran.some(p => r.peran.includes(p))); }
function bangunPortal(jenis) {
  const nav = jenis === 'admin' ? NAV_ADMIN : NAV_PENJUAL; const judul = jenis === 'admin' ? 'Panel Admin' : 'Dasbor Penjual';
  const side = h('aside', { class: 'sidebar', 'aria-label': 'Menu ' + judul }); let lat = null;
  const tutup = () => { side.classList.remove('terbuka'); if (lat) { lat.remove(); lat = null; } };
  const buka = () => { side.classList.add('terbuka'); lat = h('div', { class: 'latar-sidebar', onclick: tutup }); document.body.append(lat); };
  const navEl = h('nav'); const p = jalurSaatIni();
  nav.forEach(([g, items]) => { const vis = items.filter(([pp]) => bolehLihat(pp)); if (!vis.length) return; navEl.append(h('div', { class: 'grup' }, g)); vis.forEach(([pp, t, ik]) => { const on = pp === '/penjual' || pp === '/admin' ? p === pp : (p === pp || p.startsWith(pp + '/')); navEl.append(h('a', { href: href(pp), class: on ? 'aktif' : '', 'aria-current': on ? 'page' : null, onclick: tutup }, ikon(ik), t)); }); });
  side.append(h('div', { class: 'merek' }, h('a', { class: 'logo', href: href(jenis === 'admin' ? '/admin' : '/penjual') }, ikon('store'), ((state.situs && state.situs.nama) || CONFIG.NAMA)), h('button', { class: 'tombol-ikon menu-btn-tutup', type: 'button', 'aria-label': 'Tutup menu', onclick: tutup }, ikon('x'))), navEl,
    h('div', { style: { marginTop: 'auto', padding: '10px' } }, A('/', 'btn sekunder sm blok', ikon('home'), 'Ke situs belanja')));
  const atas = h('header', { class: 'portal-atas' }, h('button', { class: 'tombol-ikon menu-btn', type: 'button', 'aria-label': 'Buka menu', onclick: buka }, ikon('menu')), h('strong', { class: 'judul' }, judul), h('span', { style: { flex: 1 } }),
    jenis === 'penjual' && state.user ? A('/penjual/pesanan', 'btn ghost sm', ikon('package'), 'Pesanan') : null, tombolTema(), state.user ? h('button', { class: 'btn ghost sm', type: 'button', onclick: keluar }, ikon('logout'), h('span', null, 'Keluar')) : null);
  const isi = h('main', { class: 'portal-isi', id: 'isi', tabindex: '-1' });
  return { akar: [h('a', { class: 'lompat', href: '#isi', onclick: (e) => { e.preventDefault(); const m = document.getElementById('isi'); m && m.focus(); } }, 'Lompat ke konten'), h('div', { class: 'portal' }, side, h('div', { class: 'portal-utama' }, atas, isi))], isi };
}

/* ---------- Kurir & Auth ---------- */
function bangunKurir() {
  const p = jalurSaatIni(); const n = (path, ik, t) => h('a', { href: href(path), class: p === path ? 'aktif' : '' }, ikon(ik), t);
  const isi = h('main', { id: 'isi', tabindex: '-1', style: { padding: '16px' } });
  return { akar: [h('div', { class: 'kurir-app' }, h('header', { class: 'kurir-atas' }, h('h1', null, 'GMA Kurir'), h('div', { class: 'baris-rapat' }, tombolTema(), h('button', { class: 'tombol-ikon', style: { color: 'inherit' }, type: 'button', 'aria-label': 'Keluar', onclick: keluar }, ikon('logout')))), isi,
    h('nav', { class: 'kurir-nav', 'aria-label': 'Menu kurir' }, n('/kurir', 'package', 'Tersedia'), n('/kurir/tugas', 'truck', 'Tugas saya'), n('/kurir/kas', 'wallet', 'Kas COD'), n('/kurir/akun', 'user', 'Akun')))], isi };
}
function bangunAuth() { const isi = h('main', { class: 'auth-bungkus', id: 'isi' }); return { akar: [isi], isi }; }

/** Dipanggil router. Rangka dibangun ulang hanya bila jenis layout / pengguna berubah. */
export function pasangLayout(nama, jalur) {
  const kunci = nama + '|' + (state.user ? state.user.id + state.user.peran.join() : '-') + '|' + ((state.situs && state.situs.nama) || '');
  if (kunci !== rangka || !isiEl || !isiEl.isConnected) {
    const b = nama === 'publik' ? bangunPublik() : nama === 'auth' ? bangunAuth() : nama === 'kurir' ? bangunKurir() : bangunPortal(nama);
    kosongkan(app()); app().append(...b.akar); isiEl = b.isi; rangka = kunci;
  }
  document.body.classList.toggle('punya-bottom', nama === 'publik');
  if (layoutAktif !== nama) { terapkanTemaSitus(nama === 'publik' || nama === 'auth'); layoutAktif = nama; }
  return isiEl;
}
/** Tandai tautan menu yang cocok dengan alamat sekarang. */
export function tandaiAktif() {
  const p = jalurSaatIni();
  document.querySelectorAll('.sidebar nav a, .bottom-nav a, .kurir-nav a').forEach((a) => {
    let ap = new URL(a.href).pathname; if (BASE_ && ap.startsWith(BASE_)) ap = ap.slice(BASE_.length); ap = ap || '/';
    const akar = ap === '/' || ap === '/penjual' || ap === '/admin' || ap === '/kurir';
    const on = akar ? p === ap : (p === ap || p.startsWith(ap + '/'));
    a.classList.toggle('aktif', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
}
export function paksaBangunUlang() { rangka = null; }

/* ---------- Penghitung lencana (latar) ---------- */
let pj = null;
export async function segarkanLencana() {
  if (!state.user || document.hidden) return;
  try { const [n, k, c] = await paket([['notifDaftar', { per: 1 }], ['keranjangAmbil', {}], ['chatDaftar', {}]]); atur({ notif: n ? n.belumDibaca || 0 : 0, keranjang: k ? hitungKeranjang(k) : 0, chat: c ? c.belumBaca || 0 : 0 }); } catch (e) { /* diam */ }
}
export function hitungKeranjang(k) { return (k.grup || []).reduce((s, g) => s + (g.items || []).reduce((a, i) => a + (Number(i.qty) || 0), 0), 0); }
export function mulaiLencana() { clearInterval(pj); pj = setInterval(segarkanLencana, 60000); document.addEventListener('visibilitychange', () => { if (!document.hidden) segarkanLencana(); }); }
