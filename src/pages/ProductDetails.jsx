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
  const maxImages = 9;
  const gridImages = images.slice(0, maxImages);
  const showMore = images.length > maxImages;

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
        <div className="product-details-header">
          <span className="product-details-id">
            {product.id}
            {product.is_hot && <span className="product-details-icon">🔥</span>}
            {product.has_video && <span className="product-details-icon">🎥</span>}
          </span>
        </div>
        <div className="product-details-photos-title">{t("photos", lang)}</div>
        <div className="product-details-image-grid">
          {Array.from({ length: maxImages }).map((_, i) => {
            if (i < gridImages.length) {
              if (showMore && i === maxImages - 1) {
                return (
                  <div
                    key={i}
                    className="product-details-image-cell product-details-image-more"
                    onClick={() => setFullscreenIdx(i)}
                    style={{ aspectRatio: "3/4" }}
                  >
                    <img
                      src={gridImages[i]}
                      alt={t("photo", lang) + ` ${i + 1}`}
                      className="product-details-image product-details-image-blur"
                      draggable={false}
                      onContextMenu={e => e.preventDefault()}
                    />
                    <span className="product-details-image-more-text">
                      {t("more", lang)}
                    </span>
                  </div>
                );
              }
              return (
                <div
                  key={i}
                  className="product-details-image-cell"
                  onClick={() => setFullscreenIdx(i)}
                  style={{ aspectRatio: "3/4" }}
                >
                  <img
                    src={gridImages[i]}
                    alt={t("photo", lang) + ` ${i + 1}`}
                    className="product-details-image"
                    draggable={false}
                    onContextMenu={e => e.preventDefault()}
                  />
                </div>
              );
            }
            // Пустые ячейки не отображаем
            return null;
          })}
        </div>
        {product.videos && product.videos.length > 0 && (
          <div>
            <div className="product-details-video-title">{t("video", lang)}</div>
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
      {/* Полноэкранный просмотр — оставить как было */}
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