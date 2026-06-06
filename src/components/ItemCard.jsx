import { ArrowUpRight, CalendarDays, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDate, statusLabels } from "../constants.js";

function ItemCard({ item, showStatus }) {
  return (
    <Link className="item-card" to={`/item/${item.id}`}>
      <div className="item-card-image">
        <img src={item.images[0]} alt={item.name} loading="lazy" />
        {showStatus && (
          <span className={`status-badge status-${item.status}`}>
            {statusLabels[item.status]}
          </span>
        )}
        <span className="card-open"><ArrowUpRight size={19} /></span>
      </div>
      <div className="item-card-content">
        <span className="item-category">{item.category}</span>
        <h3>{item.name}</h3>
        <p><MapPin size={16} /> {item.location}</p>
        <p><CalendarDays size={16} /> Encontrado em {formatDate(item.found_date)}</p>
      </div>
    </Link>
  );
}

export default ItemCard;
