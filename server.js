const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());

// Path file JSON untuk IP yang diizinkan
const allowedIPsFile = path.join(__dirname, 'allowedIPs.json');

// Fungsi untuk memuat IP yang diizinkan dari file JSON
function loadAllowedIPs() {
  try {
    const data = fs.readFileSync(allowedIPsFile, 'utf8');
    const parsedData = JSON.parse(data);
    return parsedData.allowedIPs || [];
  } catch (error) {
    console.error('Gagal memuat daftar IP:', error.message);
    return [];
  }
}

// Middleware untuk memeriksa IP yang diizinkan
function checkIP(req, res, next) {
  const allowedIPs = loadAllowedIPs();
  const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  if (allowedIPs.includes(clientIP)) {
    next();
  } else {
    return res.status(403).send(`IP kamu (${clientIP}) tidak diizinkan untuk mengakses API ChatGPT. Harap hubungi admin.`);
  }
}

// Endpoint untuk ChatGPT v2 yang hanya bisa diakses oleh IP yang diizinkan
app.get("/api/chatgpt-v2", checkIP, async (req, res) => {
  const { q, model } = req.query;
  
  if (!q) {
    return res.status(400).send("Parameter 'q' tidak ditemukan, harap masukkan pertanyaan.");
  }

  try {
    const response = await ChatGPTv2(q, model || "openai");

    // Jika API mengembalikan error
    if (response.status === false) {
      return res.status(500).send(`Error dari API ChatGPT: ${response.error}`);
    }

    // Respons sukses
    res.status(200).send(`AI Response:\n${response}`);
    
  } catch (error) {
    res.status(500).send(`Terjadi kesalahan: ${error.message}`);
  }
});

// Fungsi untuk mengambil response dari ChatGPT v2
async function ChatGPTv2(question, model = "openai") {
  const validModels = ["openai", "llama", "mistral", "mistral-large"];
  if (!validModels.includes(model)) {
    return { status: false, error: "Model yang ditentukan tidak valid." };
  }

  const data = JSON.stringify({
    messages: [question],
    character: model
  });

  const config = {
    method: 'POST',
    url: 'https://chatsandbox.com/api/chat',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Android 10; Mobile; rv:131.0) Gecko/131.0 Firefox/131.0',
      'Content-Type': 'application/json',
      'accept-language': 'id-ID',
      'referer': `https://chatsandbox.com/chat/${model}`,
      'origin': 'https://chatsandbox.com',
      'alt-used': 'chatsandbox.com',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      'priority': 'u=0',
      'te': 'trailers',
      'Cookie': '_ga_V22YK5WBFD=GS1.1.1734654982.3.0.1734654982.0.0.0; _ga=GA1.1.803874982.1734528677'
    },
    data: data
  };

  try {
    const response = await axios.request(config);
    return response.data;
  } catch (error) {
    return { status: false, error: error.message };
  }
}

app.post('/addcase', async (req, res) => {
  const { caseName, caseContent } = req.body;

  if (!caseName || !caseContent) {
    return res.status(400).json({ message: 'Nama case dan konten case diperlukan.' });
  }

  try {
    // Kirim respons balik ke bot untuk menulis ke RezzDev.js
    const result = `case '${caseName}': {\n  ${caseContent}\n  break;\n}`;
    return res.status(201).json({ message: 'Case berhasil dibuat.', caseCode: result });
  } catch (error) {
    return res.status(500).json({ message: `Gagal membuat case: ${error.message}` });
  }
});

// Jalankan server di port 3000
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
