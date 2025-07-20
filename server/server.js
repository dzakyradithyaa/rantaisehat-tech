// Load environment variables from .env file
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
const port = 3001;

// Pastikan Anda memiliki REPLICATE_API_TOKEN di file .env Anda
// Contoh: REPLICATE_API_TOKEN="r8_YOUR_REPLICATE_API_TOKEN_HERE"
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

// Middleware
app.use(cors());
app.use(express.json());

// Root Endpoint
app.get("/", (req, res) => {
  res.send("PharmaLedger AI Backend is running!");
});

// Clean and extract JSON from AI output
function cleanJsonString(str) {
  let cleaned = str.replace(/[\u0000-\u001F\u007F-\u009F\uFEFF]/g, "").trim();

  // Remove wrapping backticks or markdown code blocks
  cleaned = cleaned.replace(/^```(?:json)?\s*|```$/g, "");

  // If wrapped in quotes, unescape
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    try {
      cleaned = JSON.parse(cleaned);
    } catch (_) {
      // keep original if failed to parse string
    }
  }

  // Extract only the JSON portion
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.substring(start, end + 1);
  }

  return cleaned;
}

// AI Analysis Endpoint
app.post("/api/granite-ai", async (req, res) => {
  const { prompt, context } = req.body;

  if (!REPLICATE_API_TOKEN) {
    console.error("Missing REPLICATE_API_TOKEN in .env");
    return res.status(500).json({ error: "Missing Replicate API token." });
  }

  // Penyempurnaan Prompt AI sesuai aturan terbaru yang Anda inginkan
  // PROMPT INI ADALAH YANG SEBENARNYA DIKIRIM KE MODEL AI
  const jsonPrompt = `
Anda adalah sistem deteksi anomali stok farmasi yang sangat ketat dan hanya mengikuti aturan yang diberikan.
Analisis transaksi stok berikut dan tentukan apakah itu anomali HANYA berdasarkan aturan yang diberikan.
Jika TIDAK ADA aturan anomali yang terpenuhi, transaksi tersebut HARUS dianggap NORMAL.

Detail Transaksi:
- Nama Obat: ${context.itemName}
- Kuantitas Transaksi: ${context.quantity} unit
- Tipe Transaksi: ${context.transactionType}
- Stok Sebelumnya: ${context.previousStock} unit
- Stok Simulasi Saat Ini: ${context.currentSimulatedStock} unit

Catatan: "Stok Simulasi Saat Ini" adalah JUMLAH STOK TERSEDIA.

Aturan Deteksi Anomali (HANYA INI YANG DIGUNAKAN):
1. Stok Negatif: Jika 'Stok Simulasi Saat Ini' adalah angka negatif (kurang dari 0).
2. Rusak Tinggi: Jika 'Tipe Transaksi' adalah 'Rusak' DAN 'Kuantitas Transaksi' lebih dari 50 unit.
3. Masuk Sangat Besar: Jika 'Tipe Transaksi' adalah 'Masuk' DAN 'Kuantitas Transaksi' lebih dari 2000 unit.

Instruksi Output:
Untuk setiap kasus, berikan "is_anomalous" (boolean) dan "analysis_message" (string, maks 70 kata).
Pesan analisis HARUS dimulai dengan "Anomali:" jika anomali, atau "Normal:" jika normal.
Jika anomali, pesan HARUS secara langsung menyatakan aturan yang dilanggar dan nilai yang relevan.
Contoh untuk Anomali:
- "Anomali: Stok negatif terdeteksi. Stok saat ini ${context.currentSimulatedStock} unit."
- "Anomali: Kuantitas rusak tinggi terdeteksi. Transaksi rusak ${context.quantity} unit."
- "Anomali: Kuantitas masuk sangat besar terdeteksi. Transaksi masuk ${context.quantity} unit."

Jika normal, pesan HARUS selalu "Normal: Transaksi ini sesuai dengan operasi stok yang diharapkan."

Penting:
- JANGAN tambahkan penjelasan, interpretasi, atau detail lain di luar aturan yang diberikan.
- JANGAN pernah menyatakan angka positif sebagai negatif atau sebaliknya.
- HANYA keluarkan objek JSON. JANGAN sertakan teks lain, markdown, atau tambahan lainnya.
`;

  try {
    // Call Replicate API
    const predictionRes = await fetch(
      "https://api.replicate.com/v1/predictions",
      {
        method: "POST",
        headers: {
          Authorization: `Token ${REPLICATE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          version:
            "a325a0cacfb0aa9226e6bad1abe5385f1073f4c7f8c36e52ed040e5409e6c034", // Pastikan ini adalah versi model yang sesuai
          input: {
            prompt: jsonPrompt,
            max_new_tokens: 400,
            temperature: 0.7,
            top_p: 0.9,
          },
        }),
      }
    );

    if (!predictionRes.ok) {
      const errorText = await predictionRes.text();
      console.error("Replicate API error:", errorText);
      return res
        .status(500)
        .json({ error: `Failed to call Replicate API: ${errorText}` });
    }

    let result = await predictionRes.json();

    // Polling for completion
    let attempts = 0;
    const maxAttempts = 10;
    const pollInterval = 1500;

    while (result.status !== "succeeded" && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
      const poll = await fetch(result.urls.get, {
        headers: { Authorization: `Token ${REPLICATE_API_TOKEN}` },
      });
      result = await poll.json();
      attempts++;
    }

    if (result.status !== "succeeded") {
      return res
        .status(500)
        .json({ error: "Prediction did not succeed in time." });
    }

    const generatedText = result.output ? result.output.join("") : "";
    console.log("Raw AI Output:", generatedText); // Log output mentah dari AI

    const cleanedJsonStr = cleanJsonString(generatedText);
    let parsed;

    try {
      parsed = JSON.parse(cleanedJsonStr);
    } catch (err) {
      console.error("JSON parsing error:", err);
      // Fallback jika parsing JSON gagal
      return res.json({
        generated_text: generatedText, // Tetap kirim teks asli sebagai fallback
        is_anomalous: true, // Asumsikan anomali jika format JSON salah
        analysis_message: `Error: Format JSON tidak valid dari AI. Output mentah: ${generatedText.substring(
          0,
          Math.min(generatedText.length, 200) // Ambil 200 karakter pertama
        )}...`,
      });
    }

    if (
      typeof parsed.is_anomalous === "boolean" &&
      typeof parsed.analysis_message === "string"
    ) {
      return res.json({
        generated_text: parsed.analysis_message, // Frontend awalnya mungkin menggunakan ini
        is_anomalous: parsed.is_anomalous,
        analysis_message: parsed.analysis_message, // Pesan analisis yang sudah diformat
      });
    } else {
      console.error("AI output JSON has invalid structure:", parsed);
      return res.status(500).json({
        error: "AI returned invalid JSON structure.",
        generated_text: generatedText, // Send raw text as fallback
        is_anomalous: true, // Assume anomalous if structure is bad
        analysis_message: `Error: Struktur JSON tidak valid dari AI. Output mentah: ${generatedText.substring(
          0,
          Math.min(generatedText.length, 200)
        )}...`,
      });
    }
  } catch (error) {
    console.error("Internal server error:", error);
    return res
      .status(500)
      .json({ error: `Internal server error: ${error.message || error}` });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
  console.log("Ready to receive requests from the frontend.");
  console.log("--- PASTIKAN REPLICATE_API_TOKEN SUDAH ADA DI FILE .env ---");
});
