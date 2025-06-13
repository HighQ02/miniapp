import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Admin.css";

const API_URL = "https://check-bot.top/api";
const ITEMS_PER_PAGE = 2;

const AdminPanel = () => {
  const [products, setProducts] = useState([]);
  const [searchId, setSearchId] = useState("");
  const [filterHot, setFilterHot] = useState(false);
  const [filterVideo, setFilterVideo] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  // Получаем текущую страницу из query-параметра
  const params = new URLSearchParams(location.search);
  const page = parseInt(params.get("page") || "1", 10);

  useEffect(() => {
    fetch(`${API_URL}/`)
      .then(res => res.json())
      .then(setProducts);
  }, []);

  // Фильтрация
  let filtered = products;
  if (searchId) filtered = filtered.filter(p => p.id.toString().includes(searchId));
  if (filterHot) filtered = filtered.filter(p => p.is_hot);
  if (filterVideo) filtered = filtered.filter(p => p.has_video);

  // Пагинация
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paged = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // Для возврата на нужную страницу
  const handleCardClick = (id) => {
    navigate(`/admin/${id}`, { state: { fromPage: page } });
  };

  return (
    <div className="admin-container">
      <h2>Админ-панель</h2>
      <input
        type="text"
        placeholder="Поиск по ID"
        value={searchId}
        onChange={e => setSearchId(e.target.value)}
        className="admin-search"
      />
      <div style={{display: "flex", gap: 12, marginBottom: 18}}>
        <label>
          <input type="checkbox" checked={filterHot} onChange={e => setFilterHot(e.target.checked)} /> 🔥
        </label>
        <label>
          <input type="checkbox" checked={filterVideo} onChange={e => setFilterVideo(e.target.checked)} /> 🎥
        </label>
      </div>
      <Link to="/admin/add" className="admin-add-btn">➕ Добавить товар</Link>
      <div className="admin-grid">
        {paged.map(p => (
          <div key={p.id} className="admin-card" onClick={() => handleCardClick(p.id)} style={{cursor: "pointer"}}>
            <div className="admin-img-wrap">
              <img
                src={API_URL + (p.thumbnail || (p.images && p.images[0]) || "")}
                alt={`Product ${p.id}`}
                className="admin-img"
              />
              <span className="admin-id-center">{p.id}</span>
              <div className="admin-icons">
                {p.is_hot && <span className="icon-hot">🔥</span>}
                {p.has_video && <span className="icon-video">🎥</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Пагинация */}
      <div style={{display: "flex", justifyContent: "center", gap: 12, margin: "24px 0"}}>
        <button
          className="admin-editor-save-btn"
          onClick={() => navigate(`?page=${Math.max(1, page - 1)}`)}
          disabled={page === 1}
        >←</button>
        <span style={{alignSelf: "center"}}>{page} / {totalPages}</span>
        <button
          className="admin-editor-save-btn"
          onClick={() => navigate(`?page=${Math.min(totalPages, page + 1)}`)}
          disabled={page === totalPages}
        >→</button>
      </div>
    </div>
  );
};

export default AdminPanel;