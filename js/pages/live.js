// Live selling: daftar siaran, ruang tonton (chat, suka, produk, beli cepat), studio penjual.
import { h, ikon, ganti, rp, angka, tgl, jam, rel, gambar } from '../lib/dom.js';
import { panggil } from '../lib/api.js';
import { state } from '../lib/store.js';
import { href, navigasi } from '../lib/router.js';
import { kosong, kotakGalat, skeleton, tahan, laporGalat, ok as sukses, konfirmasi, modal, formulir, status, kv, kartuStat, tab } from '../lib/ui.js';
import { blokKepala, kartuLive, karusel, tautan } from '../lib/komponen.js';
import { tambahKeKeranjang, perluMasuk } from '../lib/keranjang.js';
import { CONFIG } from '../config.js';

/* ================= DAFTAR ================= */
export async function daftar(ctx) {
  ctx.setJudul('Live shopping', 'Belanja sambil nonton siaran langsung penjual: harga live, kuota terbatas, tanya langsung lewat chat.');
  const isi = h('div'); ganti(ctx.wadah, h('div', { class: 'wadah seksi' }, h('h1', null, 'Live shopping'), isi));
  const muat = async () => {
    ganti(isi, skeleton(3, 120));
    try {
      const d = await panggil('liveDaftar');
      ganti(isi,
        blokKepala('Sedang live'), d.sedangLive.length ? h('div', { class: 'live-daftar grid g-3 res' }, d.sedangLive.map(kartuLive)) : kosong('Belum ada siaran live', 'Cek jadwal di bawah atau aktifkan pengingat.', null, 'video'),
        d.jadwal.length ? [h('div', { style: { height: '24px' } }), blokKepala('Jadwal berikutnya'), h('div', { class: 'grid g-3 res' }, d.jadwal.map(kartuLive))] : null,
        d.siaranUlang.length ? [h('div', { style: { height: '24px' } }), blokKepala('Siaran ulang'), h('div', { class: 'grid g-3 res' }, d.siaranUlang.map(kartuLive))] : null);
    } catch (e) { ganti(isi, kotakGalat(e, muat)); }
  };
  await muat();
}

/* ================= RUANG TONTON ================= */
export async function ruang(ctx) {
  const id = ctx.params.id; const isi = h('div'); ganti(ctx.wadah, h('div', { class: 'wadah seksi' }, isi)); ganti(isi, skeleton(2, 240));
  let d; try { d = await panggil('liveDetail', { liveId: id }); } catch (e) { ganti(isi, kotakGalat(e, () => ruang(ctx))); return; }
  ctx.setJudul(d.judul + ' — Live ' + d.toko.nama, 'Siaran live ' + d.toko.nama + ' di GMA Store.', { noindex: d.status !== 'Live' });
  let timer = null, hb = null, mati = false, sejak = 0, seq = 0; const sid = 's' + Math.random().toString(36).slice(2, 10); const ada = new Set();
  ctx.saatPergi(() => { mati = true; clearTimeout(timer); });
  const penonton = h('b', null, angka(d.penonton)), suka = h('b', null, angka(d.suka)), stat = h('span', { class: 'status ' + (d.status === 'Live' ? 'live' : 'proses') }, d.status === 'Live' ? 'LIVE' : d.status);
  const pesanBox = h('div', { class: 'chat-pesan', 'aria-live': 'polite', 'aria-label': 'Chat live' });
  const kotakProduk = h('div', { class: 'kolom' });
  const video = () => d.embedBisa && d.embedUrl && d.status === 'Live' ? h('div', { class: 'video-kotak' }, h('iframe', { src: d.embedUrl, title: d.judul, allow: 'autoplay; encrypted-media; picture-in-picture', allowfullscreen: true, referrerpolicy: 'strict-origin-when-cross-origin', sandbox: 'allow-scripts allow-same-origin allow-presentation allow-popups' }))
    : h('div', { class: 'video-kotak', style: { display: 'grid', placeItems: 'center', color: '#fff', textAlign: 'center', padding: '16px', backgroundImage: d.sampul ? `url(${d.sampul})` : null, backgroundSize: 'cover' } }, h('div', { style: { background: 'rgba(0,0,0,.6)', padding: '16px', borderRadius: '12px' } },
      d.status === 'Live' ? [h('p', null, 'Siaran ini diputar di ' + d.platform + '.'), h('a', { class: 'btn hangat', href: d.tautanAsli, target: '_blank', rel: 'noopener noreferrer' }, ikon('play'), 'Buka siaran')]
        : d.status === 'Terjadwal' ? h('p', null, 'Dimulai ' + tgl(d.jadwal, true) + ' (' + rel(d.jadwal) + ')') : h('p', null, d.status === 'Selesai' ? 'Siaran telah selesai.' : 'Siaran dibatalkan.'),
      d.rekaman ? h('a', { class: 'btn', href: d.rekaman, target: '_blank', rel: 'noopener noreferrer' }, 'Tonton ulang') : null));
  function gambarProduk() {
    ganti(kotakProduk, d.produk.length ? d.produk.map(p => {
      const pinned = d.pin === p.produkId; const v0 = p.live ? p.varian.find(v => v.id === p.live.varianId) || p.varian[0] : p.varian[0]; let pilih = v0.id;
      const sel = p.varian.length > 1 ? h('select', { class: 'select', 'aria-label': 'Varian ' + p.nama, onchange: (e) => { pilih = e.target.value; } }, p.varian.map(v => h('option', { value: v.id, selected: v.id === pilih }, v.nama + ' — ' + rp(p.live && p.live.varianId === v.id ? p.live.harga : v.harga)))) : null;
      return h('div', { class: 'kartu', style: pinned ? { borderColor: 'var(--hangat)' } : null },
        pinned ? h('span', { class: 'tag-hangat' }, 'Sedang dibahas') : null,
        h('div', { class: 'baris', style: { flexWrap: 'nowrap' } }, gambar(p.foto, p.nama, '', 64), h('div', { class: 'isi' }, h('a', { href: href('/produk/' + p.slug), style: { color: 'inherit', fontWeight: 600 } }, p.nama),
          h('div', null, p.live ? [h('span', { class: 'harga' }, rp(p.live.harga)), ' ', h('span', { class: 'harga-coret' }, rp(p.hargaEceran)), h('small', { class: 'galat-teks', style: { display: 'block' } }, p.live.sisa > 0 ? 'Sisa kuota harga live: ' + p.live.sisa : 'Kuota harga live habis')] : h('span', { class: 'harga' }, rp(p.hargaEceran))))),
        sel, d.status === 'Live' ? h('button', { class: 'btn blok', type: 'button', style: { marginTop: '8px' }, disabled: p.live && p.live.sisa <= 0 && false, onclick: (e) => tahan(e.currentTarget, async () => { if (perluMasuk()) return; await tambahKeKeranjang(pilih, 1, p.live && p.live.varianId === pilih && p.live.sisa > 0 ? d.id : ''); }) }, ikon('cart'), 'Beli cepat') : h('a', { class: 'btn sekunder blok', style: { marginTop: '8px' }, href: href('/produk/' + p.slug) }, 'Lihat produk'));
    }) : h('p', { class: 'redup' }, 'Belum ada produk di sesi ini.'));
  }
  function tambahChat(arr) {
    const bawah = pesanBox.scrollTop + pesanBox.clientHeight >= pesanBox.scrollHeight - 40;
    arr.forEach(m => { if (ada.has(m.n)) return; ada.add(m.n); pesanBox.append(h('div', { class: 'gelembung' + (m.penjual ? ' pin' : '') }, h('span', { class: 'pengirim' }, m.nama + (m.penjual ? ' · Penjual' : '')), m.teks)); });
    while (pesanBox.children.length > 120) pesanBox.firstChild.remove();
    if (bawah) pesanBox.scrollTop = pesanBox.scrollHeight;
  }
  async function sinkron(pakaiHb) {
    if (mati) return;
    try {
      const r = await panggil('liveSinkron', { liveId: id, sejak, sid, hb: pakaiHb ? 1 : 0 }, { coba: 1, diam: true });
      sejak = r.seq; penonton.textContent = angka(r.penonton); suka.textContent = angka(r.suka); tambahChat(r.chat);
      (r.disembunyi || []).forEach(() => { /* pesan tersembunyi tidak dikirim ulang */ });
      if (r.pin !== d.pin) { d.pin = r.pin; gambarProduk(); }
      if (r.status !== d.status) { d.status = r.status; stat.textContent = r.status === 'Live' ? 'LIVE' : r.status; const baru = (await panggil('liveDetail', { liveId: id })); d = baru; ganti(vid, video()); gambarProduk(); if (r.status !== 'Live') return; }
      timer = setTimeout(() => sinkron(Date.now() - hb > (d.pengaturan.heartbeatMs || 20000)), document.hidden ? 15000 : (r.berikutnyaMs || CONFIG.SINKRON_LIVE_MS));
      if (Date.now() - hb > (d.pengaturan.heartbeatMs || 20000)) hb = Date.now();
    } catch (e) { timer = setTimeout(() => sinkron(false), 10000); }
  }
  const vid = h('div'); ganti(vid, video());
  const isiChat = h('input', { id: 'live-chat-isi', class: 'input', placeholder: state.user ? 'Tulis komentar…' : 'Masuk untuk berkomentar', maxlength: 200, disabled: d.status !== 'Live', 'aria-label': 'Komentar' });
  const kirim = async () => { if (perluMasuk()) return; const t = isiChat.value.trim(); if (!t) return; isiChat.value = ''; try { await panggil('liveChatKirim', { liveId: id, isi: t }, { coba: 1 }); sinkron(false); } catch (e) { isiChat.value = t; laporGalat(e); } };
  let tekanSuka = 0;
  const bSuka = h('button', { class: 'btn sekunder', type: 'button', 'aria-label': 'Suka', disabled: d.status !== 'Live', onclick: async () => { if (perluMasuk()) return; tekanSuka++; suka.textContent = angka(Number(suka.textContent.replace(/\./g, '')) + 1); clearTimeout(bSuka._t); bSuka._t = setTimeout(async () => { const n = tekanSuka; tekanSuka = 0; try { const r = await panggil('liveSuka', { liveId: id, n }, { diam: true }); suka.textContent = angka(r.suka); } catch (e) { /* abaikan */ } }, 700); } }, ikon('heart'), ' Suka');
  const bIng = d.status === 'Terjadwal' ? h('button', { class: 'btn ' + (d.diingatkan ? 'sekunder' : 'hangat'), type: 'button', onclick: (e) => tahan(e.currentTarget, async () => { if (perluMasuk()) return; const r = await panggil('liveIngatkan', { liveId: id }); d.diingatkan = r.diingatkan; e.currentTarget.textContent = r.diingatkan ? 'Pengingat aktif ✓' : 'Ingatkan saya'; sukses(r.diingatkan ? 'Kami kabari saat live dimulai.' : 'Pengingat dimatikan.'); }) }, d.diingatkan ? 'Pengingat aktif ✓' : 'Ingatkan saya') : null;
  ganti(isi,
    h('div', { class: 'live-grid' },
      h('div', { class: 'kolom' }, vid,
        h('div', { class: 'sebar' }, h('div', null, h('h1', { style: { fontSize: '20px', margin: 0 } }, d.judul), h('a', { class: 'baris-rapat', href: href('/toko/' + d.toko.slug), style: { color: 'inherit' } }, ikon('store'), ' ', d.toko.nama, d.toko.kota ? ' · ' + d.toko.kota : '')), stat),
        h('div', { class: 'baris' }, h('span', { class: 'baris-rapat' }, ikon('users'), penonton, ' menonton'), h('span', { class: 'baris-rapat' }, ikon('heart'), suka), bSuka, bIng, h('button', { class: 'btn ghost sm', type: 'button', onclick: (e) => tahan(e.currentTarget, async () => { if (perluMasuk()) return; const r = await panggil('chatMulai', { tokoId: d.toko.id }); navigasi(href('/chat/' + r.threadId)); }) }, ikon('message'), 'Chat toko')),
        h('h2', null, 'Produk di siaran ini'), kotakProduk),
      h('div', { class: 'chat-panel' }, h('div', { class: 'kartu-judul', style: { padding: '10px 12px', margin: 0 } }, h('h3', { style: { margin: 0 } }, 'Chat live')), pesanBox,
        h('form', { class: 'chat-input', onsubmit: (e) => { e.preventDefault(); kirim(); } }, isiChat, h('button', { class: 'btn', type: 'submit', disabled: d.status !== 'Live', 'aria-label': 'Kirim' }, ikon('send'))))));
  gambarProduk(); hb = Date.now();
  if (d.status === 'Live') await sinkron(true); else { const r = await panggil('liveSinkron', { liveId: id, sejak: 0 }, { diam: true }).catch(() => null); if (r) tambahChat(r.chat); }
}

/* ================= STUDIO PENJUAL ================= */
function tglLokal(iso) { const d = iso ? new Date(iso) : new Date(Date.now() + 3600e3); const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; }

export async function studio(ctx) {
  ctx.setJudul('Studio live', '', { noindex: true });
  const isi = h('div'); ganti(ctx.wadah, h('div', null, h('div', { class: 'halaman-kepala' }, h('div', null, h('h1', null, 'Studio live'), h('p', null, 'Jadwalkan siaran YouTube/TikTok, tentukan harga live, lalu kendalikan dari sini.')), h('button', { class: 'btn', type: 'button', onclick: () => formSesi(null, muat) }, ikon('plus'), 'Jadwalkan live')), isi));
  let kendali = null; ctx.saatPergi(() => { if (kendali) clearInterval(kendali); });
  async function muat() {
    ganti(isi, skeleton(3, 100));
    try {
      const l = await panggil('liveSaya'); const berjalan = l.find(x => x.status === 'Live');
      ganti(isi, berjalan ? panelKendali(berjalan) : null, h('h2', { style: { marginTop: '16px' } }, 'Semua sesi'), l.length ? l.map(kartuSesi) : kosong('Belum ada sesi live', 'Jadwalkan siaran pertama Anda.', null, 'video'));
    } catch (e) { ganti(isi, kotakGalat(e, muat)); }
  }
  function kartuSesi(x) {
    return h('div', { class: 'kartu', style: { marginBottom: '10px' } }, h('div', { class: 'sebar' }, h('div', null, h('div', { class: 'tebal' }, x.judul), h('small', null, x.platform + ' · ' + tgl(x.jadwal, true) + ' · ' + x.jumlahProduk + ' produk')), status(x.status)),
      h('div', { class: 'baris', style: { marginTop: '10px' } },
        x.status === 'Terjadwal' ? [h('button', { class: 'btn', type: 'button', onclick: (e) => tahan(e.currentTarget, async () => { const r = await panggil('liveMulai', { liveId: x.id }); sukses('Siaran dimulai. Pastikan siaran di ' + x.platform + ' sudah berjalan.'); muat(); }) }, ikon('play'), 'Mulai'), h('button', { class: 'btn sekunder', type: 'button', onclick: () => formSesi(x, muat) }, ikon('edit'), 'Ubah'), h('button', { class: 'btn ghost', type: 'button', style: { color: 'var(--bahaya)' }, onclick: async () => { if (await konfirmasi({ judul: 'Batalkan sesi?', pesan: 'Pembeli yang meminta pengingat akan diberi tahu.', ya: 'Batalkan sesi', bahaya: true })) { await panggil('liveBatal', { liveId: x.id }); muat(); } } }, 'Batalkan')] : null,
        x.status !== 'Terjadwal' && x.status !== 'Dibatalkan' ? h('button', { class: 'btn sekunder sm', type: 'button', onclick: () => lihatStat(x) }, ikon('chart'), 'Statistik') : null,
        h('a', { class: 'btn ghost sm', href: href('/live/' + x.id) }, 'Lihat halaman')));
  }
  function panelKendali(x) {
    const kotak = h('div', { class: 'kartu', style: { borderColor: 'var(--hangat)', marginBottom: '8px' } });
    const stat = h('div', { class: 'grid g-3' }); const chat = h('div', { class: 'chat-pesan', style: { maxHeight: '260px', overflowY: 'auto' } }); let sejak = 0; const ada = new Set();
    const pins = h('div', { class: 'baris-rapat', style: { flexWrap: 'wrap' } });
    const gp = (pin) => ganti(pins, x.produk.map(e => h('button', { class: 'chip' + (pin === e.p ? ' aktif' : ''), type: 'button', onclick: async () => { const p = pin === e.p ? '' : e.p; await panggil('livePin', { liveId: x.id, produkId: p }); x.pin = p; gp(p); } }, e.p)));
    gp(x.pin);
    async function tik() {
      try {
        const r = await panggil('liveSinkron', { liveId: x.id, sejak, hb: 0 }, { diam: true, coba: 1 }); sejak = r.seq;
        ganti(stat, kartuStat('Penonton', angka(r.penonton)), kartuStat('Puncak', angka(r.puncak)), kartuStat('Suka', angka(r.suka)));
        r.chat.forEach(m => { if (ada.has(m.n)) return; ada.add(m.n); chat.append(h('div', { class: 'gelembung' }, h('span', { class: 'pengirim' }, m.nama), m.teks, h('button', { class: 'btn ghost sm', type: 'button', title: 'Sembunyikan', 'aria-label': 'Sembunyikan pesan', onclick: async (e) => { await panggil('liveChatSembunyi', { liveId: x.id, n: m.n }); e.currentTarget.closest('.gelembung').remove(); } }, ikon('eye')))); }); chat.scrollTop = chat.scrollHeight;
      } catch (e) { /* abaikan */ }
    }
    if (kendali) clearInterval(kendali); kendali = setInterval(() => { if (!kotak.isConnected) return clearInterval(kendali); tik(); }, 5000); tik();
    ganti(kotak, h('div', { class: 'sebar' }, h('h3', { style: { margin: 0 } }, x.judul), h('span', { class: 'status live' }, 'LIVE')), stat, h('h4', null, 'Pin produk yang sedang dibahas'), pins, h('h4', null, 'Chat penonton'), chat,
      h('div', { class: 'baris', style: { marginTop: '10px' } }, h('button', { class: 'btn', type: 'button', style: { background: 'var(--bahaya)' }, onclick: () => akhiri(x) }, ikon('x'), 'Akhiri siaran'), h('a', { class: 'btn sekunder', href: href('/live/' + x.id) }, 'Buka sebagai penonton')));
    return kotak;
  }
  function akhiri(x) {
    const f = formulir([{ k: 'rekamanUrl', label: 'Tautan rekaman YouTube (opsional)', tipe: 'text', placeholder: 'https://www.youtube.com/watch?v=…', bantu: 'Agar pembeli bisa menonton ulang.' }], {}, { label: 'Akhiri siaran', kirim: async (v) => { const r = await panggil('liveSelesai', { liveId: x.id, rekamanUrl: v.rekamanUrl || undefined }); m.tutup(); sukses('Siaran selesai. Puncak ' + r.puncak + ' penonton, ' + r.suka + ' suka.'); muat(); } });
    const m = modal({ judul: 'Akhiri siaran?', isi: f.el });
  }
  async function lihatStat(x) {
    try { const s = await panggil('liveStatistik', { liveId: x.id });
      modal({ judul: 'Statistik — ' + x.judul, isi: h('div', null, h('div', { class: 'grid g-2' }, kartuStat('Penonton puncak', angka(s.puncak)), kartuStat('Suka', angka(s.suka)), kartuStat('Pesanan', angka(s.pesanan)), kartuStat('Omzet', rp(s.omzet))),
        h('h4', null, 'Per produk'), s.perProduk.map(p => h('div', { class: 'sebar', style: { padding: '4px 0' } }, h('span', null, p.nama), h('span', null, p.kuota ? p.terjual + ' / ' + p.kuota + ' @ ' + rp(p.hargaLive) : '—'))))
      });
    } catch (e) { laporGalat(e); }
  }
  async function formSesi(x, selesai) {
    let prod = []; try { const r = await panggil('produkSaya', { status: 'Aktif', per: 100 }); prod = r.item || r; } catch (e) { laporGalat(e); return; }
    const baris = (x ? x.produk : []).map(e => ({ produkId: e.p, varianId: e.v, hargaLive: e.hl || '', kuota: e.k || '' }));
    const daftarEl = h('div', { class: 'kolom' }); const vcache = {};
    const muatV = async (pid) => { if (!vcache[pid]) { try { vcache[pid] = (await panggil('produkDetailSaya', { id: pid })).varian; } catch (e) { vcache[pid] = []; } } return vcache[pid]; };
    const gd = () => ganti(daftarEl, baris.map((b, i) => { const p = prod.find(q => q.id === b.produkId) || {}; const vs = vcache[b.produkId] || [];
      return h('div', { class: 'kartu', style: { padding: '10px' } }, h('div', { class: 'sebar' }, h('b', null, p.nama || b.produkId), h('button', { class: 'btn ghost sm', type: 'button', 'aria-label': 'Hapus produk', onclick: () => { baris.splice(i, 1); gd(); } }, ikon('trash'))),
        h('div', { class: 'grid g-3' }, h('div', { class: 'field' }, h('label', null, 'Varian'), h('select', { class: 'select', onchange: (e) => { b.varianId = e.target.value; } }, h('option', { value: '' }, '— tanpa harga live —'), vs.map(v => h('option', { value: v.id, selected: v.id === b.varianId }, v.nama + ' (' + rp(v.harga) + ')')))),
          h('div', { class: 'field' }, h('label', null, 'Harga live'), h('input', { class: 'input', type: 'number', min: 500, value: b.hargaLive, oninput: (e) => { b.hargaLive = e.target.value; } })), h('div', { class: 'field' }, h('label', null, 'Kuota'), h('input', { class: 'input', type: 'number', min: 1, value: b.kuota, oninput: (e) => { b.kuota = e.target.value; } }))));
    }));
    const pilih = h('select', { class: 'select', 'aria-label': 'Tambah produk', onchange: async (e) => { const v = e.target.value; if (v) { e.target.value = ''; await muatV(v); baris.push({ produkId: v, varianId: '', hargaLive: '', kuota: '' }); gd(); } } }, h('option', { value: '' }, '+ Tambah produk ke sesi…'), prod.map(p => h('option', { value: p.id }, p.nama)));
    const f = formulir([{ k: 'judul', label: 'Judul siaran', tipe: 'text', wajib: true, minPanjang: 5, placeholder: 'Flash live gadget murah!' }, { k: 'sumber', label: 'Tautan siaran (YouTube atau TikTok)', tipe: 'text', wajib: !x || x.status === 'Terjadwal', bantu: 'Buat siaran di YouTube Studio / TikTok LIVE, lalu salin tautan dari tombol Bagikan.' }, { k: 'jadwal', label: 'Jadwal mulai', tipe: 'text', wajib: !x || x.status === 'Terjadwal', bantu: 'Format tahun-bulan-tanggal jam:menit, mis. ' + tglLokal() }, { k: 'sampul', label: 'Sampul (opsional)', tipe: 'file', terima: 'image/jpeg,image/png,image/webp', jenisBerkas: 'toko', pratinjau: true }],
      { judul: x ? x.judul : '', sumber: x ? x.sumber : '', jadwal: tglLokal(x && x.jadwal), sampul: x ? x.sampul : '' },
      { label: x ? 'Simpan perubahan' : 'Jadwalkan', kirim: async (v) => { const j = new Date(String(v.jadwal).replace(' ', 'T')); if (isNaN(j)) throw new Error('Format jadwal tidak valid. Contoh: ' + tglLokal()); await panggil('liveSimpan', { liveId: x ? x.id : undefined, judul: v.judul, sumber: v.sumber, jadwal: j.toISOString(), sampul: v.sampul || undefined, produk: baris.filter(b => b.produkId).map(b => ({ produkId: b.produkId, varianId: b.varianId || undefined, hargaLive: Number(b.hargaLive) || 0, kuota: Number(b.kuota) || 0 })) }); m.tutup(); sukses('Sesi live disimpan.'); selesai(); } });
    await Promise.all(baris.map(b => muatV(b.produkId))); gd(); const m = modal({ judul: x ? 'Ubah sesi live' : 'Jadwalkan live', lebar: true, isi: h('div', null, f.el, h('h4', null, 'Produk di siaran'), pilih, daftarEl) });
  }
  await muat();
}
