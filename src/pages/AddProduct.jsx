import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useTelegramUser from "../hooks/useTelegramUser";
import t from "../i18n";

const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        background: '#fff', borderRadius: 12, padding: 32, minWidth: 320, boxShadow: '0 4px 24px #0002'
      }}>
        <h2 style={{marginTop:0}}>{title}</h2>
        <div>{children}</div>
        <button style={{marginTop:24}} onClick={onClose}>OK</button>
      </div>
    </div>
  );
};

const AddProduct = () => {
  const { lang } = useTelegramUser();
  const [thumbnail, setThumbnail] = useState(null);
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [hasVideo, setHasVideo] = useState(false);
  const [isHot, setIsHot] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState({ open: false, success: false, message: '' });
  const navigate = useNavigate();

  useEffect(() => {
    if (videos.length > 0) {
      setHasVideo(true);
    } else {
      setHasVideo(false);
    }
  }, [videos]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!thumbnail) {
      return setError(t("add_thumbnail_required", lang));
    }
    if (images.length === 0 && videos.length === 0) {
      return setError(t("add_photo_or_video_required", lang));
    }

    setError('');
    const formData = new FormData();
    formData.append('thumbnail', thumbnail);
    images.forEach(img => formData.append('images', img));
    videos.forEach(vid => formData.append('videos', vid));
    formData.append('has_video', hasVideo);
    formData.append('is_hot', isHot);

    try {
      const res = await fetch('https://check-bot.top/api/admin/add-product', {
        method: 'POST',
        body: formData,
      });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(t("server_error", lang) + ": " + text);
      }
      if (data.status === 'success') {
        setModal({ open: true, success: true, message: t("product_added", lang) });
      } else {
        setModal({ open: true, success: false, message: data.error || t("add_product_error", lang) });
      }
    } catch (e) {
      setModal({ open: true, success: false, message: e.message });
    }
  };

  const handleModalClose = () => {
    setModal({ open: false, success: false, message: '' });
    if (modal.success) {
      navigate('/admin');
    }
  };

  return (
    <div className="admin-container">
      <button
        className="admin-editor-save-btn admin-editor-back-btn"
        onClick={() => navigate("/admin")}
        style={{ marginBottom: 18 }}
      >
        ← {t("back", lang)}
      </button>
      <h2 style={{textAlign:'center'}}>{t("add_product", lang)}</h2>
      {error && <p style={{ color: 'red', textAlign:'center' }}>{error}</p>}
      <form onSubmit={handleSubmit} style={{display:'flex', flexDirection:'column', gap:16}}>
        <label>
          <span>{t("thumbnail", lang)}:</span>
          <input type="file" accept="image/*" onChange={e => setThumbnail(e.target.files[0])} />
        </label>
        <label>
          <span>{t("photos", lang)}:</span>
          <input type="file" accept="image/*" multiple onChange={e => setImages([...e.target.files])} />
        </label>
        <label>
          <span>{t("videos", lang)}:</span>
          <input type="file" accept="video/*" multiple onChange={e => setVideos([...e.target.files])} />
        </label>
        <label style={{display:'flex',alignItems:'center',gap:8}}>
          <input type="checkbox" checked={hasVideo} onChange={e => setHasVideo(e.target.checked)} disabled={videos.length > 0} />
          <i className="fa-solid fa-video" style={{color: "#786ac8"}}></i>
          {t("video", lang)}
        </label>
        <label style={{display:'flex',alignItems:'center',gap:8}}>
          <input type="checkbox" checked={isHot} onChange={e => setIsHot(e.target.checked)} />
          <i className="fa-brands fa-skype" style={{color: "#00aff0"}}></i>
          {t("skype", lang)}
        </label>
        <button type="submit" style={{
          background:'#1976d2', color:'#fff', border:'none', borderRadius:8, padding:'12px 0', fontSize:18, cursor:'pointer'
        }}>{t("add_product", lang)}</button>
      </form>
      <Modal open={modal.open} onClose={handleModalClose} title={modal.success ? t("success", lang) : t("error", lang)}>
        <div style={{textAlign:'center', color: modal.success ? 'green' : 'red', fontSize:18}}>
          {modal.message}
        </div>
      </Modal>
    </div>
  );
};

export default AddProduct;