// Chat pembeli ↔ toko. Dipakai di layout publik (/chat) dan penjual (/penjual/chat).
import { h, ikon, ganti, rel, jam, rp, gambar } from '../lib/dom.js';
import { panggil, unggahBerkas } from '../lib/api.js';
import { state, atur } from '../lib/store.js';
import { href, navigasi } from '../lib/router.js';
import { kosong, kotakGalat, skeleton, laporGalat } from '../lib/ui.js';
import { CONFIG } from '../config.js';
import { tautan } from '../lib/komponen.js';

export async function obrolan(ctx) {
  ctx.setJudul('Chat', '', { noindex: true });
  const penjualMode = ctx.jalur.startsWith('/penjual');
  const dasar = penjualMode ? '/penjual/chat' : '/chat';
  const aktifId = ctx.params.id || '';
  const kiri = h('div', { class: 'kartu rata', style: { overflowY: 'auto', maxHeight: '70dvh' } });
  const kanan = h('div');
  const kolom = h('div', { class: 'dua-kolom', style: { gridTemplateColumns: 'minmax(0,320px) minmax(0,1fr)', alignItems: 'start' } }, kiri, kanan);
  const luar = h('div', { class: penjualMode ? '' : 'wadah seksi' }, h('h1', null, 'Chat'), kolom);
  ganti(ctx.wadah, luar);
  const sempit = matchMedia('(max-width: 760px)').matches;
  if (sempit) { kolom.style.gridTemplateColumns = '1fr'; }
  let timer = null, mati = false; ctx.saatPergi(() => { mati = true; clearTimeout(timer); });

  async function muatDaftar() {
    ganti(kiri, skeleton(3, 60));
    try {
      const r = await panggil('chatDaftar'); atur({ chat: r.belumBaca });
      const daftar = penjualMode ? r.toko : r.pembeli.concat(penjualMode ? [] : []);
      const semua = penjualMode ? r.toko : r.pembeli;
      ganti(kiri, semua.length ? semua.map(t => h('a', { class: 'utas' + (t.id === aktifId ? ' aktif' : ''), href: href(dasar + '/' + t.id), style: { color: 'inherit' } }, h('span', { class: 'avatar' }, (t.lawan.nama || '?')[0]), h('div', { class: 'isi' }, h('div', { class: 'tebal' }, t.lawan.nama), h('small', { class: 'klem-2' }, t.terakhir || 'Mulai percakapan'), h('small', { class: 'redup', style: { display: 'block' } }, rel(t.terakhirPada))), t.belumBaca ? h('span', { class: 'lencana-angka' }, t.belumBaca) : null)) : kosong('Belum ada percakapan', penjualMode ? 'Pesan dari pembeli akan muncul di sini.' : 'Mulai chat dari halaman produk atau pesanan.', null, 'message'));
      if (sempit && aktifId) kiri.style.display = 'none';
    } catch (e) { ganti(kiri, kotakGalat(e, muatDaftar)); }
  }
  async function buka() {
    if (!aktifId) { if (!sempit) ganti(kanan, kosong('Pilih percakapan', 'Pilih salah satu di kiri untuk mulai.', null, 'message')); else kanan.style.display = 'none'; return; }
    const pesanBox = h('div', { class: 'chat-pesan', 'aria-live': 'polite' });
    const isi = h('input', { id: 'chat-isi', class: 'input', placeholder: 'Tulis pesan…', maxlength: 1000, 'aria-label': 'Pesan', autocomplete: 'off' });
    const peringatan = h('div');
    const kirim = async () => {
      const t = isi.value.trim(); if (!t) return; isi.value = ''; isi.focus();
      try { const r = await panggil('chatKirim', { threadId: aktifId, isi: t }); tambahPesan([r.pesan]); if (r.peringatan && r.peringatan.length) ganti(peringatan, h('div', { class: 'peringatan-kotak' }, r.peringatan[0])); } catch (e) { isi.value = t; laporGalat(e); }
    };
    const foto = h('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp', hidden: true, onchange: async (e) => { const f = e.target.files[0]; if (!f) return; try { const r = await unggahBerkas(f, 'bukti'); const p = await panggil('chatKirim', { threadId: aktifId, foto: r.url }); tambahPesan([p.pesan]); } catch (x) { laporGalat(x); } e.target.value = ''; } });
    const panel = h('div', { class: 'chat-panel' },
      sempit ? h('div', { style: { padding: '8px' } }, h('a', { class: 'btn ghost sm', href: href(dasar) }, '‹ Semua chat')) : null,
      peringatan, pesanBox,
      h('form', { class: 'chat-input', onsubmit: (e) => { e.preventDefault(); kirim(); } }, h('button', { class: 'tombol-ikon', type: 'button', 'aria-label': 'Kirim foto', onclick: () => foto.click() }, ikon('image')), foto, isi, h('button', { class: 'btn', type: 'submit', 'aria-label': 'Kirim' }, ikon('send'))));
    ganti(kanan, panel);
    let sejak = '', sisi = 'P'; const ada = new Set();
    function tambahPesan(arr) {
      const bawah = pesanBox.scrollTop + pesanBox.clientHeight >= pesanBox.scrollHeight - 40;
      arr.forEach(m => {
        if (ada.has(m.id)) return; ada.add(m.id); if (!sejak || m.id > sejak) sejak = m.id;
        const saya = m.dari === sisi; const l = m.lampiran || {};
        pesanBox.append(h('div', { class: 'gelembung' + (saya ? ' saya' : '') },
          l.foto ? h('a', { href: l.foto, target: '_blank', rel: 'noopener noreferrer' }, gambar(l.foto, 'Foto kiriman', '', 200)) : null,
          l.produk ? h('a', { href: href('/produk/' + l.produk.slug), style: { display: 'flex', gap: '8px', color: 'inherit', background: 'rgba(0,0,0,.06)', padding: '6px', borderRadius: '8px', marginBottom: '4px' } }, gambar(l.produk.foto, l.produk.nama, '', 44), h('div', null, h('div', { class: 'klem-2' }, l.produk.nama), h('b', null, rp(l.produk.harga)))) : null,
          m.isi ? h('span', null, m.isi) : null, h('span', { class: 'waktu' }, ' ' + jam(m.waktu))));
      });
      if (bawah || arr.length === 1) pesanBox.scrollTop = pesanBox.scrollHeight;
    }
    async function sinkron() {
      if (mati) return;
      try {
        const r = await panggil('chatSinkron', { threadId: aktifId, sejak, aktif: !document.hidden }, { coba: 1, diam: true }); sisi = r.sisi; tambahPesan(r.pesan);
        if (r.belumBaca) { await panggil('chatBaca', { threadId: aktifId }, { diam: true }); muatDaftarDiam(); }
        timer = setTimeout(sinkron, r.berikutnyaMs || CONFIG.SINKRON_CHAT_MS);
      } catch (e) { timer = setTimeout(sinkron, 10000); }
    }
    ganti(pesanBox, skeleton(2, 40)); pesanBox.innerHTML = ''; await sinkron(); pesanBox.scrollTop = pesanBox.scrollHeight;
  }
  async function muatDaftarDiam() { try { const r = await panggil('chatDaftar', {}, { diam: true }); atur({ chat: r.belumBaca }); } catch (e) { /* abaikan */ } }
  await muatDaftar(); await buka();
}
