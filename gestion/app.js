const STORAGE_KEY = "tdc.gestion.frontend.v1";

const proposalStateLabels = {
  draft: "Borrador",
  sent: "Enviada",
  approved: "Aprobada",
  rejected: "Rechazada",
};

const orderStateLabels = {
  pending: "Pendiente",
  in_progress: "En proceso",
  on_hold: "En espera",
  completed: "Terminado",
  delivered: "Entregado / cerrado",
  cancelled: "Cancelado",
};

const accountStateLabels = { issued: "Emitida", paid: "Pagada" };
const sectionLabels = {
  dashboard: "RESUMEN",
  proposals: "PROPUESTAS",
  orders: "ÓRDENES DE SERVICIO",
  accounts: "CUENTAS DE COBRO",
  clients: "CLIENTES",
};

const emptyState = () => ({
  clients: [],
  proposals: [],
  orders: [],
  accounts: [],
  nextId: 1,
  noticeDismissed: false,
  business: {
    name: "Tienda Digital Colombia",
    representative: "",
    identification: "",
    phone: "",
    email: "",
    address: "Lorica, Córdoba",
  },
});

let store = loadStore();
let currentView = "dashboard";
let toastTimer;

function loadStore() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return emptyState();
    const parsed = JSON.parse(saved);
    return {
      ...emptyState(),
      ...parsed,
      business: { ...emptyState().business, ...(parsed.business || {}) },
    };
  } catch (error) {
    console.error("No se pudieron leer los datos locales:", error);
    return emptyState();
  }
}

function saveStore() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    return true;
  } catch (error) {
    console.error("No se pudieron guardar los datos locales:", error);
    showToast("No fue posible guardar. Revisa el espacio del navegador.", true);
    return false;
  }
}

function nextId() {
  const assignedId = store.nextId;
  store.nextId += 1;
  return assignedId;
}

function nextNumber(prefix, records) {
  const currentYear = new Date().getFullYear();
  const yearPrefix = `${prefix}-${currentYear}-`;
  const highest = records.reduce((maximum, record) => {
    const number = record.number || "";
    if (!number.startsWith(yearPrefix)) return maximum;
    return Math.max(maximum, Number(number.slice(yearPrefix.length)) || 0);
  }, 0);
  return `${yearPrefix}${String(highest + 1).padStart(4, "0")}`;
}

function today() {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
}

function dateLabel(value, includeTime = false) {
  if (!value) return "Sin fecha";
  const date = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-CO", includeTime
    ? { dateStyle: "medium", timeStyle: "short" }
    : { dateStyle: "medium" }).format(date);
}

function money(value) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function getClient(clientId) {
  return store.clients.find(client => client.id === Number(clientId));
}

function getProposal(proposalId) {
  return store.proposals.find(proposal => proposal.id === Number(proposalId));
}

function getOrder(orderId) {
  return store.orders.find(order => order.id === Number(orderId));
}

function getAccount(accountId) {
  return store.accounts.find(account => account.id === Number(accountId));
}

function proposalTotal(proposal) {
  return proposal.items.reduce((total, item) => total + Math.round(item.quantity * item.unitPrice), 0);
}

function statusBadge(state, labels) {
  return `<span class="status status-${escapeHtml(state)}">${escapeHtml(labels[state] || state)}</span>`;
}

function showToast(message, isError = false) {
  const region = document.querySelector("#toast-region");
  region.innerHTML = `<div class="toast${isError ? " is-error" : ""}" role="status">${escapeHtml(message)}</div>`;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => { region.innerHTML = ""; }, 3300);
}

function setView(view) {
  if (!sectionLabels[view]) return;
  currentView = view;
  document.querySelectorAll("[data-view]").forEach(button => {
    button.classList.toggle("is-active", button.dataset.view === view);
  });
  document.querySelector("#current-section").textContent = sectionLabels[view];
  renderView();
}

function renderView() {
  const views = {
    dashboard: renderDashboard,
    proposals: renderProposals,
    orders: renderOrders,
    accounts: renderAccounts,
    clients: renderClients,
  };
  document.querySelector("#view-content").innerHTML = views[currentView]();
  setFilterOptions();
  const proposalCount = store.proposals.filter(proposal => ["draft", "sent"].includes(proposal.state)).length;
  const navCount = document.querySelector("#proposal-nav-count");
  navCount.textContent = String(proposalCount);
  navCount.classList.toggle("has-count", proposalCount > 0);
  document.querySelector(".local-notice").classList.toggle("is-dismissed", store.noticeDismissed);
}

function renderDashboard() {
  const awaitingApproval = store.proposals.filter(proposal => ["draft", "sent"].includes(proposal.state)).length;
  const activeOrders = store.orders.filter(order => ["pending", "in_progress", "on_hold"].includes(order.state)).length;
  const issuedAccounts = store.accounts.filter(account => account.state === "issued").length;
  const latestRecords = [
    ...store.proposals.map(proposal => ({ type: "Propuesta", number: proposal.number, name: getClient(proposal.clientId)?.name, date: proposal.createdAt, state: proposalStateLabels[proposal.state] })),
    ...store.orders.map(order => ({ type: "Orden", number: order.number, name: getClient(order.clientId)?.name, date: order.updatedAt, state: orderStateLabels[order.state] })),
    ...store.accounts.map(account => ({ type: "Cuenta de cobro", number: account.number, name: getClient(getOrder(account.orderId)?.clientId)?.name, date: account.issuedAt, state: accountStateLabels[account.state] })),
  ].sort((first, second) => new Date(second.date) - new Date(first.date)).slice(0, 6);

  return `
    <div class="page-heading">
      <div><p class="eyebrow">${dateLabel(today())}</p><h1>Control de servicios</h1><p>De la propuesta aprobada al trabajo realizado y su cuenta de cobro.</p></div>
      <div class="heading-actions"><button class="button button-quiet" type="button" data-action="load-demo">Cargar recorrido de ejemplo</button><button class="button button-primary" type="button" data-action="new-proposal">＋ Nueva propuesta</button></div>
    </div>
    <div class="metric-grid">
      ${metric("Clientes", store.clients.length, "◉", "Registros en este navegador")}
      ${metric("Por aprobar", awaitingApproval, "PE", "Propuestas en borrador o enviadas")}
      ${metric("Trabajos activos", activeOrders, "OS", "Pendientes, en proceso o en espera")}
      ${metric("Cuentas por cobrar", issuedAccounts, "CC", "Emitidas y aún no marcadas pagadas")}
    </div>
    <div class="section-block overview-grid">
      <section class="panel">
        <div class="panel-header"><div><h2>Flujo de trabajo</h2><p>Seguimiento de tus documentos y servicios</p></div><button class="button-link" type="button" data-view="proposals">Ver propuestas →</button></div>
        <div class="panel-body"><div class="flow-list">
          ${flowStep("01", "Propuesta económica", "Preparar y presentar al cliente", store.proposals.filter(proposal => ["draft", "sent"].includes(proposal.state)).length, awaitingApproval > 0)}
          ${flowStep("02", "Visto bueno", "Aprobación antes de iniciar el trabajo", store.proposals.filter(proposal => proposal.state === "approved").length, false)}
          ${flowStep("03", "Orden de servicio", "Registrar avance y trabajo realizado", activeOrders, activeOrders > 0)}
          ${flowStep("04", "Cuenta de cobro", "Emitir al terminar el servicio", issuedAccounts, issuedAccounts > 0)}
        </div></div>
      </section>
      <section class="panel">
        <div class="panel-header"><div><h2>Actividad reciente</h2><p>Últimos movimientos registrados</p></div></div>
        <div class="panel-body"><div class="activity-list">${latestRecords.length ? latestRecords.map(activityItem).join("") : emptyInline("Aún no hay movimientos.")}</div></div>
      </section>
    </div>
    <section class="section-block">
      <div class="section-title"><div><h2>Accesos rápidos</h2><p>Acciones habituales del proceso</p></div></div>
      <div class="quick-actions">
        <button class="quick-action" type="button" data-action="new-client"><span class="quick-action-icon">＋</span><span><strong>Registrar cliente</strong><small>Crear una ficha de contacto</small></span></button>
        <button class="quick-action" type="button" data-action="new-proposal"><span class="quick-action-icon">PE</span><span><strong>Preparar propuesta</strong><small>Agregar conceptos y calcular el total</small></span></button>
        <button class="quick-action" type="button" data-view="orders"><span class="quick-action-icon">OS</span><span><strong>Revisar trabajos</strong><small>Actualizar estado y registrar la ejecución</small></span></button>
      </div>
    </section>`;
}

function metric(label, value, icon, note) {
  return `<article class="metric"><div class="metric-top"><span>${escapeHtml(label)}</span><span class="metric-icon">${escapeHtml(icon)}</span></div><strong class="metric-value">${escapeHtml(value)}</strong><span class="metric-sub">${escapeHtml(note)}</span></article>`;
}

function flowStep(number, title, note, count, isCurrent) {
  return `<div class="flow-step${isCurrent ? " is-current" : ""}"><span class="flow-number">${number}</span><span class="flow-copy"><strong>${escapeHtml(title)}</strong><small>${escapeHtml(note)}</small></span><span class="flow-count">${count}</span></div>`;
}

function activityItem(item) {
  return `<div class="activity-item"><span class="activity-dot"></span><span><strong>${escapeHtml(item.number)} · ${escapeHtml(item.name || "Cliente")}</strong><small>${escapeHtml(item.type)} · ${escapeHtml(item.state)}</small></span><time class="activity-date">${escapeHtml(dateLabel(item.date))}</time></div>`;
}

function emptyInline(message) {
  return `<p class="field-hint">${escapeHtml(message)}</p>`;
}

function pageHeading(eyebrow, title, description, buttonLabel, action) {
  return `<div class="page-heading"><div><p class="eyebrow">${escapeHtml(eyebrow)}</p><h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p></div><div class="heading-actions">${buttonLabel ? `<button class="button button-primary" type="button" data-action="${escapeHtml(action)}">＋ ${escapeHtml(buttonLabel)}</button>` : ""}</div></div>`;
}

function searchToolbar(placeholder, filterId = "") {
  return `<div class="toolbar"><label class="search-box"><span aria-hidden="true">⌕</span><input type="search" data-search placeholder="${escapeHtml(placeholder)}" aria-label="${escapeHtml(placeholder)}"></label><div class="toolbar-group">${filterId ? `<select class="filter-select" data-filter="${escapeHtml(filterId)}" aria-label="Filtrar por estado"><option value="">Todos los estados</option></select>` : ""}</div></div>`;
}

function renderProposals() {
  const sorted = [...store.proposals].sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt));
  return `${pageHeading("GESTIÓN COMERCIAL", "Propuestas económicas", "Prepara el alcance, presenta el valor y registra el visto bueno antes de iniciar el trabajo.", "Nueva propuesta", "new-proposal")}
    ${searchToolbar("Buscar por número, cliente o servicio", "proposal-state")}
    <section class="panel"><div class="table-wrap"><table class="data-table"><thead><tr><th>DOCUMENTO</th><th>CLIENTE</th><th>SERVICIO</th><th>FECHA</th><th>VALOR</th><th>ESTADO</th><th></th></tr></thead><tbody data-filterable-list>${sorted.length ? sorted.map(proposalRow).join("") : `<tr><td colspan="7" class="empty-row">Todavía no has preparado propuestas.</td></tr>`}</tbody></table></div></section>`;
}

function proposalRow(proposal) {
  const client = getClient(proposal.clientId);
  return `<tr data-search-text="${escapeHtml(`${proposal.number} ${client?.name || ""} ${client?.organization || ""} ${proposal.serviceType} ${proposal.description}`.toLowerCase())}" data-state="${escapeHtml(proposal.state)}">
    <td><span class="cell-primary mono">${escapeHtml(proposal.number)}</span><span class="cell-secondary">${escapeHtml(proposal.items.length)} concepto(s)</span></td>
    <td><span class="cell-primary">${escapeHtml(client?.name || "Cliente")}</span><span class="cell-secondary">${escapeHtml(client?.organization || client?.phone || "")}</span></td>
    <td><span class="cell-primary">${escapeHtml(proposal.serviceType)}</span><span class="cell-secondary">${escapeHtml(proposal.description)}</span></td>
    <td>${escapeHtml(dateLabel(proposal.issuedOn))}</td><td class="mono">${escapeHtml(money(proposalTotal(proposal)))}</td>
    <td>${statusBadge(proposal.state, proposalStateLabels)}</td>
    <td><div class="table-actions"><button class="button-link" type="button" data-action="proposal-detail" data-id="${proposal.id}">Abrir</button></div></td>
  </tr>`;
}

function renderOrders() {
  const sorted = [...store.orders].sort((first, second) => new Date(second.updatedAt) - new Date(first.updatedAt));
  return `${pageHeading("EJECUCIÓN", "Órdenes de servicio", "Cada orden nace de una propuesta aprobada. Registra el avance y qué trabajo realizaste.", "", "")}
    ${searchToolbar("Buscar por orden, propuesta, cliente o servicio", "order-state")}
    <section class="panel"><div class="table-wrap"><table class="data-table"><thead><tr><th>ORDEN</th><th>CLIENTE / PROPUESTA</th><th>SERVICIO</th><th>ACTUALIZACIÓN</th><th>VALOR APROBADO</th><th>ESTADO</th><th></th></tr></thead><tbody data-filterable-list>${sorted.length ? sorted.map(orderRow).join("") : `<tr><td colspan="7" class="empty-row">Las propuestas aprobadas aparecerán aquí como órdenes.</td></tr>`}</tbody></table></div></section>`;
}

function orderRow(order) {
  const client = getClient(order.clientId);
  const proposal = getProposal(order.proposalId);
  return `<tr data-search-text="${escapeHtml(`${order.number} ${proposal?.number || ""} ${client?.name || ""} ${proposal?.serviceType || ""}`.toLowerCase())}" data-state="${escapeHtml(order.state)}">
    <td><span class="cell-primary mono">${escapeHtml(order.number)}</span><span class="cell-secondary">Recibida ${escapeHtml(dateLabel(order.receivedAt))}</span></td>
    <td><span class="cell-primary">${escapeHtml(client?.name || "Cliente")}</span><span class="cell-secondary mono">${escapeHtml(proposal?.number || "")}</span></td>
    <td><span class="cell-primary">${escapeHtml(proposal?.serviceType || "Servicio")}</span><span class="cell-secondary">${escapeHtml(proposal?.description || "")}</span></td>
    <td>${escapeHtml(dateLabel(order.updatedAt))}</td><td class="mono">${escapeHtml(money(proposal ? proposalTotal(proposal) : 0))}</td>
    <td>${statusBadge(order.state, orderStateLabels)}</td>
    <td><div class="table-actions"><button class="button-link" type="button" data-action="order-detail" data-id="${order.id}">Abrir</button></div></td>
  </tr>`;
}

function renderAccounts() {
  const sorted = [...store.accounts].sort((first, second) => new Date(second.issuedAt) - new Date(first.issuedAt));
  return `${pageHeading("COBRO", "Cuentas de cobro", "Genera el documento imprimible al terminar un trabajo y lleva control manual de su estado.", "", "")}
    ${searchToolbar("Buscar por cuenta, orden o cliente", "account-state")}
    <section class="panel"><div class="table-wrap"><table class="data-table"><thead><tr><th>CUENTA</th><th>CLIENTE</th><th>ORDEN</th><th>CONCEPTO</th><th>EMITIDA</th><th>VALOR</th><th>ESTADO</th><th></th></tr></thead><tbody data-filterable-list>${sorted.length ? sorted.map(accountRow).join("") : `<tr><td colspan="8" class="empty-row">Las cuentas de cobro aparecen aquí cuando terminas una orden.</td></tr>`}</tbody></table></div></section>`;
}

function accountRow(account) {
  const client = getClient(getOrder(account.orderId)?.clientId);
  const proposal = getProposal(getOrder(account.orderId)?.proposalId);
  return `<tr data-search-text="${escapeHtml(`${account.number} ${getOrder(account.orderId)?.number || ""} ${client?.name || ""}`.toLowerCase())}" data-state="${escapeHtml(account.state)}">
    <td><span class="cell-primary mono">${escapeHtml(account.number)}</span></td>
    <td><span class="cell-primary">${escapeHtml(client?.name || "Cliente")}</span></td>
    <td class="mono">${escapeHtml(getOrder(account.orderId)?.number || "")}</td>
    <td>${escapeHtml(proposal?.serviceType || "Servicio")}</td><td>${escapeHtml(dateLabel(account.issuedAt))}</td>
    <td class="mono">${escapeHtml(money(proposal ? proposalTotal(proposal) : 0))}</td>
    <td>${statusBadge(account.state, accountStateLabels)}</td>
    <td><div class="table-actions"><button class="button-link" type="button" data-action="print-account" data-id="${account.id}">Imprimir</button>${account.state === "issued" ? `<button class="button-link" type="button" data-action="mark-paid" data-id="${account.id}">Marcar pagada</button>` : ""}</div></td>
  </tr>`;
}

function renderClients() {
  const sorted = [...store.clients].sort((first, second) => first.name.localeCompare(second.name, "es"));
  return `${pageHeading("REGISTROS", "Clientes", "Mantén el contacto principal y consulta los documentos que has gestionado.", "Nuevo cliente", "new-client")}
    ${searchToolbar("Buscar por nombre, organización o contacto")}
    <section class="panel"><div class="table-wrap"><table class="data-table"><thead><tr><th>CLIENTE</th><th>ORGANIZACIÓN</th><th>CONTACTO</th><th>PROPUESTAS</th><th>ÓRDENES</th><th></th></tr></thead><tbody data-filterable-list>${sorted.length ? sorted.map(clientRow).join("") : `<tr><td colspan="6" class="empty-row">Registra al cliente cuando prepares su primera propuesta.</td></tr>`}</tbody></table></div></section>`;
}

function clientRow(client) {
  const proposalCount = store.proposals.filter(proposal => proposal.clientId === client.id).length;
  const orderCount = store.orders.filter(order => order.clientId === client.id).length;
  return `<tr data-search-text="${escapeHtml(`${client.name} ${client.organization} ${client.phone} ${client.email}`.toLowerCase())}">
    <td><span class="cell-primary">${escapeHtml(client.name)}</span></td>
    <td>${escapeHtml(client.organization || "—")}</td>
    <td><span class="cell-primary">${escapeHtml(client.phone || "—")}</span><span class="cell-secondary">${escapeHtml(client.email || "")}</span></td>
    <td class="mono">${proposalCount}</td><td class="mono">${orderCount}</td>
    <td><div class="table-actions"><button class="button-link" type="button" data-action="client-detail" data-id="${client.id}">Historial</button></div></td>
  </tr>`;
}

function setFilterOptions() {
  const select = document.querySelector("[data-filter]");
  if (!select) return;
  const filterLists = {
    "proposal-state": proposalStateLabels,
    "order-state": orderStateLabels,
    "account-state": accountStateLabels,
  };
  const labels = filterLists[select.dataset.filter] || {};
  select.innerHTML = `<option value="">Todos los estados</option>${Object.entries(labels).map(([value, label]) => `<option value="${value}">${escapeHtml(label)}</option>`).join("")}`;
}

function showDialog(title, subtitle, body, wide = false) {
  const dialog = document.querySelector("#app-dialog");
  dialog.classList.toggle("dialog-wide", wide);
  document.querySelector("#dialog-content").innerHTML = `
    <div class="dialog-head"><div><h2 id="dialog-title">${escapeHtml(title)}</h2><p>${escapeHtml(subtitle)}</p></div><button class="dialog-close" type="button" data-action="close-dialog" aria-label="Cerrar">×</button></div>
    <div class="dialog-body">${body}</div>`;
  if (!dialog.open) dialog.showModal();
}

function closeDialog() {
  document.querySelector("#app-dialog").close();
}

function openClientForm() {
  showDialog("Registrar cliente", "Guarda solo los datos necesarios para elaborar documentos y dar seguimiento.", `
    <form id="client-form">
      <div class="form-grid">
        <div class="field"><label for="client-name">Nombre o razón social *</label><input id="client-name" name="name" required autocomplete="name"></div>
        <div class="field"><label for="client-organization">Institución / organización</label><input id="client-organization" name="organization" autocomplete="organization"></div>
        <div class="field"><label for="client-phone">Teléfono</label><input id="client-phone" name="phone" inputmode="tel" autocomplete="tel"></div>
        <div class="field"><label for="client-email">Correo electrónico</label><input id="client-email" name="email" type="email" autocomplete="email"></div>
        <div class="field field-wide"><label for="client-address">Dirección</label><input id="client-address" name="address" autocomplete="street-address"></div>
      </div>
      <div class="form-footer"><span class="form-footer-note">Registra al menos un teléfono o correo.</span><div class="form-footer-actions"><button class="button button-quiet" type="button" data-action="close-dialog">Cancelar</button><button class="button button-primary" type="submit">Guardar cliente</button></div></div>
    </form>`);
  document.querySelector("#client-name").focus();
}

function openProposalForm() {
  if (!store.clients.length) {
    showDialog("Primero registra un cliente", "Cada propuesta económica debe pertenecer a un cliente.", `<div class="empty-state"><div class="empty-state-inner"><span class="empty-symbol">◉</span><h3>Tu primer paso es crear su ficha</h3><p>Luego podrás preparar una propuesta económica asociada a ese cliente.</p><button class="button button-primary" type="button" data-action="new-client">＋ Registrar cliente</button></div></div>`);
    return;
  }
  const clientOptions = store.clients.map(client => `<option value="${client.id}">${escapeHtml(client.name)}${client.organization ? ` · ${escapeHtml(client.organization)}` : ""}</option>`).join("");
  const serviceOptions = ["Mantenimiento y soporte", "Repuestos y tecnología", "Redes y conectividad", "Capacitación tecnológica", "Soluciones web", "Otro"];
  showDialog("Nueva propuesta económica", "Describe el alcance y agrega los conceptos que presentarás al cliente.", `
    <form id="proposal-form">
      <div class="form-grid">
        <div class="field"><label for="proposal-client">Cliente *</label><select id="proposal-client" name="clientId" required><option value="">Seleccionar cliente</option>${clientOptions}</select></div>
        <div class="field"><label for="proposal-service">Tipo de servicio *</label><select id="proposal-service" name="serviceType" required><option value="">Seleccionar servicio</option>${serviceOptions.map(service => `<option>${escapeHtml(service)}</option>`).join("")}</select></div>
        <div class="field"><label for="proposal-date">Fecha de emisión *</label><input id="proposal-date" name="issuedOn" type="date" value="${today()}" required></div>
        <div class="field"><label for="proposal-expiry">Válida hasta</label><input id="proposal-expiry" name="validUntil" type="date"></div>
        <div class="field field-wide"><label for="proposal-description">Alcance / necesidad del cliente *</label><textarea id="proposal-description" name="description" required placeholder="Describe qué solicita y qué incluye el trabajo propuesto."></textarea></div>
      </div>
      <div class="form-section">
        <div class="form-section-title"><h3>CONCEPTOS ECONÓMICOS</h3><button class="button button-quiet button-small" type="button" data-action="add-line">＋ Agregar concepto</button></div>
        <div class="line-item-head"><span>DESCRIPCIÓN</span><span>CANT.</span><span>VALOR UNITARIO</span><span></span></div>
        <div id="proposal-lines" class="line-items">${proposalLineRow()}</div>
        <div class="proposal-total"><span>Total propuesto</span><strong id="proposal-total">$ 0</strong></div>
      </div>
      <div class="form-section"><div class="field"><label for="proposal-terms">Condiciones / forma de pago</label><textarea id="proposal-terms" name="terms" placeholder="Ej.: 50% al aprobar la propuesta y saldo contra entrega."></textarea></div></div>
      <div class="form-footer"><span class="form-footer-note">Se guardará como borrador; la impresión no la marca como enviada.</span><div class="form-footer-actions"><button class="button button-quiet" type="button" data-action="close-dialog">Cancelar</button><button class="button button-primary" type="submit">Guardar propuesta</button></div></div>
    </form>`, true);
  updateProposalFormTotal();
}

function proposalLineRow() {
  return `<div class="line-item" data-line><input name="item-description" aria-label="Descripción del concepto" placeholder="Ej.: Mantenimiento preventivo" required><input name="item-quantity" aria-label="Cantidad" type="number" min="0.01" step="0.01" value="1" required><input name="item-price" aria-label="Valor unitario en pesos" type="number" min="0" step="1000" placeholder="0" required><button class="line-remove" type="button" data-action="remove-line" aria-label="Eliminar concepto">×</button></div>`;
}

function updateProposalFormTotal() {
  const totalElement = document.querySelector("#proposal-total");
  if (!totalElement) return;
  const total = [...document.querySelectorAll("[data-line]")].reduce((sum, row) => {
    const quantity = Number(row.querySelector("[name='item-quantity']").value) || 0;
    const price = Number(row.querySelector("[name='item-price']").value) || 0;
    return sum + Math.round(quantity * price);
  }, 0);
  totalElement.textContent = money(total);
}

function saveClient(form) {
  const formData = new FormData(form);
  const phone = String(formData.get("phone") || "").trim();
  const email = String(formData.get("email") || "").trim();
  if (!phone && !email) {
    showToast("Registra al menos un teléfono o correo.", true);
    return;
  }
  const client = {
    id: nextId(),
    name: String(formData.get("name") || "").trim(),
    organization: String(formData.get("organization") || "").trim(),
    phone,
    email,
    address: String(formData.get("address") || "").trim(),
    createdAt: new Date().toISOString(),
  };
  store.clients.push(client);
  if (saveStore()) {
    closeDialog();
    renderView();
    showToast("Cliente guardado en este navegador.");
  }
}

function saveProposal(form) {
  const formData = new FormData(form);
  const items = [...form.querySelectorAll("[data-line]")].map(row => ({
    description: row.querySelector("[name='item-description']").value.trim(),
    quantity: Number(row.querySelector("[name='item-quantity']").value),
    unitPrice: Number(row.querySelector("[name='item-price']").value),
  }));
  if (items.some(item => !item.description || item.quantity <= 0 || item.unitPrice < 0)) {
    showToast("Revisa la descripción, cantidad y valor de cada concepto.", true);
    return;
  }
  const proposal = {
    id: nextId(),
    number: nextNumber("PE", store.proposals),
    clientId: Number(formData.get("clientId")),
    serviceType: String(formData.get("serviceType") || ""),
    description: String(formData.get("description") || "").trim(),
    issuedOn: String(formData.get("issuedOn") || today()),
    validUntil: String(formData.get("validUntil") || ""),
    terms: String(formData.get("terms") || "").trim(),
    state: "draft",
    approvedAt: "",
    createdAt: new Date().toISOString(),
    items,
  };
  store.proposals.push(proposal);
  if (saveStore()) {
    closeDialog();
    renderView();
    showToast(`${proposal.number} guardada como borrador.`);
  }
}

function approveProposal(proposal) {
  if (!proposal || !["draft", "sent"].includes(proposal.state)) return;
  proposal.state = "approved";
  proposal.approvedAt = new Date().toISOString();
  const order = {
    id: nextId(),
    number: nextNumber("OS", store.orders),
    proposalId: proposal.id,
    clientId: proposal.clientId,
    state: "pending",
    diagnosis: "",
    workDone: "",
    holdReason: "",
    receivedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    closedAt: "",
    history: [{ state: "pending", note: "Orden creada al aprobar la propuesta.", changedAt: new Date().toISOString() }],
  };
  store.orders.push(order);
  if (saveStore()) {
    closeDialog();
    renderView();
    showToast(`${proposal.number} aprobada. Se creó ${order.number}.`);
  }
}

function transitionProposal(proposal, newState) {
  if (!proposal) return;
  if (newState === "approved") {
    approveProposal(proposal);
    return;
  }
  if (!["sent", "rejected"].includes(newState) || !["draft", "sent"].includes(proposal.state)) return;
  proposal.state = newState;
  proposal.updatedAt = new Date().toISOString();
  if (saveStore()) {
    closeDialog();
    renderView();
    showToast(`${proposal.number}: ${proposalStateLabels[newState].toLowerCase()}.`);
  }
}

function openProposalDetail(proposalId) {
  const proposal = getProposal(proposalId);
  if (!proposal) return;
  const client = getClient(proposal.clientId);
  const order = store.orders.find(item => item.proposalId === proposal.id);
  const lines = proposal.items.map(item => `<tr><td>${escapeHtml(item.description)}</td><td>${escapeHtml(item.quantity)}</td><td>${escapeHtml(money(item.unitPrice))}</td><td>${escapeHtml(money(Math.round(item.quantity * item.unitPrice)))}</td></tr>`).join("");
  let actions = `<button class="button button-quiet" type="button" data-action="print-proposal" data-id="${proposal.id}">Imprimir</button>`;
  if (proposal.state === "draft") actions += `<button class="button button-quiet" type="button" data-action="proposal-transition" data-state="sent" data-id="${proposal.id}">Marcar enviada</button>`;
  if (["draft", "sent"].includes(proposal.state)) {
    actions += `<button class="button button-danger button-small" type="button" data-action="proposal-transition" data-state="rejected" data-id="${proposal.id}">Rechazada</button>`;
    actions += `<button class="button button-accent" type="button" data-action="proposal-transition" data-state="approved" data-id="${proposal.id}">Registrar visto bueno</button>`;
  }
  const body = `<div class="callout">La aprobación registra el visto bueno e inicia el trabajo. La orden se crea automáticamente y solo una vez.</div>
    <div class="detail-grid"><div class="detail-item"><small>CLIENTE</small><strong>${escapeHtml(client?.name || "")}</strong></div><div class="detail-item"><small>ESTADO</small><strong>${statusBadge(proposal.state, proposalStateLabels)}</strong></div><div class="detail-item"><small>TIPO DE SERVICIO</small><strong>${escapeHtml(proposal.serviceType)}</strong></div><div class="detail-item"><small>FECHA / VIGENCIA</small><strong>${escapeHtml(dateLabel(proposal.issuedOn))}${proposal.validUntil ? ` · Hasta ${escapeHtml(dateLabel(proposal.validUntil))}` : ""}</strong></div><div class="detail-item detail-wide"><small>ALCANCE</small><strong>${escapeHtml(proposal.description)}</strong></div>${proposal.approvedAt ? `<div class="detail-item detail-wide"><small>VISTO BUENO REGISTRADO</small><strong>${escapeHtml(dateLabel(proposal.approvedAt, true))}</strong></div>` : ""}${order ? `<div class="detail-item detail-wide"><small>ORDEN GENERADA</small><strong>${escapeHtml(order.number)} · ${escapeHtml(orderStateLabels[order.state])}</strong></div>` : ""}</div>
    <div class="table-wrap"><table class="document-table"><thead><tr><th>Concepto</th><th>Cant.</th><th>Valor unitario</th><th>Subtotal</th></tr></thead><tbody>${lines}</tbody></table></div>
    <div class="proposal-total"><span>Total propuesto</span><strong>${escapeHtml(money(proposalTotal(proposal)))}</strong></div>${proposal.terms ? `<div class="detail-block"><h3>CONDICIONES</h3><div class="detail-item"><strong>${escapeHtml(proposal.terms)}</strong></div></div>` : ""}
    <div class="form-footer"><span class="form-footer-note">${escapeHtml(proposal.number)}</span><div class="form-footer-actions">${actions}<button class="button button-quiet" type="button" data-action="close-dialog">Cerrar</button></div></div>`;
  showDialog(proposal.number, "Propuesta económica", body, true);
}

function orderTransitions(state) {
  const transitions = {
    pending: ["in_progress", "on_hold", "cancelled"],
    in_progress: ["on_hold", "completed", "cancelled"],
    on_hold: ["in_progress", "cancelled"],
    completed: ["delivered"],
    delivered: [],
    cancelled: [],
  };
  return transitions[state] || [];
}

function openOrderDetail(orderId) {
  const order = getOrder(orderId);
  if (!order) return;
  const proposal = getProposal(order.proposalId);
  const client = getClient(order.clientId);
  const account = store.accounts.find(item => item.orderId === order.id);
  const transitionOptions = [order.state, ...orderTransitions(order.state)].map(state => `<option value="${state}"${order.state === state ? " selected" : ""}>${escapeHtml(orderStateLabels[state])}</option>`).join("");
  const history = [...(order.history || [])].reverse().map(entry => `<div class="history-row"><span class="history-mark"></span><span><strong>${escapeHtml(orderStateLabels[entry.state] || entry.state)}</strong><small>${escapeHtml(entry.note || "Cambio de estado")}</small></span><time>${escapeHtml(dateLabel(entry.changedAt, true))}</time></div>`).join("");
  const body = `<div class="detail-grid"><div class="detail-item"><small>CLIENTE</small><strong>${escapeHtml(client?.name || "")}</strong></div><div class="detail-item"><small>PROPUESTA DE ORIGEN</small><strong>${escapeHtml(proposal?.number || "")}</strong></div><div class="detail-item"><small>SERVICIO</small><strong>${escapeHtml(proposal?.serviceType || "")}</strong></div><div class="detail-item"><small>VALOR APROBADO</small><strong>${escapeHtml(money(proposal ? proposalTotal(proposal) : 0))}</strong></div><div class="detail-item detail-wide"><small>ALCANCE AUTORIZADO</small><strong>${escapeHtml(proposal?.description || "")}</strong></div></div>
    <form id="order-form" data-id="${order.id}">
      <div class="form-grid"><div class="field"><label for="order-state">Estado del trabajo *</label><select id="order-state" name="state">${transitionOptions}</select></div><div class="field"><label for="order-hold-reason">Motivo de espera</label><input id="order-hold-reason" name="holdReason" value="${escapeHtml(order.holdReason)}" placeholder="Repuesto, respuesta del cliente..."></div><div class="field field-wide"><label for="order-diagnosis">Diagnóstico</label><textarea id="order-diagnosis" name="diagnosis" placeholder="Qué encontraste al revisar el caso">${escapeHtml(order.diagnosis)}</textarea></div><div class="field field-wide"><label for="order-work">Trabajo realizado</label><textarea id="order-work" name="workDone" placeholder="Describe las acciones realizadas">${escapeHtml(order.workDone)}</textarea></div><div class="field field-wide"><label for="order-note">Nota para el historial</label><input id="order-note" name="note" placeholder="Opcional: deja constancia del cambio"></div></div>
      <div class="form-footer"><span class="form-footer-note">${escapeHtml(order.number)} · ${statusBadge(order.state, orderStateLabels)}</span><div class="form-footer-actions"><button class="button button-quiet" type="button" data-action="close-dialog">Cerrar</button><button class="button button-primary" type="submit">Guardar avance</button></div></div>
    </form>
    <div class="detail-block"><h3>HISTORIAL DEL TRABAJO</h3><div class="history-list">${history || emptyInline("Sin movimientos.")}</div></div>
    ${order.state === "completed" || order.state === "delivered" ? `<div class="form-footer"><span class="form-footer-note">${account ? `Cuenta ${escapeHtml(account.number)} · ${escapeHtml(accountStateLabels[account.state])}` : "El trabajo está terminado; ya puedes emitir la cuenta de cobro."}</span><div class="form-footer-actions">${account ? `<button class="button button-quiet" type="button" data-action="print-account" data-id="${account.id}">Imprimir cuenta</button>` : `<button class="button button-accent" type="button" data-action="create-account" data-id="${order.id}">＋ Generar cuenta de cobro</button>`}</div></div>` : ""}`;
  showDialog(order.number, "Orden de servicio · seguimiento de ejecución", body, true);
}

function saveOrder(form) {
  const order = getOrder(form.dataset.id);
  if (!order) return;
  const formData = new FormData(form);
  const newState = String(formData.get("state"));
  const holdReason = String(formData.get("holdReason") || "").trim();
  if (newState === "on_hold" && !holdReason) {
    showToast("Indica por qué queda en espera.", true);
    return;
  }
  if (newState !== order.state && !orderTransitions(order.state).includes(newState)) {
    showToast("Ese cambio de estado no está permitido.", true);
    return;
  }
  const changedAt = new Date().toISOString();
  order.diagnosis = String(formData.get("diagnosis") || "").trim();
  order.workDone = String(formData.get("workDone") || "").trim();
  order.holdReason = holdReason;
  order.updatedAt = changedAt;
  if (newState !== order.state) {
    order.history ||= [];
    order.history.push({
      state: newState,
      note: String(formData.get("note") || "").trim() || holdReason || `Estado actualizado a ${orderStateLabels[newState]}.`,
      changedAt,
    });
    order.state = newState;
    if (["completed", "delivered", "cancelled"].includes(newState)) order.closedAt = changedAt;
  }
  if (saveStore()) {
    closeDialog();
    renderView();
    showToast(`${order.number} actualizado.`);
  }
}

function createAccount(orderId) {
  const order = getOrder(orderId);
  if (!order || !["completed", "delivered"].includes(order.state)) {
    showToast("Termina el trabajo antes de generar la cuenta.", true);
    return;
  }
  if (store.accounts.some(account => account.orderId === order.id)) {
    showToast("Esta orden ya tiene una cuenta de cobro.", true);
    return;
  }
  const account = {
    id: nextId(),
    number: nextNumber("CC", store.accounts),
    orderId: order.id,
    issuedAt: new Date().toISOString(),
    state: "issued",
    paymentNote: "",
  };
  store.accounts.push(account);
  if (saveStore()) {
    closeDialog();
    renderView();
    showToast(`${account.number} emitida.`);
  }
}

function markAccountPaid(accountId) {
  const account = getAccount(accountId);
  if (!account || account.state === "paid") return;
  if (!window.confirm("¿Confirmas que registraste el pago de esta cuenta? Esto solo guarda el estado; no procesa dinero.")) return;
  account.state = "paid";
  account.paymentNote = "Marcada manualmente como pagada.";
  if (saveStore()) {
    renderView();
    showToast(`${account.number} marcada como pagada.`);
  }
}

function openSettings() {
  const business = store.business;
  showDialog("Datos de emisión", "Aparecerán en los documentos imprimibles. Completa solo información ficticia en esta demo.", `
    <form id="settings-form"><div class="form-grid">
      <div class="field field-wide"><label for="business-name">Nombre comercial *</label><input id="business-name" name="name" value="${escapeHtml(business.name)}" required></div>
      <div class="field"><label for="business-representative">Responsable</label><input id="business-representative" name="representative" value="${escapeHtml(business.representative)}"></div>
      <div class="field"><label for="business-id">NIT / identificación</label><input id="business-id" name="identification" value="${escapeHtml(business.identification)}"></div>
      <div class="field"><label for="business-phone">Teléfono</label><input id="business-phone" name="phone" value="${escapeHtml(business.phone)}"></div>
      <div class="field"><label for="business-email">Correo</label><input id="business-email" name="email" type="email" value="${escapeHtml(business.email)}"></div>
      <div class="field field-wide"><label for="business-address">Dirección / ciudad</label><input id="business-address" name="address" value="${escapeHtml(business.address)}"></div>
    </div><div class="form-footer"><button class="button button-danger button-small" type="button" data-action="reset-data">Borrar datos de demostración</button><div class="form-footer-actions"><button class="button button-quiet" type="button" data-action="close-dialog">Cancelar</button><button class="button button-primary" type="submit">Guardar datos</button></div></div></form>`);
}

function saveSettings(form) {
  const formData = new FormData(form);
  store.business = Object.fromEntries(["name", "representative", "identification", "phone", "email", "address"].map(key => [key, String(formData.get(key) || "").trim()]));
  if (saveStore()) {
    closeDialog();
    showToast("Datos de emisión actualizados.");
  }
}

function clientHistory(clientId) {
  const client = getClient(clientId);
  if (!client) return;
  const proposals = store.proposals.filter(proposal => proposal.clientId === client.id);
  const orders = store.orders.filter(order => order.clientId === client.id);
  const accounts = store.accounts.filter(account => orders.some(order => order.id === account.orderId));
  const historyLines = [
    ...proposals.map(proposal => ({ type: "Propuesta", number: proposal.number, state: proposalStateLabels[proposal.state], date: proposal.createdAt })),
    ...orders.map(order => ({ type: "Orden de servicio", number: order.number, state: orderStateLabels[order.state], date: order.updatedAt })),
    ...accounts.map(account => ({ type: "Cuenta de cobro", number: account.number, state: accountStateLabels[account.state], date: account.issuedAt })),
  ].sort((first, second) => new Date(second.date) - new Date(first.date));
  const items = historyLines.length ? historyLines.map(item => `<div class="history-row"><span class="history-mark"></span><span><strong>${escapeHtml(item.number)} · ${escapeHtml(item.type)}</strong><small>${escapeHtml(item.state)}</small></span><time>${escapeHtml(dateLabel(item.date))}</time></div>`).join("") : emptyInline("Este cliente aún no tiene documentos.");
  showDialog(client.name, client.organization || "Historial del cliente", `<div class="detail-grid"><div class="detail-item"><small>TELÉFONO</small><strong>${escapeHtml(client.phone || "—")}</strong></div><div class="detail-item"><small>CORREO</small><strong>${escapeHtml(client.email || "—")}</strong></div><div class="detail-item detail-wide"><small>DIRECCIÓN</small><strong>${escapeHtml(client.address || "—")}</strong></div></div><div class="detail-block"><h3>PROPUESTAS · ÓRDENES · CUENTAS</h3><div class="history-list">${items}</div></div><div class="form-footer"><span class="form-footer-note">${historyLines.length} documento(s)</span><button class="button button-quiet" type="button" data-action="close-dialog">Cerrar</button></div>`);
}

function documentHeader(number, type, date, client) {
  const business = store.business;
  const issuerContact = [business.identification ? `NIT/ID: ${business.identification}` : "", business.phone, business.email, business.address].filter(Boolean).map(escapeHtml).join(" · ");
  const clientContact = [client.phone, client.email, client.address].filter(Boolean).map(escapeHtml).join(" · ");
  return `<div class="document-topline"><div class="document-brand"><h2>${escapeHtml(business.name || "Tienda Digital Colombia")}</h2><p>${escapeHtml(business.representative || "Servicios tecnológicos")}</p><p>${issuerContact || "Lorica, Córdoba"}</p></div><div class="document-meta"><strong>${escapeHtml(number)}</strong><p>${escapeHtml(dateLabel(date))}</p><p>${escapeHtml(type)}</p></div></div><div class="document-client"><h3>CLIENTE</h3><p><strong>${escapeHtml(client.name)}</strong>${client.organization ? ` · ${escapeHtml(client.organization)}` : ""}</p><p>${clientContact || ""}</p></div>`;
}

function printProposal(proposalId) {
  const proposal = getProposal(proposalId);
  const client = proposal && getClient(proposal.clientId);
  if (!proposal || !client) return;
  const rows = proposal.items.map(item => `<tr><td>${escapeHtml(item.description)}</td><td>${escapeHtml(item.quantity)}</td><td>${escapeHtml(money(item.unitPrice))}</td><td>${escapeHtml(money(Math.round(item.quantity * item.unitPrice)))}</td></tr>`).join("");
  const documentBody = `${documentHeader(proposal.number, "PROPUESTA ECONÓMICA", proposal.issuedOn, client)}<h1 class="document-title">Propuesta económica</h1><p class="document-intro">Tipo de servicio: ${escapeHtml(proposal.serviceType)}${proposal.validUntil ? ` · Válida hasta ${escapeHtml(dateLabel(proposal.validUntil))}` : ""}</p><p>${escapeHtml(proposal.description)}</p><table class="document-table"><thead><tr><th>Descripción</th><th>Cant.</th><th>Valor unitario</th><th>Subtotal</th></tr></thead><tbody>${rows}</tbody></table><div class="document-total"><span>TOTAL PROPUESTO</span><strong>${escapeHtml(money(proposalTotal(proposal)))}</strong></div>${proposal.terms ? `<div class="document-terms"><strong>Condiciones</strong><br>${escapeHtml(proposal.terms)}</div>` : ""}<div class="document-signature"><div class="signature-line">Elaboró · ${escapeHtml(store.business.representative || store.business.name)}</div><div class="signature-line">Aprobación del cliente · Nombre y fecha</div></div><p class="document-disclaimer">Propuesta económica para presentación comercial. No es factura ni cuenta de cobro.</p>`;
  openPrintPreview(proposal.number, documentBody);
}

function printAccount(accountId) {
  const account = getAccount(accountId);
  const order = account && getOrder(account.orderId);
  const proposal = order && getProposal(order.proposalId);
  const client = order && getClient(order.clientId);
  if (!account || !order || !proposal || !client) return;
  const rows = proposal.items.map(item => `<tr><td>${escapeHtml(item.description)}</td><td>${escapeHtml(item.quantity)}</td><td>${escapeHtml(money(item.unitPrice))}</td><td>${escapeHtml(money(Math.round(item.quantity * item.unitPrice)))}</td></tr>`).join("");
  const documentBody = `${documentHeader(account.number, "CUENTA DE COBRO", account.issuedAt, client)}<h1 class="document-title">Cuenta de cobro</h1><p class="document-intro">Por concepto de servicio tecnológico realizado · Orden ${escapeHtml(order.number)}</p><table class="document-table"><thead><tr><th>Descripción</th><th>Cant.</th><th>Valor unitario</th><th>Subtotal</th></tr></thead><tbody>${rows}</tbody></table><div class="document-total"><span>VALOR A COBRAR</span><strong>${escapeHtml(money(proposalTotal(proposal)))}</strong></div><div class="document-terms">Favor realizar el pago según lo acordado con el prestador del servicio.<br>Referencia de propuesta: ${escapeHtml(proposal.number)}</div><div class="document-signature"><div class="signature-line">Firma del prestador · ${escapeHtml(store.business.representative || store.business.name)}</div><div class="signature-line">Recibido por · Nombre, identificación y fecha</div></div><p class="document-disclaimer">Documento de cobro para control y presentación. No es factura electrónica ni acredita obligaciones tributarias.</p>`;
  openPrintPreview(account.number, documentBody);
}

function openPrintPreview(number, content) {
  showDialog(`Vista previa · ${number}`, "Revisa el documento antes de imprimir o guardarlo como PDF.", `<main id="print-document"><div class="document-toolbar"><button class="button button-primary" type="button" data-action="print-now">Imprimir / Guardar PDF</button></div><article class="document-paper">${content}</article></main>`, true);
}

function loadDemoData() {
  if (store.clients.length || store.proposals.length || store.orders.length) {
    showToast("El recorrido de ejemplo se carga en un espacio vacío. Borra los registros de muestra para reiniciarlo.", true);
    return;
  }
  if (!window.confirm("Se cargarán registros ficticios para recorrer el flujo. No contienen información de clientes reales. ¿Continuar?")) return;
  const stamp = new Date().toISOString();
  const demoClient = {
    id: nextId(), name: "Cliente de demostración", organization: "Institución de ejemplo",
    phone: "", email: "demo@example.invalid", address: "Lorica, Córdoba", createdAt: stamp,
  };
  store.clients.push(demoClient);
  const proposalExamples = [
    { serviceType: "Mantenimiento y soporte", description: "Mantenimiento preventivo de equipos de cómputo.", state: "sent", items: [{ description: "Mantenimiento preventivo por equipo", quantity: 5, unitPrice: 80000 }] },
    { serviceType: "Redes y conectividad", description: "Diagnóstico y organización de conectividad de red.", state: "approved", items: [{ description: "Diagnóstico y configuración de red", quantity: 1, unitPrice: 380000 }] },
    { serviceType: "Capacitación tecnológica", description: "Jornada de formación en herramientas digitales.", state: "approved", items: [{ description: "Jornada de capacitación", quantity: 1, unitPrice: 250000 }] },
  ];
  proposalExamples.forEach((example, index) => {
    const proposal = {
      id: nextId(), number: nextNumber("PE", store.proposals), clientId: demoClient.id,
      serviceType: example.serviceType, description: example.description,
      issuedOn: today(), validUntil: "", terms: "Registro ficticio para demostración.",
      state: example.state, approvedAt: example.state === "approved" ? stamp : "",
      createdAt: new Date(Date.now() - index * 3600000).toISOString(), items: example.items,
    };
    store.proposals.push(proposal);
    if (example.state === "approved") {
      const completed = index === 2;
      const order = {
        id: nextId(), number: nextNumber("OS", store.orders), proposalId: proposal.id,
        clientId: demoClient.id, state: completed ? "completed" : "in_progress",
        diagnosis: "Ejemplo demostrativo.", workDone: completed ? "Jornada realizada según lo acordado." : "Revisión inicial y coordinación de la actividad.",
        holdReason: "", receivedAt: stamp, updatedAt: stamp, closedAt: completed ? stamp : "",
        history: [
          { state: "pending", note: "Orden creada al aprobar la propuesta.", changedAt: stamp },
          { state: completed ? "completed" : "in_progress", note: "Movimiento de ejemplo.", changedAt: stamp },
        ],
      };
      store.orders.push(order);
      if (completed) {
        store.accounts.push({ id: nextId(), number: nextNumber("CC", store.accounts), orderId: order.id, issuedAt: stamp, state: "issued", paymentNote: "" });
      }
    }
  });
  if (saveStore()) {
    renderView();
    showToast("Recorrido ficticio cargado: propuesta, orden activa y cuenta emitida.");
  }
}

function resetLocalData() {
  if (!window.confirm("Esto borrará los clientes y documentos guardados en este navegador. No se puede deshacer. ¿Continuar?")) return;
  store = emptyState();
  saveStore();
  closeDialog();
  renderView();
  showToast("Registros locales eliminados.");
}

document.addEventListener("click", event => {
  const viewButton = event.target.closest("[data-view]");
  if (viewButton) {
    setView(viewButton.dataset.view);
    return;
  }

  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) return;
  const { action, id, state } = actionButton.dataset;
  if (action === "new-client") openClientForm();
  if (action === "new-proposal") openProposalForm();
  if (action === "close-dialog") closeDialog();
  if (action === "settings") openSettings();
  if (action === "proposal-detail") openProposalDetail(id);
  if (action === "proposal-transition") transitionProposal(getProposal(id), state);
  if (action === "order-detail") openOrderDetail(id);
  if (action === "create-account") createAccount(Number(id));
  if (action === "print-proposal") printProposal(Number(id));
  if (action === "print-account") printAccount(Number(id));
  if (action === "print-now") window.print();
  if (action === "mark-paid") markAccountPaid(Number(id));
  if (action === "client-detail") clientHistory(Number(id));
  if (action === "load-demo") loadDemoData();
  if (action === "dismiss-notice") {
    store.noticeDismissed = true;
    saveStore();
    document.querySelector(".local-notice").classList.add("is-dismissed");
  }
  if (action === "add-line") {
    document.querySelector("#proposal-lines").insertAdjacentHTML("beforeend", proposalLineRow());
    updateProposalFormTotal();
  }
  if (action === "remove-line") {
    const rows = document.querySelectorAll("[data-line]");
    if (rows.length <= 1) {
      showToast("La propuesta requiere al menos un concepto.", true);
      return;
    }
    actionButton.closest("[data-line]").remove();
    updateProposalFormTotal();
  }
  if (action === "reset-data") resetLocalData();
});

document.addEventListener("submit", event => {
  event.preventDefault();
  if (event.target.id === "client-form") saveClient(event.target);
  if (event.target.id === "proposal-form") saveProposal(event.target);
  if (event.target.id === "order-form") saveOrder(event.target);
  if (event.target.id === "settings-form") saveSettings(event.target);
});

document.addEventListener("input", event => {
  if (event.target.closest("#proposal-form")) updateProposalFormTotal();
  if (event.target.matches("[data-search]")) applyTableFilters();
});

document.addEventListener("change", event => {
  if (event.target.matches("[data-filter]")) applyTableFilters();
});

document.querySelector("#app-dialog").addEventListener("click", event => {
  if (event.target === event.currentTarget) closeDialog();
});

function applyTableFilters() {
  const query = (document.querySelector("[data-search]")?.value || "").trim().toLocaleLowerCase("es");
  const selectedState = document.querySelector("[data-filter]")?.value || "";
  document.querySelectorAll("[data-filterable-list] tr[data-search-text]").forEach(row => {
    const matchesText = row.dataset.searchText.includes(query);
    const matchesState = !selectedState || row.dataset.state === selectedState;
    row.hidden = !(matchesText && matchesState);
  });
}

renderView();