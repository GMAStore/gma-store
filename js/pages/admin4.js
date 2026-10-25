// Portal admin 4: konten & komunikasi (landing, banner, flash sale, halaman, notifikasi WA, CRM, dokumen).
import { h, ikon, ganti, rp, angka, tgl, rel, gambar, debounce, simpanTeks } from '../lib/dom.js';
import { panggil } from '../lib/api.js';
import { state } from '../lib/store.js';
import { href } from '../lib/router.js';
import { kosong, kotakGalat, skeleton, tahan, laporGalat, ok as sukses, gagal, konfirmasi, tanya, modal, formulir, kv, kartuStat, kepalaHalaman, pilihChip, tabel, tab, paginasi } from '../lib/ui.js';
import { halaman as kerangka } from './admin.js';

const tombol = (teks, fn, kls = '', ik) => { const b = h('button', { class: 'btn ' + kls, type: 'button' }, ik ? ikon(ik) : null, teks); b.onclick = () => fn(b); return b; };
const punya = (...p) => ((state.user && state.user.peran) || []).some(x => p.includes(x));
function modalForm(judul, skema, awal, simpan, label = 'Simpan', info) {
  let m; const f = formulir(skema, awal, { label, batal: () => m.tutup(), kirim: async (v) => { await simpan(v); m.tutup(); } });
  m = modal({ judul, isi: h('div', null, info || null, f.el), lebar: skema.length > 5 }); return m;
}
const d10 = (v) => (v ? String(v).slice(0, 10) : '');
const iso = (tglStr, akhir) => (tglStr ? new Date(tglStr + (akhir ? 'T23:59:59' : 'T00:00:00')).toISOString() : '');
const lokalDt = (isoStr) => { if (!isoStr) return ''; const d = new Date(isoStr); const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; };

/* ================= LANDING PAGE (CMS) ================= */
const TEMA_LABEL = { primer: 'Warna utama', segar: 'Aksen segar', hangat: 'Aksen hangat', kasih: 'Aksen kasih', latar: 'Latar halaman' };
export async function landing(ctx) {
  let skop = 'utama'; const isi = h('div');
  const komunitasAdmin = punya('ADMIN_KOMUNITAS') && !punya('SUPER_ADMIN', 'ADMIN_OPS');
  const muat = async () => {
    ganti(isi, skeleton(3, 100));
    try { const st = await panggil('adminLandingStatus', { skop }); skop = st.skop; tampil(st); } catch (e) { ganti(isi, kotakGalat(e, muat)); }
  };
  function tampil(st) {
    let templat = (st.draf || st.aktif || {}).template || st.templat[0].id;
    let blok = JSON.parse(JSON.stringify((st.draf || st.aktif || { blok: st.templat[0].blok }).blok));
    let tema = { ...((st.templat.find(t => t.id === templat) || {}).tema || {}), ...((st.draf || st.aktif || {}).tema || {}) };
    const area = h('div');
    const gambarBlok = () => {
      const nama = Object.fromEntries(st.jenisBlok.map(j => [j.tipe, j]));
      ganti(area, h('div', { class: 'kolom' }, blok.map((b, i) => h('div', { class: 'kartu', style: { padding: '12px' } },
        h('div', { class: 'sebar', style: { gap: '8px', flexWrap: 'wrap' } }, h('label', { class: 'cek' }, h('input', { type: 'checkbox', checked: b.aktif !== false, onchange: (e) => { b.aktif = e.target.checked; } }), h('b', null, (nama[b.tipe] || {}).nama || b.tipe)),
          h('div', { class: 'baris-rapat' }, h('button', { class: 'tombol-ikon', type: 'button', 'aria-label': 'Naik', disabled: i === 0, onclick: () => { [blok[i - 1], blok[i]] = [blok[i], blok[i - 1]]; gambarBlok(); } }, '↑'), h('button', { class: 'tombol-ikon', type: 'button', 'aria-label': 'Turun', disabled: i === blok.length - 1, onclick: () => { [blok[i + 1], blok[i]] = [blok[i], blok[i + 1]]; gambarBlok(); } }, '↓'),
            h('button', { class: 'tombol-ikon', type: 'button', 'aria-label': 'Hapus blok', onclick: () => { blok.splice(i, 1); gambarBlok(); } }, ikon('trash')))),
        h('div', { class: 'grid g-2 res', style: { marginTop: '8px' } },
          ...[['judul', 'Judul'], ['sub', 'Sub-judul'], ['cta', 'Teks tombol'], ['tautan', 'Tautan tombol (/cari atau https://…)']].map(([k, l]) => h('label', { class: 'field' }, h('span', null, l), h('input', { class: 'input', value: b[k] || '', oninput: (e) => { b[k] = e.target.value; } }))),
          h('label', { class: 'field' }, h('span', null, 'Tampil mulai'), h('input', { class: 'input', type: 'datetime-local', value: lokalDt(b.mulai), onchange: (e) => { b.mulai = e.target.value ? new Date(e.target.value).toISOString() : ''; } })),
          h('label', { class: 'field' }, h('span', null, 'Tampil sampai'), h('input', { class: 'input', type: 'datetime-local', value: lokalDt(b.selesai), onchange: (e) => { b.selesai = e.target.value ? new Date(e.target.value).toISOString() : ''; } })),
          h('label', { class: 'field' }, h('span', null, 'Jumlah item (opsional)'), h('input', { class: 'input', type: 'number', min: 0, max: 24, value: b.jumlah || '', oninput: (e) => { b.jumlah = Number(e.target.value) || 0; } })))))),
        h('div', { class: 'baris', style: { marginTop: '8px', gap: '8px', alignItems: 'center' } }, (() => { const s = h('select', { class: 'input', 'aria-label': 'Tambah blok', style: { maxWidth: '260px' } }, h('option', { value: '' }, '+ Tambah blok…'), st.jenisBlok.map(j => h('option', { value: j.tipe, disabled: j.tunggal && blok.some(x => x.tipe === j.tipe) }, j.nama))); s.onchange = () => { if (s.value) { blok.push({ tipe: s.value, aktif: true, judul: '', sub: '', cta: '', tautan: '' }); gambarBlok(); } }; return s; })()));
    };
    const pilihTemplat = h('div', { class: 'grid g-2 res' }, st.templat.map(t => h('label', { class: 'kartu', style: { cursor: 'pointer', borderColor: t.id === templat ? 'var(--primer)' : undefined } },
      h('div', { class: 'baris', style: { gap: '8px', alignItems: 'center' } }, h('input', { type: 'radio', name: 'tpl', checked: t.id === templat, onchange: () => { templat = t.id; tema = { ...t.tema }; blok = JSON.parse(JSON.stringify(t.blok)); render(); } }), h('b', null, t.id + ' · ' + t.nama), h('span', { class: 'chip' }, t.gaya)),
      h('p', { class: 'redup' }, t.deskripsi), h('div', { class: 'baris-rapat' }, Object.values(t.tema).filter(v => /^#/.test(v)).map(c => h('span', { 'aria-hidden': 'true', style: { width: '18px', height: '18px', borderRadius: '50%', background: c, border: '1px solid var(--garis)', display: 'inline-block' } }))))));
    const temaEl = () => h('div', { class: 'grid g-4 res' }, Object.keys(TEMA_LABEL).map(k => h('label', { class: 'field' }, h('span', null, TEMA_LABEL[k]), h('input', { type: 'color', value: tema[k] || '#000000', 'aria-label': TEMA_LABEL[k], oninput: (e) => { tema[k] = e.target.value.toUpperCase(); } }))), h('label', { class: 'field' }, h('span', null, 'Huruf'), h('select', { class: 'input', onchange: (e) => { tema.huruf = e.target.value; } }, h('option', { value: 'sans', selected: tema.huruf !== 'serif' }, 'Sans-serif'), h('option', { value: 'serif', selected: tema.huruf === 'serif' }, 'Serif'))));
    const bawa = () => ({ skop, templateId: templat, blok, tema });
    const simpan = async (b) => tahan(b, async () => { await panggil('adminLandingSimpan', bawa()); sukses('Draf disimpan.'); muat(); });
    const pratinjau = async (b) => tahan(b, async () => {
      const r = await panggil('adminLandingPratinjau', bawa());
      modal({ judul: 'Pratinjau susunan landing', lebar: true, isi: h('div', { class: 'kolom' }, h('p', { class: 'redup' }, `Templat ${r.template} · ${r.blok.length} blok aktif. Data produk/toko nyata diambil dari katalog.`), h('ol', null, r.blok.map(b2 => { const jml = r.bagian[b2.tipe]; const n = Array.isArray(jml) ? jml.length : (jml && typeof jml === 'object' ? Object.values(jml).reduce((a, x) => a + (Array.isArray(x) ? x.length : 0), 0) : 0); return h('li', null, h('b', null, b2.judul || b2.tipe), ' ', h('span', { class: 'redup' }, `(${b2.tipe}${jml !== undefined ? ', ' + n + ' item' : ''})`)); })), h('div', { class: 'info-kotak' }, 'Setelah Aktifkan, buka beranda untuk melihat hasil sebenarnya. Versi lama tersimpan sehingga bisa dikembalikan.')) });
    });
    const aktifkan = async (b) => { if (!(await konfirmasi({ judul: 'Aktifkan draf?', pesan: 'Landing page publik langsung berubah. Versi sekarang disimpan untuk dikembalikan.', ya: 'Aktifkan' }))) return; await tahan(b, async () => { await panggil('adminLandingSimpan', bawa()); await panggil('adminLandingAktifkan', { skop }); sukses('Landing page baru aktif.'); muat(); }); };
    const kembali = async (b) => { if (!(await konfirmasi({ judul: 'Kembali ke versi sebelumnya?', ya: 'Kembalikan' }))) return; await tahan(b, async () => { await panggil('adminLandingKembali', { skop }); sukses('Versi sebelumnya dipulihkan.'); muat(); }); };
    const render = () => { gambarBlok(); ganti(temaWadah, temaEl()); ganti(pilihWadah, pilihTemplat); };
    const temaWadah = h('div'), pilihWadah = h('div');
    ganti(isi, h('div', { class: 'baris', style: { gap: '8px', flexWrap: 'wrap', marginBottom: '12px' } }, h('span', { class: 'chip' }, 'Aktif: ' + (st.aktif ? st.aktif.template : '—')), st.draf ? h('span', { class: 'chip' }, 'Ada draf: ' + st.draf.template) : null, st.sebelumnya ? h('span', { class: 'chip' }, 'Versi lama: ' + st.sebelumnya.template) : null, h('a', { class: 'btn ghost sm', href: href('/'), target: '_blank', rel: 'noopener' }, ikon('eye'), 'Lihat beranda')),
      h('h2', null, '1. Pilih templat'), pilihWadah, h('h2', { style: { marginTop: '20px' } }, '2. Susun blok'), area, h('h2', { style: { marginTop: '20px' } }, '3. Warna & huruf'), temaWadah,
      h('div', { class: 'baris', style: { gap: '8px', flexWrap: 'wrap', marginTop: '20px', position: 'sticky', bottom: '8px', background: 'var(--latar)', padding: '8px 0' } }, tombol('Simpan draf', simpan, 'sekunder'), tombol('Pratinjau', pratinjau, 'ghost', 'eye'), tombol('Aktifkan', aktifkan, '', 'check'), st.sebelumnya ? tombol('Kembali ke versi lama', kembali, 'ghost', 'refresh') : null));
    render();
  }
  ctx.setJudul('Landing page', '', { noindex: true });
  const aksi = [];
  if (!komunitasAdmin) { const sel = h('select', { class: 'input', 'aria-label': 'Etalase', onchange: (e) => { skop = e.target.value; muat(); } }, h('option', { value: 'utama' }, 'Etalase utama')); aksi.push(sel); panggil('adminKomunitasDaftar').then(r => r.forEach(k => sel.append(h('option', { value: k.id }, 'Komunitas: ' + k.nama)))).catch(() => {}); }
  ganti(ctx.wadah, kepalaHalaman('Landing page', 'Atur tampilan beranda: templat, urutan blok, teks, dan warna. Perubahan lewat draf dulu.', ...aksi), isi); await muat();
}

/* ================= BANNER ================= */
export async function banner(ctx) {
  await kerangka(ctx, 'Banner', 'Gambar promosi di beranda (hero, tengah, bawah).', [tombol('Banner baru', () => form(), '', 'plus')], async (isi, ulang) => {
    const r = await panggil('adminBannerDaftar');
    ganti(isi, r.length ? h('div', { class: 'grid g-3 res' }, r.map(b => h('article', { class: 'kartu', style: { padding: 0, overflow: 'hidden' } }, gambar(b.gambar, b.judul, '', 480), h('div', { style: { padding: '12px' } }, h('div', { class: 'sebar' }, h('b', null, b.judul), h('span', { class: 'status ' + (b.aktif ? 'ok' : 'proses') }, b.aktif ? 'Aktif' : 'Nonaktif')), h('div', { class: 'redup' }, `${b.posisi} · urutan ${b.urutan}` + (b.mulai ? ' · ' + tgl(b.mulai) : '') + (b.selesai ? ' → ' + tgl(b.selesai) : '')),
      h('div', { class: 'baris', style: { gap: '8px', marginTop: '8px' } }, tombol('Ubah', () => form(b), 'ghost sm', 'edit'), tombol('Hapus', async (bt) => { if (!(await konfirmasi({ judul: 'Hapus banner?', pesan: b.judul, ya: 'Hapus', bahaya: true }))) return; await tahan(bt, async () => { await panggil('adminBannerHapus', { id: b.id }); sukses('Banner dihapus.'); ulang(); }); }, 'ghost sm'))))) ) : kosong('Belum ada banner', 'Tambahkan banner pertama untuk beranda.', null, 'image'));
    window.__banner = ulang;
  });
  function form(b) {
    modalForm(b ? 'Ubah banner' : 'Banner baru', [{ k: 'judul', label: 'Judul (untuk deskripsi gambar)', tipe: 'text', wajib: true }, { k: 'gambar', label: 'Gambar banner', tipe: 'file', jenisBerkas: 'banner', pratinjau: true, wajib: true, bantu: 'Ukuran ideal 1200×400 (JPG/PNG/WebP).', sisiMaks: 1600 }, { k: 'posisi', label: 'Posisi', tipe: 'select', opsi: [{ v: 'HERO', t: 'Hero (atas, karusel)' }, { v: 'TENGAH', t: 'Tengah' }, { v: 'BAWAH', t: 'Bawah' }] }, { k: 'tautan', label: 'Tautan saat diklik', tipe: 'text', placeholder: '/flash-sale atau https://…' }, { k: 'urutan', label: 'Urutan', tipe: 'number', min: 0 }, { k: 'mulai', label: 'Mulai (opsional)', tipe: 'date' }, { k: 'selesai', label: 'Selesai (opsional)', tipe: 'date' }, { k: 'aktif', label: 'Aktif', tipe: 'switch' }],
      b ? { judul: b.judul, gambar: b.gambar, posisi: b.posisi, tautan: b.tautan, urutan: b.urutan, mulai: d10(b.mulai), selesai: d10(b.selesai), aktif: b.aktif } : { posisi: 'HERO', urutan: 10, aktif: true },
      async (v) => { await panggil('adminBannerSimpan', { id: b ? b.id : undefined, judul: v.judul, gambar: v.gambar, posisi: v.posisi, tautan: v.tautan, urutan: Number(v.urutan) || 0, mulai: iso(v.mulai), selesai: iso(v.selesai, true), aktif: !!v.aktif }); sukses('Banner disimpan.'); banner(ctx); });
  }
}

/* ================= FLASH SALE ================= */
const KEL_FS = { Berjalan: 'ok', Terjadwal: 'tunggu', Selesai: 'proses', Dihentikan: 'gagal' };
export async function flashSale(ctx) {
  await kerangka(ctx, 'Flash sale', 'Jadwalkan penawaran terbatas waktu dan kuota (maks. 7 hari).', [tombol('Flash sale baru', () => form(), '', 'zap')], async (isi, ulang) => {
    window.__fs = ulang; const r = await panggil('adminFlashDaftar');
    ganti(isi, r.length ? h('div', { class: 'kolom' }, r.map(f => h('article', { class: 'kartu' }, h('div', { class: 'sebar', style: { flexWrap: 'wrap', gap: '8px' } }, h('div', null, h('b', null, f.judul), h('div', { class: 'redup' }, `${tgl(f.mulai, true)} → ${tgl(f.selesai, true)} · ${f.produk.length} produk`)), h('span', { class: 'status ' + (KEL_FS[f.status] || '') }, f.status)),
      h('div', { class: 'baris', style: { gap: '8px', marginTop: '8px' } }, f.status === 'Berjalan' || f.status === 'Terjadwal' ? tombol(f.status === 'Berjalan' ? 'Perpanjang' : 'Ubah', () => form(f), 'ghost sm', 'edit') : null,
        (f.status === 'Berjalan' || f.status === 'Terjadwal') ? tombol('Hentikan', async (b) => { const a = await tanya({ judul: 'Hentikan flash sale', label: 'Alasan', wajib: false, ya: 'Hentikan' }); if (a === null) return; await tahan(b, async () => { await panggil('adminFlashHentikan', { id: f.id, alasan: a }); sukses('Flash sale dihentikan.'); ulang(); }); }, 'ghost sm') : null)))) : kosong('Belum ada flash sale', '', null, 'zap'));
  });
  async function form(f) {
    const berjalan = f && f.status === 'Berjalan'; let pilih = f ? f.produk.map(x => ({ ...x })) : []; const nama = {};
    const daftarEl = h('div', { class: 'kolom' }), hasil = h('div', { class: 'kolom' });
    const gd = () => ganti(daftarEl, pilih.length ? pilih.map((x, i) => h('div', { class: 'kartu', style: { padding: '8px' } }, h('div', { class: 'sebar', style: { gap: '8px', flexWrap: 'wrap' } }, h('div', null, h('b', null, nama[x.v] || x.v), h('div', { class: 'redup' }, 'Harga normal ' + (x.normal ? rp(x.normal) : '–') + (x.stok ? ' · stok ' + x.stok : ''))),
      berjalan ? h('span', { class: 'redup' }, `Rp${angka(x.harga)} · kuota ${x.k}`) : h('div', { class: 'baris-rapat' }, h('input', { class: 'input', type: 'number', min: 500, value: x.harga, 'aria-label': 'Harga flash', style: { width: '120px' }, oninput: (e) => { x.harga = Number(e.target.value); } }), h('input', { class: 'input', type: 'number', min: 1, value: x.k, 'aria-label': 'Kuota', style: { width: '80px' }, oninput: (e) => { x.k = Number(e.target.value); } }), h('button', { class: 'tombol-ikon', type: 'button', 'aria-label': 'Hapus', onclick: () => { pilih.splice(i, 1); gd(); } }, ikon('trash'))))))
      : h('p', { class: 'redup' }, 'Belum ada produk dipilih.'));
    const cari = h('input', { class: 'input', type: 'search', placeholder: 'Cari produk untuk ditambahkan…', 'aria-label': 'Cari produk', oninput: debounce(async (e) => {
      const q = e.target.value.trim(); if (q.length < 2) return ganti(hasil);
      try { const r = await panggil('katalogCari', { q, per: 6 }); ganti(hasil, r.item.map(p => h('button', { class: 'btn ghost sm', type: 'button', style: { textAlign: 'left', justifyContent: 'flex-start' }, onclick: async () => {
        const d = await panggil('katalogDetail', { slug: p.slug });
        d.varian.forEach(v => { if (!pilih.some(x => x.v === v.id)) { nama[v.id] = p.nama + (d.varian.length > 1 ? ' — ' + v.nama : ''); pilih.push({ p: p.id, v: v.id, harga: Math.max(500, Math.round(v.harga * 0.8 / 500) * 500), k: Math.min(v.stok, 20), normal: v.harga, stok: v.stok }); } }); gd(); ganti(hasil); cari.value = ''; } }, p.nama + ' · ' + rp(p.harga)))); } catch (x) { laporGalat(x); }
    }, 350) });
    const f2 = formulir([{ k: 'judul', label: 'Judul', tipe: 'text', wajib: true, minPanjang: 5 }, { k: 'mulai', label: 'Mulai', tipe: 'datetime-local', wajib: true }, { k: 'selesai', label: 'Selesai', tipe: 'datetime-local', wajib: true }], f ? { judul: f.judul, mulai: lokalDt(f.mulai), selesai: lokalDt(f.selesai) } : { mulai: lokalDt(new Date(Date.now() + 3600e3).toISOString()), selesai: lokalDt(new Date(Date.now() + 25 * 3600e3).toISOString()) },
      { label: 'Simpan flash sale', batal: () => m.tutup(), kirim: async (v) => { await panggil('adminFlashSimpan', { id: f ? f.id : undefined, judul: v.judul, mulai: new Date(v.mulai).toISOString(), selesai: new Date(v.selesai).toISOString(), produk: pilih.map(x => ({ varianId: x.v, harga: x.harga, kuota: x.k })) }); sukses('Flash sale disimpan.'); m.tutup(); ulang(); } });
    function ulang() { flashSale(ctx); }
    const m = modal({ judul: f ? (berjalan ? 'Perpanjang flash sale' : 'Ubah flash sale') : 'Flash sale baru', lebar: true, isi: h('div', { class: 'kolom' }, f2.el, berjalan ? h('div', { class: 'info-kotak' }, 'Flash sale yang sedang berjalan hanya bisa diperpanjang atau dihentikan.') : h('div', { class: 'kolom' }, h('h3', null, 'Produk peserta'), cari, hasil, daftarEl)) }); gd();
  }
}

/* ================= HALAMAN STATIS ================= */
export async function halaman(ctx) { return halamanImpl(ctx); }
async function halamanImpl(ctx) {
  await kerangka(ctx, 'Halaman statis', 'Tentang kami, syarat & ketentuan, kebijakan privasi, bantuan. Mendukung format Markdown.', [tombol('Halaman baru', () => form(), '', 'plus')], async (isi, ulang) => {
    const r = await panggil('adminHalamanDaftar'); window.__hal = ulang;
    ganti(isi, tabel([{ judul: 'Halaman', tampil: p => h('div', null, h('b', null, p.judul), h('div', { class: 'redup' }, '/h/' + p.slug)) }, { judul: 'Urutan', kanan: true, k: 'urutan' }, { judul: 'Status', tampil: p => h('span', { class: 'status ' + (p.aktif ? 'ok' : 'proses') }, p.aktif ? 'Tayang' : 'Disembunyikan') }, { judul: 'Diperbarui', tampil: p => p.diperbarui ? rel(p.diperbarui) : '–' }, { judul: '', aksi: true, tampil: p => h('div', { class: 'baris-rapat' }, h('a', { class: 'btn ghost sm', href: href('/h/' + p.slug), target: '_blank', rel: 'noopener' }, 'Lihat'), tombol('Ubah', () => form(p), 'sm', 'edit')) }], r, { caption: 'Halaman statis' }));
  });
  function form(p) {
    modalForm(p ? 'Ubah halaman' : 'Halaman baru', [{ k: 'judul', label: 'Judul', tipe: 'text', wajib: true }, { k: 'slug', label: 'Alamat (slug)', tipe: 'text', wajib: true, bantu: 'Huruf kecil dan tanda hubung, mis. syarat-ketentuan.' }, { k: 'isi', label: 'Isi (Markdown)', tipe: 'textarea', baris: 14, wajib: true, minPanjang: 20, bantu: '## Judul bagian, **tebal**, - daftar. Minimal 20 karakter.' }, { k: 'urutan', label: 'Urutan di footer', tipe: 'number', min: 0 }, { k: 'aktif', label: 'Tayang', tipe: 'switch' }],
      p ? { judul: p.judul, slug: p.slug, isi: p.isi, urutan: p.urutan, aktif: p.aktif } : { urutan: 50, aktif: true },
      async (v) => { await panggil('adminHalamanSimpan', { judul: v.judul, slug: v.slug, isi: v.isi, urutan: Number(v.urutan) || 0, aktif: !!v.aktif }); sukses('Halaman disimpan.'); halamanImpl(ctx); });
  }
}

/* ================= WHATSAPP & NOTIFIKASI ================= */
const KEL_ANT = { Antri: 'tunggu', Mengirim: 'proses', Terkirim: 'ok', Gagal: 'gagal', Batal: 'proses' };
export async function notifikasi(ctx) {
  ctx.setJudul('WhatsApp & notifikasi', '', { noindex: true });
  const t = tab([{ k: 'pengaturan', t: 'Pengaturan', isi: () => panelPengaturan() }, { k: 'blast', t: 'Blast WA', isi: () => panelBlast() }, { k: 'antrean', t: 'Antrean & log', isi: () => panelAntrean() }], 'pengaturan');
  ganti(ctx.wadah, kepalaHalaman('WhatsApp & notifikasi', 'Atur kejadian yang memicu pesan, kirim blast, dan pantau antrean.'), t.el);

  function panelPengaturan() {
    const w = h('div'); (async () => {
      ganti(w, skeleton(3, 80));
      try {
        const [k, dev] = await Promise.all([panggil('notifKonfigAmbil'), panggil('waPerangkat')]);
        const mat = Object.fromEntries(k.matriks.map(m => [m.kode, { wa: m.wa, email: m.email, pesan: m.pesan, subjek: m.subjek }]));
        const wa = h('input', { type: 'checkbox', id: 'n-wa', checked: k.waAktif }), em = h('input', { type: 'checkbox', id: 'n-em', checked: k.emailAktif });
        const batch = h('select', { class: 'input', id: 'n-b', 'aria-label': 'Ukuran batch' }, [10, 20, 50].map(n => h('option', { value: n, selected: n === k.batchDefault }, n + ' pesan per putaran')));
        const jeda = h('input', { class: 'input', id: 'n-j', value: k.jeda, 'aria-label': 'Jeda detik' }), nama = h('input', { class: 'input', id: 'n-n', value: k.namaPengirim, 'aria-label': 'Nama pengirim email' });
        const matriksEl = h('div', { class: 'kolom' }, k.matriks.map(m => h('div', { class: 'kartu', style: { padding: '12px' } }, h('div', { class: 'sebar', style: { flexWrap: 'wrap', gap: '8px' } }, h('b', null, m.label), h('div', { class: 'baris', style: { gap: '12px' } },
          h('label', { class: 'cek' }, h('input', { type: 'checkbox', checked: m.wa, onchange: (e) => { mat[m.kode].wa = e.target.checked; } }), 'WhatsApp'), h('label', { class: 'cek' }, h('input', { type: 'checkbox', checked: m.email, onchange: (e) => { mat[m.kode].email = e.target.checked; } }), 'Email'))),
          h('details', null, h('summary', { class: 'redup' }, 'Ubah teks pesan'), h('textarea', { class: 'input', rows: 4, 'aria-label': 'Teks pesan ' + m.label, oninput: (e) => { mat[m.kode].pesan = e.target.value; } }, m.pesan), h('div', { class: 'redup' }, 'Variabel memakai kurung kurawal, mis. {nama}, {invoice}, {link}.')))));
        const simpan = async (b) => tahan(b, async () => { await panggil('notifKonfigSimpan', { waAktif: wa.checked, emailAktif: em.checked, batchDefault: Number(batch.value), jeda: jeda.value.trim(), namaPengirim: nama.value.trim(), matriks: mat }); sukses('Pengaturan notifikasi disimpan.'); });
        ganti(w, h('div', { class: 'kolom' },
          k.mode === 'SIMULASI' || !k.tokenAda ? h('div', { class: 'peringatan-kotak' }, k.petunjukToken || 'Mode SIMULASI: pesan dicatat di antrean tetapi tidak benar-benar terkirim.') : h('div', { class: 'info-kotak' }, `Fonnte terhubung: ${dev.perangkat || '-'} · paket ${dev.paket || '-'} · kuota ${dev.kuota || '-'}`),
          h('div', { class: 'grid g-4 res' }, kartuStat('Antri', angka(k.antrean.Antri), 'clock'), kartuStat('Terkirim', angka(k.antrean.Terkirim), 'check'), kartuStat('Gagal', angka(k.antrean.Gagal), 'alert'), kartuStat('Kuota email harian', angka(k.kuotaEmail), 'mail')),
          h('section', { class: 'kartu' }, h('h3', null, 'Saklar utama'), h('label', { class: 'cek' }, wa, 'Aktifkan notifikasi WhatsApp'), h('label', { class: 'cek' }, em, 'Aktifkan notifikasi email'),
            h('div', { class: 'grid g-3 res', style: { marginTop: '8px' } }, h('label', { class: 'field' }, h('span', null, 'Ukuran batch blast'), batch), h('label', { class: 'field' }, h('span', null, 'Jeda antar pesan (detik, mis. 5 atau 3-8)'), jeda), h('label', { class: 'field' }, h('span', null, 'Nama pengirim email'), nama))),
          h('section', { class: 'kartu' }, h('h3', null, 'Kejadian & kanal'), h('p', { class: 'redup' }, 'Pilih kejadian yang memicu pesan, dan lewat kanal apa.'), matriksEl),
          h('div', { class: 'baris', style: { gap: '8px', flexWrap: 'wrap' } }, tombol('Simpan pengaturan', simpan, '', 'check'), tombol('Kirim pesan uji', ujiKirim, 'ghost', 'send'), tombol('Proses antrean sekarang', async (b) => { await tahan(b, async () => { const r = await panggil('notifProsesSekarang'); sukses('Antrean diproses.'); }); }, 'ghost', 'refresh'))));
      } catch (e) { ganti(w, kotakGalat(e)); }
    })(); return w;
  }
  function ujiKirim() { modalForm('Kirim pesan uji WhatsApp', [{ k: 'nomor', label: 'Nomor tujuan', tipe: 'tel', wajib: true, placeholder: '08123456789' }], {}, async (v) => { const r = await panggil('waKirimTes', v); r.berhasil ? sukses(r.mode === 'SIMULASI' ? 'SIMULASI: pesan tercatat (tidak terkirim sungguhan).' : 'Terkirim.') : gagal('Gagal: ' + r.respon); }, 'Kirim uji'); }

  function panelBlast() {
    const w = h('div'), daftar = h('div', { class: 'kolom' });
    const muat = async () => { ganti(daftar, skeleton(2, 80)); try { const r = await panggil('waBlastDaftar'); ganti(daftar, r.length ? r.map(b => h('article', { class: 'kartu' }, h('div', { class: 'sebar', style: { flexWrap: 'wrap' } }, h('b', null, b.judul), h('span', { class: 'status ' + (b.status === 'Berjalan' ? 'tunggu' : b.status === 'Selesai' ? 'ok' : 'proses') }, b.status)),
      h('div', { class: 'meter', role: 'progressbar', 'aria-valuenow': b.persen, 'aria-valuemin': 0, 'aria-valuemax': 100, style: { height: '8px', background: 'var(--garis)', borderRadius: '99px', overflow: 'hidden', margin: '8px 0' } }, h('div', { style: { width: b.persen + '%', height: '100%', background: 'var(--primer)' } })),
      h('div', { class: 'redup' }, `${b.terkirim} terkirim · ${b.gagal} gagal · ${b.sisa} sisa dari ${b.total} · batch ${b.batch} · ${rel(b.tanggal)}`),
      b.status === 'Berjalan' ? h('div', { class: 'baris', style: { gap: '8px', marginTop: '8px' } }, tombol('Kirim batch berikutnya', async (bt) => { await tahan(bt, async () => { await panggil('waBlastProses', { blastId: b.id }); sukses('Batch diproses.'); muat(); }); }, 'sm', 'send'), tombol('Hentikan', async (bt) => { if (!(await konfirmasi({ judul: 'Hentikan blast?', pesan: 'Pesan yang belum terkirim dibatalkan.', ya: 'Hentikan', bahaya: true }))) return; await tahan(bt, async () => { await panggil('waBlastHenti', { blastId: b.id }); sukses('Blast dihentikan.'); muat(); }); }, 'ghost sm')) : null)) : kosong('Belum ada blast', 'Buat blast pertama untuk menyapa kontak CRM.', null, 'send')); } catch (e) { ganti(daftar, kotakGalat(e, muat)); } };
    ganti(w, h('div', { class: 'baris', style: { marginBottom: '12px' } }, tombol('Buat blast baru', buat, '', 'plus')), daftar); muat(); return w;
    async function buat() {
      let filter = {}; const info = h('div', { class: 'info-kotak' }, 'Memuat jumlah penerima…');
      const hitung = async () => { try { const r = await panggil('waAudience', { filter }); const g = r.ringkas; ganti(info, h('b', null, `${angka(g.valid)} penerima valid`), ` dari ${angka(g.total)} kontak — ${g.terdaftarWA} terverifikasi WA, ${g.optOut} berhenti berlangganan, ${g.tidakValid} nomor tidak valid, ${g.ganda} ganda.`); } catch (e) { ganti(info, 'Gagal menghitung: ' + e.message); } };
      const seg = await panggil('crmDaftar', { perHalaman: 10 }).catch(() => ({ segmen: {} }));
      const f = formulir([{ k: 'judul', label: 'Judul internal', tipe: 'text', wajib: true, minPanjang: 3 }, { k: 'segmen', label: 'Sasaran segmen', tipe: 'select', opsi: [{ v: '', t: 'Semua kontak' }].concat(Object.keys(seg.segmen).map(s => ({ v: s, t: `${s} (${seg.segmen[s]})` }))) }, { k: 'tag', label: 'Filter tag (opsional)', tipe: 'text' },
        { k: 'pesan', label: 'Isi pesan', tipe: 'textarea', baris: 5, wajib: true, minPanjang: 10, maks: 1000, bantu: 'Gunakan {nama} untuk menyapa. Footer berhenti berlangganan ditambahkan otomatis.' }, { k: 'ukuranBatch', label: 'Ukuran batch', tipe: 'select', opsi: [{ v: '10', t: '10' }, { v: '20', t: '20' }, { v: '50', t: '50' }] }],
        { ukuranBatch: '20', pesan: 'Halo {nama}! Ada promo spesial di GMA Store minggu ini. Yuk cek: {link}' }, { label: 'Buat blast', batal: () => m.tutup(), kirim: async (v) => { if (!(await konfirmasi({ judul: 'Buat blast?', pesan: 'Pesan akan diantrekan ke semua penerima valid dan dikirim per batch.', ya: 'Buat blast' }))) return; const r = await panggil('waBlastBuat', { judul: v.judul, pesan: v.pesan, ukuranBatch: Number(v.ukuranBatch), filter: { ...(v.segmen ? { segmen: v.segmen } : {}), ...(v.tag ? { tag: v.tag } : {}) } }); sukses(`Blast dibuat: ${r.total} penerima (±${r.perkiraanMenit} menit).` + (r.mode === 'SIMULASI' ? ' Mode SIMULASI.' : '')); m.tutup(); muat(); } });
      const m = modal({ judul: 'Blast WhatsApp baru', lebar: true, isi: h('div', { class: 'kolom' }, f.el, info) });
      const baca = () => { filter = {}; const sg = f.nilai().segmen, tg = f.nilai().tag; if (sg) filter.segmen = sg; if (tg) filter.tag = tg; hitung(); }; f.el.addEventListener('change', baca); f.el.addEventListener('input', debounce(baca, 500)); hitung();
    }
  }
  function panelAntrean() {
    let st = '', kn = ''; const w = h('div'), hasil = h('div'), chip = h('div');
    const muat = async () => { ganti(hasil, skeleton(3, 40)); try { const r = await panggil('notifAntrian', { status: st, kanal: kn, limit: 100 });
      ganti(hasil, tabel([{ judul: 'Waktu', tampil: x => rel(x.dibuat || x.waktu) }, { judul: 'Kanal', k: 'kanal' }, { judul: 'Tujuan', tampil: x => h('div', null, x.tujuan, h('div', { class: 'redup' }, x.nama || '')) }, { judul: 'Kejadian', tampil: x => h('code', null, x.event) }, { judul: 'Pesan', tampil: x => h('span', { class: 'klem-2' }, x.pesan) }, { judul: 'Status', tampil: x => h('span', { class: 'status ' + (KEL_ANT[x.status] || '') }, x.status) }], r.item, { kosongTeks: 'Antrean kosong.', caption: 'Antrean notifikasi' })); } catch (e) { ganti(hasil, kotakGalat(e, muat)); } };
    const gc = () => ganti(chip, pilihChip([{ k: '', t: 'Semua' }, { k: 'Antri', t: 'Antri' }, { k: 'Terkirim', t: 'Terkirim' }, { k: 'Gagal', t: 'Gagal' }], st, (k) => { st = k; gc(); muat(); })); gc();
    ganti(w, h('div', { class: 'baris', style: { gap: '8px', flexWrap: 'wrap', marginBottom: '12px', alignItems: 'center' } }, chip, tombol('Ulang yang gagal', async (b) => { await tahan(b, async () => { const r = await panggil('notifUlang', {}); sukses(r.diantrekan + ' pesan diantrekan ulang.'); muat(); }); }, 'ghost sm', 'refresh')), hasil); muat(); return w;
  }
}

/* ================= CRM KONTAK ================= */
export async function crm(ctx) {
  let q = '', segmen = '', hal = 1; const daftar = h('div'), chip = h('div'); let ringkas = {};
  const muat = async () => {
    ganti(daftar, skeleton(3, 50));
    try {
      const r = await panggil('crmDaftar', { q, segmen, halaman: hal, perHalaman: 25 }); ringkas = r.segmen;
      ganti(chip, pilihChip([{ k: '', t: 'Semua' }].concat(Object.keys(ringkas).map(s => ({ k: s, t: `${s} (${ringkas[s]})` }))), segmen, (k) => { segmen = k; hal = 1; muat(); }));
      ganti(daftar, tabel([{ judul: 'Nama', tampil: k => h('div', null, h('b', null, k.nama), h('div', { class: 'redup' }, k.email || '')) }, { judul: 'WhatsApp', tampil: k => h('div', null, k.wa || '–', k.statusWA ? h('div', { class: 'redup' }, k.statusWA) : null) }, { judul: 'Segmen', k: 'segmen' }, { judul: 'Tag', tampil: k => k.tag.map(t => h('span', { class: 'chip', style: { marginRight: '4px' } }, t)) }, { judul: 'Pesan', kanan: true, tampil: k => angka(k.jumlahPesan) }, { judul: 'Terakhir', tampil: k => k.terakhir ? rel(k.terakhir) : '–' }, { judul: '', tampil: k => k.optOut ? h('span', { class: 'status gagal' }, 'Opt-out') : '' }], r.item, { kosongTeks: 'Tidak ada kontak.', saatKlik: detail, caption: 'Kontak CRM' }), paginasi({ hal, per: 25, total: r.total }, (p) => { hal = p; muat(); }));
    } catch (e) { ganti(daftar, kotakGalat(e, muat)); }
  };
  async function detail(k) {
    const d = await panggil('crmDetail', { id: k.id }).catch(e => { laporGalat(e); return null; }); if (!d) return; const c = d.kontak;
    const tag = h('input', { class: 'input', id: 'crm-tag', value: c.tag.join(', '), 'aria-label': 'Tag (pisahkan koma)' }), cat = h('textarea', { class: 'input', id: 'crm-cat', rows: 2, 'aria-label': 'Catatan' }, c.catatan || '');
    const m = modal({ judul: c.nama, lebar: true, isi: h('div', { class: 'kolom' }, kv([['Email', c.email], ['WhatsApp', c.wa + (c.statusWA ? ' (' + c.statusWA + ')' : '')], ['Segmen', c.segmen], ['Toko', c.toko], ['Poin', c.poin], ['Pesanan', c.pesanan], ['Pesan terkirim', c.jumlahPesan], ['Opt-out promo', c.optOut ? 'Ya' : 'Tidak']]),
      h('label', { for: 'crm-tag', class: 'tebal' }, 'Tag'), tag, h('label', { for: 'crm-cat', class: 'tebal' }, 'Catatan'), cat,
      h('div', { class: 'baris', style: { gap: '8px' } }, tombol('Simpan', async (b) => { await tahan(b, async () => { await panggil('crmSimpan', { id: c.id, tag: tag.value, catatan: cat.value }); sukses('Kontak disimpan.'); muat(); }); }, 'sm'), tombol('Catat interaksi', () => catat(c), 'ghost sm', 'message')),
      h('h3', null, 'Riwayat interaksi'), d.interaksi.length ? h('ul', null, d.interaksi.map(i => h('li', null, h('b', null, i.kanal), ' — ', i.ringkasan, ' ', h('span', { class: 'redup' }, rel(i.waktu))))) : h('p', { class: 'redup' }, 'Belum ada interaksi.')) });
  }
  function catat(c) { modalForm('Catat interaksi', [{ k: 'kanal', label: 'Kanal', tipe: 'select', opsi: ['Telepon', 'WhatsApp', 'Email', 'Tatap muka', 'Lainnya'].map(v => ({ v, t: v })) }, { k: 'ringkasan', label: 'Ringkasan', tipe: 'textarea', wajib: true, minPanjang: 3 }], { kanal: 'WhatsApp' }, async (v) => { await panggil('crmCatat', { id: c.id, ...v }); sukses('Interaksi dicatat.'); muat(); }); }
  const cari = h('input', { class: 'input', type: 'search', placeholder: 'Cari nama, email, atau nomor', 'aria-label': 'Cari kontak', oninput: debounce((e) => { q = e.target.value.trim(); hal = 1; muat(); }, 350) });
  const aksi = [];
  if (punya('SUPER_ADMIN', 'ADMIN_OPS')) { aksi.push(tombol('Sinkron dari data toko', async (b) => { await tahan(b, async () => { const r = await panggil('crmSinkron'); sukses(`${r.baru} kontak baru, ${r.diperbarui} diperbarui.`); muat(); }); }, 'ghost', 'refresh'), tombol('Cek nomor WA', async (b) => { await tahan(b, async () => { const r = await panggil('waCek', {}); sukses(`${r.dicek || 0} nomor dicek.`); muat(); }); }, 'ghost', 'phone')); }
  aksi.push(tombol('Ekspor CSV', async (b) => { await tahan(b, async () => { const r = await panggil('crmEkspor', { filter: { q, segmen } }); simpanTeks(r.nama, r.csv); sukses(r.jumlah + ' kontak diekspor.'); }); }, 'ghost', 'download'));
  ctx.setJudul('CRM kontak', '', { noindex: true });
  ganti(ctx.wadah, kepalaHalaman('CRM kontak', 'Nama, email, dan WhatsApp semua pembeli, penjual, dan staf dalam satu daftar.', ...aksi), h('div', { class: 'kolom', style: { marginBottom: '12px' } }, cari, chip), daftar); await muat();
}

/* ================= DOKUMEN & TEMPLATE ================= */
export async function dokumen(ctx) {
  ctx.setJudul('Dokumen & template', '', { noindex: true });
  const t = tab([{ k: 'terbit', t: 'Dokumen terbit', isi: () => panelDokumen() }, { k: 'template', t: 'Template', isi: () => panelTemplat() }], 'terbit');
  ganti(ctx.wadah, kepalaHalaman('Dokumen & template', 'Faktur, invoice, laporan, dan surat yang terbit ber-QR. Kelola templat dan tarik dokumen bermasalah.'), t.el);

  function panelDokumen() {
    let q = '', st = ''; const w = h('div'), hasil = h('div'), chip = h('div');
    const muat = async () => { ganti(hasil, skeleton(3, 40)); try { const r = await panggil('adminDokumenDaftar', { q, status: st });
      ganti(hasil, h('p', { class: 'redup' }, `${angka(r.total)} dokumen (100 terbaru)`), tabel([{ judul: 'Nomor', tampil: d => h('div', null, h('b', null, d.nomor), h('div', { class: 'redup' }, d.nama)) }, { judul: 'Referensi', k: 'ref' }, { judul: 'Kode verifikasi', tampil: d => h('code', null, d.kode) }, { judul: 'Status', tampil: d => h('span', { class: 'status ' + (d.status === 'Terbit' ? 'ok' : 'gagal') }, d.status) }, { judul: 'Dibuat', tampil: d => rel(d.dibuat) },
        { judul: '', aksi: true, tampil: d => d.status === 'Terbit' ? tombol('Tarik', async (b) => { const a = await tanya({ judul: 'Tarik dokumen ' + d.nomor, label: 'Alasan penarikan', area: true, ya: 'Tarik dokumen', bantu: 'Dokumen yang ditarik ditandai tidak sah saat dipindai.' }); if (a === null) return; await tahan(b, async () => { await panggil('adminDokumenTarik', { id: d.id, alasan: a }); sukses('Dokumen ditarik.'); muat(); }); }, 'ghost sm') : '' }], r.item, { kosongTeks: 'Belum ada dokumen terbit.', caption: 'Dokumen' })); } catch (e) { ganti(hasil, kotakGalat(e, muat)); } };
    const gc = () => ganti(chip, pilihChip([{ k: '', t: 'Semua' }, { k: 'Terbit', t: 'Terbit' }, { k: 'Ditarik', t: 'Ditarik' }], st, (k) => { st = k; gc(); muat(); })); gc();
    ganti(w, h('div', { class: 'baris', style: { gap: '8px', flexWrap: 'wrap', marginBottom: '12px' } }, h('input', { class: 'input', type: 'search', placeholder: 'Cari nomor, referensi, atau kode', 'aria-label': 'Cari dokumen', oninput: debounce((e) => { q = e.target.value.trim(); muat(); }, 350) }), chip), hasil); muat(); return w;
  }
  function panelTemplat() {
    const w = h('div'); (async () => {
      ganti(w, skeleton(2, 80));
      try {
        const r = await panggil('adminTemplatDokDaftar');
        ganti(w, h('div', { class: 'kolom' }, h('div', { class: 'info-kotak' }, 'Template memakai HTML dengan penanda {{KUNCI}}. Ubah tampilan (logo, warna, susunan) tanpa menyentuh kode. Versi naik otomatis, dokumen lama tidak berubah.'),
          r.map(x => h('article', { class: 'kartu' }, h('div', { class: 'sebar', style: { flexWrap: 'wrap', gap: '8px' } }, h('div', null, h('b', null, x.nama), h('div', { class: 'redup' }, `${x.kode} · versi ${x.versi}` + (x.diubah ? ' · telah disesuaikan' : ' · bawaan'))), tombol('Sunting', () => sunting(x), 'sm', 'edit'))))));
      } catch (e) { ganti(w, kotakGalat(e)); }
    })(); return w;
    function sunting(x) {
      const isi = h('textarea', { class: 'input', id: 'tpl', rows: 16, spellcheck: false, 'aria-label': 'HTML templat', style: { fontFamily: 'ui-monospace, monospace', fontSize: '13px' } }, x.isi);
      const m = modal({ judul: 'Sunting: ' + x.nama, lebar: true, isi: h('div', { class: 'kolom' }, h('div', { class: 'redup' }, 'Penanda tersedia: ', x.placeholder.map(p => h('code', { style: { marginRight: '6px' } }, '{{' + p + '}}'))), isi),
        kaki: h('div', { class: 'baris', style: { gap: '8px', flexWrap: 'wrap' } }, tombol('Pratinjau', async (b) => { await tahan(b, async () => { const r = await panggil('adminTemplatDokPratinjau', { kode: x.kode, isi: isi.value }); const fr = h('iframe', { sandbox: '', srcdoc: r.html, title: 'Pratinjau dokumen', style: { width: '100%', height: '60dvh', border: '1px solid var(--garis)', borderRadius: '8px', background: '#fff' } }); modal({ judul: 'Pratinjau (data contoh)', lebar: true, isi: fr }); }); }, 'ghost', 'eye'),
          tombol('Simpan', async (b) => { await tahan(b, async () => { const r = await panggil('adminTemplatDokSimpan', { kode: x.kode, isi: isi.value }); sukses('Template disimpan (versi ' + r.versi + ').'); m.tutup(); dokumen(ctx); }); }, '', 'check'),
          tombol('Kembalikan ke bawaan', async (b) => { if (!(await konfirmasi({ judul: 'Kembalikan template bawaan?', pesan: 'Perubahan Anda ditimpa.', ya: 'Kembalikan', bahaya: true }))) return; await tahan(b, async () => { await panggil('adminTemplatDokReset', { kode: x.kode }); sukses('Template dikembalikan.'); m.tutup(); dokumen(ctx); }); }, 'ghost')) });
    }
  }
}
