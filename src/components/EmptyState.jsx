import { SearchX } from "lucide-react";

function EmptyState({ onClear }) {
  return (
    <div className="empty-state">
      <span><SearchX /></span>
      <h3>Nenhum item por aqui</h3>
      <p>Tente buscar por outro termo ou remova alguns filtros.</p>
      <button className="button button-secondary" type="button" onClick={onClear}>Limpar filtros</button>
    </div>
  );
}

export default EmptyState;
