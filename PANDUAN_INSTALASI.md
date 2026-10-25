# Panduan Instalasi GMA Store — dari nol sampai online

Untuk pemula. Total waktu sekitar 45–60 menit. Kerjakan **berurutan**, satu langkah selesai baru lanjut.

Aplikasi ini punya dua bagian:

| Bagian | Isi | Dipasang di |
|---|---|---|
| **[Apps Script]** Backend | 26 berkas `.gs` + `appsscript.json` | Google Apps Script (otak + database di Google Sheets) |
| **[Mandiri]** Frontend | ZIP `gma-store-frontend.zip` (tampilan situs) | GitHub Pages |

Urutannya: **Backend dulu** (supaya dapat alamat `/exec`), baru **Frontend**.

---

## BAGIAN A — Backend di Google Apps Script

### A1. Buat proyek
1. Buka https://script.google.com → **Proyek baru** (New project).
2. Ubah nama proyek menjadi `GMA Store`.

### A2. Pasang manifest (sekali saja)
1. Klik ikon **⚙ Setelan proyek** (Project Settings) di kiri.
2. Centang **Tampilkan file manifes "appsscript.json" di editor**.
3. Kembali ke **Editor**, klik `appsscript.json`, **hapus isinya**, lalu tempel isi berkas `appsscript.json` yang saya kirim. Simpan (Ctrl+S).

### A3. Tempel 26 berkas `.gs` — satu per satu
Untuk **setiap** berkas `.gs` yang saya kirim:
1. Klik tanda **+** di samping "Files" → **Skrip** (Script).
2. Beri nama **persis sama** tanpa `.gs` (contoh: `Kode`, `Db`, `Auth`, …).
3. Hapus isi bawaan, tempel seluruh isi berkas, simpan.

Untuk berkas bawaan `Code.gs`: **ganti namanya** menjadi `Kode` lalu tempel isi `Kode.gs`.

Daftar lengkap (centang satu per satu): Kode, Util, Db, Setup, Triggers, Auth, Audit, Berkas, Harga, Katalog, Penjual, Pembeli, Checkout, Pembayaran, Pesanan, Kurir, Keuangan, Penalti, Ulasan, Live, Konten, Notifikasi, Crm, Dokumen, Ai, Admin.

> Urutan berkas tidak berpengaruh. Yang penting **tidak ada yang terlewat**.

### A4. Jalankan setup (sekali saja)
1. Di bagian atas editor pilih fungsi **`setupGmaStore`**, klik **Jalankan** (Run).
2. Google meminta izin → **Tinjau izin** → pilih akun Anda → **Lanjutan / Advanced** → **Buka GMA Store (tidak aman)** → **Izinkan**. Ini normal untuk skrip buatan sendiri.
3. Tunggu sampai **Log eksekusi** menampilkan "Selesai".
4. **Salin baris `AKUN SUPER ADMIN`** dari log: berisi email dan **sandi sementara**. Sandi ini **hanya tampil sekali** — simpan di Notepad.

Setup otomatis membuat: Spreadsheet data utama, folder Drive, data awal (kategori, kurir, pengaturan), 12 pemicu otomatis, dan akun Super Admin.

### A5. Terbitkan sebagai Web App
1. Klik **Terapkan** (Deploy) → **Penerapan baru** (New deployment).
2. Ikon ⚙ → pilih **Aplikasi web** (Web app).
3. Isi: **Jalankan sebagai: Saya (Me)** · **Siapa yang memiliki akses: Siapa saja (Anyone)**.
4. Klik **Terapkan**. **Salin URL Aplikasi Web** yang berakhiran **`/exec`**.

Uji cepat: buka URL itu di browser. Harus tampil teks JSON berisi `"ok":true`, bukan halaman login Google.

> Setiap kali Anda **mengubah kode `.gs`**, wajib **Terapkan → Kelola penerapan → ✏ → Versi: Versi baru → Terapkan**. URL `/exec` tetap sama.

---

## BAGIAN B — Frontend di GitHub Pages

### B1. Siapkan alat
- Pasang **Git**: https://git-scm.com/download/win (Windows, pengaturan bawaan semua). Mac: ketik `git --version` di Terminal. Cek di PowerShell: `git --version`.
- Punya akun GitHub: https://github.com.
- Setelah Git terpasang, atur identitas (sekali seumur komputer):
```
git config --global user.name "Nama Anda"
git config --global user.email "email-akun-github@contoh.com"
```

### B2. Ekstrak ZIP dan isi alamat backend
1. Ekstrak `gma-store-frontend.zip` ke folder, misalnya `C:\gma-store`.
2. Buka folder itu. **Pastikan Anda langsung melihat `index.html`, folder `css`, `js`, `assets`** — bukan satu folder pembungkus lagi. Kalau masih ada satu folder di dalamnya, masuk ke folder itu.
3. Buka `js\config.js` dengan Notepad. Tempel alamat `/exec` Anda:
```js
GAS_URL: 'https://script.google.com/macros/s/AKfycb....../exec',
```
(di antara tanda kutip, jangan ada spasi). **Wajib diisi sebelum push pertama.** Simpan.

### B3. Buat repository
1. GitHub → **+** → **New repository**.
2. Nama: misalnya `gma-store`. Pilih **Public**. **Jangan** centang README/.gitignore/license. **Create repository**.

### B4. Buat Personal Access Token (kata sandi untuk terminal)
GitHub tidak menerima password biasa di terminal.
1. Buka https://github.com/settings/tokens → **Generate new token (classic)**.
2. Note: `gma-store`; Expiration: 90 days; centang **repo**. **Generate token**.
3. **Salin token `ghp_...` sekarang** (hanya tampil sekali). Simpan di Notepad.

### B5. Push lewat terminal
Buka folder berisi `index.html`, klik kotak alamat di File Explorer, ketik `powershell`, Enter. Lalu satu per satu:

**1. Cek dulu isi folder:**
```
dir
```
Harus terlihat `index.html`, `css`, `js`, `assets`. Jika tidak terlihat, **berhenti** — Anda di folder yang salah (pindah dulu dengan `cd`).

**2. Lanjutkan:**
```
git init
git add .
git commit -m "Upload pertama GMA Store"
git branch -M main
git remote add origin https://github.com/USERNAME/gma-store.git
git push -u origin main
```
Ganti `USERNAME`. Saat diminta **Username**: username GitHub. **Password**: tempel **token** (layar tampak kosong saat mengetik/paste — itu normal, tekan Enter).

Sukses bila muncul `* [new branch] main -> main`.

### B6. Aktifkan GitHub Pages
1. Repo → **Settings** → **Pages**.
2. Source: **Deploy from a branch** · Branch: **main** · folder **/ (root)** → **Save**.
3. Centang **Enforce HTTPS** (wajib).
4. Tunggu 1–2 menit. Alamat situs: `https://USERNAME.github.io/gma-store/`

### B7. Beri tahu backend alamat situs
Masuk ke situs → **Masuk** dengan akun Super Admin → **Admin → Pengaturan** → isi **URL_FRONTEND** dengan alamat situs Anda → Simpan. Segera ganti sandi di **Akun**.

---

## BAGIAN C — Setelah online

| Hal | Di mana |
|---|---|
| Kunci gateway pembayaran, Fonnte (WA), AI | **Admin → Kunci API**. Selama kosong, fitur berjalan **SIMULASI** (aman untuk uji coba). |
| Buat akun admin ops/keuangan | **Admin → Pengguna → Tambah staf admin** |
| Buat akun kurir | **Admin → Pengguna → Buat akun kurir** (sandi sementara tampil sekali); tarif kurir di **Admin → Kurir & tarif** |
| Pasang beranda | **Admin → Landing → pilih templat → Aktifkan** |
| Notifikasi WA | **Admin → Notifikasi** → isi token Fonnte di Kunci → aktifkan saklar |
| Domain `.id` sendiri | GitHub Pages → Custom domain; lalu perbarui `URL_FRONTEND` |

## Cara memperbarui frontend
Dari folder yang sama:
```
git add .
git commit -m "Perubahan"
git push
```
Tunggu 1–2 menit, lalu **Ctrl+Shift+R** di browser.

## Masalah umum

| Gejala | Penyebab | Solusi |
|---|---|---|
| Situs 404 padahal push sukses | `git init` di folder yang salah | Pindah ke folder berisi `index.html`, ulangi B5 dengan `git push -u origin main --force` |
| Tampilan polos / tanpa gaya | Struktur folder rata | Jangan upload lewat web GitHub; ulangi lewat terminal |
| "Password authentication is not supported" | Memakai password akun | Pakai token (B4) |
| Situs tampil tetapi data kosong/error jaringan | `GAS_URL` kosong/salah, atau akses web app bukan "Siapa saja" | Periksa B2 & A5 |
| Perubahan `.gs` tak berpengaruh | Belum membuat versi baru penerapan | Lihat catatan di A5 |
| Halaman hasil refresh menampilkan 404 GitHub | Normal sesaat; rute ditangani `404.html` | Pastikan `404.html` ikut ter-push |
| Lupa sandi Super Admin | — | Di editor Apps Script pilih fungsi `resetSandiSuperAdmin` → Jalankan → sandi baru tampil di Log |
