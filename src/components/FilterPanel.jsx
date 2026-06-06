import { RotateCcw, SlidersHorizontal, X } from "lucide-react";
import { categories, defaultFilters, locations, statusLabels } from "../constants.js";

function FilterPanel({ open, onClose, filters, setFilters, staff }) {
  function update(field, value) {
    setFilters((current) => ({ ...current, [field]: value }));
  }

  return (
    <>
      {open && <button className="filter-overlay" type="button" onClick={onClose} aria-label="Fechar filtros" />}
      <aside className={`filter-panel ${open ? "is-open" : ""}`} aria-label="Filtros do catálogo">
        <div className="filter-panel-header">
          <span><SlidersHorizontal size={20} /> Filtros</span>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Fechar filtros"><X /></button>
        </div>

        {staff && (
          <fieldset className="filter-group">
            <legend>Status</legend>
            <div className="status-filter-grid">
              <button
                type="button"
                className={filters.status === "all" ? "selected" : ""}
                onClick={() => update("status", "all")}
              >
                Todos
              </button>
              {Object.entries(statusLabels).map(([value, label]) => (
                <button
                  type="button"
                  key={value}
                  className={filters.status === value ? "selected" : ""}
                  onClick={() => update("status", value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        <label className="field">
          <span>Categoria</span>
          <select value={filters.category} onChange={(event) => update("category", event.target.value)}>
            <option value="all">Todas as categorias</option>
            {categories.map((category) => <option key={category}>{category}</option>)}
          </select>
        </label>

        <label className="field">
          <span>Localização</span>
          <select value={filters.location} onChange={(event) => update("location", event.target.value)}>
            <option value="all">Todos os locais</option>
            {locations.map((location) => <option key={location}>{location}</option>)}
          </select>
        </label>

        <div className="filter-group">
          <span className="field-label">Data em que foi encontrado</span>
          <div className="date-range">
            <label>
              <span>De</span>
              <input type="date" value={filters.dateFrom} onChange={(event) => update("dateFrom", event.target.value)} />
            </label>
            <label>
              <span>Até</span>
              <input type="date" value={filters.dateTo} onChange={(event) => update("dateTo", event.target.value)} />
            </label>
          </div>
        </div>

        <div className="filter-actions">
          <button className="button button-secondary" type="button" onClick={() => setFilters(defaultFilters)}>
            <RotateCcw size={17} />
            Limpar
          </button>
          <button className="button button-primary" type="button" onClick={onClose}>Ver resultados</button>
        </div>
      </aside>
    </>
  );
}

export default FilterPanel;
