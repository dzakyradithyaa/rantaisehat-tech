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

Pelaporan:

Kemampuan untuk mengunduh laporan stok saat ini dalam format PDF.

Instruksi Penyiapan (Setup Instructions)
Ikuti langkah-langkah di bawah ini untuk mengatur dan menjalankan proyek RantaiSehat secara lokal dan melakukan deployment.

1. Kloning Repositori
Jika proyek Anda ada di GitHub, kloning repositori ke mesin lokal Anda:

git clone <URL_REPO_ANDA>
cd rantai-sehat-tech # Atau nama folder utama proyek Anda

2. Penyiapan Proyek Smart Contract (Hardhat)
Navigasikan ke folder proyek smart contract Anda (misalnya, smart-contract-project):

cd smart-contract-project

a. Inisialisasi Node.js & Instal Hardhat
npm init -y
npm install --save-dev hardhat
npx hardhat

Saat npx hardhat, pilih Create a JavaScript project, tekan Enter untuk root proyek saat ini, dan tekan Y untuk menginstal dependensi.

b. Instal Dependensi Tambahan
npm install dotenv --save-dev
npm install @nomicfoundation/hardhat-toolbox --save-dev

c. Pindahkan Smart Contract Anda
Pastikan file StockLedger.sol Anda berada di contracts/ di dalam folder smart-contract-project/.

d. Konfigurasi .env
Buat file .env di root folder smart-contract-project/ dan isi dengan:

SEPOLIA_URL="https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY_VALUE"
PRIVATE_KEY="YOUR_METAMASK_PRIVATE_KEY_HERE"

Ganti placeholder dengan URL Alchemy Sepolia Anda dan private key MetaMask Anda.

PENTING: Tambahkan .env ke .gitignore Anda di folder smart-contract-project/.

e. Konfigurasi hardhat.config.js
Buka hardhat.config.js dan pastikan konfigurasi untuk Sepolia ada dan dotenv di-require:

require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.0", // Sesuaikan dengan versi Solidity kontrak Anda
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_URL || "",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111,
    },
  },
};

f. Buat Script Deployment
Buat file deploy.js di scripts/ (di dalam smart-contract-project/) dan isi dengan kode deployment untuk StockLedger.sol.

// scripts/deploy.js
const hre = require("hardhat");
async function main() {
  const StockLedger = await hre.ethers.getContractFactory("StockLedger");
  const stockLedger = await StockLedger.deploy();
  await stockLedger.deployed();
  console.log("StockLedger deployed to:", stockLedger.address);
}
main().then(() => process.exit(0)).catch((error) => { console.error(error); process.exit(1); });

g. Kompilasi & Deploy Smart Contract ke Sepolia
npx hardhat compile
npx hardhat run scripts/deploy.js --network sepolia

SALIN ALAMAT KONTRAK YANG DIHASILKAN. Anda akan membutuhkannya untuk frontend.

Pastikan MetaMask Anda terhubung ke Sepolia Test Network dan memiliki Sepolia ETH.

3. Penyiapan & Deployment Aplikasi Frontend (Firebase Hosting)
Navigasikan kembali ke folder utama proyek Anda, lalu masuk ke folder client:

cd .. # Kembali ke rantai-sehat-tech/
cd client

a. Instal Firebase CLI & Login (Jika Belum)
npm install -g firebase-tools
firebase login

b. Inisialisasi Firebase Project (Jika Belum)
firebase init

Pilih Hosting.

Pilih proyek Firebase yang sudah ada atau buat yang baru.

Untuk public directory, ketik . (titik).

Untuk single-page app, ketik No.

Untuk GitHub, ketik No.

Saat ditanya File index.html already exists. Overwrite?, ketik N (No).

c. Konfigurasi app.js
Buka app.js Anda dan perbarui:

CONTRACT_ADDRESS: Ganti dengan alamat kontrak Sepolia yang Anda salin dari langkah 2.g.

chainId di updateConnectionStatusDisplay: Ubah dari 1337 menjadi 11155111 dan sesuaikan pesan status.

d. Deploy ke Firebase Hosting
firebase deploy

Setelah selesai, Anda akan mendapatkan "Hosting URL" (misalnya, https://your-project-id.web.app).

4. Verifikasi Aplikasi yang Di-deploy
Buka "Hosting URL" Anda di browser.

Buka ekstensi MetaMask Anda dan pastikan terhubung ke "Sepolia Test Network".

Periksa status koneksi blockchain di aplikasi Anda.

Coba catat transaksi baru untuk memverifikasi interaksi dengan blockchain Sepolia.

Penjelasan Dukungan AI
Proyek RantaiSehat dikembangkan dengan bantuan AI (seperti IBM Granite atau model LLM serupa) selama fase pembuatan kode. AI digunakan untuk:

Percepatan Pengembangan: Membantu dalam menghasilkan boilerplate code, struktur fungsi, dan snippets kode dasar.

Peningkatan Kualitas Kode: Memberikan saran untuk penanganan error, struktur kode yang lebih baik, dan praktik terbaik.

Dokumentasi: Membantu dalam pembuatan komentar kode, penjelasan fungsi, dan bagian-bagian dokumentasi proyek.

Penting untuk dicatat bahwa fungsionalitas AI ini adalah alat pendukung dalam proses pengembangan dan tidak terintegrasi sebagai fitur runtime dalam aplikasi RantaiSehat yang final.

[Opsional: Tambahkan tangkapan layar aplikasi Anda di sini]
