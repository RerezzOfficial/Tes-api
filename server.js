const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

// Fungsi untuk memeriksa apakah IP ada di dalam daftar yang diizinkan
const allowedIPs = JSON.parse(fs.readFileSync(path.join(__dirname, 'allowed_ips.json')));

const isAllowedIP = (ip) => {
  return allowedIPs.includes(ip);
};

// ChatGPT API endpoint
app.get("/api/chatgpt-v2", async (req, res) => {
  const clientIP = req.ip; // Mendapatkan IP pengakses
  if (!isAllowedIP(clientIP)) {
    return res.status(403).json({
      status: false,
      error: "IP tidak terdaftar",
      message: `IP ${clientIP} tidak terdaftar dalam daftar akses API ChatGPT.`
    });
  }

  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ status: false, error: "Isi parameter Query" });
  }

  try {
    const response = await ChatGPTv2(q, "openai");
    res.status(200).json({
      status: true,
      creator: "I'M Rerezz Official",
      result: response
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      creator: "Hello Line",
      error: error.message
    });
  }
});

// ChatGPT Function
async function ChatGPTv2(question, model = "openai") {
  const validModels = ["openai", "llama", "mistral", "mistral-large"];
  if (!validModels.includes(model)) {
    return { status: false, error: "Invalid model specified." };
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

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
