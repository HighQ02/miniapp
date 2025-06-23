import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import useTelegramUser from "../hooks/useTelegramUser";
import t from "../i18n";

const API_URL = "https://check-bot.top/api";

const ProductDetails = ({ lang: propLang }) => {
  const { lang: hookLang } = useTelegramUser();
  const lang = propLang || hookLang || "ru";

  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [product, setProduct] = useState(null);
  const [fullscreenIdx, setFullscreenIdx] = useState(null);

  const fromPage = location.state?.fromPage || 1;

  useEffect(() => {
    fetch(`${API_URL}/products/${id}`)
      .then(res => res.json())
      .then(setProduct)
      .catch(console.error);
  }, [id]);

  const handleKeyDown = useCallback(
    (e) => {
      if (fullscreenIdx === null) return;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        setFullscreenIdx((idx) =>
          idx < (product?.images?.length || 0) - 1 ? idx + 1 : idx
        );
      }
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        setFullscreenIdx((idx) => (idx > 0 ? idx - 1 : idx));
      }
      if (e.key === "Escape") setFullscreenIdx(null);
    },
    [fullscreenIdx, product]
  );

  useEffect(() => {
    if (fullscreenIdx !== null) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [fullscreenIdx, handleKeyDown]);

  useEffect(() => {
    if (fullscreenIdx === null) return;
    let startX = null;
    const handleTouchStart = (e) => {
      startX = e.touches[0].clientX;
    };
    const handleTouchEnd = (e) => {
      if (startX === null) return;
      const endX = e.changedTouches[0].clientX;
      const diff = endX - startX;
      if (diff > 50 && fullscreenIdx > 0) setFullscreenIdx(fullscreenIdx - 1);
      if (diff < -50 && fullscreenIdx < (product?.images?.length || 0) - 1)
        setFullscreenIdx(fullscreenIdx + 1);
      startX = null;
    };
    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchend", handleTouchEnd);
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [fullscreenIdx, product]);

  if (!product) return <div className="products-loading">{t("products_loading", lang)}</div>;

  const images = product.images || [];
  const gridImages = images.slice(0, 8);

  const openFullscreen = (idx) => setFullscreenIdx(idx);
  const closeFullscreen = () => setFullscreenIdx(null);

  return (
    <div className="product-details-container">
      <button
        className="product-details-back-btn"
        onClick={() => navigate(`/?page=${fromPage}`)}
      >
        <svg width="22" height="22" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" stroke="#786ac8" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
        {t("back", lang)}
      </button>
      <div className="product-details-card">
        <h2>{t("product_number", lang)} {product.id}</h2>
        <div className="product-details-icons">
          {product.is_hot && <span className="icon-hot">🔥</span>}
          {product.has_video && <span className="icon-video">🎥</span>}
        </div>
        {/* Сетка фото */}
        {images.length > 0 && (
          <div className="product-details-image-grid">
            {images.map((img, i) => (
              <div
                key={i}
                className="product-details-image-cell"
                onClick={() => openFullscreen(i)}
                style={{ aspectRatio: "3/4" }}
              >
                <img
                  src={img}
                  alt={t("photo", lang) + ` ${i + 1}`}
                  onContextMenu={e => e.preventDefault()}
                  className="product-details-image"
                  draggable={false}
                />
              </div>
            ))}
          </div>
        )}
        {/* Видео */}
        {product.videos && product.videos.length > 0 && (
          <div>
            <h3 className="product-details-video-title">{t("video", lang)}</h3>
            <div className="product-details-video-list">
              {product.videos.map((video, index) => (
                <video
                  key={index}
                  src={video}
                  controls
                  controlsList="nodownload noremoteplayback"
                  disablePictureInPicture
                  onContextMenu={e => e.preventDefault()}
                  className="product-details-video"
                />
              ))}
            </div>
          </div>
        )}
      </div>
      {/* Полноэкранный просмотр */}
      {fullscreenIdx !== null && (
        <div className="fullscreen-modal" onClick={closeFullscreen}>
          <img
            src={images[fullscreenIdx]}
            alt={t("photo", lang) + ` ${fullscreenIdx + 1}`}
            onContextMenu={e => e.preventDefault()}
            className="fullscreen-modal-img"
            draggable={false}
            onClick={e => e.stopPropagation()}
          />
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
              onClick={closeFullscreen}
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

export default ProductDetails;