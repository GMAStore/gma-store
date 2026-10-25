// Portal admin 2: keuangan (pembayaran, penarikan, kas COD, laporan) dan operasional (sengketa, laporan, penalti, ulasan, live).
import { h, ikon, ganti, rp, angka, tgl, rel, bintang, gambar, jam } from '../lib/dom.js';
import { panggil } from '../lib/api.js';
import { state } from '../lib/store.js';
import { kosong, kotakGalat, skeleton, tahan, laporGalat, ok as sukses, gagal, konfirmasi, tanya, modal, formulir, kv, kartuStat, kepalaHalaman, pilihChip, tabel } from '../lib/ui.js';
import { simpanTeks } from '../lib/dom.js';
import { halaman } from './admin.js';

const tombol = (teks, fn, kls = '', ik) => { const b = h('button', { class: 'btn ' + kls, type: 'button' }, ik ? ikon(ik) : null, teks); b.onclick = () => fn(b); return b; };
function bungkus(ctx, judul, sub, ...anak) { ctx.setJudul(judul, '', { noindex: true }); const isi = h('div'); ganti(ctx.wadah, kepalaHalaman(judul, sub), ...anak, isi); return isi; }
/** Daftar dengan chip status. */
function daftarBerstatus(ctx, judul, sub, opsi, awal, ambil, tampil, kosongTeks) {
  let f = awal; const chip = h('div'), isi = h('div', { class: 'kolom' });
  const muat = async () => { ganti(isi, skeleton(3, 80)); try { const r = await ambil(f); ganti(isi, r.length ? tampil(r, muat) : kosong(kosongTeks || 'Tidak ada data', '', null, 'file')); } catch (e) { ganti(isi, kotakGalat(e, muat)); } };
  const gc = () => ganti(chip, pilihChip(opsi, f, (k) => { f = k; gc(); muat(); }));
  gc(); ctx.setJudul(judul, '', { noindex: true }); ganti(ctx.wadah, kepalaHalaman(judul, sub), h('div', { style: { marginBottom: '12px' } }, chip), isi);
  return muat();
}

/* ================= VERIFIKASI PEMBAYARAN ================= */
export async function pembayaran(ctx) {
  await halaman(ctx, 'Verifikasi pembayaran', 'Cocokkan bukti transfer dengan nominal (termasuk kode unik).', null, async (isi, ulang) => {
    const [r, k] = await Promise.all([panggil('keuVerifikasiDaftar'), panggil('keuDashboard')]);
    ganti(isi,
      h('div', { class: 'grid g-4 res', style: { marginBottom: '16px' } }, kartuStat('Menunggu verifikasi', angka(k.menungguVerifikasi), 'card'), kartuStat('Dana escrow ditahan', rp(k.escrowDitahan), 'lock', angka(k.jumlahEscrow) + ' pesanan'), kartuStat('Penarikan menunggu', angka(k.penarikanMenunggu), 'wallet', rp(k.nilaiPenarikan)), kartuStat('Saldo platform', rp(k.saldoPlatform), 'cash')),
      r.length ? h('div', { class: 'kolom' }, r.map(p => h('article', { class: 'kartu' }, h('div', { class: 'sebar', style: { flexWrap: 'wrap', gap: '8px' } }, h('div', null, h('b', null, p.orderId), h('div', { class: 'redup' }, 'Diunggah ' + rel(p.dibuat) + ' · batas ' + tgl(p.batas, true))), h('div', { class: 'tebal', style: { fontSize: '1.25rem' } }, rp(p.jumlah))),
        h('p', { class: 'redup' }, 'Kode unik: ', h('b', null, p.kodeUnik), ' — nominal masuk harus tepat ', h('b', null, rp(p.jumlah)), '.'),
        h('div', { class: 'baris', style: { gap: '8px', flexWrap: 'wrap' } },
          p.buktiUrl ? h('a', { class: 'btn ghost sm', href: p.buktiUrl, target: '_blank', rel: 'noopener noreferrer' }, ikon('eye'), 'Lihat bukti') : h('span', { class: 'redup' }, 'Tidak ada bukti'),
          tombol('Nominal sesuai — setujui', async (b) => { if (!(await konfirmasi({ judul: 'Setujui pembayaran?', pesan: `Pastikan dana ${rp(p.jumlah)} sudah masuk ke rekening.`, ya: 'Ya, sudah masuk' }))) return; await tahan(b, async () => { await panggil('keuVerifikasiSetuju', { orderId: p.orderId, jumlahDiterima: p.jumlah }); sukses('Pembayaran disetujui. Pesanan diteruskan ke penjual.'); ulang(); }); }),
          tombol('Tolak', async (b) => { const a = await tanya({ judul: 'Tolak bukti', label: 'Alasan penolakan', area: true, ya: 'Tolak bukti' }); if (a === null) return; await tahan(b, async () => { await panggil('keuVerifikasiTolak', { orderId: p.orderId, alasan: a }); sukses('Bukti ditolak, pembeli diminta mengunggah ulang.'); ulang(); }); }, 'ghost')))))
        : kosong('Tidak ada bukti menunggu', 'Semua pembayaran sudah diverifikasi.', null, 'card'));
  });
}

/* ================= PENARIKAN DANA ================= */
const KEL_WD = { Menunggu: 'tunggu', Disetujui: 'proses', Ditransfer: 'ok', Ditolak: 'gagal' };
export async function penarikan(ctx) {
  const aku = state.user && (state.user.id || state.user.userId);
  await daftarBerstatus(ctx, 'Penarikan dana', 'Setujui, transfer, atau tolak penarikan saldo penjual. Nominal besar butuh dua admin berbeda.',
    [{ k: 'Menunggu', t: 'Perlu diproses' }, { k: 'Ditransfer', t: 'Ditransfer' }, { k: 'Ditolak', t: 'Ditolak' }, { k: 'semua', t: 'Semua' }], 'Menunggu',
    (st) => panggil('penarikanDaftar', { status: st }),
    (r, ulang) => r.map(w => h('article', { class: 'kartu' },
      h('div', { class: 'sebar', style: { flexWrap: 'wrap', gap: '8px' } }, h('div', null, h('b', null, w.id), h('div', { class: 'redup' }, w.sellerId + ' · ' + rel(w.dibuat))), h('div', { class: 'baris-rapat' }, h('span', { class: 'status ' + (KEL_WD[w.status] || '') }, w.status), h('b', { style: { fontSize: '1.15rem' } }, rp(w.jumlah)))),
      kv([['Rekening', `${w.bank} · ${w.noRekLengkap || w.noRek} · a.n. ${w.atasNama}`], ['Biaya', rp(w.biaya)], ['Ditransfer bersih', rp(w.jumlah - w.biaya)], ['Persetujuan', w.perluDua ? `Butuh 2 admin — ${w.setuju1 ? '1' : '0'}${w.setuju2 ? ' + 1' : ''} / 2` : 'Cukup 1 admin'], ['Selesai', w.selesai ? tgl(w.selesai, true) : '']]),
      (w.status === 'Menunggu' || w.status === 'Disetujui') ? h('div', { class: 'baris', style: { gap: '8px', flexWrap: 'wrap', marginTop: '8px' } },
        w.status === 'Menunggu' ? tombol('Setujui', async (b) => { await tahan(b, async () => { const r = await panggil('penarikanSetuju', { id: w.id }); sukses(r.status === 'Disetujui' ? 'Penarikan disetujui penuh.' : 'Persetujuan pertama tercatat. Menunggu admin lain.'); ulang(); }); }) : null,
        w.status === 'Disetujui' ? tombol('Tandai sudah ditransfer', async (b) => { const ref = await tanya({ judul: 'Konfirmasi transfer', label: 'No. referensi transfer bank (opsional)', wajib: false, ya: 'Sudah ditransfer', bantu: `Pastikan ${rp(w.jumlah - w.biaya)} sudah dikirim ke rekening di atas.` }); if (ref === null) return; await tahan(b, async () => { await panggil('penarikanTransfer', { id: w.id, referensi: ref }); sukses('Ditandai ditransfer.'); ulang(); }); }, '', 'check') : null,
        tombol('Tolak & kembalikan saldo', async (b) => { const a = await tanya({ judul: 'Tolak penarikan', label: 'Alasan', area: true, ya: 'Tolak' }); if (a === null) return; await tahan(b, async () => { await panggil('penarikanTolak', { id: w.id, alasan: a }); sukses('Ditolak, saldo dikembalikan ke penjual.'); ulang(); }); }, 'ghost')) : null)),
    'Tidak ada penarikan pada status ini.');
}

/* ================= KAS COD ================= */
export async function kasCod(ctx) {
  await halaman(ctx, 'Kas COD kurir', 'Uang tunai COD yang masih dipegang kurir GMA.', null, async (isi, ulang) => {
    const r = await panggil('keuKasCodDaftar');
    ganti(isi, h('div', { class: 'grid g-4 res', style: { marginBottom: '16px' } }, kartuStat('Total kas di kurir', rp(r.total), 'cash'), kartuStat('Jumlah kurir memegang kas', angka(r.kurir.length), 'truck')),
      tabel([{ judul: 'Kurir', tampil: k => h('div', null, h('b', null, k.nama), h('div', { class: 'redup' }, k.hp || '')) }, { judul: 'Kas dipegang', kanan: true, tampil: k => rp(k.kasDipegang) }, { judul: 'Diperbarui', tampil: k => rel(k.diperbarui) },
        { judul: '', aksi: true, tampil: k => tombol('Terima setoran', async (b) => {
          const f = formulir([{ k: 'jumlah', label: 'Jumlah disetor (Rp)', tipe: 'number', wajib: true, min: 1, maksNilai: k.kasDipegang, bantu: 'Maksimal ' + rp(k.kasDipegang) }, { k: 'catatan', label: 'Catatan', tipe: 'text' }], { jumlah: k.kasDipegang }, { label: 'Catat setoran', batal: () => m.tutup(), kirim: async (v) => { await panggil('keuKasCodSetor', { kurirUserId: k.kurirUserId, jumlah: v.jumlah, catatan: v.catatan }); sukses('Setoran dicatat.'); m.tutup(); ulang(); } });
          const m = modal({ judul: 'Setoran dari ' + k.nama, isi: f.el }); }, 'sm') }], r.kurir, { kosongTeks: 'Tidak ada kurir yang memegang kas.', caption: 'Kas COD kurir' }));
  });
}

/* ================= LAPORAN KEUANGAN ================= */
export async function keuangan(ctx) {
  const hari = (n) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
  let dari = hari(29), sampai = hari(0); const hasil = h('div');
  const muat = async () => {
    ganti(hasil, skeleton(2, 100));
    try {
      const r = await panggil('laporanKeuangan', { dari, sampai });
      const bersih = r.gmv - r.fee;
      ganti(hasil, h('div', { class: 'grid g-4 res' }, kartuStat('Sub-pesanan', angka(r.sub), 'package', `${angka(r.selesai)} selesai · ${angka(r.dibatalkan)} batal`), kartuStat('GMV selesai', rp(r.gmv), 'chart'), kartuStat('Komisi platform', rp(r.fee), 'wallet'), kartuStat('Ongkir', rp(r.ongkir), 'truck'), kartuStat('PPN dipungut', rp(r.ppn), 'file'), kartuStat('PPh dipotong', rp(r.pph), 'file'), kartuStat('Diteruskan ke penjual (kasar)', rp(bersih), 'cash')),
        h('div', { class: 'baris', style: { marginTop: '16px' } }, tombol('Unduh CSV', () => simpanTeks(`laporan-keuangan-${dari}_${sampai}.csv`, ['periode,sub,selesai,dibatalkan,gmv,fee,ppn,pph,ongkir', [r.periode, r.sub, r.selesai, r.dibatalkan, r.gmv, r.fee, r.ppn, r.pph, r.ongkir].join(',')].join('\n')), 'ghost', 'download')),
        h('p', { class: 'redup', style: { marginTop: '12px' } }, 'Angka dihitung dari sub-pesanan berstatus Selesai pada rentang tanggal pembuatan. Ini ringkasan operasional, bukan pengganti pembukuan akuntan.'));
    } catch (e) { ganti(hasil, kotakGalat(e, muat)); }
  };
  ctx.setJudul('Laporan keuangan', '', { noindex: true });
  ganti(ctx.wadah, kepalaHalaman('Laporan keuangan', 'GMV, komisi, dan pajak per periode.'),
    h('div', { class: 'baris', style: { flexWrap: 'wrap', alignItems: 'center', marginBottom: '12px', gap: '8px' } }, h('input', { type: 'date', class: 'input', value: dari, 'aria-label': 'Dari tanggal', onchange: (e) => { dari = e.target.value; muat(); } }), h('span', { class: 'redup' }, 's/d'), h('input', { type: 'date', class: 'input', value: sampai, 'aria-label': 'Sampai tanggal', onchange: (e) => { sampai = e.target.value; muat(); } })), hasil);
  await muat();
}

/* ================= SENGKETA ================= */
export async function sengketa(ctx) {
  await daftarBerstatus(ctx, 'Sengketa', 'Putuskan sengketa antara pembeli dan penjual berdasarkan bukti kedua pihak.',
    [{ k: 'Terbuka', t: 'Terbuka' }, { k: 'Selesai', t: 'Selesai' }], 'Terbuka', (st) => panggil('adminSengketaDaftar', { status: st }),
    (r, ulang) => r.map(s => h('article', { class: 'kartu' }, h('div', { class: 'sebar' }, h('div', null, h('b', null, s.subId), h('div', { class: 'redup' }, s.orderId + ' · ' + rel(s.dibuat))), h('span', { class: 'status ' + (s.status === 'Terbuka' ? 'tunggu' : 'ok') }, s.status)), h('p', null, s.isi),
      s.status === 'Terbuka' ? h('div', { class: 'baris', style: { gap: '8px', flexWrap: 'wrap' } }, tombol('Putuskan', () => putus(s, ulang), '', 'flag')) : null)), 'Tidak ada sengketa.');
  function putus(s, ulang) {
    const f = formulir([{ k: 'pemenang', label: 'Pemenang', tipe: 'select', wajib: true, opsi: [{ v: 'PEMBELI', t: 'Pembeli (refund + penalti penjual)' }, { v: 'PENJUAL', t: 'Penjual (dana dilepas)' }] },
      { k: 'keputusan', label: 'Alasan keputusan (dikirim ke kedua pihak)', tipe: 'textarea', wajib: true, minPanjang: 10 }, { k: 'kembalikanStok', label: 'Kembalikan stok barang', tipe: 'checkbox', bantu: 'Hanya jika pemenang pembeli dan barang kembali ke penjual.' }, { k: 'barangTidakSesuai', label: 'Barang terbukti tidak sesuai (penalti tambahan)', tipe: 'checkbox' }], { pemenang: 'PEMBELI' },
      { label: 'Simpan putusan', batal: () => m.tutup(), kirim: async (v) => { if (!(await konfirmasi({ judul: 'Simpan putusan?', pesan: 'Putusan bersifat final dan langsung mengubah dana.', ya: 'Ya, putuskan', bahaya: true }))) return; await panggil('adminSengketaPutus', { id: s.id, pemenang: v.pemenang, keputusan: v.keputusan, kembalikanStok: !!v.kembalikanStok, barangTidakSesuai: !!v.barangTidakSesuai }); sukses('Sengketa diputus.'); m.tutup(); ulang(); } });
    const m = modal({ judul: 'Putuskan sengketa ' + s.subId, isi: h('div', null, h('p', { class: 'redup' }, s.isi), f.el), lebar: true });
  }
}

/* ================= LAPORAN WARGA ================= */
export async function laporanWarga(ctx) {
  await daftarBerstatus(ctx, 'Laporan warga', 'Laporan produk, toko, ulasan, pengguna, live, dan chat dari pengguna.',
    [{ k: 'Baru', t: 'Baru' }, { k: 'Ditindak', t: 'Ditindak' }, { k: 'Ditolak', t: 'Ditolak' }, { k: '', t: 'Semua' }], 'Baru', (st) => panggil('adminLaporanDaftar', { status: st }),
    (r, ulang) => r.map(l => h('article', { class: 'kartu' }, h('div', { class: 'sebar', style: { flexWrap: 'wrap', gap: '8px' } }, h('div', null, h('span', { class: 'chip' }, l.tipe), ' ', h('b', null, l.target)), h('span', { class: 'status ' + (l.status === 'Baru' ? 'tunggu' : l.status === 'Ditindak' ? 'ok' : 'proses') }, l.status)),
      h('p', null, l.alasan), h('div', { class: 'redup' }, 'Pelapor: ' + l.pelapor + ' · ' + rel(l.dibuat)),
      l.status === 'Baru' ? h('div', { class: 'baris', style: { gap: '8px', flexWrap: 'wrap', marginTop: '8px' } },
        l.tipe === 'CHAT' ? tombol('Lihat percakapan', (b) => lihatChat(l, b), 'ghost sm', 'message') : null,
        tombol('Tindak', async (b) => { await tahan(b, async () => { await panggil('adminLaporanTangani', { id: l.id, putusan: 'Ditindak' }); sukses('Laporan ditandai ditindak. Lanjutkan tindakan di menu terkait.'); ulang(); }); }, 'sm'),
        tombol('Tolak laporan', async (b) => { await tahan(b, async () => { await panggil('adminLaporanTangani', { id: l.id, putusan: 'Ditolak' }); sukses('Laporan ditolak.'); ulang(); }); }, 'ghost sm')) : null)), 'Tidak ada laporan.');
  async function lihatChat(l, b) {
    await tahan(b, async () => {
      const r = await panggil('adminChatLaporan', { laporanId: l.id });
      modal({ judul: 'Percakapan terlapor', lebar: true, isi: h('div', { class: 'kolom' }, h('p', { class: 'redup' }, 'Akses chat ini tercatat di audit log.'), h('div', { class: 'chat-pesan', style: { maxHeight: '50dvh' } }, r.pesan.map(p => h('div', { class: 'gelembung' + (p.dari === 'P' ? ' saya' : ''), style: p.terlapor ? { outline: '2px solid var(--galat, #dc2626)' } : null }, p.isi, h('span', { class: 'waktu' }, ' ' + jam(p.waktu)))))) });
    });
  }
}

/* ================= PENALTI & BANDING ================= */
const KODE_PENALTI = [['BATAL_SEPIHAK', 'Pembatalan sepihak (3)'], ['TERLAMBAT_KIRIM', 'Terlambat kirim (2)'], ['BARANG_TIDAK_SESUAI', 'Barang tidak sesuai (10)'], ['SENGKETA_KALAH', 'Kalah sengketa (5)'], ['ALIH_TRANSAKSI', 'Alihkan transaksi (5)'], ['ULASAN_PALSU', 'Ulasan palsu (15)'], ['PENIPUAN', 'Penipuan (30)'], ['PRODUK_TERLARANG', 'Produk terlarang (5)'], ['LIVE_MELANGGAR', 'Live melanggar (5)']];
export async function penaltiBanding(ctx) {
  let f = 'Menunggu'; const chip = h('div'), isi = h('div', { class: 'kolom' });
  const muat = async () => {
    ganti(isi, skeleton(2, 90));
    try {
      const r = await panggil('adminBandingDaftar', { status: f });
      ganti(isi, r.length ? r.map(b => h('article', { class: 'kartu' }, h('div', { class: 'sebar', style: { flexWrap: 'wrap' } }, h('div', null, h('b', null, b.toko), h('div', { class: 'redup' }, b.aksi || '')), h('span', { class: 'status ' + (b.status === 'Menunggu' ? 'tunggu' : b.status === 'Diterima' ? 'ok' : 'gagal') }, b.status)), h('p', null, b.isi), b.balasan ? h('p', { class: 'redup' }, 'Balasan: ' + b.balasan) : null,
        b.status === 'Menunggu' ? h('div', { class: 'baris', style: { gap: '8px' } }, tombol('Balas banding', () => balas(b), '', 'message'), tombol('Pulihkan toko tanpa banding', () => pulih(b.sellerId), 'ghost sm')) : null)) : kosong('Tidak ada banding', '', null, 'flag'));
    } catch (e) { ganti(isi, kotakGalat(e, muat)); }
  };
  const gc = () => ganti(chip, pilihChip([{ k: 'Menunggu', t: 'Menunggu' }, { k: 'Diterima', t: 'Diterima' }, { k: 'Ditolak', t: 'Ditolak' }], f, (k) => { f = k; gc(); muat(); }));
  gc();
  ctx.setJudul('Penalti & banding', '', { noindex: true });
  ganti(ctx.wadah, kepalaHalaman('Penalti & banding', 'Beri penalti manual dan tanggapi banding penjual.', tombol('Beri penalti', beriPenalti, '', 'flag')), h('div', { style: { marginBottom: '12px' } }, chip), isi);
  await muat();

  function balas(b) {
    const f2 = formulir([{ k: 'putusan', label: 'Putusan', tipe: 'select', wajib: true, opsi: [{ v: 'TERIMA', t: 'Terima — pulihkan toko' }, { v: 'TOLAK', t: 'Tolak banding' }] }, { k: 'balasan', label: 'Balasan untuk penjual', tipe: 'textarea', wajib: true, minPanjang: 5 }, { k: 'hapusPoin', label: 'Reset poin penalti saat dipulihkan', tipe: 'checkbox' }], { putusan: 'TERIMA' },
      { label: 'Kirim balasan', batal: () => m.tutup(), kirim: async (v) => { await panggil('adminBandingBalas', { id: b.id, putusan: v.putusan, balasan: v.balasan, hapusPoin: !!v.hapusPoin }); sukses('Balasan terkirim.'); m.tutup(); muat(); } });
    const m = modal({ judul: 'Banding ' + b.toko, isi: h('div', null, h('p', null, b.isi), f2.el), lebar: true });
  }
  async function pulih(sellerId) { if (!(await konfirmasi({ judul: 'Pulihkan toko?', pesan: 'Status toko dikembalikan ke aktif.', ya: 'Pulihkan' }))) return; try { await panggil('adminTokoPulihkan', { sellerId }); sukses('Toko dipulihkan.'); muat(); } catch (e) { laporGalat(e); } }
  function beriPenalti() {
    const f2 = formulir([{ k: 'sellerId', label: 'ID Penjual', tipe: 'text', wajib: true, placeholder: 'SLR-…' }, { k: 'kode', label: 'Jenis pelanggaran', tipe: 'select', wajib: true, opsi: KODE_PENALTI.map(([v, t]) => ({ v, t })) }, { k: 'alasan', label: 'Alasan / bukti', tipe: 'textarea', bantu: 'Wajib untuk penipuan.' }], { kode: 'TERLAMBAT_KIRIM' },
      { label: 'Beri penalti', batal: () => m.tutup(), kirim: async (v) => { if (!(await konfirmasi({ judul: 'Beri penalti?', pesan: 'Poin penalti menurunkan skor amanah dan dapat membatasi toko.', ya: 'Ya, beri', bahaya: true }))) return; const r = await panggil('adminPenaltiBeri', v); sukses(`Penalti dicatat. Poin ${r.poin}, status ${r.status}.`); m.tutup(); } });
    const m = modal({ judul: 'Beri penalti manual', isi: f2.el });
  }
}

/* ================= MODERASI ULASAN ================= */
export async function ulasanModerasi(ctx) {
  await daftarBerstatus(ctx, 'Moderasi ulasan', 'Ulasan yang dilaporkan atau disembunyikan.',
    [{ k: 'Dilaporkan', t: 'Dilaporkan' }, { k: 'Disembunyi', t: 'Disembunyikan' }, { k: 'Semua', t: 'Semua' }], 'Dilaporkan', (st) => panggil('adminUlasanDaftar', { status: st }),
    (r, ulang) => r.map(u => h('article', { class: 'kartu' }, h('div', { class: 'sebar', style: { flexWrap: 'wrap' } }, h('div', null, bintang(u.rating), ' ', h('b', null, u.nama || u.pembeli || '')), h('div', { class: 'baris-rapat' }, u.laporan ? h('span', { class: 'status gagal' }, u.laporan + ' laporan') : null, h('span', { class: 'chip' }, u.status))),
      h('p', null, u.isi || u.komentar || ''), h('div', { class: 'redup' }, rel(u.waktu)),
      h('div', { class: 'baris', style: { gap: '8px', marginTop: '8px' } },
        u.status === 'Disembunyi' ? tombol('Tampilkan lagi', async (b) => { await tahan(b, async () => { await panggil('adminUlasanModerasi', { ulasanId: u.id, tampil: true }); sukses('Ulasan ditampilkan.'); ulang(); }); }, 'sm') : tombol('Sembunyikan', async (b) => {
          const a = await tanya({ judul: 'Sembunyikan ulasan', label: 'Alasan', area: true, ya: 'Sembunyikan' }); if (a === null) return;
          const pen = await konfirmasi({ judul: 'Beri penalti "ulasan palsu" ke toko?', pesan: 'Pilih ya hanya bila ulasan terbukti direkayasa penjual.', ya: 'Ya, beri penalti', tidak: 'Tidak' });
          await tahan(b, async () => { await panggil('adminUlasanModerasi', { ulasanId: u.id, tampil: false, alasan: a, penalti: pen }); sukses('Ulasan disembunyikan.'); ulang(); }); }, 'sm'),
        u.status !== 'Disembunyi' && u.laporan ? tombol('Biarkan tampil', async (b) => { await tahan(b, async () => { await panggil('adminUlasanModerasi', { ulasanId: u.id, tampil: true }); sukses('Laporan ditolak.'); ulang(); }); }, 'ghost sm') : null))), 'Tidak ada ulasan.');
}

/* ================= MODERASI LIVE ================= */
export async function liveModerasi(ctx) {
  await daftarBerstatus(ctx, 'Moderasi live', 'Pantau siaran dan hentikan yang melanggar ketentuan.',
    [{ k: 'Live', t: 'Sedang live' }, { k: 'Terjadwal', t: 'Terjadwal' }, { k: 'Selesai', t: 'Selesai' }, { k: 'Dibatalkan', t: 'Dibatalkan' }, { k: '', t: 'Semua' }], 'Live', (st) => panggil('adminLiveDaftar', { status: st }),
    (r, ulang) => r.map(l => h('article', { class: 'kartu' }, h('div', { class: 'baris', style: { gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' } }, h('div', { style: { width: '120px', flex: 'none' } }, gambar(l.sampul, l.judul, '', 120)),
      h('div', { style: { flex: '1 1 220px', minWidth: 0 } }, h('b', null, l.judul), h('div', { class: 'redup' }, `${l.toko.nama} · ${l.platform} · ${l.jumlahProduk} produk`), h('div', { class: 'redup' }, l.status === 'Live' ? `${angka(l.penonton)} penonton · ${angka(l.suka)} suka` : (l.jadwal ? tgl(l.jadwal, true) : '')), h('span', { class: 'status ' + (l.status === 'Live' ? 'ok' : 'proses') }, l.status))),
      ['Live', 'Terjadwal'].includes(l.status) ? h('div', { class: 'baris', style: { marginTop: '8px' } }, tombol('Hentikan siaran', async (b) => {
        const a = await tanya({ judul: 'Hentikan siaran', label: 'Alasan (dikirim ke penjual)', area: true, ya: 'Hentikan' }); if (a === null) return;
        const pen = await konfirmasi({ judul: 'Beri penalti toko?', pesan: 'Penalti "live melanggar" menambah poin penjual.', ya: 'Ya, beri penalti', tidak: 'Tanpa penalti' });
        await tahan(b, async () => { await panggil('adminLiveTurunkan', { liveId: l.id, alasan: a, penalti: pen }); sukses('Siaran dihentikan.'); ulang(); }); }, 'ghost', 'x')) : null)), 'Tidak ada sesi live.');
}
