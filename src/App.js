import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import useTelegramUser from './hooks/useTelegramUser';

import Header from './components/Header';
import Footer from './components/Footer';
import NoSubscription from './components/NoSubscription';
import FAQ from './pages/FAQ';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import AdminPanel from './pages/AdminPanel';
import AddProduct from './pages/AddProduct';
import AdminEditor from './pages/AdminEditor';

import t from './i18n';

import './App.css';

const App = () => {
  const { user, hasSubscription, loading, isAdmin, lang } = useTelegramUser();

  if (loading) return <p>{t("loading", lang)}</p>;
  if (!user) return <p>{t("not_logged_in", lang)}</p>;
  if (!hasSubscription) return <NoSubscription />;

  return (
    <Router>
      <Header isAdmin={isAdmin} lang={lang} />
      <Routes>
        <Route path="/faq" element={<FAQ lang={lang} />} />
        <Route path="/" element={<Products lang={lang} />} />
        <Route path="/products/:id" element={<ProductDetails isAdmin={isAdmin} lang={lang} />} />
        {isAdmin && <Route path="/admin" element={<AdminPanel lang={lang} />} />}
        {isAdmin && <Route path="/admin/add" element={<AddProduct lang={lang} />} />}
        {isAdmin && <Route path="/admin/:id" element={<AdminEditor lang={lang} />} />}
      </Routes>
      <Footer lang={lang} />
    </Router>
  );
}

export default App;