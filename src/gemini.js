import { GoogleGenerativeAI } from "@google/generative-ai";

export async function sendMessageStream(promptText, onChunk) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("SYSTEM HALTED: API key tidak ditemukan. Pastikan VITE_GEMINI_API_KEY ada di .env");
  }

  // Inisialisasi SDK
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Mengatur model, instruksi sistem (persona), dan parameter suhu
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash",
    systemInstruction: "Kamu adalah asisten ahli Web3, Blockchain, dan Cryptocurrency. Kamu harus menggunakan bahasa yang santai namun profesional, layaknya seorang crypto bro atau trader berpengalaman. Jika pengguna bertanya tentang topik di luar kripto, blockchain, trading, NFT, atau Web3, tolak dengan sopan dan katakan bahwa kamu hanya diprogram untuk membahas ekosistem kripto.",
    generationConfig: {
      temperature: 0.5,
      maxOutputTokens: 1024,
    }
  });

  try {
    const result = await model.generateContentStream(promptText);

    for await (const chunk of result.stream) {
      const chunkText = chunk.text(); 
      onChunk(chunkText);
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    
    // Klasifikasi Error Kustom ala Crypto
    let errorMessage = "TX FAILED: Terjadi kesalahan yang tidak diketahui pada jaringan.";
    const errString = error.message || "";

    if (errString.includes("429")) {
      errorMessage = "TX REJECTED (429): Gas limit tercapai! Kuota API Anda habis atau terlalu banyak request (rate-limit). Tunggu sebentar atau ganti API Key.";
    } else if (errString.includes("403") || errString.includes("API key not valid")) {
      errorMessage = "AUTH FAILED (403): Akses ditolak. API Key salah, tidak valid, atau belum diaktifkan di Google Cloud Console.";
    } else if (errString.includes("400")) {
      errorMessage = "BAD REQUEST (400): Node menolak transaksi. Prompt mungkin mengandung format yang tidak didukung atau melanggar filter keamanan.";
    } else if (errString.includes("500") || errString.includes("503")) {
      errorMessage = "NODE OFFLINE (500/503): Server pusat Google Generative AI sedang down atau maintenance. Coba lagi nanti.";
    } else if (errString.includes("Failed to fetch")) {
      errorMessage = "NETWORK ERROR: Kehilangan koneksi. Silakan periksa koneksi internet Anda.";
    }

    // Lempar error yang sudah dimodifikasi ini ke App.jsx
    throw new Error(errorMessage);
  }
}