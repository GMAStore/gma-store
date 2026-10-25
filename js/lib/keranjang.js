// Operasi keranjang: server menyimpan seluruh keranjang sekaligus, jadi ambil → ubah → simpan.
import { panggil } from './api.js';
import { state, atur } from './store.js';
import { navigasi, href, jalurSaatIni } from './router.js';
import { toast } from './ui.js';
import { hitungKeranjang } from './layout.js';

const keItems = (k) => k.grup.flatMap(g => g.items.map(i => { const o = { v: i.varianId, q: i.qty }; const m = /^LIVE:(LIV-\d{6}-\d{3})$/.exec(i.jenisHarga || ''); if (m) o.live = m[1]; return o; }));
export async function ambilKeranjang() { const k = await panggil('keranjangAmbil'); atur({ keranjang: hitungKeranjang(k) }); return k; }
export async function simpanItems(items) { const k = await panggil('keranjangSimpan', { items }); atur({ keranjang: hitungKeranjang(k) }); return k; }
export function perluMasuk() {
  if (state.user) return false;
  toast('Silakan masuk dulu untuk melanjutkan.', 'info'); navigasi(href('/masuk') + '?lanjut=' + encodeURIComponent(jalurSaatIni() + location.search)); return true;
}
export async function tambahKeKeranjang(varianId, qty = 1, live = '') {
  if (perluMasuk()) return null;
  const k = await panggil('keranjangAmbil'); const items = keItems(k); const ada = items.find(i => i.v === varianId);
  if (ada) { ada.q += qty; if (live) ada.live = live; } else items.push(live ? { v: varianId, q: qty, live } : { v: varianId, q: qty });
  const baru = await simpanItems(items); toast('Ditambahkan ke keranjang.', 'ok'); return baru;
}
export async function ubahJumlah(varianId, qty) { const k = await panggil('keranjangAmbil'); const items = keItems(k).map(i => i.v === varianId ? { ...i, q: qty } : i).filter(i => i.q > 0); return simpanItems(items); }
export async function hapusItem(varianId) { return ubahJumlah(varianId, 0); }
export { keItems };
