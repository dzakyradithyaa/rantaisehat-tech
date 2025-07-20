# RantaiSehat

**Sistem Manajemen Stok Farmasi Berbasis Blockchain**

## 📌 Deskripsi Proyek
RantaiSehat adalah aplikasi sistem manajemen stok farmasi yang inovatif yang menggabungkan teknologi **blockchain (Ethereum lokal)** dan **Google Cloud Firestore** untuk menciptakan solusi pengelolaan obat-obatan dengan transparansi, keamanan, dan integritas data yang lebih baik. Sistem ini mencatat setiap transaksi obat secara *immutable* di blockchain lokal, sehingga data sulit dimanipulasi. Metadata transaksi dan deteksi anomali dikelola di Firestore guna memberikan fleksibilitas dan real-time update. Tujuan utamanya adalah mengatasi masalah transparansi, keandalan data, dan proses audit lambat yang sering ditemui dalam sistem stok farmasi tradisional.

## 🧠 Dukungan AI (IBM Granite)
Dalam pengembangan, proyek ini menggunakan **AI IBM Granite** melalui Replicate API untuk:
- Menyusun validasi form dan logika bisnis transaksi
- Memberikan saran struktur data yang optimal
- Mendeteksi anomali seperti stok negatif dan transaksi tidak biasa
- Membantu penulisan dokumentasi teknis dan alur sistem

## ⚙️ Teknologi Utama
| Komponen        | Teknologi                          |
| --------------- | --------------------------------- |
| Frontend        | HTML5, CSS3 (Bootstrap 5), JavaScript (ES6+) |
| Backend & DB    | Firebase Firestore, Firebase Authentication |
| Blockchain      | Ethereum lokal (Ganache), Smart Contract, Web3.js, MetaMask |
| AI Support      | IBM Granite (via Replicate API)   |
| Visualisasi     | Chart.js                         |

## 🌟 Fitur Unggulan
- 🔐 **Pencatatan transaksi immutable** dengan blockchain untuk jaminan data tidak bisa diubah
- 📊 **Visualisasi stok dan riwayat transaksi** secara real-time dengan grafik interaktif
- 🔗 **Autentikasi & koneksi real-time** menggunakan dompet MetaMask
- 🤖 **Deteksi anomali berbasis AI** untuk mencegah kesalahan data seperti stok negatif
- ✅ **Validasi form interaktif** untuk input data yang tepat dan akurat
- 📱 **Tampilan responsif**, kompatibel dengan perangkat mobile dan desktop
- 👥 **Manajemen pengguna berbasis peran (role-based access control)**

## 🚀 Cara Setup dan Menjalankan
1. **Clone Repository**
   ```bash
   git clone https://github.com/username/rantaisehat.git
   cd rantaisehat
   ```

2. **Install Dependencies** (jika menggunakan AI helper atau backend tambahan)
   ```bash
   npm install
   ```

3. **Jalankan Ganache**
   - Pastikan Ganache sudah terpasang (GUI atau CLI).
   - Buka Ganache, buat workspace baru, atau gunakan default server di `http://127.0.0.1:7545`.
   - Deploy smart contract jika belum.

4. **Hubungkan MetaMask dengan Ganache**
   - Import salah satu private key dari akun Ganache ke MetaMask.
   - Tambahkan network dengan konfigurasi:
     - RPC: `http://127.0.0.1:7545`
     - Chain ID: 1337 atau 5777 (sesuai Ganache).

5. **Jalankan Aplikasi Secara Lokal**
   - Buka `index.html` secara langsung di browser (gunakan Live Server jika melalui VS Code).
   - Pastikan MetaMask sudah terhubung ke jaringan Ganache.

6. **Menggunakan Aplikasi**
   - Tambahkan data stok obat melalui form input.
   - Setiap transaksi tercatat di blockchain dan muncul di riwayat.
   - Gunakan tab riwayat dan grafik untuk pemantauan stok secara real-time.
   - Sistem AI akan memberikan peringatan otomatis jika terdeteksi anomali (misal stok minus).

## 📚 Referensi & Manfaat Teknologi
- **Blockchain** meningkatkan keamanan dan transparansi rantai pasok farmasi dengan pencatatan data yang desentralisasi dan tidak dapat diubah, mencegah pemalsuan dan manipulasi data[2][4][5].
- **Google Cloud Firestore** menyediakan database real-time dan scalable untuk metadata dan fungsi tambahan seperti deteksi anomali.
- **AI (IBM Granite)** membantu pengembangan dengan otomasi validasi dan pendeteksian potensi kesalahan pada data input.

## 📞 Kontak
Untuk pertanyaan dan kontribusi, silakan hubungi:
- Nama: [Dzaky Radithya Abimanyu]  
- Email: [rantaisehat-tech@gmail.com]  
- GitHub: [github.com/dzakyradithyaa]
