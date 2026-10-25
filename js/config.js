// ============================================================
//  PENGATURAN GMA STORE  — ISI SEBELUM PUSH PERTAMA KE GITHUB
// ============================================================
export const CONFIG = {
  // 1) Tempel URL Web App Apps Script Anda (berakhiran /exec). Contoh:
  //    'https://script.google.com/macros/s/AKfycbwczxShIaNoY8CWmgL-zkIlVMSrRN9CJr77lwbZgvMovK0PJ493Jw51FbJJYu2lzOdl/exec'
  //    Dikosongkan = mode pengembangan lokal (memakai server contoh di /api).
  GAS_URL: '',

  // 2) Nama & alamat situs (dipakai untuk judul tab, tautan berbagi, dan SEO).
  NAMA: 'GMA Store',
  TAGLINE: 'Belanja & live shopping dari toko-toko komunitasmu',

  // 3) Folder situs. Kosongkan jika dipasang di https://nama.github.io/ (repo "nama.github.io").
  //    Jika repo bernama "gma-store" → '/gma-store' (terdeteksi otomatis, biarkan kosong).
  BASE: '',

  VERSI: '1.0.0',
  TIMEOUT_MS: 30000,
  SINKRON_CHAT_MS: 4000,
  SINKRON_LIVE_MS: 5000,
};
