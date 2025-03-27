import React, { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

// API URL'sini ortama göre ayarla
const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://imza-kampanyasi.vercel.app/api/votes'
  : 'http://localhost:3000/api/votes';

function App() {
  const [imzaSayisi, setImzaSayisi] = useState(0)
  const [hata, setHata] = useState('')
  const [oyKullanildi, setOyKullanildi] = useState(false)
  const [kullaniciIP, setKullaniciIP] = useState('')
  const [infoAcik, setInfoAcik] = useState(false)
  const [yukleniyor, setYukleniyor] = useState(false)

  // Sayfa yüklendiğinde mevcut oy sayısını al
  useEffect(() => {
    const oyVerileriGetir = async () => {
      try {
        setYukleniyor(true)
        const response = await axios.get(API_URL)
        setImzaSayisi(response.data.votes)
        setKullaniciIP(response.data.clientIP)
        // IP kontrolü
        if (response.data.ips.includes(response.data.clientIP)) {
          setOyKullanildi(true)
        }
      } catch (error) {
        console.error('Oy sayısı alınamadı:', error)
        setHata('Veriler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.')
      } finally {
        setYukleniyor(false)
      }
    }

    oyVerileriGetir()
  }, [])

  const destekOl = async () => {
    if (oyKullanildi) {
      setHata('Bu IP adresi zaten oy kullanmış!')
      return
    }

    try {
      setYukleniyor(true)
      const response = await axios.post(API_URL)
      setImzaSayisi(response.data.votes)
      setOyKullanildi(true)
      setHata('')
    } catch (error: any) {
      if (error.response?.status === 403) {
        setHata('Bu IP adresi zaten oy kullanmış!')
        setOyKullanildi(true)
      } else {
        setHata('Oy kaydedilirken bir hata oluştu! Lütfen tekrar deneyin.')
      }
    } finally {
      setYukleniyor(false)
    }
  }

  return (
    <div className="app-container">
      <div className="content">
        <h1 className="title">DEVRİM İÇİN İMZA</h1>
        <div className="counter">
          <span className="counter-number">{imzaSayisi}</span>
          <span className="counter-text">İmza Toplandı</span>
        </div>
        {hata && <div className="error-message">{hata}</div>}
        <button 
          className={`support-button ${oyKullanildi ? 'disabled' : ''} ${yukleniyor ? 'loading' : ''}`} 
          onClick={destekOl}
          disabled={oyKullanildi || yukleniyor}
        >
          {yukleniyor ? 'YÜKLENİYOR...' : oyKullanildi ? 'OY KULLANILDI' : 'DESTEK OL'}
        </button>
        {oyKullanildi && (
          <div className="vote-info">
            Bu IP adresi ({kullaniciIP}) ile daha önce oy kullanılmış.
          </div>
        )}
      </div>

      <button 
        className="info-button"
        onClick={() => setInfoAcik(!infoAcik)}
      >
        ℹ️
      </button>

      {infoAcik && (
        <div className="info-modal">
          <div className="info-content">
            <p>Bu site, eylemlere destek olmak isteyen ve olamayan bir Türk genci tarafından destek amaçlı oluşturulmuştur.</p>
            <button 
              className="close-button"
              onClick={() => setInfoAcik(false)}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App 