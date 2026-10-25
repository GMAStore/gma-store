// Masuk, daftar, lupa sandi.
import { CONFIG } from '../config.js';
import { h, ikon, ganti } from '../lib/dom.js';
import { panggil } from '../lib/api.js';
import { state, atur } from '../lib/store.js';
import { href, navigasi } from '../lib/router.js';
import { formulir, ok as sukses, tahan } from '../lib/ui.js';
import { setelahMasuk, tujuanLanjut } from '../lib/sesi.js';

const kepala = () => { const n = (state.situs && state.situs.nama) || CONFIG.NAMA; return h('a', { class: 'logo', href: href('/') }, ikon('store'), n); };
const kartu = (judul, sub, ...isi) => h('div', { class: 'auth-kartu' }, kepala(), h('h1', { style: { fontSize: '22px', textAlign: 'center' } }, judul), sub ? h('p', { class: 'redup', style: { textAlign: 'center' } }, sub) : null, ...isi);
const sandiMata = (f) => null;

export async function masuk(ctx) {
  if (state.user) return navigasi(tujuanLanjut('/'), { ganti: true });
  ctx.setJudul('Masuk', 'Masuk ke akun Anda.', { noindex: true });
  const g = h('div'); 
  const f = formulir([{ k: 'email', label: 'Email', tipe: 'email', wajib: true, auto: 'username', mode: 'email' }, { k: 'sandi', label: 'Sandi', tipe: 'password', wajib: true, auto: 'current-password' }], {}, {
    label: 'Masuk', kirim: async (v, api) => { try { const r = await panggil('authMasuk', { email: v.email, sandi: v.sandi }); await setelahMasuk(r.token, r.user); sukses('Selamat datang, ' + r.user.nama.split(' ')[0] + '!'); const p = r.user.peran; navigasi(tujuanLanjut(p.includes('KURIR') ? '/kurir' : (p.some(x => ['SUPER_ADMIN', 'ADMIN_OPS', 'ADMIN_KEU', 'ADMIN_KOMUNITAS'].includes(x)) ? '/admin' : '/')), { ganti: true }); } catch (e) { ganti(g, h('div', { class: 'galat-kotak', role: 'alert', style: { marginBottom: '12px' } }, e.message)); } } });
  f.tombol.classList.add('blok', 'lg');
  ganti(ctx.wadah, kartu('Masuk', 'Belanja dan jualan di satu tempat.', g, f.el, h('p', { class: 'pusat', style: { marginTop: '12px' } }, h('a', { href: href('/lupa-sandi') }, 'Lupa sandi?')), h('hr'), h('p', { class: 'pusat' }, 'Belum punya akun? ', h('a', { href: href('/daftar') + location.search }, 'Daftar gratis'))));
}

export async function daftar(ctx) {
  if (state.user) return navigasi('/', { ganti: true });
  ctx.setJudul('Daftar', 'Buat akun baru.', { noindex: true });
  const g = h('div'); const kodeUndangan = new URLSearchParams(location.search).get('kode') || '';
  const f = formulir([
    { k: 'nama', label: 'Nama lengkap', tipe: 'text', wajib: true, auto: 'name', minPanjang: 2 },
    { k: 'email', label: 'Email', tipe: 'email', wajib: true, auto: 'email', mode: 'email' },
    { k: 'hp', label: 'Nomor HP / WhatsApp', tipe: 'tel', auto: 'tel', bantu: 'Untuk notifikasi pesanan. Contoh 081234567890.' },
    { k: 'sandi', label: 'Sandi', tipe: 'password', wajib: true, auto: 'new-password', bantu: 'Minimal 8 karakter, ada huruf dan angka.', cek: (v) => (v.length < 8 || !/[A-Za-z]/.test(v) || !/\d/.test(v)) ? 'Minimal 8 karakter dengan huruf dan angka.' : '' },
    { k: 'kodeUndangan', label: 'Kode komunitas (jika ada)', tipe: 'text', bantu: 'Isi bila Anda anggota koperasi/perusahaan/komunitas tertentu.' },
    { k: 'setuju', label: 'Saya setuju dengan Syarat & Ketentuan dan Kebijakan Privasi', tipe: 'checkbox', wajib: true }], { kodeUndangan }, {
    label: 'Buat akun', kirim: async (v) => { try { const r = await panggil('authDaftar', { nama: v.nama, email: v.email, hp: v.hp || undefined, sandi: v.sandi, kodeUndangan: v.kodeUndangan || undefined }); await setelahMasuk(r.token, r.user); sukses('Akun dibuat. Selamat berbelanja!'); navigasi(tujuanLanjut('/'), { ganti: true }); } catch (e) { ganti(g, h('div', { class: 'galat-kotak', role: 'alert', style: { marginBottom: '12px' } }, e.message)); } } });
  f.tombol.classList.add('blok', 'lg');
  ganti(ctx.wadah, kartu('Buat akun', 'Gratis dan hanya semenit.', g, f.el, h('p', { class: 'kecil pusat' }, 'Dengan mendaftar Anda menyetujui ', h('a', { href: href('/h/syarat') }, 'Syarat & Ketentuan'), ' dan ', h('a', { href: href('/h/privasi') }, 'Kebijakan Privasi'), '.'), h('hr'), h('p', { class: 'pusat' }, 'Sudah punya akun? ', h('a', { href: href('/masuk') + location.search }, 'Masuk'))));
}

export async function lupa(ctx) {
  ctx.setJudul('Lupa sandi', 'Atur ulang sandi Anda.', { noindex: true }); const isi = h('div');
  const tahap1 = () => { const f = formulir([{ k: 'email', label: 'Email akun', tipe: 'email', wajib: true }], {}, { label: 'Kirim kode', kirim: async (v) => { await panggil('authLupaMinta', { email: v.email }); sukses('Jika email terdaftar, kode sudah dikirim.'); tahap2(v.email); } }); f.tombol.classList.add('blok'); ganti(isi, h('p', { class: 'redup' }, 'Kami kirim kode 6 digit ke WhatsApp/email yang terdaftar.'), f.el); };
  const tahap2 = (email) => { const f = formulir([{ k: 'kode', label: 'Kode dari WhatsApp/email', tipe: 'text', wajib: true, mode: 'numeric', auto: 'one-time-code' }, { k: 'sandiBaru', label: 'Sandi baru', tipe: 'password', wajib: true, auto: 'new-password', bantu: 'Minimal 8 karakter, ada huruf dan angka.' }], {}, { label: 'Ganti sandi', kirim: async (v) => { await panggil('authLupaSelesai', { email, kode: v.kode, sandiBaru: v.sandiBaru }); sukses('Sandi diganti. Silakan masuk.'); navigasi(href('/masuk'), { ganti: true }); } }); f.tombol.classList.add('blok'); ganti(isi, h('p', { class: 'redup' }, 'Kode dikirim ke ' + email + '. Berlaku beberapa menit.'), f.el); };
  tahap1(); ganti(ctx.wadah, kartu('Lupa sandi', '', isi, h('p', { class: 'pusat', style: { marginTop: '12px' } }, h('a', { href: href('/masuk') }, '‹ Kembali masuk'))));
}
