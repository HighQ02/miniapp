import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Pagination from "../components/Pagination";
import t from '../i18n';

const API_URL = "https://check-bot.top/api";

const getGridSettings = () => {
  const width = window.innerWidth;
  if (width < 700) return { cols: 2, max: 40 };
  if (width < 1100) return { cols: 3, max: 60 };
  return { cols: 4, max: 80 };
};

const Products = ({ lang }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterHot, setFilterHot] = useState(false);
  const [filterVideo, setFilterVideo] = useState(false);
  const [searchId, setSearchId] = useState("");
  const [grid, setGrid] = useState(getGridSettings());

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
        console.error('Error loading products', error);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
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

  const ITEMS_PER_PAGE = grid.cols * 20;
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paged = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleCardClick = (id) => {
    navigate(`/products/${id}`, { state: { fromPage: page } });
  };

  // Telegram-style toggle button
  const ToggleBtn = ({ checked, onChange, icon, label }) => (
    <label className="tg-toggle">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="tg-toggle-slider">{icon}</span>
      <span className="tg-toggle-label">{label}</span>
    </label>
  );

  if (loading) return <div className="products-loading">{t("products_loading", lang)}</div>;

  return (
    <div className="products-root">
      <div className="products-filters">
        <input
          className="products-search"
          type="text"
          placeholder={t("search_by_id", lang)}
          value={searchId}
          onChange={e => setSearchId(e.target.value)}
        />
        <ToggleBtn
          checked={filterHot}
          onChange={e => setFilterHot(e.target.checked)}
          icon={<span role="img" aria-label="skype"><i className="fa-brands fa-skype" style={{color: "#00aff0"}}></i></span>}
        />
        <ToggleBtn
          checked={filterVideo}
          onChange={e => setFilterVideo(e.target.checked)}
          icon={<span role="img" aria-label="video"><i className="fa-solid fa-video" style={{color: "#b6aaff"}}></i></span>}
        />
      </div>
      {filtered.length === 0 ? (
        <div className="products-empty">{t("products_not_found", lang)}</div>
      ) : (
        <>
          <div
            className="products-grid"
            style={{
              gridTemplateColumns: `repeat(${grid.cols}, minmax(0, 1fr))`,
            }}
          >
            {paged.map((p, idx) => (
              <div key={p.id} className="product-card product-card-vertical" onClick={() => handleCardClick(p.id)}>
                <span className="product-card-number">{p.id}</span>
                <img
                  src={p.thumbnail?.url || p.thumbnail}
                  alt={t("product_alt", lang) + ` ${p.id}`}
                  draggable={false}
                  onContextMenu={e => e.preventDefault()}
                  onTouchStart={e => e.preventDefault()}
                  onError={() => refetchProductOrImage()}
                  className="product-img product-img-vertical"
                />
                <div className="product-card-icons">
                  {p.has_video && <span className="product-card-icon, product-card-icon-video"> <i className="fa-solid fa-video" style={{color: "#b6aaff"}}></i> </span>}
                  {p.is_hot && <span className="product-card-icon"> <i className="fa-brands fa-skype" style={{color: "#00aff0"}}></i> </span>}
                </div>
              </div>
            ))}
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={p => navigate(`?page=${p}`)}
          />
        </>
      )}
    </div>
  );
};

export default Products;