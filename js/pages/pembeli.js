// Halaman pembeli: keranjang, checkout, bayar, pesanan, ulasan, wishlist, alamat, notifikasi, akun, apresiasi, dokumen.
import { h, ikon, ganti, rp, angka, tgl, rel, gambar, bintang, simpanFile } from '../lib/dom.js';
import { panggil, unggahBerkas, kecilkanGambar } from '../lib/api.js';
import { state, atur, simpan } from '../lib/store.js';
import { href, navigasi } from '../lib/router.js';
import { kosong, kotakGalat, skeleton, tahan, laporGalat, ok as sukses, gagal, konfirmasi, tanya, modal, formulir, status, tab, kv, hitungMundur, pilihChip, paginasi, kepalaHalaman } from '../lib/ui.js';
import { ambilKeranjang, ubahJumlah, hapusItem, simpanItems, keItems } from '../lib/keranjang.js';
import { tautan, gridProduk, kartuProduk, kartuVoucher, kodeSalin } from '../lib/komponen.js';
import { segarkanLencana, keluar, bersihSesi } from '../lib/layout.js';
import { muatSesi } from '../lib/sesi.js';

const wrap = (ctx, ...isi) => ganti(ctx.wadah, h('div', { class: 'wadah seksi' }, ...isi));
const muatHalaman = async (ctx, judul, fn, skel) => { ctx.setJudul(judul, '', { noindex: true }); const isi = h('div'); wrap(ctx, h('h1', null, judul), isi); ganti(isi, skel || skeleton(3, 90)); const jalan = async () => { try { await fn(isi, jalan); } catch (e) { ganti(isi, kotakGalat(e, jalan)); } }; await jalan(); };

/* Dokumen: buat (idempoten) lalu unduh */
export async function unduhDokumen(jenis, ref, tombol) {
  return tahan(tombol, async () => {
    const d = await panggil('dokumenBuat', { jenis, ref }); const f = await panggil('dokumenUnduh', { id: d.id });
    simpanFile(f.nama, f.mime, f.base64); sukses('Dokumen ' + f.nomor + ' diunduh. Kode verifikasi: ' + d.kode);
  });
}

/* ================= KERANJANG ================= */
export async function keranjang(ctx) {
  ctx.setJudul('Keranjang', '', { noindex: true }); const isi = h('div'); wrap(ctx, h('h1', null, 'Keranjang'), isi);
  const terpilih = new Set(); let data;
  const gambarUlang = () => {
    const semua = data.grup.flatMap(g => g.items);
    if (!semua.length) { ganti(isi, kosong('Keranjang masih kosong', 'Yuk cari produk favoritmu.', tautan('/cari', 'btn', 'Mulai belanja'), 'cart')); return; }
    const total = data.grup.reduce((s, g) => s + g.items.filter(i => terpilih.has(i.varianId)).reduce((a, i) => a + i.subtotal, 0), 0);
    const n = semua.filter(i => terpilih.has(i.varianId)).length;
    const semuaCek = h('input', { type: 'checkbox', checked: n === semua.filter(i => i.tersedia).length && n > 0, 'aria-label': 'Pilih semua', onchange: (e) => { semua.forEach(i => { if (i.tersedia) e.target.checked ? terpilih.add(i.varianId) : terpilih.delete(i.varianId); }); gambarUlang(); } });
    const daftar = h('div', { class: 'kolom' }, (data.peringatan || []).map(p => h('div', { class: 'peringatan-kotak' }, p)),
      h('label', { class: 'cek kartu' }, semuaCek, h('span', null, 'Pilih semua (' + semua.length + ' barang)')),
      data.grup.map(g => h('section', { class: 'kartu' }, h('div', { class: 'kartu-judul' }, h('h3', null, ikon('store'), ' ', g.tokoNama), h('small', null, g.kota)),
        g.items.map(i => h('div', { class: 'baris-keranjang' }, h('input', { type: 'checkbox', disabled: !i.tersedia, checked: terpilih.has(i.varianId), 'aria-label': 'Pilih ' + i.nama, onchange: (e) => { e.target.checked ? terpilih.add(i.varianId) : terpilih.delete(i.varianId); gambarUlang(); } }), gambar(i.foto, i.nama),
          h('div', null, h('a', { href: href('/cari?q=' + encodeURIComponent(i.nama)), style: { color: 'inherit', fontWeight: 600 } }, i.nama), h('div', { class: 'kecil' }, i.namaVarian !== 'Standar' ? i.namaVarian : ''), h('div', { class: 'harga' }, rp(i.hargaSatuan), i.hargaSatuan < i.hargaEceran ? h('span', { class: 'harga-coret', style: { marginLeft: '6px' } }, rp(i.hargaEceran)) : null), i.jenisHarga && i.jenisHarga !== 'ECERAN' ? h('span', { class: 'tag-hangat' }, i.jenisHarga.startsWith('FLASH') ? 'Flash sale' : i.jenisHarga.startsWith('LIVE') ? 'Harga live' : 'Harga grosir') : null, !i.tersedia ? h('div', { class: 'galat-teks' }, i.alasan) : null,
            h('div', { class: 'baris', style: { marginTop: '8px', flexWrap: 'nowrap' } }, h('div', { class: 'qty' }, h('button', { type: 'button', 'aria-label': 'Kurangi', onclick: (e) => ubah(e, i, i.qty - 1) }, '−'), h('input', { value: i.qty, 'aria-label': 'Jumlah', inputmode: 'numeric', onchange: (e) => ubah(e, i, Number(e.target.value) || 1) }), h('button', { type: 'button', 'aria-label': 'Tambah', onclick: (e) => ubah(e, i, i.qty + 1) }, '+')), h('button', { class: 'btn ghost sm', type: 'button', 'aria-label': 'Hapus ' + i.nama, onclick: async (e) => { await tahan(e.currentTarget, async () => { data = await hapusItem(i.varianId); terpilih.delete(i.varianId); gambarUlang(); }); } }, ikon('trash'))))))
        , h('div', { class: 'sebar', style: { paddingTop: '8px' } }, h('span', { class: 'redup' }, 'Subtotal toko'), h('strong', null, rp(g.subtotal))))));
    const ringkas = h('aside', { class: 'kartu ringkasan-lengket' }, h('h3', null, 'Ringkasan'), h('div', { class: 'sebar' }, h('span', null, 'Dipilih'), h('span', null, n + ' barang')), h('div', { class: 'sebar', style: { margin: '8px 0' } }, h('span', null, 'Total belanja'), h('span', { class: 'harga besar', style: { fontSize: '22px' } }, rp(total))), h('small', { class: 'redup' }, 'Ongkir & biaya layanan dihitung di langkah berikutnya.'),
      h('button', { class: 'btn blok lg', type: 'button', disabled: !n, style: { marginTop: '12px' }, onclick: () => { try { sessionStorage.setItem('gma-pilih', JSON.stringify([...terpilih])); } catch (e) { /* abaikan */ } navigasi(href('/checkout')); } }, 'Checkout (' + n + ')'));
    ganti(isi, h('div', { class: 'dua-kolom' }, daftar, ringkas));
  };
  async function ubah(e, i, q) { await tahan(e.currentTarget, async () => { data = await ubahJumlah(i.varianId, Math.max(0, Math.min(9999, q))); gambarUlang(); }); }
  try { ganti(isi, skeleton(3, 100)); data = await ambilKeranjang(); data.grup.forEach(g => g.items.forEach(i => { if (i.tersedia) terpilih.add(i.varianId); })); try { const p = JSON.parse(sessionStorage.getItem('gma-pilih') || '[]'); if (p.length) { terpilih.clear(); p.forEach(x => terpilih.add(x)); } } catch (e) { /* abaikan */ } gambarUlang(); }
  catch (e) { ganti(isi, kotakGalat(e, () => keranjang(ctx))); }
}

/* ================= CHECKOUT ================= */
const METODE = [{ k: 'QRIS', t: 'QRIS', s: 'Scan dengan e-wallet/m-banking. Instan.' }, { k: 'TRANSFER', t: 'Transfer bank', s: 'Unggah bukti; diverifikasi keuangan.' }, { k: 'VA', t: 'Virtual Account', s: 'Bayar lewat ATM/m-banking.' }, { k: 'EWALLET', t: 'DANA / e-wallet', s: 'Bayar lewat aplikasi e-wallet.' }, { k: 'SALDO', t: 'Saldo GMA', s: 'Pakai saldo di akun Anda.' }, { k: 'COD', t: 'Bayar di tempat (COD)', s: 'Satu toko per pesanan, batas nilai berlaku.' }];
export async function checkout(ctx) {
  ctx.setJudul('Checkout', '', { noindex: true }); const isi = h('div'); wrap(ctx, h('h1', null, 'Checkout'), isi); ganti(isi, skeleton(3, 120));
  let k, alamat, pilih = []; try { pilih = JSON.parse(sessionStorage.getItem('gma-pilih') || '[]'); } catch (e) { /* abaikan */ }
  try { [k, alamat] = await Promise.all([ambilKeranjang(), panggil('alamatDaftar')]); } catch (e) { ganti(isi, kotakGalat(e, () => checkout(ctx))); return; }
  const semua = k.grup.flatMap(g => g.items.map(i => ({ ...i, tokoId: g.tokoId }))); const dipilih = semua.filter(i => i.tersedia && (!pilih.length || pilih.includes(i.varianId)));
  if (!dipilih.length) { ganti(isi, kosong('Tidak ada barang untuk di-checkout', 'Pilih barang dulu dari keranjang.', tautan('/keranjang', 'btn', 'Ke keranjang'), 'cart')); return; }
  const grup = k.grup.map(g => ({ ...g, items: g.items.filter(i => dipilih.some(d => d.varianId === i.varianId)) })).filter(g => g.items.length);
  const st = { alamatId: (alamat.find(a => a.utama) || alamat[0] || {}).id || '', kurir: {}, metode: 'QRIS', voucher: '', catatan: '' };
  grup.forEach(g => { st.kurir[g.tokoId] = (g.kurirAktif || [])[0] || ''; });
  const ringkas = h('aside', { class: 'kartu ringkasan-lengket', 'aria-live': 'polite' }); const galat = h('div'); let hitung = null, sibuk = false;
  const items = () => dipilih.map(i => { const o = { v: i.varianId, q: i.qty }; const m = /^LIVE:(LIV-\d{6}-\d{3})$/.exec(i.jenisHarga || ''); if (m) o.live = m[1]; return o; });
  const payload = () => ({ alamatId: st.alamatId, metode: st.metode, kurir: st.kurir, voucher: st.voucher || undefined, catatan: st.catatan, items: items() });
  async function segar() {
    ganti(galat, ''); if (!st.alamatId) { ganti(ringkas, h('h3', null, 'Ringkasan'), h('p', { class: 'redup' }, 'Tambahkan alamat pengiriman untuk melihat total.')); return; }
    try { hitung = await panggil('checkoutHitung', payload()); gambarRingkas(); } catch (e) { hitung = null; ganti(galat, h('div', { class: 'galat-kotak', role: 'alert' }, e.message)); gambarRingkas(); }
  }
  function gambarRingkas() {
    ganti(ringkas, h('h3', null, 'Ringkasan'), hitung ? [h('div', { class: 'sebar' }, h('span', null, 'Subtotal'), h('span', null, rp(hitung.subtotal))), h('div', { class: 'sebar' }, h('span', null, 'Ongkir'), h('span', null, rp(hitung.ongkir))), hitung.diskon ? h('div', { class: 'sebar' }, h('span', null, 'Diskon'), h('span', { style: { color: 'var(--segar)' } }, '−' + rp(hitung.diskon))) : null, h('div', { class: 'sebar' }, h('span', null, 'Biaya layanan'), h('span', null, rp(hitung.biayaLayanan))), h('hr'), h('div', { class: 'sebar' }, h('strong', null, 'Total'), h('span', { class: 'harga besar', style: { fontSize: '22px' } }, rp(hitung.total))), st.metode === 'TRANSFER' ? h('small', { class: 'redup' }, 'Kode unik ditambahkan di langkah bayar.') : null] : h('p', { class: 'redup' }, 'Lengkapi pilihan untuk melihat total.'),
      h('button', { class: 'btn blok lg', type: 'button', disabled: !hitung, style: { marginTop: '12px' }, onclick: (e) => tahan(e.currentTarget, buat) }, st.metode === 'COD' ? 'Buat pesanan (COD)' : 'Buat pesanan & bayar'), h('small', { class: 'redup', style: { display: 'block', marginTop: '8px' } }, ikon('shield'), ' Dana ditahan aman sampai pesanan Anda terima.'));
  }
  async function buat() { const r = await panggil('checkoutBuat', payload()); try { sessionStorage.removeItem('gma-pilih'); } catch (e) { /* abaikan */ } segarkanLencana(); sukses('Pesanan dibuat.'); navigasi(href(st.metode === 'COD' ? '/pesanan/' + r.orderId : '/bayar/' + r.orderId)); }
  const kotakAlamat = h('div'); const gambarAlamat = () => ganti(kotakAlamat, alamat.length ? alamat.map(a => h('label', { class: 'opsi-kartu', style: { marginBottom: '8px' } }, h('input', { type: 'radio', name: 'alamat', checked: a.id === st.alamatId, onchange: () => { st.alamatId = a.id; segar(); } }), h('div', null, h('div', { class: 'tebal' }, a.label + ' · ' + a.penerima), h('div', { class: 'kecil' }, a.alamat + ', ' + a.kota + ', ' + a.provinsi + ' ' + (a.kodePos || '')), h('div', { class: 'kecil' }, a.hp)))) : h('p', { class: 'redup' }, 'Belum ada alamat.'), h('button', { class: 'btn sekunder sm', type: 'button', onclick: () => formAlamat(null, async (baru) => { alamat = await panggil('alamatDaftar'); st.alamatId = baru.id || st.alamatId; if (!st.alamatId && alamat[0]) st.alamatId = alamat[0].id; gambarAlamat(); segar(); }) }, ikon('plus'), 'Tambah alamat'));
  const voucher = h('input', { class: 'input', placeholder: 'Kode voucher', 'aria-label': 'Kode voucher', style: { textTransform: 'uppercase' } });
  ganti(isi, h('div', { class: 'dua-kolom' }, h('div', { class: 'kolom' },
    h('section', { class: 'kartu' }, h('h3', null, '1. Alamat pengiriman'), kotakAlamat),
    h('section', { class: 'kartu' }, h('h3', null, '2. Barang & pengiriman'), grup.map(g => h('div', { style: { marginBottom: '16px' } }, h('div', { class: 'tebal' }, ikon('store'), ' ', g.tokoNama), g.items.map(i => h('div', { class: 'baris', style: { flexWrap: 'nowrap', padding: '6px 0' } }, gambar(i.foto, i.nama, '', 48), h('div', { class: 'isi' }, h('div', { class: 'klem-2' }, i.nama), h('small', null, i.qty + ' × ' + rp(i.hargaSatuan))), h('strong', null, rp(i.subtotal)))), h('div', { class: 'field', style: { marginTop: '8px' } }, h('span', { class: 'label' }, 'Kurir'), (g.kurirAktif || []).length ? h('div', { class: 'pil-pilih', role: 'radiogroup', 'aria-label': 'Kurir ' + g.tokoNama }, g.kurirAktif.map(c => h('label', null, h('input', { type: 'radio', name: 'kurir' + g.tokoId, checked: st.kurir[g.tokoId] === c, onchange: () => { st.kurir[g.tokoId] = c; segar(); } }), h('span', null, c)))) : h('div', { class: 'galat-teks' }, 'Toko ini belum mengaktifkan kurir.'))))),
    h('section', { class: 'kartu' }, h('h3', null, '3. Metode pembayaran'), METODE.map(m => h('label', { class: 'opsi-kartu', style: { marginBottom: '8px' } }, h('input', { type: 'radio', name: 'metode', checked: st.metode === m.k, onchange: () => { st.metode = m.k; segar(); } }), h('div', null, h('div', { class: 'tebal' }, m.t), h('small', { class: 'redup' }, m.s))))),
    h('section', { class: 'kartu' }, h('h3', null, '4. Voucher & catatan'), h('div', { class: 'baris', style: { flexWrap: 'nowrap' } }, voucher, h('button', { class: 'btn sekunder', type: 'button', onclick: () => { st.voucher = voucher.value.trim().toUpperCase(); segar(); } }, 'Pakai')),
      state.user ? h('small', { class: 'redup' }, 'Voucher kejutan & hasil tukar poin ada di menu Poin & lencana.') : null, h('div', { class: 'field', style: { marginTop: '12px' } }, h('label', { for: 'cat' }, 'Catatan untuk penjual (opsional)'), h('textarea', { class: 'textarea', id: 'cat', rows: 2, maxlength: 300, oninput: (e) => { st.catatan = e.target.value; } })))), h('div', null, galat, ringkas)));
  gambarAlamat(); await segar();
}
export function formAlamat(a, selesai) {
  const f = formulir([{ k: 'label', label: 'Label alamat', tipe: 'text', wajib: true, bantu: 'Mis. Rumah, Kantor.' }, { k: 'penerima', label: 'Nama penerima', tipe: 'text', wajib: true }, { k: 'hp', label: 'Nomor HP penerima', tipe: 'tel', wajib: true }, { k: 'alamat', label: 'Alamat lengkap', tipe: 'textarea', baris: 3, wajib: true, bantu: 'Jalan, nomor, RT/RW, patokan.' }, { k: 'kota', label: 'Kota/Kabupaten', tipe: 'text', wajib: true }, { k: 'provinsi', label: 'Provinsi', tipe: 'text', wajib: true }, { k: 'kodePos', label: 'Kode pos', tipe: 'text', mode: 'numeric' }, { k: 'utama', label: 'Jadikan alamat utama', tipe: 'switch' }], a || { label: 'Rumah', penerima: state.user && state.user.nama, hp: state.user && state.user.hp }, { label: 'Simpan alamat', kirim: async (v) => { const r = await panggil('alamatSimpan', { ...v, id: a ? a.id : undefined }); m.tutup(); sukses('Alamat disimpan.'); selesai && selesai(r || {}); } });
  const m = modal({ judul: a ? 'Ubah alamat' : 'Tambah alamat', isi: f.el }); return m;
}

/* ================= BAYAR ================= */
export async function bayar(ctx) {
  ctx.setJudul('Pembayaran', '', { noindex: true }); const isi = h('div'); wrap(ctx, h('h1', null, 'Pembayaran'), isi); ganti(isi, skeleton(2, 180));
  const id = ctx.params.orderId; let iv;
  try {
    const [b, o] = await Promise.all([panggil('bayarMulai', { orderId: id }), panggil('pesananDetail', { orderId: id })]);
    const ins = b.instruksi || {}; const kartu = h('div', { class: 'kartu', style: { maxWidth: '640px', margin: '0 auto' } });
    const kirimBukti = () => { const f = formulir([{ k: 'bukti', label: 'Foto bukti transfer', tipe: 'file', terima: 'image/jpeg,image/png,image/webp', jenisBerkas: 'bukti', simpanId: true, wajib: true, pratinjau: false, bantu: 'JPG/PNG. Pastikan nominal dan tanggal terbaca.' }], {}, { label: 'Kirim bukti', kirim: async (v) => { await panggil('bayarUnggahBukti', { orderId: id, fileId: v.bukti }); sukses('Bukti terkirim. Menunggu verifikasi keuangan.'); navigasi(href('/pesanan/' + id)); } }); return f.el; };
    const sim = state.situs && state.situs.mode && state.situs.mode.gateway === 'SIMULASI' && ins.tipe !== 'TRANSFER';
    ganti(isi, h('div', { class: 'kolom', style: { maxWidth: '640px', margin: '0 auto' } },
      h('div', { class: 'kartu pusat' }, h('div', { class: 'redup' }, 'Total yang harus dibayar'), h('div', { class: 'kode-unik' }, rp(b.jumlah)), h('div', { class: 'baris', style: { justifyContent: 'center' } }, h('span', null, 'Bayar sebelum'), hitungMundur(b.batas, () => navigasi(href('/pesanan/' + id))), h('small', null, '(' + tgl(b.batas, true) + ')')), h('small', { class: 'redup' }, 'Pesanan ' + id)),
      h('div', { class: 'kartu' }, h('h3', null, ins.tipe === 'TRANSFER' ? 'Transfer ke rekening' : 'Instruksi pembayaran ' + (ins.tipe || '')), ins.tipe === 'TRANSFER' ? kv([['Bank', ins.bank], ['No. rekening', h('span', null, h('b', null, ins.noRek), ' ', kodeSalin(ins.noRek))], ['Atas nama', ins.atasNama], ['Nominal', h('span', null, h('b', null, rp(ins.jumlah)), ' ', kodeSalin(String(ins.jumlah)))]]) : kv(Object.entries(ins).filter(([k]) => !['tipe', 'catatan', 'mode', 'jumlah'].includes(k) && v !== '' && typeof v !== 'object').map(([k, v]) => [k.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase()), String(v)])), ins.catatan ? h('div', { class: 'info-kotak', style: { marginTop: '10px' } }, ins.catatan) : null),
      ins.tipe === 'TRANSFER' ? h('div', { class: 'kartu' }, h('h3', null, 'Sudah transfer? Unggah bukti'), kirimBukti()) : null,
      sim ? h('div', { class: 'kartu' }, h('div', { class: 'info-kotak' }, 'Mode simulasi aktif (belum ada gateway pembayaran). Tekan tombol di bawah untuk menandai pesanan sebagai dibayar.'), h('button', { class: 'btn hangat blok', style: { marginTop: '10px' }, type: 'button', onclick: (e) => tahan(e.currentTarget, async () => { await panggil('bayarSimulasi', { orderId: id }); sukses('Pembayaran simulasi berhasil.'); navigasi(href('/pesanan/' + id)); }) }, 'Simulasikan pembayaran berhasil')) : null,
      h('div', { class: 'baris', style: { justifyContent: 'center' } }, tautan('/pesanan/' + id, 'btn ghost', 'Lihat pesanan'), h('button', { class: 'btn ghost', type: 'button', style: { color: 'var(--bahaya)' }, onclick: async () => { if (await konfirmasi({ judul: 'Batalkan pesanan?', pesan: 'Pesanan yang belum dibayar akan dibatalkan dan stok dikembalikan.', ya: 'Ya, batalkan', bahaya: true })) { await panggil('pesananBatalBelumBayar', { orderId: id }); sukses('Pesanan dibatalkan.'); navigasi(href('/pesanan')); } } }, 'Batalkan pesanan'))));
    iv = setInterval(async () => { if (document.hidden) return; try { const d = await panggil('pesananDetail', { orderId: id }, { coba: 1 }); if (d.status !== 'Menunggu Pembayaran') { sukses('Pembayaran diterima!'); navigasi(href('/pesanan/' + id)); } } catch (e) { /* abaikan */ } }, 6000); ctx.saatPergi(() => clearInterval(iv));
  } catch (e) { ganti(isi, kotakGalat(e, () => bayar(ctx))); }
}

/* ================= PESANAN ================= */
const FILTER = [{ k: '', t: 'Semua' }, { k: 'Menunggu Pembayaran', t: 'Belum bayar' }, { k: 'Dibayar', t: 'Diproses' }, { k: 'Dikirim', t: 'Dikirim' }, { k: 'Selesai', t: 'Selesai' }, { k: 'Dibatalkan', t: 'Batal' }];
export async function pesanan(ctx) {
  ctx.setJudul('Pesanan saya', '', { noindex: true }); const daftar = h('div'); const nav = h('div'); let f = ctx.query.status || '', hal = 1; const chip = h('div');
  wrap(ctx, h('h1', null, 'Pesanan saya'), chip, h('div', { style: { marginTop: '12px' } }, daftar, nav));
  const gc = () => ganti(chip, pilihChip(FILTER, f, (k) => { f = k; hal = 1; muat(); gc(); }));
  async function muat() { ganti(daftar, skeleton(3, 130)); try { const r = await panggil('pesananSaya', { status: f || undefined, hal }); ganti(daftar, r.item.length ? r.item.map(kartuPesanan) : kosong('Belum ada pesanan', 'Pesanan yang Anda buat akan muncul di sini.', tautan('/cari', 'btn', 'Mulai belanja'), 'package')); ganti(nav, paginasi(r, (p) => { hal = p; muat(); })); } catch (e) { ganti(daftar, kotakGalat(e, muat)); } }
  gc(); await muat();
}
function kartuPesanan(o) {
  const item = o.sub.flatMap(s => s.item);
  return h('a', { class: 'kartu', href: href('/pesanan/' + o.orderId), style: { display: 'block', color: 'inherit', marginBottom: '12px' } }, h('div', { class: 'sebar' }, h('div', null, h('div', { class: 'tebal' }, o.orderId), h('small', null, tgl(o.dibuat, true) + ' · ' + o.sub.map(s => s.toko).join(', '))), status(o.status)),
    h('div', { class: 'baris', style: { margin: '10px 0', flexWrap: 'nowrap', overflow: 'hidden' } }, item.slice(0, 4).map(i => gambar(i.foto, i.nama, '', 56)), item.length > 4 ? h('span', { class: 'redup' }, '+' + (item.length - 4)) : null), h('div', { class: 'sebar' }, h('small', null, item.length + ' barang'), h('strong', null, rp(o.total))), o.status === 'Menunggu Pembayaran' ? h('div', { class: 'peringatan-kotak', style: { marginTop: '8px' } }, 'Bayar sebelum ' + tgl(o.batasBayar, true)) : null);
}
export async function pesananDetail(ctx) {
  ctx.setJudul('Detail pesanan', '', { noindex: true }); const isi = h('div'); wrap(ctx, h('nav', { class: 'kecil' }, tautan('/pesanan', null, '‹ Pesanan saya')), isi); ganti(isi, skeleton(3, 140));
  const id = ctx.params.id;
  const muat = async () => {
    try {
      const o = await panggil('pesananDetail', { orderId: id }); ctx.setJudul(o.orderId, '', { noindex: true });
      ganti(isi, h('div', { class: 'sebar' }, h('div', null, h('h1', { style: { marginBottom: 0 } }, o.orderId), h('small', null, 'Dibuat ' + tgl(o.dibuat, true))), status(o.status)),
        o.status === 'Menunggu Pembayaran' ? h('div', { class: 'peringatan-kotak', style: { margin: '12px 0' } }, 'Selesaikan pembayaran sebelum ' + tgl(o.batasBayar, true) + '. ', tautan('/bayar/' + o.orderId, 'btn sm', 'Bayar sekarang')) : null,
        h('div', { class: 'dua-kolom', style: { marginTop: '12px' } }, h('div', { class: 'kolom' }, o.sub.map(s => blokSub(s, o, muat))),
          h('aside', { class: 'kolom' }, h('div', { class: 'kartu' }, h('h3', null, 'Alamat pengiriman'), h('div', { class: 'tebal' }, o.alamat.penerima), h('div', { class: 'kecil' }, o.alamat.hp), h('div', null, o.alamat.alamat + ', ' + o.alamat.kota + ', ' + o.alamat.provinsi + ' ' + (o.alamat.kodePos || ''))),
            h('div', { class: 'kartu' }, h('h3', null, 'Pembayaran'), kv([['Metode', o.metode], ['Subtotal', rp(o.subtotal)], ['Ongkir', rp(o.ongkir)], o.diskon ? ['Diskon', '−' + rp(o.diskon)] : null, ['Biaya layanan', rp(o.biayaLayanan)], ['Total', h('strong', null, rp(o.total))], o.dibayar ? ['Dibayar', tgl(o.dibayar, true)] : null].filter(Boolean)), o.status !== 'Menunggu Pembayaran' && o.dibayar ? h('button', { class: 'btn sekunder sm blok', type: 'button', style: { marginTop: '10px' }, onclick: (e) => unduhDokumen('BUKTI_BAYAR', o.orderId, e.currentTarget) }, ikon('download'), 'Bukti pembayaran (PDF)') : null),
            o.catatan ? h('div', { class: 'kartu' }, h('h3', null, 'Catatan'), o.catatan) : null)));
    } catch (e) { ganti(isi, kotakGalat(e, muat)); }
  }; await muat();
}
function blokSub(s, o, muat) {
  const tahap = ['Dibayar', 'Dikemas', 'Dikirim', 'Tiba', 'Selesai']; const aksi = [];
  if (['Dikirim', 'Tiba'].includes(s.status) || s.status === 'Dalam Pengiriman') aksi.push(h('button', { class: 'btn', type: 'button', onclick: async (e) => { if (await konfirmasi({ judul: 'Pesanan sudah diterima?', pesan: 'Dana akan diteruskan ke penjual. Pastikan barang sudah sesuai.', ya: 'Ya, sudah diterima' })) tahan(e.currentTarget, async () => { await panggil('pesananDiterima', { subId: s.subId }); sukses('Terima kasih! Pesanan selesai.'); muat(); }); } }, 'Pesanan diterima'));
  if (['Dikirim', 'Tiba', 'Selesai'].includes(s.status)) aksi.push(h('button', { class: 'btn sekunder', type: 'button', onclick: () => formRetur(s, muat) }, 'Ajukan retur/komplain'));
  if (s.status === 'Selesai') aksi.push(tautan('/ulasan', 'btn sekunder', ikon('star'), 'Beri ulasan'));
  aksi.push(h('button', { class: 'btn ghost', type: 'button', onclick: (e) => tahan(e.currentTarget, async () => { const r = await panggil('chatMulai', { tokoId: s.tokoId, orderId: o.orderId }); navigasi(href('/chat/' + r.threadId)); }) }, ikon('message'), 'Chat penjual'));
  aksi.push(h('button', { class: 'btn ghost', type: 'button', onclick: (e) => unduhDokumen('INVOICE', s.subId, e.currentTarget) }, ikon('download'), 'Invoice'));
  return h('section', { class: 'kartu' }, h('div', { class: 'kartu-judul' }, h('div', null, h('h3', { style: { margin: 0 } }, ikon('store'), ' ', s.toko), h('small', null, s.invoice)), status(s.status)),
    s.item.map(i => h('div', { class: 'baris', style: { flexWrap: 'nowrap', padding: '8px 0' } }, gambar(i.foto, i.nama, '', 56), h('div', { class: 'isi' }, h('div', { class: 'klem-2' }, i.nama), h('small', null, (i.varian !== 'Standar' ? i.varian + ' · ' : '') + i.qty + ' × ' + rp(i.harga))), h('strong', null, rp(i.subtotal)))),
    h('hr'), kv([['Kurir', s.kurir], s.resi ? ['No. resi', h('span', null, h('b', null, s.resi), ' ', kodeSalin(s.resi), ' ', s.trackingUrl ? h('a', { href: s.trackingUrl, target: '_blank', rel: 'noopener noreferrer' }, 'Lacak') : null)] : null, s.dikirim ? ['Dikirim', tgl(s.dikirim, true)] : null, s.komplainSampai && s.status !== 'Selesai' ? ['Batas komplain', tgl(s.komplainSampai, true)] : null, s.batasKirim && !s.dikirim ? ['Kirim paling lambat', tgl(s.batasKirim)] : null].filter(Boolean)),
    h('div', { class: 'baris', style: { marginTop: '12px' } }, aksi));
}
function formRetur(s, selesai) {
  const f = formulir([{ k: 'alasan', label: 'Alasan retur / komplain', tipe: 'textarea', baris: 4, wajib: true, minPanjang: 10, bantu: 'Jelaskan masalahnya (barang rusak, tidak sesuai, tidak sampai, dll).' }, { k: 'bukti', label: 'Foto bukti (opsional)', tipe: 'file', terima: 'image/jpeg,image/png,image/webp', jenisBerkas: 'bukti', simpanId: true }], {}, { label: 'Kirim pengajuan', kirim: async (v) => { await panggil('returAjukan', { subId: s.subId, alasan: v.alasan, bukti: v.bukti || undefined }); m.tutup(); sukses('Pengajuan terkirim. Penjual akan menanggapi.'); selesai(); } });
  const m = modal({ judul: 'Ajukan retur — ' + s.invoice, isi: f.el });
}

/* ================= ULASAN ================= */
export async function ulasan(ctx) {
  await muatHalaman(ctx, 'Ulasan saya', async (isi, ulang) => {
    const [bisa, saya] = await Promise.all([panggil('ulasanBisaDiberi'), panggil('ulasanSaya')]);
    const belum = bisa.filter(x => !x.sudahDiulas);
    ganti(isi, h('h2', null, 'Menunggu ulasan (' + belum.length + ')'), belum.length ? belum.map(x => h('div', { class: 'kartu baris', style: { flexWrap: 'nowrap', marginBottom: '10px' } }, gambar(x.foto, x.nama, '', 64), h('div', { class: 'isi' }, h('div', { class: 'tebal' }, x.nama), h('small', null, x.varian), h('div', null, h('small', { class: 'redup' }, 'Batas ' + tgl(x.sampai)))), h('button', { class: 'btn', type: 'button', onclick: () => formUlasan(x, ulang) }, 'Tulis ulasan'))) : kosong('Tidak ada yang menunggu', 'Semua pesanan selesai sudah Anda ulas. Terima kasih!', null, 'star'),
      h('h2', { style: { marginTop: '24px' } }, 'Ulasan yang sudah dikirim'), saya.length ? saya.map(r => h('div', { class: 'kartu', style: { marginBottom: '10px' } }, h('div', { class: 'sebar' }, bintang(r.rating), status(r.status)), h('p', { style: { margin: '6px 0' } }, r.isi), r.balasan ? h('div', { class: 'info-kotak' }, h('b', null, 'Balasan penjual: '), r.balasan) : null, h('small', { class: 'redup' }, tgl(r.waktu)))) : h('p', { class: 'redup' }, 'Belum ada.'));
  });
}
function formUlasan(x, selesai) {
  let rating = 5; const bt = h('div', { class: 'baris-rapat', role: 'radiogroup', 'aria-label': 'Rating' }); const gb = () => ganti(bt, [1, 2, 3, 4, 5].map(n => h('button', { type: 'button', class: 'tombol-ikon', role: 'radio', 'aria-checked': n === rating, 'aria-label': n + ' bintang', style: { color: n <= rating ? 'var(--peringatan)' : 'var(--garis)' }, onclick: () => { rating = n; gb(); } }, ikon('star'))));
  gb(); const f = formulir([{ k: 'isi', label: 'Ulasan Anda', tipe: 'textarea', baris: 4, wajib: true, minPanjang: 10, bantu: 'Ceritakan kualitas barang, pengemasan, dan pengiriman.', placeholder: 'Barangnya bagus, sesuai deskripsi…' }], x.ulasan || {}, { label: x.sudahDiulas ? 'Perbarui ulasan' : 'Kirim ulasan', kirim: async (v) => { await panggil('ulasanKirim', { itemId: x.itemId, rating, isi: v.isi }); m.tutup(); sukses('Ulasan terkirim. Terima kasih!'); selesai(); } });
  const m = modal({ judul: x.nama, isi: h('div', null, h('div', { class: 'field' }, h('span', { class: 'label' }, 'Rating'), bt), f.el) });
}

/* ================= WISHLIST ================= */
export async function wishlist(ctx) { await muatHalaman(ctx, 'Wishlist', async (isi) => { const l = await panggil('wishlistDaftar'); ganti(isi, l.length ? gridProduk(l) : kosong('Wishlist masih kosong', 'Ketuk ikon hati di halaman produk untuk menyimpan.', tautan('/cari', 'btn', 'Cari produk'), 'heart')); }, skelListProduk()); }
const skelListProduk = () => skeleton(2, 160);

/* ================= ALAMAT ================= */
export async function alamat(ctx) {
  await muatHalaman(ctx, 'Alamat saya', async (isi, ulang) => {
    const l = await panggil('alamatDaftar');
    ganti(isi, h('div', { style: { marginBottom: '12px' } }, h('button', { class: 'btn', type: 'button', onclick: () => formAlamat(null, ulang) }, ikon('plus'), 'Tambah alamat')), l.length ? l.map(a => h('div', { class: 'kartu', style: { marginBottom: '10px' } }, h('div', { class: 'sebar' }, h('div', { class: 'tebal' }, a.label + ' · ' + a.penerima, a.utama ? h('span', { class: 'status ok', style: { marginLeft: '8px' } }, 'Utama') : null), h('div', { class: 'baris-rapat' }, h('button', { class: 'btn ghost sm', type: 'button', onclick: () => formAlamat(a, ulang) }, ikon('edit'), 'Ubah'), h('button', { class: 'btn ghost sm', type: 'button', style: { color: 'var(--bahaya)' }, onclick: async () => { if (await konfirmasi({ judul: 'Hapus alamat?', pesan: a.label + ' — ' + a.alamat, ya: 'Hapus', bahaya: true })) { await panggil('alamatHapus', { id: a.id }); sukses('Alamat dihapus.'); ulang(); } } }, ikon('trash'), 'Hapus'))), h('div', null, a.alamat + ', ' + a.kota + ', ' + a.provinsi + ' ' + (a.kodePos || '')), h('small', null, a.hp))) : kosong('Belum ada alamat', '', null, 'pin'));
  });
}

/* ================= NOTIFIKASI ================= */
const TUJUAN_NOTIF = (n) => /^ORD-/.test(n.ref) ? '/pesanan/' + n.ref : /^SUB-/.test(n.ref) ? '/pesanan' : n.tipe === 'APRESIASI' ? '/apresiasi' : '';
export async function notifikasi(ctx) {
  await muatHalaman(ctx, 'Notifikasi', async (isi, ulang) => {
    const r = await panggil('notifDaftar'); atur({ notif: r.belumDibaca });
    ganti(isi, h('div', { style: { marginBottom: '12px' } }, h('button', { class: 'btn sekunder sm', type: 'button', disabled: !r.belumDibaca, onclick: async (e) => tahan(e.currentTarget, async () => { await panggil('notifBaca', { semua: true }); atur({ notif: 0 }); ulang(); }) }, ikon('check'), 'Tandai semua dibaca')),
      r.item.length ? h('div', { class: 'kartu rata' }, r.item.map(n => h('a', { href: href(TUJUAN_NOTIF(n) || '/notifikasi'), class: 'utas', style: { color: 'inherit', background: n.dibaca ? '' : 'var(--primer-muda)' }, onclick: async () => { if (!n.dibaca) { try { await panggil('notifBaca', { ids: [n.id] }, { coba: 1 }); segarkanLencana(); } catch (e) { /* abaikan */ } } } }, h('span', { class: 'avatar' }, ikon('bell')), h('div', { class: 'isi' }, h('div', { class: 'tebal' }, n.judul), h('div', { class: 'kecil' }, n.isi), h('small', { class: 'redup' }, rel(n.waktu)))))) : kosong('Belum ada notifikasi', '', null, 'bell'));
  });
}

/* ================= AKUN ================= */
export async function akun(ctx) {
  ctx.setJudul('Akun saya', '', { noindex: true }); const u = state.user; const isi = h('div', { class: 'kolom', style: { maxWidth: '720px' } }); wrap(ctx, h('h1', null, 'Akun saya'), isi);
  const profil = formulir([{ k: 'nama', label: 'Nama lengkap', tipe: 'text', wajib: true, minPanjang: 2 }, { k: 'hp', label: 'Nomor HP / WhatsApp', tipe: 'tel' }], { nama: u.nama, hp: u.hp }, { label: 'Simpan profil', kirim: async (v) => { await panggil('authUbahProfil', { nama: v.nama, hp: v.hp }); await muatSesi(); sukses('Profil diperbarui.'); } });
  const sandi = formulir([{ k: 'sandiLama', label: 'Sandi saat ini', tipe: 'password', wajib: true, auto: 'current-password' }, { k: 'sandiBaru', label: 'Sandi baru', tipe: 'password', wajib: true, auto: 'new-password', bantu: 'Minimal 8 karakter, ada huruf dan angka.' }], {}, { label: 'Ganti sandi', kirim: async (v) => { await panggil('authGantiSandi', v); sukses('Sandi diganti. Perangkat lain perlu masuk ulang.'); sandi.set('sandiLama', ''); sandi.set('sandiBaru', ''); } });
  const pin = formulir([{ k: 'pin', label: 'PIN 6 digit', tipe: 'password', mode: 'numeric', maks: 6, wajib: true, cek: (v) => /^\d{6}$/.test(v) ? '' : 'PIN harus 6 angka.', bantu: 'Dipakai untuk menyetujui penarikan dana & tindakan penting.' }, { k: 'sandi', label: 'Sandi akun (konfirmasi)', tipe: 'password', wajib: true }], {}, { label: u.adaPin ? 'Ganti PIN' : 'Atur PIN', kirim: async (v) => { await panggil('authAturPin', v); await muatSesi(); sukses('PIN disimpan.'); pin.set('pin', ''); pin.set('sandi', ''); } });
  const kom = formulir([{ k: 'kode', label: 'Kode komunitas', tipe: 'text', wajib: true }], {}, { label: 'Gabung komunitas', kirim: async (v) => { await panggil('komunitasGabung', { kode: v.kode }); await muatSesi(); sukses('Berhasil bergabung.'); } });
  let optOut = false; const opt = h('label', { class: 'cek' }, h('input', { type: 'checkbox', class: 'sakelar', onchange: async (e) => { try { await panggil('crmOptOutSaya', { optOut: e.target.checked }); sukses(e.target.checked ? 'Anda tidak akan menerima promosi lagi.' : 'Promosi diaktifkan kembali.'); } catch (x) { e.target.checked = !e.target.checked; laporGalat(x); } } }), h('span', null, 'Berhenti menerima pesan promosi (info pesanan tetap dikirim)'));
  const tema = h('div', { class: 'pil-pilih', role: 'radiogroup', 'aria-label': 'Tema' }, [['auto', 'Ikuti perangkat'], ['terang', 'Terang'], ['gelap', 'Gelap']].map(([k, t]) => h('label', null, h('input', { type: 'radio', name: 'tema', checked: state.tema === k, onchange: async () => { atur({ tema: k }); const { terapkanTema } = await import('../lib/store.js'); terapkanTema(); } }), h('span', null, t))));
  ganti(isi, h('div', { class: 'kartu baris', style: { flexWrap: 'nowrap' } }, h('span', { class: 'avatar', style: { width: '56px', height: '56px', fontSize: '20px' } }, (u.nama || '?')[0]), h('div', { class: 'isi' }, h('div', { class: 'tebal' }, u.nama), h('small', null, u.email), h('div', null, u.peran.map(p => h('span', { class: 'status proses', style: { marginRight: '4px' } }, p.replace('_', ' '))))), h('div', { style: { textAlign: 'right' } }, h('small', { class: 'redup' }, 'Saldo GMA'), h('div', { class: 'harga' }, rp(state.saldo || 0)))),
    h('div', { class: 'grid g-2 res' }, tautan('/pesanan', 'kartu baris', ikon('package'), 'Pesanan saya'), tautan('/apresiasi', 'kartu baris', ikon('gift'), 'Poin & lencana'), tautan('/alamat', 'kartu baris', ikon('pin'), 'Alamat'), tautan('/dokumen', 'kartu baris', ikon('file'), 'Dokumen')),
    h('section', { class: 'kartu' }, h('h3', null, 'Profil'), profil.el), h('section', { class: 'kartu' }, h('h3', null, 'Keamanan'), sandi.el, h('hr'), pin.el), h('section', { class: 'kartu' }, h('h3', null, 'Komunitas'), h('p', { class: 'redup' }, 'Gabung komunitas untuk melihat etalase khusus anggota.'), kom.el), h('section', { class: 'kartu' }, h('h3', null, 'Preferensi'), h('div', { class: 'field' }, h('span', { class: 'label' }, 'Tema tampilan'), tema), opt),
    !u.peran.includes('PENJUAL') ? h('section', { class: 'cta-jualan' }, h('div', null, h('h2', null, 'Punya barang untuk dijual?'), h('p', { style: { margin: 0, opacity: .85 } }, 'Buka toko gratis dan siaran live.')), tautan('/jual/daftar', 'btn hangat', 'Buka toko')) : null,
    h('button', { class: 'btn sekunder', type: 'button', onclick: keluar }, ikon('logout'), 'Keluar'));
}

/* ================= APRESIASI ================= */
export async function apresiasi(ctx) {
  await muatHalaman(ctx, 'Poin & lencana', async (isi, ulang) => {
    const a = await panggil('apresiasiSaya'); const dok = (jenis, ref) => (e) => unduhDokumen(jenis, ref, e.currentTarget);
    const tukar = formulir([{ k: 'poin', label: 'Poin yang ditukar', tipe: 'number', min: a.tukarMin, langkah: a.tukarMin, wajib: true, bantu: 'Kelipatan ' + a.tukarMin + ' poin. 1 poin = ' + rp(a.poin ? a.nilaiRupiah / a.poin : 50) + '.' }], { poin: a.tukarMin }, { label: 'Tukar jadi voucher', kirim: async (v) => { const r = await panggil('poinTukar', { poin: v.poin }); sukses('Voucher ' + (r.kode || '') + ' dibuat!'); ulang(); } });
    const lahir = formulir([{ k: 'tgl', label: 'Tanggal lahir', tipe: 'date', wajib: true, bantu: 'Untuk voucher kejutan ulang tahun.' }], { tgl: a.tglLahir || '' }, { label: 'Simpan', kirim: async (v) => { await panggil('apresiasiTglLahir', { tgl: v.tgl }); sukses('Tersimpan.'); } });
    ganti(isi, h('div', { class: 'grid g-3 res' }, h('div', { class: 'kartu stat' }, h('span', { class: 'label' }, 'Poin GMA'), h('div', { class: 'nilai' }, angka(a.poin)), h('small', null, 'Setara ' + rp(a.nilaiRupiah))), h('div', { class: 'kartu stat' }, h('span', { class: 'label' }, 'Pesanan selesai'), h('div', { class: 'nilai' }, a.pesanan)), h('div', { class: 'kartu stat' }, h('span', { class: 'label' }, 'Lencana'), h('div', { class: 'nilai' }, a.lencana || '—'), a.berikutnya ? h('small', null, a.berikutnya.sisaPesanan + ' pesanan lagi menuju ' + a.berikutnya.lencana) : h('small', null, 'Tertinggi!'))),
      h('section', { class: 'kartu', style: { marginTop: '16px' } }, h('div', { class: 'kartu-judul' }, h('h3', null, 'Voucher saya'), h('button', { class: 'btn sekunder sm', type: 'button', onclick: dok('KARTU_APRESIASI', '') }, ikon('download'), 'Kartu apresiasi (PDF)')), a.voucher.length ? h('div', { class: 'karusel' }, a.voucher.map(v => kartuVoucher({ kode: v.kode, jenis: 'NOMINAL', nilai: v.nilai, minBelanja: v.minBelanja }))) : h('p', { class: 'redup' }, 'Belum ada voucher. Selesaikan pesanan untuk mendapat voucher kejutan.')),
      h('div', { class: 'grid g-2 res', style: { marginTop: '16px' } }, h('section', { class: 'kartu' }, h('h3', null, 'Tukar poin'), tukar.el), h('section', { class: 'kartu' }, h('h3', null, 'Hari ulang tahun'), lahir.el)));
  });
}

/* ================= DOKUMEN ================= */
export async function dokumen(ctx) {
  await muatHalaman(ctx, 'Dokumen saya', async (isi) => {
    const l = await panggil('dokumenSaya');
    ganti(isi, h('p', { class: 'redup' }, 'Invoice, bukti pembayaran, dan kartu apresiasi resmi bertanda QR. Dokumen dibuat dari halaman pesanan.'), l.length ? h('div', { class: 'kartu rata' }, l.map(d => h('div', { class: 'utas', style: { cursor: 'default' } }, h('span', { class: 'avatar' }, ikon('file')), h('div', { class: 'isi' }, h('div', { class: 'tebal' }, d.nama + ' · ' + d.nomor), h('small', null, d.ringkas), h('div', null, h('small', { class: 'redup' }, tgl(d.dibuat, true) + ' · Kode ' + d.kode))), status(d.status), h('a', { class: 'btn ghost sm', href: href('/verifikasi/' + d.kode) }, 'Cek'), h('button', { class: 'btn sm', type: 'button', onclick: (e) => unduhDokumen(d.jenis, d.ref, e.currentTarget) }, ikon('download'))))) : kosong('Belum ada dokumen', 'Buka detail pesanan lalu pilih Invoice atau Bukti pembayaran.', tautan('/pesanan', 'btn', 'Ke pesanan'), 'file'));
  });
}
