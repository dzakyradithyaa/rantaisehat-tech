// scripts/deploy.js (di rantai-sehat-tech/smart-contract-project/scripts/deploy.js)

const hre = require("hardhat"); // Mengimpor Hardhat Runtime Environment

async function main() {
  // Dapatkan ContractFactory untuk kontrak StockLedger Anda.
  // Pastikan "StockLedger" sama persis dengan nama kontrak di StockLedger.sol
  const StockLedger = await hre.ethers.getContractFactory("StockLedger");

  // Deploy kontrak. Ini akan mengirim transaksi deployment ke jaringan Sepolia.
  // Hardhat akan menggunakan akun yang dikonfigurasi di hardhat.config.js (dari .env)
  // untuk menandatangani dan mengirim transaksi ini.
  const stockLedger = await StockLedger.deploy();

  // Tunggu hingga kontrak benar-benar di-deploy dan dikonfirmasi di blockchain.
  // Ini penting agar Anda mendapatkan alamat kontrak yang valid.
  await stockLedger.deployed();

  // Cetak alamat kontrak yang di-deploy ke konsol.
  // ALAMAT INI SANGAT PENTING! SALINLAH DENGAN HATI-HATI.
  console.log("StockLedger deployed to:", stockLedger.address);
}

// Jalankan fungsi main dan tangani error.
// Ini adalah pola standar untuk script Hardhat.
main()
  .then(() => process.exit(0)) // Keluar dari proses Node.js dengan kode sukses jika berhasil
  .catch((error) => {
    console.error(error); // Cetak error ke konsol jika ada masalah
    process.exit(1); // Keluar dari proses Node.js dengan kode error
  });
