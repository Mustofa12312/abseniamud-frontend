# IAIMU Attendance Web SPA (React + Vite + Tailwind CSS)
**Institut Agama Islam Miftahul Ulum Pamekasan**

Aplikasi Web SPA & Dashboard Admin Presensi IAIMU berbasis React 19, Vite 8, Tailwind CSS, dan Leaflet Map.

---

## 🌟 Fitur Utama

1. **Dashboard & Monitoring**:
   - Dashboard Super Admin, Admin Akademik, dan Admin Keuangan.
   - Portal Dosen & Tendik (Jadwal Mengajar, Presensi Harian, Riwayat, Izin/Cuti, Koreksi).
   - Monitoring Kehadiran Real-time & Telemetri GPS (jarak meter, akurasi, koordinat).
2. **Master Data Komprehensif**:
   - Master Ruangan (dengan Import & Ekspor CSV/Excel).
   - Master Fakultas & Prodi (dengan Import & Ekspor CSV/Excel).
   - Master Dosen & Tenaga Kependidikan (dengan Import & Ekspor CSV/Excel).
   - Master Mata Kuliah (dengan Import & Ekspor CSV/Excel).
   - Master Jadwal Perkuliahan (Plotting Senin–Minggu, bentrok validator, Import & Ekspor CSV/Excel).
   - Master Tahun Akademik & Hari Libur Nasional/Kampus.
3. **Pelaporan & Berita Acara**:
   - Ekspor Laporan Presensi Excel (`.xlsx`) dan CSV (`.csv`).
   - Format Cetak Lembar Berita Acara Rekapitulasi Presensi siap cetak resmi A4.
4. **PWA & Responsif**:
   - Dukungan Progressive Web App (Service Worker & Manifest).
   - Desain responsif mobile, tablet, dan desktop dengan Apple Light / Dark mode.

---

## 🛠️ Instalasi & Menjalankan Lokal

```bash
# 1. Masuk ke direktori
cd iaimu-web

# 2. Instal dependensi
npm install

# 3. Jalankan development server
npm run dev
# Aplikasi dapat diakses di http://localhost:5173

# 4. Jalankan build produksi
npm run build
```

---

## 🧪 Pengujian & Linting

```bash
# Menjalankan unit tests
npm run test

# Menjalankan Oxlint linter
npm run lint
```
