import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import "./App.css";

const API_URL = "https://check-bot.top/api";

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [product, setProduct] = useState(null);
  const [fullscreenIdx, setFullscreenIdx] = useState(null);

  // Для возврата на нужную страницу
  const fromPage = location.state?.fromPage || 1;

  useEffect(() => {
    fetch(`${API_URL}/products/${id}`)
      .then(res => res.json())
      .then(setProduct)
      .catch(console.error);
  }, [id]);

  // Обработчики для листания в полноэкранном режиме
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

  // Свайпы для мобильных
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

  if (!product) return <div className="products-loading">Загрузка...</div>;

  const images = product.images || [];
  const gridImages = images.slice(0, 8);
  const showMore = images.length > 9;

  const openFullscreen = (idx) => setFullscreenIdx(idx);
  const closeFullscreen = () => setFullscreenIdx(null);

  return (
    <div className="product-details-container">
      <button
        className="products-pagination-btn"
        onClick={() => navigate(`/?page=${fromPage}`)}
        style={{ marginBottom: 18 }}
      >
        ← Назад
      </button>
      <div className="product-details-card">
        <h2>Товар №{product.id}</h2>
        <div className="product-details-icons">
          {product.is_hot && <span className="icon-hot">🔥</span>}
          {product.has_video && <span className="icon-video">🎥</span>}
        </div>
        {/* Сетка фото */}
        {images.length > 0 && (
          <div className="product-details-image-grid">
            {(() => {
              let cells = [];
              if (images.length <= 9) {
                for (let i = 0; i < 9; i++) {
                  if (i < images.length) {
                    cells.push(
                      <div
                        key={i}
                        className="product-details-image-cell"
                        onClick={() => openFullscreen(i)}
                      >
                        <img
                          src={API_URL + images[i]}
                          alt={`Фото ${i + 1}`}
                          className="product-details-image"
                          draggable={false}
                        />
                      </div>
                    );
                  } else {
                    cells.push(
                      <div key={`empty-${i}`} className="product-details-image-cell product-details-image-empty" />
                    );
                  }
                }
              } else {
                for (let i = 0; i < 8; i++) {
                  cells.push(
                    <div
                      key={i}
                      className="product-details-image-cell"
                      onClick={() => openFullscreen(i)}
                    >
                      <img
                        src={API_URL + images[i]}
                        alt={`Фото ${i + 1}`}
                        className="product-details-image"
                        draggable={false}
                      />
                    </div>
                  );
                }
                // 9-я — "Далее..."
                cells.push(
                  <div
                    key="more"
                    className="product-details-image-cell product-details-image-more"
                    onClick={() => openFullscreen(8)}
                  >
                    <img
                      src={API_URL + images[8]}
                      alt="Фото 9"
                      className="product-details-image product-details-image-blur"
                      draggable={false}
                    />
                    <span className="product-details-image-more-text">Далее...</span>
                  </div>
                );
              }
              return cells;
            })()}
          </div>
        )}
        {/* Видео */}
        {product.videos && product.videos.length > 0 && (
          <div>
            <h3>Видео</h3>
            <div className="product-details-video-list">
              {product.videos.map((video, index) => (
                <video
                  key={index}
                  src={API_URL + video}
                  controls
                  controlsList="nodownload noremoteplayback"
                  disablePictureInPicture
                  className="product-details-video"
                  onClick={e => {
                    if (e.target === e.currentTarget) {
                      if (e.currentTarget.paused) {
                        e.currentTarget.play();
                      } else {
                        e.currentTarget.pause();
                      }
                    }
                  }}
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
            src={API_URL + images[fullscreenIdx]}
            alt={`Фото ${fullscreenIdx + 1}`}
            className="fullscreen-modal-img"
            draggable={false}
            onClick={e => e.stopPropagation()}
          />
          {/* Стрелки для ПК */}
          {fullscreenIdx > 0 && (
            <button
              className="fullscreen-modal-arrow fullscreen-modal-arrow-left"
              onClick={e => {
                e.stopPropagation();
                setFullscreenIdx(fullscreenIdx - 1);
              }}
              aria-label="Назад"
            >
              &#8592;
            </button>
          )}
          {fullscreenIdx < images.length - 1 && (
            <button
              className="fullscreen-modal-arrow fullscreen-modal-arrow-right"
              onClick={e => {
                e.stopPropagation();
                setFullscreenIdx(fullscreenIdx + 1);
              }}
              aria-label="Вперёд"
            >
              &#8594;
            </button>
          )}
          <div className="fullscreen-modal-info">
            {fullscreenIdx + 1} / {images.length}
            <span
              className="fullscreen-modal-close"
              onClick={closeFullscreen}
              title="Закрыть"
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