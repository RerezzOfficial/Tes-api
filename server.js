const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());

// Path file JSON untuk IP yang diizinkan
const allowedIPsFile = path.join(__dirname, 'allowedIPs.json');

// Fungsi untuk memuat IP dari file JSON
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

// Middleware untuk memeriksa IP
app.use((req, res, next) => {
  const allowedIPs = loadAllowedIPs();
  const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  if (allowedIPs.includes(clientIP)) {
    next();
  } else {
    res.status(403).json({ message: 'Akses ditolak. IP Anda tidak diizinkan.' });
  }
});

// Endpoint addcase
app.post('/addcase', async (req, res) => {
  const { caseName, caseContent } = req.body;

  if (!caseName || !caseContent) {
    return res.status(400).json({ message: 'Nama case dan konten case diperlukan.' });
  }

  try {
    const result = `case '${caseName}': {\n  ${caseContent}\n  break;\n}`;
    return res.status(201).json({ message: 'Case berhasil dibuat.', caseCode: result });
  } catch (error) {
    return res.status(500).json({ message: `Gagal membuat case: ${error.message}` });
  }
});

// Endpoint untuk menambah IP yang diizinkan
app.post('/add-ip', (req, res) => {
  const { newIP } = req.body;

  if (!newIP) {
    return res.status(400).json({ message: 'IP baru diperlukan.' });
  }

  const allowedIPs = loadAllowedIPs();

  if (allowedIPs.includes(newIP)) {
    return res.status(400).json({ message: 'IP sudah ada dalam daftar.' });
  }

  allowedIPs.push(newIP);

  try {
    fs.writeFileSync(allowedIPsFile, JSON.stringify({ allowedIPs }, null, 2));
    res.status(201).json({ message: 'IP berhasil ditambahkan.' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menyimpan IP baru: ' + error.message });
  }
});

// Endpoint untuk menghapus IP dari daftar
app.delete('/remove-ip', (req, res) => {
  const { removeIP } = req.body;

  if (!removeIP) {
    return res.status(400).json({ message: 'IP yang akan dihapus diperlukan.' });
  }

  let allowedIPs = loadAllowedIPs();

  if (!allowedIPs.includes(removeIP)) {
    return res.status(400).json({ message: 'IP tidak ditemukan dalam daftar.' });
  }

  allowedIPs = allowedIPs.filter(ip => ip !== removeIP);

  try {
    fs.writeFileSync(allowedIPsFile, JSON.stringify({ allowedIPs }, null, 2));
    res.status(200).json({ message: 'IP berhasil dihapus.' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menghapus IP: ' + error.message });
  }
});

// Jalankan server di port 3000
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
