import React, { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

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
        setHata('')
        const response = await axios.get('/api/votes', {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Expires': '0',
          }
        })
        
        if (response.data && typeof response.data.votes === 'number') {
          setImzaSayisi(response.data.votes)
          setKullaniciIP(response.data.clientIP || 'bilinmiyor')
          if (response.data.ips && response.data.ips.includes(response.data.clientIP)) {
            setOyKullanildi(true)
          }
        } else {
          throw new Error('Geçersiz veri formatı')
        }
      } catch (error) {
        console.error('Veri alma hatası:', error)
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
      setHata('')
      const response = await axios.post('/api/votes', {}, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      })
      
      if (response.data && typeof response.data.votes === 'number') {
        setImzaSayisi(response.data.votes)
        setOyKullanildi(true)
      } else {
        throw new Error('Geçersiz yanıt formatı')
      }
    } catch (error: any) {
      console.error('Oy verme hatası:', error)
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
        <div className="info-modal" onClick={() => setInfoAcik(false)}>
          <div className="info-content" onClick={e => e.stopPropagation()}>
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