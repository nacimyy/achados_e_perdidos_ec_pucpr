import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit3,
  Gift,
  MapPin,
  ShieldCheck,
  Tag,
  UserRound
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api.js";
import Modal from "../components/Modal.jsx";
import { formatDate, statusLabels } from "../constants.js";

function ItemPage({ user, notify }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [claimOpen, setClaimOpen] = useState(false);
  const [donationOpen, setDonationOpen] = useState(false);
  const [form, setForm] = useState({ name: "", document: "", institution: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadItem = useCallback(async () => {
    try {
      setItem(await api(`/api/items/${id}`));
    } catch {
      navigate("/", { replace: true });
    }
  }, [id, navigate]);

  useEffect(() => {
    loadItem();
  }, [loadItem]);

  async function handleClaim(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const updated = await api(`/api/items/${id}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, document: form.document })
      });
      setItem(updated);
      setClaimOpen(false);
      notify({ type: "success", message: "Retirada registrada com sucesso." });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDonation(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const updated = await api(`/api/items/${id}/donate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ institution: form.institution })
      });
      setItem(updated);
      setDonationOpen(false);
      notify({ type: "success", message: "Doação registrada com sucesso." });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleExpire() {
    if (!window.confirm("Marcar este item como expirado?")) return;
    try {
      setItem(await api(`/api/items/${id}/expire`, { method: "POST" }));
      notify({ type: "success", message: "Item marcado como expirado." });
    } catch (requestError) {
      notify({ type: "error", message: requestError.message });
    }
  }

  if (!item) {
    return <div className="page-loader"><span /></div>;
  }

  return (
    <div className="detail-page container">
      <div className="detail-topbar">
        <button className="back-link" type="button" onClick={() => navigate(-1)}>
          <ArrowLeft size={19} />
          Voltar ao catálogo
        </button>
        {user && (
          <Link className="button button-secondary" to={`/admin/items/${item.id}/edit`}>
            <Edit3 size={17} />
            Editar item
          </Link>
        )}
      </div>

      <div className="detail-layout">
        <section className="gallery" aria-label="Fotos do item">
          <div className="gallery-main">
            <img src={item.images[activeImage]} alt={`${item.name} - foto ${activeImage + 1}`} />
            <span className={`status-badge status-${item.status}`}>{statusLabels[item.status]}</span>
          </div>
          {item.images.length > 1 && (
            <div className="gallery-thumbnails">
              {item.images.map((image, index) => (
                <button
                  className={activeImage === index ? "active" : ""}
                  type="button"
                  key={`${image}-${index}`}
                  onClick={() => setActiveImage(index)}
                >
                  <img src={image} alt="" />
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="item-detail">
          <span className="eyebrow">{item.category}</span>
          <h1>{item.name}</h1>
          <div className="detail-meta">
            <p><CalendarDays /><span><small>Encontrado em</small><strong>{formatDate(item.found_date)}</strong></span></p>
            <p><MapPin /><span><small>Local de retirada</small><strong>{item.location}</strong></span></p>
            <p><Clock3 /><span><small>Horário de atendimento</small><strong>Segunda a sexta, das 8h às 19h</strong></span></p>
          </div>

          <div className="detail-description">
            <h2>Sobre o item</h2>
            <p>{item.description}</p>
          </div>

          <div className="security-note">
            <ShieldCheck />
            <div>
              <strong>Retirada com identificação</strong>
              <p>Apresente um documento com foto e confirme características do objeto no atendimento.</p>
            </div>
          </div>

          {user && item.status === "available" && (
            <div className="admin-actions">
              <button className="button button-primary" type="button" onClick={() => { setError(""); setClaimOpen(true); }}>
                <CheckCircle2 size={18} />
                Registrar resgate
              </button>
              <button className="button button-secondary" type="button" onClick={handleExpire}>
                <Clock3 size={18} />
                Marcar como expirado
              </button>
            </div>
          )}
          {user && item.status === "expired" && (
            <div className="admin-actions">
              <button className="button button-primary" type="button" onClick={() => { setError(""); setDonationOpen(true); }}>
                <Gift size={18} />
                Registrar doação
              </button>
            </div>
          )}
        </section>
      </div>

      {item.status === "claimed" && (
        <section className="status-receipt receipt-claimed">
          <header><CheckCircle2 /><div><span>Item resgatado</span><small>Retirada concluída</small></div></header>
          <div className="receipt-grid">
            <p><UserRound /><span><small>Retirado por</small><strong>{item.claim_name}</strong></span></p>
            <p><Tag /><span><small>Documento</small><strong>{item.claim_document}</strong></span></p>
            <p><CalendarDays /><span><small>Data e hora</small><strong>{formatDate(item.claimed_at, true)}</strong></span></p>
          </div>
        </section>
      )}

      {item.status === "donated" && (
        <section className="status-receipt receipt-donated">
          <header><Gift /><div><span>Item doado</span><small>Destinação social concluída</small></div></header>
          <div className="receipt-grid">
            <p><ShieldCheck /><span><small>Instituição</small><strong>{item.donation_institution}</strong></span></p>
            <p><CalendarDays /><span><small>Doado em</small><strong>{formatDate(item.donated_at, true)}</strong></span></p>
          </div>
        </section>
      )}

      <Modal open={claimOpen} onClose={() => setClaimOpen(false)} eyebrow="Controle de retirada" title="Registrar resgate">
        <p className="modal-intro">Confirme a identidade da pessoa antes de concluir a entrega.</p>
        <form className="stack-form" onSubmit={handleClaim}>
          <label className="field">
            <span>Nome completo</span>
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          </label>
          <label className="field">
            <span>CPF ou documento</span>
            <input value={form.document} onChange={(event) => setForm({ ...form, document: event.target.value })} required />
          </label>
          {error && <p className="form-error">{error}</p>}
          <div className="modal-actions">
            <button className="button button-secondary" type="button" onClick={() => setClaimOpen(false)}>Cancelar</button>
            <button className="button button-primary" type="submit" disabled={saving}>{saving ? "Salvando..." : "Confirmar retirada"}</button>
          </div>
        </form>
      </Modal>

      <Modal open={donationOpen} onClose={() => setDonationOpen(false)} eyebrow="Destinação do item" title="Registrar doação">
        <p className="modal-intro">Informe a instituição que recebeu o objeto.</p>
        <form className="stack-form" onSubmit={handleDonation}>
          <label className="field">
            <span>Instituição beneficiada</span>
            <input
              value={form.institution}
              onChange={(event) => setForm({ ...form, institution: event.target.value })}
              placeholder="Ex.: Complexo de Saúde Pequeno Cotolengo"
              required
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <div className="modal-actions">
            <button className="button button-secondary" type="button" onClick={() => setDonationOpen(false)}>Cancelar</button>
            <button className="button button-primary" type="submit" disabled={saving}>{saving ? "Salvando..." : "Confirmar doação"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default ItemPage;
