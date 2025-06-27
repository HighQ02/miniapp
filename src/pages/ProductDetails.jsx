import React, { useEffect, useState, useCallback, useRef } from "react";
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

  const videoRefs = useRef([]);

  const fromPage = location.state?.fromPage || 1;

  useEffect(() => {
    fetch(`${API_URL}/products/${id}`)
      .then(res => res.json())
      .then(setProduct)
      .catch(console.error);
  }, [id]);

  // Клавиши для полноэкранного просмотра
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

  // Свайпы для полноэкранного просмотра
  useEffect(() => {
    if (fullscreenIdx === null) return;
    let startX = null;
    let startY = null;
    let isMultiTouch = false;

    const handleTouchStart = (e) => {
      if (e.touches.length > 1) {
        isMultiTouch = true;
        return;
      }
      isMultiTouch = false;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e) => {
      if (isMultiTouch || startX === null || startY === null) return;
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const diffX = endX - startX;
      const diffY = endY - startY;
      if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX > 0 && fullscreenIdx > 0) setFullscreenIdx(fullscreenIdx - 1);
        if (diffX < 0 && fullscreenIdx < (product?.images?.length || 0) - 1)
          setFullscreenIdx(fullscreenIdx + 1);
      }
      startX = null;
      startY = null;
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
        <svg width="22" height="22" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
        {t("back", lang)}
      </button>
      <div className="product-details-card">
        <div className="product-details-title">
          {t("product_number", lang)} {product.id}
        </div>
        <div className="product-details-description">
          По всем вопросам писать в поддержку: @your_support_username
          {/* Здесь ваш общий текст для всех товаров */}
        </div>
        {images.length > 0 && (
          <>
            <div className="product-details-photos-title">{t("photos", lang)}</div>
            <div className="product-details-image-grid">
              {gridImages.map((img, i) => {
                if (showMore && i === maxImages - 1) {
                  return (
                    <div
                      key={i}
                      className="product-details-image-cell product-details-image-more"
                      onClick={() => setFullscreenIdx(i)}
                      style={{ aspectRatio: "3/4" }}
                    >
                      <img
                        src={img.url || img}
                        alt={t("photo", lang) + ` ${i + 1}`}
                        className="product-details-image product-details-image-blur"
                        draggable={false}
                        onContextMenu={e => e.preventDefault()}
                        onTouchStart={e => e.preventDefault()}
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
                      src={img.url || img}
                      alt={t("photo", lang) + ` ${i + 1}`}
                      className="product-details-image"
                      draggable={false}
                      onContextMenu={e => e.preventDefault()}
                      onTouchStart={e => e.preventDefault()}
                    />
                  </div>
                );
              })}
            </div>
          </>
        )}
        {product.videos && product.videos.length > 0 && (
          <>
            <div className="product-details-video-title">{t("videos", lang)}</div>
            <div className="product-details-video-list">
              {product.videos.map((video, index) => {
                const handleFullscreen = () => {
                  const ref = videoRefs.current[index];
                  if (ref && ref.requestFullscreen) {
                    ref.requestFullscreen();
                  }
                };

                return (
                  <div key={index} style={{ position: "relative" }}>
                    <video
                      ref={el => videoRefs.current[index] = el}
                      src={video}
                      controls
                      controlsList="nodownload noremoteplayback"
                      disablePictureInPicture
                      onContextMenu={e => e.preventDefault()}
                      className="product-details-video"
                    />
                    <button
                      type="button"
                      className="admin-editor-video-fullscreen-btn"
                      style={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        zIndex: 2,
                        background: "rgba(0,0,0,0.5)",
                        border: "none",
                        borderRadius: "4px",
                        color: "#fff",
                        padding: "4px 8px",
                        cursor: "pointer"
                      }}
                      onClick={handleFullscreen}
                      title={t("fullscreen", lang)}
                    >
                      <i className="fa-solid fa-expand"></i>
                    </button>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
      {fullscreenIdx !== null && (
        <div className="fullscreen-modal" onClick={() => setFullscreenIdx(null)}>
          <img
            src={images[fullscreenIdx]?.url || images[fullscreenIdx]}
            alt={t("photo", lang) + ` ${fullscreenIdx + 1}`}
            onContextMenu={e => e.preventDefault()}
            onTouchStart={e => e.preventDefault()}
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

export default ProductDetails;