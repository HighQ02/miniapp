import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import useTelegramUser from './hooks/useTelegramUser';

import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import AdminPanel from './pages/AdminPanel';
import AddProduct from './pages/AddProduct';
import AdminEditor from './pages/AdminEditor';

import './App.css';

const App = () => {
  const { user, hasSubscription, loading, isAdmin } = useTelegramUser();

  if (loading) return <p>Загрузка...</p>;
  if (!user) return <p>❌ Вы не зашли через Telegram</p>;
  if (!hasSubscription) return <p>❌ У вас нет подписки</p>;

  return (
    <Router>
      <Header isAdmin={isAdmin} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetails isAdmin={isAdmin} />} />
        {isAdmin && <Route path="/admin" element={<AdminPanel />} />}
        {isAdmin && <Route path="/admin/add" element={<AddProduct />} />}
        {isAdmin && <Route path="/admin/:id" element={<AdminEditor />} />}
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;
