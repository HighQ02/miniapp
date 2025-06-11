import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";

const API_URL = "https://check-bot.top/api";

const ProductDetails = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [fullscreenIdx, setFullscreenIdx] = useState(null);

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
          idx < product.images.length - 1 ? idx + 1 : idx
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
      if (diff < -50 && fullscreenIdx < product.images.length - 1)
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

  if (!product) return <div>Загрузка...</div>;

  // Для сетки 3x3
  const images = product.images || [];
  const gridImages = images.slice(0, 8);
  const showMore = images.length > 9;

  // Для полноэкранного режима
  const openFullscreen = (idx) => setFullscreenIdx(idx);
  const closeFullscreen = () => setFullscreenIdx(null);

  return (
    <div
      className="product-details"
      style={{
        maxWidth: 800,
        margin: "0 auto",
        padding: 16, // отступы от краёв экрана
      }}
    >
      <h2 style={{ marginBottom: 16 }}>Товар №{product.id}</h2>

      {/* Сетка фото только если есть фото */}
      {images.length > 0 && (
        <div
          className="image-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 8,
            marginBottom: 24,
          }}
        >
          {(() => {
            let cells = [];
            if (images.length <= 9) {
              // Просто показываем все картинки (и пустые ячейки если <9)
              for (let i = 0; i < 9; i++) {
                if (i < images.length) {
                  cells.push(
                    <div
                      key={i}
                      style={{
                        aspectRatio: "1/1",
                        background: "#eee",
                        cursor: "pointer",
                        overflow: "hidden",
                        borderRadius: 8,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      onClick={() => openFullscreen(i)}
                    >
                      <img
                        src={API_URL + images[i]}
                        alt={`Фото ${i + 1}`}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        draggable={false}
                      />
                    </div>
                  );
                } else {
                  cells.push(
                    <div
                      key={`empty-${i}`}
                      style={{
                        aspectRatio: "1/1",
                        background: "#f5f5f5",
                        borderRadius: 8,
                      }}
                    />
                  );
                }
              }
            } else {
              // >9: первые 8 картинок + 9-я "Далее..."
              for (let i = 0; i < 8; i++) {
                cells.push(
                  <div
                    key={i}
                    style={{
                      aspectRatio: "1/1",
                      background: "#eee",
                      cursor: "pointer",
                      overflow: "hidden",
                      borderRadius: 8,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    onClick={() => openFullscreen(i)}
                  >
                    <img
                      src={API_URL + images[i]}
                      alt={`Фото ${i + 1}`}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      draggable={false}
                    />
                  </div>
                );
              }
              // 9-я — полупрозрачная с текстом
              cells.push(
                <div
                  key="more"
                  style={{
                    aspectRatio: "1/1",
                    background: "#333",
                    color: "#fff",
                    fontWeight: "bold",
                    fontSize: 22,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 8,
                    cursor: "pointer",
                    position: "relative",
                    overflow: "hidden",
                    opacity: 0.8,
                  }}
                  onClick={() => openFullscreen(8)}
                >
                  <img
                    src={API_URL + images[8]}
                    alt="Фото 9"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      position: "absolute",
                      left: 0,
                      top: 0,
                      zIndex: 1,
                      opacity: 0.6,
                      pointerEvents: "none",
                      userSelect: "none",
                    }}
                    draggable={false}
                  />
                  <span
                    style={{
                      position: "relative",
                      zIndex: 2,
                      color: "#fff",
                      fontWeight: "bold",
                      fontSize: 22,
                      textShadow: "0 2px 8px #000",
                      pointerEvents: "none",
                    }}
                  >
                    Далее...
                  </span>
                </div>
              );
            }
            return cells;
          })()}
        </div>
      )}

      {/* Видео в столбец */}
      {product.videos && product.videos.length > 0 && (
        <div>
          <h3>Видео</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {product.videos.map((video, index) => (
              <video
                key={index}
                src={API_URL + video}
                controls
                controlsList="nodownload noremoteplayback"
                disablePictureInPicture
                style={{ width: "100%", maxWidth: 600, borderRadius: 8, background: "#000" }}
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

      {/* Полноэкранный просмотр */}
      {fullscreenIdx !== null && (
        <div
          className="fullscreen-modal"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.95)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
          }}
          onClick={closeFullscreen}
        >
          <img
            src={API_URL + images[fullscreenIdx]}
            alt={`Фото ${fullscreenIdx + 1}`}
            style={{
              maxWidth: "90vw",
              maxHeight: "90vh",
              borderRadius: 12,
              boxShadow: "0 4px 32px #0008",
              userSelect: "none",
            }}
            draggable={false}
            onClick={(e) => e.stopPropagation()}
          />
          {/* Стрелки для ПК */}
          {fullscreenIdx > 0 && (
            <button
              style={{
                position: "fixed",
                left: 32,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: 40,
                background: "none",
                border: "none",
                color: "#fff",
                cursor: "pointer",
                zIndex: 1001,
                display: window.innerWidth > 600 ? "block" : "none",
              }}
              onClick={(e) => {
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
              style={{
                position: "fixed",
                right: 32,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: 40,
                background: "none",
                border: "none",
                color: "#fff",
                cursor: "pointer",
                zIndex: 1001,
                display: window.innerWidth > 600 ? "block" : "none",
              }}
              onClick={(e) => {
                e.stopPropagation();
                setFullscreenIdx(fullscreenIdx + 1);
              }}
              aria-label="Вперёд"
            >
              &#8594;
            </button>
          )}
          {/* Индикатор и закрытие */}
          <div
            style={{
              color: "#fff",
              marginTop: 16,
              fontSize: 18,
              textAlign: "center",
              userSelect: "none",
            }}
          >
            {fullscreenIdx + 1} / {images.length}
            <span
              style={{
                marginLeft: 24,
                cursor: "pointer",
                fontSize: 24,
                verticalAlign: "middle",
              }}
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