// client/app.js

// Import Firebase SDKs yang diekspos secara global dari index.html
const {
  initializeApp,
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged,
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  onSnapshot,
  deleteDoc,
  serverTimestamp,
  query, // Import query
  where, // Import where
  getDocs, // Import getDocs
} = window;

// Variabel global untuk instance Firebase
let app;
let auth;
let db;
let userId;

// Variabel untuk menyimpan instance Chart.js
let stockChartInstance = null;

// Objek untuk menyimpan nama tampilan obat yang diubah oleh pengguna
let stockMetadataMap = {};

// PENTING: Deklarasikan firebaseConfig dan appId secara global
const firebaseConfig = {};
let appId = "";

// --- Variabel Global Blockchain ---
let web3;
let accounts;
let stockLedgerContract;
let allTransactions = [];
let simulatedStock = {};
let historicalStockData = {};
let itemColors = {};
let currentColorIndex = 0;

// Alamat kontrak yang sudah dideploy
const CONTRACT_ADDRESS = "0xE520716B63c34E9Fc9cd6C84D3E9c7C8cd3cF1C6";

// ABI (Application Binary Interface) dari smart contract
const CONTRACT_ABI = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "string",
        name: "itemName",
        type: "string",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "quantity",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "string",
        name: "transactionType",
        type: "string",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "actor",
        type: "address",
      },
    ],
    name: "StockTransactionRecorded",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "transactions",
    outputs: [
      {
        internalType: "string",
        name: "itemName",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "quantity",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "transactionType",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "actor",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
    constant: true,
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_itemName",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "_quantity",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "_transactionType",
        type: "string",
      },
    ],
    name: "recordTransaction",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_index",
        type: "uint256",
      },
    ],
    name: "getTransaction",
    outputs: [
      {
        internalType: "string",
        name: "itemName",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "quantity",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "transactionType",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "actor",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
    constant: true,
  },
  {
    inputs: [],
    name: "getTotalTransactions",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
    constant: true,
  },
];

// --- Variabel DOM Elemen (diinisialisasi null, akan diisi di setupDOMElements) ---
let anomalyAlertsList = null;
let simulatedStockTableBody = null;
let clearAnomalyAlertsBtn = null;
let chartItemSelect = null;
let connectionStatusContainer = null; // NEW: Container status koneksi

// Variabel untuk custom modal (alert umum)
const customAlertModal = document.getElementById("customAlertModal");
const customAlertContent = customAlertModal.querySelector(
  ".custom-modal-content"
);
const customAlertTitle = document.getElementById("customAlertTitle");
const customAlertMessage = document.getElementById("customAlertMessage");
const customAlertCloseBtn = document.getElementById("customAlertCloseBtn");
const customAlertOkBtn = document.getElementById("customAlertOkBtn");

// Variabel untuk modal formulir transaksi baru
const transactionFormModalElement = document.getElementById(
  "transactionFormModal"
);
let transactionFormModalInstance;
const openTransactionModalBtn = document.getElementById(
  "openTransactionModalBtn"
);
// Perbaikan: Menggunakan ID yang benar untuk form di dalam modal
const transactionForm = document.getElementById("transactionForm");

// Variabel untuk modal ubah nama
const renameModalElement = document.getElementById("renameModal");
let renameModalInstance;
const renameForm = document.getElementById("renameForm");
let currentRenameItemName = "";

// Ambang batas stok rendah
const LOW_STOCK_THRESHOLD = 20;
// --- Akhir Variabel DOM Elemen ---

// Fungsi untuk menampilkan custom modal (alert umum)
function showCustomAlert(
  message,
  title = "Peringatan",
  type = "info",
  onOk = null,
  showCancel = false,
  onCancel = null
) {
  customAlertTitle.textContent = title;
  customAlertMessage.innerHTML = message;

  customAlertContent.classList.remove(
    "custom-modal-success",
    "custom-modal-warning",
    "custom-modal-error",
    "custom-modal-info"
  );
  customAlertTitle.parentElement.classList.remove(
    "custom-modal-success",
    "custom-modal-warning",
    "custom-modal-error",
    "custom-modal-info"
  );

  if (type === "success") {
    customAlertContent.classList.add("custom-modal-success");
    customAlertTitle.parentElement.classList.add("custom-modal-success");
  } else if (type === "warning") {
    customAlertContent.classList.add("custom-modal-warning");
    customAlertTitle.parentElement.classList.add("custom-modal-warning");
  } else if (type === "error") {
    customAlertContent.classList.add("custom-modal-error");
    customAlertTitle.parentElement.classList.add("custom-modal-error");
  } else if (type === "info") {
    customAlertContent.classList.add("custom-modal-info");
    customAlertTitle.parentElement.classList.add("custom-modal-info");
  }

  // Hapus event listener sebelumnya untuk mencegah duplikasi
  customAlertOkBtn.onclick = null;
  customAlertCloseBtn.onclick = null;
  let cancelButton = customAlertModal.querySelector("#customAlertCancelBtn");
  if (cancelButton) {
    cancelButton.onclick = null;
  }

  customAlertOkBtn.onclick = () => {
    customAlertModal.classList.remove("show");
    if (onOk) onOk();
  };
  customAlertCloseBtn.onclick = () => {
    customAlertModal.classList.remove("show");
    if (onCancel) onCancel();
  };

  if (showCancel) {
    if (!cancelButton) {
      cancelButton = document.createElement("button");
      cancelButton.id = "customAlertCancelBtn";
      cancelButton.type = "button";
      cancelButton.classList.add("btn", "btn-secondary", "ms-2");
      cancelButton.textContent = "Batal";
      customAlertModal
        .querySelector(".custom-modal-footer")
        .prepend(cancelButton);
    }
    cancelButton.style.display = "inline-block";
    cancelButton.onclick = () => {
      customAlertModal.classList.remove("show");
      if (onCancel) onCancel();
    };
  } else {
    if (cancelButton) {
      cancelButton.style.display = "none";
    }
  }

  customAlertModal.classList.add("show");
}

// Fungsi untuk mengatur listener autentikasi Firebase
function setupAuthListeners() {
  window.onAuthStateChanged(window.getAuth(app), async (user) => {
    if (user) {
      userId = user.uid;
      console.log("User is logged in:", user.email, "UID:", userId);
      await initMainAppFeatures();
    } else {
      console.log("User is logged out. Redirecting to login page.");
      window.location.href = "login.html";
    }
  });
}

// NEW: Fungsi untuk menginisialisasi semua elemen DOM dan event listener terkait
function setupDOMElements() {
  anomalyAlertsList = document.getElementById("anomalyAlerts");
  simulatedStockTableBody = document.getElementById("simulatedStockTableBody");
  clearAnomalyAlertsBtn = document.getElementById("resetStockBtn");
  chartItemSelect = document.getElementById("chartItemSelect");
  connectionStatusContainer = document.getElementById(
    "connectionStatusContainer"
  );

  // Inisialisasi instance modal Bootstrap
  transactionFormModalInstance = new bootstrap.Modal(
    transactionFormModalElement
  );
  renameModalInstance = new bootstrap.Modal(renameModalElement);

  // Tambahkan event listener untuk tombol clear anomaly alerts
  if (clearAnomalyAlertsBtn) {
    clearAnomalyAlertsBtn.removeEventListener(
      "click",
      clearResolvedAnomalyAlerts
    ); // Pastikan tidak ada listener duplikat
    clearAnomalyAlertsBtn.addEventListener("click", clearResolvedAnomalyAlerts);
  }

  // Tambahkan event listener untuk tombol pencarian
  const searchTransactionsBtn = document.getElementById(
    "searchTransactionsBtn"
  );
  if (searchTransactionsBtn) {
    searchTransactionsBtn.addEventListener("click", handleSearchSubmit);
  } else {
    console.error("Elemen 'searchTransactionsBtn' tidak ditemukan.");
  }

  const resetSearchBtn = document.getElementById("resetSearchBtn");
  if (resetSearchBtn) {
    resetSearchBtn.addEventListener("click", handleResetSearch);
  } else {
    console.error("Elemen 'resetSearchBtn' tidak ditemukan.");
  }

  // Tambahkan event listener untuk dropdown grafik
  if (chartItemSelect) {
    chartItemSelect.addEventListener("change", () => {
      renderStockChart(chartItemSelect.value);
    });
  } else {
    console.error("Elemen 'chartItemSelect' tidak ditemukan.");
  }

  // Tambahkan event listener untuk tombol "Catat Transaksi Baru" di navbar
  if (openTransactionModalBtn) {
    openTransactionModalBtn.addEventListener("click", () => {
      transactionFormModalInstance.show();
    });
  } else {
    console.error("Elemen 'openTransactionModalBtn' tidak ditemukan.");
  }

  // Tambahkan event listener untuk form ubah nama
  if (renameForm) {
    renameForm.addEventListener("submit", handleRenameFormSubmit);
  } else {
    console.error("Elemen 'renameForm' tidak ditemukan.");
  }

  // Event listener untuk form transaksi baru (di dalam modal)
  // Perbaikan: Menggunakan ID yang benar 'transactionForm'
  if (transactionForm) {
    transactionForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const itemName = document.getElementById("itemName").value.trim();
      const quantity = parseInt(document.getElementById("quantity").value);
      const transactionType = document.getElementById("transactionType").value;

      if (!itemName || isNaN(quantity) || quantity <= 0 || !transactionType) {
        showCustomAlert(
          "Mohon isi semua kolom dengan benar.",
          "Input Tidak Valid",
          "warning"
        );
        return;
      }

      if (!stockLedgerContract || !accounts || accounts.length === 0) {
        showCustomAlert(
          "Aplikasi belum terhubung ke blockchain. Coba refresh halaman atau periksa MetaMask Anda.",
          "Koneksi Gagal",
          "error"
        );
        return;
      }

      updateConnectionStatusDisplay(
        "Mengirim transaksi ke blockchain... Mohon konfirmasi di MetaMask.",
        "info",
        "fas fa-spinner fa-spin"
      );

      try {
        const result = await stockLedgerContract.methods
          .recordTransaction(itemName, quantity, transactionType)
          .send({ from: accounts[0] });

        console.log("Transaksi berhasil:", result);
        updateConnectionStatusDisplay(
          "Transaksi berhasil dicatat di blockchain!",
          "success",
          "fas fa-check-circle"
        );
        showCustomAlert(
          `Transaksi <strong>${transactionType}</strong> <strong>${
            stockMetadataMap[itemName]?.displayName || itemName
          }</strong> (<strong>${quantity}</strong> unit) berhasil dicatat di blockchain!`,
          "Transaksi Berhasil",
          "success"
        );

        // Reset form di dalam modal
        document.getElementById("transactionForm").reset(); // Menggunakan ID yang benar
        if (document.activeElement) {
          document.activeElement.blur();
        }
        transactionFormModalInstance.hide();
      } catch (error) {
        console.error("Error saat mengirim transaksi:", error);
        let errorMessage = `Gagal mencatat transaksi: ${
          error.message || error
        }.`;
        if (error.code === 4001) {
          showCustomAlert(
            "Transaksi dibatalkan oleh pengguna di MetaMask.",
            "Transaksi Dibatalkan",
            "warning"
          );
        } else {
          showCustomAlert(
            `Gagal mencatat transaksi: ${error.message || error}.`,
            "Error Transaksi",
            "error"
          );
        }
        updateConnectionStatusDisplay(
          errorMessage,
          "danger",
          "fas fa-times-circle"
        );
      }
    });
  } else {
    console.error("Elemen 'transactionForm' tidak ditemukan.");
  }
}

// Fungsi terpisah untuk inisialisasi fitur utama aplikasi
async function initMainAppFeatures() {
  const logoutBtn = document.getElementById("logoutBtn");

  // Panggil fungsi untuk menginisialisasi elemen DOM dan event listener
  setupDOMElements();

  if (
    typeof window.__firebase_config === "undefined" ||
    typeof window.__app_id === "undefined"
  ) {
    showCustomAlert(
      "Variabel konfigurasi Firebase tidak ditemukan. Pastikan index.html memuatnya dengan benar.",
      "Error Konfigurasi",
      "error"
    );
    return;
  }

  Object.assign(firebaseConfig, JSON.parse(window.__firebase_config));
  appId = window.__app_id;

  try {
    if (!app) app = window.initializeApp(firebaseConfig);
    if (!db) db = window.getFirestore(app);
    if (!auth) auth = window.getAuth(app);

    if (
      typeof window.__initial_auth_token !== "undefined" &&
      window.__initial_auth_token !== ""
    ) {
      await window.signInWithCustomToken(auth, window.__initial_auth_token);
    } else if (!auth.currentUser) {
      await window.signInAnonymously(auth);
    }
    userId = auth.currentUser?.uid || crypto.randomUUID();
    console.log("Firebase initialized. User ID:", userId);

    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        showCustomAlert(
          "Apakah Anda yakin ingin keluar? Anda akan masuk sebagai pengguna anonim baru jika Anda me-refresh halaman.",
          "Konfirmasi Logout",
          "warning",
          async () => {
            try {
              await window.getAuth(app).signOut();
              showCustomAlert(
                "Anda telah berhasil keluar.",
                "Logout Berhasil",
                "success"
              );
              window.location.reload();
            } catch (error) {
              console.error("Error during logout:", error);
              showCustomAlert(
                `Gagal logout: ${error.message}`,
                "Logout Gagal",
                "error"
              );
            }
          },
          true // Menampilkan tombol batal
        );
      });
    }

    // Set up Firestore listener for stock metadata
    const stockMetadataRef = window.collection(
      db,
      `artifacts/${appId}/public/data/stock_metadata`
    );
    window.onSnapshot(
      stockMetadataRef,
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          const data = change.doc.data();
          if (change.type === "added" || change.type === "modified") {
            stockMetadataMap[change.doc.id] = data;
          } else if (change.type === "removed") {
            delete stockMetadataMap[change.doc.id];
          }
        });
        console.log("Stock Metadata Updated:", stockMetadataMap);
        updateSimulatedStockDisplay();
        populateChartItemDropdown();
        renderStockChart(chartItemSelect.value);
        displayTransactions(allTransactions);
      },
      (error) => {
        console.error("Error listening to stock metadata:", error);
        showCustomAlert(
          "Gagal memuat metadata stok dari Firestore. Tampilan nama mungkin tidak akurat.",
          "Error Data",
          "error"
        );
      }
    );

    // Inisialisasi dan dengarkan anomali persisten dari Firestore
    const persistentAnomaliesRef = window.collection(
      db,
      `artifacts/${appId}/public/data/persistent_anomalies`
    );
    window.onSnapshot(
      persistentAnomaliesRef,
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          const data = change.doc.data();
          if (change.type === "added" || change.type === "modified") {
            persistentAnomaliesMap[change.doc.id] = data;
          } else if (change.type === "removed") {
            delete persistentAnomaliesMap[change.doc.id];
          }
        });
        console.log("Persistent Anomalies Updated:", persistentAnomaliesMap);
        updateAnomalyAlertsDisplay();
      },
      (error) => {
        console.error("Error listening to persistent anomalies:", error);
        showCustomAlert(
          "Gagal memuat peringatan anomali persisten dari Firestore.",
          "Error Data",
          "error"
        );
      }
    );
  } catch (error) {
    console.error("Error during Firebase initialization:", error);
    showCustomAlert(
      "Gagal melakukan inisialisasi Firebase. Beberapa fitur mungkin tidak berfungsi.",
      "Error Firebase",
      "error"
    );
    userId = "anonymous-local-user";
  }

  // 1. Cek Web3 provider (MetaMask)
  if (window.ethereum) {
    web3 = new Web3(window.ethereum);
    updateConnectionStatusDisplay(
      "Memuat status koneksi MetaMask...",
      "info",
      "fas fa-spinner fa-spin"
    ); // Initial loading state
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      accounts = await web3.eth.getAccounts();

      await updateConnectionStatusDisplay();

      // 2. Buat instance kontrak
      stockLedgerContract = new web3.eth.Contract(
        CONTRACT_ABI,
        CONTRACT_ADDRESS
      );

      // 3. Muat semua transaksi yang sudah ada dan perbarui stok simulasi
      await loadAllTransactions();

      // 4. Dengarkan event transaksi baru
      listenForNewTransactions();

      // 5. Tambahkan event listener untuk perubahan akun dan jaringan MetaMask
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);
      window.ethereum.on("disconnect", handleChainChanged);
    } catch (error) {
      console.error("Error saat menghubungkan ke MetaMask:", error);
      updateConnectionStatusDisplay(
        "Gagal terhubung ke MetaMask. Pastikan Anda mengizinkan akses dan MetaMask terbuka.",
        "danger",
        "fas fa-exclamation-circle"
      );
    } finally {
      // updateConnectionStatusDisplay() will be called again after loadAllTransactions
      // to ensure final status is accurate.
    }
  } else if (window.web3) {
    web3 = new Web3(window.web3.currentProvider);
    updateConnectionStatusDisplay(
      "Web3 provider lama terdeteksi.",
      "warning",
      "fas fa-info-circle"
    );
    try {
      accounts = await web3.eth.getAccounts();
      stockLedgerContract = new web3.eth.Contract(
        CONTRACT_ABI,
        CONTRACT_ADDRESS
      );
      await loadAllTransactions();
      listenForNewTransactions();

      // 5. Tambahkan event listener untuk perubahan akun dan jaringan MetaMask
      // Note: window.web3.currentProvider mungkin tidak memiliki event listener yang sama dengan window.ethereum
      // Ini adalah fallback, jadi mungkin tidak semua event didukung
      if (window.web3.currentProvider && window.web3.currentProvider.on) {
        window.web3.currentProvider.on(
          "accountsChanged",
          handleAccountsChanged
        );
        window.web3.currentProvider.on("chainChanged", handleChainChanged);
        window.web3.currentProvider.on("disconnect", handleChainChanged);
      }
    } catch (error) {
      console.error("Error saat menghubungkan ke MetaMask (fallback):", error);
      updateConnectionStatusDisplay(
        "Gagal terhubung ke MetaMask (fallback). Cek konsol untuk detail.",
        "danger",
        "fas fa-exclamation-circle"
      );
    } finally {
      // updateConnectionStatusDisplay() will be called again after loadAllTransactions
    }
  } else {
    updateConnectionStatusDisplay(
      "Non-Ethereum browser terdeteksi. Anda harus mempertimbangkan untuk menginstal MetaMask!",
      "danger",
      "fas fa-exclamation-triangle"
    );
    console.warn(
      "Non-Ethereum browser detected. Anda harus mempertimbangkan untuk menginstal MetaMask!"
    );
  }
}

// Fungsi untuk memperbarui tampilan status koneksi
async function updateConnectionStatusDisplay(
  message = null,
  type = null,
  iconClass = null
) {
  // Pastikan connectionStatusContainer sudah diinisialisasi
  if (!connectionStatusContainer) {
    console.error("connectionStatusContainer is null. Cannot update display.");
    return;
  }

  // Clear previous classes
  connectionStatusContainer.className = "connection-status-card mb-4";
  connectionStatusContainer.innerHTML = ""; // Clear previous content

  let displayMessage = message;
  let displayIconClass = iconClass;
  let displayType = type;
  let displayAddress = "";

  try {
    // Hanya coba dapatkan akun dan chainId jika web3 sudah terinisialisasi
    if (web3) {
      accounts = await web3.eth.getAccounts();
      const chainId = await web3.eth.getChainId();

      if (accounts.length > 0) {
        if (chainId === 1337) {
          // Ganache Chain ID
          displayMessage = "Terhubung ke MetaMask";
          displayType = "success";
          displayIconClass = "fas fa-check-circle";
          displayAddress = accounts[0];
        } else {
          displayMessage = `MetaMask terhubung ke jaringan yang salah (Chain ID: ${chainId}). Pastikan Anda terhubung ke Ganache Local (Chain ID 1337).`;
          displayType = "warning";
          displayIconClass = "fas fa-exclamation-triangle";
          displayAddress = accounts[0];
        }
      } else {
        displayMessage =
          "MetaMask terhubung, tetapi tidak ada akun yang dipilih atau diizinkan.";
        displayType = "warning";
        displayIconClass = "fas fa-exclamation-circle";
      }
    } else {
      // Jika web3 belum terinisialisasi, gunakan pesan default yang diberikan atau pesan umum
      displayMessage = displayMessage || "Memuat status koneksi MetaMask...";
      displayType = displayType || "info";
      displayIconClass = iconClass || "fas fa-spinner fa-spin";
    }
  } catch (error) {
    console.error("Gagal memperbarui status koneksi MetaMask:", error);
    displayMessage =
      "Gagal terhubung ke MetaMask. Pastikan Anda mengizinkan akses dan MetaMask terbuka.";
    displayType = "danger";
    iconClass = "fas fa-times-circle";
  }

  connectionStatusContainer.classList.add(`status-${displayType}`);
  connectionStatusContainer.innerHTML = `
      <i class="${displayIconClass} status-icon"></i>
      <span class="status-text">${displayMessage}</span>
      ${
        displayAddress
          ? `<span class="address-display" title="Klik untuk menyalin" data-address="${displayAddress}">${displayAddress.substring(
              0,
              6
            )}...${displayAddress.slice(-4)}</span>`
          : ""
      }
    `;

  // Add click listener for address display
  const addressDisplayElement =
    connectionStatusContainer.querySelector(".address-display");
  if (addressDisplayElement) {
    addressDisplayElement.addEventListener("click", () => {
      copyToClipboard(addressDisplayElement.dataset.address);
      showCustomAlert(
        "Alamat akun berhasil disalin ke clipboard!",
        "Disalin!",
        "success"
      );
    });
  }
}

// Fungsi untuk menyalin teks ke clipboard
function copyToClipboard(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

// Fungsi Handler untuk perubahan akun MetaMask
async function handleAccountsChanged(newAccounts) {
  accounts = newAccounts;
  console.log(
    "Akun MetaMask berubah ke:",
    accounts.length > 0 ? accounts[0] : "Tidak ada akun"
  );
  await updateConnectionStatusDisplay();
  // Tidak perlu reload penuh, cukup perbarui UI
  // window.location.reload(); // Dihapus untuk pengalaman yang lebih mulus
}

// Fungsi Handler untuk perubahan jaringan MetaMask
async function handleChainChanged(chainId) {
  console.log("Jaringan MetaMask berubah ke Chain ID:", parseInt(chainId, 16));
  await updateConnectionStatusDisplay();
  // Tidak perlu reload penuh, cukup perbarui UI
  // window.location.reload(); // Dihapus untuk pengalaman yang lebih mulus
}

// Fungsi untuk menghasilkan warna acak yang konsisten
const chartColors = [
  "rgba(255, 99, 132, 0.7)", // Merah
  "rgba(54, 162, 235, 0.7)", // Biru
  "rgba(255, 206, 86, 0.7)", // Kuning
  "rgba(75, 192, 192, 0.7)", // Hijau
  "rgba(153, 102, 255, 0.7)", // Ungu
  "rgba(255, 159, 64, 0.7)", // Oranye
  "rgba(199, 199, 199, 0.7)", // Abu-abu
  "rgba(83, 102, 255, 0.7)", // Indigo
  "rgba(255, 99, 200, 0.7)", // Pink
  "rgba(0, 128, 0, 0.7)", // Hijau Tua
];

function getConsistentColor(itemName) {
  if (!itemColors[itemName]) {
    itemColors[itemName] = chartColors[currentColorIndex % chartColors.length];
    currentColorIndex++;
  }
  return itemColors[itemName];
}

// Fungsi untuk memuat SEMUA transaksi dari blockchain
async function loadAllTransactions() {
  allTransactions = [];
  simulatedStock = {};
  historicalStockData = {};
  itemColors = {};
  currentColorIndex = 0;

  try {
    const totalTransactions = await stockLedgerContract.methods
      .getTotalTransactions()
      .call();
    if (totalTransactions == 0) {
      displayTransactions([]);
      updateSimulatedStockDisplay();
      populateChartItemDropdown();
      renderStockChart();
      updateAnomalyAlertsDisplay();
      return;
    }

    const rawTransactions = [];
    for (let i = 0; i < totalTransactions; i++) {
      const tx = await stockLedgerContract.methods.getTransaction(i).call();
      rawTransactions.push({
        itemName: tx.itemName,
        quantity: parseInt(tx.quantity),
        transactionType: tx.transactionType,
        timestamp: parseInt(tx.timestamp),
        actor: tx.actor,
      });
    }

    rawTransactions.sort((a, b) => a.timestamp - b.timestamp);

    let currentStockPerItem = {};

    for (const tx of rawTransactions) {
      const { itemName, quantity, transactionType, timestamp } = tx;

      if (!currentStockPerItem[itemName]) {
        currentStockPerItem[itemName] = 0;
      }

      if (
        transactionType.startsWith("Masuk") ||
        transactionType.startsWith("Penyesuaian Masuk")
      ) {
        currentStockPerItem[itemName] += quantity;
      } else if (
        transactionType.startsWith("Keluar") ||
        transactionType.startsWith("Rusak") ||
        transactionType.startsWith("Penyesuaian Keluar")
      ) {
        currentStockPerItem[itemName] -= quantity;
      }

      if (!historicalStockData[itemName]) {
        historicalStockData[itemName] = [];
      }
      const lastPoint =
        historicalStockData[itemName].length > 0
          ? historicalStockData[itemName][
              historicalStockData[itemName].length - 1
            ]
          : null;
      if (
        !lastPoint ||
        lastPoint.y !== currentStockPerItem[itemName] ||
        lastPoint.x !== timestamp * 1000
      ) {
        historicalStockData[itemName].push({
          x: timestamp * 1000,
          y: currentStockPerItem[itemName],
        });
      }

      simulatedStock[itemName] = {
        quantity: currentStockPerItem[itemName],
        lastUpdated: timestamp,
      };

      if (db) {
        await ensureStockMetadataExists(itemName);
      }
    }

    allTransactions = rawTransactions.reverse();

    displayTransactions(allTransactions);
    updateSimulatedStockDisplay();
    populateChartItemDropdown();
    renderStockChart(chartItemSelect.value);

    for (const itemName in simulatedStock) {
      if (simulatedStock[itemName].quantity < 0) {
        await checkAnomaly(
          itemName,
          Math.abs(simulatedStock[itemName].quantity),
          "Initial Load Negative Stock",
          0,
          simulatedStock[itemName].quantity
        );
      }
    }
  } catch (error) {
    console.error("Gagal memuat transaksi:", error);
    const transactionsList = document.getElementById("transactionsList");
    transactionsList.innerHTML =
      '<li class="list-group-item text-danger">Gagal memuat transaksi dari blockchain. Cek konsol.</li>';
    showCustomAlert(
      "Gagal memuat transaksi dari blockchain. Pastikan kontrak sudah dideploy dan MetaMask terhubung ke jaringan yang benar.",
      "Error Pemuatan Data",
      "error"
    );
  }
}

// Fungsi untuk menampilkan transaksi ke UI
function displayTransactions(transactionsToDisplay) {
  const transactionsList = document.getElementById("transactionsList");
  transactionsList.innerHTML = "";

  if (transactionsToDisplay.length === 0) {
    transactionsList.innerHTML =
      '<li class="list-group-item text-muted text-center py-3">Tidak ada transaksi yang ditemukan.</li>';
    return;
  }

  transactionsToDisplay.forEach((tx) => {
    const listItem = document.createElement("li");
    // Perbaikan: Menyesuaikan kelas CSS untuk jenis transaksi penyesuaian
    listItem.className = `list-group-item d-flex align-items-center transaction-${tx.transactionType
      .toLowerCase()
      .replace(/\s/g, "-")}`;

    let iconClass = "";
    switch (tx.transactionType) {
      case "Masuk":
        iconClass = "fas fa-arrow-alt-circle-down";
        break;
      case "Keluar":
        iconClass = "fas fa-arrow-alt-circle-up";
        break;
      case "Rusak":
        iconClass = "fas fa-times-circle";
        break;
      case "Penyesuaian Masuk":
        iconClass = "fas fa-plus-square";
        break;
      case "Penyesuaian Keluar":
        iconClass = "fas fa-minus-square";
        break;
      default:
        iconClass = "fas fa-info-circle";
    }

    const displayName =
      stockMetadataMap[tx.itemName]?.displayName || tx.itemName;
    const date = new Date(tx.timestamp * 1000).toLocaleString();

    listItem.innerHTML = `
        <i class="${iconClass} me-3"></i>
        <div class="flex-grow-1 transaction-details">
          <div class="item-name">${displayName}</div>
          <div class="item-meta">
            ${tx.transactionType} | Kuantitas: ${tx.quantity} | Tanggal: ${date}
          </div>
        </div>
        <!-- Tombol hapus transaksi (jika diperlukan, saat ini tidak ada di blockchain) -->
        <!-- <button class="btn btn-sm btn-danger delete-transaction-btn" data-id="${tx.id}" title="Hapus Transaksi">
          <i class="fas fa-trash"></i>
        </button> -->
      `;
    transactionsList.appendChild(listItem);
  });

  document.querySelectorAll(".delete-transaction-btn").forEach((button) => {
    button.addEventListener("click", (event) => {
      const transactionId = event.currentTarget.dataset.id;
      showCustomAlert(
        "Apakah Anda yakin ingin menghapus transaksi ini? Tindakan ini tidak dapat dibatalkan.",
        "Konfirmasi Hapus",
        "warning",
        () => deleteTransaction(transactionId),
        true
      );
    });
  });
}

// Fungsi deleteTransaction ini hanya akan menghapus dari Firestore, bukan blockchain
async function deleteTransaction(transactionId) {
  if (!db || !userId) {
    showCustomAlert("Aplikasi belum siap. Coba lagi.", "Error", "error");
    return;
  }
  try {
    const transactionDocRef = doc(
      db,
      "artifacts",
      appId,
      "users",
      userId,
      "transactions",
      transactionId
    );
    await deleteDoc(transactionDocRef);
    showCustomAlert(
      "Transaksi berhasil dihapus dari riwayat (Firestore).",
      "Berhasil",
      "success"
    );
    // Note: Menghapus dari Firestore tidak akan mempengaruhi stok blockchain
    // Untuk mempengaruhi stok, perlu transaksi penyesuaian di blockchain
  } catch (error) {
    console.error("Error deleting transaction from Firestore:", error);
    showCustomAlert(
      `Gagal menghapus transaksi dari Firestore: ${error.message}`,
      "Error Hapus",
      "error"
    );
  }
}

function updateSimulatedStock(itemName, quantity, transactionType, timestamp) {
  if (!simulatedStock[itemName]) {
    simulatedStock[itemName] = { quantity: 0, lastUpdated: 0 };
  }

  const numericQuantity = Number(quantity);
  if (isNaN(numericQuantity)) {
    console.warn(
      `Kuantitas tidak valid untuk ${itemName}: ${quantity}. Melewatkan pembaruan stok.`
    );
    return;
  }

  if (
    transactionType.startsWith("Masuk") ||
    transactionType.startsWith("Penyesuaian Masuk")
  ) {
    simulatedStock[itemName].quantity += numericQuantity;
  } else if (
    transactionType.startsWith("Keluar") ||
    transactionType.startsWith("Rusak") ||
    transactionType.startsWith("Penyesuaian Keluar")
  ) {
    simulatedStock[itemName].quantity -= numericQuantity;
  }
  if (timestamp && timestamp > simulatedStock[itemName].lastUpdated) {
    simulatedStock[itemName].lastUpdated = timestamp;
  }
}

function updateSimulatedStockDisplay() {
  simulatedStockTableBody.innerHTML = "";
  const items = Object.keys(simulatedStock).sort();

  if (items.length === 0) {
    const row = simulatedStockTableBody.insertRow();
    const cell = row.insertCell();
    cell.colSpan = 4;
    cell.className = "text-muted text-center py-3";
    cell.textContent = "Stok simulasi kosong.";
    return;
  }

  items.forEach((itemName) => {
    const row = simulatedStockTableBody.insertRow();
    const nameCell = row.insertCell();
    const quantityCell = row.insertCell();
    const lastUpdatedCell = row.insertCell();
    const actionCell = row.insertCell(); // Sel untuk tombol aksi

    nameCell.textContent = stockMetadataMap[itemName]?.displayName || itemName;
    quantityCell.textContent = simulatedStock[itemName].quantity;
    lastUpdatedCell.textContent = simulatedStock[itemName].lastUpdated
      ? new Date(simulatedStock[itemName].lastUpdated * 1000).toLocaleString()
      : "-";

    // Perbaikan: Menyesuaikan kelas CSS untuk baris stok rendah/kritis
    row.classList.remove("table-low-stock", "table-critical-stock"); // Hapus kelas lama
    if (simulatedStock[itemName].quantity < 0) {
      row.classList.add("table-critical-stock"); // Gunakan kelas baru untuk stok negatif
    } else if (simulatedStock[itemName].quantity <= LOW_STOCK_THRESHOLD) {
      row.classList.add("table-low-stock"); // Gunakan kelas baru untuk stok rendah
    }

    // Container untuk tombol aksi
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "d-flex gap-2"; // Menggunakan flexbox untuk spasi antar tombol

    const renameButton = document.createElement("button");
    renameButton.className = "btn btn-sm btn-outline-secondary rename-btn";
    renameButton.innerHTML = '<i class="fas fa-edit"></i> Ubah Nama';
    renameButton.onclick = () => openRenameModal(itemName);
    buttonContainer.appendChild(renameButton);

    const deleteStockButton = document.createElement("button");
    deleteStockButton.className =
      "btn btn-sm btn-outline-danger delete-stock-btn";
    deleteStockButton.innerHTML = '<i class="fas fa-trash-alt"></i> Hapus Stok';
    deleteStockButton.onclick = () =>
      openDeleteStockModal(itemName, simulatedStock[itemName].quantity);
    buttonContainer.appendChild(deleteStockButton);

    actionCell.appendChild(buttonContainer);
  });
}

function populateChartItemDropdown() {
  if (!chartItemSelect) {
    console.error("chartItemSelect is null. Cannot populate dropdown.");
    return;
  }
  chartItemSelect.innerHTML = '<option value="all">Semua Obat (Tren)</option>';
  const itemNames = Object.keys(simulatedStock).sort();
  itemNames.forEach((itemName) => {
    const option = document.createElement("option");
    option.value = itemName;
    // Gunakan displayName dari stockMetadataMap
    option.textContent = stockMetadataMap[itemName]?.displayName || itemName;
    chartItemSelect.appendChild(option);
  });
}

function generateTimeSeriesData(selectedItemName) {
  const dates = new Set();
  const itemDailyStockHistory = {};

  allTransactions.forEach((tx) => {
    const date = new Date(tx.timestamp * 1000).toISOString().split("T")[0];
    dates.add(date);
  });

  const sortedDates = Array.from(dates).sort();
  if (sortedDates.length === 0) {
    return { labels: [], datasets: [] };
  }

  const currentCumulativeStock = {};
  Object.keys(simulatedStock).forEach((itemName) => {
    currentCumulativeStock[itemName] = 0;
  });

  const sortedTransactions = [...allTransactions].sort(
    (a, b) => a.timestamp - b.timestamp
  );

  const datasets = [];
  const itemDataPoints = {};

  Object.keys(simulatedStock).forEach((itemName) => {
    itemDataPoints[itemName] = [];
  });

  let transactionIndex = 0;
  sortedDates.forEach((currentDate) => {
    while (transactionIndex < sortedTransactions.length) {
      const tx = sortedTransactions[transactionIndex];
      const txDate = new Date(tx.timestamp * 1000).toISOString().split("T")[0];

      if (txDate <= currentDate) {
        const { itemName, quantity, transactionType } = tx;
        if (!currentCumulativeStock[itemName]) {
          currentCumulativeStock[itemName] = 0;
        }
        if (
          transactionType.startsWith("Masuk") ||
          transactionType.startsWith("Penyesuaian Masuk")
        ) {
          currentCumulativeStock[itemName] += quantity;
        } else if (
          transactionType.startsWith("Keluar") ||
          transactionType.startsWith("Rusak") ||
          transactionType.startsWith("Penyesuaian Keluar")
        ) {
          currentCumulativeStock[itemName] -= quantity;
        }
        transactionIndex++;
      } else {
        break;
      }
    }

    Object.keys(simulatedStock).forEach((itemName) => {
      itemDataPoints[itemName].push({
        x: currentDate,
        y: currentCumulativeStock[itemName] || 0,
      });
    });
  });

  if (selectedItemName === "all") {
    Object.keys(itemDataPoints).forEach((itemName) => {
      datasets.push({
        // Gunakan displayName dari stockMetadataMap
        label: stockMetadataMap[itemName]?.displayName || itemName,
        data: itemDataPoints[itemName],
        borderColor: getConsistentColor(itemName).replace("0.7", "1"),
        backgroundColor: getConsistentColor(itemName).replace("0.7", "0.2"),
        fill: false,
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 6,
      });
    });
  } else {
    if (itemDataPoints[selectedItemName]) {
      datasets.push({
        // Gunakan displayName dari stockMetadataMap
        label:
          stockMetadataMap[selectedItemName]?.displayName || selectedItemName,
        data: itemDataPoints[selectedItemName],
        borderColor: "var(--accent-color)",
        backgroundColor: "rgba(61, 185, 127, 0.2)",
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 8,
      });
    }
  }

  return { labels: sortedDates, datasets: datasets };
}

function renderStockChart(selectedItemName = "all") {
  const ctx = document.getElementById("stockChartCanvas").getContext("2d");

  if (stockChartInstance) {
    stockChartInstance.destroy();
  }

  const chartData = generateTimeSeriesData(selectedItemName);

  let minY = 0;
  let maxY = 0;

  if (chartData.datasets.length > 0) {
    const allQuantities = chartData.datasets.flatMap((dataset) =>
      dataset.data.map((point) => point.y)
    );
    if (allQuantities.length > 0) {
      minY = Math.min(...allQuantities);
      maxY = Math.max(...allQuantities);
    }
  }

  const padding = (maxY - minY) * 0.1;
  minY = Math.floor(minY - padding);
  maxY = Math.ceil(maxY + padding);

  if (minY > 0 && maxY > 0) {
    minY = 0;
  }
  if (maxY === 0 && minY === 0) {
    maxY = 10;
  } else if (maxY === minY) {
    maxY = maxY + 5;
    minY = minY - 5;
  }

  stockChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: chartData.labels,
      datasets: chartData.datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: "time",
          time: {
            unit: "day",
            tooltipFormat: "MMM d, yyyy",
            displayFormats: {
              day: "MMM d",
            },
          },
          title: {
            display: true,
            text: "Tanggal",
            color: "var(--text-primary)",
            font: {
              size: 14,
              family: "Inter, sans-serif",
            },
          },
          ticks: {
            color: "var(--text-secondary)",
            font: {
              family: "Inter, sans-serif",
            },
          },
          grid: {
            color: "var(--border-color)",
          },
        },
        y: {
          min: minY,
          max: maxY,
          title: {
            display: true,
            text: "Jumlah Stok",
            color: "var(--text-primary)",
            font: {
              size: 14,
              family: "Inter, sans-serif",
            },
          },
          ticks: {
            color: "var(--text-secondary)",
            font: {
              family: "Inter, sans-serif",
            },
            callback: function (value) {
              return new Intl.NumberFormat("id-ID").format(value);
            },
          },
          grid: {
            color: "var(--border-color)",
          },
        },
      },
      plugins: {
        legend: {
          display: selectedItemName === "all",
          position: "top",
          labels: {
            color: "var(--text-secondary)",
            font: {
              family: "Inter, sans-serif",
            },
          },
        },
        title: {
          display: true,
          text: `Tren Stok Obat ${
            chartItemSelect.options[chartItemSelect.selectedIndex].text
          }`,
          font: {
            size: 18,
            weight: "bold",
            family: "Inter, sans-serif",
          },
          color: "var(--text-primary)",
        },
        tooltip: {
          mode: "index",
          intersect: false,
          callbacks: {
            title: function (context) {
              return new Date(context[0].parsed.x).toLocaleDateString(
                undefined,
                { year: "numeric", month: "long", day: "numeric" }
              );
            },
            label: function (context) {
              let label = context.dataset.label || "";
              if (label) {
                label += ": ";
              }
              if (context.parsed.y !== null) {
                label +=
                  new Intl.NumberFormat("id-ID").format(context.parsed.y) +
                  " unit";
              }
              return label;
            },
          },
          backgroundColor: "rgba(0,0,0,0.7)",
          titleColor: "#fff",
          bodyColor: "#fff",
          borderColor: "rgba(255,255,255,0.5)",
          borderWidth: 1,
          cornerRadius: 8,
        },
      },
      animation: {
        duration: 1000,
        easing: "easeOutQuart",
      },
    },
  });
}

function listenForNewTransactions() {
  stockLedgerContract.events
    .StockTransactionRecorded({})
    .on("data", async function (event) {
      console.log("Event transaksi baru diterima:", event);
      const { itemName, quantity, transactionType, timestamp, actor } =
        event.returnValues;

      const newTx = {
        itemName: itemName,
        quantity: parseInt(quantity),
        transactionType: transactionType,
        timestamp: parseInt(timestamp),
        actor: actor,
      };

      const previousStock = simulatedStock[itemName]
        ? simulatedStock[itemName].quantity
        : 0;

      allTransactions.unshift(newTx);

      updateSimulatedStock(
        newTx.itemName,
        newTx.quantity,
        newTx.transactionType,
        newTx.timestamp
      );

      if (db) {
        await ensureStockMetadataExists(newTx.itemName);
      }

      await checkAnomaly(
        newTx.itemName,
        newTx.quantity,
        newTx.transactionType,
        previousStock,
        simulatedStock[newTx.itemName].quantity
      );
    })
    .on("error", console.error);
}

// Event listener untuk form transaksi baru (di dalam modal)
// Perbaikan: Event listener ini dipindahkan ke dalam setupDOMElements
// agar elemen 'transactionForm' dapat diakses setelah DOM siap.
// document.getElementById("transactionFormModalContent").addEventListener("submit", async (e) => { ... });

let persistentAnomaliesMap = {};

function addAnomalyAlert(itemName, message, isAnomalous, type = "info") {
  let existingAlert = anomalyAlertsList.querySelector(
    `li[data-item-name="${itemName}"]`
  );

  const defaultMessage = anomalyAlertsList.querySelector(".text-muted");
  if (defaultMessage) {
    anomalyAlertsList.removeChild(defaultMessage);
  }

  if (!existingAlert) {
    existingAlert = document.createElement("li");
    existingAlert.className = "list-group-item";
    existingAlert.setAttribute("data-item-name", itemName);
    anomalyAlertsList.prepend(existingAlert);
  }

  existingAlert.className = `list-group-item list-group-item-${type}`;
  existingAlert.setAttribute(
    "data-alert-type",
    isAnomalous ? "warning" : "info"
  );

  const commonTitle = `<strong>Hasil Cek AI (${
    stockMetadataMap[itemName]?.displayName || itemName
  }):</strong>`;
  existingAlert.innerHTML = `${commonTitle} ${message}`;
}

async function updateAnomalyAlertsDisplay() {
  anomalyAlertsList.innerHTML = "";

  let hasActivePersistentAnomalies = false;

  for (const itemName in persistentAnomaliesMap) {
    const anomaly = persistentAnomaliesMap[itemName];
    if (anomaly.status === "active" && anomaly.type === "negative_stock") {
      const currentQuantity = simulatedStock[itemName]
        ? simulatedStock[itemName].quantity
        : 0;

      if (currentQuantity < 0) {
        addAnomalyAlert(itemName, anomaly.message, true, "danger");
        hasActivePersistentAnomalies = true;
      } else {
        console.log(
          `Manually resolving negative stock anomaly for ${itemName}. Current stock: ${currentQuantity}`
        );
        try {
          await window.setDoc(
            window.doc(
              db,
              `artifacts/${appId}/public/data/persistent_anomalies`,
              itemName
            ),
            {
              status: "resolved",
              resolvedAt: window.serverTimestamp(),
            },
            { merge: true }
          );
        } catch (error) {
          console.error(
            `Error updating resolved status for ${itemName}:`,
            error
          );
        }
      }
    }
  }

  if (
    !hasActivePersistentAnomalies &&
    anomalyAlertsList.children.length === 0
  ) {
    const defaultLi = document.createElement("li");
    defaultLi.className = "list-group-item text-muted";
    defaultLi.textContent = "Tidak ada anomali terdeteksi sejauh ini.";
    anomalyAlertsList.appendChild(defaultLi);
  }
}

async function checkAnomaly(
  itemName,
  quantity,
  transactionType,
  previousStock,
  currentSimulatedStock
) {
  if (transactionType.startsWith("Penyesuaian")) {
    return;
  }

  let isAnomalous = false;
  let analysisMessage =
    "Normal: Transaksi ini sesuai dengan operasi stok yang diharapkan.";
  let anomalyType = "normal";

  if (currentSimulatedStock < 0) {
    isAnomalous = true;
    analysisMessage = `Anomali: Stok negatif terdeteksi. Stok saat ini ${currentSimulatedStock} unit.`;
    anomalyType = "negative_stock";
  } else if (transactionType.startsWith("Rusak") && quantity > 50) {
    isAnomalous = true;
    analysisMessage = `Anomali: Kuantitas rusak tinggi terdeteksi. Transaksi rusak ${quantity} unit.`;
    anomalyType = "high_damage";
  } else if (transactionType.startsWith("Masuk") && quantity > 2000) {
    isAnomalous = true;
    analysisMessage = `Anomali: Kuantitas masuk sangat besar terdeteksi. Transaksi masuk ${quantity} unit.`;
    anomalyType = "large_inflow";
  } else if (
    currentSimulatedStock <= LOW_STOCK_THRESHOLD &&
    currentSimulatedStock >= 0
  ) {
    isAnomalous = true;
    analysisMessage = `Peringatan: Stok rendah terdeteksi. Stok saat ini ${currentSimulatedStock} unit.`;
    anomalyType = "low_stock";
  }

  if (anomalyType === "negative_stock") {
    const anomalyDocRef = window.doc(
      db,
      `artifacts/${appId}/public/data/persistent_anomalies`,
      itemName
    );
    try {
      const docSnap = await window.getDoc(anomalyDocRef);
      if (!docSnap.exists() || docSnap.data().status === "resolved") {
        await window.setDoc(anomalyDocRef, {
          type: "negative_stock",
          status: "active",
          lastDetected: window.serverTimestamp(),
          message: analysisMessage,
        });
      } else {
        await window.setDoc(
          anomalyDocRef,
          {
            lastDetected: window.serverTimestamp(),
            message: analysisMessage,
          },
          { merge: true }
        );
      }
    } catch (error) {
      console.error(
        `Error updating persistent anomaly for ${itemName}:`,
        error
      );
      addAnomalyAlert(
        itemName,
        `<strong>Error:</strong> Gagal mencatat anomali persisten: ${error.message}`,
        true,
        "error"
      );
    }
  } else {
    addAnomalyAlert(
      itemName,
      analysisMessage,
      isAnomalous,
      isAnomalous ? "warning" : "info"
    );
  }
}

async function clearResolvedAnomalyAlerts() {
  const defaultMessage = anomalyAlertsList.querySelector(".text-muted");
  if (defaultMessage) {
    anomalyAlertsList.removeChild(defaultMessage); // Perbaikan: Gunakan defaultMessage
  }

  let hasUnresolvedPersistentAnomalies = false;

  const currentAlertElements = Array.from(anomalyAlertsList.children);
  for (const alertItem of currentAlertElements) {
    const itemName = alertItem.getAttribute("data-item-name");
    const alertType = alertItem.getAttribute("data-alert-type");

    if (
      itemName &&
      persistentAnomaliesMap[itemName] &&
      persistentAnomaliesMap[itemName].type === "negative_stock"
    ) {
      const currentQuantity = simulatedStock[itemName]
        ? simulatedStock[itemName].quantity
        : 0;
      if (currentQuantity >= 0) {
        console.log(
          `Manually resolving negative stock anomaly for ${itemName}. Current stock: ${currentQuantity}`
        );
        try {
          await window.setDoc(
            window.doc(
              db,
              `artifacts/${appId}/public/data/persistent_anomalies`,
              itemName
            ),
            {
              status: "resolved",
              resolvedAt: window.serverTimestamp(),
            },
            { merge: true }
          );
        } catch (error) {
          console.error(
            `Error updating resolved status for ${itemName} via clear button:`,
            error
          );
        }
      } else {
        hasUnresolvedPersistentAnomalies = true;
      }
    } else {
      anomalyAlertsList.removeChild(alertItem);
    }
  }

  await updateAnomalyAlertsDisplay();

  if (hasUnresolvedPersistentAnomalies) {
    showCustomAlert(
      "Notifikasi anomali stok negatif yang belum teratasi akan tetap ditampilkan sampai stok diperbaiki.",
      "Pembersihan Notifikasi",
      "warning"
    );
  } else {
    showCustomAlert(
      "Notifikasi anomali yang sudah teratasi atau normal telah dihapus.",
      "Pembersihan Notifikasi",
      "info"
    );
  }
}

async function resetSimulatedStock() {
  simulatedStock = {};
  historicalStockData = {};
  itemColors = {};
  currentColorIndex = 0;
  await loadAllTransactions();
  updateSimulatedStockDisplay();
  populateChartItemDropdown();
  renderStockChart(chartItemSelect.value);
  showCustomAlert(
    "Stok simulasi telah direset berdasarkan riwayat blockchain.",
    "Reset Stok",
    "info"
  );
}

function handleSearchSubmit() {
  const searchItemName = document
    .getElementById("searchItemName")
    .value.toLowerCase();
  const searchStartDate = document.getElementById("searchStartDate").value;
  const searchEndDate = document.getElementById("searchEndDate").value;

  let filteredTransactions = allTransactions;

  if (searchItemName) {
    filteredTransactions = filteredTransactions.filter((tx) =>
      (stockMetadataMap[tx.itemName]?.displayName || tx.itemName)
        .toLowerCase()
        .includes(searchItemName)
    );
  }

  if (searchStartDate) {
    const startDate = new Date(searchStartDate);
    filteredTransactions = filteredTransactions.filter(
      (tx) => new Date(tx.timestamp * 1000) >= startDate
    );
  }
  if (searchEndDate) {
    const endDate = new Date(searchEndDate);
    endDate.setDate(endDate.getDate() + 1);
    endDate.setMilliseconds(endDate.getMilliseconds() - 1);
    filteredTransactions = filteredTransactions.filter(
      (tx) => new Date(tx.timestamp * 1000) <= endDate
    );
  }

  displayTransactions(filteredTransactions);
}

function handleResetSearch() {
  document.getElementById("searchItemName").value = "";
  document.getElementById("searchStartDate").value = "";
  document.getElementById("searchEndDate").value = "";
  displayTransactions(allTransactions);
}

async function ensureStockMetadataExists(itemName) {
  if (!db || !userId) {
    console.warn(
      "Firestore not initialized or userId not available. Cannot ensure stock metadata."
    );
    return;
  }
  const itemDocRef = window.doc(
    db,
    `artifacts/${appId}/public/data/stock_metadata`,
    itemName
  );
  try {
    const docSnap = await window.getDoc(itemDocRef);
    if (!docSnap.exists()) {
      console.log(`Creating new metadata for ${itemName}`);
      await window.setDoc(itemDocRef, {
        displayName: itemName,
        createdAt: window.serverTimestamp(),
        createdBy: userId,
      });
    }
  } catch (error) {
    console.error(`Error ensuring metadata for ${itemName}:`, error);
  }
}

async function updateStockMetadata(originalItemName, newDisplayName) {
  if (!db || !userId) {
    showCustomAlert(
      "Firestore tidak terinisialisasi atau ID pengguna tidak tersedia. Tidak dapat mengubah nama.",
      "Error Firestore",
      "error"
    );
    return;
  }

  // 1. Periksa apakah newDisplayName sudah digunakan sebagai displayName oleh item lain
  const stockMetadataRef = window.collection(
    db,
    `artifacts/${appId}/public/data/stock_metadata`
  );
  const q = window.query(
    stockMetadataRef,
    window.where("displayName", "==", newDisplayName)
  );
  const querySnapshot = await window.getDocs(q);

  let displayNameConflict = false;
  querySnapshot.forEach((doc) => {
    // Jika ada dokumen dengan displayName yang sama, dan itu BUKAN dokumen yang sedang kita ubah namanya
    if (doc.id !== originalItemName) {
      displayNameConflict = true;
    }
  });

  if (displayNameConflict) {
    showCustomAlert(
      `Nama tampilan "${newDisplayName}" sudah digunakan oleh obat lain.`,
      "Ubah Nama Gagal",
      "warning"
    );
    return;
  }

  // 2. Jika tidak ada konflik, lanjutkan dengan memperbarui displayName pada dokumen yang ada
  const itemDocRef = window.doc(
    db,
    `artifacts/${appId}/public/data/stock_metadata`,
    originalItemName // Gunakan originalItemName sebagai ID dokumen
  );

  try {
    await window.setDoc(
      itemDocRef, // Perbarui dokumen yang ada dengan ID originalItemName
      {
        displayName: newDisplayName,
        lastUpdated: window.serverTimestamp(),
        updatedBy: userId,
      },
      { merge: true } // Gunakan merge: true untuk hanya memperbarui bidang yang ditentukan
    );

    showCustomAlert(
      `Nama tampilan untuk "${
        stockMetadataMap[originalItemName]?.displayName || originalItemName
      }" berhasil diubah menjadi "${newDisplayName}".`,
      "Ubah Nama Berhasil",
      "success"
    );
  } catch (error) {
    console.error("Error updating item metadata:", error);
    showCustomAlert(
      `Gagal mengubah nama obat: ${error.message}`,
      "Ubah Nama Gagal",
      "error"
    );
  }
}

function openRenameModal(itemName) {
  currentRenameItemName = itemName;
  document.getElementById("renameItemName").value = itemName;
  document.getElementById("renameDisplayName").value =
    stockMetadataMap[itemName]?.displayName || itemName;
  renameModalInstance.show();
}

async function handleRenameFormSubmit(e) {
  e.preventDefault();

  const originalItemName = document.getElementById("renameItemName").value;
  const newDisplayName = document
    .getElementById("renameDisplayName")
    .value.trim();

  if (!newDisplayName) {
    showCustomAlert(
      "Nama tampilan baru tidak boleh kosong.",
      "Input Tidak Valid",
      "warning"
    );
    return;
  }

  // Ambil displayName saat ini untuk perbandingan
  const currentDisplayName =
    stockMetadataMap[originalItemName]?.displayName || originalItemName;

  if (currentDisplayName === newDisplayName) {
    showCustomAlert(
      "Nama tampilan baru sama dengan nama tampilan lama.",
      "Tidak Ada Perubahan",
      "info"
    );
    renameModalInstance.hide();
    // Tambahkan baris ini untuk mengaburkan elemen yang sedang fokus
    if (document.activeElement) {
      document.activeElement.blur();
    }
    return;
  }

  await updateStockMetadata(originalItemName, newDisplayName);

  renameModalInstance.hide();
  // Tambahkan baris ini untuk mengaburkan elemen yang sedang fokus
  if (document.activeElement) {
    document.activeElement.blur();
  }
}

// NEW: Fungsi untuk membuka modal konfirmasi penghapusan stok
function openDeleteStockModal(itemName, currentQuantity) {
  const displayName = stockMetadataMap[itemName]?.displayName || itemName;
  showCustomAlert(
    `Apakah Anda yakin ingin menghapus stok untuk <strong>${displayName}</strong>? Ini akan mencatat transaksi "Penyesuaian Keluar" sebesar <strong>${currentQuantity}</strong> unit, membuat stok menjadi 0.`,
    "Konfirmasi Hapus Stok",
    "warning",
    () => handleDeleteStock(itemName, currentQuantity), // Callback jika OK
    true // Tampilkan tombol Batal
  );
}

// NEW: Fungsi untuk menangani penghapusan stok (mencatat transaksi penyesuaian)
async function handleDeleteStock(itemName, quantityToDelete) {
  if (!stockLedgerContract || !accounts || accounts.length === 0) {
    showCustomAlert(
      "Aplikasi belum terhubung ke blockchain. Coba refresh halaman atau periksa MetaMask Anda.",
      "Koneksi Gagal",
      "error"
    );
    return;
  }

  if (quantityToDelete <= 0) {
    showCustomAlert(
      `Stok ${
        stockMetadataMap[itemName]?.displayName || itemName
      } sudah nol atau negatif. Tidak perlu menghapus.`,
      "Tidak Ada Stok",
      "info"
    );
    return;
  }

  updateConnectionStatusDisplay(
    "Mencatat transaksi penyesuaian keluar... Mohon konfirmasi di MetaMask.",
    "info",
    "fas fa-spinner fa-spin"
  );

  try {
    const result = await stockLedgerContract.methods
      .recordTransaction(itemName, quantityToDelete, "Penyesuaian Keluar")
      .send({ from: accounts[0] });

    console.log("Transaksi penyesuaian keluar berhasil:", result);
    updateConnectionStatusDisplay(
      "Transaksi penyesuaian keluar berhasil dicatat di blockchain!",
      "success",
      "fas fa-check-circle"
    );
    showCustomAlert(
      `Stok <strong>${
        stockMetadataMap[itemName]?.displayName || itemName
      }</strong> berhasil disesuaikan menjadi 0 dengan mencatat transaksi <strong>Penyesuaian Keluar</strong> sebanyak <strong>${quantityToDelete}</strong> unit.`,
      "Stok Dihapus",
      "success"
    );
  } catch (error) {
    console.error("Error saat mencatat transaksi penyesuaian keluar:", error);
    let errorMessage = `Gagal mencatat transaksi penyesuaian keluar: ${
      error.message || error
    }.`;
    if (error.code === 4001) {
      showCustomAlert(
        "Transaksi dibatalkan oleh pengguna di MetaMask.",
        "Transaksi Dibatalkan",
        "warning"
      );
    } else {
      showCustomAlert(
        `Gagal menghapus stok: ${error.message || error}.`,
        "Error Hapus Stok",
        "error"
      );
    }
    updateConnectionStatusDisplay(
      errorMessage,
      "danger",
      "fas fa-times-circle"
    );
  }
}

window.addEventListener("load", async () => {
  const firebaseConfigFromWindow = JSON.parse(window.__firebase_config);
  if (!app) app = window.initializeApp(firebaseConfigFromWindow);
  if (!auth) auth = window.getAuth(app);
  setupAuthListeners();
});
