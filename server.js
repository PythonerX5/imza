import express from 'express';
import cors from 'cors';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const VOTES_FILE = join(__dirname, 'votes.json');

// Oy verenlerin IP'lerini ve toplam oy sayısını tutan dosyayı oluştur
async function initializeVotesFile() {
  try {
    await fs.access(VOTES_FILE);
  } catch {
    await fs.writeFile(VOTES_FILE, JSON.stringify({ votes: 0, ips: [] }));
  }
}

// Oy sayısını ve IP'leri getir
app.get('/api/votes', async (req, res) => {
  try {
    const data = await fs.readFile(VOTES_FILE, 'utf8');
    const jsonData = JSON.parse(data);
    // IP adresini de gönder
    res.json({
      ...jsonData,
      clientIP: req.ip || req.connection.remoteAddress
    });
  } catch (error) {
    res.status(500).json({ error: 'Oy sayısı alınamadı' });
  }
});

// Yeni oy ekle
app.post('/api/vote', async (req, res) => {
  try {
    const ip = req.ip || req.connection.remoteAddress;
    const data = JSON.parse(await fs.readFile(VOTES_FILE, 'utf8'));
    
    // IP kontrolü
    if (data.ips.includes(ip)) {
      return res.status(403).json({ error: 'Bu IP adresi zaten oy kullanmış' });
    }

    // Yeni oyu kaydet
    data.votes += 1;
    data.ips.push(ip);
    await fs.writeFile(VOTES_FILE, JSON.stringify(data));
    
    res.json({ votes: data.votes });
  } catch (error) {
    res.status(500).json({ error: 'Oy kaydedilemedi' });
  }
});

// Sunucuyu başlat
const PORT = 3000;
initializeVotesFile().then(() => {
  app.listen(PORT, () => {
    console.log(`Server http://localhost:${PORT} adresinde çalışıyor`);
  });
}); 