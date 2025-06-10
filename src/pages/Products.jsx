import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch('https://192.168.0.105:8000/products');
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

  if (loading) return <div>Загрузка товаров...</div>;
  if (products.length === 0) return <div>Товары не найдены</div>;

  return (
    <div className="products-grid">
      {products.map(p => (
        <Link key={p.id} to={`/products/${p.id}`} className="product-card">
          <img src={`https://192.168.0.105:8000${p.thumbnail}`} alt={`Товар ${p.id}`} />
          <div className="icons">
            {p.has_video && <span title="Есть видео" role="img" aria-label="video">🎥</span>}
            {p.is_hot && <span title="Горячее предложение" role="img" aria-label="hot">🔥</span>}
          </div>
        </Link>
      ))}
    </div>
  );
};

export default Products;
