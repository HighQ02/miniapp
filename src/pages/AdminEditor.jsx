import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API_URL = "https://check-bot.top";

const AdminEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [localIsHot, setLocalIsHot] = useState(false);
  const [localHasVideo, setLocalHasVideo] = useState(false);
  const [notif, setNotif] = useState("");

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
    setTimeout(() => navigate("/admin"), 1000);
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

  if (!product) return <div>Загрузка...</div>;

  return (
    <div style={{
      maxWidth: 700,
      margin: "32px auto",
      padding: 24,
      borderRadius: 12,
      boxShadow: "0 2px 12px #0001"
    }}>
      {notif && (
        <div style={{
          position: "fixed",
          top: 30,
          left: "50%",
          transform: "translateX(-50%)",
          background: "#222",
          color: "#fff",
          padding: "12px 32px",
          borderRadius: 8,
          zIndex: 1000,
          fontSize: 18,
          opacity: 0.97
        }}>
          {notif}
        </div>
      )}

      <h2 style={{ marginBottom: 20 }}>Редактирование товара №{product.id}</h2>
      <div style={{ marginBottom: 24 }}>
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
          style={{
            marginLeft: 32,
            background: "#1976d2",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "8px 22px",
            fontWeight: 500,
            fontSize: 16,
            cursor: "pointer",
            transition: "background 0.2s"
          }}
        >
          Сохранить
        </button>
      </div>

      {/* Фото */}
      {product.images.length > 0 && (
        <>
          <h3 style={{ marginBottom: 12 }}>Фото</h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              marginBottom: 24
            }}
          >
            {product.images.map((img, idx) => {
              const relativeImg = img.split('/').slice(-2).join('/');
              return (
                <div
                  key={idx}
                  style={{
                    position: "relative",
                    width: "100%",
                    aspectRatio: "1 / 1",
                    overflow: "hidden",
                    borderRadius: 8,
                    border: "1px solid #eee",
                    background: "#f3f3f3",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <img
                    src={API_URL + img}
                    alt={`Фото ${idx}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      filter: "grayscale(0.15) brightness(0.95)"
                    }}
                  />
                  <span style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    color: "#cacaca",
                    fontWeight: 700,
                    fontSize: 28,
                    background: "rgba(0,0,0,0.6)",
                    borderRadius: 8,
                    padding: "50%"
                  }}>
                    {idx + 1}
                  </span>
                  <button
                    onClick={() => handleDeleteImage(relativeImg)}
                    disabled={loading}
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      background: "rgba(255,255,255,0.85)",
                      border: "none",
                      borderRadius: "50%",
                      width: 28,
                      height: 28,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                      color: "#d32f2f",
                      cursor: "pointer",
                      opacity: 0.7,
                      transition: "opacity 0.2s"
                    }}
                    onMouseOver={e => (e.currentTarget.style.opacity = 1)}
                    onMouseOut={e => (e.currentTarget.style.opacity = 0.7)}
                    title="Удалить фото"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Видео */}
      {product.videos.length > 0 && (
        <>
          <h3 style={{ marginBottom: 12 }}>Видео</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 24, marginBottom: 24 }}>
            {product.videos.map((video, idx) => {
              const relativeVideo = video.split('/').slice(-2).join('/');
              return (
                <div key={idx} style={{ position: "relative", width: "100%" }}>
                  <video
                    src={API_URL + video}
                    controls
                    style={{
                      borderRadius: 8,
                      background: "#000",
                      objectFit: "cover",
                      width: "100%",
                      height: 340,
                      display: "block"
                    }}
                  />
                  <button
                    onClick={() => handleDeleteVideo(relativeVideo)}
                    disabled={loading}
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      background: "rgba(255,255,255,0.85)",
                      border: "none",
                      borderRadius: "50%",
                      width: 28,
                      height: 28,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                      color: "#d32f2f",
                      cursor: "pointer",
                      opacity: 0.7,
                      transition: "opacity 0.2s"
                    }}
                    onMouseOver={e => (e.currentTarget.style.opacity = 1)}
                    onMouseOut={e => (e.currentTarget.style.opacity = 0.7)}
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
        style={{
          marginTop: 24,
          background: "#d32f2f",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          padding: "12px 32px",
          fontWeight: 600,
          fontSize: 18,
          cursor: "pointer",
          display: "block",
          width: "100%",
          transition: "background 0.2s"
        }}
        onClick={handleDeleteProduct}
        disabled={loading}
      >
        Удалить товар полностью
      </button>
    </div>
  );
};

export default AdminEditor;