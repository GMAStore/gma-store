// Komponen UI: toast, modal, laci, tombol sibuk, formulir, tabel, paginasi, tab, status.
import { h, ikon, ganti, kosongkan, rp, tgl, $ } from './dom.js';
import { GalatApi, unggahBerkas, kecilkanGambar } from './api.js';

/* ---------- Toast ---------- */
let wadahToast;
export function toast(pesan, jenis = 'info', ms = 3800) {
  if (!wadahToast) { wadahToast = h('div', { class: 'toast-wadah', role: 'status', 'aria-live': 'polite' }); document.body.append(wadahToast); }
  const ik = jenis === 'ok' ? 'check' : jenis === 'gagal' ? 'alert' : 'info';
  const t = h('div', { class: 'toast ' + jenis }, ikon(ik), h('div', { class: 'isi' }, pesan));
  wadahToast.append(t); setTimeout(() => t.remove(), ms); return t;
}
export const ok = (m) => toast(m, 'ok'); export const gagal = (m) => toast(m, 'gagal', 5200);
export function laporGalat(e) { gagal(e && e.message ? e.message : 'Terjadi kesalahan.'); if (!(e instanceof GalatApi)) console.error(e); }

/* ---------- Tombol sibuk: cegah klik ganda + tampilkan putaran ---------- */
export async function tahan(tombol, fn) {
  if (tombol && tombol.dataset.sibuk) return;
  const isi = tombol ? Array.from(tombol.childNodes) : [];
  if (tombol) { tombol.dataset.sibuk = '1'; tombol.disabled = true; tombol.prepend(ikon('refresh', 'putar')); }
  try { return await fn(); } catch (e) { laporGalat(e); } finally { if (tombol) { delete tombol.dataset.sibuk; tombol.disabled = false; const p = tombol.querySelector(':scope > .putar'); if (p) p.remove(); } }
}

/* ---------- Modal / laci ---------- */
const tumpukan = [];
function kunciGulir(on) { document.body.style.overflow = on ? 'hidden' : ''; }
function perangkap(kotak) {
  kotak.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const f = Array.from(kotak.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select,textarea,[tabindex]:not([tabindex="-1"])')).filter(x => x.offsetParent !== null);
    if (!f.length) return; const a = f[0], z = f[f.length - 1];
    if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
  });
}
export function modal({ judul, isi, kaki, lebar = false, bawah = false, tutupLuar = true, saatTutup } = {}) {
  const pemicu = document.activeElement;
  const id = 'm' + Math.random().toString(36).slice(2, 7);
  const tutup = () => { const i = tumpukan.indexOf(api); if (i >= 0) tumpukan.splice(i, 1); lapis.remove(); if (!tumpukan.length) kunciGulir(false); if (pemicu && pemicu.focus) try { pemicu.focus(); } catch (e) { /* abaikan */ } if (saatTutup) saatTutup(); };
  const kotak = h('div', { class: 'modal' + (lebar ? ' lebar' : ''), role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': id + 'j' },
    h('div', { class: 'modal-kepala' }, h('h3', { id: id + 'j' }, judul || ''), h('button', { class: 'tombol-ikon', type: 'button', 'aria-label': 'Tutup', onclick: tutup }, ikon('x'))),
    h('div', { class: 'modal-isi' }, isi), kaki ? h('div', { class: 'modal-kaki' }, kaki) : null);
  const lapis = h('div', { class: 'lapis' + (bawah ? ' bawah' : ''), onmousedown: (e) => { if (tutupLuar && e.target === lapis) tutup(); } }, kotak);
  const api = { el: kotak, tutup, lapis }; tumpukan.push(api);
  document.body.append(lapis); kunciGulir(true); perangkap(kotak);
  const fokus = kotak.querySelector('input:not([type=hidden]),select,textarea') || kotak.querySelector('.modal-kaki .btn') || kotak.querySelector('.tombol-ikon'); setTimeout(() => fokus && fokus.focus(), 30);
  return api;
}
addEventListener('keydown', (e) => { if (e.key === 'Escape' && tumpukan.length) tumpukan[tumpukan.length - 1].tutup(); });
export function tutupSemuaModal() { while (tumpukan.length) tumpukan[tumpukan.length - 1].tutup(); }
export function konfirmasi({ judul = 'Yakin?', pesan = '', ya = 'Ya, lanjut', tidak = 'Batal', bahaya = false } = {}) {
  return new Promise((res) => {
    let selesai = false; const akhir = (v) => { if (selesai) return; selesai = true; m.tutup(); res(v); };
    const m = modal({ judul, isi: h('p', null, pesan), tutupLuar: true, saatTutup: () => { if (!selesai) { selesai = true; res(false); } },
      kaki: [h('button', { class: 'btn sekunder', type: 'button', onclick: () => akhir(false) }, tidak), h('button', { class: 'btn' + (bahaya ? ' bahaya' : ''), type: 'button', onclick: () => akhir(true) }, ya)] });
  });
}
export function tanya({ judul, label, nilai = '', ya = 'Kirim', area = false, wajib = true, bantu = '', tipe = 'text' } = {}) {
  return new Promise((res) => {
    let selesai = false; const inp = h(area ? 'textarea' : 'input', { class: area ? 'textarea' : 'input', value: nilai, type: tipe, rows: 3, id: 'tq' });
    const kirim = () => { const v = inp.value.trim(); if (wajib && !v) { inp.classList.add('galat'); inp.focus(); return; } selesai = true; m.tutup(); res(v); };
    const m = modal({ judul, isi: h('div', { class: 'field' }, h('label', { for: 'tq' }, label || ''), inp, bantu ? h('span', { class: 'bantu' }, bantu) : null), saatTutup: () => { if (!selesai) res(null); },
      kaki: [h('button', { class: 'btn sekunder', type: 'button', onclick: () => m.tutup() }, 'Batal'), h('button', { class: 'btn', type: 'button', onclick: kirim }, ya)] });
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !area) { e.preventDefault(); kirim(); } });
  });
}
export function laci({ judul, isi, kaki, saatTutup } = {}) {
  const pemicu = document.activeElement;
  const tutup = () => { lp.remove(); kotak.remove(); kunciGulir(false); const i = tumpukan.indexOf(api); if (i >= 0) tumpukan.splice(i, 1); if (pemicu && pemicu.focus) try { pemicu.focus(); } catch (e) { /* abaikan */ } if (saatTutup) saatTutup(); };
  const kotak = h('aside', { class: 'laci', role: 'dialog', 'aria-modal': 'true', 'aria-label': judul || 'Panel' },
    h('div', { class: 'modal-kepala' }, h('h3', null, judul || ''), h('button', { class: 'tombol-ikon', type: 'button', 'aria-label': 'Tutup', onclick: tutup }, ikon('x'))),
    h('div', { class: 'modal-isi', style: { flex: '1', overflow: 'auto' } }, isi), kaki ? h('div', { class: 'modal-kaki' }, kaki) : null);
  const lp = h('div', { class: 'latar-sidebar', style: { zIndex: 900 }, onclick: tutup });
  const api = { el: kotak, tutup }; tumpukan.push(api); document.body.append(lp, kotak); kunciGulir(true); perangkap(kotak);
  setTimeout(() => { const f = kotak.querySelector('input,select,textarea,.tombol-ikon'); f && f.focus(); }, 30); return api;
}

/* ---------- Status ---------- */
const PETA_STATUS = [
  [/^(SELESAI|AKTIF|DISETUJUI|TERKIRIM|TERBIT|LUNAS|DIBAYAR|TERVERIFIKASI|BERHASIL|OK|SUKSES|DITERIMA|TERDAFTAR|TERSEDIA|VERIFIED|PUBLISH|TERPUBLIKASI|DIPUTUSKAN)/i, 'ok'],
  [/^(MENUNGGU|BELUM|DIAJUKAN|REVIEW|ANTRI|PENDING|DRAF_REVIEW|MENUNGGU_)/i, 'tunggu'],
  [/^(DIPROSES|DIKIRIM|DALAM|PROSES|BERJALAN|DIKEMAS|SIAP|DIAMBIL|DIANTAR|MENGANTAR)/i, 'proses'],
  [/^(DITOLAK|GAGAL|DIBATALKAN|BATAL|DIBLOKIR|SUSPEND|DITARIK|KADALUARSA|EXPIRED|TIDAK|RETUR|SENGKETA|DIHENTIKAN|NONAKTIF)/i, 'gagal'],
  [/^(ESCROW|DITAHAN|DANA_TAHAN)/i, 'escrow'], [/^(LIVE|SEDANG_LIVE)$/i, 'live'],
];
export function status(teks, tampil) {
  const s = String(teks || ''); let k = 'draf'; for (const [re, c] of PETA_STATUS) if (re.test(s)) { k = c; break; }
  return h('span', { class: 'status ' + k }, tampil || s.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase()));
}

/* ---------- Kosong / galat / skeleton ---------- */
export function kosong(judul, teks, aksi, ik = 'package') { return h('div', { class: 'kosong' }, ikon(ik), h('h3', null, judul), teks ? h('p', null, teks) : null, aksi || null); }
export function kotakGalat(e, ulangi) { return h('div', { class: 'galat-kotak', role: 'alert' }, h('div', { class: 'tebal' }, 'Gagal memuat'), h('div', null, e && e.message ? e.message : 'Coba lagi nanti.'), ulangi ? h('button', { class: 'btn sm sekunder', style: { marginTop: '10px' }, type: 'button', onclick: ulangi }, 'Coba lagi') : null); }
export function skeleton(n = 3, tinggi = 90) { const w = h('div', { class: 'kolom', 'aria-busy': 'true', 'aria-label': 'Memuat' }); for (let i = 0; i < n; i++) w.append(h('div', { class: 'skel', style: { height: tinggi + 'px' } })); return w; }
export function skelProduk(n = 8) { const w = h('div', { class: 'grid g-produk', 'aria-busy': 'true' }); for (let i = 0; i < n; i++) w.append(h('div', null, h('div', { class: 'skel skel-gambar' }), h('div', { class: 'skel skel-teks', style: { width: '80%' } }), h('div', { class: 'skel skel-teks', style: { width: '50%' } }))); return w; }

/** Muat data ke dalam wadah dengan skeleton → isi → galat+coba lagi. */
export async function muat(wadah, ambil, tampil, { skel = () => skeleton() } = {}) {
  const jalan = async () => {
    ganti(wadah, skel());
    try { const d = await ambil(); const n = tampil(d); ganti(wadah, n); return d; }
    catch (e) { ganti(wadah, kotakGalat(e, jalan)); }
  };
  return jalan();
}

/* ---------- Tab ---------- */
export function tab(daftar, awal, saatGanti) {
  const bar = h('div', { class: 'tab-bar', role: 'tablist' }); const isi = h('div', { role: 'tabpanel' });
  let aktif = awal || daftar[0].k;
  const pasang = (k, tanpaEvent) => {
    aktif = k; Array.from(bar.children).forEach((b) => { const on = b.dataset.k === k; b.classList.toggle('aktif', on); b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; });
    if (!tanpaEvent) { const d = daftar.find(x => x.k === k); ganti(isi, d.isi ? (typeof d.isi === 'function' ? d.isi() : d.isi) : ''); if (saatGanti) saatGanti(k); }
  };
  daftar.forEach((d) => bar.append(h('button', { type: 'button', role: 'tab', dataset: { k: d.k }, onclick: () => pasang(d.k), onkeydown: (e) => { const i = daftar.findIndex(x => x.k === aktif); if (e.key === 'ArrowRight') { pasang(daftar[(i + 1) % daftar.length].k); bar.children[(i + 1) % daftar.length].focus(); } if (e.key === 'ArrowLeft') { const j = (i - 1 + daftar.length) % daftar.length; pasang(daftar[j].k); bar.children[j].focus(); } } }, d.label ?? d.t, d.angka ? h('span', { class: 'angka-tab' }, d.angka) : null)));
  const el = h('div', null, bar, isi); pasang(aktif); return { el, pilih: pasang, isi, get aktif() { return aktif; } };
}

/* ---------- Paginasi ---------- */
export function paginasi({ hal, per, total }, ke) {
  const n = Math.max(1, Math.ceil(total / per)); if (n <= 1) return h('span');
  const w = h('nav', { class: 'hal', 'aria-label': 'Halaman' });
  const tb = (t, p, aktif, mati, lab) => h('button', { type: 'button', class: aktif ? 'aktif' : '', disabled: mati, 'aria-label': lab, 'aria-current': aktif ? 'page' : null, onclick: () => ke(p) }, t);
  w.append(tb('‹', hal - 1, false, hal <= 1, 'Sebelumnya'));
  const set = new Set([1, n, hal, hal - 1, hal + 1, hal - 2, hal + 2].filter(x => x >= 1 && x <= n)); let last = 0;
  Array.from(set).sort((a, b) => a - b).forEach((p) => { if (p - last > 1) w.append(h('span', { class: 'redup' }, '…')); w.append(tb(String(p), p, p === hal, false, 'Halaman ' + p)); last = p; });
  w.append(tb('›', hal + 1, false, hal >= n, 'Berikutnya')); return w;
}

/* ---------- Tabel ---------- */
export function tabel(kolom, baris, { kosongTeks = 'Belum ada data.', saatKlik, caption } = {}) {
  if (!baris || !baris.length) return kosong(kosongTeks, '', null, 'file');
  const tb = h('table', { class: 'tabel' }, caption ? h('caption', { class: 'sr-only' }, caption) : null,
    h('thead', null, h('tr', null, kolom.map(c => h('th', { scope: 'col', class: c.kanan ? 'kanan' : '' }, c.judul)))),
    h('tbody', null, baris.map((r, i) => h('tr', { style: saatKlik ? { cursor: 'pointer' } : null, tabindex: saatKlik ? 0 : null, onclick: saatKlik ? () => saatKlik(r) : null, onkeydown: saatKlik ? (e) => { if (e.key === 'Enter') saatKlik(r); } : null },
      kolom.map(c => { const v = c.tampil ? c.tampil(r, i) : r[c.k]; return h('td', { class: (c.kanan ? 'kanan ' : '') + (c.aksi ? 'aksi' : ''), 'data-label': c.judul }, v === undefined || v === null || v === '' ? '–' : v); })))));
  return h('div', { class: 'tabel-bungkus' }, tb);
}

/* ---------- Formulir ---------- */
let seqF = 0;
export function formulir(skema, awal = {}, { kirim, label = 'Simpan', batal, kecil = false } = {}) {
  const f = h('form', { novalidate: true, class: kecil ? '' : '' }); const ref = {};
  const id = 'f' + (++seqF);
  const nilaiDari = (s) => {
    const el = ref[s.k]; if (!el) return undefined;
    if (s.tipe === 'checkbox' || s.tipe === 'switch') return el.checked;
    if (s.tipe === 'number') return el.value === '' ? '' : Number(el.value);
    if (s.tipe === 'pilihan') return (Array.from(el.querySelectorAll('input:checked')).map(i => i.value))[0] || '';
    if (s.tipe === 'banyak') return Array.from(el.querySelectorAll('input:checked')).map(i => i.value);
    if (s.tipe === 'file') return el._nilai || '';
    return el.value;
  };
  const gal = (s, teks) => { const el = ref[s.k]; const p = f.querySelector('[data-galat="' + s.k + '"]'); if (p) p.textContent = teks || ''; if (el && el.classList) el.classList.toggle('galat', !!teks); if (el && el.setAttribute) el.setAttribute('aria-invalid', teks ? 'true' : 'false'); };
  skema.forEach((s) => {
    if (s.tipe === 'judul') { f.append(h('h4', { style: { margin: '16px 0 8px' } }, s.label)); return; }
    if (s.tipe === 'info') { f.append(h('div', { class: 'info-kotak', style: { marginBottom: '12px' } }, s.label)); return; }
    const v = awal[s.k] ?? s.bawaan ?? ''; const idf = id + s.k; let el;
    const umum = { id: idf, name: s.k, 'aria-describedby': idf + 'b', placeholder: s.placeholder, autocomplete: s.auto, maxlength: s.maks, min: s.min, max: s.maksNilai, step: s.langkah, inputmode: s.mode, disabled: s.mati };
    if (s.tipe === 'textarea') el = h('textarea', { class: 'textarea', rows: s.baris || 4, ...umum }, v);
    else if (s.tipe === 'select') { el = h('select', { class: 'select input', ...umum }, (s.opsi || []).map(o => h('option', { value: o.v ?? o, selected: String(o.v ?? o) === String(v) }, o.t ?? o))); }
    else if (s.tipe === 'checkbox' || s.tipe === 'switch') el = h('input', { type: 'checkbox', class: s.tipe === 'switch' ? 'sakelar' : '', checked: !!v, ...umum, placeholder: null });
    else if (s.tipe === 'pilihan' || s.tipe === 'banyak') {
      const sel = s.tipe === 'banyak' ? (Array.isArray(v) ? v.map(String) : []) : [String(v)];
      el = h('div', { class: 'pil-pilih', role: s.tipe === 'pilihan' ? 'radiogroup' : 'group', id: idf }, (s.opsi || []).map(o => { const val = String(o.v ?? o); return h('label', null, h('input', { type: s.tipe === 'pilihan' ? 'radio' : 'checkbox', name: idf, value: val, checked: sel.includes(val), disabled: o.mati }), h('span', null, o.t ?? o)); }));
    } else if (s.tipe === 'file') {
      const info = h('span', { class: 'bantu' }, v ? 'Berkas terunggah' : (s.bantu || 'Belum ada berkas')); const prev = h('img', { alt: '', style: { maxWidth: '140px', borderRadius: '8px', display: v && s.pratinjau ? 'block' : 'none' }, src: v && s.pratinjau ? v : '' });
      const inp = h('input', { type: 'file', accept: s.terima || 'image/jpeg,image/png,image/webp', class: 'input', id: idf, onchange: async () => {
        const fl = inp.files[0]; if (!fl) return; info.textContent = 'Mengunggah…';
        try { const kecil = await kecilkanGambar(fl, s.sisiMaks || 1280); const r = await unggahBerkas(kecil, s.jenisBerkas || 'produk'); el._nilai = s.simpanId ? r.fileId : (r.url || r.fileId); info.textContent = 'Terunggah ✓'; if (r.url && s.pratinjau) { prev.src = r.url; prev.style.display = 'block'; } gal(s, ''); }
        catch (e) { el._nilai = ''; info.textContent = ''; gal(s, e.message); } } });
      el = h('div', { class: 'kolom', style: { gap: '6px' } }, inp, prev, info); el._nilai = v || '';
    } else el = h('input', { class: 'input', type: s.tipe || 'text', value: v, ...umum });
    ref[s.k] = el;
    if (s.tipe === 'hidden') { f.append(h('input', { type: 'hidden', name: s.k, value: v })); return; }
    const isCek = s.tipe === 'checkbox' || s.tipe === 'switch';
    f.append(h('div', { class: 'field' + (s.kelas ? ' ' + s.kelas : '') }, isCek ? h('label', { class: 'cek', for: idf }, el, h('span', null, s.label)) : h('label', { for: idf, class: s.wajib ? 'wajib' : '' }, s.label), isCek ? null : el,
      s.bantu && s.tipe !== 'file' ? h('span', { class: 'bantu', id: idf + 'b' }, s.bantu) : h('span', { id: idf + 'b' }), h('span', { class: 'galat-teks', 'data-galat': s.k, role: 'alert' })));
    if (s.saatUbah) el.addEventListener('input', () => s.saatUbah(nilaiDari(s), api));
  });
  const nilai = () => { const o = {}; skema.forEach(s => { if (s.tipe === 'judul' || s.tipe === 'info') return; if (s.tipe === 'hidden') { o[s.k] = awal[s.k]; return; } o[s.k] = nilaiDari(s); }); return o; };
  const periksa = () => {
    let pertama = null; const n = nilai();
    skema.forEach(s => { if (['judul', 'info', 'hidden'].includes(s.tipe)) return; gal(s, ''); const v = n[s.k]; let m = '';
      if (s.wajib && (v === '' || v === undefined || v === null || (Array.isArray(v) && !v.length) || (s.tipe === 'checkbox' && !v))) m = s.tipe === 'checkbox' ? 'Wajib disetujui.' : 'Wajib diisi.';
      else if (v !== '' && s.tipe === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) m = 'Format email belum benar.';
      else if (v !== '' && s.tipe === 'tel' && !/^(\+?62|0)8\d{7,12}$/.test(String(v).replace(/[\s-]/g, ''))) m = 'Nomor HP belum benar (contoh 081234567890).';
      else if (s.tipe === 'number' && v !== '' && ((s.min !== undefined && v < s.min) || (s.maksNilai !== undefined && v > s.maksNilai))) m = 'Nilai di luar batas' + (s.min !== undefined ? ' (min ' + s.min + ')' : '') + '.';
      else if (typeof v === 'string' && s.minPanjang && v.length < s.minPanjang && v !== '') m = 'Minimal ' + s.minPanjang + ' karakter.';
      else if (s.cek && v !== '') m = s.cek(v, n) || '';
      if (m) { gal(s, m); if (!pertama) pertama = ref[s.k]; } });
    if (pertama) { const t = pertama.querySelector ? (pertama.querySelector('input,select,textarea') || pertama) : pertama; t.focus && t.focus(); return false; } return true;
  };
  const tombolKirim = kirim ? h('button', { class: 'btn', type: 'submit' }, label) : null;
  if (kirim || batal) f.append(h('div', { class: 'baris', style: { marginTop: '8px' } }, tombolKirim, batal ? h('button', { class: 'btn sekunder', type: 'button', onclick: batal }, 'Batal') : null));
  const api = { el: f, nilai, periksa, set(k, v) { const el = ref[k]; if (!el) return; if (el.type === 'checkbox') el.checked = !!v; else if ('value' in el) el.value = v; }, ref, galat(k, m) { const s = skema.find(x => x.k === k); if (s) gal(s, m); }, tombol: tombolKirim };
  f.addEventListener('submit', (e) => { e.preventDefault(); if (!kirim || !periksa()) return; tahan(tombolKirim, () => kirim(nilai(), api)); });
  return api;
}

/* ---------- Potongan umum ---------- */
export function kartuStat(label, nilai, ik, sub) { return h('div', { class: 'kartu stat' }, h('div', { class: 'baris-rapat redup' }, ik ? ikon(ik) : null, h('span', { class: 'label' }, label)), h('div', { class: 'nilai' }, nilai), sub ? h('small', null, sub) : null); }
export function kepalaHalaman(judul, sub, ...aksi) { return h('div', { class: 'halaman-kepala' }, h('div', null, h('h1', null, judul), sub ? h('p', null, sub) : null), aksi.length ? h('div', { class: 'baris' }, aksi) : null); }
export function kv(pasangan) { const d = h('dl', { class: 'kv' }); pasangan.forEach(([k, v]) => { if (v === undefined || v === null || v === '') return; d.append(h('dt', null, k), h('dd', null, v)); }); return d; }
export function pilihChip(daftar, aktif, saat) { const w = h('div', { class: 'baris-rapat', style: { flexWrap: 'wrap' }, role: 'group' }); daftar.forEach(d => w.append(h('button', { type: 'button', class: 'chip' + (String(d.k) === String(aktif) ? ' aktif' : ''), 'aria-pressed': String(d.k) === String(aktif), onclick: () => saat(d.k) }, d.t))); return w; }
export function hitungMundur(sampaiIso, saatHabis) {
  const el = h('span', { class: 'hitung-mundur angka' }); const t = () => { const s = Math.max(0, Math.floor((new Date(sampaiIso) - Date.now()) / 1000)); const hh = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), d = s % 60; el.textContent = String(hh).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(d).padStart(2, '0'); if (!s) { clearInterval(iv); if (saatHabis) saatHabis(); } };
  const iv = setInterval(() => { if (!el.isConnected) return clearInterval(iv); t(); }, 1000); t(); return el;
}
export { rp, tgl, $ };
