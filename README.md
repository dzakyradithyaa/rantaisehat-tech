RantaiSehat: Sistem Manajemen Stok Farmasi Berbasis Blockchain
Deskripsi Proyek
RantaiSehat adalah sebuah sistem manajemen stok farmasi yang inovatif, dirancang untuk meningkatkan transparansi, efisiensi, dan integritas data dalam pengelolaan obat-obatan. Proyek ini menggabungkan kekuatan teknologi Blockchain (Ethereum lokal) dengan Google Cloud Firestore untuk menyediakan solusi yang komprehensif.

Aplikasi ini bertujuan untuk mengatasi tantangan umum dalam manajemen stok farmasi tradisional, seperti kurangnya transparansi, integritas data yang meragukan, dan proses audit yang lambat. Dengan RantaiSehat, setiap pergerakan obat tercatat secara imutabel di blockchain, sementara metadata dan deteksi anomali dikelola secara fleksibel di Firestore.

Catatan Mengenai AI: Proyek Capstone ini dikembangkan dengan bantuan AI (seperti IBM Granite) selama fase pengembangan untuk mempercepat, meningkatkan, dan mendokumentasikan proses pembuatan kode. Namun, AI tidak disertakan sebagai fitur runtime dalam produk akhir ini.

Teknologi yang Digunakan
Proyek RantaiSehat dibangun menggunakan tumpukan teknologi berikut:

Frontend: HTML5, CSS3 (Bootstrap 5), JavaScript (ES6+)

Blockchain Interaksi: Web3.js

Smart Contract: Solidity (dideploy di Ganache lokal untuk pengembangan dan pengujian)

Database (Metadata & Anomali): Google Cloud Firestore

Visualisasi Data: Chart.js, Luxon

Pelaporan (PDF): jsPDF, html2canvas

Deployment Frontend: Firebase Hosting

Fitur Utama
RantaiSehat menawarkan serangkaian fitur untuk manajemen stok farmasi yang efektif:

Pencatatan Transaksi Blockchain:

Mencatat transaksi stok (Masuk, Keluar, Rusak, Penyesuaian Masuk/Keluar) secara imutabel di blockchain Ethereum lokal (Ganache).

Menyediakan jejak audit yang transparan dan tidak dapat diubah untuk setiap pergerakan obat.

Manajemen Stok Real-time & Metadata:

Menampilkan kuantitas stok simulasi terkini untuk setiap obat di dashboard.

Memungkinkan pengguna untuk mengubah nama tampilan obat (misalnya, nama merek) yang disimpan di Firestore, tanpa memengaruhi identitas blockchain asli.

Mendukung "penghapusan logis" item stok, di mana item ditandai sebagai tidak aktif di Firestore tetapi riwayat transaksinya tetap utuh di blockchain.

Deteksi & Peringatan Anomali:

Secara otomatis mendeteksi dan menampilkan peringatan untuk kondisi stok yang tidak biasa, seperti stok rendah, stok kritis, atau stok negatif.

Mendeteksi transaksi dengan kuantitas yang tidak biasa (misalnya, jumlah rusak yang tinggi atau pemasukan yang sangat besar).

Peringatan anomali stok negatif bersifat persisten di Firestore hingga diselesaikan.

Fungsi untuk membersihkan notifikasi anomali yang sudah teratasi.

Visualisasi Data Interaktif:

Menampilkan grafik tren stok obat yang dinamis menggunakan Chart.js, memungkinkan pengguna untuk menganalisis pergerakan stok dari waktu ke waktu.

Opsi untuk melihat tren stok untuk semua obat atau memilih obat tertentu.

Riwayat Transaksi & Pencarian:

Menampilkan daftar lengkap semua transaksi yang tercatat.

Fungsionalitas pencarian dan filter berdasarkan nama obat dan rentang tanggal untuk memudahkan audit.
