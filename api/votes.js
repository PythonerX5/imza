import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
let client = null;

async function connectToDatabase() {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
  }
  return client;
}

export default async function handler(req, res) {
  if (!uri) {
    return res.status(500).json({ error: 'MongoDB URI bulunamadı' });
  }

  try {
    const client = await connectToDatabase();
    const database = client.db('imza-db');
    const votes = database.collection('votes');

    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // GET isteği - oy sayısını ve IP'leri getir
    if (req.method === 'GET') {
      const data = await votes.findOne({ _id: 'votes' }) || { _id: 'votes', votes: 0, ips: [] };
      return res.json({
        votes: data.votes,
        ips: data.ips,
        clientIP: req.headers['x-forwarded-for'] || 
                 req.headers['x-real-ip'] || 
                 req.connection.remoteAddress || 
                 'unknown'
      });
    }
    // POST isteği - yeni oy ekle
    else if (req.method === 'POST') {
      const ip = req.headers['x-forwarded-for'] || 
                req.headers['x-real-ip'] || 
                req.connection.remoteAddress || 
                'unknown';

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
        return res.json({ votes: data.votes + 1 });
      } else {
        return res.status(500).json({ error: 'Oy kaydedilemedi' });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Sunucu hatası' });
  }
} 