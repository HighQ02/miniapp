import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import t from '../i18n';

const Header = ({ isAdmin, lang }) => {
  const location = useLocation();

  return (
    <header>
      <div>
        <Link to="/">{t("products", lang)}</Link>
      </div>

      <nav>
        <Link to="/faq" style={isActive(location.pathname, "/faq")}>{t("faq", lang)}</Link>
        {isAdmin && (
            <Link to="/admin" style={isActive(location.pathname, "/admin")}>{t("admin_panel", lang)}</Link>
        )}
      </nav>
    </header>
  );
}

function isActive(currentPath, targetPath) {
  const isCurrent = currentPath === targetPath;
  return {
    color: isCurrent ? "rgb(118,106,200)" : "#fff",
    textDecoration: "none",
    fontWeight: isCurrent ? "bold" : "normal",
  };
}

export default Header;