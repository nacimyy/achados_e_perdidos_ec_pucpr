import {
  ArrowDownUp,
  Box,
  CheckCircle2,
  Clock3,
  Gift,
  Plus,
  Search,
  SlidersHorizontal
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import EmptyState from "../components/EmptyState.jsx";
import FilterPanel from "../components/FilterPanel.jsx";
import ItemCard from "../components/ItemCard.jsx";
import { defaultFilters } from "../constants.js";

function HomePage({ user }) {
  const [filters, setFilters] = useState(defaultFilters);
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({ total: 0, available: 0, claimed: 0, expired: 0, donated: 0 });
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "all") query.set(key, value);
      });
      if (!user) query.set("status", "available");
      const data = await api(`/api/items?${query.toString()}`);
      setItems(data.items);
    } finally {
      setLoading(false);
    }
  }, [filters, user]);

  useEffect(() => {
    const timer = window.setTimeout(loadItems, 180);
    return () => window.clearTimeout(timer);
  }, [loadItems]);

  useEffect(() => {
    api("/api/stats").then(setStats).catch(() => {});
  }, [items]);

  function update(field, value) {
    setFilters((current) => ({ ...current, [field]: value }));
  }

  return (
    <>
      <section className={`hero ${user ? "hero-admin" : ""}`}>
        <div className="container hero-content">
          <div className="hero-copy">
            <span className="eyebrow">{user ? "Painel administrativo" : "Portal do campus Curitiba"}</span>
            <h1>{user ? "Gestão de itens encontrados" : "Perdeu alguma coisa por aqui?"}</h1>
            <p>
              {user
                ? "Acompanhe os itens sob responsabilidade da equipe, registre retiradas e mantenha o catálogo atualizado."
                : "Consulte os objetos encontrados no campus e veja onde fazer a retirada com segurança."}
            </p>
          </div>

          {!user && (
            <div className="hero-note">
              <CheckCircle2 />
              <span>
                <strong>Encontrou o seu item?</strong>
                Leve um documento com foto ao local indicado.
              </span>
            </div>
          )}
        </div>
      </section>

      {user && (
        <section className="stats-strip container" aria-label="Resumo dos itens">
          <article><span className="stat-icon"><Box /></span><div><strong>{stats.total}</strong><small>Itens cadastrados</small></div></article>
          <article><span className="stat-icon available"><CheckCircle2 /></span><div><strong>{stats.available}</strong><small>Disponíveis</small></div></article>
          <article><span className="stat-icon claimed"><CheckCircle2 /></span><div><strong>{stats.claimed}</strong><small>Resgatados</small></div></article>
          <article><span className="stat-icon expired"><Clock3 /></span><div><strong>{stats.expired}</strong><small>Expirados</small></div></article>
          <article><span className="stat-icon donated"><Gift /></span><div><strong>{stats.donated}</strong><small>Doados</small></div></article>
        </section>
      )}

      <section className="catalog-section container">
        <div className="catalog-heading">
          <div>
            <span className="eyebrow">{user ? "Inventário" : "Objetos encontrados"}</span>
            <h2>{user ? "Todos os itens" : "Itens disponíveis"}</h2>
          </div>
          {user && (
            <Link className="button button-primary desktop-create" to="/admin/items/new">
              <Plus size={18} />
              Cadastrar item
            </Link>
          )}
        </div>

        <div className="search-toolbar">
          <label className="search-box">
            <Search />
            <input
              type="search"
              placeholder="Busque por nome, categoria ou local..."
              value={filters.q}
              onChange={(event) => update("q", event.target.value)}
            />
          </label>
          <button className="button button-filter" type="button" onClick={() => setFiltersOpen(true)}>
            <SlidersHorizontal size={19} />
            Filtros
            {(filters.category !== "all" || filters.location !== "all" || filters.status !== "all" || filters.dateFrom || filters.dateTo) && <span className="filter-dot" />}
          </button>
          <label className="sort-control">
            <ArrowDownUp size={18} />
            <select value={filters.sort} onChange={(event) => update("sort", event.target.value)} aria-label="Ordenar itens">
              <option value="newest">Mais recentes</option>
              <option value="oldest">Mais antigos</option>
              <option value="name">Nome A–Z</option>
            </select>
          </label>
        </div>

        <div className="results-meta">
          <span>{loading ? "Buscando itens..." : `${items.length} ${items.length === 1 ? "item encontrado" : "itens encontrados"}`}</span>
          {!user && <span className="results-help">O catálogo exibe somente itens disponíveis para retirada.</span>}
        </div>

        {loading ? (
          <div className="items-grid" aria-label="Carregando">
            {Array.from({ length: 8 }).map((_, index) => <div className="item-skeleton" key={index} />)}
          </div>
        ) : items.length ? (
          <div className="items-grid">
            {items.map((item) => <ItemCard item={item} key={item.id} showStatus={Boolean(user)} />)}
          </div>
        ) : (
          <EmptyState onClear={() => setFilters(defaultFilters)} />
        )}
      </section>

      <FilterPanel
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={filters}
        setFilters={setFilters}
        staff={Boolean(user)}
      />
    </>
  );
}

export default HomePage;
