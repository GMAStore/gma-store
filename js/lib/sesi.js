// Sesi pengguna: muat profil, setelah masuk/keluar bangun ulang rangka.
import { state, atur } from './store.js';
import { panggil } from './api.js';
import { paksaBangunUlang, segarkanLencana } from './layout.js';
export async function muatSesi() {
  if (!state.token) { atur({ user: null }); return; }
  try { const r = await panggil('authSaya', {}, { diam: true, coba: 2 }); atur({ user: r.user, saldo: r.saldo }); }
  catch (e) { if (e.kode === 'AUTH') atur({ token: '', user: null }); }
}
export async function setelahMasuk(token, user) { atur({ token, user }); paksaBangunUlang(); await muatSesi(); segarkanLencana(); }
export function tujuanLanjut(def = '/') { const l = new URLSearchParams(location.search).get('lanjut'); return l && l.startsWith('/') && !l.startsWith('//') ? l : def; }
