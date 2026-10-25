// Portal admin 1: dasbor, statistik, verifikasi penjual, moderasi produk.
import { h, ikon, ganti, rp, angka, singkat, tgl, rel, gambar, debounce } from '../lib/dom.js';
import { panggil } from '../lib/api.js';
import { state } from '../lib/store.js';
import { href } from '../lib/router.js';
import { kosong, kotakGalat, skeleton, tahan, laporGalat, ok as sukses, konfirmasi, tanya, modal, formulir, kv, kartuStat, kepalaHalaman, pilihChip, tabel } from '../lib/ui.js';
import { tautan } from '../lib/komponen.js';

export const halaman = (ctx, judul, sub, aksi, isiFn) => {
  ctx.setJudul(judul, '', { noindex: true }); const isi = h('div');
  ganti(ctx.wadah, kepalaHalaman(judul, sub, ...(aksi || [])), isi);
  const jalan = async () => { ganti(isi, skeleton(3, 90)); try { await isiFn(isi, jalan); } catch (e) { ganti(isi, kotakGalat(e, jalan)); } };
  return jalan();
};

/** Grafik batang SVG sederhana. data: [{label, nilai}] */
export function grafikBatang(data, { tinggi = 140, format = singkat, warna = 'var(--primer)' } = {}) {
  const maks = Math.max(1, ...data.map(d => d.nilai)), n = data.length, lebar = 100 / Math.max(n, 1);
  const NS = 'http://www.w3.org/2000/svg'; const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 100 ${tinggi / 4}`); svg.setAttribute('preserveAspectRatio', 'none'); svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Grafik: ' + data.map(d => d.label + ' ' + format(d.nilai)).join(', ')); svg.style.cssText = `width:100%;height:${tinggi}px;display:block`;
  data.forEach((d, i) => {
    const t = Math.max(0.6, (d.nilai / maks) * (tinggi / 4 - 2)); const r = document.createElementNS(NS, 'rect');
    r.setAttribute('x', i * lebar + lebar * 0.15); r.setAttribute('width', lebar * 0.7); r.setAttribute('y', tinggi / 4 - t); r.setAttribute('height', t); r.setAttribute('rx', 0.6); r.setAttribute('fill', warna);
    const ti = document.createElementNS(NS, 'title'); ti.textContent = d.label + ': ' + format(d.nilai); r.append(ti); svg.append(r);
  });
  return h('div', null, svg, h('div', { class: 'sebar redup', style: { fontSize: '12px', marginTop: '4px' } }, h('span', null, data[0] ? data[0].label : ''), h('span', null, data.length ? data[data.length - 1].label : '')));
}

const ANTRI = [['verifikasiPenjual', 'Verifikasi penjual', '/admin/verifikasi', 'shield'], ['produkMenunggu', 'Produk menunggu', '/admin/produk', 'box'], ['laporanBaru', 'Laporan warga', '/admin/laporan', 'alert'],
  ['bandingMenunggu', 'Banding', '/admin/penalti', 'flag'], ['usulBlokir', 'Usulan blokir', '/admin/blokir', 'lock'], ['sengketaTerbuka', 'Sengketa', '/admin/sengketa', 'flag'], ['penarikanMenunggu', 'Penarikan dana', '/admin/penarikan', 'wallet']];

/* ================= DASBOR ================= */
export async function dasbor(ctx) {
  await halaman(ctx, 'Dasbor admin', 'Ringkasan operasional GMA Store.', null, async (isi) => {
    const d = await panggil('adminDashboard');
    const antri = ANTRI.filter(([k]) => d.antri && d.antri[k] !== undefined);
    const total = antri.reduce((a, [k]) => a + (d.antri[k] || 0), 0);
    const r = d.ringkas || {}; const g = d.grafik || [];
    ganti(isi,
      h('section', { class: 'kartu' }, h('div', { class: 'kartu-judul' }, h('h3', null, 'Antrean kerja'), h('span', { class: 'chip' }, total ? total + ' menunggu' : 'Semua beres')),
        h('div', { class: 'grid g-4 res' }, antri.map(([k, t, p, ik]) => tautan(p, 'kartu stat', h('div', { class: 'baris-rapat redup' }, ikon(ik), h('span', null, t)), h('div', { class: 'nilai', style: { fontSize: '1.6rem', fontWeight: 700, color: d.antri[k] ? 'var(--hangat, #c2410c)' : 'inherit' } }, angka(d.antri[k] || 0)))))),
      h('div', { class: 'grid g-4 res', style: { marginTop: '16px' } },
        kartuStat('Pengguna', angka(r.penggunaTotal), 'users'), kartuStat('Penjual aktif', angka(r.penjualAktif), 'store'), kartuStat('Produk aktif', angka(r.produkAktif), 'box'), kartuStat('Pesanan 7 hari', angka(r.pesanan7Hari), 'package'),
        kartuStat('GMV 7 hari', rp(r.gmv7Hari), 'chart'), kartuStat('Pendapatan platform 7 hari', rp(r.pendapatan7Hari), 'wallet'),
        kartuStat('Hari ini', angka(d.hariIni && d.hariIni.pesanan), 'cart', d.hariIni ? rp(d.hariIni.gmv) : ''), kartuStat('Kemarin', angka(d.kemarin && d.kemarin.pesanan), 'cart', d.kemarin ? rp(d.kemarin.gmv) : '')),
      h('div', { class: 'dua-kolom', style: { marginTop: '16px' } },
        h('section', { class: 'kartu' }, h('h3', null, 'GMV harian'), g.length ? grafikBatang(g.map(x => ({ label: tgl(x.tgl), nilai: x.gmv })), { format: rp }) : kosong('Belum ada data', 'Grafik muncul setelah ada pesanan.', null, 'chart')),
        h('section', { class: 'kartu' }, h('h3', null, 'Pesanan harian'), g.length ? grafikBatang(g.map(x => ({ label: tgl(x.tgl), nilai: x.pesanan })), { format: angka, warna: 'var(--hangat, #f97316)' }) : kosong('Belum ada data', '', null, 'chart'))),
      h('div', { class: 'dua-kolom', style: { marginTop: '16px' } },
        h('section', { class: 'kartu' }, h('h3', null, 'Kapasitas sistem'), (d.kapasitas && d.kapasitas.length) ? h('div', { class: 'kolom' }, d.kapasitas.map(k => h('div', null, h('div', { class: 'sebar' }, h('span', null, k.grup + ' · ' + k.periode), h('b', null, k.persen + '%')), h('div', { class: 'meter', role: 'progressbar', 'aria-valuenow': k.persen, 'aria-valuemin': 0, 'aria-valuemax': 100, style: { height: '8px', background: 'var(--garis)', borderRadius: '99px', overflow: 'hidden' } }, h('div', { style: { width: Math.min(100, k.persen) + '%', height: '100%', background: k.persen > 80 ? 'var(--galat, #dc2626)' : k.persen > 60 ? '#d97706' : 'var(--primer)' } }))))) : h('p', { class: 'redup' }, 'Belum ada catatan kapasitas.')),
        h('section', { class: 'kartu' }, h('h3', null, 'Sistem'), kv([['Cadangan terakhir', d.cadanganTerakhir ? tgl(d.cadanganTerakhir, true) : 'Belum pernah'], ['Mode gateway', (state.situs && state.situs.modeGateway) || ''], ['Mode AI', (state.situs && state.situs.modeAi) || '']]),
          tautan('/admin/audit', 'btn ghost sm', ikon('shield'), 'Audit & kesehatan'))));
  });
}

/* ================= STATISTIK ================= */
export async function statistik(ctx) {
  let mode = 'harian'; const hari = (n) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
  let dari = hari(29), sampai = hari(0);
  const hasil = h('div');
  const muat = async () => {
    ganti(hasil, skeleton(2, 120));
    try {
      const r = await panggil('adminStatistik', { mode, dari, sampai }); const b = r.baris || [];
      ganti(hasil,
        h('div', { class: 'grid g-4 res' }, kartuStat('Pesanan', angka(r.total && r.total.pesanan), 'package'), kartuStat('GMV', rp(r.total && r.total.gmv), 'chart'), kartuStat('Pendapatan platform', rp(r.total && r.total.pendapatan), 'wallet'), kartuStat('Rata-rata nilai pesanan', rp(r.rataNilaiPesanan), 'cart')),
        b.length ? h('section', { class: 'kartu', style: { marginTop: '16px' } }, h('h3', null, 'GMV per periode'), grafikBatang(b.map(x => ({ label: x.periode, nilai: x.gmv })), { format: rp })) : null,
        h('section', { class: 'kartu', style: { marginTop: '16px' } }, h('h3', null, 'Rincian'), tabel([{ judul: 'Periode', k: 'periode' }, { judul: 'Pesanan', kanan: true, tampil: x => angka(x.pesanan) }, { judul: 'GMV', kanan: true, tampil: x => rp(x.gmv) }, { judul: 'Pendapatan', kanan: true, tampil: x => rp(x.pendapatan) }, { judul: 'Pembeli baru', kanan: true, tampil: x => angka(x.pembeliBaru) }, { judul: 'Penjual baru', kanan: true, tampil: x => angka(x.penjualBaru) }, { judul: 'Pengunjung', kanan: true, tampil: x => angka(x.pengunjung) }], b, { kosongTeks: 'Tidak ada data pada rentang ini.', caption: 'Statistik per periode' })));
    } catch (e) { ganti(hasil, kotakGalat(e, muat)); }
  };
  const chip = h('div'); const gc = () => ganti(chip, pilihChip([{ k: 'harian', t: 'Harian' }, { k: 'mingguan', t: 'Mingguan' }, { k: 'bulanan', t: 'Bulanan' }], mode, (k) => { mode = k; gc(); muat(); }));
  gc();
  const inDari = h('input', { type: 'date', class: 'input', value: dari, 'aria-label': 'Dari tanggal', onchange: (e) => { dari = e.target.value; muat(); } });
  const inSampai = h('input', { type: 'date', class: 'input', value: sampai, 'aria-label': 'Sampai tanggal', onchange: (e) => { sampai = e.target.value; muat(); } });
  ctx.setJudul('Statistik', '', { noindex: true });
  ganti(ctx.wadah, kepalaHalaman('Statistik', 'Pertumbuhan pesanan, GMV, dan pengguna.'), h('div', { class: 'baris', style: { flexWrap: 'wrap', marginBottom: '12px', alignItems: 'center' } }, chip, inDari, h('span', { class: 'redup' }, 's/d'), inSampai), hasil);
  await muat();
}

/* ================= VERIFIKASI PENJUAL ================= */
const KEL_V = { Menunggu: 'tunggu', Disetujui: 'ok', Ditolak: 'gagal', Revisi: 'proses' };
export async function verifikasiPenjual(ctx) {
  let f = 'Menunggu', q = ''; const daftar = h('div'); const chip = h('div');
  const muat = async () => {
    ganti(daftar, skeleton(3, 64));
    try {
      const r = await panggil('adminPenjualDaftar', { q, status: f });
      ganti(daftar, tabel([{ judul: 'Usaha', tampil: x => h('div', null, h('b', null, x.namaUsaha), h('div', { class: 'redup' }, x.pemilik + ' · ' + (x.kota || '-'))) }, { judul: 'Toko', tampil: x => x.kodeToko + ' · ' + x.tokoStatus },
        { judul: 'Verifikasi', tampil: x => h('span', { class: 'status ' + (KEL_V[x.verif] || '') }, x.verif) }, { judul: 'Akun', k: 'akun' }, { judul: 'Skor', kanan: true, tampil: x => x.skor + ' / ' + x.poin + ' poin' },
        { judul: 'Daftar', tampil: x => rel(x.dibuat) }, { judul: '', aksi: true, tampil: x => h('button', { class: 'btn sm', type: 'button', onclick: (e) => { e.stopPropagation(); detail(x.sellerId); } }, 'Tinjau') }],
        r, { kosongTeks: f === 'Menunggu' ? 'Tidak ada pendaftar yang menunggu. 🎉' : 'Tidak ada data.', saatKlik: x => detail(x.sellerId), caption: 'Daftar penjual' }));
    } catch (e) { ganti(daftar, kotakGalat(e, muat)); }
  };
  const gc = () => ganti(chip, pilihChip([{ k: 'Menunggu', t: 'Menunggu' }, { k: 'Revisi', t: 'Revisi' }, { k: 'Disetujui', t: 'Disetujui' }, { k: 'Ditolak', t: 'Ditolak' }, { k: '', t: 'Semua' }], f, (k) => { f = k; gc(); muat(); }));
  gc();
  const cari = h('input', { class: 'input', type: 'search', placeholder: 'Cari nama usaha, pemilik, atau kode toko', 'aria-label': 'Cari penjual', oninput: debounce((e) => { q = e.target.value.trim(); muat(); }, 350) });
  ctx.setJudul('Verifikasi penjual', '', { noindex: true });
  ganti(ctx.wadah, kepalaHalaman('Verifikasi penjual', 'Tinjau dokumen dan putuskan pendaftaran toko.'), h('div', { class: 'kolom', style: { marginBottom: '12px' } }, cari, chip), daftar);
  await muat();

  async function detail(sellerId) {
    const m = modal({ judul: 'Memuat…', isi: skeleton(3, 60), lebar: true }); let dlg = m;
    try {
      const d = await panggil('adminPenjualDetail', { sellerId });
      const tampilDok = h('div', { class: 'kolom' });
      const lihat = async (dok, tombol) => {
        await tahan(tombol, async () => {
          const r = await panggil('adminDokumenLihat', { docId: dok.id });
          const dlg = modal({ judul: r.jenis || dok.jenis, lebar: true, isi: /^image\//.test(r.mime) ? h('img', { src: r.dataUrl, alt: 'Dokumen ' + (r.jenis || ''), style: { maxWidth: '100%', borderRadius: '8px' } }) : h('div', null, h('p', null, 'Dokumen berformat ', r.mime), h('a', { class: 'btn', href: r.dataUrl, download: (r.jenis || 'dokumen') }, ikon('download'), 'Unduh')) });
        });
      };
      ganti(tampilDok, (d.dokumen || []).length ? d.dokumen.map(dok => h('div', { class: 'baris sebar' }, h('div', null, h('b', null, dok.jenis), h('div', { class: 'redup' }, dok.status + ' · ' + rel(dok.dibuat))), (() => { const b = h('button', { class: 'btn ghost sm', type: 'button' }, ikon('eye'), 'Lihat'); b.onclick = () => lihat(dok, b); return b; })())) : h('p', { class: 'redup' }, 'Belum ada dokumen diunggah.'));
      const catatan = h('textarea', { class: 'input', id: 'verif-catatan', rows: 3, placeholder: 'Catatan untuk penjual (wajib bila menolak / meminta revisi)', 'aria-label': 'Catatan keputusan' });
      const putus = async (putusan, tombol) => {
        if (putusan !== 'SETUJU' && !catatan.value.trim()) { catatan.focus(); return laporGalat(new Error('Isi catatan agar penjual tahu apa yang harus diperbaiki.')); }
        if (putusan === 'TOLAK' && !(await konfirmasi({ judul: 'Tolak pendaftaran?', pesan: 'Penjual akan diberi tahu alasannya.', ya: 'Ya, tolak', bahaya: true }))) return;
        await tahan(tombol, async () => { await panggil('adminPenjualVerifikasi', { sellerId, putusan, catatan: catatan.value.trim() }); sukses(putusan === 'SETUJU' ? 'Penjual disetujui.' : putusan === 'TOLAK' ? 'Pendaftaran ditolak.' : 'Revisi diminta.'); dlg.tutup(); muat(); });
      };
      const bt = (t, p, kls) => { const b = h('button', { class: 'btn ' + (kls || ''), type: 'button' }, t); b.onclick = () => putus(p, b); return b; };
      const isiEl = h('div', { class: 'kolom' },
        kv([['Pemilik', d.pemilik], ['Email', d.user && d.user.email], ['HP', d.user && d.user.hp], ['Status verifikasi', d.verif], ['Status akun', d.akun], ['Skor amanah', d.skor], ['Toko', d.toko ? `${d.toko.nama} (${d.toko.kode}) · ${d.toko.kota || ''}` : ''], ['Alamat toko', d.toko && d.toko.alamat], ['Rekening', d.rekening ? `${d.rekening.bank} · ${d.rekening.noRek} · a.n. ${d.rekening.atasNama}` : 'Belum diisi'], ['Catatan sebelumnya', d.catatan]]),
        h('h3', null, 'Dokumen'), tampilDok,
        (d.penalti && d.penalti.length) ? h('div', null, h('h3', null, 'Riwayat penalti'), h('ul', null, d.penalti.map(p => h('li', null, `${p.kode || p.Kode} — ${p.alasan || p.ref || ''}`)))) : null,
        h('label', { for: 'verif-catatan', class: 'tebal' }, 'Keputusan'), catatan);
      m.tutup(); dlg = modal({ judul: d.namaUsaha, isi: isiEl, lebar: true, kaki: h('div', { class: 'baris', style: { flexWrap: 'wrap', gap: '8px' } }, bt('Setujui', 'SETUJU'), bt('Minta revisi', 'MINTA_REVISI', 'sekunder'), bt('Tolak', 'TOLAK', 'ghost')) });
    } catch (e) { m.tutup(); laporGalat(e); }
  }
}

/* ================= MODERASI PRODUK ================= */
export async function moderasiProduk(ctx) {
  const daftar = h('div', { class: 'kolom' });
  const muat = async () => {
    ganti(daftar, skeleton(3, 120));
    try {
      const r = await panggil('adminProdukAntrian');
      ganti(daftar, r.length ? r.map(kartu) : kosong('Antrean kosong', 'Tidak ada produk yang menunggu peninjauan.', null, 'box'));
    } catch (e) { ganti(daftar, kotakGalat(e, muat)); }
  };
  function kartu(p) {
    const putus = async (putusan, tombol) => {
      let alasan = '', penalti = false;
      if (putusan === 'TOLAK') { alasan = await tanya({ judul: 'Tolak produk', label: 'Alasan penolakan', area: true, ya: 'Tolak produk', bantu: 'Alasan ini dikirim ke penjual.' }); if (alasan === null) return; }
      await tahan(tombol, async () => { await panggil('adminProdukPutus', { id: p.id, putusan, alasan, penalti }); sukses(putusan === 'SETUJU' ? 'Produk disetujui & tayang.' : 'Produk ditolak.'); muat(); });
    };
    const bt = (t, k, kls) => { const b = h('button', { class: 'btn ' + (kls || ''), type: 'button' }, t); b.onclick = () => putus(k, b); return b; };
    return h('article', { class: 'kartu' }, h('div', { class: 'baris', style: { alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' } },
      h('div', { style: { width: '96px', flex: 'none' } }, gambar((p.foto || [])[0], p.nama, '', 96)),
      h('div', { style: { flex: '1 1 240px', minWidth: 0 } }, h('h3', null, p.nama), h('div', { class: 'redup' }, `${p.toko} (${p.tokoKode}) · ${p.kategori} · ${rp(p.harga)}`),
        h('div', { class: 'baris-rapat', style: { margin: '6px 0' } }, p.risiko === 'Tinggi' ? h('span', { class: 'status gagal' }, 'Risiko tinggi') : h('span', { class: 'status proses' }, 'Risiko ' + (p.risiko || 'rendah')), p.alasanSistem ? h('span', { class: 'chip' }, 'Sistem: ' + p.alasanSistem) : null),
        h('p', { class: 'klem-2' }, p.deskripsi || ''), (p.foto || []).length > 1 ? h('div', { class: 'baris-rapat' }, p.foto.slice(1, 5).map(f => gambar(f, '', '', 48))) : null,
        h('div', { class: 'redup' }, 'Diubah ' + rel(p.diubah)))),
      h('div', { class: 'baris', style: { marginTop: '12px', gap: '8px' } }, bt('Setujui', 'SETUJU'), bt('Tolak', 'TOLAK', 'ghost')));
  }
  ctx.setJudul('Moderasi produk', '', { noindex: true });
  ganti(ctx.wadah, kepalaHalaman('Moderasi produk', 'Tinjau produk baru dan produk berisiko sebelum tayang.'), daftar);
  await muat();
}
