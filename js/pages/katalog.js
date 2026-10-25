// Halaman katalog publik: beranda (landing berblok), pencarian, kategori, detail produk, toko, flash sale, halaman statis, verifikasi dokumen.
import { CONFIG } from '../config.js';
import { h, ikon, ganti, rp, angka, tgl, rel, bintang, gambar, debounce, qs, svgAman, FOTO_KOSONG } from '../lib/dom.js';
import { panggil, swr } from '../lib/api.js';
import { state } from '../lib/store.js';
import { href, navigasi, aturQuery } from '../lib/router.js';
import { kosong, kotakGalat, skelProduk, skeleton, tahan, laporGalat, paginasi, pilihChip, hitungMundur, ok as sukses, gagal, status, modal } from '../lib/ui.js';
import { kartuProduk, gridProduk, kartuFlash, kartuToko, kartuLive, blokKepala, karusel, kartuVoucher, tautan, pilihAvatar } from '../lib/komponen.js';
import { tambahKeKeranjang, perluMasuk } from '../lib/keranjang.js';
import { markdown } from '../lib/markdown.js';

const peta = { '/produk': '/cari', '/jual': '/jual/daftar' };
const link = (t) => { if (!t) return href('/'); if (/^https?:/i.test(t)) return t; return href(peta[t] || t); };

/* ================== BERANDA ================== */
export async function beranda(ctx) {
  const wadah = ctx.wadah; ganti(wadah, h('div', { class: 'wadah landing' }, skeleton(1, 220), skelProduk(5)));
  const kunci = 'beranda:' + (state.komunitas ? state.komunitas.slug : '') + ':' + (state.user ? 'u' : 't');
  const tampil = (d) => ganti(wadah, bangunBeranda(d, ctx));
  try { await swr(kunci, 'berandaData', { komunitas: state.komunitas ? state.komunitas.slug : undefined }, tampil, { segar: 60000, pribadi: false }); }
  catch (e) { ganti(wadah, h('div', { class: 'wadah seksi' }, kotakGalat(e, () => beranda(ctx)))); }
}
function bangunBeranda(d, ctx) {
  const b = d.bagian || {}; const w = h('div', { class: 'wadah landing' }); const seo = d.seo || {};
  ctx.setJudul(seo.judul ? seo.judul.replace(/ — .*/, '') : null, seo.deskripsi, { jsonLd: seo.jsonLd });
  if (seo.judul) document.title = seo.judul;
  const R = {
    hero: (k) => { const q = h('input', { class: 'input', type: 'search', placeholder: 'Cari produk atau toko…', 'aria-label': 'Cari' });
      return h('section', { class: 'hero' }, h('h1', null, k.judul), k.sub ? h('p', null, k.sub) : null,
        h('form', { class: 'cari-hero', role: 'search', onsubmit: (e) => { e.preventDefault(); navigasi(href('/cari') + qs({ q: q.value.trim() })); } }, q, h('button', { class: 'btn hangat', type: 'submit' }, ikon('search'), 'Cari')),
        k.cta ? h('div', { style: { marginTop: '16px' } }, h('a', { class: 'btn', style: { background: '#fff', color: 'var(--primer)' }, href: link(k.tautan) }, k.cta)) : null); },
    banner: (k) => (b.banners || []).length ? h('section', { class: 'blok', 'aria-label': 'Promo' }, karusel((b.banners).map(x => h('a', { href: link(x.tautan), 'aria-label': x.judul }, gambar(x.gambar, x.judul))), 'banner')) : null,
    kategori: (k) => (b.kategori || []).length ? h('section', { class: 'blok' }, blokKepala(k.judul, '/cari', 'Semua'), h('div', { class: 'kategori-ikon' }, b.kategori.map(c => h('a', { href: href('/kategori/' + c.slug) }, h('span', { class: 'lingkar' }, ikon(c.ikon || 'tag')), c.nama)))) : null,
    flashsale: (k) => (b.flashsale || []).length ? h('section', { class: 'blok' }, b.flashsale.map(f => h('div', { class: 'flash', style: { marginBottom: '12px' } }, h('div', { class: 'sebar', style: { marginBottom: '10px' } }, h('div', { class: 'baris-rapat' }, ikon('zap'), h('h2', null, f.judul || k.judul)), h('div', { class: 'baris-rapat' }, h('small', { style: { color: '#fff' } }, 'Berakhir dalam'), hitungMundur(f.selesai, () => navigasi(location.pathname + location.search, { diam: true })))), karusel(f.produk.map(p => kartuFlash(p, f)))))) : null,
    live: (k) => { const l = b.live || {}; const semua = [...(l.sedangLive || []), ...(l.jadwal || [])]; return semua.length ? h('section', { class: 'blok' }, blokKepala(k.judul, '/live'), karusel(semua.map(kartuLive))) : null; },
    voucher: (k) => (b.voucher || []).length ? h('section', { class: 'blok' }, blokKepala(k.judul), karusel(b.voucher.map(kartuVoucher))) : null,
    terlaris: (k) => (b.terlaris || []).length ? h('section', { class: 'blok' }, blokKepala(k.judul, '/cari?urut=terlaris'), gridProduk(b.terlaris)) : null,
    terbaru: (k) => (b.terbaru || []).length ? h('section', { class: 'blok' }, blokKepala(k.judul, '/cari?urut=terbaru'), gridProduk(b.terbaru)) : null,
    grosir: (k) => (b.grosir || []).length ? h('section', { class: 'blok' }, blokKepala(k.judul, '/cari?grosir=1'), gridProduk(b.grosir)) : null,
    toko: (k) => (b.toko || []).length ? h('section', { class: 'blok' }, blokKepala(k.judul), karusel(b.toko.map(kartuToko))) : null,
    jaminan: (k) => h('section', { class: 'blok' }, h('div', { class: 'kartu' }, h('h2', null, k.judul), h('div', { class: 'jaminan' }, [['shield', 'Dana aman (escrow)', 'Uang ditahan sampai barang Anda terima.'], ['award', 'Penjual terpercaya', 'Dinilai Skor Amanah & ulasan nyata.'], ['refresh', 'Retur dibantu', 'Sengketa ditengahi admin, bukan dibiarkan.']].map(([i, t, s]) => h('div', { class: 'baris', style: { flexWrap: 'nowrap', alignItems: 'flex-start' } }, h('span', { class: 'avatar' }, ikon(i)), h('div', null, h('div', { class: 'tebal' }, t), h('small', null, s))))))),
    jualan: (k) => h('section', { class: 'blok' }, h('div', { class: 'cta-jualan' }, h('div', null, h('h2', null, k.judul), h('p', { style: { margin: 0, opacity: .85 } }, k.sub || '')), h('a', { class: 'btn hangat lg', href: link(k.tautan || '/jual/daftar') }, k.cta || 'Buka toko'))),
    aplikasi: (k) => h('section', { class: 'blok' }, h('div', { class: 'kartu baris', style: { justifyContent: 'space-between' } }, h('div', { class: 'baris', style: { flexWrap: 'nowrap' } }, h('span', { class: 'avatar' }, ikon('smartphone')), h('div', null, h('div', { class: 'tebal' }, k.judul), h('small', null, 'Buka lebih cepat dari layar utama, tanpa unduh dari toko aplikasi.'))), tombolPasang())),
    tentang: (k) => h('section', { class: 'blok' }, h('div', { class: 'kartu' }, h('h2', null, k.judul), h('p', { class: 'redup' }, ((state.situs && state.situs.tagline) || CONFIG.TAGLINE)), tautan('/h/tentang', 'btn sekunder sm', 'Selengkapnya'))),
    komunitas: (k) => h('section', { class: 'blok' }, h('div', { class: 'kartu' }, h('h2', null, state.komunitas ? 'Selamat datang di ' + state.komunitas.nama : (k.judul || 'Komunitas')), h('p', null, k.sub || 'Belanja dari toko-toko anggota komunitas.'))),
    testimoni: (k) => null,
  };
  (d.blok || []).filter(k => k.aktif !== false).forEach(k => { const f = R[k.tipe]; if (!f) return; try { const n = f(k); if (n) w.append(n); } catch (e) { console.error('blok', k.tipe, e); } });
  if (!w.querySelector('.blok') && !w.querySelector('.hero')) w.append(kosong('Etalase masih kosong', 'Belum ada produk yang tampil. Segera hadir!', null, 'store'));
  return w;
}
let promptPasang = null; addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); promptPasang = e; });
function tombolPasang() { return h('button', { class: 'btn sm', type: 'button', onclick: async (e) => { if (promptPasang) { promptPasang.prompt(); promptPasang = null; } else { modal({ judul: 'Pasang di layar utama', isi: h('div', null, h('p', null, 'Android/Chrome: ketuk menu ⋮ → "Instal aplikasi" atau "Tambahkan ke layar utama".'), h('p', null, 'iPhone/Safari: ketuk tombol Bagikan → "Tambah ke Layar Utama".')), kaki: h('button', { class: 'btn', onclick: (ev) => ev.currentTarget.closest('.lapis').remove() }, 'Mengerti') }); } } }, 'Pasang'); }

/* ================== PENCARIAN / KATEGORI ================== */
const URUT = [{ k: 'relevan', t: 'Paling sesuai' }, { k: 'terlaris', t: 'Terlaris' }, { k: 'terbaru', t: 'Terbaru' }, { k: 'termurah', t: 'Harga terendah' }, { k: 'termahal', t: 'Harga tertinggi' }, { k: 'rating', t: 'Rating tertinggi' }];
export async function cari(ctx) { return halamanHasil(ctx, {}); }
export async function kategori(ctx) {
  const daftar = await swr('kategori', 'katalogKategori', {}, () => {}, { segar: 600000 }); const k = (daftar || []).find(x => x.slug === ctx.params.slug);
  if (!k) return h('div', { class: 'wadah seksi' }, kosong('Kategori tidak ditemukan', '', tautan('/cari', 'btn', 'Cari produk'), 'grid'));
  return halamanHasil(ctx, { kategori: k });
}
async function halamanHasil(ctx, { kategori: kat }) {
  const q0 = ctx.query; const st = { q: q0.q || '', urut: q0.urut || '', min: q0.min || '', maks: q0.maks || '', grosir: q0.grosir || '', hal: Number(q0.hal) || 1 };
  const kategoriId = kat ? kat.id : (q0.kategori || '');
  ctx.setJudul(kat ? kat.nama : (st.q ? 'Cari "' + st.q + '"' : 'Semua produk'), kat ? 'Belanja ' + kat.nama + ' dari berbagai toko.' : 'Cari produk dari banyak toko dalam satu keranjang.');
  const hasil = h('div', { 'aria-live': 'polite' }); const info = h('div', { class: 'redup', style: { margin: '8px 0' } }); const nav = h('div');
  const q = h('input', { class: 'input', type: 'search', value: st.q, placeholder: 'Cari produk…', 'aria-label': 'Kata kunci' });
  const urut = h('select', { class: 'select input', 'aria-label': 'Urutkan', style: { maxWidth: '200px' }, onchange: () => { st.urut = urut.value; st.hal = 1; muat(); } }, URUT.map(u => h('option', { value: u.k, selected: (st.urut || (st.q ? 'relevan' : 'terlaris')) === u.k }, u.t)));
  const min = h('input', { class: 'input', type: 'number', min: 0, placeholder: 'Harga min', value: st.min, 'aria-label': 'Harga minimum', style: { maxWidth: '130px' } }), maks = h('input', { class: 'input', type: 'number', min: 0, placeholder: 'Harga maks', value: st.maks, 'aria-label': 'Harga maksimum', style: { maxWidth: '130px' } });
  const grosir = h('label', { class: 'cek' }, h('input', { type: 'checkbox', checked: !!st.grosir, onchange: (e) => { st.grosir = e.target.checked ? '1' : ''; st.hal = 1; muat(); } }), 'Ada harga grosir');
  const tunda = debounce(() => { st.q = q.value.trim(); st.min = min.value; st.maks = maks.value; st.hal = 1; muat(); }, 350);
  [q, min, maks].forEach(i => i.addEventListener('input', tunda));
  async function muat() {
    aturQuery({ q: st.q, urut: st.urut, min: st.min, maks: st.maks, grosir: st.grosir, hal: st.hal > 1 ? st.hal : '' });
    ganti(hasil, skelProduk(10));
    try {
      const r = await panggil('katalogCari', { q: st.q, kategori: kategoriId, urut: st.urut || undefined, min: Number(st.min) || undefined, maks: Number(st.maks) || undefined, grosir: st.grosir ? 1 : undefined, hal: st.hal, per: 20 });
      info.textContent = r.total ? `${angka(r.total)} produk${st.q ? ' untuk "' + st.q + '"' : ''}` : '';
      ganti(hasil, r.item.length ? gridProduk(r.item) : kosong('Produk tidak ditemukan', 'Coba kata kunci lain atau kurangi filter.', h('button', { class: 'btn sekunder', onclick: () => navigasi(href('/cari')) }, 'Hapus filter'), 'search'));
      ganti(nav, paginasi(r, (p) => { st.hal = p; muat(); scrollTo({ top: 0, behavior: 'smooth' }); }));
    } catch (e) { ganti(hasil, kotakGalat(e, muat)); }
  }
  const w = h('div', { class: 'wadah seksi' }, kat ? h('nav', { 'aria-label': 'Jejak', class: 'kecil' }, tautan('/', null, 'Beranda'), ' › ', kat.nama) : null, h('h1', null, kat ? kat.nama : (st.q ? 'Hasil pencarian' : 'Semua produk')),
    h('div', { class: 'baris', style: { margin: '12px 0' } }, h('div', { style: { flex: '1 1 220px' } }, q), urut, min, maks, grosir), info, hasil, nav);
  ganti(ctx.wadah, w); muat();
}

/* ================== DETAIL PRODUK ================== */
export async function produk(ctx) {
  const wadah = ctx.wadah; ganti(wadah, h('div', { class: 'wadah seksi' }, skeleton(2, 260)));
  let d; try { d = await panggil('katalogDetail', { slug: ctx.params.slug }); } catch (e) { ganti(wadah, h('div', { class: 'wadah seksi' }, e.kode === 'NOT_FOUND' ? kosong('Produk tidak ditemukan', 'Mungkin sudah dihapus atau tidak tersedia.', tautan('/cari', 'btn', 'Cari produk lain')) : kotakGalat(e, () => produk(ctx)))); return; }
  const p = d.produk, fotos = p.foto && p.foto.length ? p.foto : [FOTO_KOSONG];
  const minH = Math.min(...d.varian.map(v => v.harga)), maksH = Math.max(...d.varian.map(v => v.harga));
  ctx.setJudul(p.nama, (p.deskripsi || '').slice(0, 155), { gambar: fotos[0], jsonLd: { '@context': 'https://schema.org', '@type': 'Product', name: p.nama, image: fotos, description: (p.deskripsi || '').slice(0, 300), brand: { '@type': 'Brand', name: d.toko.nama }, offers: { '@type': 'AggregateOffer', priceCurrency: 'IDR', lowPrice: minH, highPrice: maksH, availability: d.varian.some(v => v.stok > 0) ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock' }, ...(p.rating ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: p.rating, reviewCount: d.toko.jumlahUlasan || 1 } } : {}) } });
  let varianId = (d.varian.find(v => v.stok > 0) || d.varian[0]).id, qty = 1;
  const utama = gambar(fotos[0], p.nama, 'galeri-utama'); utama.loading = 'eager';
  const mini = h('div', { class: 'galeri-mini' }, fotos.map((f, i) => h('button', { type: 'button', 'aria-label': 'Foto ' + (i + 1), onclick: () => { utama.src = f; } }, gambar(f, '', '', 64))));
  const hargaEl = h('div'), stokEl = h('div'), grosirEl = h('div'), qtyIn = h('input', { type: 'number', min: 1, value: 1, 'aria-label': 'Jumlah' });
  const tier = () => d.grosir.filter(g => g.varianId === varianId).sort((a, b) => a.minQty - b.minQty);
  const hitung = () => { const v = d.varian.find(x => x.id === varianId); let hrg = v.harga; tier().forEach(t => { if (qty >= t.minQty && t.harga < hrg) hrg = t.harga; });
    ganti(hargaEl, h('div', { class: 'harga besar' }, rp(hrg)), hrg < v.harga ? h('span', { class: 'harga-coret' }, rp(v.harga)) : null, hrg < v.harga ? h('span', { class: 'tag-hangat', style: { marginLeft: '8px' } }, 'Harga grosir') : null);
    ganti(stokEl, v.stok > 0 ? (v.stok <= 5 ? h('span', { class: 'stok-tipis' }, 'Sisa ' + v.stok + ' — segera habis') : h('span', { class: 'redup' }, 'Stok: ' + angka(v.stok))) : h('span', { class: 'galat-teks' }, 'Stok habis'));
    const t = tier(); ganti(grosirEl, t.length ? h('div', { class: 'kartu', style: { background: 'var(--kartu-2)' } }, h('div', { class: 'tebal', style: { marginBottom: '6px' } }, 'Harga grosir'), h('table', { class: 'tabel-grosir' }, h('thead', null, h('tr', null, h('th', null, 'Jumlah'), h('th', null, 'Harga/pcs'))), h('tbody', null, t.map(x => h('tr', null, h('td', null, '≥ ' + x.minQty + ' pcs'), h('td', null, rp(x.harga))))))) : null);
    qtyIn.max = v.stok || 1; if (qty > v.stok && v.stok > 0) { qty = v.stok; qtyIn.value = qty; } beli.disabled = beliSekarang.disabled = v.stok < 1; };
  const varEl = d.varian.length > 1 || d.varian[0].nama !== 'Standar' ? h('div', { class: 'field' }, h('span', { class: 'label' }, 'Pilih varian'), h('div', { class: 'pil-pilih', role: 'radiogroup', 'aria-label': 'Varian' }, d.varian.map(v => h('label', null, h('input', { type: 'radio', name: 'varian', value: v.id, checked: v.id === varianId, disabled: v.stok < 1, onchange: () => { varianId = v.id; hitung(); } }), h('span', null, v.nama + ' · ' + rp(v.harga)))))) : null;
  const set = (n) => { qty = Math.max(1, Math.min(Number(qtyIn.max) || 1, n || 1)); qtyIn.value = qty; hitung(); };
  qtyIn.addEventListener('change', () => set(Number(qtyIn.value)));
  const beli = h('button', { class: 'btn sekunder lg', type: 'button', style: { flex: 1 }, onclick: (e) => tahan(e.currentTarget, () => tambahKeKeranjang(varianId, qty)) }, ikon('cart'), 'Keranjang');
  const beliSekarang = h('button', { class: 'btn lg', type: 'button', style: { flex: 1 }, onclick: (e) => tahan(e.currentTarget, async () => { const k = await tambahKeKeranjang(varianId, qty); if (k) { try { sessionStorage.setItem('gma-pilih', JSON.stringify([varianId])); } catch (x) { /* abaikan */ } navigasi(href('/checkout')); } }) }, 'Beli sekarang');
  let sukaAktif = false; const suka = h('button', { class: 'btn ghost', type: 'button', 'aria-pressed': 'false', onclick: async (e) => { if (perluMasuk()) return; await tahan(e.currentTarget, async () => { const r = await panggil('wishlistToggle', { produkId: p.id }); sukaAktif = !!(r && r.disimpan); suka.setAttribute('aria-pressed', sukaAktif); suka.style.color = sukaAktif ? 'var(--kasih)' : ''; sukses(sukaAktif ? 'Masuk wishlist.' : 'Dihapus dari wishlist.'); }); } }, ikon('heart'), 'Wishlist');
  const bagi = h('button', { class: 'btn ghost', type: 'button', onclick: async () => { const u = location.href; try { if (navigator.share) await navigator.share({ title: p.nama, url: u }); else { await navigator.clipboard.writeText(u); sukses('Tautan disalin.'); } } catch (e) { /* dibatalkan */ } } }, ikon('share'), 'Bagikan');
  const ringkasUlasan = h('div'); const ulasanList = h('div');
  panggil('ulasanDaftar', { produkId: p.id }).then(u => { ganti(ringkasUlasan, h('div', { class: 'baris' }, h('span', { class: 'harga' }, u.ringkas.jumlah ? Number(u.ringkas.rata).toFixed(1) : '–'), bintang(u.ringkas.rata || 0), h('span', { class: 'redup' }, u.ringkas.jumlah + ' ulasan'))); ganti(ulasanList, u.item.length ? u.item.map(r => h('div', { class: 'kartu', style: { marginBottom: '10px' } }, h('div', { class: 'sebar' }, h('div', { class: 'baris-rapat' }, pilihAvatar(r.nama, '', 32), h('strong', null, r.nama)), h('small', null, tgl(r.waktu))), bintang(r.rating), r.varian ? h('small', { class: 'redup', style: { display: 'block' } }, 'Varian: ' + r.varian) : null, h('p', { style: { margin: '6px 0 0' } }, r.isi), (r.foto || []).length ? h('div', { class: 'baris-rapat', style: { marginTop: '6px' } }, r.foto.map(f => gambar(f, 'Foto ulasan', '', 72))) : null, r.balasan ? h('div', { class: 'info-kotak', style: { marginTop: '8px' } }, h('b', null, 'Balasan penjual: '), r.balasan) : null)) : h('p', { class: 'redup' }, 'Belum ada ulasan.')); }).catch(() => {});
  const w = h('div', { class: 'wadah seksi' }, h('nav', { class: 'kecil', 'aria-label': 'Jejak' }, tautan('/', null, 'Beranda'), ' › ', p.kategori ? [tautan('/cari?kategori=' + p.kategori.id, null, p.kategori.nama), ' › '] : null, p.nama),
    h('div', { class: 'detail-grid' }, h('div', null, utama, fotos.length > 1 ? mini : null),
      h('div', { class: 'kolom' }, h('h1', { style: { marginBottom: 0 } }, p.nama), h('div', { class: 'baris' }, bintang(p.rating || 0), h('small', null, p.rating ? Number(p.rating).toFixed(1) : 'Belum ada rating'), h('small', null, '· ' + angka(p.terjual) + ' terjual')), hargaEl, grosirEl, varEl,
        h('div', { class: 'field' }, h('span', { class: 'label' }, 'Jumlah'), h('div', { class: 'baris' }, h('div', { class: 'qty' }, h('button', { type: 'button', 'aria-label': 'Kurangi', onclick: () => set(qty - 1) }, '−'), qtyIn, h('button', { type: 'button', 'aria-label': 'Tambah', onclick: () => set(qty + 1) }, '+')), stokEl)),
        h('div', { class: 'baris', style: { flexWrap: 'nowrap' } }, beli, beliSekarang), h('div', { class: 'baris-rapat' }, suka, bagi),
        h('a', { class: 'kartu baris', style: { flexWrap: 'nowrap', color: 'inherit' }, href: href('/toko/' + d.toko.slug) }, pilihAvatar(d.toko.nama, d.toko.logo, 48), h('div', { class: 'isi' }, h('div', { class: 'tebal' }, d.toko.nama), h('small', null, d.toko.kota + (d.toko.rating ? ' · ★ ' + Number(d.toko.rating).toFixed(1) : ''))), ikon('message')),
        h('div', { class: 'info-kotak' }, ikon('shield'), ' Dana aman: pembayaran ditahan sampai pesanan Anda terima.'))),
    h('section', { class: 'blok' }, h('h2', null, 'Deskripsi'), h('p', { style: { whiteSpace: 'pre-line' } }, p.deskripsi || 'Tidak ada deskripsi.'), h('small', null, 'Berat: ' + angka(p.berat) + ' gram')),
    h('section', { class: 'blok' }, h('h2', null, 'Ulasan pembeli'), ringkasUlasan, ulasanList),
    (d.serupa || []).length ? h('section', { class: 'blok' }, h('h2', null, 'Produk serupa'), gridProduk(d.serupa)) : null);
  hitung(); ganti(wadah, w);
  if (state.user) panggil('wishlistDaftar', {}, { diam: true }).then(l => { const arr = Array.isArray(l) ? l : (l.item || []); if (arr.some(x => x.id === p.id)) { sukaAktif = true; suka.setAttribute('aria-pressed', 'true'); suka.style.color = 'var(--kasih)'; } }).catch(() => {});
}

/* ================== TOKO ================== */
export async function toko(ctx) {
  const wadah = ctx.wadah; ganti(wadah, h('div', { class: 'wadah seksi' }, skeleton(2, 140), skelProduk(5)));
  let d; try { d = await panggil('tokoDetail', { slug: ctx.params.slug }); } catch (e) { ganti(wadah, h('div', { class: 'wadah seksi' }, e.kode === 'NOT_FOUND' ? kosong('Toko tidak ditemukan', '', tautan('/', 'btn', 'Ke beranda'), 'store') : kotakGalat(e, () => toko(ctx)))); return; }
  const t = d.toko; ctx.setJudul(t.nama, t.deskripsi || 'Produk dari ' + t.nama + ' di ' + CONFIG.NAMA + '.');
  const live = (d.live || []).length ? h('section', { class: 'blok' }, h('h2', null, 'Live toko ini'), karusel(d.live.map(kartuLive))) : null;
  ganti(wadah, h('div', { class: 'wadah seksi' }, h('div', { class: 'kartu rata' }, t.banner ? gambar(t.banner, '', '', 1200) : h('div', { style: { height: '90px', background: 'linear-gradient(120deg,var(--primer),var(--kasih))' } }),
    h('div', { class: 'baris', style: { padding: '16px', flexWrap: 'nowrap' } }, pilihAvatar(t.nama, t.logo, 64), h('div', { class: 'isi' }, h('h1', { style: { margin: 0 } }, t.nama), h('div', { class: 'baris-rapat' }, t.rating ? [bintang(t.rating), h('small', null, Number(t.rating).toFixed(1) + ' (' + t.jumlahUlasan + ' ulasan)')] : h('small', null, 'Toko baru'), h('small', null, '· ' + t.kota)), h('small', { class: 'redup' }, 'Bergabung ' + tgl(t.bergabung))),
      h('button', { class: 'btn sekunder', type: 'button', onclick: (e) => tahan(e.currentTarget, async () => { if (perluMasuk()) return; const r = await panggil('chatMulai', { tokoId: t.id }); navigasi(href('/chat/' + r.threadId)); }) }, ikon('message'), 'Chat'))),
    t.deskripsi ? h('p', { style: { marginTop: '12px' } }, t.deskripsi) : null, live, h('section', { class: 'blok' }, h('h2', null, 'Semua produk (' + d.produk.length + ')'), d.produk.length ? gridProduk(d.produk) : kosong('Belum ada produk', '', null, 'box'))));
}

/* ================== FLASH SALE ================== */
export async function flash(ctx) {
  ctx.setJudul('Flash Sale', 'Harga spesial terbatas waktu dan kuota.'); const isi = h('div'); ganti(ctx.wadah, h('div', { class: 'wadah seksi' }, h('h1', null, 'Flash Sale'), isi)); ganti(isi, skelProduk(5));
  try { const f = await panggil('flashSaleAktif', {}); ganti(isi, f.length ? f.map(x => h('div', { class: 'flash', style: { marginBottom: '16px' } }, h('div', { class: 'sebar', style: { marginBottom: '10px' } }, h('div', { class: 'baris-rapat' }, ikon('zap'), h('h2', null, x.judul)), h('div', { class: 'baris-rapat' }, h('small', { style: { color: '#fff' } }, 'Berakhir'), hitungMundur(x.selesai, () => flash(ctx)))), h('div', { class: 'grid g-produk' }, x.produk.map(p => kartuFlash(p, x))))) : kosong('Belum ada flash sale', 'Pantau terus, promo datang tiap minggu.', tautan('/cari', 'btn', 'Lihat semua produk'), 'zap')); } catch (e) { ganti(isi, kotakGalat(e, () => flash(ctx))); }
}

/* ================== HALAMAN STATIS ================== */
export async function halamanStatis(ctx) {
  const isi = h('article', { class: 'wadah seksi', style: { maxWidth: '820px' } }, skeleton(3, 80)); ganti(ctx.wadah, isi);
  try { const p = await panggil('kontenHalaman', { slug: ctx.params.slug }); ctx.setJudul(p.judul, p.seo && p.seo.deskripsi); ganti(isi, h('h1', null, p.judul), markdown(p.isi), h('small', { class: 'redup' }, 'Diperbarui ' + tgl(p.diperbarui))); }
  catch (e) { ganti(isi, e.kode === 'NOT_FOUND' ? kosong('Halaman tidak ditemukan', '', tautan('/', 'btn', 'Ke beranda')) : kotakGalat(e, () => halamanStatis(ctx))); }
}

/* ================== VERIFIKASI DOKUMEN ================== */
export async function verifikasi(ctx) {
  ctx.setJudul('Cek keaslian dokumen', 'Masukkan kode verifikasi 10 karakter di dokumen resmi.');
  const hasil = h('div', { 'aria-live': 'polite' }); const inp = h('input', { class: 'input', value: (ctx.params.kode || ctx.query.kode || '').toUpperCase(), maxlength: 14, placeholder: 'Contoh: A1B2C3D4E5', 'aria-label': 'Kode verifikasi', autocapitalize: 'characters', style: { textTransform: 'uppercase', letterSpacing: '.1em' } });
  const cek = async () => { const kode = inp.value.trim(); if (!kode) { inp.focus(); return; } history.replaceState(null, '', href('/verifikasi/' + encodeURIComponent(kode.replace(/[^A-Za-z0-9]/g, '')))); ganti(hasil, skeleton(1, 120));
    try { const r = await panggil('dokumenVerifikasi', { kode }); ganti(hasil, h('div', { class: 'kartu', style: { borderColor: r.sah ? 'var(--segar)' : 'var(--bahaya)', borderWidth: '2px' } }, h('div', { class: 'baris' }, h('span', { class: 'avatar', style: { background: r.sah ? 'var(--s-ok-bg)' : 'var(--s-gagal-bg)', color: r.sah ? 'var(--s-ok-tx)' : 'var(--s-gagal-tx)' } }, ikon(r.sah ? 'check' : 'x')), h('h2', { style: { margin: 0 } }, r.sah ? 'Dokumen ASLI' : 'Tidak berlaku')), h('p', null, r.pesan),
      r.jenis ? h('dl', { class: 'kv' }, h('dt', null, 'Jenis'), h('dd', null, r.jenis), h('dt', null, 'Nomor'), h('dd', null, r.nomor), h('dt', null, 'Diterbitkan'), h('dd', null, tgl(r.terbit, true)), h('dt', null, 'Ringkasan'), h('dd', null, r.ringkas), h('dt', null, 'Sidik jari'), h('dd', null, h('code', null, r.hash))) : null)); } catch (e) { ganti(hasil, kotakGalat(e, cek)); } };
  ganti(ctx.wadah, h('div', { class: 'wadah seksi', style: { maxWidth: '620px' } }, h('h1', null, 'Cek keaslian dokumen'), h('p', { class: 'redup' }, 'Masukkan kode verifikasi atau pindai kode QR pada dokumen resmi GMA Store (invoice, laporan, bukti pembayaran).'), h('form', { class: 'baris', style: { flexWrap: 'nowrap' }, onsubmit: (e) => { e.preventDefault(); cek(); } }, inp, h('button', { class: 'btn', type: 'submit' }, 'Periksa')), h('div', { style: { marginTop: '16px' } }, hasil)));
  if (ctx.params.kode || ctx.query.kode) cek();
}
