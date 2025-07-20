// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Definisikan struktur data untuk setiap transaksi stok
struct StockTransaction {
    string itemName;      // Nama obat
    uint quantity;        // Kuantitas obat
    string transactionType; // Tipe transaksi (misal: "Masuk", "Keluar", "Rusak")
    uint timestamp;       // Waktu transaksi dicatat (epoch time)
    address actor;        // Alamat yang melakukan transaksi
}

contract StockLedger {
    // Array untuk menyimpan semua transaksi stok
    StockTransaction[] public transactions;

    // Event yang akan dipancarkan setiap kali transaksi baru dicatat
    event StockTransactionRecorded(
        uint id,
        string itemName,
        uint quantity,
        string transactionType,
        uint timestamp,
        address actor
    );

    // Fungsi untuk mencatat transaksi stok baru
    // Hanya pemilik kontrak yang bisa memanggil fungsi ini (opsional untuk MVP)
    // Untuk MVP, kita abaikan dulu pembatasan ini agar lebih cepat
    function recordTransaction(
        string memory _itemName,
        uint _quantity,
        string memory _transactionType
    ) public {
        // Buat objek StockTransaction baru
        StockTransaction memory newTransaction = StockTransaction({
            itemName: _itemName,
            quantity: _quantity,
            transactionType: _transactionType,
            timestamp: block.timestamp, // Waktu blok saat ini
            actor: msg.sender // Alamat yang memanggil fungsi ini
        });

        // Tambahkan transaksi ke array
        transactions.push(newTransaction);

        // Pancarkan event untuk memudahkan pemantauan dari luar blockchain
        emit StockTransactionRecorded(
            transactions.length - 1, // ID transaksi (indeks array)
            _itemName,
            _quantity,
            _transactionType,
            block.timestamp,
            msg.sender
        );
    }

    // Fungsi untuk mendapatkan detail transaksi berdasarkan indeks (opsional untuk MVP)
    function getTransaction(uint _index) public view returns (
        string memory itemName,
        uint quantity,
        string memory transactionType,
        uint timestamp,
        address actor
    ) {
        require(_index < transactions.length, "Invalid transaction index");
        StockTransaction storage t = transactions[_index];
        return (t.itemName, t.quantity, t.transactionType, t.timestamp, t.actor);
    }

    // Fungsi untuk mendapatkan jumlah total transaksi
    function getTotalTransactions() public view returns (uint) {
        return transactions.length;
    }
}