// Aplikasi kurir GMA: paket tersedia, tugas saya (antar / gagal antar / COD), kas COD, akun.
import { h, ikon, ganti, rp, angka, rel, tgl } from '../lib/dom.js';
import { panggil } from '../lib/api.js';
import { state } from '../lib/store.js';
import { kosong, kotakGalat, skeleton, tahan, ok as sukses, gagal, konfirmasi, tanya, modal, formulir, kv, kepalaHalaman } from '../lib/ui.js';
import { keluar } from '../lib/layout.js';
import { href } from '../lib/router.js';

const tombol = (teks, fn, kls = '', ik) => { const b = h('button', { class: 'btn ' + kls, type: 'button' }, ik ? ikon(ik) : null, teks); b.onclick = () => fn(b); return b; };

/** Kerangka halaman kurir dengan muat-ulang & penanganan galat. */
async function muat(ctx, judul, sub, bangun) {
  ctx.setJudul(judul, '', { noindex: true });
  const isi = h('div', { class: 'kolom' });
  ganti(ctx.wadah, kepalaHalaman(judul, sub), isi);
  const ulang = async () => {
    ganti(isi, skeleton(3, 110));
    try { await bangun(isi, ulang); } catch (e) { ganti(isi, kotakGalat(e, ulang)); }
  };
  await ulang();
}

const lencanaCod = (cod, tagihan) => cod
  ? h('span', { class: 'status tunggu' }, tagihan ? 'COD · ' + rp(tagihan) : 'COD · sudah dibayar')
  : h('span', { class: 'status ok' }, 'Prabayar');

/* ===== Paket tersedia ===== */
export async function tersedia(ctx) {
  await muat(ctx, 'Paket tersedia', 'Paket siap kirim di wilayah Anda. Alamat lengkap terbuka setelah paket diambil.', async (isi, ulang) => {
    const daftar = await panggil('kurirTersedia');
    if (!daftar.length) return ganti(isi, kosong('Belum ada paket siap kirim', 'Tarik layar ke bawah atau muat ulang beberapa menit lagi.', tombol('Muat ulang', () => ulang(), 'sekunder', 'refresh'), 'package'));
    ganti(isi, h('p', { class: 'redup' }, daftar.length + ' paket menunggu kurir'), ...daftar.map((p) => h('article', { class: 'kartu' },
      h('div', { class: 'sebar' }, h('b', null, p.invoice), lencanaCod(p.cod, p.tagihanCod)),
      h('div', { class: 'redup', style: { margin: '6px 0' } }, `${p.toko} (${p.kotaAsal || '–'}) → ${p.kotaTujuan || '–'}`),
      h('div', { class: 'sebar' }, h('span', { class: 'redup' }, `${angka(p.beratGram)} g · ongkir ${rp(p.ongkir)} · siap ${rel(p.siapSejak)}`),
        tombol('Ambil paket', async (b) => {
          if (!(await konfirmasi({ judul: 'Ambil paket ' + p.invoice + '?', isi: p.cod ? 'Ini paket COD. Anda wajib menerima uang tepat ' + rp(p.tagihanCod) + ' dari pembeli.' : 'Paket akan masuk ke daftar tugas Anda.', ya: 'Ambil' }))) return;
          await tahan(b, async () => { try { const r = await panggil('kurirAmbil', { subId: p.subId }); sukses('Diambil. Resi ' + r.resi); ctx.navigasi('/kurir/tugas'); } catch (e) { gagal(e.message); ulang(); } });
        }, '', 'package')))));
  });
}

/* ===== Tugas saya ===== */
export async function tugas(ctx) {
  await muat(ctx, 'Tugas saya', 'Paket yang sedang Anda bawa dan riwayat terakhir.', async (isi, ulang) => {
    const r = await panggil('kurirTugasSaya');
    const aktif = r.aktif.length ? r.aktif.map((t) => kartuTugas(t, ulang)) : [kosong('Tidak ada paket di tangan Anda', 'Ambil paket dari tab Tersedia.', h('a', { class: 'btn', href: href('/kurir'), 'data-tautan': '' }, 'Lihat paket tersedia'), 'truck')];
    const riwayat = r.riwayat.length ? h('section', { class: 'kartu' }, h('h3', null, 'Riwayat terakhir'), h('ul', { class: 'daftar-polos' }, r.riwayat.map((x) => h('li', { class: 'sebar' },
      h('span', null, h('b', null, x.invoice), x.catatan ? h('div', { class: 'redup' }, x.catatan) : null),
      h('span', { class: 'status ' + (x.status === 'Dibatalkan' ? 'gagal' : 'ok') }, x.status))))) : null;
    ganti(isi, ...aktif, riwayat);
  });
}

function kartuTugas(t, ulang) {
  const maps = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent([t.alamat, t.kota, t.provinsi].filter(Boolean).join(', '));
  return h('article', { class: 'kartu' },
    h('div', { class: 'sebar' }, h('b', null, t.invoice), lencanaCod(t.cod, t.tagihanCod)),
    h('div', { class: 'redup' }, 'Dari ' + t.toko + (t.tokoKota ? ' (' + t.tokoKota + ')' : '') + ' · diambil ' + rel(t.diambil)),
    h('hr'),
    kv([['Penerima', t.penerima], ['Telepon', h('a', { href: 'tel:' + (t.hp || '') }, t.hp || '–')], ['Alamat', [t.alamat, t.kota, t.provinsi, t.kodePos].filter(Boolean).join(', ')], ['Catatan pembeli', t.catatan || '–']]),
    h('ul', { class: 'daftar-polos', style: { margin: '8px 0' } }, t.barang.map((b) => h('li', null, b))),
    t.tagihanCod ? h('div', { class: 'info-kotak' }, 'Terima uang tunai tepat ', h('b', null, rp(t.tagihanCod)), ' dari pembeli sebelum menyerahkan paket.') : null,
    h('div', { class: 'baris', style: { gap: '8px', flexWrap: 'wrap', marginTop: '10px' } },
      h('a', { class: 'btn sekunder', href: maps, target: '_blank', rel: 'noopener' }, ikon('pin'), 'Buka peta'),
      tombol('Selesai antar', () => selesai(t, ulang), '', 'check'),
      tombol('Gagal antar', () => gagalAntar(t, ulang), 'bahaya', 'x')));
}

function selesai(t, ulang) {
  const skema = [];
  if (t.tagihanCod) skema.push({ k: 'jumlah', label: 'Uang COD yang diterima (Rp)', tipe: 'number', min: 0, wajib: true, bantu: 'Harus tepat ' + rp(t.tagihanCod) + '. Bila ada selisih, hubungi admin dan jangan serahkan paket.' });
  skema.push({ k: 'bukti', label: 'Foto bukti paket diterima (opsional)', tipe: 'file', jenisBerkas: 'bukti', simpanId: true, pratinjau: true });
  const f = formulir(skema, {}, { label: 'Konfirmasi selesai', batal: () => m.tutup(), kirim: async (v) => {
    const r = await panggil('kurirSelesaiAntar', { subId: t.subId, jumlahDiterima: t.tagihanCod ? v.jumlah : undefined, buktiFileId: v.bukti || undefined });
    m.tutup(); sukses('Paket ' + t.invoice + ' selesai.' + (t.tagihanCod ? ' Kas Anda ' + rp(r.kasKurir) + '.' : '')); ulang();
  } });
  const m = modal({ judul: 'Selesai antar ' + t.invoice, isi: f.el });
}

async function gagalAntar(t, ulang) {
  const alasan = await tanya({ judul: 'Gagal antar ' + t.invoice, label: 'Alasan', area: true, wajib: true, ya: 'Laporkan gagal', bantu: t.cod ? 'Pesanan COD akan dibatalkan dan stok dikembalikan.' : 'Dana dikembalikan ke pembeli.' });
  if (!alasan) return;
  try { await panggil('kurirGagalAntar', { subId: t.subId, alasan }); sukses('Dilaporkan sebagai gagal antar.'); ulang(); } catch (e) { gagal(e.message); }
}

/* ===== Kas COD ===== */
export async function kas(ctx) {
  await muat(ctx, 'Kas COD', 'Uang tunai COD yang sedang Anda pegang. Setorkan ke Admin Keuangan.', async (isi) => {
    const r = await panggil('kurirKasSaya');
    ganti(isi,
      h('div', { class: 'kartu stat' }, h('span', { class: 'label' }, 'Kas dipegang'), h('div', { class: 'nilai' }, rp(r.kasDipegang)), h('small', null, r.kasDipegang > 0 ? 'Segera setor ke Admin Keuangan.' : 'Tidak ada uang tunai yang harus disetor.')),
      h('section', { class: 'kartu' }, h('h3', null, 'Mutasi terakhir'),
        r.mutasi.length ? h('ul', { class: 'daftar-polos' }, r.mutasi.map((l) => h('li', { class: 'sebar' },
          h('span', null, h('div', null, l.ket), h('small', { class: 'redup' }, rel(l.waktu))),
          h('b', { class: Number(l.jumlah) < 0 ? 'galat-teks' : '' }, (Number(l.jumlah) > 0 ? '+' : '') + rp(l.jumlah))))) : kosong('Belum ada mutasi', '', null, 'wallet')));
  });
}

/* ===== Akun ===== */
export async function akun(ctx) {
  ctx.setJudul('Akun kurir', '', { noindex: true });
  const u = state.user || {};
  ganti(ctx.wadah, kepalaHalaman('Akun kurir', ''),
    h('div', { class: 'kartu baris', style: { flexWrap: 'nowrap' } }, h('span', { class: 'avatar', style: { width: '56px', height: '56px', fontSize: '20px' } }, (u.nama || '?')[0]),
      h('div', { class: 'isi' }, h('div', { class: 'tebal' }, u.nama), h('small', { class: 'redup' }, u.email || ''))),
    h('div', { class: 'kolom', style: { marginTop: '12px' } },
      h('a', { class: 'btn sekunder', href: href('/akun') }, ikon('user'), 'Profil & keamanan'),
      h('button', { class: 'btn sekunder', type: 'button', onclick: keluar }, ikon('logout'), 'Keluar')));
}
