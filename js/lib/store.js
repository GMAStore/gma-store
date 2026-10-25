// State global kecil + penyimpanan lokal yang tahan error.
const P = 'gma1:';
export const simpan = {
  get(k, d = null) { try { const v = localStorage.getItem(P + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(P + k, JSON.stringify(v)); } catch (e) { /* penuh/diblokir: abaikan */ } },
  del(k) { try { localStorage.removeItem(P + k); } catch (e) { /* abaikan */ } },
  hapusPrefix(pre) { try { Object.keys(localStorage).filter(x => x.startsWith(P + pre)).forEach(x => localStorage.removeItem(x)); } catch (e) { /* abaikan */ } },
};
const dengar = new Map();
export const state = {
  token: simpan.get('token', ''),
  user: null,            // {id,nama,email,hp,peran[],...}
  saldo: null,
  komunitasId: simpan.get('komunitas', ''),
  komunitas: null,       // {id,nama,...}
  situs: null,           // dari berandaData.situs / kontenShell
  tema: simpan.get('tema', 'auto'),
  notif: 0, keranjang: 0, chat: 0,
  online: navigator.onLine,
};
export function atur(patch) {
  const lama = {}; for (const k of Object.keys(patch)) { lama[k] = state[k]; state[k] = patch[k]; }
  if ('token' in patch) patch.token ? simpan.set('token', patch.token) : simpan.del('token');
  if ('komunitasId' in patch) simpan.set('komunitas', patch.komunitasId);
  if ('tema' in patch) simpan.set('tema', patch.tema);
  for (const k of Object.keys(patch)) (dengar.get(k) || []).forEach(f => { try { f(state[k], lama[k]); } catch (e) { console.error(e); } });
}
export function pantau(kunci, fn) { const a = dengar.get(kunci) || []; a.push(fn); dengar.set(kunci, a); return () => dengar.set(kunci, (dengar.get(kunci) || []).filter(x => x !== fn)); }
export const punyaPeran = (...p) => !!(state.user && (state.user.peran || []).some(x => p.includes(x)));
export const adalahStafAdmin = () => punyaPeran('SUPER_ADMIN', 'ADMIN_OPS', 'ADMIN_KEU');
export function terapkanTema() {
  const t = state.tema, el = document.documentElement;
  if (t === 'terang') el.dataset.theme = 'light'; else if (t === 'gelap') el.dataset.theme = 'dark'; else delete el.dataset.theme;
  const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = getComputedStyle(el).getPropertyValue('--primer').trim() || '#5B4BFF';
}
