import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useTelegramUser from "../hooks/useTelegramUser";
import t from "../i18n";

const API_URL = "https://check-bot.top/api";

const getGridSettings = () => {
  const width = window.innerWidth;
  if (width < 700) return { cols: 2, max: 40 };
  if (width < 1100) return { cols: 3, max: 60 };
  return { cols: 4, max: 80 };
};

const AdminPanel = ({ lang: propLang }) => {
  const { lang: hookLang } = useTelegramUser();
  const lang = propLang || hookLang || "ru";

  const [products, setProducts] = useState([]);
  const [searchId, setSearchId] = useState("");
  const [filterHot, setFilterHot] = useState(false);
  const [filterVideo, setFilterVideo] = useState(false);
  const [grid, setGrid] = useState(getGridSettings());

  const location = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(location.search);
  const page = parseInt(params.get("page") || "1", 10);

  useEffect(() => {
    fetch(`${API_URL}/`)
      .then(res => res.json())
      .then(setProducts);
  }, []);

  useEffect(() => {
    const onResize = () => setGrid(getGridSettings());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  let filtered = products;
  if (searchId) filtered = filtered.filter(p => p.id.toString().includes(searchId));
  if (filterHot) filtered = filtered.filter(p => p.is_hot);
  if (filterVideo) filtered = filtered.filter(p => p.has_video);

  filtered = filtered.slice(0, grid.max);

  const ITEMS_PER_PAGE = grid.cols * 2;
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paged = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleCardClick = (id) => {
    navigate(`/admin/${id}`, { state: { fromPage: page } });
  };

  // Telegram-style toggle button
  const ToggleBtn = ({ checked, onChange, icon, label }) => (
    <label className="tg-toggle">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="tg-toggle-slider">{icon}</span>
      <span className="tg-toggle-label">{label}</span>
    </label>
  );

  return (
    <div className="admin-container">
      <h2>{t("admin_panel", lang)}</h2>
      <div className="admin-filters">
        <input
          className="admin-search"
          type="text"
          placeholder={t("search_by_id", lang)}
          value={searchId}
          onChange={e => setSearchId(e.target.value)}
        />
        <ToggleBtn
          checked={filterHot}
          onChange={e => setFilterHot(e.target.checked)}
          icon={<span role="img" aria-label="hot">🔥</span>}
          label={t("hot", lang)}
        />
        <ToggleBtn
          checked={filterVideo}
          onChange={e => setFilterVideo(e.target.checked)}
          icon={<span role="img" aria-label="video">🎥</span>}
          label={t("video", lang)}
        />
        <Link to="/admin/add" className="admin-add-btn" style={{marginLeft:16}}>➕ {t("add_product", lang)}</Link>
      </div>
      <div
        className="admin-grid"
        style={{
          gridTemplateColumns: `repeat(${grid.cols}, minmax(0, 1fr))`,
        }}
      >
        {paged.map((p, idx) => (
          <div key={p.id} className="admin-card" onClick={() => handleCardClick(p.id)}>
            <span className="admin-card-number">{(page - 1) * ITEMS_PER_PAGE + idx + 1}</span>
            <img
              src={(p.thumbnail || (p.images && p.images[0]) || "")}
              alt={t("product_alt", lang) + ` ${p.id}`}
              onContextMenu={e => e.preventDefault()}
              draggable={false}
              className="admin-img admin-img-vertical"
            />
            <span className="admin-id-center">{p.id}</span>
            <div className="admin-card-icons">
              {p.has_video && <span className="admin-card-icon"> 🎥 </span>}
              {p.is_hot && <span className="admin-card-icon admin-card-icon-hot"> 🔥 </span>}
            </div>
          </div>
        ))}
      </div>
      <div className="admin-pagination">
        <button
          className="admin-pagination-btn tg-arrow"
          onClick={() => navigate(`?page=${Math.max(1, page - 1)}`)}
          disabled={page === 1}
        >
          <svg width="32" height="32" viewBox="0 0 32 32"><path d="M20 8l-8 8 8 8" stroke="#786ac8" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <span className="admin-pagination-info">{page} / {totalPages}</span>
        <button
          className="admin-pagination-btn tg-arrow"
          onClick={() => navigate(`?page=${Math.min(totalPages, page + 1)}`)}
          disabled={page === totalPages}
        >
          <svg width="32" height="32" viewBox="0 0 32 32"><path d="M12 8l8 8-8 8" stroke="#786ac8" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>
    </div>
  );
};

export default AdminPanel;