// hardhat.config.js

require("dotenv").config(); // <<< PASTIKAN BARIS INI ADA DI PALING ATAS
require("@nomicfoundation/hardhat-toolbox"); // Jika Anda menggunakannya

module.exports = {
  solidity: "0.8.0", // Sesuaikan dengan versi Solidity kontrak Anda
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_URL || "",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111,
    },
  },
};
