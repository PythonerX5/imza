import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export default async function handler(req, res) {
  if (!uri) {
    return res.status(500).json({ error: 'MongoDB URI bulunamadı' });
  }

  try {
    await client.connect();
    const database = client.db('imza-db');
    const votes = database.collection('votes');

    // GET isteği - oy sayısını ve IP'leri getir
    if (req.method === 'GET') {
      const data = await votes.findOne({ _id: 'votes' }) || { votes: 0, ips: [] };
      res.json({
        ...data,
        clientIP: req.headers['x-forwarded-for'] || req.socket.remoteAddress
      });
    }
    // POST isteği - yeni oy ekle
    else if (req.method === 'POST') {
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const data = await votes.findOne({ _id: 'votes' }) || { _id: 'votes', votes: 0, ips: [] };

      if (data.ips.includes(ip)) {
        return res.status(403).json({ error: 'Bu IP adresi zaten oy kullanmış' });
      }

      const result = await votes.updateOne(
        { _id: 'votes' },
        { 
          $set: {
            votes: data.votes + 1,
            ips: [...data.ips, ip]
          }
        },
        { upsert: true }
      );

      if (result.acknowledged) {
        res.json({ votes: data.votes + 1 });
      } else {
        res.status(500).json({ error: 'Oy kaydedilemedi' });
      }
    }
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  } finally {
    await client.close();
  }
} 