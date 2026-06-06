import { ArrowLeft, CalendarDays, ImagePlus, Info, Save, Trash2, Upload } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api.js";
import { categories, locations } from "../constants.js";

const initialForm = {
  name: "",
  category: "",
  description: "",
  location: "Bloco 10",
  foundDate: new Date().toISOString().slice(0, 10),
  registeredBy: ""
};

function ItemFormPage({ user, notify }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);
  const [form, setForm] = useState({ ...initialForm, registeredBy: user.name });
  const [existingImages, setExistingImages] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!editing) return;
    api(`/api/items/${id}`)
      .then((item) => {
        setForm({
          name: item.name,
          category: item.category,
          description: item.description,
          location: item.location,
          foundDate: item.found_date,
          registeredBy: item.registered_by
        });
        setExistingImages(item.images);
      })
      .catch(() => navigate("/", { replace: true }))
      .finally(() => setLoading(false));
  }, [editing, id, navigate]);

  const previews = useMemo(
    () => files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [files]
  );

  useEffect(() => () => previews.forEach((preview) => URL.revokeObjectURL(preview.url)), [previews]);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleFiles(event) {
    const selected = Array.from(event.target.files || []);
    const remaining = Math.max(0, 5 - existingImages.length - files.length);
    setFiles((current) => [...current, ...selected.slice(0, remaining)]);
    event.target.value = "";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (existingImages.length + files.length === 0) {
      setError("Adicione ao menos uma foto do item.");
      return;
    }

    setSaving(true);
    setError("");
    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => payload.append(key, value));
    payload.append("existingImages", JSON.stringify(existingImages));
    files.forEach((file) => payload.append("images", file));

    try {
      const item = await api(editing ? `/api/items/${id}` : "/api/items", {
        method: editing ? "PUT" : "POST",
        body: payload
      });
      notify({ type: "success", message: editing ? "Item atualizado com sucesso." : "Item cadastrado com sucesso." });
      navigate(`/item/${item.id}`);
    } catch (requestError) {
      setError(requestError.message);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="page-loader"><span /></div>;

  return (
    <div className="form-page">
      <div className="container form-page-header">
        <button className="back-link" type="button" onClick={() => navigate(-1)}>
          <ArrowLeft size={19} />
          Voltar
        </button>
        <div>
          <span className="eyebrow">Área administrativa</span>
          <h1>{editing ? "Editar item" : "Cadastrar novo item"}</h1>
          <p>{editing ? "Atualize as informações públicas do objeto." : "Registre o objeto encontrado para disponibilizá-lo no catálogo."}</p>
        </div>
      </div>

      <form className="item-form container" onSubmit={handleSubmit}>
        {error && <div className="form-alert"><Info /><span>{error}</span></div>}

        <section className="form-card photo-section">
          <div className="section-heading">
            <span className="section-number">1</span>
            <div><h2>Fotos do item</h2><p>Inclua até 5 imagens claras, sem expor dados pessoais.</p></div>
          </div>

          <div className="photo-grid">
            {existingImages.map((image) => (
              <div className="photo-preview" key={image}>
                <img src={image} alt="Foto atual do item" />
                <button type="button" onClick={() => setExistingImages((current) => current.filter((value) => value !== image))} aria-label="Remover foto">
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
            {previews.map((preview, index) => (
              <div className="photo-preview" key={preview.url}>
                <img src={preview.url} alt={`Nova foto ${index + 1}`} />
                <button type="button" onClick={() => setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))} aria-label="Remover foto">
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
            {existingImages.length + files.length < 5 && (
              <label className="photo-upload">
                <ImagePlus />
                <strong>Adicionar fotos</strong>
                <span>PNG, JPG ou WEBP, até 5 MB</span>
                <input type="file" accept="image/*" multiple onChange={handleFiles} />
              </label>
            )}
          </div>
        </section>

        <section className="form-card">
          <div className="section-heading">
            <span className="section-number">2</span>
            <div><h2>Informações do item</h2><p>Use uma descrição objetiva para facilitar a identificação.</p></div>
          </div>
          <div className="form-grid">
            <label className="field field-wide">
              <span>Nome do item *</span>
              <input value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Ex.: Copo térmico branco" required />
            </label>
            <label className="field">
              <span>Categoria *</span>
              <select value={form.category} onChange={(event) => update("category", event.target.value)} required>
                <option value="">Selecione uma categoria</option>
                {categories.map((category) => <option key={category}>{category}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Localização *</span>
              <select value={form.location} onChange={(event) => update("location", event.target.value)} required>
                {locations.map((location) => <option key={location}>{location}</option>)}
              </select>
            </label>
            <label className="field field-wide">
              <span>Descrição *</span>
              <textarea
                value={form.description}
                onChange={(event) => update("description", event.target.value)}
                placeholder="Cor, marca, estado de conservação e informações úteis para a retirada..."
                rows="5"
                required
              />
              <small>{form.description.length}/500 caracteres</small>
            </label>
          </div>
        </section>

        <section className="form-card">
          <div className="section-heading">
            <span className="section-number">3</span>
            <div><h2>Dados de controle</h2><p>Estas informações ajudam a equipe a manter a rastreabilidade.</p></div>
          </div>
          <div className="form-grid">
            <label className="field">
              <span>Data em que foi encontrado *</span>
              <span className="input-with-icon trailing">
                <input type="date" value={form.foundDate} onChange={(event) => update("foundDate", event.target.value)} required />
                <CalendarDays size={19} />
              </span>
            </label>
            <label className="field">
              <span>Responsável pelo registro *</span>
              <input value={form.registeredBy} onChange={(event) => update("registeredBy", event.target.value)} required />
            </label>
          </div>
        </section>

        <div className="form-footer">
          <button className="button button-secondary" type="button" onClick={() => navigate(-1)}>Cancelar</button>
          <button className="button button-primary" type="submit" disabled={saving}>
            {saving ? <Upload className="spin" size={18} /> : <Save size={18} />}
            {saving ? "Salvando..." : editing ? "Salvar alterações" : "Cadastrar item"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ItemFormPage;
