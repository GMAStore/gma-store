// Portal penjual: dasbor, produk, pesanan, ulasan, dompet, laporan, penalti, pengaturan toko, studio AI, pendaftaran.
import { h, ikon, ganti, rp, angka, tgl, rel, gambar, bintang, svgAman, salin } from '../lib/dom.js';
import { panggil, unggahBerkas, swr } from '../lib/api.js';
import { state, atur } from '../lib/store.js';
import { href, navigasi } from '../lib/router.js';
import { kosong, kotakGalat, skeleton, tahan, laporGalat, ok as sukses, gagal, konfirmasi, tanya, modal, formulir, status, kv, kartuStat, kepalaHalaman, pilihChip, tab, paginasi, tabel } from '../lib/ui.js';
import { tautan, kodeSalin } from '../lib/komponen.js';
import { muatSesi } from '../lib/sesi.js';
import { unduhDokumen } from './pembeli.js';

const halaman = (ctx, judul, sub, aksi, isiFn) => {
  ctx.setJudul(judul, '', { noindex: true }); const isi = h('div');
  ganti(ctx.wadah, kepalaHalaman(judul, sub, ...(aksi || [])), isi);
  const jalan = async () => { ganti(isi, skeleton(3, 90)); try { await isiFn(isi, jalan); } catch (e) { ganti(isi, kotakGalat(e, jalan)); } };
  return jalan();
};
const KEL_PROD = { Aktif: 'ok', Draf: 'proses', Menunggu: 'tunggu', Ditolak: 'gagal', Nonaktif: 'proses' };

/* ================= DASBOR ================= */
export async function dasbor(ctx) {
  await halaman(ctx, 'Dasbor penjual', 'Ringkasan toko Anda hari ini.', null, async (isi) => {
    const [t, p, prod, d] = await Promise.all([panggil('tokoSaya'), panggil('penjualPesanan', {}), panggil('produkSaya', {}), panggil('dompetSaya')]);
    const perlu = p.item.filter(s => ['Dibayar', 'Diproses', 'Siap Kirim'].includes(s.status));
    const wd = d.penjual || { saldo: 0, ditahan: 0 };
    const stokTipis = prod.filter(x => x.status === 'Aktif' && x.stok <= 5);
    ganti(isi,
      t.toko.status !== 'Aktif' ? h('div', { class: 'peringatan-kotak', style: { marginBottom: '12px' } }, 'Toko Anda berstatus ', h('b', null, t.penjual.status), '. ', t.penjual.catatan || 'Menunggu verifikasi admin. Anda tetap bisa menyiapkan produk.') : null,
      t.penjual.statusAkun !== 'Aktif' ? h('div', { class: 'galat-kotak', style: { marginBottom: '12px' } }, 'Status akun toko: ', h('b', null, t.penjual.statusAkun), '. ', tautan('/penjual/penalti', null, 'Lihat penalti & banding')) : null,
      h('div', { class: 'grid g-4 res' }, kartuStat('Perlu diproses', angka(perlu.length), 'package'), kartuStat('Saldo tersedia', rp(wd.saldo), 'wallet'), kartuStat('Dana tertahan', rp(wd.ditahan), 'lock'), kartuStat('Skor amanah', t.penjual.skorAmanah + '/100', 'shield', t.penjual.poin + ' poin penalti')),
      h('div', { class: 'dua-kolom', style: { marginTop: '16px' } },
        h('section', { class: 'kartu' }, h('div', { class: 'kartu-judul' }, h('h3', null, 'Pesanan perlu tindakan'), tautan('/penjual/pesanan', 'btn ghost sm', 'Semua')), perlu.length ? perlu.slice(0, 6).map(s => h('div', { class: 'sebar', style: { padding: '8px 0', borderBottom: '1px solid var(--garis)' } }, h('div', null, h('div', { class: 'tebal' }, s.invoice), h('small', null, s.item.length + ' barang · ' + rp(s.subtotal))), status(s.status))) : h('p', { class: 'redup' }, 'Tidak ada pesanan yang menunggu. 🎉')),
        h('section', { class: 'kartu' }, h('div', { class: 'kartu-judul' }, h('h3', null, 'Stok menipis'), tautan('/penjual/produk', 'btn ghost sm', 'Produk')), stokTipis.length ? stokTipis.slice(0, 6).map(x => h('div', { class: 'sebar', style: { padding: '8px 0' } }, h('span', { class: 'klem-2' }, x.nama), h('b', { class: 'galat-teks' }, 'Sisa ' + x.stok))) : h('p', { class: 'redup' }, 'Semua stok aman.'))),
      h('div', { class: 'baris', style: { marginTop: '16px' } }, tautan('/penjual/produk/baru', 'btn', ikon('plus'), 'Tambah produk'), tautan('/penjual/live', 'btn hangat', ikon('video'), 'Jadwalkan live'), tautan('/penjual/studio-ai', 'btn sekunder', ikon('sparkles'), 'Studio AI'), h('a', { class: 'btn ghost', href: href('/toko/' + t.toko.slug) }, 'Lihat etalase toko')));
  });
}

/* ================= PRODUK ================= */
export async function produk(ctx) {
  let f = ''; const daftar = h('div');
  const chip = h('div'); const gc = () => ganti(chip, pilihChip([{ k: '', t: 'Semua' }, { k: 'Aktif', t: 'Aktif' }, { k: 'Draf', t: 'Draf' }, { k: 'Menunggu', t: 'Ditinjau' }, { k: 'Ditolak', t: 'Ditolak' }, { k: 'Nonaktif', t: 'Nonaktif' }], f, (k) => { f = k; gc(); muat(); }));
  ctx.setJudul('Produk saya', '', { noindex: true });
  ganti(ctx.wadah, kepalaHalaman('Produk saya', 'Kelola etalase, harga, dan stok.', tautan('/penjual/produk/baru', 'btn', ikon('plus'), 'Tambah produk')), chip, h('div', { style: { marginTop: '12px' } }, daftar));
  async function muat() {
    ganti(daftar, skeleton(3, 80));
    try {
      const l = await panggil('produkSaya', { status: f || undefined });
      ganti(daftar, l.length ? h('div', { class: 'kolom' }, l.map(x => h('div', { class: 'kartu baris', style: { flexWrap: 'nowrap' } }, gambar(x.foto, x.nama, '', 64), h('div', { class: 'isi' }, h('div', { class: 'tebal klem-2' }, x.nama), h('small', null, rp(x.harga) + ' · stok ' + x.stok + ' · terjual ' + x.terjual), x.alasan ? h('div', { class: 'galat-teks' }, x.alasan) : null), status(x.status),
        h('div', { class: 'baris-rapat' }, tautan('/penjual/produk/' + x.id, 'btn sekunder sm', ikon('edit'), 'Ubah'),
          ['Draf', 'Ditolak', 'Nonaktif'].includes(x.status) ? h('button', { class: 'btn sm', type: 'button', onclick: (e) => tahan(e.currentTarget, async () => { const r = await panggil('produkPublikasi', { id: x.id }); sukses('Status: ' + r.status + (r.alasan ? ' — ' + r.alasan : '')); muat(); }) }, 'Tayangkan') : null,
          x.status === 'Aktif' ? h('button', { class: 'btn ghost sm', type: 'button', onclick: (e) => tahan(e.currentTarget, async () => { await panggil('produkNonaktif', { id: x.id }); muat(); }) }, 'Nonaktifkan') : null)))) : kosong('Belum ada produk', 'Tambahkan produk pertama Anda.', tautan('/penjual/produk/baru', 'btn', 'Tambah produk'), 'box'));
    } catch (e) { ganti(daftar, kotakGalat(e, muat)); }
  }
  gc(); await muat();
}

export async function produkForm(ctx) {
  const id = ctx.params.id && ctx.params.id !== 'baru' ? ctx.params.id : '';
  ctx.setJudul(id ? 'Ubah produk' : 'Produk baru', '', { noindex: true });
  const isi = h('div'); ganti(ctx.wadah, kepalaHalaman(id ? 'Ubah produk' : 'Produk baru', 'Foto jelas dan deskripsi lengkap meningkatkan penjualan.'), isi); ganti(isi, skeleton(3, 120));
  let kat = [], awal = null;
  try { kat = await panggil('katalogKategori'); if (id) awal = await panggil('produkDetailSaya', { id }); } catch (e) { ganti(isi, kotakGalat(e, () => produkForm(ctx))); return; }
  const p = awal ? awal.produk : { nama: '', kategoriId: '', deskripsi: '', foto: [], beratGram: 300 };
  const foto = (p.foto || []).slice(); const fotoEl = h('div', { class: 'baris', style: { flexWrap: 'wrap' } });
  const gf = () => ganti(fotoEl, foto.map((u, i) => h('div', { style: { position: 'relative' } }, gambar(u, 'Foto ' + (i + 1), '', 84), h('button', { class: 'tombol-ikon', type: 'button', 'aria-label': 'Hapus foto ' + (i + 1), style: { position: 'absolute', top: 0, right: 0, background: 'var(--kartu)' }, onclick: () => { foto.splice(i, 1); gf(); } }, ikon('x')))), foto.length < 8 ? h('label', { class: 'btn sekunder', style: { height: '84px', width: '84px', display: 'grid', placeItems: 'center', cursor: 'pointer' } }, ikon('camera'), h('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp', multiple: true, hidden: true, onchange: async (e) => { for (const fl of Array.from(e.target.files).slice(0, 8 - foto.length)) { try { const r = await unggahBerkas(fl, 'produk'); foto.push(r.url); gf(); } catch (x) { laporGalat(x); } } e.target.value = ''; } })) : null);
  gf();
  const varian = (awal ? awal.varian : [{ nama: 'Standar', harga: '', stok: '' }]).map(v => ({ ...v })); const grosir = (awal ? awal.grosir : []).map(g => ({ ...g }));
  const varEl = h('div', { class: 'kolom' }); const grosirEl = h('div', { class: 'kolom' });
  const gv = () => { ganti(varEl, varian.map((v, i) => h('div', { class: 'baris', style: { flexWrap: 'nowrap', alignItems: 'end' } }, h('div', { class: 'field isi' }, h('label', null, 'Nama varian'), h('input', { class: 'input', value: v.nama, maxlength: 60, oninput: (e) => { v.nama = e.target.value; gg(); } })), h('div', { class: 'field' }, h('label', null, 'Harga (Rp)'), h('input', { class: 'input', type: 'number', min: 100, value: v.harga, inputmode: 'numeric', oninput: (e) => { v.harga = e.target.value; } })), h('div', { class: 'field' }, h('label', null, 'Stok'), h('input', { class: 'input', type: 'number', min: 0, value: v.stok, inputmode: 'numeric', oninput: (e) => { v.stok = e.target.value; } })), varian.length > 1 ? h('button', { class: 'tombol-ikon', type: 'button', 'aria-label': 'Hapus varian', onclick: () => { varian.splice(i, 1); gv(); gg(); } }, ikon('trash')) : null)), h('button', { class: 'btn sekunder sm', type: 'button', style: { alignSelf: 'start' }, onclick: () => { varian.push({ nama: '', harga: varian[0] ? varian[0].harga : '', stok: '' }); gv(); gg(); } }, ikon('plus'), 'Tambah varian')); };
  const gg = () => { ganti(grosirEl, grosir.map((g, i) => h('div', { class: 'baris', style: { flexWrap: 'nowrap', alignItems: 'end' } }, h('div', { class: 'field isi' }, h('label', null, 'Varian'), h('select', { class: 'select', onchange: (e) => { g.varianIdx = Number(e.target.value); delete g.varianId; } }, varian.map((v, j) => h('option', { value: j, selected: g.varianId ? g.varianId === v.id : g.varianIdx === j }, v.nama || 'Varian ' + (j + 1))))), h('div', { class: 'field' }, h('label', null, 'Min. qty'), h('input', { class: 'input', type: 'number', min: 2, value: g.minQty, oninput: (e) => { g.minQty = e.target.value; } })), h('div', { class: 'field' }, h('label', null, 'Harga/pcs'), h('input', { class: 'input', type: 'number', min: 100, value: g.harga, oninput: (e) => { g.harga = e.target.value; } })), h('button', { class: 'tombol-ikon', type: 'button', 'aria-label': 'Hapus tingkat', onclick: () => { grosir.splice(i, 1); gg(); } }, ikon('trash')))), h('button', { class: 'btn sekunder sm', type: 'button', style: { alignSelf: 'start' }, onclick: () => { grosir.push({ varianIdx: 0, minQty: 5, harga: '' }); gg(); } }, ikon('plus'), 'Tambah harga grosir')); };
  gv(); gg();
  const opsiKat = kat.filter(k => k.parent).length ? kat.filter(k => k.parent).map(k => ({ v: k.id, t: (kat.find(x => x.id === k.parent) || {}).nama + ' › ' + k.nama })) : kat.map(k => ({ v: k.id, t: k.nama }));
  const f = formulir([{ k: 'nama', label: 'Nama produk', tipe: 'text', wajib: true, minPanjang: 5, maks: 120 }, { k: 'kategoriId', label: 'Kategori', tipe: 'select', wajib: true, opsi: opsiKat }, { k: 'deskripsi', label: 'Deskripsi', tipe: 'textarea', baris: 6, bantu: 'Tulis bahan, ukuran, cara pakai. Tips: pakai Studio AI untuk draf deskripsi.' }, { k: 'beratGram', label: 'Berat per pcs (gram)', tipe: 'number', min: 1, wajib: true, bantu: 'Dipakai menghitung ongkir.' }],
    { nama: p.nama, kategoriId: p.kategoriId, deskripsi: p.deskripsi, beratGram: p.beratGram },
    { label: id ? 'Simpan perubahan' : 'Simpan sebagai draf', kirim: async (v) => {
      if (!foto.length) throw new Error('Tambahkan minimal 1 foto produk.');
      const vs = varian.map(x => ({ id: x.id, nama: x.nama || 'Standar', harga: Number(x.harga), stok: Number(x.stok || 0) })); if (vs.some(x => !(x.harga >= 100))) throw new Error('Isi harga tiap varian (minimal Rp100).');
      const r = await panggil('produkSimpan', { id: id || undefined, nama: v.nama, kategoriId: v.kategoriId, deskripsi: v.deskripsi, beratGram: v.beratGram, foto, varian: vs, grosir: grosir.filter(g => g.harga && g.minQty).map(g => ({ varianId: g.varianId && varian[g.varianIdx] === undefined ? g.varianId : undefined, varianIdx: g.varianIdx !== undefined ? g.varianIdx : undefined, varianId2: undefined, minQty: Number(g.minQty), harga: Number(g.harga) })) });
      sukses('Produk disimpan (' + r.status + ').'); navigasi(href('/penjual/produk'));
    } });
  f.tombol.style.display = 'none';
  ganti(isi, h('div', { class: 'kolom', style: { maxWidth: '760px' } }, h('section', { class: 'kartu' }, h('h3', null, 'Foto (maks 8)'), fotoEl, h('small', { class: 'redup' }, 'Foto pertama jadi sampul. Format JPG/PNG/WebP.')), h('section', { class: 'kartu' }, h('h3', null, 'Informasi produk'), f.el), h('section', { class: 'kartu' }, h('h3', null, 'Varian, harga & stok'), varEl), h('section', { class: 'kartu' }, h('h3', null, 'Harga grosir (opsional)'), grosirEl), p.alasan ? h('div', { class: 'galat-kotak' }, 'Catatan moderasi: ', p.alasan) : null, h('div', { class: 'baris' }, h('button', { class: 'btn lg', type: 'button', onclick: () => f.el.requestSubmit() }, id ? 'Simpan perubahan' : 'Simpan sebagai draf'), tautan('/penjual/produk', 'btn ghost', 'Batal'))));
}

/* ================= PESANAN ================= */
export async function pesanan(ctx) {
  let f = ''; const daftar = h('div'); const nav = h('div'); const chip = h('div'); const retur = h('div'); let hal = 1;
  ctx.setJudul('Pesanan masuk', '', { noindex: true });
  ganti(ctx.wadah, kepalaHalaman('Pesanan masuk', 'Proses, kemas, lalu kirim dengan nomor resi sebelum batas waktu agar skor amanah terjaga.'), retur, chip, h('div', { style: { marginTop: '12px' } }, daftar, nav));
  const gc = () => ganti(chip, pilihChip([{ k: '', t: 'Semua' }, { k: 'Dibayar', t: 'Baru dibayar' }, { k: 'Diproses', t: 'Diproses' }, { k: 'Siap Kirim', t: 'Siap kirim' }, { k: 'Dikirim', t: 'Dikirim' }, { k: 'Selesai', t: 'Selesai' }], f, (k) => { f = k; hal = 1; gc(); muat(); }));
  async function muatRetur() { try { const n = await panggil('notifDaftar', {}, { diam: true }); const r = n.item.filter(x => x.tipe === 'RETUR_DIAJUKAN' && !x.dibaca); ganti(retur, r.length ? h('div', { class: 'peringatan-kotak', style: { marginBottom: '12px' } }, h('b', null, r.length + ' pengajuan retur menunggu tanggapan'), r.map(x => h('div', { class: 'sebar', style: { padding: '6px 0' } }, h('span', null, x.isi), h('button', { class: 'btn sm', type: 'button', onclick: () => tanggapiRetur(x) }, 'Tanggapi')))) : ''); } catch (e) { /* abaikan */ } }
  function tanggapiRetur(n) {
    const f2 = formulir([{ k: 'catatan', label: 'Catatan untuk pembeli', tipe: 'textarea', baris: 3, bantu: 'Wajib diisi jika menolak. Penolakan akan dibawa ke mediasi admin.' }], {}, { label: 'Setujui retur', kirim: async (v) => { await panggil('returTanggapi', { returId: n.ref, setuju: true, catatan: v.catatan }); await panggil('notifBaca', { ids: [n.id] }); m.tutup(); sukses('Retur disetujui.'); muatRetur(); } });
    const tolak = h('button', { class: 'btn ghost', type: 'button', style: { color: 'var(--bahaya)' }, onclick: async () => { const c = f2.nilai().catatan; if (!c || c.length < 5) return gagal('Tulis alasan penolakan.'); try { await panggil('returTanggapi', { returId: n.ref, setuju: false, catatan: c }); await panggil('notifBaca', { ids: [n.id] }); m.tutup(); sukses('Retur ditolak dan dibawa ke mediasi admin.'); muatRetur(); } catch (e) { laporGalat(e); } } }, 'Tolak (ke mediasi)');
    const m = modal({ judul: 'Tanggapi retur', isi: h('div', null, h('p', null, n.isi), f2.el, tolak) });
  }
  async function aksi(s, nama, data, pesan) { await panggil(nama, { subId: s.subId, ...data }); sukses(pesan); muat(); }
  async function muat() {
    ganti(daftar, skeleton(3, 130));
    try {
      const r = await panggil('penjualPesanan', { status: f || undefined, hal });
      ganti(daftar, r.item.length ? r.item.map(s => h('div', { class: 'kartu', style: { marginBottom: '12px' } },
        h('div', { class: 'sebar' }, h('div', null, h('div', { class: 'tebal' }, s.invoice), h('small', null, s.alamat.penerima + ' · ' + s.alamat.kota + ' · ' + s.metode)), status(s.status)),
        s.item.map(i => h('div', { class: 'baris', style: { flexWrap: 'nowrap', padding: '6px 0' } }, gambar(i.foto, i.nama, '', 48), h('div', { class: 'isi' }, h('div', { class: 'klem-2' }, i.nama), h('small', null, (i.varian !== 'Standar' ? i.varian + ' · ' : '') + i.qty + ' × ' + rp(i.harga))))),
        kv([['Kurir', s.kurir], ['Subtotal', rp(s.subtotal)], ['Diterima penjual (bersih)', rp(s.netPenjual)], s.resi ? ['Resi', h('span', null, h('b', null, s.resi), ' ', kodeSalin(s.resi))] : null, s.batasKirim && ['Dibayar', 'Diproses', 'Siap Kirim'].includes(s.status) ? ['Kirim paling lambat', tgl(s.batasKirim, true)] : null].filter(Boolean)),
        s.catatan ? h('div', { class: 'info-kotak' }, 'Catatan pembeli: ' + s.catatan) : null,
        h('div', { class: 'baris', style: { marginTop: '10px' } },
          s.status === 'Dibayar' ? h('button', { class: 'btn', type: 'button', onclick: (e) => tahan(e.currentTarget, () => aksi(s, 'penjualProses', {}, 'Pesanan diproses.')) }, 'Proses pesanan') : null,
          s.status === 'Diproses' ? h('button', { class: 'btn', type: 'button', onclick: (e) => tahan(e.currentTarget, () => aksi(s, 'penjualSiapKirim', {}, 'Ditandai siap kirim.')) }, 'Siap kirim') : null,
          ['Diproses', 'Siap Kirim'].includes(s.status) ? [h('button', { class: 'btn hangat', type: 'button', onclick: async () => { const resi = await tanya({ judul: 'Nomor resi ' + s.kurir, label: 'Nomor resi', ya: 'Kirim', bantu: 'Huruf/angka, 5–40 karakter.' }); if (resi) { try { await aksi(s, 'penjualKirim', { resi }, 'Resi tersimpan. Pembeli diberi tahu.'); } catch (e) { laporGalat(e); } } } }, ikon('truck'), 'Kirim & isi resi'), h('button', { class: 'btn sekunder', type: 'button', onclick: (e) => unduhDokumen('LABEL', s.subId, e.currentTarget) }, ikon('download'), 'Label')] : null,
          ['Dibayar', 'Diproses', 'Siap Kirim'].includes(s.status) ? h('button', { class: 'btn ghost', type: 'button', style: { color: 'var(--bahaya)' }, onclick: async () => { const alasan = await tanya({ judul: 'Batalkan pesanan?', label: 'Alasan pembatalan', area: true, ya: 'Batalkan', bantu: 'Pembatalan sepihak menambah poin penalti toko.' }); if (alasan) { try { await aksi(s, 'penjualBatalkan', { alasan }, 'Pesanan dibatalkan.'); } catch (e) { laporGalat(e); } } } }, 'Batalkan') : null,
          h('button', { class: 'btn ghost sm', type: 'button', onclick: (e) => unduhDokumen('INVOICE', s.subId, e.currentTarget) }, 'Invoice')))) : kosong('Belum ada pesanan', 'Pesanan yang sudah dibayar pembeli muncul di sini.', null, 'package'));
      ganti(nav, paginasi(r, (p) => { hal = p; muat(); }));
    } catch (e) { ganti(daftar, kotakGalat(e, muat)); }
  }
  gc(); muatRetur(); await muat();
}

/* ================= ULASAN ================= */
export async function ulasan(ctx) {
  await halaman(ctx, 'Ulasan pembeli', 'Balas ulasan dengan sopan — balasan Anda tampil publik.', null, async (isi, ulang) => {
    const l = await panggil('ulasanToko', {});
    ganti(isi, l.length ? l.map(u => h('div', { class: 'kartu', style: { marginBottom: '10px' } }, h('div', { class: 'sebar' }, bintang(u.rating), h('small', null, tgl(u.waktu))), h('div', { class: 'tebal' }, u.produk), h('p', { style: { margin: '6px 0' } }, u.isi), u.balasan ? h('div', { class: 'info-kotak' }, h('b', null, 'Balasan Anda: '), u.balasan) : u.status === 'Tampil' ? h('button', { class: 'btn sekunder sm', type: 'button', onclick: () => balas(u, ulang) }, ikon('message'), 'Balas') : null)) : kosong('Belum ada ulasan', '', null, 'star'));
  });
  function balas(u, ulang) {
    const area = h('textarea', { class: 'textarea', id: 'balas-isi', rows: 4, maxlength: 500, 'aria-label': 'Balasan' });
    const bAi = h('button', { class: 'btn sekunder sm', type: 'button', onclick: (e) => tahan(e.currentTarget, async () => { const r = await panggil('aiBalasUlasan', { teks: u.isi, bintang: u.rating, nama: (u.nama || '').split(' ')[0] }); area.value = r.balasan; sukses(r.catatan); }) }, ikon('sparkles'), 'Bantu tulis dengan AI');
    const m = modal({ judul: 'Balas ulasan', isi: h('div', { class: 'kolom' }, h('div', { class: 'info-kotak' }, u.isi), area, bAi), kaki: h('button', { class: 'btn', type: 'button', onclick: (e) => tahan(e.currentTarget, async () => { await panggil('ulasanBalas', { ulasanId: u.id, balasan: area.value }); m.tutup(); sukses('Balasan terkirim.'); ulang(); }) }, 'Kirim balasan') });
  }
}

/* ================= DOMPET ================= */
export async function dompet(ctx) {
  await halaman(ctx, 'Dompet & tarik dana', 'Dana pesanan masuk setelah pembeli menerima barang.', null, async (isi, ulang) => {
    const [d, wd, t] = await Promise.all([panggil('dompetSaya'), panggil('penarikanSaya'), panggil('tokoSaya')]);
    const w = d.penjual || { saldo: 0, ditahan: 0, mutasi: [] };
    const bTarik = h('button', { class: 'btn hangat', type: 'button', onclick: () => formTarik(t, w, ulang) }, ikon('wallet'), 'Tarik dana');
    ganti(isi, h('div', { class: 'grid g-3 res' }, kartuStat('Saldo tersedia', rp(w.saldo), 'wallet'), kartuStat('Dana tertahan (escrow)', rp(w.ditahan), 'lock'), h('div', { class: 'kartu stat' }, h('span', { class: 'label' }, 'Rekening pencairan'), h('div', { class: 'tebal' }, t.penjual.rekening.bank + ' ' + t.penjual.rekening.noRek), h('small', null, t.penjual.rekening.atasNama))), h('div', { style: { margin: '12px 0' } }, bTarik),
      h('div', { class: 'dua-kolom' }, h('section', { class: 'kartu' }, h('h3', null, 'Riwayat penarikan'), wd.length ? wd.map(x => h('div', { class: 'sebar', style: { padding: '8px 0', borderBottom: '1px solid var(--garis)' } }, h('div', null, h('div', { class: 'tebal' }, rp(x.jumlah)), h('small', null, tgl(x.dibuat, true) + ' · biaya ' + rp(x.biaya))), status(x.status))) : h('p', { class: 'redup' }, 'Belum ada penarikan.')),
        h('section', { class: 'kartu' }, h('h3', null, 'Mutasi terakhir'), w.mutasi.length ? w.mutasi.map(m => h('div', { class: 'sebar', style: { padding: '8px 0', borderBottom: '1px solid var(--garis)' } }, h('div', null, h('div', null, m.ket || m.tipe), h('small', null, tgl(m.waktu, true))), h('b', { style: { color: m.jumlah >= 0 ? 'var(--segar)' : 'var(--bahaya)' } }, (m.jumlah >= 0 ? '+' : '') + rp(m.jumlah)))) : h('p', { class: 'redup' }, 'Belum ada mutasi.'))));
  });
  function formTarik(t, w, ulang) {
    const f = formulir([{ k: 'jumlah', label: 'Jumlah penarikan (Rp)', tipe: 'number', min: 1, wajib: true, bantu: 'Saldo tersedia ' + rp(w.saldo) + '. Biaya penarikan dipotong dari jumlah.' }, { k: 'pin', label: 'PIN (wajib untuk penarikan besar)', tipe: 'password', mode: 'numeric', maks: 6 }], {}, { label: 'Ajukan penarikan', kirim: async (v) => { const r = await panggil('penarikanAjukan', { jumlah: v.jumlah, pin: v.pin || undefined }); m.tutup(); sukses('Diajukan. Diterima ' + rp(r.diterima) + ' setelah biaya ' + rp(r.biaya) + '.'); ulang(); } });
    const m = modal({ judul: 'Tarik dana ke ' + t.penjual.rekening.bank, isi: f.el });
  }
}

/* ================= LAPORAN ================= */
export async function laporan(ctx) {
  await halaman(ctx, 'Laporan & dokumen', 'Ringkasan penjualan dan dokumen resmi per bulan.', null, async (isi) => {
    const t = await panggil('tokoSaya'); const sekarang = new Date(); const bulan = [];
    for (let i = 0; i < 6; i++) { const d = new Date(sekarang.getFullYear(), sekarang.getMonth() - i, 1); bulan.push(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')); }
    ganti(isi, h('section', { class: 'kartu' }, h('h3', null, 'Dokumen bulanan'), h('p', { class: 'redup' }, 'Laporan penjualan dan faktur komisi platform dibuat dari pesanan selesai pada bulan tersebut.'), bulan.map(b => h('div', { class: 'sebar', style: { padding: '8px 0', borderBottom: '1px solid var(--garis)' } }, h('b', null, b), h('div', { class: 'baris-rapat' }, h('button', { class: 'btn sekunder sm', type: 'button', onclick: (e) => unduhDokumen('LAPORAN_PENJUALAN', 'TOKO:' + t.toko.id + ':' + b, e.currentTarget) }, ikon('download'), 'Laporan penjualan'), h('button', { class: 'btn sekunder sm', type: 'button', onclick: (e) => unduhDokumen('FAKTUR_KOMISI', 'TOKO:' + t.toko.id + ':' + b, e.currentTarget) }, ikon('download'), 'Faktur komisi'))))));
  });
}

/* ================= PENALTI & BANDING ================= */
export async function penalti(ctx) {
  await halaman(ctx, 'Skor amanah & penalti', 'Jaga skor dengan mengirim tepat waktu dan melayani pembeli dengan baik.', null, async (isi, ulang) => {
    const [p, b] = await Promise.all([panggil('penaltiSaya'), panggil('bandingSaya')]);
    const tombol = p.status !== 'Aktif' && p.status !== 'Diblokir' ? h('button', { class: 'btn', type: 'button', onclick: () => formBanding(ulang) }, 'Ajukan banding') : null;
    ganti(isi, h('div', { class: 'grid g-3 res' }, kartuStat('Skor amanah', p.skor + '/100', 'shield'), kartuStat('Poin penalti aktif', p.poin, 'alert', 'Peringatan ' + p.ambang.p1 + ' · ' + p.ambang.p2 + ' · beku ' + p.ambang.beku), kartuStat('Status akun', p.status, 'info')), tombol ? h('div', { style: { margin: '12px 0' } }, tombol) : null,
      h('div', { class: 'dua-kolom', style: { marginTop: '12px' } }, h('section', { class: 'kartu' }, h('h3', null, 'Peristiwa penalti'), p.peristiwa.length ? p.peristiwa.map(e => h('div', { class: 'sebar', style: { padding: '8px 0', borderBottom: '1px solid var(--garis)' } }, h('div', null, h('div', { class: 'tebal' }, e.nama), h('small', null, tgl(e.dibuat) + (e.aktif ? ' · berlaku s/d ' + tgl(e.kedaluwarsa) : ' · kedaluwarsa'))), h('b', null, '+' + e.poin))) : h('p', { class: 'redup' }, 'Belum ada penalti. Pertahankan!')),
        h('section', { class: 'kartu' }, h('h3', null, 'Tindakan & banding'), p.tindakan.map(a => h('div', { class: 'info-kotak', style: { marginBottom: '6px' } }, h('b', null, a.jenis), ' — ', a.alasan, h('small', { style: { display: 'block' } }, tgl(a.dibuat)))), b.map(x => h('div', { class: 'kartu', style: { marginTop: '8px' } }, h('div', { class: 'sebar' }, h('small', null, tgl(x.dibuat)), status(x.status)), h('p', { style: { margin: '4px 0' } }, x.isi), x.balasan ? h('div', { class: 'info-kotak' }, h('b', null, 'Balasan admin: '), x.balasan) : null)), !p.tindakan.length && !b.length ? h('p', { class: 'redup' }, 'Tidak ada.') : null)));
  });
  function formBanding(ulang) { const f = formulir([{ k: 'isi', label: 'Alasan banding', tipe: 'textarea', baris: 5, wajib: true, minPanjang: 20, bantu: 'Jelaskan kronologi dan perbaikan yang sudah dilakukan.' }], {}, { label: 'Kirim banding', kirim: async (v) => { const r = await panggil('bandingAjukan', { isi: v.isi }); m.tutup(); sukses(r.janji); ulang(); } }); const m = modal({ judul: 'Ajukan banding', isi: f.el }); }
}

/* ================= PENGATURAN TOKO ================= */
export async function tokoPengaturan(ctx) {
  await halaman(ctx, 'Pengaturan toko', 'Profil etalase, kurir, dan rekening pencairan.', null, async (isi, ulang) => {
    const t = await panggil('tokoSaya');
    const k = t.toko; const semuaKurir = ['JNE', 'JNT', 'SICEPAT', 'ANTERAJA', 'INSTAN', 'KURIR_TOKO', 'KURIR_GMA'];
    const profil = formulir([{ k: 'nama', label: 'Nama toko', tipe: 'text', wajib: true, minPanjang: 3 }, { k: 'deskripsi', label: 'Deskripsi toko', tipe: 'textarea', baris: 3, maks: 500 }, { k: 'kota', label: 'Kota', tipe: 'text', wajib: true }, { k: 'provinsi', label: 'Provinsi', tipe: 'text', wajib: true }, { k: 'logo', label: 'Logo', tipe: 'file', terima: 'image/jpeg,image/png,image/webp', jenisBerkas: 'toko', pratinjau: true }, { k: 'banner', label: 'Banner etalase', tipe: 'file', terima: 'image/jpeg,image/png,image/webp', jenisBerkas: 'toko', pratinjau: true }, { k: 'libur', label: 'Mode libur (produk tidak bisa dipesan)', tipe: 'switch' }],
      { nama: k.nama, deskripsi: k.deskripsi, kota: k.kota, provinsi: k.provinsi, logo: k.logo, banner: k.banner, libur: k.libur }, { label: 'Simpan profil', kirim: async (v) => { await panggil('tokoUbah', { nama: v.nama, deskripsi: v.deskripsi, kota: v.kota, provinsi: v.provinsi, logo: v.logo || '', banner: v.banner || '', libur: !!v.libur }); sukses('Profil toko disimpan.'); } });
    const pilihK = new Set(k.kurirAktif);
    const kurirEl = h('div', { class: 'pil-pilih' }, semuaKurir.map(c => h('label', null, h('input', { type: 'checkbox', checked: pilihK.has(c), onchange: (e) => { e.target.checked ? pilihK.add(c) : pilihK.delete(c); } }), h('span', null, c))));
    const rek = formulir([{ k: 'bank', label: 'Bank', tipe: 'text', wajib: true }, { k: 'noRek', label: 'Nomor rekening', tipe: 'text', mode: 'numeric', wajib: true, bantu: 'Rekening baru aktif untuk penarikan setelah masa tunggu keamanan.' }, { k: 'atasNama', label: 'Atas nama', tipe: 'text', wajib: true }, { k: 'sandi', label: 'Sandi akun (konfirmasi)', tipe: 'password', wajib: true }], {}, { label: 'Ganti rekening', kirim: async (v) => { await panggil('tokoRekening', v); sukses('Rekening diganti. Penarikan ke rekening baru ditahan sementara.'); ulang(); } });
    const staf = formulir([{ k: 'email', label: 'Email calon staf', tipe: 'email', wajib: true, bantu: 'Staf harus sudah punya akun GMA Store.' }], {}, { label: 'Tambah staf toko', kirim: async (v) => { await panggil('tokoTambahStaf', { email: v.email }); sukses('Staf ditambahkan.'); } });
    ganti(isi, h('div', { class: 'kolom', style: { maxWidth: '760px' } },
      h('section', { class: 'kartu' }, h('h3', null, 'Profil toko'), h('p', { class: 'redup' }, 'Kode toko ', h('b', null, k.kode), ' · etalase ', tautan('/toko/' + k.slug, null, '/toko/' + k.slug)), profil.el),
      h('section', { class: 'kartu' }, h('h3', null, 'Kurir pengiriman'), kurirEl, h('button', { class: 'btn', type: 'button', style: { marginTop: '10px' }, onclick: (e) => tahan(e.currentTarget, async () => { await panggil('tokoUbah', { kurirAktif: Array.from(pilihK) }); sukses('Kurir disimpan.'); }) }, 'Simpan kurir')),
      h('section', { class: 'kartu' }, h('h3', null, 'Rekening saat ini'), h('p', null, t.penjual.rekening.bank + ' · ' + t.penjual.rekening.noRek + ' · ' + t.penjual.rekening.atasNama), rek.el),
      h('section', { class: 'kartu' }, h('h3', null, 'Staf toko'), staf.el)));
  });
}

/* ================= STUDIO AI ================= */
export async function studioAi(ctx) {
  await halaman(ctx, 'Studio AI', 'Bantu tulis deskripsi produk dan desain banner promo. Hasilnya contoh — selalu periksa sebelum dipakai.', null, async (isi) => {
    const s = await panggil('aiStatus');
    const hasil = h('div'); const banner = h('div');
    const fd = formulir([{ k: 'nama', label: 'Nama produk', tipe: 'text', wajib: true }, { k: 'kategori', label: 'Kategori', tipe: 'text' }, { k: 'fitur', label: 'Fitur utama (satu per baris)', tipe: 'textarea', baris: 4 }, { k: 'gaya', label: 'Gaya bahasa', tipe: 'select', opsi: [{ v: 'santai', t: 'Santai' }, { v: 'formal', t: 'Formal' }, { v: 'promo', t: 'Promo' }] }], { gaya: 'santai' }, { label: 'Buat deskripsi', kirim: async (v) => {
      const r = await panggil('aiDeskripsi', { nama: v.nama, kategori: v.kategori, fitur: String(v.fitur || '').split('\n').map(x => x.trim()).filter(Boolean), gaya: v.gaya });
      ganti(hasil, h('div', { class: 'kartu', style: { marginTop: '12px' } }, h('div', { class: 'info-kotak' }, r.catatan), h('h4', null, r.judul), h('pre', { style: { whiteSpace: 'pre-wrap', fontFamily: 'inherit' } }, r.deskripsi), h('div', { class: 'baris-rapat' }, (r.tag || []).map(t => h('span', { class: 'chip' }, '#' + t))), h('button', { class: 'btn sekunder sm', type: 'button', style: { marginTop: '8px' }, onclick: () => { salin(r.judul + '\n\n' + r.deskripsi).then(() => sukses('Disalin.')); } }, ikon('copy'), 'Salin')));
    } });
    const fb = formulir([{ k: 'judul', label: 'Judul banner', tipe: 'text', wajib: true, minPanjang: 3, maks: 60 }, { k: 'tema', label: 'Tema/promo', tipe: 'text', placeholder: 'Gajian, Ramadan, Flash Sale…' }, { k: 'nuansa', label: 'Nuansa warna', tipe: 'text', placeholder: 'hangat, segar, elegan…' }], {}, { label: 'Buat banner', kirim: async (v) => { const r = await panggil('aiDesainBanner', v); const svg = svgAman(r.svg); ganti(banner, h('div', { class: 'kartu', style: { marginTop: '12px' } }, h('div', { class: 'info-kotak' }, r.catatan), svg || h('p', null, r.headline), h('small', { class: 'redup' }, 'Tangkap layar atau unduh melalui menu Banner admin untuk dipakai.'))); } });
    ganti(isi, h('div', { class: 'info-kotak', style: { marginBottom: '12px' } }, 'Mode: ', h('b', null, s.mode), ' · kuota hari ini sisa ', h('b', null, s.sisa), ' dari ', s.kuota), h('div', { class: 'dua-kolom' }, h('section', { class: 'kartu' }, h('h3', null, 'Deskripsi produk'), fd.el, hasil), h('section', { class: 'kartu' }, h('h3', null, 'Desain banner'), fb.el, banner)));
  });
}

/* ================= DAFTAR JADI PENJUAL ================= */
export async function daftarPenjual(ctx) {
  ctx.setJudul('Buka toko di GMA Store', 'Daftar jadi penjual, jualan dan live selling dengan dana pembeli aman di escrow.');
  const isi = h('div', { class: 'wadah seksi', style: { maxWidth: '720px' } }); ganti(ctx.wadah, isi);
  if (!state.user) { ganti(isi, h('h1', null, 'Buka toko gratis'), h('p', null, 'Masuk atau daftar dulu untuk membuka toko.'), h('div', { class: 'baris' }, tautan('/masuk?lanjut=/jual/daftar', 'btn', 'Masuk'), tautan('/daftar', 'btn sekunder', 'Daftar akun'))); return; }
  if (state.user.peran.includes('PENJUAL')) { ganti(isi, kosong('Anda sudah punya toko', '', tautan('/penjual', 'btn', 'Ke dasbor penjual'), 'store')); return; }
  const f = formulir([{ k: 'judul1', tipe: 'judul', label: 'Data toko' }, { k: 'namaToko', label: 'Nama toko', tipe: 'text', wajib: true, minPanjang: 3 }, { k: 'kodeToko', label: 'Kode toko (4–8 huruf, opsional)', tipe: 'text', maks: 8, bantu: 'Dipakai di kode pesanan. Kosongkan untuk dibuatkan otomatis.' }, { k: 'namaPemilik', label: 'Nama pemilik', tipe: 'text', wajib: true }, { k: 'kota', label: 'Kota', tipe: 'text', wajib: true }, { k: 'provinsi', label: 'Provinsi', tipe: 'text', wajib: true },
    { k: 'judul2', tipe: 'judul', label: 'Rekening pencairan dana' }, { k: 'bank', label: 'Bank', tipe: 'text', wajib: true }, { k: 'noRek', label: 'Nomor rekening', tipe: 'text', mode: 'numeric', wajib: true }, { k: 'atasNama', label: 'Atas nama', tipe: 'text', wajib: true, bantu: 'Harus sama dengan nama pemilik.' },
    { k: 'judul3', tipe: 'judul', label: 'Verifikasi identitas' }, { k: 'ktp', label: 'Foto KTP', tipe: 'file', terima: 'image/jpeg,image/png', jenisBerkas: 'ktp', simpanId: true, bantu: 'Disimpan terenkripsi dan hanya dilihat admin verifikator.' }, { k: 'setuju', label: 'Saya menyetujui Syarat & Ketentuan penjual serta kebijakan penalti', tipe: 'checkbox', wajib: true }],
    { namaPemilik: state.user.nama }, { label: 'Kirim pendaftaran', kirim: async (v) => { await panggil('penjualDaftar', { namaToko: v.namaToko, kodeToko: v.kodeToko || undefined, namaPemilik: v.namaPemilik, kota: v.kota, provinsi: v.provinsi, bank: v.bank, noRek: v.noRek, atasNama: v.atasNama, ktpFileId: v.ktp || undefined }); await muatSesi(); sukses('Pendaftaran terkirim. Admin akan memverifikasi.'); navigasi(href('/penjual')); } });
  ganti(isi, h('h1', null, 'Buka toko gratis'), h('p', { class: 'redup' }, 'Tanpa biaya bulanan. Komisi hanya dari pesanan yang selesai. Verifikasi biasanya 1–2 hari kerja.'), h('div', { class: 'kartu' }, f.el));
}
