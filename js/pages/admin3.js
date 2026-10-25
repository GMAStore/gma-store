// Portal admin 3: master data & sistem (pengguna, komunitas, kategori, kurir, voucher, pengaturan, kunci, blokir, audit).
import { h, ikon, ganti, rp, angka, tgl, rel, debounce, salin } from '../lib/dom.js';
import { panggil } from '../lib/api.js';
import { state } from '../lib/store.js';
import { kosong, kotakGalat, skeleton, tahan, laporGalat, ok as sukses, gagal, konfirmasi, tanya, modal, formulir, status, kv, kartuStat, kepalaHalaman, pilihChip, tabel } from '../lib/ui.js';
import { halaman } from './admin.js';

const tombol = (teks, fn, kls = '', ik) => { const b = h('button', { class: 'btn ' + kls, type: 'button' }, ik ? ikon(ik) : null, teks); b.onclick = () => fn(b); return b; };
const punya = (...p) => ((state.user && state.user.peran) || []).some(x => p.includes(x));
/** Modal berisi formulir. simpan(nilai) harus melempar saat gagal; sukses menutup modal. */
function modalForm(judul, skema, awal, simpan, label = 'Simpan', info) {
  let m; const f = formulir(skema, awal, { label, batal: () => m.tutup(), kirim: async (v) => { await simpan(v); m.tutup(); } });
  m = modal({ judul, isi: h('div', null, info || null, f.el), lebar: skema.length > 5 }); return m;
}
const angkaOpsional = (v) => (v === '' || v === undefined || v === null ? 0 : Number(v));
const KEL = { Aktif: 'ok', Ditangguhkan: 'tunggu', Diblokir: 'gagal' };

/* ================= PENGGUNA ================= */
export async function pengguna(ctx) {
  let q = '', peran = '', st = ''; const daftar = h('div');
  const muat = async () => {
    ganti(daftar, skeleton(3, 56));
    try {
      const r = await panggil('adminUserDaftar', { q, peran, status: st });
      ganti(daftar, tabel([{ judul: 'Nama', tampil: u => h('div', null, h('b', null, u.nama), h('div', { class: 'redup' }, u.email)) }, { judul: 'HP', k: 'hp' }, { judul: 'Peran', tampil: u => (u.peran || '').split(',').map(x => h('span', { class: 'chip', style: { marginRight: '4px' } }, x)) },
        { judul: 'Status', tampil: u => h('span', { class: 'status ' + (KEL[u.status] || '') }, u.status) }, { judul: 'Login terakhir', tampil: u => u.loginTerakhir ? rel(u.loginTerakhir) : 'Belum pernah' },
        { judul: '', aksi: true, tampil: u => u.status === 'Diblokir' ? '' : (u.status === 'Aktif' ? tombol('Tangguhkan', () => ubahStatus(u, 'Ditangguhkan'), 'ghost sm') : tombol('Aktifkan', () => ubahStatus(u, 'Aktif'), 'sm')) }], r, { kosongTeks: 'Tidak ada pengguna yang cocok.', caption: 'Daftar pengguna' }));
    } catch (e) { ganti(daftar, kotakGalat(e, muat)); }
  };
  async function ubahStatus(u, baru) {
    const alasan = baru === 'Aktif' ? '' : await tanya({ judul: 'Tangguhkan ' + u.nama, label: 'Alasan', area: true, ya: 'Tangguhkan', bantu: 'Pengguna tidak bisa masuk selama ditangguhkan.' });
    if (alasan === null) return; try { await panggil('adminUserStatus', { userId: u.id, status: baru, alasan }); sukses('Status diperbarui.'); muat(); } catch (e) { laporGalat(e); }
  }
  const cari = h('input', { class: 'input', type: 'search', placeholder: 'Cari nama, email, atau HP', 'aria-label': 'Cari pengguna', oninput: debounce((e) => { q = e.target.value.trim(); muat(); }, 350) });
  const sel = (label, opsi, set) => h('select', { class: 'input', 'aria-label': label, onchange: (e) => { set(e.target.value); muat(); } }, opsi.map(([v, t]) => h('option', { value: v }, t)));
  const aksi = [];
  if (punya('SUPER_ADMIN')) aksi.push(tombol('Tambah staf admin', tambahStaf, '', 'plus'));
  aksi.push(tombol('Buat akun kurir', buatKurir, 'ghost', 'truck'));
  ctx.setJudul('Pengguna', '', { noindex: true });
  ganti(ctx.wadah, kepalaHalaman('Pengguna', 'Kelola akun pembeli, penjual, staf, dan kurir.', ...aksi),
    h('div', { class: 'baris', style: { flexWrap: 'wrap', gap: '8px', marginBottom: '12px' } }, cari, sel('Filter peran', [['', 'Semua peran'], ['PEMBELI', 'Pembeli'], ['PENJUAL', 'Penjual'], ['STAF_TOKO', 'Staf toko'], ['KURIR', 'Kurir'], ['ADMIN_KOMUNITAS', 'Admin komunitas'], ['ADMIN_OPS', 'Admin ops'], ['ADMIN_KEU', 'Admin keuangan'], ['SUPER_ADMIN', 'Super admin']], v => peran = v), sel('Filter status', [['', 'Semua status'], ['Aktif', 'Aktif'], ['Ditangguhkan', 'Ditangguhkan'], ['Diblokir', 'Diblokir']], v => st = v)), daftar);
  await muat();

  function tampilSandi(hasil, judul) {
    const kode = hasil.sandiSementara || hasil.sandi || '';
    const m = modal({ judul, isi: h('div', { class: 'kolom' }, h('p', null, 'Akun dibuat untuk ', h('b', null, hasil.email), '.'), h('div', { class: 'info-kotak' }, 'Sandi sementara (hanya tampil sekali — catat atau salin sekarang):'),
      h('div', { class: 'baris', style: { gap: '8px' } }, h('code', { style: { fontSize: '1.25rem', padding: '8px 12px', background: 'var(--latar-2, #f3f2ff)', borderRadius: '8px', userSelect: 'all' } }, kode), tombol('Salin', async () => { try { await salin(kode); sukses('Tersalin.'); } catch (e) { gagal('Salin manual saja.'); } }, 'ghost sm', 'copy')), h('p', { class: 'redup' }, 'Minta pengguna mengganti sandi setelah masuk pertama.')), kaki: tombol('Sudah saya catat', () => m.tutup()) });
  }
  function tambahStaf() {
    modalForm('Tambah staf admin', [{ k: 'peran', label: 'Peran', tipe: 'select', wajib: true, opsi: [{ v: 'ADMIN_OPS', t: 'Admin Operasional' }, { v: 'ADMIN_KEU', t: 'Admin Keuangan' }, { v: 'ADMIN_KOMUNITAS', t: 'Admin Komunitas' }] }, { k: 'nama', label: 'Nama', tipe: 'text', wajib: true }, { k: 'email', label: 'Email', tipe: 'email', wajib: true }, { k: 'hp', label: 'No. HP', tipe: 'tel' }, { k: 'komunitasId', label: 'ID Komunitas (untuk Admin Komunitas)', tipe: 'text', placeholder: 'COM-0001' }],
      { peran: 'ADMIN_OPS' }, async (v) => { const r = await panggil('adminStafBuat', v); sukses('Staf dibuat.'); tampilSandi(r, 'Akun staf dibuat'); muat(); }, 'Buat akun');
  }
  function buatKurir() {
    modalForm('Buat akun kurir GMA', [{ k: 'nama', label: 'Nama kurir', tipe: 'text', wajib: true }, { k: 'email', label: 'Email', tipe: 'email', wajib: true }, { k: 'hp', label: 'No. HP', tipe: 'tel', wajib: true }, { k: 'komunitasId', label: 'ID Komunitas (opsional)', tipe: 'text' }], {},
      async (v) => { const r = await panggil('adminKurirAkunBuat', v); sukses('Akun kurir dibuat.'); tampilSandi(r, 'Akun kurir dibuat'); muat(); }, 'Buat akun');
  }
}

/* ================= KOMUNITAS ================= */
export async function komunitas(ctx) {
  await halaman(ctx, 'Komunitas', 'Kelompok pasar (RT, sekolah, kantor, pesantren) dengan aturan keanggotaan sendiri.', [tombol('Komunitas baru', () => form(), '', 'plus')], async (isi, ulang) => {
    const r = await panggil('adminKomunitasDaftar'); window.__ulangKom = ulang;
    ganti(isi, tabel([{ judul: 'Nama', tampil: k => h('div', null, h('b', null, k.nama), h('div', { class: 'redup' }, '/' + k.slug)) }, { judul: 'Mode', k: 'mode' }, { judul: 'Kode undangan', tampil: k => k.kodeUndangan ? h('code', null, k.kodeUndangan) : '–' }, { judul: 'Toko', kanan: true, tampil: k => angka(k.jumlahToko) }, { judul: 'Anggota', kanan: true, tampil: k => angka(k.jumlahAnggota) },
      { judul: 'Status', tampil: k => h('span', { class: 'status ' + (k.status === 'Aktif' ? 'ok' : 'proses') }, k.status) }, { judul: '', aksi: true, tampil: k => tombol('Ubah', () => form(k), 'ghost sm', 'edit') }], r, { kosongTeks: 'Belum ada komunitas.', caption: 'Komunitas' }));
  });
  function form(k) {
    modalForm(k ? 'Ubah komunitas' : 'Komunitas baru', [{ k: 'nama', label: 'Nama komunitas', tipe: 'text', wajib: true }, { k: 'mode', label: 'Mode keanggotaan', tipe: 'select', opsi: [{ v: 'Terbuka', t: 'Terbuka — siapa saja boleh bergabung' }, { v: 'Tertutup', t: 'Tertutup — wajib kode undangan' }, { v: 'Campuran', t: 'Campuran' }], wajib: true }, { k: 'kodeUndangan', label: 'Kode undangan', tipe: 'text', bantu: 'Kosongkan untuk mode Terbuka.' }, { k: 'status', label: 'Status', tipe: 'select', opsi: [{ v: 'Aktif', t: 'Aktif' }, { v: 'Nonaktif', t: 'Nonaktif' }] }],
      k ? { nama: k.nama, mode: k.mode, kodeUndangan: k.kodeUndangan, status: k.status } : { mode: 'Terbuka', status: 'Aktif' },
      async (v) => { await panggil('adminKomunitasSimpan', { ...v, id: k ? k.id : undefined }); sukses('Komunitas disimpan.'); komunitas(ctx); });
  }
}

/* ================= KATEGORI ================= */
export async function kategori(ctx) {
  await halaman(ctx, 'Kategori', 'Atur komisi (fee) dan tingkat risiko tiap kategori. Perubahan fee hanya oleh Admin Keuangan.', [tombol('Kategori baru', () => form(), '', 'plus')], async (isi) => {
    const r = await panggil('adminKategoriDaftar'); const nama = Object.fromEntries(r.map(x => [x.id, x.nama]));
    ganti(isi, tabel([{ judul: 'Kategori', tampil: c => h('div', null, h('b', null, c.nama), c.parentId ? h('div', { class: 'redup' }, 'Sub dari ' + (nama[c.parentId] || c.parentId)) : null) }, { judul: 'Fee', kanan: true, tampil: c => c.feePersen + '%' }, { judul: 'Risiko', tampil: c => h('span', { class: 'status ' + (c.risiko === 'Tinggi' ? 'gagal' : 'proses') }, c.risiko) }, { judul: 'Urutan', kanan: true, k: 'urutan' }, { judul: 'Aktif', tampil: c => c.aktif ? 'Ya' : 'Tidak' }, { judul: '', aksi: true, tampil: c => tombol('Ubah', () => form(c, r), 'ghost sm', 'edit') }], r, { caption: 'Kategori' }));
  });
  async function form(c, semua) {
    if (!semua) semua = await panggil('adminKategoriDaftar').catch(() => []);
    modalForm(c ? 'Ubah kategori' : 'Kategori baru', [{ k: 'nama', label: 'Nama', tipe: 'text', wajib: true }, { k: 'parentId', label: 'Induk', tipe: 'select', opsi: [{ v: '', t: '— Kategori utama —' }].concat(semua.filter(x => !x.parentId && (!c || x.id !== c.id)).map(x => ({ v: x.id, t: x.nama }))) },
      { k: 'feePersen', label: 'Komisi platform (%)', tipe: 'number', min: 0, maksNilai: 30, wajib: true, bantu: 'Antara 0–30. Hanya Admin Keuangan yang boleh mengubah.' }, { k: 'risiko', label: 'Risiko moderasi', tipe: 'select', opsi: [{ v: 'Rendah', t: 'Rendah — tayang otomatis' }, { v: 'Tinggi', t: 'Tinggi — ditinjau admin dulu' }] }, { k: 'ikon', label: 'Ikon', tipe: 'text', bantu: 'Nama ikon, mis. shirt, tv, box.' }, { k: 'urutan', label: 'Urutan tampil', tipe: 'number', min: 0 }, { k: 'aktif', label: 'Aktif', tipe: 'switch' }],
      c ? { nama: c.nama, parentId: c.parentId, feePersen: c.feePersen, risiko: c.risiko, ikon: c.ikon, urutan: c.urutan, aktif: c.aktif } : { feePersen: 5, risiko: 'Rendah', urutan: 0, aktif: true, parentId: '' },
      async (v) => { await panggil('adminKategoriSimpan', { ...v, id: c ? c.id : undefined, feePersen: Number(v.feePersen), urutan: angkaOpsional(v.urutan), aktif: !!v.aktif }); sukses('Kategori disimpan.'); kategori(ctx); });
  }
}

/* ================= KURIR & TARIF ================= */
const ZONA = { SAMA_KOTA: 'Sama kota', SAMA_PROVINSI: 'Sama provinsi', ANTAR_PROVINSI: 'Antar provinsi' };
export async function kurir(ctx) {
  await halaman(ctx, 'Kurir & tarif', 'Ekspedisi yang tersedia di checkout beserta tarif per zona.', [tombol('Kurir baru', () => formKurir(), '', 'plus')], async (isi) => {
    const r = await panggil('adminKurirDaftar');
    ganti(isi, h('div', { class: 'kolom' }, r.map(k => h('article', { class: 'kartu' }, h('div', { class: 'sebar', style: { flexWrap: 'wrap', gap: '8px' } }, h('div', null, h('b', null, k.nama), h('div', { class: 'redup' }, k.id + ' · ' + k.jenis)), h('div', { class: 'baris-rapat' }, h('span', { class: 'status ' + (k.aktif ? 'ok' : 'proses') }, k.aktif ? 'Aktif' : 'Nonaktif'), tombol('Ubah', () => formKurir(k), 'ghost sm', 'edit'))),
      tabel([{ judul: 'Zona', tampil: t => ZONA[t.zona] || t.zona }, { judul: 'Tarif dasar', kanan: true, tampil: t => rp(t.dasar) }, { judul: 'Per kg', kanan: true, tampil: t => rp(t.perKg) }, { judul: 'Estimasi', kanan: true, tampil: t => t.estHari + ' hari' }, { judul: '', aksi: true, tampil: t => tombol('Ubah tarif', () => formTarif(k, t), 'ghost sm') }], k.tarif, { kosongTeks: 'Belum ada tarif.' }),
      h('div', { style: { marginTop: '8px' } }, tombol('Tambah / ubah tarif zona', () => formTarif(k), 'ghost sm', 'plus'))))));
  });
  function formKurir(k) {
    modalForm(k ? 'Ubah kurir' : 'Kurir baru', [{ k: 'id', label: 'Kode kurir', tipe: 'text', wajib: true, bantu: 'Huruf besar tanpa spasi, mis. JNE. Tidak bisa diubah setelah dibuat.' }, { k: 'nama', label: 'Nama', tipe: 'text', wajib: true }, { k: 'jenis', label: 'Jenis', tipe: 'select', opsi: [{ v: 'EKSPEDISI', t: 'Ekspedisi' }, { v: 'TOKO', t: 'Kurir toko' }] }, { k: 'trackingUrl', label: 'URL pelacakan', tipe: 'text' }, { k: 'aktif', label: 'Aktif di checkout', tipe: 'switch' }],
      k ? { id: k.id, nama: k.nama, jenis: k.jenis === 'Reguler' ? 'EKSPEDISI' : k.jenis, trackingUrl: k.trackingUrl, aktif: k.aktif } : { jenis: 'EKSPEDISI', aktif: true },
      async (v) => { await panggil('adminKurirSimpan', { ...v, id: (v.id || '').toUpperCase().replace(/\s+/g, '_'), aktif: !!v.aktif }); sukses('Kurir disimpan.'); kurir(ctx); });
  }
  function formTarif(k, t) {
    modalForm('Tarif ' + k.nama, [{ k: 'zona', label: 'Zona', tipe: 'select', wajib: true, opsi: Object.entries(ZONA).map(([v, x]) => ({ v, t: x })) }, { k: 'dasar', label: 'Tarif dasar (Rp)', tipe: 'number', min: 0, wajib: true }, { k: 'perKg', label: 'Tambahan per kg (Rp)', tipe: 'number', min: 0, wajib: true }, { k: 'estHari', label: 'Estimasi (hari)', tipe: 'number', min: 1, wajib: true }],
      t ? { zona: t.zona, dasar: t.dasar, perKg: t.perKg, estHari: t.estHari } : { zona: 'SAMA_KOTA', dasar: 8000, perKg: 4000, estHari: 2 },
      async (v) => { await panggil('adminTarifSimpan', { kurirId: k.id, zona: v.zona, dasar: Number(v.dasar), perKg: Number(v.perKg), estHari: Number(v.estHari) }); sukses('Tarif disimpan.'); kurir(ctx); });
  }
}

/* ================= VOUCHER ================= */
export async function voucher(ctx) {
  await halaman(ctx, 'Voucher', 'Kode diskon untuk pembeli: persen, nominal, atau potongan ongkir.', [tombol('Voucher baru', () => form(), '', 'plus')], async (isi) => {
    const r = await panggil('adminVoucherDaftar');
    ganti(isi, tabel([{ judul: 'Kode', tampil: v => h('code', null, v.kode) }, { judul: 'Potongan', tampil: v => v.jenis === 'PERSEN' ? v.nilai + '%' + (v.maks ? ' (maks ' + rp(v.maks) + ')' : '') : rp(v.nilai) + (v.jenis === 'ONGKIR' ? ' ongkir' : '') }, { judul: 'Min. belanja', kanan: true, tampil: v => rp(v.minBelanja) }, { judul: 'Terpakai', kanan: true, tampil: v => `${angka(v.terpakai)} / ${v.kuota ? angka(v.kuota) : '∞'}` }, { judul: 'Berlaku', tampil: v => (v.mulai ? tgl(v.mulai) : '–') + ' → ' + (v.selesai ? tgl(v.selesai) : '–') },
      { judul: 'Status', tampil: v => h('span', { class: 'status ' + (v.aktif ? 'ok' : 'proses') }, v.aktif ? 'Aktif' : 'Nonaktif') }, { judul: '', aksi: true, tampil: v => tombol('Ubah', () => form(v), 'ghost sm', 'edit') }], r, { kosongTeks: 'Belum ada voucher.', caption: 'Voucher' }));
  });
  const d10 = (v) => (v ? String(v).slice(0, 10) : '');
  function form(v) {
    modalForm(v ? 'Ubah voucher' : 'Voucher baru', [{ k: 'kode', label: 'Kode', tipe: 'text', wajib: true, bantu: 'Huruf besar & angka, mis. GAJIAN10.' }, { k: 'jenis', label: 'Jenis', tipe: 'select', opsi: [{ v: 'PERSEN', t: 'Persen (%)' }, { v: 'NOMINAL', t: 'Nominal (Rp)' }, { v: 'ONGKIR', t: 'Potongan ongkir (Rp)' }], wajib: true }, { k: 'nilai', label: 'Nilai', tipe: 'number', min: 1, wajib: true },
      { k: 'minBelanja', label: 'Minimal belanja (Rp)', tipe: 'number', min: 0 }, { k: 'maks', label: 'Potongan maksimal (Rp, untuk persen)', tipe: 'number', min: 0 }, { k: 'kuota', label: 'Kuota pemakaian (0 = tak terbatas)', tipe: 'number', min: 0 }, { k: 'komunitasId', label: 'Khusus komunitas (opsional)', tipe: 'text', placeholder: 'COM-0001' }, { k: 'mulai', label: 'Mulai', tipe: 'date' }, { k: 'selesai', label: 'Berakhir', tipe: 'date' }, { k: 'aktif', label: 'Aktif', tipe: 'switch' }],
      v ? { kode: v.kode, jenis: v.jenis, nilai: v.nilai, minBelanja: v.minBelanja, maks: v.maks, kuota: v.kuota, komunitasId: v.komunitasId, mulai: d10(v.mulai), selesai: d10(v.selesai), aktif: v.aktif } : { jenis: 'PERSEN', nilai: 10, aktif: true, minBelanja: 0 },
      async (x) => { await panggil('adminVoucherSimpan', { ...x, kode: String(x.kode).toUpperCase().replace(/\s+/g, ''), nilai: Number(x.nilai), minBelanja: angkaOpsional(x.minBelanja), maks: angkaOpsional(x.maks), kuota: angkaOpsional(x.kuota), aktif: !!x.aktif }); sukses('Voucher disimpan.'); voucher(ctx); });
  }
}

/* ================= PENGATURAN ================= */
const PILIHAN = { MODE_GATEWAY: ['SIMULASI', 'MIDTRANS', 'XENDIT'], MODE_AI: ['SIMULASI', 'AKTIF'] };
export async function pengaturan(ctx) {
  await halaman(ctx, 'Pengaturan', 'Nilai sistem seperti komisi, ambang penarikan, dan mode integrasi.', null, async (isi) => {
    const r = await panggil('adminSettingDaftar');
    ganti(isi, h('div', { class: 'kolom' }, h('div', { class: 'info-kotak' }, 'MODE_GATEWAY dan MODE_AI hanya bisa dialihkan dari SIMULASI setelah kunci API-nya diisi di menu ', h('b', null, 'Kunci API'), '.'),
      r.map(s => {
        const pil = PILIHAN[s.kunci];
        const inp = pil ? h('select', { class: 'input', id: 's-' + s.kunci, 'aria-label': s.kunci }, pil.map(o => h('option', { value: o, selected: o === s.nilai }, o))) : h('input', { class: 'input', id: 's-' + s.kunci, value: s.nilai, 'aria-label': s.kunci, disabled: !s.boleh });
        const b = tombol('Simpan', async (bt) => { await tahan(bt, async () => { await panggil('adminSettingSimpan', { kunci: s.kunci, nilai: inp.value }); sukses(s.kunci + ' disimpan.'); }); }, 'sm'); b.disabled = !s.boleh;
        return h('div', { class: 'kartu' }, h('label', { for: 's-' + s.kunci, class: 'tebal' }, s.kunci), h('div', { class: 'redup', style: { marginBottom: '6px' } }, s.keterangan), h('div', { class: 'baris', style: { gap: '8px' } }, h('div', { style: { flex: 1 } }, inp), b), !s.boleh ? h('div', { class: 'redup' }, 'Hanya peran tertentu yang boleh mengubah ini.') : null);
      })));
  });
}

/* ================= KUNCI API ================= */
const INFO_KUNCI = { MIDTRANS_SERVER_KEY: 'Server key Midtrans (gateway pembayaran).', XENDIT_SECRET_KEY: 'Secret key Xendit.', XENDIT_CALLBACK_TOKEN: 'Callback token Xendit untuk verifikasi webhook.', WEBHOOK_TOKEN: 'Token rahasia pada URL webhook gateway.', FONNTE_TOKEN: 'Token Fonnte untuk kirim WhatsApp.', AI_API_KEY: 'API key penyedia AI (deskripsi produk, balas ulasan).', MIDTRANS_PRODUKSI: 'Isi true bila memakai Midtrans mode produksi.' };
export async function kunci(ctx) {
  await halaman(ctx, 'Kunci API', 'Rahasia disimpan di Script Properties Apps Script, tidak pernah tampil utuh. Butuh PIN Super Admin.', null, async (isi, ulang) => {
    const r = await panggil('adminKunciStatus');
    ganti(isi, h('div', { class: 'kolom' }, h('div', { class: 'peringatan-kotak' }, 'Selama kunci kosong, aplikasi berjalan dalam mode SIMULASI (aman untuk uji coba, tanpa uang/WA/AI sungguhan).'),
      r.map(k => h('div', { class: 'kartu sebar', style: { flexWrap: 'wrap', gap: '8px' } }, h('div', null, h('b', null, k.nama), h('div', { class: 'redup' }, INFO_KUNCI[k.nama] || ''), h('div', null, k.terisi ? h('span', { class: 'status ok' }, 'Terisi ' + (k.tampil || '')) : h('span', { class: 'status proses' }, 'Belum diisi'))),
        h('div', { class: 'baris-rapat' }, tombol(k.terisi ? 'Ganti' : 'Isi', () => isiKunci(k, ulang), 'sm', 'lock'), k.terisi ? tombol('Hapus', () => hapus(k, ulang), 'ghost sm') : null)))));
  });
  function isiKunci(k, ulang) {
    modalForm('Isi ' + k.nama, [{ k: 'nilai', label: 'Nilai kunci', tipe: 'password', wajib: true }, { k: 'pin', label: 'PIN Super Admin', tipe: 'password', wajib: true }], {}, async (v) => { await panggil('adminKunciSimpan', { nama: k.nama, nilai: v.nilai, pin: v.pin }); sukses('Kunci disimpan.'); ulang(); }, 'Simpan kunci');
  }
  function hapus(k, ulang) {
    modalForm('Hapus ' + k.nama, [{ k: 'pin', label: 'PIN Super Admin', tipe: 'password', wajib: true }], {}, async (v) => { await panggil('adminKunciSimpan', { nama: k.nama, nilai: '__HAPUS__', pin: v.pin }); sukses('Kunci dihapus.'); ulang(); }, 'Hapus kunci');
  }
}

/* ================= BLOKIR PERMANEN ================= */
export async function blokir(ctx) {
  const superAdmin = punya('SUPER_ADMIN'); const isi = h('div', { class: 'kolom' });
  const muat = async () => {
    ganti(isi, skeleton(2, 80));
    try {
      const [u, dbl] = await Promise.all([panggil('adminBlokirUsulDaftar'), panggil('adminPenjualDaftar', { status: 'Diblokir' })]);
      ganti(isi, h('div', { class: 'info-kotak' }, 'Blokir permanen bersifat berat: toko & produk turun, pesanan belum kirim dibatalkan + refund. Admin hanya mengusulkan; ', h('b', null, 'eksekusi hanya oleh Pemilik (Super Admin)'), ' dengan PIN atau OTP email.'),
        h('section', { class: 'kartu' }, h('h3', null, 'Usulan blokir'), u.length ? h('div', { class: 'kolom' }, u.map(x => h('div', { class: 'kartu' }, h('div', { class: 'sebar', style: { flexWrap: 'wrap' } }, h('b', null, x.toko || x.sellerId), h('span', { class: 'status ' + (x.status === 'Menunggu Pemilik' ? 'tunggu' : x.status === 'Dieksekusi' ? 'gagal' : 'proses') }, x.status)), h('p', null, x.alasan), h('div', { class: 'redup' }, rel(x.dibuat)),
          x.status === 'Menunggu Pemilik' && superAdmin ? h('div', { class: 'baris', style: { gap: '8px', marginTop: '8px' } }, tombol('Eksekusi blokir', () => konfirmasiPemilik(x), 'sm', 'lock'), tombol('Tolak usulan', async (b) => { const c = await tanya({ judul: 'Tolak usulan', label: 'Catatan (opsional)', wajib: false, ya: 'Tolak' }); if (c === null) return; await tahan(b, async () => { await panggil('adminBlokirTolak', { aksiId: x.id, catatan: c }); sukses('Usulan ditolak.'); muat(); }); }, 'ghost sm')) : null))) : h('p', { class: 'redup' }, 'Belum ada usulan.')),
        h('section', { class: 'kartu' }, h('h3', null, 'Penjual diblokir'), dbl.length ? tabel([{ judul: 'Usaha', tampil: s => h('div', null, h('b', null, s.namaUsaha), h('div', { class: 'redup' }, s.pemilik)) }, { judul: 'Kode toko', k: 'kodeToko' }, { judul: '', aksi: true, tampil: s => superAdmin ? tombol('Cabut blokir', () => cabut(s), 'ghost sm') : '' }], dbl) : h('p', { class: 'redup' }, 'Tidak ada.')));
    } catch (e) { ganti(isi, kotakGalat(e, muat)); }
  };
  ctx.setJudul('Blokir permanen', '', { noindex: true });
  ganti(ctx.wadah, kepalaHalaman('Blokir permanen', 'Usul dan eksekusi blokir penjual.', tombol('Usulkan blokir', usul, '', 'flag')), isi); await muat();

  function usul() {
    modalForm('Usulkan blokir penjual', [{ k: 'sellerId', label: 'ID Penjual', tipe: 'text', wajib: true, placeholder: 'SLR-000001' }, { k: 'alasan', label: 'Alasan dan bukti (min. 15 karakter)', tipe: 'textarea', wajib: true, minPanjang: 15 }], {}, async (v) => { await panggil('adminBlokirUsul', v); sukses('Usulan dikirim ke Pemilik.'); muat(); }, 'Kirim usulan');
  }
  async function bukaOtp() { try { const r = await panggil('adminBlokirMintaOtp'); sukses('Kode dikirim ke ' + r.terkirimKe); } catch (e) { laporGalat(e); } }
  function verifForm(judul, kirimFn, label) {
    let m; const modeSel = h('select', { class: 'input', 'aria-label': 'Metode verifikasi' }, h('option', { value: 'pin' }, 'PIN'), h('option', { value: 'otp' }, 'OTP email'));
    const kode = h('input', { class: 'input', type: 'password', id: 'vk', inputmode: 'numeric', autocomplete: 'one-time-code', 'aria-label': 'PIN atau kode OTP' });
    const minta = tombol('Kirim OTP ke email', bukaOtp, 'ghost sm', 'mail'); minta.style.display = 'none';
    modeSel.onchange = () => { minta.style.display = modeSel.value === 'otp' ? '' : 'none'; };
    m = modal({ judul, isi: h('div', { class: 'kolom' }, h('label', { for: 'vk' }, 'Verifikasi Pemilik'), h('div', { class: 'baris', style: { gap: '8px' } }, modeSel, kode), minta), kaki: tombol(label, async (b) => { if (!kode.value) return kode.focus(); await tahan(b, async () => { await kirimFn(modeSel.value === 'pin' ? { pin: kode.value } : { otp: kode.value }); m.tutup(); }); }, 'hangat') });
  }
  function konfirmasiPemilik(x) { verifForm('Eksekusi blokir ' + (x.toko || ''), async (v) => { const r = await panggil('adminBlokirKonfirmasi', { aksiId: x.id, ...v }); sukses(`Diblokir. ${r.produkDinonaktifkan} produk dinonaktifkan, ${r.pesananDibatalkan} pesanan dibatalkan.`); muat(); }, 'Blokir permanen'); }
  function cabut(s) { verifForm('Cabut blokir ' + s.namaUsaha, async (v) => { await panggil('adminBlokirCabut', { sellerId: s.sellerId, alasan: 'dicabut Pemilik', ...v }); sukses('Blokir dicabut.'); muat(); }, 'Cabut blokir'); }
}

/* ================= AUDIT & KESEHATAN ================= */
export async function audit(ctx) {
  let q = ''; const log = h('div'), sehat = h('div');
  const muatLog = async () => {
    ganti(log, skeleton(3, 40));
    try { const r = await panggil('adminAuditDaftar', { q, limit: 100 }); ganti(log, h('p', { class: 'redup' }, `${angka(r.cocok)} dari ${angka(r.total)} catatan (100 terbaru ditampilkan)`), tabel([{ judul: 'Waktu', tampil: x => tgl(x.waktu, true) }, { judul: 'Aktor', tampil: x => h('div', null, x.aktor, h('div', { class: 'redup' }, x.peran)) }, { judul: 'Aksi', tampil: x => h('code', null, x.aksi) }, { judul: 'Target', k: 'target' }, { judul: 'Detail', tampil: x => x.detail }, { judul: 'Hash', tampil: x => h('code', { class: 'redup' }, x.hash) }], r.baris, { kosongTeks: 'Tidak ada catatan.', caption: 'Log audit' })); } catch (e) { ganti(log, kotakGalat(e, muatLog)); }
  };
  const muatSehat = async () => {
    ganti(sehat, skeleton(1, 100));
    try {
      const k = await panggil('adminKesehatan'); const d = k.dompet, s = k.stok, a = k.audit;
      const baik = (v) => h('span', { class: 'status ' + (v ? 'ok' : 'gagal') }, v ? 'Cocok' : 'Selisih');
      ganti(sehat, h('div', { class: 'grid g-4 res' }, kartuStat('Rekonsiliasi dompet', d.selisih.length ? d.selisih.length + ' selisih' : 'Cocok', 'wallet', `${d.dicek} dompet dicek`), kartuStat('Rekonsiliasi stok', s.selisih.length ? s.selisih.length + ' selisih' : 'Cocok', 'box', `${s.dicek || 0} produk dicek`), kartuStat('Rantai audit', a.valid ? 'Utuh' : 'RUSAK', 'shield', a.valid ? `${a.total} catatan` : 'di ' + a.rusakDi), kartuStat('Versi', k.versi, 'info')),
        h('div', { class: 'kartu', style: { marginTop: '12px' } }, kv([['Gateway pembayaran', k.mode.gateway], ['Notifikasi WhatsApp', k.mode.wa === 'YA' ? 'Aktif' : 'Nonaktif'], ['Notifikasi email', k.mode.email === 'YA' ? 'Aktif' : 'Nonaktif'], ['Mode AI', k.mode.ai], ['Cadangan terakhir', k.cadanganTerakhir ? tgl(k.cadanganTerakhir, true) : 'Belum pernah']])),
        (d.selisih.length || s.selisih.length) ? h('div', { class: 'galat-kotak', style: { marginTop: '12px' } }, 'Ada selisih rekonsiliasi — periksa ', d.selisih.slice(0, 3).map(x => x.owner).join(', '), '. Jangan ubah data manual; hubungi pengembang.') : null);
    } catch (e) { ganti(sehat, kotakGalat(e, muatSehat)); }
  };
  const cari = h('input', { class: 'input', type: 'search', placeholder: 'Cari aksi, target, atau aktor', 'aria-label': 'Cari log audit', oninput: debounce((e) => { q = e.target.value.trim(); muatLog(); }, 350) });
  ctx.setJudul('Audit & kesehatan', '', { noindex: true });
  ganti(ctx.wadah, kepalaHalaman('Audit & kesehatan', 'Log tindakan admin yang tidak bisa diubah, dan pemeriksaan integritas sistem.', tombol('Periksa integritas audit', async (b) => { await tahan(b, async () => { const r = await panggil('adminAuditPeriksa'); r.valid ? sukses(`Rantai audit utuh (${r.total} catatan).`) : gagal('Rantai audit RUSAK di ' + r.rusakDi); muatSehat(); }); }, '', 'shield')), sehat, h('h2', { style: { marginTop: '24px' } }, 'Log audit'), h('div', { style: { margin: '8px 0 12px' } }, cari), log);
  await Promise.all([muatSehat(), muatLog()]);
}
