import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import useTelegramUser from "../hooks/useTelegramUser";
import t from "../i18n";

const API_URL = "https://check-bot.top/api";

const AdminEditor = () => {
  const { lang } = useTelegramUser();
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [localIsHot, setLocalIsHot] = useState(false);
  const [localHasVideo, setLocalHasVideo] = useState(false);
  const [notif, setNotif] = useState("");
  const [fullscreenIdx, setFullscreenIdx] = useState(null);

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
    if (!window.confirm(t("delete_photo_confirm", lang))) return;
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
    showNotif(t("photo_deleted", lang));
  };

  const handleDeleteVideo = async (videoPath) => {
    if (!window.confirm(t("delete_video_confirm", lang))) return;
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
    showNotif(t("video_deleted", lang));
  };

  const handleDeleteProduct = async () => {
    if (!window.confirm(t("delete_product_confirm", lang))) return;
    setLoading(true);
    await fetch(`${API_URL}/admin/delete-product`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: id }),
    });
    setLoading(false);
    showNotif(t("product_deleted", lang));
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
    showNotif(t("saved", lang));
  };

  // Фотки для сетки 3x3
  const images = product?.images || [];
  const maxImages = 9;
  const gridImages = images.slice(0, maxImages);
  const showMore = images.length > maxImages;

  if (!product) return <div className="products-loading">{t("loading", lang)}</div>;

  return (
    <div className="admin-editor-container">
      {notif && <div className="admin-editor-notif">{notif}</div>}

      <button
        className="admin-editor-back-btn"
        onClick={() => navigate(`/admin?page=${fromPage}`)}
      >
        <svg width="22" height="22" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
        {t("back", lang)}
      </button>

      <div className="admin-editor-card">
        <div className="admin-editor-title">
          {t("product_number", lang)} {product.id}
        </div>
        <div className="admin-editor-description">
          По всем вопросам писать в поддержку: @your_support_username
          {/* Здесь ваш общий текст для всех товаров */}
        </div>
        <div className="admin-editor-checkbox-group" style={{ margin: "0 0 18px 18px" }}>
          <label>
            <input
              type="checkbox"
              checked={localIsHot}
              onChange={() => setLocalIsHot(v => !v)}
              disabled={loading}
            />{" "}
            <i className="fa-brands fa-skype" style={{color: "#00aff0"}}></i>
            {t("skype", lang)}
          </label>
          <label style={{ marginLeft: 24 }}>
            <input
              type="checkbox"
              checked={localHasVideo}
              onChange={() => setLocalHasVideo(v => !v)}
              disabled={loading}
            />{" "}
            <i className="fa-solid fa-video" style={{color: "#b6aaff"}}></i>
            {t("video", lang)}
          </label>
          <button
            onClick={handleSave}
            disabled={loading}
            className="admin-editor-save-btn"
          >
            <svg width="20" height="20" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
            {t("save", lang)}
          </button>
        </div>
        {/* Фото */}
        {images.length > 0 && (
          <>
            <div className="admin-editor-photos-title" style={{ marginTop: 0}}>{t("photos", lang)}</div>
            <div className="admin-editor-photo-grid">
              {gridImages.map((img, i) => {
                if (showMore && i === maxImages - 1) {
                  const relativeImg = img.split('/').slice(-2).join('/');
                  return (
                    <div
                      key={i}
                      className="admin-editor-photo-item admin-editor-photo-more"
                      onClick={() => setFullscreenIdx(i)}
                      style={{ aspectRatio: "3/4" }}
                    >
                      <img
                        src={img.url || img}
                        alt={t("photo", lang) + ` ${i + 1}`}
                        className="admin-editor-photo-img admin-editor-photo-blur"
                        draggable={false}
                        onContextMenu={e => e.preventDefault()}
                      />
                      <span className="admin-editor-photo-more-text">
                        {t("more", lang)}
                      </span>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleDeleteImage(relativeImg);
                        }}
                        disabled={loading}
                        className="admin-editor-delete-btn"
                        title={t("delete_photo", lang)}
                      >
                        ×
                      </button>
                    </div>
                  );
                }
                const relativeImg = img.split('/').slice(-2).join('/');
                return (
                  <div
                    key={i}
                    className="admin-editor-photo-item"
                    onClick={() => setFullscreenIdx(i)}
                    style={{ aspectRatio: "3/4" }}
                  >
                    <img
                      src={img.url || img}
                      alt={t("photo", lang) + ` ${i + 1}`}
                      className="admin-editor-photo-img"
                      draggable={false}
                      onContextMenu={e => e.preventDefault()}
                    />
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleDeleteImage(relativeImg);
                      }}
                      disabled={loading}
                      className="admin-editor-delete-btn"
                      title={t("delete_photo", lang)}
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
        {product.videos && product.videos.length > 0 && (
          <>
            <div className="admin-editor-video-title">{t("videos", lang)}</div>
            <div className="admin-editor-video-list">
              {product.videos.map((video, idx) => {
                const relativeVideo = video.split('/').slice(-2).join('/');
                return (
                  <div key={idx} className="admin-editor-video-item">
                    <video
                      src={video}
                      controls
                      onContextMenu={e => e.preventDefault()}
                      draggable={false}
                      className="admin-editor-video"
                    />
                    <button
                      onClick={() => handleDeleteVideo(relativeVideo)}
                      disabled={loading}
                      className="admin-editor-delete-btn"
                      title={t("delete_video", lang)}
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
          <svg width="20" height="20" viewBox="0 0 24 24"><path d="M6 6l12 12M6 18L18 6" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
          {t("delete_product", lang)}
        </button>
      </div>
      {/* Полноэкранный просмотр фото */}
      {fullscreenIdx !== null && (
        <div className="fullscreen-modal" onClick={() => setFullscreenIdx(null)}>
          <img
            src={images[fullscreenIdx]?.url || images[fullscreenIdx]}
            alt={t("photo", lang) + ` ${fullscreenIdx + 1}`}
            onContextMenu={e => e.preventDefault()}
            className="fullscreen-modal-img"
            draggable={false}
            onClick={e => e.stopPropagation()}
          />
          <button
            className="fullscreen-modal-delete"
            onClick={e => {
              e.stopPropagation();
              handleDeleteImage(images[fullscreenIdx].split('/').slice(-2).join('/'));
              setFullscreenIdx(null);
            }}
            title={t("delete_photo", lang)}
          >
            ×
          </button>
          {fullscreenIdx > 0 && (
            <button
              className="fullscreen-modal-arrow fullscreen-modal-arrow-left"
              onClick={e => {
                e.stopPropagation();
                setFullscreenIdx(fullscreenIdx - 1);
              }}
              aria-label={t("back", lang)}
            >
              <svg width="40" height="40" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#786ac8"/><path d="M15 18l-6-6 6-6" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          )}
          {fullscreenIdx < images.length - 1 && (
            <button
              className="fullscreen-modal-arrow fullscreen-modal-arrow-right"
              onClick={e => {
                e.stopPropagation();
                setFullscreenIdx(fullscreenIdx + 1);
              }}
              aria-label={t("forward", lang)}
            >
              <svg width="40" height="40" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#786ac8"/><path d="M9 6l6 6-6 6" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          )}
          <div className="fullscreen-modal-info">
            {fullscreenIdx + 1} / {images.length}
            <span
              className="fullscreen-modal-close"
              onClick={e => {
                e.stopPropagation();
                setFullscreenIdx(null);
              }}
              title={t("close", lang)}
            >
              &times;
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEditor;