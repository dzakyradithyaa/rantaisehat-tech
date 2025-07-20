// const HDWalletProvider = require("@truffle/hdwallet-provider"); // Ini tidak dipakai untuk Ganache tapi sering ada di template

module.exports = {
  networks: {
    // Development network (Ganache)
    development: {
      host: "127.0.0.1", // Localhost (Ganache default)
      port: 7545, // Ganache default port (bisa 8545 juga, cek di Ganache GUI)
      network_id: "1337", // Any network (default: none) -> in gui 1337
    },
    // Jika nanti mau pakai testnet publik, bisa tambah konfigurasi di sini
    // ropsten: {
    //   provider: () => new HDWalletProvider(mnemonic, `https://ropsten.infura.io/v3/YOUR_INFURA_PROJECT_ID`),
    //   network_id: 3,
    //   gas: 5500000,
    //   confirmations: 2,
    //   timeoutBlocks: 200,
    //   skipDryRun: true
    // },
  },

  // Kompilasi smart contract
  compilers: {
    solc: {
      version: "0.8.0", // Sesuaikan dengan pragma di smart contract Anda
      // settings: {          // See the solidity docs for advice on optimization and unless you have a specific need,
      //  optimizer: {
      //    enabled: false,
      //    runs: 200
      //  },
      //  evmVersion: "byzantium"
      // }
    },
  },

  // Konfigurasi untuk tes (opsional)
  // mocha: {
  //   timeout: 100000
  // },

  // Konfigurasi untuk direktori build client (jika frontend di folder terpisah)
  // contracts_build_directory: './client/src/contracts/',
};
