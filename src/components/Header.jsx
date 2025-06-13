import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Header = ({ isAdmin }) => {
  const location = useLocation();

  return (
    <header>
      <div>
        <Link to="/">Товары</Link>
      </div>

      <nav>
        <Link to="/faq" style={isActive(location.pathname, "/faq")}>FAQ</Link>
        {isAdmin && (
            <Link to="/admin" style={isActive(location.pathname, "/admin")}>Админ панель</Link>
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