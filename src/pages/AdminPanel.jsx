import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Admin.css";

const API_URL = "https://192.168.0.105:8000";

const AdminPanel = () => {
  const [products, setProducts] = useState([]);
  const [searchId, setSearchId] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/products`)
      .then(res => res.json())
      .then(setProducts);
  }, []);

  const filtered = searchId
    ? products.filter(p => p.id.toString().includes(searchId))
    : products;

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
      <Link to="/admin/add" className="admin-add-btn">➕ Добавить товар</Link>
      <div className="admin-grid">
        {filtered.map(p => (
          <Link to={`/admin/${p.id}`} key={p.id} className="admin-card">
            <div className="admin-img-wrap">
              <img
                src={API_URL + (p.thumbnail || (p.images && p.images[0]) || "")}
                alt={`Product ${p.id}`}
                className="admin-img"
              />
              <span className="admin-id-center">{p.id}</span>
              <div className="admin-icons">
                {p.is_hot && <span className="icon-hot">🔥</span>}
                {p.has_video && <span className="icon-video">📸</span>}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AdminPanel;