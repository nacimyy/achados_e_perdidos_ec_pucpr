import { LogIn, LogOut, Menu, Plus, UserRound, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

function Header({ user, onLogin, onLogout }) {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className="site-header">
      <div className="header-accent" />
      <div className="header-inner container">
        <Link className="brand" to="/" onClick={closeMenu} aria-label="Ir para o início">
          <img src="/images/brand/pucpr-header.png" alt="PUCPR Grupo Marista" />
          <span className="brand-divider" />
          <span className="brand-product">
            <strong>Achados</strong>
            <span>e Perdidos</span>
          </span>
        </Link>

        <button
          className="mobile-menu-button"
          type="button"
          onClick={() => setMenuOpen((value) => !value)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
        >
          {menuOpen ? <X /> : <Menu />}
        </button>

        <nav className={`header-nav ${menuOpen ? "is-open" : ""}`} aria-label="Navegação principal">
          <Link className={location.pathname === "/" ? "active" : ""} to="/" onClick={closeMenu}>
            Catálogo
          </Link>
          {user ? (
            <>
              <Link className="nav-primary" to="/admin/items/new" onClick={closeMenu}>
                <Plus size={18} />
                Cadastrar item
              </Link>
              <div className="user-summary">
                <span className="user-avatar"><UserRound size={19} /></span>
                <span>
                  <strong>{user.name}</strong>
                  <small>{user.location}</small>
                </span>
              </div>
              <button className="nav-ghost" type="button" onClick={() => { closeMenu(); onLogout(); }}>
                <LogOut size={18} />
                Sair
              </button>
            </>
          ) : (
            <button className="nav-login" type="button" onClick={() => { closeMenu(); onLogin(); }}>
              <LogIn size={18} />
              Área do funcionário
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;
