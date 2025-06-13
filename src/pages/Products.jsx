import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './App.css';

const API_URL = "https://check-bot.top/api";
const ITEMS_PER_PAGE = 2;

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterHot, setFilterHot] = useState(false);
  const [filterVideo, setFilterVideo] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(location.search);
  const page = parseInt(params.get("page") || "1", 10);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch(API_URL + '/');
        const data = await res.json();
        setProducts(data || []);
      } catch (error) {
        console.error('Ошибка при загрузке товаров', error);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  let filtered = products;
  if (filterHot) filtered = filtered.filter(p => p.is_hot);
  if (filterVideo) filtered = filtered.filter(p => p.has_video);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paged = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleCardClick = (id) => {
    navigate(`/products/${id}`, { state: { fromPage: page } });
  };

  if (loading) return <div className="products-loading">Загрузка товаров...</div>;
  if (filtered.length === 0) return <div className="products-empty">Товары не найдены</div>;

  return (
    <div>
      <div className="products-filters">
        <label>
          <input type="checkbox" checked={filterHot} onChange={e => setFilterHot(e.target.checked)} /> 🔥
        </label>
        <label>
          <input type="checkbox" checked={filterVideo} onChange={e => setFilterVideo(e.target.checked)} /> 🎥
        </label>
      </div>
      <div className="products-grid">
        {paged.map((p, idx) => (
          <div key={p.id} className="product-card" onClick={() => handleCardClick(p.id)}>
            <span className="product-card-number">{(page - 1) * ITEMS_PER_PAGE + idx + 1}</span>
            <img src={API_URL + p.thumbnail} alt={`Товар ${p.id}`} className="product-img" />
            <div className="product-card-icons">
              {p.has_video && <span className="product-card-icon">💧</span>}
              {p.is_hot && <span className="product-card-icon product-card-icon-hot">💧⭐</span>}
            </div>
          </div>
        ))}
      </div>
      <div className="products-pagination">
        <button
          className="products-pagination-btn"
          onClick={() => navigate(`?page=${Math.max(1, page - 1)}`)}
          disabled={page === 1}
        >←</button>
        <span className="products-pagination-info">{page} / {totalPages}</span>
        <button
          className="products-pagination-btn"
          onClick={() => navigate(`?page=${Math.min(totalPages, page + 1)}`)}
          disabled={page === totalPages}
        >→</button>
      </div>
    </div>
  );
};

export default Products;