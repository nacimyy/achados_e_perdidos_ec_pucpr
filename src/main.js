import "./styles.css";

const app = document.querySelector("#app");

const categories = [
  "Acessórios",
  "Documentos",
  "Eletrônicos",
  "Garrafas e copos",
  "Livros",
  "Material escolar",
  "Roupas",
  "Outros"
];

const locations = [
  "Bloco 1",
  "Bloco 2",
  "Bloco 3",
  "Bloco 4",
  "Bloco 5",
  "Bloco 6",
  "Bloco 8",
  "Bloco 9",
  "Bloco 10",
  "Biblioteca",
  "Ginásio"
];

const statusLabels = {
  available: "Disponível",
  claimed: "Resgatado",
  expired: "Expirado",
  donated: "Doado"
};

const defaultFilters = {
  q: "",
  status: "all",
  category: "all",
  location: "all",
  sort: "newest",
  dateFrom: "",
  dateTo: ""
};

const state = {
  user: readUser(),
  filters: { ...defaultFilters },
  items: [],
  stats: { total: 0, available: 0, claimed: 0, expired: 0, donated: 0 },
  loading: false,
  route: readRoute(),
  activeImage: 0,
  item: null,
  formFiles: [],
  existingImages: [],
  toastTimer: null
};

function readUser() {
  try {
    return JSON.parse(localStorage.getItem("achados-user"));
  } catch {
    return null;
  }
}

function readRoute() {
  const path = window.location.pathname;
  const itemMatch = path.match(/^\/item\/(\d+)$/);
  const editMatch = path.match(/^\/admin\/items\/(\d+)\/edit$/);
  if (itemMatch) return { name: "item", id: itemMatch[1] };
  if (path === "/admin/items/new") return { name: "form", id: null };
  if (editMatch) return { name: "form", id: editMatch[1] };
  return { name: "home" };
}

async function api(path, options = {}) {
  const response = await fetch(path, options);
  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json") ? await response.json() : null;

  if (!response.ok) {
    throw new Error(body?.message || "Não foi possível concluir a solicitação.");
  }
  return body;
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value, includeTime = false) {
  if (!value) return "";
  const date = value.includes("T") ? new Date(value) : new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    ...(includeTime ? { timeStyle: "short" } : {})
  }).format(date);
}

function navigate(path) {
  window.history.pushState({}, "", path);
  state.route = readRoute();
  render();
}

function back() {
  if (window.history.length > 1) {
    window.history.back();
    return;
  }
  navigate("/");
}

function showToast(type, message) {
  window.clearTimeout(state.toastTimer);
  const oldToast = document.querySelector(".toast");
  oldToast?.remove();

  const toast = document.createElement("div");
  toast.className = `toast toast-${type || "info"}`;
  toast.setAttribute("role", "status");
  toast.innerHTML = `
    <span class="icon" aria-hidden="true">${type === "success" ? "✓" : type === "error" ? "!" : "i"}</span>
    <span>${escapeHtml(message)}</span>
    <button type="button" aria-label="Fechar aviso">×</button>
  `;
  toast.querySelector("button").addEventListener("click", () => toast.remove());
  document.body.append(toast);
  state.toastTimer = window.setTimeout(() => toast.remove(), 3600);
}

function headerTemplate() {
  const user = state.user;
  return `
    <header class="site-header">
      <div class="header-accent"></div>
      <div class="header-inner container">
        <a class="brand" href="/" data-link aria-label="Ir para o início">
          <img src="/images/brand/pucpr-header.png" alt="PUCPR Grupo Marista">
          <span class="brand-divider"></span>
          <span class="brand-product">
            <strong>Achados</strong>
            <span>e Perdidos</span>
          </span>
        </a>

        <button class="mobile-menu-button" type="button" data-menu aria-expanded="false" aria-label="Abrir menu">
          <span class="icon">☰</span>
        </button>

        <nav class="header-nav" aria-label="Navegação principal">
          <button class="mobile-menu-button" type="button" data-menu aria-expanded="false" aria-label="Abrir menu">
            <span class="icon">☰</span>
          </button>

          ${user ? `
            <div class="user-menu-wrapper">
              <button class="user-avatar user-menu-toggle" type="button" data-user-menu aria-expanded="false" aria-label="Menu do usuário">
                <span class="icon">U</span>
              </button>
            <div class="user-dropdown" hidden>
              <a href="/" data-link>Catálogo</a>
              <a href="/admin/items/new" data-link><span class="icon">+</span>Cadastrar item</a>
              <hr>
              <span class="user-dropdown-info">
                <strong>${escapeHtml(user.name)}</strong>
                <small>${escapeHtml(user.location)}</small>
              </span>
              <button type="button" data-logout><span class="icon">↩</span>Sair</button>
            </div>
          </div>
        ` : `
          <a class="${state.route.name === "home" ? "active" : ""}" href="/" data-link>Catálogo</a>
          <button class="nav-login" type="button" data-login-open><span class="icon">→</span>Área do funcionário</button>
          `}
</nav>
      </div>
    </header>
  `;
}

function bindGlobalEvents() {
  app.querySelectorAll("[data-link]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      navigate(link.getAttribute("href"));
    });
  });

  app.querySelector("[data-menu]")?.addEventListener("click", (event) => {
    const nav = app.querySelector(".header-nav");
    const button = event.currentTarget;
    const isOpen = nav.classList.toggle("is-open");
    button.setAttribute("aria-expanded", String(isOpen));
    button.setAttribute("aria-label", isOpen ? "Fechar menu" : "Abrir menu");
    button.querySelector(".icon").textContent = isOpen ? "×" : "☰";
    const userMenuBtn = app.querySelector("[data-user-menu]");
    const userDropdown = app.querySelector(".user-dropdown");
    if (userMenuBtn && userDropdown) {
      userMenuBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = !userDropdown.hidden;
        userDropdown.hidden = isOpen;
        userMenuBtn.setAttribute("aria-expanded", String(!isOpen));
  });
  
  document.addEventListener("click", () => {
    if (userDropdown) userDropdown.hidden = true;
  }, { once: true });
}
  });

  app.querySelector("[data-login-open]")?.addEventListener("click", openLoginModal);
  app.querySelector("[data-logout]")?.addEventListener("click", () => {
    localStorage.removeItem("achados-user");
    state.user = null;
    navigate("/");
    showToast("info", "Você saiu da área administrativa.");
  });
}

function render() {
  if (!state.user && state.route.name === "form") {
    navigate("/");
    return;
  }

  app.innerHTML = `${headerTemplate()}<main id="page"></main>`;
  bindGlobalEvents();

  if (state.route.name === "item") {
    renderItemPage(state.route.id);
  } else if (state.route.name === "form") {
    renderFormPage(state.route.id);
  } else {
    renderHomePage();
  }
}

async function renderHomePage() {
  const page = app.querySelector("#page");
  const user = state.user;

  page.innerHTML = `
    <section class="hero ${user ? "hero-admin" : ""}">
      <div class="container hero-content">
        <div class="hero-copy">
          <span class="eyebrow">${user ? "Painel administrativo" : "Portal do campus Curitiba"}</span>
          <h1>${user ? "Gestão de itens encontrados" : "Perdeu alguma coisa por aqui?"}</h1>
          <p>${user
            ? "Acompanhe os itens sob responsabilidade da equipe, registre retiradas e mantenha o catálogo atualizado."
            : "Consulte os objetos encontrados no campus e veja onde fazer a retirada com segurança."}</p>
        </div>
        ${!user ? `
          <div class="hero-note">
            <span class="icon" aria-hidden="true">✓</span>
            <span><strong>Encontrou o seu item?</strong>Leve um documento com foto ao local indicado.</span>
          </div>
        ` : ""}
      </div>
    </section>

    <div id="stats-area"></div>

    <section class="catalog-section container">
      <div class="catalog-heading">
        <div>
          <span class="eyebrow">${user ? "Inventário" : "Objetos encontrados"}</span>
          <h2>${user ? "Todos os itens" : "Itens disponíveis"}</h2>
        </div>
        ${user ? `<a class="button button-primary desktop-create" href="/admin/items/new" data-link><span class="icon">+</span>Cadastrar item</a>` : ""}
      </div>

      <div class="search-toolbar">
        <label class="search-box">
          <span class="icon" aria-hidden="true">⌕</span>
          <input id="filter-q" type="search" placeholder="Busque por nome, categoria ou local..." value="${escapeHtml(state.filters.q)}">
        </label>
        <button class="button button-filter" type="button" data-filter-open>
          <span class="icon">☷</span>Filtros<span id="filter-dot"></span>
        </button>
        <label class="sort-control">
          <span class="icon">↕</span>
          <select id="filter-sort" aria-label="Ordenar itens">
            <option value="newest">Mais recentes</option>
            <option value="oldest">Mais antigos</option>
            <option value="name">Nome A-Z</option>
          </select>
        </label>
      </div>

      <div class="results-meta">
        <span id="results-count">Buscando itens...</span>
        ${!user ? `<span class="results-help">O catálogo exibe somente itens disponíveis para retirada.</span>` : ""}
      </div>

      <div id="items-area" class="items-grid" aria-label="Carregando">
        ${Array.from({ length: 8 }).map(() => `<div class="item-skeleton"></div>`).join("")}
      </div>
    </section>
  `;

  page.querySelector("#filter-sort").value = state.filters.sort;
  bindHomeEvents();
  updateFilterDot();
  await Promise.all([loadItems(), user ? loadStats() : Promise.resolve()]);
}

function bindHomeEvents() {
  app.querySelectorAll("[data-link]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      navigate(link.getAttribute("href"));
    });
  });

  const search = app.querySelector("#filter-q");
  let searchTimer;
  search?.addEventListener("input", () => {
    window.clearTimeout(searchTimer);
    state.filters.q = search.value;
    searchTimer = window.setTimeout(loadItems, 180);
  });

  app.querySelector("#filter-sort")?.addEventListener("change", (event) => {
    state.filters.sort = event.target.value;
    loadItems();
  });

  app.querySelector("[data-filter-open]")?.addEventListener("click", openFilterPanel);
}

async function loadItems() {
  const area = app.querySelector("#items-area");
  const count = app.querySelector("#results-count");
  if (!area || !count) return;

  count.textContent = "Buscando itens...";
  area.className = "items-grid";
  area.innerHTML = Array.from({ length: 8 }).map(() => `<div class="item-skeleton"></div>`).join("");

  const query = new URLSearchParams();
  Object.entries(state.filters).forEach(([key, value]) => {
    if (value && value !== "all") query.set(key, value);
  });
  if (!state.user) query.set("status", "available");

  try {
    const data = await api(`/api/items?${query.toString()}`);
    state.items = data.items;
    count.textContent = `${data.items.length} ${data.items.length === 1 ? "item encontrado" : "itens encontrados"}`;
    if (data.items.length) {
      area.className = "items-grid";
      area.innerHTML = data.items.map((item) => itemCardTemplate(item, Boolean(state.user))).join("");
      area.querySelectorAll("[data-link]").forEach((link) => {
        link.addEventListener("click", (event) => {
          event.preventDefault();
          navigate(link.getAttribute("href"));
        });
      });
    } else {
      area.className = "";
      area.innerHTML = emptyTemplate();
      area.querySelector("[data-clear-filters]").addEventListener("click", () => {
        state.filters = { ...defaultFilters };
        renderHomePage();
      });
    }
  } catch (error) {
    showToast("error", error.message);
  }
}

async function loadStats() {
  try {
    state.stats = await api("/api/stats");
    const statsArea = app.querySelector("#stats-area");
    if (!statsArea) return;
    statsArea.innerHTML = `
      <section class="stats-strip container" aria-label="Resumo dos itens">
        ${statTemplate("■", state.stats.total, "Itens cadastrados", "")}
        ${statTemplate("✓", state.stats.available, "Disponíveis", "available")}
        ${statTemplate("✓", state.stats.claimed, "Resgatados", "claimed")}
        ${statTemplate("⏱", state.stats.expired, "Expirados", "expired")}
        ${statTemplate("♦", state.stats.donated, "Doados", "donated")}
      </section>
    `;
  } catch {
    app.querySelector("#stats-area").innerHTML = "";
  }
}

function statTemplate(icon, value, label, modifier) {
  return `
    <article>
      <span class="stat-icon ${modifier}"><span class="icon">${icon}</span></span>
      <div><strong>${value}</strong><small>${label}</small></div>
    </article>
  `;
}

function itemCardTemplate(item, showStatus) {
  return `
    <a class="item-card" href="/item/${item.id}" data-link>
      <div class="item-card-image">
        <img src="${escapeHtml(item.images[0])}" alt="${escapeHtml(item.name)}" loading="lazy">
        ${showStatus ? `<span class="status-badge status-${item.status}">${statusLabels[item.status]}</span>` : ""}
        <span class="card-open"><span class="icon">↗</span></span>
      </div>
      <div class="item-card-content">
        <span class="item-category">${escapeHtml(item.category)}</span>
        <h3>${escapeHtml(item.name)}</h3>
        <p><span class="icon">⌖</span> ${escapeHtml(item.location)}</p>
        <p><span class="icon">□</span> Encontrado em ${formatDate(item.found_date)}</p>
      </div>
    </a>
  `;
}

function emptyTemplate() {
  return `
    <div class="empty-state">
      <span><span class="icon">⌕</span></span>
      <h3>Nenhum item por aqui</h3>
      <p>Tente buscar por outro termo ou remova alguns filtros.</p>
      <button class="button button-secondary" type="button" data-clear-filters>Limpar filtros</button>
    </div>
  `;
}

function updateFilterDot() {
  const dot = app.querySelector("#filter-dot");
  if (!dot) return;
  const hasFilter = state.filters.category !== "all"
    || state.filters.location !== "all"
    || state.filters.status !== "all"
    || state.filters.dateFrom
    || state.filters.dateTo;
  dot.className = hasFilter ? "filter-dot" : "";
}

function openFilterPanel() {
  closeOverlay();
  const overlay = document.createElement("button");
  overlay.className = "filter-overlay";
  overlay.type = "button";
  overlay.setAttribute("aria-label", "Fechar filtros");
  overlay.addEventListener("click", closeOverlay);

  const panel = document.createElement("aside");
  panel.className = "filter-panel is-open";
  panel.setAttribute("aria-label", "Filtros do catálogo");
  panel.innerHTML = `
    <div class="filter-panel-header">
      <span><span class="icon">☷</span> Filtros</span>
      <button class="icon-button" type="button" data-close aria-label="Fechar filtros">×</button>
    </div>

    ${state.user ? `
      <fieldset class="filter-group">
        <legend>Status</legend>
        <div class="status-filter-grid">
          <button type="button" data-status="all">Todos</button>
          ${Object.entries(statusLabels).map(([value, label]) => `<button type="button" data-status="${value}">${label}</button>`).join("")}
        </div>
      </fieldset>
    ` : ""}

    <label class="field">
      <span>Categoria</span>
      <select data-filter="category">
        <option value="all">Todas as categorias</option>
        ${categories.map((category) => `<option>${category}</option>`).join("")}
      </select>
    </label>

    <label class="field">
      <span>Localização</span>
      <select data-filter="location">
        <option value="all">Todos os locais</option>
        ${locations.map((location) => `<option>${location}</option>`).join("")}
      </select>
    </label>

    <div class="filter-group">
      <span class="field-label">Data em que foi encontrado</span>
      <div class="date-range">
        <label><span>De</span><input type="date" data-filter="dateFrom"></label>
        <label><span>Até</span><input type="date" data-filter="dateTo"></label>
      </div>
    </div>

    <div class="filter-actions">
      <button class="button button-secondary" type="button" data-clear><span class="icon">↻</span>Limpar</button>
      <button class="button button-primary" type="button" data-close>Ver resultados</button>
    </div>
  `;

  document.body.append(overlay, panel);
  panel.querySelector('[data-filter="category"]').value = state.filters.category;
  panel.querySelector('[data-filter="location"]').value = state.filters.location;
  panel.querySelector('[data-filter="dateFrom"]').value = state.filters.dateFrom;
  panel.querySelector('[data-filter="dateTo"]').value = state.filters.dateTo;

  panel.querySelectorAll("[data-status]").forEach((button) => {
    button.classList.toggle("selected", button.dataset.status === state.filters.status);
    button.addEventListener("click", () => {
      state.filters.status = button.dataset.status;
      panel.querySelectorAll("[data-status]").forEach((item) => item.classList.toggle("selected", item === button));
      updateFilterDot();
      loadItems();
    });
  });

  panel.querySelectorAll("[data-filter]").forEach((input) => {
    input.addEventListener("change", () => {
      state.filters[input.dataset.filter] = input.value;
      updateFilterDot();
      loadItems();
    });
  });

  panel.querySelector("[data-clear]").addEventListener("click", () => {
    state.filters = { ...defaultFilters };
    closeOverlay();
    renderHomePage();
  });
  panel.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", closeOverlay));
}

function closeOverlay() {
  document.querySelector(".filter-overlay")?.remove();
  document.querySelector(".filter-panel")?.remove();
  document.querySelector(".modal-backdrop")?.remove();
  document.body.classList.remove("modal-open");
}

async function renderItemPage(id) {
  const page = app.querySelector("#page");
  page.innerHTML = `<div class="page-loader"><span></span></div>`;

  try {
    state.item = await api(`/api/items/${id}`);
    state.activeImage = 0;
    drawItemPage();
  } catch {
    navigate("/");
  }
}

function drawItemPage() {
  const item = state.item;
  const page = app.querySelector("#page");
  page.innerHTML = `
    <div class="detail-page container">
      <div class="detail-topbar">
        <button class="back-link" type="button" data-back><span class="icon">←</span>Voltar ao catálogo</button>
        ${state.user ? `<a class="button button-secondary" href="/admin/items/${item.id}/edit" data-link><span class="icon">✎</span>Editar item</a>` : ""}
      </div>

      <div class="detail-layout">
        <section class="gallery" aria-label="Fotos do item">
          <div class="gallery-main">
            <img src="${escapeHtml(item.images[state.activeImage])}" alt="${escapeHtml(item.name)} - foto ${state.activeImage + 1}">
            <span class="status-badge status-${item.status}">${statusLabels[item.status]}</span>
          </div>
          ${item.images.length > 1 ? `
            <div class="gallery-thumbnails">
              ${item.images.map((image, index) => `
                <button class="${state.activeImage === index ? "active" : ""}" type="button" data-image="${index}">
                  <img src="${escapeHtml(image)}" alt="">
                </button>
              `).join("")}
            </div>
          ` : ""}
        </section>

        <section class="item-detail">
          <span class="eyebrow">${escapeHtml(item.category)}</span>
          <h1>${escapeHtml(item.name)}</h1>
          <div class="detail-meta">
            <p><span class="icon">□</span><span><small>Encontrado em</small><strong>${formatDate(item.found_date)}</strong></span></p>
            <p><span class="icon">⌖</span><span><small>Local de retirada</small><strong>${escapeHtml(item.location)}</strong></span></p>
            <p><span class="icon">⏱</span><span><small>Horário de atendimento</small><strong>Segunda a sexta, das 8h às 19h</strong></span></p>
          </div>

          <div class="detail-description">
            <h2>Sobre o item</h2>
            <p>${escapeHtml(item.description)}</p>
          </div>

          <div class="security-note">
            <span class="icon">✓</span>
            <div>
              <strong>Retirada com identificação</strong>
              <p>Apresente um documento com foto e confirme características do objeto no atendimento.</p>
            </div>
          </div>

          ${adminActionsTemplate(item)}
        </section>
      </div>

      ${receiptTemplate(item)}
    </div>
  `;

  page.querySelector("[data-back]").addEventListener("click", back);
  page.querySelectorAll("[data-link]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      navigate(link.getAttribute("href"));
    });
  });
  page.querySelectorAll("[data-image]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeImage = Number(button.dataset.image);
      drawItemPage();
    });
  });
  page.querySelector("[data-claim]")?.addEventListener("click", openClaimModal);
  page.querySelector("[data-donate]")?.addEventListener("click", openDonationModal);
  page.querySelector("[data-expire]")?.addEventListener("click", expireItem);
}

function adminActionsTemplate(item) {
  if (!state.user || item.status === "claimed" || item.status === "donated") return "";
  if (item.status === "expired") {
    return `
      <div class="admin-actions">
        <button class="button button-primary" type="button" data-donate><span class="icon">♦</span>Registrar doação</button>
      </div>
    `;
  }
  return `
    <div class="admin-actions">
      <button class="button button-primary" type="button" data-claim><span class="icon">✓</span>Registrar resgate</button>
      <button class="button button-secondary" type="button" data-expire><span class="icon">⏱</span>Marcar como expirado</button>
    </div>
  `;
}

function receiptTemplate(item) {
  if (item.status === "claimed") {
    return `
      <section class="status-receipt receipt-claimed">
        <header><span class="icon">✓</span><div><span>Item resgatado</span><small>Retirada concluída</small></div></header>
        <div class="receipt-grid">
          <p><span class="icon">U</span><span><small>Retirado por</small><strong>${escapeHtml(item.claim_name)}</strong></span></p>
          <p><span class="icon">#</span><span><small>Documento</small><strong>${escapeHtml(item.claim_document)}</strong></span></p>
          <p><span class="icon">□</span><span><small>Data e hora</small><strong>${formatDate(item.claimed_at, true)}</strong></span></p>
        </div>
      </section>
    `;
  }

  if (item.status === "donated") {
    return `
      <section class="status-receipt receipt-donated">
        <header><span class="icon">♦</span><div><span>Item doado</span><small>Destinação social concluída</small></div></header>
        <div class="receipt-grid">
          <p><span class="icon">✓</span><span><small>Instituição</small><strong>${escapeHtml(item.donation_institution)}</strong></span></p>
          <p><span class="icon">□</span><span><small>Doado em</small><strong>${formatDate(item.donated_at, true)}</strong></span></p>
        </div>
      </section>
    `;
  }
  return "";
}

async function expireItem() {
  if (!window.confirm("Marcar este item como expirado?")) return;
  try {
    state.item = await api(`/api/items/${state.item.id}/expire`, { method: "POST" });
    drawItemPage();
    showToast("success", "Item marcado como expirado.");
  } catch (error) {
    showToast("error", error.message);
  }
}

function openLoginModal() {
  openModal({
    eyebrow: "Acesso restrito",
    title: "Área do funcionário",
    className: "login-modal",
    body: `
      <p class="modal-intro">Entre para cadastrar itens e registrar retiradas. Os dados de demonstração já estão preenchidos.</p>
      <form class="stack-form" data-login-form>
        <label class="field">
          <span>E-mail institucional</span>
          <span class="input-with-icon">
            <span class="icon">E</span>
            <input name="email" type="email" value="funcionario@pucpr.br" autocomplete="username" required>
          </span>
        </label>
        <label class="field">
          <span>Senha</span>
          <span class="input-with-icon">
            <span class="icon">#</span>
            <input name="password" type="password" value="pucpr" autocomplete="current-password" required>
            <button class="input-action" type="button" data-toggle-password aria-label="Exibir senha">••</button>
          </span>
        </label>
        <p class="form-error" hidden></p>
        <button class="button button-primary button-block" type="submit">Entrar</button>
      </form>
    `
  });

  const form = document.querySelector("[data-login-form]");
  const password = form.elements.password;
  const toggle = form.querySelector("[data-toggle-password]");
  toggle.addEventListener("click", () => {
    password.type = password.type === "password" ? "text" : "password";
    toggle.textContent = password.type === "password" ? "••" : "○";
    toggle.setAttribute("aria-label", password.type === "password" ? "Exibir senha" : "Ocultar senha");
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const error = form.querySelector(".form-error");
    const button = form.querySelector(".button-primary");
    error.hidden = true;
    button.disabled = true;
    button.textContent = "Entrando...";
    try {
      const data = await api("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.elements.email.value, password: password.value })
      });
      localStorage.setItem("achados-user", JSON.stringify(data.user));
      state.user = data.user;
      closeOverlay();
      render();
      showToast("success", `Olá, ${data.user.name.split(" ")[0]}. Área administrativa liberada.`);
    } catch (requestError) {
      error.textContent = requestError.message;
      error.hidden = false;
    } finally {
      button.disabled = false;
      button.textContent = "Entrar";
    }
  });
}

function openClaimModal() {
  openModal({
    eyebrow: "Controle de retirada",
    title: "Registrar resgate",
    body: `
      <p class="modal-intro">Confirme a identidade da pessoa antes de concluir a entrega.</p>
      <form class="stack-form" data-claim-form>
        <label class="field"><span>Nome completo</span><input name="name" required></label>
        <label class="field"><span>CPF ou documento</span><input name="document" required></label>
        <p class="form-error" hidden></p>
        <div class="modal-actions">
          <button class="button button-secondary" type="button" data-close>Cancelar</button>
          <button class="button button-primary" type="submit">Confirmar retirada</button>
        </div>
      </form>
    `
  });

  document.querySelector("[data-claim-form]").addEventListener("submit", async (event) => {
    event.preventDefault();
    await submitStatusForm(event.currentTarget, `/api/items/${state.item.id}/claim`, {
      name: event.currentTarget.elements.name.value,
      document: event.currentTarget.elements.document.value
    }, "Retirada registrada com sucesso.");
  });
}

function openDonationModal() {
  openModal({
    eyebrow: "Destinação do item",
    title: "Registrar doação",
    body: `
      <p class="modal-intro">Informe a instituição que recebeu o objeto.</p>
      <form class="stack-form" data-donation-form>
        <label class="field">
          <span>Instituição beneficiada</span>
          <input name="institution" placeholder="Ex.: Complexo de Saúde Pequeno Cotolengo" required>
        </label>
        <p class="form-error" hidden></p>
        <div class="modal-actions">
          <button class="button button-secondary" type="button" data-close>Cancelar</button>
          <button class="button button-primary" type="submit">Confirmar doação</button>
        </div>
      </form>
    `
  });

  document.querySelector("[data-donation-form]").addEventListener("submit", async (event) => {
    event.preventDefault();
    await submitStatusForm(event.currentTarget, `/api/items/${state.item.id}/donate`, {
      institution: event.currentTarget.elements.institution.value
    }, "Doação registrada com sucesso.");
  });
}

async function submitStatusForm(form, path, payload, successMessage) {
  const error = form.querySelector(".form-error");
  const button = form.querySelector(".button-primary");
  error.hidden = true;
  button.disabled = true;
  button.textContent = "Salvando...";
  try {
    state.item = await api(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    closeOverlay();
    drawItemPage();
    showToast("success", successMessage);
  } catch (requestError) {
    error.textContent = requestError.message;
    error.hidden = false;
  } finally {
    button.disabled = false;
  }
}

function openModal({ eyebrow, title, body, className = "" }) {
  closeOverlay();
  document.body.classList.add("modal-open");
  const modal = document.createElement("div");
  modal.className = "modal-backdrop";
  modal.setAttribute("role", "presentation");
  modal.innerHTML = `
    <section class="modal-card ${className}" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <header class="modal-header">
        <div>
          ${eyebrow ? `<span class="eyebrow">${eyebrow}</span>` : ""}
          <h2 id="modal-title">${title}</h2>
        </div>
        <button class="icon-button" type="button" data-close aria-label="Fechar">×</button>
      </header>
      ${body}
    </section>
  `;
  modal.addEventListener("mousedown", (event) => {
    if (event.target === modal) closeOverlay();
  });
  modal.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", closeOverlay));
  document.body.append(modal);
}

async function renderFormPage(id) {
  const page = app.querySelector("#page");
  const editing = Boolean(id);
  state.formFiles = [];
  state.existingImages = [];
  page.innerHTML = `<div class="page-loader"><span></span></div>`;

  const formData = {
    name: "",
    category: "",
    description: "",
    location: "Bloco 10",
    foundDate: new Date().toISOString().slice(0, 10),
    registeredBy: state.user.name
  };

  if (editing) {
    try {
      const item = await api(`/api/items/${id}`);
      Object.assign(formData, {
        name: item.name,
        category: item.category,
        description: item.description,
        location: item.location,
        foundDate: item.found_date,
        registeredBy: item.registered_by
      });
      state.existingImages = item.images;
    } catch {
      navigate("/");
      return;
    }
  }

  drawFormPage(id, formData);
}

function drawFormPage(id, formData) {
  const editing = Boolean(id);
  const page = app.querySelector("#page");
  page.innerHTML = `
    <div class="form-page">
      <div class="container form-page-header">
        <button class="back-link" type="button" data-back><span class="icon">←</span>Voltar</button>
        <div>
          <span class="eyebrow">Área administrativa</span>
          <h1>${editing ? "Editar item" : "Cadastrar novo item"}</h1>
          <p>${editing ? "Atualize as informações públicas do objeto." : "Registre o objeto encontrado para disponibilizá-lo no catálogo."}</p>
        </div>
      </div>

      <form class="item-form container" data-item-form>
        <div class="form-alert" hidden><span class="icon">!</span><span></span></div>
        <section class="form-card photo-section">
          <div class="section-heading">
            <span class="section-number">1</span>
            <div><h2>Fotos do item</h2><p>Inclua até 5 imagens claras, sem expor dados pessoais.</p></div>
          </div>
          <div class="photo-grid" id="photo-grid"></div>
        </section>

        <section class="form-card">
          <div class="section-heading">
            <span class="section-number">2</span>
            <div><h2>Informações do item</h2><p>Use uma descrição objetiva para facilitar a identificação.</p></div>
          </div>
          <div class="form-grid">
            <label class="field field-wide">
              <span>Nome do item *</span>
              <input name="name" value="${escapeHtml(formData.name)}" placeholder="Ex.: Copo térmico branco" required>
            </label>
            <label class="field">
              <span>Categoria *</span>
              <select name="category" required>
                <option value="">Selecione uma categoria</option>
                ${categories.map((category) => `<option>${category}</option>`).join("")}
              </select>
            </label>
            <label class="field">
              <span>Localização *</span>
              <select name="location" required>
                ${locations.map((location) => `<option>${location}</option>`).join("")}
              </select>
            </label>
            <label class="field field-wide">
              <span>Descrição *</span>
              <textarea name="description" placeholder="Cor, marca, estado de conservação e informações úteis para a retirada..." rows="5" maxlength="500" required>${escapeHtml(formData.description)}</textarea>
              <small id="description-count">${formData.description.length}/500 caracteres</small>
            </label>
          </div>
        </section>

        <section class="form-card">
          <div class="section-heading">
            <span class="section-number">3</span>
            <div><h2>Dados de controle</h2><p>Estas informações ajudam a equipe a manter a rastreabilidade.</p></div>
          </div>
          <div class="form-grid">
            <label class="field">
              <span>Data em que foi encontrado *</span>
              <span class="input-with-icon trailing">
                <input name="foundDate" type="date" value="${escapeHtml(formData.foundDate)}" required>
                <span class="icon">□</span>
              </span>
            </label>
            <label class="field">
              <span>Responsável pelo registro *</span>
              <input name="registeredBy" value="${escapeHtml(formData.registeredBy)}" required>
            </label>
          </div>
        </section>

        <div class="form-footer">
          <button class="button button-secondary" type="button" data-back>Cancelar</button>
          <button class="button button-primary" type="submit"><span class="icon">✓</span>${editing ? "Salvar alterações" : "Cadastrar item"}</button>
        </div>
      </form>
    </div>
  `;

  const form = page.querySelector("[data-item-form]");
  form.elements.category.value = formData.category;
  form.elements.location.value = formData.location;
  page.querySelectorAll("[data-back]").forEach((button) => button.addEventListener("click", back));
  form.elements.description.addEventListener("input", () => {
    page.querySelector("#description-count").textContent = `${form.elements.description.value.length}/500 caracteres`;
  });
  renderPhotos();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    await saveItem(id, form);
  });
}

function renderPhotos() {
  const grid = app.querySelector("#photo-grid");
  if (!grid) return;

  const previews = state.formFiles.map((file, index) => ({ index, url: URL.createObjectURL(file) }));
  grid.innerHTML = `
    ${state.existingImages.map((image) => `
      <div class="photo-preview">
        <img src="${escapeHtml(image)}" alt="Foto atual do item">
        <button type="button" data-remove-existing="${escapeHtml(image)}" aria-label="Remover foto">×</button>
      </div>
    `).join("")}
    ${previews.map((preview) => `
      <div class="photo-preview">
        <img src="${preview.url}" alt="Nova foto ${preview.index + 1}">
        <button type="button" data-remove-file="${preview.index}" aria-label="Remover foto">×</button>
      </div>
    `).join("")}
    ${state.existingImages.length + state.formFiles.length < 5 ? `
      <label class="photo-upload">
        <span class="icon">+</span>
        <strong>Adicionar fotos</strong>
        <span>PNG, JPG ou WEBP, até 5 MB</span>
        <input type="file" accept="image/*" multiple data-files>
      </label>
    ` : ""}
  `;

  previews.forEach((preview) => URL.revokeObjectURL(preview.url));
  grid.querySelectorAll("[data-remove-existing]").forEach((button) => {
    button.addEventListener("click", () => {
      state.existingImages = state.existingImages.filter((image) => image !== button.dataset.removeExisting);
      renderPhotos();
    });
  });
  grid.querySelectorAll("[data-remove-file]").forEach((button) => {
    button.addEventListener("click", () => {
      state.formFiles = state.formFiles.filter((_, index) => index !== Number(button.dataset.removeFile));
      renderPhotos();
    });
  });
  grid.querySelector("[data-files]")?.addEventListener("change", (event) => {
    const selected = Array.from(event.target.files || []);
    const remaining = Math.max(0, 5 - state.existingImages.length - state.formFiles.length);
    state.formFiles = [...state.formFiles, ...selected.slice(0, remaining)];
    renderPhotos();
  });
}

async function saveItem(id, form) {
  const alert = form.querySelector(".form-alert");
  const alertText = alert.querySelector("span:last-child");
  if (state.existingImages.length + state.formFiles.length === 0) {
    alertText.textContent = "Adicione ao menos uma foto do item.";
    alert.hidden = false;
    return;
  }

  const button = form.querySelector(".button-primary");
  button.disabled = true;
  button.innerHTML = `<span class="spin icon">↻</span>Salvando...`;
  alert.hidden = true;

  const payload = new FormData(form);
  payload.append("existingImages", JSON.stringify(state.existingImages));
  state.formFiles.forEach((file) => payload.append("images", file));

  try {
    const item = await api(id ? `/api/items/${id}` : "/api/items", {
      method: id ? "PUT" : "POST",
      body: payload
    });
    showToast("success", id ? "Item atualizado com sucesso." : "Item cadastrado com sucesso.");
    navigate(`/item/${item.id}`);
  } catch (error) {
    alertText.textContent = error.message;
    alert.hidden = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
  } finally {
    button.disabled = false;
    button.innerHTML = `<span class="icon">✓</span>${id ? "Salvar alterações" : "Cadastrar item"}`;
  }
}

window.addEventListener("popstate", () => {
  state.route = readRoute();
  render();
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeOverlay();
});

render();
