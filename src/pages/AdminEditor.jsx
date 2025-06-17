import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import "./Admin.css";

const API_URL = "https://check-bot.top/api";
const PHOTOS_PER_PAGE = 2; // поменяете на 40 когда нужно

const AdminEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [localIsHot, setLocalIsHot] = useState(false);
  const [localHasVideo, setLocalHasVideo] = useState(false);
  const [notif, setNotif] = useState("");
  const [photoPage, setPhotoPage] = useState(1);
  
  const fromPage = location.state?.fromPage || 1;

  useEffect(() => {
    fetch(`${API_URL}/products/${id}`)
      .then(res => res.json())
      .then(data => {
        setProduct(data);
        setLocalIsHot(data.is_hot);
        setLocalHasVideo(data.has_video);
      })
      .catch(console.error);
  }, [id]);

  const showNotif = (msg) => {
    setNotif(msg);
    setTimeout(() => setNotif(""), 2000);
  };

  const handleDeleteImage = async (imgPath) => {
    if (!window.confirm("Удалить это фото?")) return;
    setLoading(true);
    await fetch(`${API_URL}/admin/delete-image`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: id, image: imgPath }),
    });
    setProduct(prev => ({
      ...prev,
      images: prev.images.filter(img => img.split('/').slice(-2).join('/') !== imgPath)
    }));
    setLoading(false);
    showNotif("Фото удалено");
  };

  const handleDeleteVideo = async (videoPath) => {
    if (!window.confirm("Удалить это видео?")) return;
    setLoading(true);
    await fetch(`${API_URL}/admin/delete-video`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: id, video: videoPath }),
    });
    setProduct(prev => ({
      ...prev,
      videos: prev.videos.filter(v => v.split('/').slice(-2).join('/') !== videoPath)
    }));
    setLoading(false);
    showNotif("Видео удалено");
  };

  const handleDeleteProduct = async () => {
    if (!window.confirm("Удалить товар полностью?")) return;
    setLoading(true);
    await fetch(`${API_URL}/admin/delete-product`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: id }),
    });
    setLoading(false);
    showNotif("Товар удалён");
    setTimeout(() => navigate("/admin" + (location.state?.fromPage ? `?page=${location.state.fromPage}` : "")), 1000);
  };

  const handleSave = async () => {
    setLoading(true);
    await fetch(`${API_URL}/admin/update-product`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: id,
        is_hot: localIsHot,
        has_video: localHasVideo
      }),
    });
    setProduct(prev => ({
      ...prev,
      is_hot: localIsHot,
      has_video: localHasVideo
    }));
    setLoading(false);
    showNotif("Сохранено!");
  };

  // Пагинация фото
  const images = product?.images || [];
  const totalPages = Math.ceil(images.length / PHOTOS_PER_PAGE);
  const pagedImages = images.slice((photoPage - 1) * PHOTOS_PER_PAGE, photoPage * PHOTOS_PER_PAGE);

  if (!product) return <div>Загрузка...</div>;

  return (
    <div className="admin-editor-container">
      {notif && (
        <div className="admin-editor-notif">{notif}</div>
      )}

      <button
        className="admin-editor-save-btn admin-editor-back-btn"
        onClick={() => navigate(`/admin?page=${fromPage}`)}
      >
        ← Назад
      </button>

      <h2 className="admin-editor-header">Редактирование товара №{product.id}</h2>
      <div className="admin-editor-checkbox-group" style={{ marginBottom: 24 }}>
        <label>
          <input
            type="checkbox"
            checked={localIsHot}
            onChange={() => setLocalIsHot(v => !v)}
            disabled={loading}
          />{" "}
          Горячее предложение
        </label>
        <label style={{ marginLeft: 24 }}>
          <input
            type="checkbox"
            checked={localHasVideo}
            onChange={() => setLocalHasVideo(v => !v)}
            disabled={loading}
          />{" "}
          Есть видео
        </label>
        <button
          onClick={handleSave}
          disabled={loading}
          className="admin-editor-save-btn"
        >
          Сохранить
        </button>
      </div>

      {/* Фото */}
      {images.length > 0 && (
        <>
          <h3 style={{ marginBottom: 12 }}>Фото</h3>
          <div className="admin-editor-photo-grid">
            {pagedImages.map((img, idx) => {
              const relativeImg = img.split('/').slice(-2).join('/');
              return (
                <div key={idx} className="admin-editor-photo-item">
                  <img
                    src={img}
                    alt={`Фото ${idx}`}
                    className="admin-editor-photo-img"
                  />
                  <span className="admin-editor-photo-num">
                    {(photoPage - 1) * PHOTOS_PER_PAGE + idx + 1}
                  </span>
                  <button
                    onClick={() => handleDeleteImage(relativeImg)}
                    disabled={loading}
                    className="admin-editor-delete-btn"
                    title="Удалить фото"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
          {/* Пагинация */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 12, margin: "18px 0" }}>
              <button
                onClick={() => setPhotoPage(p => Math.max(1, p - 1))}
                disabled={photoPage === 1}
                className="admin-editor-save-btn"
                style={{ background: "#23232d", color: "#2aabee" }}
              >←</button>
              <span style={{ alignSelf: "center" }}>{photoPage} / {totalPages}</span>
              <button
                onClick={() => setPhotoPage(p => Math.min(totalPages, p + 1))}
                disabled={photoPage === totalPages}
                className="admin-editor-save-btn"
                style={{ background: "#23232d", color: "#2aabee" }}
              >→</button>
            </div>
          )}
        </>
      )}

      {/* Видео */}
      {product.videos.length > 0 && (
        <>
          <h3 style={{ marginBottom: 12 }}>Видео</h3>
          <div className="admin-editor-video-list">
            {product.videos.map((video, idx) => {
              const relativeVideo = video.split('/').slice(-2).join('/');
              return (
                <div key={idx} className="admin-editor-video-item">
                  <video
                    src={video}
                    controls
                    className="admin-editor-video"
                  />
                  <button
                    onClick={() => handleDeleteVideo(relativeVideo)}
                    disabled={loading}
                    className="admin-editor-delete-btn"
                    title="Удалить видео"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      <button
        className="admin-editor-delete-product-btn"
        onClick={handleDeleteProduct}
        disabled={loading}
      >
        Удалить товар полностью
      </button>
    </div>
  );
};

export default AdminEditor;