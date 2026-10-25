// Komponen tampilan yang dipakai banyak halaman.
import { h, ikon, gambar, rp, angka, singkat, bintang, tgl, rel } from './dom.js';
import { href } from './router.js';
import { status } from './ui.js';

export const tautan = (p, kelas, ...anak) => h('a', { href: href(p), class: kelas || null }, ...anak);

export function kartuProduk(p) {
  const adaGrosir = p.hargaGrosir && p.hargaGrosir < p.harga;
  return h('a', { class: 'kartu-produk', href: href('/produk/' + p.slug), 'aria-label': p.nama + ', ' + rp(p.harga) },
    h('div', { style: { position: 'relative' } }, gambar(p.foto, p.nama, 'foto'), h('div', { class: 'lencana' }, adaGrosir ? h('span', { class: 'tag-hangat' }, 'Grosir') : null, p.stok > 0 && p.stok <= 5 ? h('span', { class: 'tag-segar', style: { background: 'var(--s-gagal-bg)', color: 'var(--s-gagal-tx)' } }, 'Sisa ' + p.stok) : null)),
    h('div', { class: 'info' }, h('div', { class: 'nama klem-2' }, p.nama),
      h('div', { class: 'harga' }, rp(p.harga)), adaGrosir ? h('small', { class: 'redup' }, 'Grosir ' + rp(p.hargaGrosir) + ' (min ' + p.moqGrosir + ')') : null,
      h('div', { class: 'baris-rapat', style: { fontSize: '12px', color: 'var(--teks-2)' } }, p.rating ? [ikon('star'), Number(p.rating).toFixed(1)] : h('span', null, 'Baru'), p.terjual ? h('span', null, '· ' + singkat(p.terjual) + ' terjual') : null),
      p.toko ? h('div', { class: 'toko-mini' }, ikon('store'), h('span', { class: 'potong' }, p.toko.nama + (p.toko.kota ? ' · ' + p.toko.kota : ''))) : null));
}
export const gridProduk = (daftar) => h('div', { class: 'grid g-produk' }, daftar.map(kartuProduk));

export function kartuFlash(p, f) {
  const persen = p.kuota ? Math.min(100, Math.round((p.terjual / p.kuota) * 100)) : 0;
  return h('a', { class: 'kartu-produk', style: { width: '170px' }, href: href('/produk/' + p.slug) }, h('div', { style: { position: 'relative' } }, gambar(p.foto, p.nama, 'foto'), h('div', { class: 'lencana' }, h('span', { class: 'tag-hangat' }, '-' + p.diskonPersen + '%'))),
    h('div', { class: 'info' }, h('div', { class: 'nama klem-2' }, p.nama), h('div', { class: 'harga harga-promo' }, rp(p.hargaFlash)), h('span', { class: 'harga-coret' }, rp(p.hargaNormal)),
      h('div', { class: 'progress', role: 'progressbar', 'aria-valuenow': persen, 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-label': 'Terjual ' + persen + '%' }, h('i', { style: { width: persen + '%', background: 'var(--kasih)' } })), h('small', null, p.sisa > 0 ? 'Sisa ' + p.sisa : 'Habis')));
}
export function kartuToko(t) {
  return h('a', { class: 'kartu-toko', href: href('/toko/' + t.slug) }, t.logo ? gambar(t.logo, t.nama, 'gambar-bulat', 64) : h('div', { class: 'avatar', style: { width: '64px', height: '64px', margin: '0 auto', fontSize: '20px' } }, (t.nama || '?')[0].toUpperCase()),
    h('div', { class: 'tebal potong', style: { marginTop: '8px' } }, t.nama), h('small', null, t.kota || ''), t.rating ? h('div', { style: { marginTop: '4px' } }, bintang(t.rating), h('small', null, ' ' + Number(t.rating).toFixed(1) + ' (' + t.ulasan + ')')) : h('small', { class: 'redup', style: { display: 'block' } }, 'Toko baru'));
}
export function kartuLive(l) {
  const sedang = l.status === 'Live';
  return h('a', { class: 'kartu-live', href: href('/live/' + l.id), 'aria-label': 'Live: ' + l.judul }, h('div', { class: 'bg', style: l.sampul ? { backgroundImage: `url(${l.sampul})`, backgroundSize: 'cover' } : null }),
    sedang ? h('span', { class: 'status live' }, 'LIVE') : h('span', { class: 'status proses' }, rel(l.jadwal)),
    h('div', { style: { background: 'linear-gradient(transparent, rgba(0,0,0,.65))', margin: '-12px', padding: '36px 12px 12px' } }, h('div', { class: 'tebal klem-2' }, l.judul), h('small', { style: { color: '#fff', opacity: .85 } }, l.toko ? l.toko.nama : ''), sedang ? h('small', { style: { color: '#fff', display: 'block' } }, ikon('users'), ' ' + angka(l.penonton) + ' menonton') : null));
}
export const blokKepala = (judul, tautanSemua, teks = 'Lihat semua') => h('div', { class: 'blok-kepala' }, h('h2', null, judul), tautanSemua ? tautan(tautanSemua, null, teks + ' ›') : null);
export const karusel = (anak, kelas = '') => h('div', { class: 'karusel ' + kelas, tabindex: 0, role: 'region', 'aria-label': 'Daftar geser' }, anak);
export function kodeSalin(kode) { return h('button', { class: 'btn sm', type: 'button', onclick: async (e) => { try { await navigator.clipboard.writeText(kode); e.currentTarget.textContent = 'Tersalin ✓'; } catch (x) { e.currentTarget.textContent = kode; } } }, 'Salin'); }
export function kartuVoucher(v) {
  const nilai = v.jenis === 'PERSEN' ? v.nilai + '%' : rp(v.nilai);
  return h('div', { class: 'kartu-voucher' }, h('div', { class: 'kiri' }, h('div', { class: 'tebal' }, nilai), h('small', null, 'OFF')), h('div', { style: { padding: '10px 12px', flex: 1, minWidth: 0 } }, h('div', { class: 'tebal potong' }, v.kode || v.KodeVoucher), h('small', { class: 'redup' }, v.minBelanja ? 'Min ' + rp(v.minBelanja) : 'Tanpa minimum'), h('div', { style: { marginTop: '6px' } }, kodeSalin(v.kode || v.KodeVoucher))));
}
export function pilihAvatar(nama, logo, ukuran = 40) { return logo ? gambar(logo, nama, 'gambar-bulat', ukuran) : h('div', { class: 'avatar', style: { width: ukuran + 'px', height: ukuran + 'px' } }, (nama || '?')[0].toUpperCase()); }
export { status };
