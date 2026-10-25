// Titik masuk aplikasi: sesi, tema, rangka, router.
import { CONFIG } from './config.js';
import { state, atur, terapkanTema, pantau } from './lib/store.js';
import { panggil, saatSesiHabis, swr, URL_API } from './lib/api.js';
import { pasangHooks, mulaiRouter, navigasi, href, jalurSaatIni, BASE } from './lib/router.js';
import { pasangLayout, tandaiAktif, bersihSesi, segarkanLencana, mulaiLencana } from './lib/layout.js';
import { muatSesi } from './lib/sesi.js';
import { toast, tutupSemuaModal } from './lib/ui.js';
import { h } from './lib/dom.js';

terapkanTema();
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (state.tema === 'auto') terapkanTema(); });
let sedangHabis = false;
saatSesiHabis(() => {
  if (sedangHabis || !state.token) return; sedangHabis = true; bersihSesi(); tutupSemuaModal();
  toast('Sesi Anda berakhir. Silakan masuk lagi.', 'info');
  navigasi(href('/masuk') + '?lanjut=' + encodeURIComponent(jalurSaatIni() + location.search), { ganti: true }); setTimeout(() => { sedangHabis = false; }, 1500);
});
pasangHooks({ pasangLayout, saatSelesai: () => tandaiAktif() });

/* Penanda offline */
function barOffline() { let b = document.getElementById('offline'); if (!navigator.onLine) { if (!b) { b = h('div', { id: 'offline', class: 'offline-bar', role: 'status' }, 'Anda sedang offline. Beberapa fitur tidak tersedia.'); document.body.prepend(b); } } else if (b) b.remove(); atur({ online: navigator.onLine }); }
addEventListener('online', () => { barOffline(); segarkanLencana(); }); addEventListener('offline', barOffline); barOffline();

export async function muatShell() {
  try { const d = await swr('shell', 'kontenShell', { komunitas: (state.komunitas && state.komunitas.slug) || undefined }, (x) => atur({ situs: { ...x.situs, tema: x.tema, template: x.template, mode: x.mode } }), { segar: 300000 }); if (d) atur({ situs: { ...d.situs, tema: d.tema, template: d.template, mode: d.mode }, komunitas: d.komunitas }); } catch (e) { atur({ situs: { nama: CONFIG.NAMA, tagline: CONFIG.TAGLINE, tema: {}, halaman: [] } }); }
}
async function mulai() {
  // Pulihkan alamat dari 404.html (GitHub Pages tidak punya rewrite)
  try { const r = sessionStorage.getItem('gma-redirect'); if (r) { sessionStorage.removeItem('gma-redirect'); history.replaceState(null, '', r); } } catch (e) { /* abaikan */ }
  if (!URL_API) { document.getElementById('app').replaceChildren(h('div', { class: 'wadah seksi' }, h('div', { class: 'galat-kotak' }, h('b', null, 'Alamat server belum diisi. '), 'Buka js/config.js lalu isi GAS_URL dengan alamat Web App Apps Script Anda (berakhiran /exec).'))); return; }
  await Promise.all([muatSesi(), muatShell()]);
  mulaiLencana(); await mulaiRouter(); segarkanLencana();
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register(BASE + '/sw.js').catch(() => {});
}
mulai();
