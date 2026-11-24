(() => {
"use strict";

const { ACTORS, CONVENTIONS, DOCUMENTS, ESTABLISHMENTS, FAQ, JOBS, MAP_EDGES, MAP_NODES, MEETINGS, NAV, RESEARCH_AREAS, SOFTWARES, SOURCES, QUALITY_TOOLS, ADVERSE_EVENTS, SUPPORT_JOBS, REX_GUIDE, HEALTH_POLICY, SAMPLE_PEERS, AUDIT_GUIDE, SECURITY_SOCIALE, PRICING_DATA, TIMELINE_POSTS, SAMPLE_NOTIFICATIONS, RH_LEAVE_TYPES, RH_THERAPEUTIC_PART_TIME, RH_PLANNING_CHANGE, RH_INTERNS_APPRENTICES, ARS_INSPECTION_GUIDE, MANAGEMENT_TRANSITION_GUIDE, GLOSSARY_TERMS, ERP_SECURITY_GUIDE, CONFORMITY_VISIT_GUIDE, MATERIOVIGILANCE_GUIDE, SIRENA_SYSTEM_GUIDE, NAPIR_LIBERTY_GUIDE, DIRECTOR_PENAL_RESPONSIBILITY_GUIDE } = window.MOSAQUE_DATA;

window.MOSAQUE_FLASHCARDS?.configure({
  data: window.MOSAQUE_DATA,
  esc,
  icon,
  isPremiumUnlocked,
  paywallGate,
  onLocked: () => showToast("Les flashcards PDF sont réservées aux abonnés Premium."),
  onError: message => showToast(message),
  onSaved: (cards, pages) => showToast(`${cards} cartes exportées · ${pages} pages.`)
});

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const stage = $("#page-stage");
const sidebar = $("#sidebar");
const mobileMenuQuery = matchMedia("(max-width: 900px)");
const dialog = $("#app-dialog");
const dialogContent = $("#dialog-content");
const dialogKicker = $("#dialog-kicker");
const toastEl = $("#toast");
const STORE = { theme:"mosaique-theme", favorites:"mosaique-favorites", checks:"mosaique-doc-checks", peers:"mosaique-peers", auth:"mosaique-auth", posts:"mosaique-posts", rsvps:"mosaique-rsvps", notifs:"mosaique-notifs", premiumCode:"mosaique-premium-code" };
const ONBOARDING_KEY = "mosaique-onboarding-uid";
let authFlowPending = false;
let pendingAuthState = null;
let pendingOnboardingUid = null;
let authMessage = "";
let unlockRequested = false;
let unlockTimer = 0;
let unlockState = null;
const pageLoadTime = Date.now();
const selectedPageThemes = {};
const resultPages = {};
const contentAnimations = new Set();
let navigationIndex = Number.isInteger(history.state?.navigationIndex) ? history.state.navigationIndex : 0;
let mapRuntime = null;
let mapClickSuppressionUntil = 0;
let mapAdjustmentTimer = 0;
let dialogAnimation = null;
let dialogHistoryActive = false;
let activeDialog = null;
let routedHash = window.location.hash;
const pageScrollPositions = new Map();
const accordionAnimations = new WeakMap();
const MAP_DEPTHS = { personne:35, direction:110, equipes:-70, cvscse:-30, projet:-110, duerp:25, eprd:115, has:-140, ars:20, departement:100, mdph:-95, cnsa:145, anap:-35, copil:155 };

function createInitialMapPositions() {
  return Object.fromEntries(MAP_NODES.map(node => [node.id, {
    x:(node.x - 500) * .82,
    y:(320 - node.y) * .82,
    z:MAP_DEPTHS[node.id] || 0
  }]));
}

const state = {
  page: "accueil",
  filters: { establishments:"Tout", jobs:"Tout", meetings:"Tout", documents:"Tout", actors:"Tout", supportJobs:"Tout", qualityTools:"Tout", laws:"Tout" },
  queries: { establishments:"", jobs:"", meetings:"", documents:"", actors:"", faq:"", software:"", peers:"", supportJobs:"", qualityTools:"", laws:"", flashcards:"", glossary:"" },
  glossaryCategory: "Tout",
  glossaryLetter: "Tout",
  favorites: readJSON(STORE.favorites, []),
  docChecks: readJSON(STORE.checks, {}),
  peers: readJSON(STORE.peers, []),
  mapFilter: "Tout",
  auth: readJSON(STORE.auth, { isUnlocked:false, verifiedPaid:false, plan:"freemium", role:"visiteur" }),
  posts: readJSON(STORE.posts, []),
  rsvps: readJSON(STORE.rsvps, {}),
  notifs: (() => {
    const raw = readJSON(STORE.notifs, []);
    const seen = new Set();
    return (Array.isArray(raw) ? raw : []).filter(n => {
      if (!n || !n.id || seen.has(n.id)) return false;
      seen.add(n.id);
      return true;
    });
  })(),
  editingPeerId: null,
  onboarding: false,
  highlightPeerId: null,
  openComments: new Set(),  notifsOpen: false,
  timelineComposeType: "job_offer",
  selectedMapNode: "direction",
  mapPositions: createInitialMapPositions(),
  mapRotation: { x:8, y:352, z:0 },
  mapPerspective: 1050,
  mapSceneDepth: 0,
  mapZoom: 1,
  mapZoomAuto: true,
  mapDetailsOpen: undefined,
  mapPan: { x:0, y:0 },
  mapGesture: "rotate",
  flashDeck: "etablissements",
  flashStudyMode: false,
  flashRevealed: new Set(),
  toastTimer: 0
};

function isPremiumUnlocked() {
  return Boolean(state.auth?.isUnlocked === true && state.auth?.verifiedPaid === true);
}

function lockAppFreemium() {
  state.auth = {
    isUnlocked: false,
    verifiedPaid: false,
    plan: "freemium",
    lockedAt: new Date().toISOString()
  };
  writeJSON(STORE.auth, state.auth);
  showToast("Mode Freemium (55% des données) activé pour test.");
  renderPage(state.page);
}

function renderAccessStatusBar() {
  const isUnlocked = isPremiumUnlocked();
  return `<div class="access-status-bar ${isUnlocked ? '' : 'is-freemium'}">
    <div style="display:flex;align-items:center;gap:8px">
      <span>${icon(isUnlocked ? "spark" : "shield", 16)}</span>
      <strong>Statut d'accès :</strong>
      <span class="tag ${isUnlocked ? 'mint' : 'gold'}">${isUnlocked ? '👑 Accès Intégral Partenaire Actif' : 'Mode Découverte Libre'}</span>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      ${isUnlocked
        ? `<button class="button tiny subtle" data-action="toggle-freemium-test">${icon("lock", 12)}Tester la vue Découverte</button>`
        : `<button class="button tiny primary" data-action="quick-unlock-universal">${icon("spark", 12)}Débloquer l'accès complet</button>`}
      <button class="button tiny subtle" data-nav="abonnement">${icon("briefcase", 12)}Conventions Écoles & Établissements</button>
    </div>
  </div>`;
}

function paywallGate(title = "Ressource réservée aux abonnés", description = "Ce module approfondi fait partie des ressources spécialisées du campus (fiches de direction, méthodologies HAS, déclarations ARS et annuaire). Accessible via convention établissement ou Pass individuel.", previewHtml = "") {
  return `<div class="premium-bubble" role="region" aria-label="Accès Premium">
    <div class="premium-bubble-orb premium-bubble-orb-a" aria-hidden="true"></div>
    <div class="premium-bubble-orb premium-bubble-orb-b" aria-hidden="true"></div>
    <div class="premium-bubble-icon">${icon("lock", 24)}</div>
    <span class="premium-bubble-kicker">ESPACE RÉSERVÉ · CADRES & DIRECTION</span>
    <h3>${esc(title)}</h3>
    <p>${esc(description)}</p>
    <div class="premium-bubble-benefits">
      <span class="premium-benefit-pill">${icon("check", 14)}<span>Simulateurs RH & inspections ARS</span></span>
      <span class="premium-benefit-pill">${icon("check", 14)}<span>Grilles d'évaluation HAS 2022</span></span>
      <span class="premium-benefit-pill">${icon("check", 14)}<span>Conventions & licences d'équipes</span></span>
    </div>
    <div class="paywall-actions">
      <button class="button primary" data-nav="abonnement">${icon("briefcase", 16)}Voir les conventions & offres d'équipe</button>
      <button class="button subtle" data-nav="accueil">${icon("arrow", 15)}Explorer les modules libres</button>
    </div>
  </div>`;
}

function readJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; }
  catch { return fallback; }
}
function readStoredValue(key) {
  try { return localStorage.getItem(key); }
  catch { return null; }
}
function writeStoredValue(key, value) {
  try { localStorage.setItem(key, value); return true; }
  catch { return false; }
}
function writeJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch { showToast("Le navigateur n’a pas pu enregistrer cette modification."); return false; }
}
function esc(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[char]);
}
function icon(name, size = 18) {
  const paths = {
    home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V10Z"/>',
    building:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 21v-4h6v4M8 7h1m6 0h1M8 11h1m6 0h1"/>',
    briefcase:'<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m-13 5h18m-11 0v2h4v-2"/>',
    calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01"/>',
    file:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>',
    network:'<circle cx="12" cy="5" r="3"/><circle cx="5" cy="19" r="3"/><circle cx="19" cy="19" r="3"/><path d="m10.5 7.5-4 9m7-9 4 9M8 19h8"/>',
    users:'<path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    map:'<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z"/><path d="M9 3v15m6-12v15"/>',
    userplus:'<path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M19 8v6m-3-3h6"/>',
    search:'<circle cx="10.8" cy="10.8" r="7.2"/><path d="m16 16 5 5"/>',
    sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/>',
    moon:'<path d="M20.6 15.3A8.5 8.5 0 0 1 8.7 3.4 8.5 8.5 0 1 0 20.6 15.3Z"/>',
    close:'<path d="m18 6-12 12M6 6l12 12"/>',
    lock:'<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    logout:'<path d="M10 17v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2m4 10 5-5-5-5m5 5H8"/>',
    menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
    arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
    'arrow-up-right':'<path d="M7 17 17 7M8 7h9v9"/>',
    'chevron-down':'<path d="m6 9 6 6 6-6"/>',
    external:'<path d="M14 3h7v7m0-7L10 14"/><path d="M19 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6"/>',
    star:'<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z"/>',
    book:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/><path d="M8 6h8m-8 4h8"/>',
    heart:'<path d="M20.8 8.7c0 4.4-8.8 10.1-8.8 10.1S3.2 13.1 3.2 8.7A4.7 4.7 0 0 1 12 6.3a4.7 4.7 0 0 1 8.8 2.4Z"/>',
    spark:'<path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z"/><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z"/>',
    check:'<path d="m5 12 4 4L19 6"/>',
    info:'<circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/>',
    download:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/>',
    trash:'<path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6"/>',
    zoomin:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4m-5-8v6m-3-3h6"/>',
    zoomout:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4m-5-4h6"/>',
    reset:'<path d="M3 12a9 9 0 1 0 2.6-6.4L3 8"/><path d="M3 3v5h5"/>',
    shield:'<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/>',
    people:'<path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    chart:'<path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-5 5"/>',
    clock:'<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    briefcase2:'<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18"/>',
    target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    pulse:'<path d="M3 12h4l3-8 4 16 3-8h4"/>',
    clipboard:'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M8 9h8m-8 4h8m-8 4h5"/>',
    layers:'<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/>',
    lightbulb:'<path d="M9 18h6m-5 4h4m-2-20a7 7 0 0 0-4 12.7c.6.4 1 1 1 1.8h6c0-.8.4-1.4 1-1.8A7 7 0 0 0 12 2Z"/>',
    arrowright:'<path d="M4 12h15m-6-6 6 6-6 6"/>',
    move:'<path d="M12 3v18m-4-4 4 4 4-4M8 7l4-4 4 4M3 12h18m-4-4 4 4-4 4M7 8l-4 4 4 4"/>',
    rotate:'<path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.6 9a7 7 0 0 1 11.9-2L20 12M4 12l2.5 5a7 7 0 0 0 11.9-2"/>',
    linkedin:'<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>',
    edit:'<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
    bell:'<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
    message:'<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    send:'<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>'
  };
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths[name] || paths.info}</svg>`;
}
function hydrateIcons(root = document) {
  $$('[data-icon]', root).forEach(el => { el.innerHTML = icon(el.dataset.icon); });
}
function bySource(ids = []) { return ids.map(id => SOURCES[id]).filter(Boolean); }
function sourceLinks(ids = []) {
  const sources = bySource(ids);
  if (!sources.length) return "";
  return `<div class="source-links" aria-label="Sources officielles">${sources.map(source => `<a class="source-link" href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${icon("external",13)}<span>${esc(source.label)}</span></a>`).join("")}</div>`;
}
function detailCell(title, body, wide = false) {
  return `<div class="detail-cell${wide ? " wide" : ""}"><h3>${esc(title)}</h3>${Array.isArray(body) ? `<ul class="bullet-list">${body.map(item => `<li>${esc(item)}</li>`).join("")}</ul>` : `<p>${esc(body || "À préciser selon l’organisation.")}</p>`}</div>`;
}
function tagColor(text = "") {
  if (/Sanitaire|Finance|Instances|Gouvernance|Systèmes|SI|Logistique/i.test(text)) return "sky";
  if (/Social|Droits|Prévention|Dialogue|Hôtellerie|Grand âge/i.test(text)) return "gold";
  if (/handicap|Qualité|Participation|Coordination|Sécurité/i.test(text)) return "mint";
  if (/RH|Compétences|Métiers|Technique|Maintenance/i.test(text)) return "violet";
  return "coral";
}
function navMarkup() {
  const groups = [...new Set(NAV.map(item => item.group))];
  return groups.map(group => `<div class="nav-group"><div class="nav-heading">${esc(group)}</div>${NAV.filter(item => item.group === group).map(item => {
    let badgeHtml = "";
    if (item.badge) {
      const bClass = item.badge === "Nouveau" ? "nav-badge-new" : (item.badge === "Enrichi" ? "nav-badge-updated" : "nav-badge-count");
      badgeHtml = `<span class="nav-pill ${bClass}">${esc(item.badge)}</span>`;
    } else if (item.id === "etablissements") {
      badgeHtml = `<span class="nav-count">${ESTABLISHMENTS.length}</span>`;
    }
    const isNew = item.badge === "Nouveau" || item.badge === "118 sigles" || item.badge === "Enrichi";
    return `<button class="nav-link${state.page === item.id ? " is-active" : ""}${isNew ? " is-highlighted" : ""}" data-nav="${item.id}"${state.page === item.id ? ' aria-current="page"' : ""}><span class="nav-icon">${icon(item.icon)}</span><span class="nav-text">${esc(item.label)}</span>${badgeHtml}</button>`;
  }).join("")}</div>`).join("");
}
function syncNavigation() {
  $("#desktop-nav").innerHTML = navMarkup();
  $$('.bottom-link').forEach(link => {
    const toolsPage = ["reunions","documents","rh","droit-sante","logiciels","qualite","rex","audit","politique","timeline","inspection-ars","changement-direction","glossaire"].includes(state.page);
    const active = link.dataset.nav === state.page || (toolsPage && link.dataset.nav === "documents");
    link.classList.toggle("is-active", active);
    if (active) link.setAttribute("aria-current", "page"); else link.removeAttribute("aria-current");
  });
  const label = NAV.find(item => item.id === state.page)?.label || "Accueil";
  $("#page-label").textContent = label;
  document.title = `${label} · Mosaïque Santé`;
  hydrateIcons();
}
function sectionHead(eyebrow, title, copy, actions = "") {
  return `<div class="page-head"><div class="page-head-copy"><span class="eyebrow">${esc(eyebrow)}</span><h1>${title}</h1><p class="lede">${copy}</p></div>${actions ? `<div class="page-actions">${actions}</div>` : ""}</div>`;
}
function navButton(page, label, iconName = "arrow") {
  return `<button class="button primary" data-nav="${page}">${icon(iconName,16)}${esc(label)}</button>`;
}
function updateAuthLock() {
  const lock = $("#auth-lock");
  const form = $("#welcome-signup-form");
  const fields = form.elements;
  const name = fields.namedItem("name");
  const email = fields.namedItem("email");
  const password = fields.namedItem("password");
  const confirm = fields.namedItem("passwordConfirm");
  const validPassword = password.value.length >= 8;
  const progress = lock.dataset.mode === "signup" ? [
    name.value.trim().length >= 2,
    Boolean(email.value.trim()) && email.validity.valid,
    validPassword,
    validPassword && confirm.value === password.value
  ].filter(Boolean).length : 4;
  lock.dataset.progress = String(progress);
  $$(".auth-lock-block", lock).forEach(block => block.classList.toggle("is-built", Number(block.dataset.step) <= progress));
}
function setAuthMode(mode) {
  const signup = mode === "signup";
  $("#auth-signin-panel").hidden = signup;
  $("#auth-signup-panel").hidden = !signup;
  $("#auth-lock").dataset.mode = mode;
  $$("[data-auth-mode]").forEach(button => {
    const selected = button.dataset.authMode === mode;
    button.classList.toggle("primary", selected);
    button.classList.toggle("subtle", !selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  updateAuthLock();
}
function setAuthBusy(busy) {
  $$('[data-auth-mode], [data-action="sign-in-google"], #welcome-signin-form button[type="submit"], #welcome-signup-form button[type="submit"]').forEach(button => { button.disabled = busy; });
}
function authFlowUnavailable() {
  if (authFlowPending) return true;
  if (!window.firebaseAuth?.currentUser) return false;
  $("#auth-status").textContent = "Connexion en cours…";
  return true;
}
function initPageThemes(page) {
  const container = $(".page", stage);
  const panels = $$(":scope > [data-page-theme]", container);
  if (panels.length < 2) return;
  const selected = panels.some(panel => panel.dataset.pageTheme === selectedPageThemes[page])
    ? selectedPageThemes[page] : panels[0].dataset.pageTheme;
  const tabs = document.createElement("div");
  tabs.className = "page-theme-tabs";
  tabs.setAttribute("role", "tablist");
  tabs.setAttribute("aria-label", "Thèmes de la page");
  panels.forEach((panel, index) => {
    const active = panel.dataset.pageTheme === selected;
    const tab = document.createElement("button");
    tab.type = "button";
    tab.className = "page-theme-tab";
    tab.id = `theme-tab-${page}-${index}`;
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", `theme-panel-${page}-${index}`);
    tab.setAttribute("aria-selected", String(active));
    tab.tabIndex = active ? 0 : -1;
    tab.textContent = panel.dataset.pageTheme;
    tabs.append(tab);
    panel.id = `theme-panel-${page}-${index}`;
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", tab.id);
    panel.tabIndex = 0;
    panel.hidden = !active;
  });
  panels[0].before(tabs);
}
function animateContent(elements, direction = 1) {
  contentAnimations.forEach(animation => animation.cancel());
  contentAnimations.clear();
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const delays = [0, 80, 145, 200, 245, 275];
  elements.forEach(element => {
    if (element.matches(".timeline-post")) {
      if (typeof element.getAnimations !== "function") return;
      element.getAnimations({ subtree:true }).filter(animation => animation.animationName === "post-in").forEach(animation => animation.cancel());
    }
  });
  const visible = [];
  for (const element of elements) {
    if (element.matches(".timeline-post") && typeof element.getAnimations !== "function") continue;
    const rect = element.getBoundingClientRect();
    if (rect.width && rect.height && rect.bottom > 0 && rect.top < innerHeight * 1.35
      && getComputedStyle(element).transform === "none"
      && !element.matches(".map-frame, .multiselect-wrap")
      && !element.querySelector(".map-frame, .multiselect-wrap")
      && ![element, ...element.querySelectorAll("*")].some(child => getComputedStyle(child).position === "fixed")) {
      visible.push(element);
      if (visible.length === delays.length) break;
    }
  }
  visible.forEach((element, index) => {
    if (typeof element.animate !== "function") return;
    const animation = element.animate(
      [{ opacity:.65, transform:`translateX(${direction * -14}px)` }, { opacity:1, transform:"none" }],
      { duration:750, delay:delays[index], easing:"cubic-bezier(.18,.72,.23,1)", fill:"backwards" }
    );
    contentAnimations.add(animation);
    animation.onfinish = animation.oncancel = () => contentAnimations.delete(animation);
  });
}
function selectPageTheme(tab, animate = true) {
  const tabs = $$('[role="tab"]', tab.parentElement);
  const previous = tabs.findIndex(item => item.getAttribute("aria-selected") === "true");
  const next = tabs.indexOf(tab);
  if (previous === next) return;
  tabs.forEach(item => {
    const active = item === tab;
    item.setAttribute("aria-selected", String(active));
    item.tabIndex = active ? 0 : -1;
    document.getElementById(item.getAttribute("aria-controls")).hidden = !active;
  });
  selectedPageThemes[state.page] = tab.textContent;
  if (animate) animateContent([document.getElementById(tab.getAttribute("aria-controls"))], next > previous ? 1 : -1);
}
function renderPage(page, { immediate = false, fromHistory = false, restoreScrollY = null, direction = 1 } = {}) {
  if (page === undefined) page = state.page;
  if (state.onboarding) page = "inscription-annuaire";
  if (!NAV.some(item => item.id === page)) page = "accueil";
  const isNavigation = page !== state.page;
  if (!fromHistory && page !== state.page) {
    pageScrollPositions.set(state.page, window.scrollY || 0);
    try {
      window.history?.replaceState({ ...(window.history.state || {}), page:state.page, scrollY:window.scrollY || 0, navigationIndex }, "", window.location.href);
      window.history?.pushState({ page, scrollY:0, navigationIndex:navigationIndex + 1 }, "", `#${page}`);
      navigationIndex++;
      routedHash = window.location.hash;
    } catch {
      try { window.location.hash = `#${page}`; routedHash = window.location.hash; }
      catch { /* La page reste navigable même sans historique du navigateur. */ }
    }
  }
  const replacePage = () => {
    destroyMapScene();
    state.page = page;
    syncNavigation();
    const renderers = {
      accueil:renderHome,
      etablissements:renderEstablishments,
      metiers:renderJobs,
      reunions:renderMeetings,
      documents:renderDocuments,
      acteurs:renderActors,
      rh:renderFaq,
      "droit-sante":renderHealthLaw,
      logiciels:renderSoftware,
      carte:renderMap,
      reseau:renderNetwork,
      "inscription-annuaire":renderPeerRegistration,      timeline:renderTimeline,
      qualite:renderQuality,
      rex:renderRex,
      politique:renderHealthPolicy,
      "metiers-support":renderSupportJobs,
      audit:renderAudit,
      secu:renderSecu,
      abonnement:renderSubscription,
      flashcards:renderFlashcards,
      compte:renderAccount,
      "inspection-ars": renderArsInspection,
      "changement-direction": renderManagementTransition,
      "responsabilite-penale": renderPenalResponsibility,
      glossaire: renderGlossary
    };
    stage.innerHTML = (renderers[page] || renderHome)();
    hydrateIcons(stage);
    attachPageHandlers();
    initPageThemes(page);
    if (page === "carte") {
      startMapScene();
      updateMapSelection();
    }
    if (page === "reseau") {
      renderPeerList();
      highlightPeerCard();
    }
    if (page === "inscription-annuaire") {
      peerMultiSelect.init();
      const editingPeer = state.peers.find(p => p.id === state.editingPeerId);
      if (editingPeer) {
        fillPeerForm(editingPeer);
      } else {
        state.editingPeerId = null;
        setCustomSelectValue("peer-region", "");
        setCustomSelectValue("peer-place", "");
        setCustomSelectValue("peer-role", "");
      }
    }
    if (page === "timeline") {
      const feed = $("#timeline-feed");
      if (feed) feed.innerHTML = renderTimelinePosts();
    }
    if (sidebar.classList.contains("is-open")) closeMenu();
    const heading = $("h1", stage);
    if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll:true }); }
    if (fromHistory) {
      const savedScroll = restoreScrollY ?? pageScrollPositions.get(page) ?? 0;
      window.scrollTo({ top:savedScroll, behavior:"auto" });
    } else {
      window.scrollTo({ top:0, behavior:"auto" });
    }
  };

  contentAnimations.forEach(animation => animation.cancel());
  contentAnimations.clear();
  replacePage();
  if (isNavigation && !immediate) {
    const elements = [...$(".page", stage).children].flatMap(element => {
      const feed = element.querySelector(":scope > #timeline-feed");
      if (feed) return [...element.children].flatMap(child => child === feed ? [...feed.children] : [child]);
      const results = element.matches("[id$='-results']") ? element
        : element.children.length === 1 && element.firstElementChild.matches("[id$='-results']") ? element.firstElementChild : null;
      return results ? [...results.children].filter(child => !child.matches(".result-pagination")) : [element];
    });
    animateContent(elements, direction);
  }
}

function renderHome() {
  const saved = state.favorites.length;
  return `<section class="page page-home" aria-labelledby="home-title">
    ${renderAccessStatusBar()}
    <div class="hero" data-visual>
      <div class="hero-copy"><span class="eyebrow">CAMPUS DE MANAGEMENT EN SANTÉ</span><h1 id="home-title">Lire le système.<br><em>Décider sur le terrain.</em></h1><p class="lede">Structures, métiers, qualité, droits et moyens : ce qu’un directeur, un cadre ou un responsable qualité doit tenir ensemble avant d’arbitrer.</p><div class="hero-actions">${navButton("etablissements","Explorer les établissements","building")}<button class="button subtle" data-nav="carte">${icon("network",16)}Voir les interactions</button></div></div>
      <div class="hero-art"><div class="hero-orbit" role="group" aria-label="Raccourcis vers les équipes, la qualité, les outils et les partenaires"><div class="orbit-ring one"></div><div class="orbit-ring two"></div><div class="orbit-ring three"></div><div class="orbit-center">${icon("layers",26)}<strong>DIRECTION</strong><small>AU CENTRE DU<br>SYSTÈME</small></div><button class="orbit-node n1" data-nav="metiers" aria-label="Ouvrir les métiers et les équipes" title="Métiers et équipes">${icon("users",20)}<small>ÉQUIPES</small></button><button class="orbit-node n2" data-nav="documents" aria-label="Ouvrir les repères qualité" title="Qualité et documents">${icon("shield",20)}<small>QUALITÉ</small></button><button class="orbit-node n3" data-nav="documents" aria-label="Ouvrir les outils et documents" title="Outils et documents">${icon("file",20)}<small>OUTILS</small></button><button class="orbit-node n4" data-nav="acteurs" aria-label="Ouvrir les partenaires" title="Acteurs et partenaires">${icon("network",20)}<small>PARTENAIRES</small></button></div><p class="hero-caption">Une vision reliée aux parcours</p></div>
    </div>
    
    <!-- Bannière B2B Direction & Masters Santé -->
    <div class="glass-panel" style="padding:18px 22px;margin:22px 0;background:linear-gradient(135deg,rgba(56,189,248,0.08),rgba(45,212,191,0.08));border:1px solid rgba(45,212,191,0.3);border-radius:18px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px">
      <div style="display:flex;align-items:center;gap:14px">
        <span class="icon-bubble mint" style="width:42px;height:42px;border-radius:12px">${icon("briefcase", 20)}</span>
        <div>
          <h3 style="font-size:16px;margin:0 0 3px;font-weight:750;color:var(--text)">Vous dirigez un établissement, un groupement ou un Master Santé ?</h3>
          <p style="margin:0;font-size:12.5px;color:var(--text-soft)">Équipez vos cadres et promotions : simulateurs RH, grilles d'évaluation HAS 2022 et fiches d'inspection ARS certifiées.</p>
        </div>
      </div>
      <button class="button primary" data-nav="abonnement" style="font-size:12.5px">${icon("spark", 14)} Obtenir une convention d'équipe</button>
    </div>
    
    <div class="onboarding-banner glass-panel">
      <div class="onboarding-head">
        <span class="icon-bubble" style="background:rgba(98, 222, 184, 0.15);color:var(--mint);padding:8px">${icon("spark", 22)}</span>
        <div>
          <h2>Par où commencer</h2>
          <p>Trois lectures fondamentales, dans l’ordre où un cadre dirigeant les rencontre vraiment.</p>
        </div>
      </div>
      <div class="onboarding-grid">
        <div class="onboarding-card">
          <span class="onboarding-num">1</span>
          <div>
            <h3>Structures et flux d’argent</h3>
            <p>MAS, EHPAD, hôpital, IME : qui accueille qui, qui autorise, et comment T2A, forfaits soins et CPOM financent l’activité.</p>
          </div>
        </div>
        <div class="onboarding-card">
          <span class="onboarding-num">2</span>
          <div>
            <h3>Métiers et marges de décision</h3>
            <p>Qui fait quoi, avec qui, et jusqu’où va la délégation — direction, qualité, soins, éducation et fonctions support.</p>
          </div>
        </div>
        <div class="onboarding-card">
          <span class="onboarding-num">3</span>
          <div>
            <h3>Réseau et occasions concrètes</h3>
            <p>Annuaire des diplômés, offres de stage ou d’alternance, et rendez-vous entre établissements.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Apple Executive KPI Widgets -->
    <div class="dashboard-stats" aria-label="Indicateurs clés du campus">
      <div class="dashboard-stat-widget" data-nav="etablissements" role="button" tabindex="0">
        <div class="stat-widget-top">
          <span class="stat-widget-icon mint">${icon("building", 18)}</span>
          <span class="stat-widget-badge mint">100% à jour</span>
        </div>
        <strong class="stat-widget-value">${ESTABLISHMENTS.length}</strong>
        <span class="stat-widget-label">Structures sanitaires & médico-sociales</span>
        <div class="stat-widget-footer">
          <span>MAS · EHPAD · IME · CH</span>
          ${icon("arrow", 12)}
        </div>
      </div>
      <div class="dashboard-stat-widget" data-nav="metiers" role="button" tabindex="0">
        <div class="stat-widget-top">
          <span class="stat-widget-icon sky">${icon("briefcase", 18)}</span>
          <span class="stat-widget-badge sky">Cadres & Dir</span>
        </div>
        <strong class="stat-widget-value">${JOBS.length}</strong>
        <span class="stat-widget-label">Pistes métiers & fiches de poste</span>
        <div class="stat-widget-footer">
          <span>Délégations & salaires</span>
          ${icon("arrow", 12)}
        </div>
      </div>
      <div class="dashboard-stat-widget" data-nav="documents" role="button" tabindex="0">
        <div class="stat-widget-top">
          <span class="stat-widget-icon gold">${icon("file", 18)}</span>
          <span class="stat-widget-badge gold">HAS v2026</span>
        </div>
        <strong class="stat-widget-value">${DOCUMENTS.length}</strong>
        <span class="stat-widget-label">Documents & repères opposables</span>
        <div class="stat-widget-footer">
          <span>EPRD · CPOM · DUERP</span>
          ${icon("arrow", 12)}
        </div>
      </div>
      <div class="dashboard-stat-widget" data-nav="favoris" role="button" tabindex="0">
        <div class="stat-widget-top">
          <span class="stat-widget-icon lavender">${icon("star", 18)}</span>
          <span class="stat-widget-badge lavender">${saved ? `${saved} en mémoire` : "Hors-ligne"}</span>
        </div>
        <strong class="stat-widget-value">${saved}</strong>
        <span class="stat-widget-label">Fiches enregistrées hors-ligne</span>
        <div class="stat-widget-footer">
          <span>Accès rapide local</span>
          ${icon("arrow", 12)}
        </div>
      </div>
    </div>

    <div class="dashboard-lower">
      <div class="quick-panel glass-panel"><div class="section-title-row"><div><h2>Où voulez-vous aller ?</h2><p>Accès direct aux repères et modules spécialisés.</p></div></div><div class="quick-grid">
        <button class="quick-tile" data-nav="secu"><div class="quick-tile-content"><span class="icon-bubble mint">${icon("shield")}</span><span><strong>Sécurité Sociale & Liens</strong><small>Les 5 branches, l'ONDAM, CPAM/CARSAT, tarification et flux financiers.</small></span></div><span class="quick-tile-arrow">${icon("chevron-right", 14)}</span></button>
        <button class="quick-tile" data-nav="abonnement"><div class="quick-tile-content"><span class="icon-bubble gold">${icon("spark")}</span><span><strong>Abonnement et Campus</strong><small>Pass étudiant, formules établissement et code d’accès de votre école.</small></span></div><span class="quick-tile-arrow">${icon("chevron-right", 14)}</span></button>
        <button class="quick-tile" data-nav="logiciels"><div class="quick-tile-content"><span class="icon-bubble sky">${icon("layers")}</span><span><strong>Logiciels métiers de santé</strong><small>DPI, DUI (NETSoins), AgEval, GMAO, SIRH, planning et MSSanté.</small></span></div><span class="quick-tile-arrow">${icon("chevron-right", 14)}</span></button>
        <button class="quick-tile" data-nav="qualite"><div class="quick-tile-content"><span class="icon-bubble mint">${icon("shield")}</span><span><strong>Qualité & Triage AgEval</strong><small>Simulateur 4 niveaux d'EI, signalements ARS (e-SIN) et culture juste.</small></span></div><span class="quick-tile-arrow">${icon("chevron-right", 14)}</span></button>
        <button class="quick-tile" data-nav="flashcards"><div class="quick-tile-content"><span class="icon-bubble lavender">${icon("spark")}</span><span><strong>Flashcards Révisions MES</strong><small>Decks interactifs 3D : AgEval, 10 Lois de santé et gestion de crise.</small></span></div><span class="quick-tile-arrow">${icon("chevron-right", 14)}</span></button>
        <button class="quick-tile" data-nav="audit"><div class="quick-tile-content"><span class="icon-bubble sky">${icon("target")}</span><span><strong>Audits qualité & méthodes</strong><small>À quoi ça sert, 6 typologies (traceurs, APC), méthode en 5 étapes.</small></span></div><span class="quick-tile-arrow">${icon("chevron-right", 14)}</span></button>
        <button class="quick-tile" data-nav="rex"><div class="quick-tile-content"><span class="icon-bubble gold">${icon("lightbulb")}</span><span><strong>Mener un REX / CREX</strong><small>Méthode en 6 étapes, grille ALARM, sécurité psychologique.</small></span></div><span class="quick-tile-arrow">${icon("chevron-right", 14)}</span></button>
        <button class="quick-tile" data-nav="metiers-support"><div class="quick-tile-content"><span class="icon-bubble lavender">${icon("people")}</span><span><strong>Corps de métier support</strong><small>Gouvernante, ASH, ASL, maintenance, SI, logistique et guichet unique.</small></span></div><span class="quick-tile-arrow">${icon("chevron-right", 14)}</span></button>
        <button class="quick-tile" data-nav="politique"><div class="quick-tile-content"><span class="icon-bubble mint">${icon("clipboard")}</span><span><strong>Politique de santé & lois</strong><small>Loi 2002-2, 2005, Ségur, Bien Vieillir 2024, PRS 3 ARS et schémas départementaux.</small></span></div><span class="quick-tile-arrow">${icon("chevron-right", 14)}</span></button>
        <button class="quick-tile" data-nav="metiers"><div class="quick-tile-content"><span class="icon-bubble sky">${icon("briefcase")}</span><span><strong>Métiers & responsabilités</strong><small>Direction d'établissement, RQGR, CGRAS, D3S, CAFDES et encadrement.</small></span></div><span class="quick-tile-arrow">${icon("chevron-right", 14)}</span></button>
        <button class="quick-tile" data-nav="documents"><div class="quick-tile-content"><span class="icon-bubble gold">${icon("file")}</span><span><strong>Documents de pilotage</strong><small>EPRD, CPOM, DUERP, PAAQ : qui le produit et comment le faire vivre.</small></span></div><span class="quick-tile-arrow">${icon("chevron-right", 14)}</span></button>
        <button class="quick-tile" data-nav="reunions"><div class="quick-tile-content"><span class="icon-bubble lavender">${icon("calendar")}</span><span><strong>Réunions & instances</strong><small>CODIR, COPIL Qualité, CVS, CSE, CREX : qui décide et qui associer.</small></span></div><span class="quick-tile-arrow">${icon("chevron-right", 14)}</span></button>
        <button class="quick-tile" data-nav="rh"><div class="quick-tile-content"><span class="icon-bubble coral">${icon("users")}</span><span><strong>Pilotage RH & Équipe</strong><small>9 types de congés, mi-temps thérapeutique, refonte de planning, accueil stagiaires et ETP.</small></span></div><span class="quick-tile-arrow">${icon("chevron-right", 14)}</span></button>
        <button class="quick-tile" data-nav="inspection-ars"><div class="quick-tile-content"><span class="icon-bubble mint">${icon("target")}</span><span><strong>Inspection de l'ARS</strong><small>Préparation du classeur permanent, déroulé jour J, contradictoire et plan d'actions.</small></span></div><span class="quick-tile-arrow">${icon("chevron-right", 14)}</span></button>
        <button class="quick-tile" data-nav="changement-direction"><div class="quick-tile-content"><span class="icon-bubble sky">${icon("rotate")}</span><span><strong>Changement de direction</strong><small>Enjeux, climat social, dossier de passation et positionnement clé du cadre.</small></span></div><span class="quick-tile-arrow">${icon("chevron-right", 14)}</span></button>
        <button class="quick-tile" data-nav="glossaire"><div class="quick-tile-content"><span class="icon-bubble gold">${icon("book")}</span><span><strong>Glossaire des 118 sigles</strong><small>Décoder tout le vocabulaire sanitaire, médico-social, RH, qualité et gouvernance.</small></span></div><span class="quick-tile-arrow">${icon("chevron-right", 14)}</span></button>
      </div></div>
      <aside class="profile-card glass-panel"><span class="tag violet">PARCOURS MES</span><h3>Un profil qui tient plusieurs métiers</h3><p>Les fiches relient direction, qualité, RH, budget et numérique. Le terrain de référence est la MAS : accueil, équipes et autorisation.</p><div class="profile-chip-row"><span class="tag mint">Qualité HAS</span><span class="tag sky">Pilotage RH</span><span class="tag gold">EPRD · CNR</span></div><button class="button subtle" data-nav="metiers">Voir les pistes adaptées ${icon("arrow",15)}</button></aside>
    </div>
    <div class="section-block"><div class="section-title-row"><div><h2>Trois repères pour décider</h2><p>Une décision solide croise le vécu des personnes, les équipes, les obligations, les moyens et les partenaires.</p></div></div><div class="focus-row"><article class="focus-card glass-panel"><span class="eyebrow">01 · PERSONNES</span><h3>Partir de la personne accompagnée</h3><p>Relier le projet personnalisé, les droits, l’expression et la continuité du parcours.</p></article><article class="focus-card glass-panel"><span class="eyebrow">02 · ÉQUIPES</span><h3>Rendre l’organisation tenable</h3><p>Prévenir les risques, soutenir les collectifs et clarifier les rôles de décision.</p></article><article class="focus-card glass-panel"><span class="eyebrow">03 · PILOTAGE</span><h3>Relier les moyens aux résultats</h3><p>Lire budget, effectifs, qualité et activité ensemble ; demander un arbitrage au bon niveau.</p></article></div></div>
    <div class="section-block notice">${icon("info",18)}<span><strong>Repère de lecture.</strong> Les textes, autorisations, conventions, statuts et compétences territoriales changent le cadre applicable. Chaque fiche indique les vérifications à faire avant une décision de gestion.</span></div>
  </section>`;
}

function renderCustomSelect({ id, name, options, value = "", placeholder = "Choisir une option…", search = true, required = false }) {
  const selectedOpt = options.find(o => (typeof o === "string" ? o : o.value) === value);
  const displayLabel = selectedOpt ? (typeof selectedOpt === "string" ? selectedOpt : selectedOpt.label) : placeholder;
  const hasValue = Boolean(value && value !== "Tout");

  return `
    <div class="multiselect-wrap custom-select-wrap" id="${esc(id)}-multiselect" data-custom-select="${esc(id)}">
      <div class="multiselect-trigger" tabindex="0" id="${esc(id)}-trigger" role="combobox" aria-expanded="false" data-action="toggle-custom-select" data-select-target="${esc(id)}">
        <div class="multiselect-tags">
          <span class="multiselect-placeholder ${hasValue ? "has-value" : ""}" id="${esc(id)}-display" data-placeholder="${esc(placeholder)}">${esc(displayLabel)}</span>
        </div>
        <span class="multiselect-arrow">${icon("chevron-down", 14)}</span>
      </div>
      <div class="multiselect-dropdown glass-panel" id="${esc(id)}-dropdown" hidden>
        ${search && options.length > 5 ? `
          <div class="multiselect-search">
            <input type="text" class="form-control" placeholder="Filtrer…" data-custom-search="${esc(id)}" autocomplete="off" style="min-height:36px;padding:6px 10px;font-size:12px">
          </div>
        ` : ""}
        <div class="multiselect-options" id="${esc(id)}-options" role="listbox">
          ${options.map(opt => {
            const val = typeof opt === "string" ? opt : opt.value;
            const lbl = typeof opt === "string" ? opt : opt.label;
            const isSelected = val === value;
            return `
              <div class="multiselect-option ${isSelected ? "is-selected" : ""}" data-value="${esc(val)}" data-select-for="${esc(id)}" role="option" tabindex="0">
                <span class="multiselect-checkbox" aria-hidden="true"></span>
                <span>${esc(lbl)}</span>
              </div>
            `;
          }).join("")}
        </div>
      </div>
      <input type="hidden" name="${esc(name || id)}" id="${esc(id)}" value="${esc(value)}" ${required ? "required" : ""}>
    </div>
  `;
}

function setCustomSelectValue(id, val) {
  const input = document.getElementById(id);
  if (input) input.value = val;
  const display = document.getElementById(`${id}-display`);
  const matchingOption = $(`#${id}-options .multiselect-option[data-value="${CSS.escape(val)}"]`);
  if (display) {
    if (matchingOption) {
      display.textContent = matchingOption.querySelector("span:last-child")?.textContent || val;
      display.classList.add("has-value");
    } else if (val && val !== "Tout") {
      display.textContent = val;
      display.classList.add("has-value");
    } else {
      const defaultPlaceholder = display.dataset.placeholder || (val === "Tout" ? "Tout" : "Choisir une option…");
      display.textContent = defaultPlaceholder;
      display.classList.toggle("has-value", val === "Tout");
    }
  }
  $$(`#${id}-options .multiselect-option`).forEach(opt => {
    opt.classList.toggle("is-selected", opt.dataset.value === val);
  });
}

function filterCustomOptions(id, query) {
  const q = (query || "").toLowerCase().trim();
  $$(`#${id}-options .multiselect-option`).forEach(opt => {
    const text = (opt.textContent || "").toLowerCase();
    opt.style.display = text.includes(q) ? "flex" : "none";
  });
}

function renderPills(group, values, selected) {
  return `<div class="pills" role="group" aria-label="Filtrer les résultats">${values.map(value => `<button class="pill${selected === value ? " is-selected" : ""}" data-filter-group="${group}" data-filter-value="${esc(value)}" aria-pressed="${selected === value}">${esc(value)}</button>`).join("")}</div>`;
}
function renderFilterSelect(group, values, selected, label, allLabel) {
  const display = value => value === "Tout" ? allLabel : value;
  return `<details class="filter-select" data-select-filter="${group}" data-filter-label="${esc(label)}">
    <summary class="filter-select-trigger" aria-label="${esc(`${label} : ${display(selected)}`)}">
      <span class="filter-select-value">${esc(display(selected))}</span>
      <span class="multiselect-arrow">${icon("chevron-down",14)}</span>
    </summary>
    <div class="filter-select-menu" role="group" aria-label="${esc(label)}">
      ${values.length > 6 ? `
        <div class="multiselect-search" style="margin-bottom:7px">
          <input type="text" class="form-control" placeholder="Filtrer…" data-action="filter-select-search" style="min-height:36px;padding:6px 10px;font-size:12px">
        </div>
      ` : ""}
      <div class="filter-select-options-list" style="overflow-y:auto;max-height:220px;display:grid;gap:3px;scrollbar-width:thin">
        ${values.map(value => `<button type="button" class="filter-select-option ${value === selected ? "is-selected" : ""}" data-filter-choice="${esc(value)}" aria-pressed="${value === selected}">
          <span class="multiselect-checkbox" aria-hidden="true"></span>
          <span>${esc(display(value))}</span>
        </button>`).join("")}
      </div>
    </div>
  </details>`;
}
function renderFavorite(id) {
  const saved = state.favorites.includes(id);
  return `<button class="favorite-button${saved ? " is-saved" : ""}" data-action="favorite" data-id="${esc(id)}" aria-label="${saved ? "Retirer des" : "Ajouter aux"} favoris" aria-pressed="${saved}">${icon("star",17)}</button>`;
}
function establishmentCards(list = ESTABLISHMENTS) {
  if (!list.length) return `<div class="empty-state"><strong>Aucun établissement trouvé</strong>Essayez une autre recherche ou un autre filtre.</div>`;
  return list.map(item => `<article class="content-card est-card"><button class="card-hit" data-action="open-establishment" data-id="${esc(item.id)}"><div class="card-top"><div class="card-title-line"><span class="icon-bubble">${icon("building",17)}</span><div><h3>${esc(item.name)}</h3><p>${esc(item.short)} · ${esc(item.type)}</p></div></div></div><p class="card-copy">${esc(item.definition)}</p><div class="card-foot"><span class="tag ${tagColor(item.family)}">${esc(item.family)}</span><span>${esc(item.devices.length)} dispositifs ${icon("arrow-up-right",13)}</span></div></button>${renderFavorite(item.id)}</article>`).join("");
}
function renderEstablishments() {
  const families = ["Tout", ...new Set(ESTABLISHMENTS.map(item => item.family))];
  return `<section class="page" aria-labelledby="establishments-title">${sectionHead("PANORAMA DU SYSTÈME", "Les établissements, <span class=\"text-gradient\">en clair.</span>", "Repérez les publics, les missions, les dispositifs, les métiers et les partenaires. Le panorama couvre les grandes familles et les types courants ; FINESS donne la nomenclature détaillée et les fiches locales.", `<button class="button subtle" data-action="open-sources">${icon("book",16)}FINESS & sources</button>`)}
    <div class="notice">${icon("info",18)}<span><strong>Lire les catégories avec prudence.</strong> Un même nom usuel peut recouvrir plusieurs autorisations ; certains dispositifs (CMP, PASA, unité de vie) sont des unités ou modalités, pas des établissements autonomes. Vérifiez la fiche FINESS et l’autorisation.</span></div>
    <div class="filter-bar"><label class="search-box"><span data-icon="search"></span><input class="form-control" id="establishment-query" type="search" placeholder="Nom, public, mission, métier…" autocomplete="off" aria-label="Rechercher un établissement"></label>${renderFilterSelect("establishments", families, state.filters.establishments, "Filtrer les établissements par famille", "Toutes les familles")}<span class="filter-count" id="establishment-count" aria-live="polite"></span></div>
    <div class="section-block"><div class="result-grid" id="establishment-results">${establishmentCards()}</div></div>
  </section>`;
}
function jobCards(list = JOBS, offset = 0) {
  if (!list.length) return `<div class="empty-state"><strong>Aucune piste correspondante</strong>Essayez un autre domaine ou un mot-clé.</div>`;
  const isUnlocked = isPremiumUnlocked();
  const visibleList = isUnlocked ? list : list.filter(item => item.isPremium !== true);
  if (!visibleList.length) return `<div class="empty-state"><strong>Contenu Premium masqué</strong>Les fiches institutionnelles apparaîtront après validation d’un abonnement actif.</div>`;
  return visibleList.map((item,index) => `<article class="content-card job-card"><button class="card-hit" data-action="open-job" data-id="${esc(item.id)}">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
      <span class="tag ${tagColor(item.sector)} level-tag">${esc(item.level)}</span>
      ${item.isPremium && !isUnlocked ? `<span class="tag gold" style="display:inline-flex;align-items:center;gap:4px;font-size:10px">${icon("lock",11)} Premium</span>` : ''}
    </div>
    <div class="card-top"><div><h3>${esc(item.name)}</h3><p class="card-copy">${esc(item.placement)}</p></div></div>
    <div class="meta-row"><span class="tag ${tagColor(item.sector)}">${esc(item.sector)}</span><span class="meta-label">Piste ${String(index+offset+1).padStart(2,"0")}</span></div>
    <div class="card-foot"><span>Responsabilités et déclinaisons</span>${icon("arrow-up-right",13)}</div>
  </button></article>`).join("");
}
function renderJobs() {
  const sectors = ["Tout", ...new Set(JOBS.map(item => item.sector))];
  const premiumCount = JOBS.filter(item => item.isPremium === true).length;
  const isUnlocked = isPremiumUnlocked();
  return `<section class="page" aria-labelledby="jobs-title">
    ${renderAccessStatusBar()}
    ${sectionHead("VOTRE PARCOURS · MASTER MES", "Des responsabilités <span class=\"text-gradient\">à votre portée.</span>", "Une cartographie de postes cohérente avec le Master Management des établissements de santé, une expérience d’adjoint de direction en MAS et un profil qualité / RH / gestion / transformation.", `<button class="button subtle" data-action="open-profile-note">${icon("spark",16)}Lire le cadrage</button>`)}
    <div class="notice">${icon("info",18)}<span><strong>Le diplôme ouvre des pistes, il ne confère pas une délégation.</strong> Les postes, qualifications requises, voies d’accès publiques et personnes encadrées dépendent du statut, du texte applicable, de l’employeur et de la fiche de poste.</span></div>
    ${!isUnlocked ? `<div class="premium-hidden-count">${icon("lock",17)}<div><strong>${premiumCount} métiers institutionnels sont masqués</strong><span>Abonnez-vous pour découvrir les postes HAS, ARS, ANAP, Sécurité Sociale et leurs responsabilités détaillées.</span></div><button class="button primary" data-nav="abonnement">${icon("star",14)}Voir le Premium</button></div>` : ""}
    <div data-page-theme="Les métiers">
    <div class="filter-bar"><label class="search-box"><span data-icon="search"></span><input class="form-control" id="job-query" type="search" placeholder="Poste, décision, équipe…" aria-label="Rechercher un métier"></label>${renderFilterSelect("jobs", sectors, state.filters.jobs, "Filtrer les métiers de direction par secteur", "Tous les secteurs")}</div>
    <div class="jobs-layout section-block"><div class="job-grid" id="job-results">${jobCards()}</div><aside class="job-side glass-panel"><span class="eyebrow">LIRE L’ORGANIGRAMME</span><h3 style="margin-top:12px">Le pouvoir suit la délégation</h3><div class="org-chain"><div class="org-node">Personne morale · conseil / gestionnaire</div><i class="org-connector"></i><div class="org-node focus">Direction d’établissement</div><i class="org-connector"></i><div class="org-node">Adjoint·e / directions fonctionnelles</div><i class="org-connector"></i><div class="org-node">Chefs de service · cadres de proximité</div><i class="org-connector"></i><div class="org-node">Professionnels et équipes</div></div><p class="small-note">Les liens fonctionnels (qualité, finances, RH, projets) traversent cette ligne hiérarchique sans créer automatiquement de responsabilité directe.</p><div class="source-links">${sourceLinks(["iae","d3s","dh","cafdes"])}</div></aside></div>
    </div>
    <div class="section-block" data-page-theme="Avant de candidater"><div class="section-title-row"><div><h2>Points à vérifier avant une candidature</h2><p>La réalité du poste tient dans ses délégations, son équipe et son régime d’emploi.</p></div></div><div class="focus-row"><article class="focus-card glass-panel"><span class="eyebrow">STATUT</span><h3>Public, associatif, privé</h3><p>Concours/statut, convention collective, employeur et autorité de rattachement changent les marges de manœuvre.</p></article><article class="focus-card glass-panel"><span class="eyebrow">PÉRIMÈTRE</span><h3>Hiérarchique ou transversal</h3><p>Demandez qui vous reporte, qui vous évalue et qui tranche un désaccord de ressources ou de soins.</p></article><article class="focus-card glass-panel"><span class="eyebrow">DÉLÉGATION</span><h3>Décisions réellement confiées</h3><p>Vérifiez budget délégué, actes RH, astreintes, signatures et responsabilités en cas d’incident.</p></article></div></div>
  </section>`;
}
function meetingCards(list = MEETINGS) {
  if (!list.length) return `<div class="empty-state"><strong>Aucune réunion trouvée</strong>Essayez un autre filtre.</div>`;
  return list.map(item => `<article class="content-card meeting-card"><button class="card-hit" data-action="open-meeting" data-id="${esc(item.id)}"><div class="card-top"><div class="card-title-line"><span class="icon-bubble">${icon("calendar",17)}</span><div><h3>${esc(item.name)}</h3><p>${esc(item.full)}</p></div></div></div><div class="meta-row"><span class="tag ${tagColor(item.kind)}">${esc(item.kind)}</span></div><p class="card-copy">${esc(item.purpose)}</p><div class="card-foot"><span>${esc(item.decision)}</span>${icon("arrow-up-right",13)}</div></button></article>`).join("");
}
function renderMeetings() {
  const kinds = ["Tout", ...new Set(MEETINGS.map(item => item.kind))];
  return `<section class="page" aria-labelledby="meeting-title">${sectionHead("BOÎTE À OUTILS · GOUVERNANCE", "Les réunions qui font <span class=\"text-gradient\">avancer.</span>", "Qui doit être autour de la table ? Quel est le niveau de décision ? Une réunion utile laisse un objectif clair, une trace et un responsable pour chaque suite.", `<button class="button subtle" data-action="meeting-template">${icon("clipboard",16)}Trame de réunion</button>`)}
    <div class="notice">${icon("info",18)}<span><strong>CODIR, CODIREL et COPIL sont des appellations d’organisation.</strong> Le CVS, les instances de dialogue social et les commissions hospitalières ont des cadres distincts. Le pouvoir de décision dépend du mandat, des textes et des délégations.</span></div>
    <div class="filter-bar"><label class="search-box"><span data-icon="search"></span><input class="form-control" id="meeting-query" type="search" placeholder="Sigle, objectif, participants…" aria-label="Rechercher une réunion"></label>${renderFilterSelect("meetings", kinds, state.filters.meetings, "Filtrer les réunions par type", "Tous les types")}</div>
    <div class="section-block meeting-grid" id="meeting-results">${meetingCards()}</div>
  </section>`;
}
function documentCards(list = DOCUMENTS) {
  if (!list.length) return `<div class="empty-state"><strong>Aucun document trouvé</strong>Essayez un autre mot-clé ou filtre.</div>`;
  return list.map(item => `<article class="content-card document-card"><button class="card-hit" data-action="open-document" data-id="${esc(item.id)}"><div class="card-top"><div class="card-title-line"><span class="icon-bubble">${icon(item.category.includes("RH") ? "shield" : item.category.includes("Finances") ? "chart" : "file",17)}</span><div><h3>${esc(item.name)}</h3><p>${esc(item.category)}</p></div></div></div><span class="tag ${tagColor(item.category)}">${esc(item.status)}</span><p class="card-copy">${esc(item.purpose)}</p><div class="card-foot"><span>${esc(item.when).slice(0,76)}${item.when.length > 76 ? "…" : ""}</span>${icon("arrow-up-right",13)}</div></button>${renderFavorite(item.id)}</article>`).join("");
}
function renderDocuments() {
  const cats = ["Tout", ...new Set(DOCUMENTS.map(item => item.category))];
  const checked = Object.values(state.docChecks).filter(Boolean).length;
  return `<section class="page" aria-labelledby="documents-title">${sectionHead("BOÎTE À OUTILS · DOCUMENTS", "Les bons documents, <span class=\"text-gradient\">au bon moment.</span>", "Pour chaque outil : utilité, producteur, personnes à associer, calendrier et points de vigilance. Ouvrez une fiche pour suivre une trame de production.", `<button class="button subtle" data-action="open-sources">${icon("book",16)}Textes de référence</button>`)}
    <div class="notice">${icon("info",18)}<span><strong>Les procédures budgétaires ne sont pas identiques partout.</strong> Le statut, la catégorie FINESS, l’autorisation, le CPOM et les décisions de tarification déterminent si l’EPRD, l’ERRD, un PPI ou un compte administratif s’applique.</span></div>
    <div class="filter-bar"><label class="search-box"><span data-icon="search"></span><input class="form-control" id="document-query" type="search" placeholder="Nom, date, responsable, usage…" aria-label="Rechercher un document"></label>${renderFilterSelect("documents", cats, state.filters.documents, "Filtrer les documents par catégorie", "Toutes les catégories")}<span class="filter-count" id="document-check-count">${checked} repère${checked === 1 ? "" : "s"} coché${checked === 1 ? "" : "s"}</span></div>
    <div class="documents-layout section-block"><div class="documents-grid" id="document-results">${documentCards()}</div><aside class="doc-toolbox glass-panel"><span class="eyebrow">MINI-OUTIL DE PILOTAGE</span><h3 style="margin-top:12px">Avant de lancer un document</h3><p>Une fiche utile commence par le besoin, le bon responsable et les personnes qui doivent participer.</p><div class="doc-checklist" id="document-checklist">${["Le texte ou le contrat applicable est identifié","Le décideur et le pilote sont nommés","Les personnes concernées participent","Un calendrier de validation est posé","Les suites auront un responsable et une échéance"].map((item,index) => `<label class="check-row"><input type="checkbox" data-check="check-${index}" ${state.docChecks[`check-${index}`] ? "checked" : ""}><span>${esc(item)}</span></label>`).join("")}</div><p id="checklist-progress" class="small-note">${checked} repère coché sur 5.</p><button class="button subtle" data-action="reset-checklist">${icon("reset",14)}Réinitialiser</button></aside></div>
  </section>`;
}
function actorCards(list = ACTORS) {
  if (!list.length) return `<div class="empty-state"><strong>Aucun acteur trouvé</strong>Essayez un autre nom ou rôle.</div>`;
  return list.map(item => `<article class="content-card actor-card"><button class="card-hit" data-action="open-actor" data-id="${esc(item.id)}"><div class="card-top"><div class="card-title-line"><span class="actor-symbol">${icon(item.type === "Autorité" ? "shield" : item.type === "Participation" ? "people" : item.type === "Qualité" ? "check" : "network",16)}</span><div><h3>${esc(item.name)}</h3><p>${esc(item.type)}</p></div></div></div><p class="card-copy">${esc(item.role)}</p><div class="card-foot"><span>${esc(item.position).slice(0,83)}${item.position.length > 83 ? "…" : ""}</span>${icon("arrow-up-right",13)}</div></button></article>`).join("");
}
function renderActors() {
  const types = ["Tout", ...new Set(ACTORS.map(item => item.type))];
  return `<section class="page" aria-labelledby="actors-title">${sectionHead("BOÎTE À OUTILS · ÉCOSYSTÈME", "Les acteurs autour <span class=\"text-gradient\">de l’établissement.</span>", "Repérez leur rôle, leur place, la bonne manière d’interagir et les ressources qu’ils peuvent apporter. Une autorité, un financeur, un appui et un répertoire n’ont pas le même mandat.", `<button class="button subtle" data-nav="carte">${icon("map",16)}Ouvrir la carte</button>`)}
    <div class="filter-bar"><label class="search-box"><span data-icon="search"></span><input class="form-control" id="actor-query" type="search" placeholder="Acteur, rôle, appui, financement…" aria-label="Rechercher un acteur"></label>${renderFilterSelect("actors", types, state.filters.actors, "Filtrer les acteurs par type", "Tous les types")}</div>
    <div class="section-block actor-grid" id="actor-results">${actorCards()}</div>
  </section>`;
}
function renderFaqList(list = FAQ) {
  if (!list.length) return `<div class="empty-state"><strong>Aucune réponse trouvée</strong>Essayez d’autres mots-clés.</div>`;
  return list.map((item,index) => `<article class="accordion-item"><button class="accordion-trigger" data-action="toggle-faq" aria-expanded="false" aria-controls="faq-answer-${index}"><span class="question-index">${String(index+1).padStart(2,"0")}</span><strong>${esc(item.q)}</strong>${icon("chevron-down",16)}</button><div class="accordion-panel" id="faq-answer-${index}" hidden>${esc(item.a)}${item.sources?.length ? sourceLinks(item.sources) : ""}</div></article>`).join("");
}
function easterSunday(year) {
  const a=year%19,b=Math.floor(year/100),c=year%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),month=Math.floor((h+l-7*m+114)/31),day=((h+l-7*m+114)%31)+1;
  return new Date(Date.UTC(year,month-1,day));
}
function nationalHolidays(year) {
  const easter=easterSunday(year), plus=(days)=>new Date(easter.getTime()+days*86400000);
  return [
    [0,1],[4,1],[4,8],[6,14],[7,15],[10,1],[10,11],[11,25],
    [plus(1).getUTCMonth(),plus(1).getUTCDate()],
    [plus(39).getUTCMonth(),plus(39).getUTCDate()],
    [plus(50).getUTCMonth(),plus(50).getUTCDate()]
  ].map(([month,day])=>new Date(Date.UTC(year,month,day)));
}
function weekdayCount(year) {
  let count=0;
  for(let month=0;month<12;month++) for(let day=1;day<=new Date(Date.UTC(year,month+1,0)).getUTCDate();day++) {
    const weekday=new Date(Date.UTC(year,month,day)).getUTCDay();
    if(weekday!==0&&weekday!==6) count++;
  }
  return count;
}
function weekdayHolidayCount(year) {
  const dates=[...new Map(nationalHolidays(year).map(date=>[date.getTime(),date])).values()];
  return dates.filter(date=>date.getUTCDay()!==0&&date.getUTCDay()!==6).length;
}
function formatNumber(value) { return new Intl.NumberFormat("fr-FR",{minimumFractionDigits:2,maximumFractionDigits:2}).format(Number.isFinite(value)?value:0); }
function etptLine(index) {
  const number=index+1;
  return `<div class="etpt-row" data-etpt-row><div class="etpt-row-title"><strong>Période / contrat ${number}</strong><button class="icon-button etpt-remove" type="button" data-action="remove-etpt-row" aria-label="Supprimer la ligne ${number}">${icon("trash",15)}</button></div><div class="form-grid"><label><span class="field-label">Heures contractuelles par semaine</span><input class="form-control" type="number" min="0" max="100" step="0.25" value="0" data-etpt-hours aria-label="Heures hebdomadaires, ligne ${number}"></label><label><span class="field-label">Mois de présence dans l’année</span><input class="form-control" type="number" min="0" max="12" step="0.5" value="0" data-etpt-months aria-label="Mois de présence, ligne ${number}"></label></div></div>`;
}
function renderEtpCalculator() {
  return `<article class="tool-card glass-panel calculator-card" id="outil-etp"><div class="tool-card-head"><span class="icon-bubble">${icon("chart",17)}</span><div><span class="eyebrow">PILOTAGE RESSOURCES HUMAINES</span><h2>Calculateur ETP & ETPT consolidé</h2></div></div><p class="tool-intro">Séparez la quotité des contrats actifs à une date de leur présence annualisée. Outil indispensable pour les prévisions budgétaires, le dialogue de gestion et les bilans sociaux.</p>
    <div class="form-grid etp-current-grid"><label><span class="field-label">Heures contractuelles hebdomadaires des salariés avec contrat actif à la date</span><input id="etp-active-hours" class="form-control" type="number" min="0" max="100000" step="0.25" value="0"><span class="field-hint">Additionnez les quotités contractualisées à cette date ; absences et présence planifiable se suivent à part.</span></label><label><span class="field-label">Référence hebdomadaire temps plein</span><input id="etp-week-reference" class="form-control" type="number" min="1" max="60" step="0.25" value="35"><span class="field-hint">Remplacez 35 h si l’organisation applique une autre référence.</span></label></div>
    <div class="rh-calc-visual"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><span style="font-size:12px;font-weight:600;color:var(--text-soft)">Niveau d'activité contractuelle instantané</span><span class="tag mint" style="font-size:11px">Instantané</span></div><div class="rh-meter"><div class="rh-meter-fill" id="etp-meter-bar" style="width:0%"></div></div></div>
    <div class="metric-strip"><div><span>ETP contractuels à la date</span><output id="etp-current-output" aria-live="polite">0,00</output></div><small>Heures contractuelles actives ÷ référence temps plein</small></div>
    <div class="etpt-heading"><div><h3>Calculer l’ETPT annuel (Équivalent Temps Plein Travaillé)</h3><p>Une ligne par quotité stable. Scindez une ligne si les heures changent en cours d’année.</p></div><button class="button subtle" type="button" data-action="add-etpt-row">${icon("userplus",15)}Ajouter une période</button></div>
    <div class="etpt-lines" id="etpt-lines">${etptLine(0)}${etptLine(1)}</div>
    <div class="form-grid annual-reference"><label><span class="field-label">Heures annuelles à temps plein (facultatif)</span><input id="etp-annual-reference" class="form-control" type="number" min="1" max="3000" step="1" placeholder="Ex. 1607 h (durée légale annuelle)"><span class="field-hint">Saisissez la référence annuelle de votre structure pour convertir en heures.</span></label><div class="metric-tile"><span>ETPT sur la période</span><output id="etpt-total-output" aria-live="polite">0,00</output><small id="etpt-hours-output">Renseignez une référence annuelle pour obtenir les heures.</small></div></div>
    <div style="display:flex;justify-content:flex-end;margin-top:14px"><button type="button" class="button primary rh-copy-summary-btn" data-action="copy-etp-summary">${icon("clipboard",15)}<span>Copier la synthèse RH pour CODIR / CPOM</span></button></div>
    <p class="formula-note"><strong>Formules & repères juridiques :</strong> ETP = quotité des contrats actifs à la date ; ETPT = somme des (quotités × mois sous contrat ÷ 12). L’effectif physique compte des personnes, l’ETP mesure une quotité contractuelle à une date et l’ETPT pondère la présence sous contrat sur l’exercice budgétaire (EPRD / ERRD). Les absences et la capacité réellement planifiable se suivent dans le tableau de service.</p>
  </article>`;
}
function renderForfaitCalculator() {
  const year=new Date().getFullYear();
  return `<article class="tool-card glass-panel calculator-card" id="outil-forfait"><div class="tool-card-head"><span class="icon-bubble violet">${icon("calendar",17)}</span><div><span class="eyebrow">ESTIMATION ANNUELLE</span><h2>Forfait jours & repos</h2></div></div><p class="tool-intro">Estimez le nombre de jours de repos forfait sur un calendrier classique du lundi au vendredi.</p>
    <div class="form-grid forfait-inputs"><label><span class="field-label">Année de référence</span><input id="forfait-year" class="form-control" type="number" min="2000" max="2100" value="${year}"></label><label><span class="field-label">Jours ouvrés du calendrier</span><input id="forfait-calendar-days" class="form-control" type="number" readonly aria-label="Nombre de jours ouvrés dans l’année"></label><label><span class="field-label">Jours fériés chômés lun–ven</span><input id="forfait-holidays" class="form-control" type="number" min="0" max="20" value="${weekdayHolidayCount(year)}"><span class="field-hint">Modifiable selon site, région et organisation.</span></label><label><span class="field-label">Congés payés en jours ouvrés</span><input id="forfait-cp" class="form-control" type="number" min="0" max="60" value="25"></label><label><span class="field-label">Congés conventionnels supplémentaires</span><input id="forfait-extra-leave" class="form-control" type="number" min="0" max="60" value="0"></label><label><span class="field-label">Jours travaillés prévus au forfait</span><input id="forfait-days" class="form-control" type="number" min="1" max="235" value="218"><span class="field-hint">218 est un plafond légal de référence en droit privé, pas un forfait automatique.</span></label></div>
    <div class="metric-strip forfait-result"><div><span>Repos forfait estimés</span><output id="forfait-rest-output" aria-live="polite">—</output></div><small id="forfait-formula-output">Jours ouvrés − fériés chômés − congés − jours du forfait</small></div>
    <p class="formula-note"><strong>À vérifier :</strong> estimation indicative en droit privé, pas un compteur légal de RTT ni un calcul à transposer directement à la FPH. L’accord, le calendrier réel (dont Alsace-Moselle), le travail en week-end, les jours de solidarité et les congés particuliers peuvent modifier le calcul. Les congés payés restent distincts des repos forfait.</p>
  </article>`;
}
function renderConventionCards() {
  return CONVENTIONS.map(item=>`<article class="convention-card"><div class="meta-row"><span class="tag ${item.idcc.includes("Statut")?"gold":"violet"}">${esc(item.idcc)}</span></div><h3>${esc(item.name)}</h3><p>${esc(item.scope)}</p><div class="convention-watch"><strong>À contrôler</strong><span>${esc(item.watch)}</span></div>${sourceLinks([item.source])}</article>`).join("");
}
function renderRecruitmentGuides() {
  return `<div class="guide-grid section-block">
    <article class="guide-card glass-panel"><span class="guide-number">01</span><span class="eyebrow">CLARIFIER LE POSTE</span><h3>Construire une fiche de poste</h3><p>Elle décrit le travail attendu et les interfaces. Elle aide à recruter, intégrer, déléguer et évaluer ; elle ne remplace pas le contrat ni les délégations formelles.</p><ul class="step-list"><li><strong>Finalité</strong><span>À quoi sert le poste et pour quel public / périmètre ?</span></li><li><strong>Positionnement</strong><span>Rattachement, équipe, liens fonctionnels, remplacements.</span></li><li><strong>Missions & activités</strong><span>Verbes d’action, résultats attendus, limites du rôle.</span></li><li><strong>Décisions</strong><span>Autonomie, budget, signature, actes RH, escalade.</span></li><li><strong>Profil & conditions</strong><span>Diplômes réellement requis, compétences, horaires, astreintes, risques et moyens.</span></li><li><strong>Validation</strong><span>Manager + RH, date/version, relecture après évolution du service.</span></li></ul></article>
    <article class="guide-card glass-panel"><span class="guide-number sky">02</span><span class="eyebrow">ATTIRER LES BONS PROFILS</span><h3>Rédiger & publier l’offre</h3><p>Une offre fidèle au poste aide le candidat à se projeter et évite les malentendus dès l’entretien.</p><ul class="step-list"><li><strong>Accroche & employeur</strong><span>Nom du site, mission, statut et public accompagné.</span></li><li><strong>Réalisme</strong><span>Activités, taille d’équipe, rattachement, horaires, nuits, week-ends, astreintes et déplacements.</span></li><li><strong>Cadre d’emploi</strong><span>CDI/CDD, temps plein/partiel, convention/statut, rémunération ou repère clair, avantages et date de prise de poste.</span></li><li><strong>Profil utile</strong><span>Distinguer exigences indispensables et souhaitables ; diplômes liés aux missions.</span></li><li><strong>Diffusion & suivi</strong><span>Canaux cohérents, procédure interne ou concours si applicable, contact, étapes et délai de réponse.</span></li></ul><div class="notice compact-notice">${icon("shield",16)}<span>Écrivez une offre inclusive et sans critère discriminatoire. Ne publiez pas de contraintes embellies ou imprécises.</span></div>${sourceLinks(["jobOffer","recruitmentNoDiscrimination"])}</article>
    <article class="guide-card glass-panel"><span class="guide-number mint">03</span><span class="eyebrow">ÉVALUER AVEC ÉQUITÉ</span><h3>Conduire l’entretien</h3><p>Un entretien structuré compare des éléments liés au poste, pas des impressions générales.</p><ul class="step-list"><li><strong>Avant</strong><span>Lire le dossier selon la même grille ; répartir les rôles dans le jury ; prévoir un lieu accessible et le temps annoncé.</span></li><li><strong>Accueil</strong><span>Présenter le poste, les étapes, les participants et la durée.</span></li><li><strong>Questions communes</strong><span>Exemples : « Racontez une situation où vous avez priorisé plusieurs urgences » ; « Comment faites-vous remonter un risque ? »</span></li><li><strong>Évaluer</strong><span>Noter des faits et réponses sur des critères pondérés : compétences, coordination, qualité, organisation.</span></li><li><strong>Conclure</strong><span>Présenter contraintes réelles, laisser les questions, annoncer calendrier et retour.</span></li></ul><div class="notice compact-notice">${icon("info",16)}<span>Ne posez que des questions ayant un lien direct et nécessaire avec l’emploi. Évitez santé, famille, religion ou opinions. Limitez l’accès et la durée de conservation des candidatures.</span></div>${sourceLinks(["candidateInfo","recruitmentPrivacy"])}</article>
  </div>`;
}
function renderJobDescriptionBuilder() {
  return `<section class="section-block builder-card glass-panel" id="outil-fiche-poste"><div class="section-title-row"><div><span class="eyebrow">TRAME À COMPLÉTER</span><h2>Préparer une fiche de poste</h2><p>Complétez les repères puis générez un brouillon à retravailler avec RH et le manager.</p></div></div><form id="job-description-form" class="job-builder-form"><div class="form-grid"><label><span class="field-label">Intitulé du poste</span><input class="form-control" name="title" placeholder="Ex. responsable de service" required></label><label><span class="field-label">Structure / secteur</span><input class="form-control" name="organization" placeholder="Ex. MAS, EHPAD, service hospitalier"></label><label><span class="field-label">Rattachement hiérarchique</span><input class="form-control" name="reporting" placeholder="Ex. direction d’établissement"></label><label><span class="field-label">Périmètre / équipe</span><input class="form-control" name="team" placeholder="Effectif, unités, sites, métiers"></label></div><label><span class="field-label">Finalité et missions principales</span><textarea class="form-control" name="missions" placeholder="Décrivez les responsabilités et activités avec des verbes d’action."></textarea></label><label><span class="field-label">Autonomie, décisions et délégations</span><textarea class="form-control" name="authority" placeholder="Budget, décisions RH, signature, limites, alertes et escalades."></textarea></label><label><span class="field-label">Compétences / qualifications et conditions</span><textarea class="form-control" name="profile" placeholder="Diplômes requis, expérience, horaires, astreintes, risques, déplacements."></textarea></label><button class="button primary" type="submit">${icon("file",15)}Générer le brouillon</button></form><div class="job-preview-wrap"><label class="field-label" for="job-description-preview">Brouillon modifiable et copiable</label><textarea id="job-description-preview" class="form-control job-preview" placeholder="Votre trame apparaîtra ici."></textarea><button class="button subtle" type="button" data-action="copy-job-description">${icon("clipboard",15)}Copier le brouillon</button></div></section>`;
}
function calculateEtp() {
  const reference = Number($("#etp-week-reference")?.value) || 0;
  const activeHours = Number($("#etp-active-hours")?.value) || 0;
  const etpOutput = $("#etp-current-output");
  const etpVal = reference > 0 ? activeHours / reference : 0;
  if (etpOutput) etpOutput.value = reference > 0 ? formatNumber(etpVal) : "—";
  const meter = $("#etp-meter-bar");
  if (meter) {
    const percent = Math.min(100, Math.max(0, (activeHours / (reference || 35)) * 25));
    meter.style.width = `${percent}%`;
  }
  let etpt = 0;
  $$("[data-etpt-row]").forEach(row => {
    const hours = Number($("[data-etpt-hours]", row)?.value) || 0;
    const months = Math.min(12, Math.max(0, Number($("[data-etpt-months]", row)?.value) || 0));
    if (reference > 0) etpt += (hours / reference) * (months / 12);
  });
  const total = $("#etpt-total-output");
  if (total) total.value = reference > 0 ? formatNumber(etpt) : "—";
  const annual = Number($("#etp-annual-reference")?.value) || 0;
  const annualOut = $("#etpt-hours-output");
  if (annualOut) annualOut.textContent = annual > 0 ? `${formatNumber(etpt * annual)} heures équivalent temps plein sur la période` : "Renseignez une référence annuelle pour obtenir les heures.";
}
function syncForfaitCalendar() {
  const year=Number($("#forfait-year")?.value);
  if(!Number.isInteger(year)||year<2000||year>2100) return;
  const calendar=$("#forfait-calendar-days"),holidays=$("#forfait-holidays");
  if(calendar) calendar.value=weekdayCount(year);
  if(holidays) holidays.value=weekdayHolidayCount(year);
  calculateForfait();
}
function calculateForfait() {
  const output=$("#forfait-rest-output"); if(!output) return;
  const calendar=Number($("#forfait-calendar-days")?.value)||0;
  const holidays=Number($("#forfait-holidays")?.value)||0;
  const leave=Number($("#forfait-cp")?.value)||0;
  const extra=Number($("#forfait-extra-leave")?.value)||0;
  const forfait=Number($("#forfait-days")?.value)||0;
  const rest=calendar-holidays-leave-extra-forfait;
  output.value=Number.isFinite(rest)?`${formatNumber(rest)} j`:"—";
  output.classList.toggle("is-negative",rest<0);
  const formula=$("#forfait-formula-output");
  if(formula) formula.textContent=rest<0?`Écart de ${formatNumber(Math.abs(rest))} j : vérifiez les paramètres, le forfait et la période.`:`${calendar} jours ouvrés − ${holidays} fériés chômés − ${leave+extra} jours de congés − ${forfait} jours travaillés`;
}
function renumberEtptRows() {
  const rows=$$("[data-etpt-row]");
  rows.forEach((row,index)=>{
    const number=index+1,title=$(".etpt-row-title strong",row),remove=$("[data-action='remove-etpt-row']",row);
    if(title) title.textContent=`Période / contrat ${number}`;
    if(remove) { remove.setAttribute("aria-label",`Supprimer la ligne ${number}`); remove.disabled=rows.length===1; }
    $("[data-etpt-hours]",row)?.setAttribute("aria-label",`Heures hebdomadaires, ligne ${number}`);
    $("[data-etpt-months]",row)?.setAttribute("aria-label",`Mois de présence, ligne ${number}`);
  });
}
function renderFaq() {
  const isUnlocked = isPremiumUnlocked();
  return `<section class="page" aria-labelledby="faq-title">${sectionHead("BOÎTE À OUTILS · RH & RECRUTEMENT", "Les bons repères RH, <span class=\"text-gradient\">calculés et prêts à l’emploi.</span>", "Conventions, temps de travail, recrutement et effectifs. Les règles dépendent du statut, de l’accord applicable, du calendrier de l’établissement et des délégations.", `<button class="button subtle" data-nav="logiciels">${icon("layers",16)}Logiciels métiers</button><button class="button subtle" data-action="open-sources">${icon("book",16)}Sources</button>`)}
    <div class="rh-tabs" role="tablist" aria-label="Sections RH">
      <button class="rh-tab is-active" data-action="rh-tab" data-rh-tab="conventions" role="tab" aria-selected="true">${icon("file",14)} Conventions</button>
      <button class="rh-tab" data-action="rh-tab" data-rh-tab="questions" role="tab" aria-selected="false">${icon("info",14)} Questions RH</button>
      <button class="rh-tab" data-action="rh-tab" data-rh-tab="recrutement" role="tab" aria-selected="false">${icon("briefcase",14)} Recrutement</button>
      <button class="rh-tab" data-action="rh-tab" data-rh-tab="calculateurs" role="tab" aria-selected="false">${icon("chart",14)} Calculateurs ETP</button>
    </div>
    <div class="rh-tab-panel is-active" data-rh-panel="conventions">
      <section class="section-block" id="conventions"><div class="section-title-row"><div><span class="eyebrow">DROIT SOCIAL · REPÈRES DE BRANCHE</span><h2>Conventions et statuts courants</h2><p>Quelques repères fréquents ; le champ conventionnel de l'employeur doit toujours être confirmé.</p></div></div><div class="convention-grid">${renderConventionCards()}</div><div class="notice section-block">${icon("info",17)}<span><strong>Vérification pratique.</strong> Regardez l'intitulé et l'IDCC sur le bulletin de paie, recherchez l'employeur avec son SIRET, puis relisez le champ d'application, la convention consolidée, les avenants et les accords d'entreprise. L'APE est un indice, pas à lui seul la preuve de la convention applicable.</span></div>${sourceLinks(["collectiveAgreement"])}</section>
    </div>
    <div class="rh-tab-panel" data-rh-panel="recrutement">
      ${isUnlocked ? `${renderRecruitmentGuides()}${renderJobDescriptionBuilder()}` : paywallGate("Recrutement & fiches de poste Premium", "Accédez aux trames de recrutement, aux offres, aux entretiens structurés, aux grilles d’évaluation et au générateur de fiches de poste.", `<div class="premium-preview-grid"><div><strong>Clarifier</strong><span>Mission, périmètre et délégations</span></div><div><strong>Recruter</strong><span>Offre fidèle et diffusion inclusive</span></div><div><strong>Évaluer</strong><span>Entretien structuré sans biais</span></div></div>`)}
    </div>
    <div class="rh-tab-panel" data-rh-panel="questions">
      <section class="section-block" id="faq-search"><div class="section-title-row"><div><span class="eyebrow">RÉPONSES COURTES · ${FAQ.length} REPÈRES</span><h2>Questions RH fréquentes</h2><p>Recherche par thème, sigle ou situation.</p></div></div><div class="faq-layout"><div><label class="search-box"><span data-icon="search"></span><input class="form-control" id="faq-query" type="search" placeholder="Convention, forfait jours, entretien, ETP…" aria-label="Rechercher une réponse RH"></label><div class="faq-list section-block" id="faq-results">${renderFaqList()}</div></div><aside class="faq-aside glass-panel"><span class="eyebrow">POSTURE DE MANAGER</span><h3>Écouter · cadrer · tracer</h3><p>Pour une situation individuelle, protégez la confidentialité, partez des faits, vérifiez le cadre applicable et sollicitez RH ou juridique au bon moment.</p><div class="separator"></div><span class="tag gold">Repères pédagogiques</span><p style="margin-top:10px">Ces réponses facilitent le premier repérage ; elles ne remplacent ni les textes à jour, ni les accords collectifs, ni une analyse individualisée par les personnes habilitées.</p>${sourceLinks(["duerp","cse","servicePublicWork"])}</aside></div></section>
    </div>
    <div class="rh-tab-panel" data-rh-panel="calculateurs">
      ${isUnlocked ? `
        <div class="rh-calculator-grid section-block">${renderEtpCalculator()}${renderForfaitCalculator()}</div>
        <section class="section-block" id="etp-disponibles"><div class="section-title-row"><div><span class="eyebrow">OÙ CHERCHER LES MOYENS</span><h2>Retrouver les ETP réellement disponibles</h2><p>Le chiffre dépend de la question posée : autorisation, budget, postes pourvus ou présence réelle.</p></div></div><div class="etp-source-grid"><article class="etp-source-card"><strong>Emplois autorisés / financés</strong><span>Notifications de financement, CPOM, budget prévisionnel ou EPRD/ERRD selon le secteur et le cadre de l'établissement ; tableau d'emplois pour le public.</span></article><article class="etp-source-card"><strong>Postes pourvus</strong><span>Tableau des effectifs RH, contrats, quotités, paie et date d'arrêté.</span></article><article class="etp-source-card"><strong>Capacité présente</strong><span>Planning, absences, formation, intérim, heures supplémentaires, repos et compétences.</span></article><article class="etp-source-card"><strong>À rapprocher</strong><span>Budget RH, masse salariale, remplacements et ETP par service/métier.</span></article></div>${sourceLinks(["etpGuide","cnsaData"])}</section>
      ` : paywallGate("Calculateurs RH Premium", "Accédez aux calculateurs ETP/ETPT, au forfait jours, au calendrier annuel et à la recherche d’effectifs disponibles.", `<div class="premium-preview-grid"><div><strong>ETP / ETPT</strong><span>Conversion des temps réels</span></div><div><strong>Forfait jours</strong><span>Calendrier annuel ajustable</span></div><div><strong>Effectifs</strong><span>Recherche des moyens disponibles</span></div></div>`)}
    </div>
  </section>`;
}

/* ==========================================================================
   MODULES COMPLÉMENTAIRES : RH, INSPECTION ARS, CHANGEMENT DE DIRECTION & GLOSSAIRE
   ========================================================================== */

/* --- 1. RENDU DES TYPES DE CONGÉS POUR LES PROFESSIONNELS --- */
function renderRhLeaveTypes() {
  const leaves = RH_LEAVE_TYPES || [];
  return `
    <section class="section-block" id="rh-leave-types">
      <div class="section-title-row">
        <div>
          <span class="eyebrow">DROIT DU TRAVAIL & STATUT HOSPITALIER</span>
          <h2>Les différents types de congés & absences</h2>
          <p>Droits fondamentaux, rémunération, formalités et spécificités comparées FPH vs Secteur Privé (CCN51, CCN66).</p>
        </div>
      </div>

      <div class="rh-leave-grid">
        ${leaves.map((item, index) => `
          <article class="content-card glass-panel rh-leave-card">
            <div class="rh-leave-header">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px">
                <span class="tag ${tagColor(item.badge)}">${esc(item.badge)}</span>
                <span class="duration-badge">${icon("clock", 13)} ${esc(item.duration)}</span>
              </div>
              <h3 style="font-size:16px;margin:4px 0 2px">${esc(item.title)}</h3>
              <p class="rh-leave-subtitle">${esc(item.subtitle)}</p>
            </div>

            <div class="rh-leave-comparison">
              <div class="detail-cell comparison-box">
                <h4>${icon("building", 14)} Fonction Publique Hospitalière (FPH)</h4>
                <p>${esc(item.fphRules)}</p>
              </div>
              <div class="detail-cell comparison-box">
                <h4>${icon("briefcase", 14)} Secteur Privé (CCN51, CCN66, Droit commun)</h4>
                <p>${esc(item.priveRules)}</p>
              </div>
            </div>

            <div class="rh-leave-footer-info">
              <div class="rh-procedure">
                <strong>${icon("clipboard", 13)} Démarche & Formalités :</strong>
                <span>${esc(item.procedure)}</span>
              </div>
              <div class="notice compact-notice" style="margin-top:10px">
                ${icon("info", 14)}
                <span><strong>Conseil & Posture du cadre :</strong> ${esc(item.tips)}</span>
              </div>
              ${item.sources?.length ? sourceLinks(item.sources) : ""}
            </div>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

/* --- 2. RENDU DU TEMPS PARTIEL / MI-TEMPS THÉRAPEUTIQUE --- */
function renderTherapeuticPartTime() {
  const tpt = RH_THERAPEUTIC_PART_TIME;
  if (!tpt) return "";
  return `
    <section class="section-block" id="rh-therapeutic-part-time">
      <div class="section-title-row">
        <div>
          <span class="eyebrow">REPRISE D'ACTIVITÉ & SANTÉ AU TRAVAIL</span>
          <h2>Gérer le mi-temps & temps partiel thérapeutique</h2>
          <p>Cadre légal réformé, coordination médicale, articulation des plannings et maintien de traitement.</p>
        </div>
      </div>

      <div class="notice" style="margin-bottom:20px">
        ${icon("info", 18)}
        <span><strong>Définition & Principe directeur :</strong> ${esc(tpt.definition)}</span>
      </div>

      <div class="tpt-framework-block glass-panel" style="padding:18px;border-radius:14px;margin-bottom:24px">
        <h3 style="font-size:15px;margin-bottom:10px;display:flex;align-items:center;gap:8px">
          ${icon("shield", 16)} Fondements juridiques & réformes récentes
        </h3>
        <ul class="bullet-list">
          ${tpt.legalFramework.map(law => `<li>${esc(law)}</li>`).join("")}
        </ul>
      </div>

      <div class="section-title-row">
        <div>
          <span class="eyebrow">LES 4 ACTEURS INDISPENSABLES</span>
          <h3>Qui fait quoi dans le circuit de décision ?</h3>
        </div>
      </div>
      <div class="tpt-actors-grid">
        ${tpt.keyActors.map((actor, idx) => `
          <article class="content-card glass-panel tpt-actor-card">
            <span class="eyebrow">ACTEUR 0${idx+1}</span>
            <h4 style="font-size:15px;margin:6px 0 8px;color:var(--text)">${esc(actor.role)}</h4>
            <p style="font-size:13px;line-height:1.55">${esc(actor.mission)}</p>
          </article>
        `).join("")}
      </div>

      <div class="section-title-row" style="margin-top:28px">
        <div>
          <span class="eyebrow">MÉTHODOLOGIE EN 5 ÉTAPES</span>
          <h3>Le parcours de mise en œuvre pas à pas</h3>
        </div>
      </div>
      <div class="step-flow">
        ${tpt.steps.map(s => `
          <div class="step-flow-item glass-panel">
            <div class="step-flow-num">${s.step}</div>
            <div class="step-flow-body">
              <h4>${esc(s.title)}</h4>
              <p>${esc(s.desc)}</p>
            </div>
          </div>
        `).join("")}
      </div>

      <div class="section-title-row" style="margin-top:28px">
        <div>
          <span class="eyebrow">RÉMUNÉRATION COMPARÉE</span>
          <h3>Maintien de salaire FPH vs Secteur Privé</h3>
        </div>
      </div>
      <div class="tpt-comparison-grid">
        <article class="content-card glass-panel" style="border-top:3px solid var(--accent-mint)">
          <span class="tag mint">FPH (Décret 2021-997)</span>
          <h4 style="font-size:16px;margin:8px 0 6px">${esc(tpt.fphVsPrive.fph.title)}</h4>
          <p><strong>Rémunération :</strong> ${esc(tpt.fphVsPrive.fph.remuneration)}</p>
          <div class="separator"></div>
          <p><strong>Durée légale :</strong> ${esc(tpt.fphVsPrive.fph.duration)}</p>
          <p><strong>Formalités :</strong> ${esc(tpt.fphVsPrive.fph.formalities)}</p>
        </article>

        <article class="content-card glass-panel" style="border-top:3px solid var(--accent-gold)">
          <span class="tag gold">Secteur Privé (CCN51 / CCN66)</span>
          <h4 style="font-size:16px;margin:8px 0 6px">${esc(tpt.fphVsPrive.prive.title)}</h4>
          <p><strong>Rémunération :</strong> ${esc(tpt.fphVsPrive.prive.remuneration)}</p>
          <div class="separator"></div>
          <p><strong>Durée légale :</strong> ${esc(tpt.fphVsPrive.prive.duration)}</p>
          <p><strong>Formalités :</strong> ${esc(tpt.fphVsPrive.prive.formalities)}</p>
        </article>
      </div>

      <div class="checklist-card glass-panel" style="margin-top:24px">
        <h3 style="font-size:15px;margin-bottom:12px;display:flex;align-items:center;gap:8px">
          ${icon("check", 16)} La check-list du cadre de santé & manager
        </h3>
        <ul class="bullet-list checklist-bullets">
          ${tpt.managerChecklist.map(item => `<li><strong>Règle d'or :</strong> ${esc(item)}</li>`).join("")}
        </ul>
      </div>
      ${sourceLinks(tpt.sources)}
    </section>
  `;
}

/* --- 3. RENDU DU CHANGEMENT DE PLANNING D'UNE ORGANISATION --- */
function renderPlanningChangeMethodology() {
  const plan = RH_PLANNING_CHANGE;
  if (!plan) return "";
  return `
    <section class="section-block" id="rh-planning-change">
      <div class="section-title-row">
        <div>
          <span class="eyebrow">ORGANISATION DU TRAVAIL & GESTION DES TEMPS</span>
          <h2>Changement de planning d'une organisation : méthodologie & étapes</h2>
          <p>Pourquoi transformer une trame de roulement, les intérêts croisés pour l'établissement, les soignants et les usagers, et les 7 étapes incontournables.</p>
        </div>
      </div>

      <aside class="ethical-dignity-banner glass-panel" style="margin-bottom:24px">
        <div class="ethical-badge">${icon("heart", 18)} <span>LE SENS ÉTHIQUE DE LA RÉORGANISATION</span></div>
        <p class="ethical-text">${esc(plan.ethicalPurpose)}</p>
      </aside>

      <div class="section-title-row">
        <div>
          <span class="eyebrow">TRIPLE FINALITÉ GAGNANT-GAGNANT</span>
          <h3>Pourquoi changer de planning ? Quel intérêt pour l'organisation ?</h3>
        </div>
      </div>

      <div class="triple-interest-grid">
        <article class="content-card glass-panel" style="border-left:4px solid var(--accent-mint)">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
            <span class="icon-bubble mint">${icon("heart", 16)}</span>
            <h4 style="font-size:15px;margin:0">Pour les Résidents & Patients</h4>
          </div>
          <ul class="bullet-list">
            ${plan.whyChange.residents.map(r => `<li>${esc(r)}</li>`).join("")}
          </ul>
        </article>

        <article class="content-card glass-panel" style="border-left:4px solid var(--accent-sky)">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
            <span class="icon-bubble sky">${icon("users", 16)}</span>
            <h4 style="font-size:15px;margin:0">Pour les Soignants & Équipes</h4>
          </div>
          <ul class="bullet-list">
            ${plan.whyChange.staff.map(s => `<li>${esc(s)}</li>`).join("")}
          </ul>
        </article>

        <article class="content-card glass-panel" style="border-left:4px solid var(--accent-gold)">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
            <span class="icon-bubble gold">${icon("building", 16)}</span>
            <h4 style="font-size:15px;margin:0">Pour l'Établissement & la Direction</h4>
          </div>
          <ul class="bullet-list">
            ${plan.whyChange.organization.map(o => `<li>${esc(o)}</li>`).join("")}
          </ul>
        </article>
      </div>

      <div class="section-title-row" style="margin-top:28px">
        <div>
          <span class="eyebrow">GARDE-FOUS RÉGLEMENTAIRES</span>
          <h3>Les contraintes légales incontournables du temps de travail</h3>
        </div>
      </div>
      <div class="rule-pills-wrap">
        ${plan.regulatoryRules.map(r => `
          <div class="rule-pill glass-panel">
            <strong>${esc(r.label)} :</strong>
            <span>${esc(r.value)}</span>
          </div>
        `).join("")}
      </div>

      <div class="section-title-row" style="margin-top:28px">
        <div>
          <span class="eyebrow">DÉMARCHE CONDUCTRICE EN 7 ÉTAPES</span>
          <h3>La feuille de route d'un changement de planning réussi</h3>
        </div>
      </div>

      <div class="process-steps-list">
        ${plan.sevenSteps.map((step, idx) => `
          <article class="process-step-item glass-panel">
            <div class="step-marker">${step.step.replace(/[^0-9]/g, "")}</div>
            <div class="step-content">
              <h4>${esc(step.title)}</h4>
              <p>${esc(step.detail)}</p>
              <div class="step-actors">
                <strong>${icon("people", 13)} Acteurs mobilisés :</strong>
                <span>${esc(step.actors)}</span>
              </div>
            </div>
          </article>
        `).join("")}
      </div>
      ${sourceLinks(plan.sources)}
    </section>
  `;
}

/* --- 4. RENDU DE LA GESTION DES STAGIAIRES & ALTERNANTS --- */
function renderInternsApprenticesGuide() {
  const guide = RH_INTERNS_APPRENTICES;
  if (!guide) return "";
  return `
    <section class="section-block" id="rh-interns-apprentices">
      <div class="section-title-row">
        <div>
          <span class="eyebrow">TRANSMISSION DES SAVOIRS & PRÉ-RECRUTEMENT</span>
          <h2>Accueil, encadrement & intégration des stagiaires et alternants</h2>
          <p>Du tutorat infirmier à l'alternance de direction : préparer la venue, formaliser les conventions et respecter l'éthique de dignité.</p>
        </div>
      </div>

      <aside class="ethical-dignity-banner glass-panel" style="margin-bottom:24px">
        <div class="ethical-badge">${icon("heart", 18)} <span>LE RESPECT DU RÉSIDENT & DE L'APPRENANT</span></div>
        <p class="ethical-text">${esc(guide.ethicalRule)}</p>
      </aside>

      <div class="notice" style="margin-bottom:20px">
        ${icon("lightbulb", 18)}
        <span><strong>Vision stratégique :</strong> ${esc(guide.strategicVision)}</span>
      </div>

      <div class="section-title-row">
        <div>
          <span class="eyebrow">DEUX STATUTS, DEUX CADRES JURIDIQUES</span>
          <h3>Stagiaires de formation initiale vs Alternants en contrat de travail</h3>
        </div>
      </div>

      <div class="intern-profiles-grid">
        ${guide.types.map(t => `
          <article class="content-card glass-panel">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
              <span class="tag sky">${esc(t.category)}</span>
            </div>
            <p><strong>Profils accueillis :</strong> ${esc(t.profiles)}</p>
            <div class="separator"></div>
            <p><strong>Cadre légal & gratification :</strong> ${esc(t.framework)}</p>
            <p style="margin-top:6px"><strong>Durée du travail & repos :</strong> ${esc(t.hours)}</p>
          </article>
        `).join("")}
      </div>

      <div class="section-title-row" style="margin-top:28px">
        <div>
          <span class="eyebrow">LE CYCLE D'INTÉGRATION EN 5 PHASES</span>
          <h3>Accompagner l'apprenant de J-15 jusqu'à l'évaluation finale</h3>
        </div>
      </div>

      <div class="integration-phases-grid">
        ${guide.fivePhases.map((phase, idx) => `
          <div class="phase-card glass-panel">
            <div class="phase-card-head">
              <span class="icon-bubble mint">${icon("check", 15)}</span>
              <h4>${esc(phase.phase)}</h4>
            </div>
            <ul class="bullet-list phase-actions">
              ${phase.actions.map(act => `<li>${esc(act)}</li>`).join("")}
            </ul>
          </div>
        `).join("")}
      </div>
      ${sourceLinks(guide.sources)}
    </section>
  `;
}

/* --- 5. PAGE DÉDIÉE : INSPECTION DE L'ARS --- */
function renderArsInspection() {
  const guide = ARS_INSPECTION_GUIDE;
  const erpGuide = ERP_SECURITY_GUIDE || window.MOSAQUE_DATA?.ERP_SECURITY_GUIDE;
  const confGuide = CONFORMITY_VISIT_GUIDE || window.MOSAQUE_DATA?.CONFORMITY_VISIT_GUIDE;
  const sirenaGuide = SIRENA_SYSTEM_GUIDE || window.MOSAQUE_DATA?.SIRENA_SYSTEM_GUIDE;
  const matvigGuide = MATERIOVIGILANCE_GUIDE || window.MOSAQUE_DATA?.MATERIOVIGILANCE_GUIDE;
  const napirGuide = NAPIR_LIBERTY_GUIDE || window.MOSAQUE_DATA?.NAPIR_LIBERTY_GUIDE;
  if (!guide) return "";
  const isUnlocked = isPremiumUnlocked();

  return `
    <section class="page" aria-labelledby="ars-inspection-title">
      ${sectionHead(
        "POLICE SANITAIRE · CONTRÔLE DE TUTELLE & CONFORMITÉ",
        "L'Inspection de l'ARS, <span class=\"text-gradient\">préparation, sang-froid et rigueur opérationnelle.</span>",
        "Tout ce que la direction et le cadre de santé doivent maîtriser : les 5 formes d'intervention, la visite de conformité CASF D.313-11, la gestion des alertes SIRENA, la sécurité ERP, la matériovigilance, le protocole NAPIR et le déroulé pas à pas du jour J.",
        `<button class="button subtle" data-nav="responsabilite-penale">${icon("shield",16)}Responsabilité pénale</button><button class="button subtle" data-nav="documents">${icon("file",16)}Documents de pilotage</button><button class="button subtle" data-nav="audit">${icon("target",16)}Audits qualité</button>`
      )}

      <!-- Bannière Éthique Cardinale -->
      <aside class="ethical-dignity-banner glass-panel" style="border-left:4px solid var(--accent-rose);margin-bottom:24px">
        <div class="ethical-badge">${icon("heart", 18)} <span>FINALITÉ SUPRÊME DU CONTRÔLE DE TUTELLE</span></div>
        <p class="ethical-text" style="font-size:14px;line-height:1.65">${esc(guide.ethicalCore)}</p>
      </aside>

      <!-- Fondement Juridique & Prérogatives -->
      <div class="notice glass-panel" style="margin:16px 0 28px;border:1px solid rgba(117,224,194,0.3);background:rgba(117,224,194,0.04);border-radius:16px;padding:16px 20px">
        ${icon("shield", 22)}
        <div style="font-size:13.5px;line-height:1.65">
          <strong style="color:var(--text)">Fondement juridique opposable :</strong> ${esc(guide.legalBasis)}
          <div style="margin-top:4px;color:var(--text-soft)">Les inspecteurs de santé publique assermentés disposent d'un droit d'accès permanent à tous les locaux de l'établissement (y compris la nuit et le week-end), peuvent s'entretenir avec tout membre du personnel sans témoin et se faire communiquer immédiatement tout document utile.</div>
        </div>
      </div>

      ${renderAccessStatusBar()}

      <!-- 1. TYPOLOGIE DES CONTRÔLES ARS (REFONTE APPLE DESIGN) -->
      <div class="section-block" data-page-theme="Typologie">
        <div class="section-title-row" style="margin-bottom:20px">
          <div>
            <span class="eyebrow" style="color:var(--mint);font-size:11px;font-weight:750;letter-spacing:0.08em;text-transform:uppercase">5 FORMES D'INTERVENTIONS</span>
            <h2 style="font-size:24px;font-weight:750;letter-spacing:-0.025em;margin:4px 0 6px">Les différents types d'inspections de l'ARS</h2>
            <p style="font-size:13px;color:var(--text-soft);margin:0">Comprendre le motif et la cinétique de la visite pour adapter immédiatement la posture de l'encadrement.</p>
          </div>
        </div>

        <div class="inspection-typology-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:18px">
          ${guide.typology.map((t, idx) => {
            const isUrgent = t.type.includes("inopinée") || t.type.includes("réactive");
            const pillColor = idx === 0 ? "rgba(117,224,194,0.14)" : idx === 1 ? "rgba(244,63,94,0.16)" : idx === 2 ? "rgba(143,199,245,0.14)" : idx === 3 ? "rgba(245,158,11,0.16)" : "rgba(167,139,250,0.14)";
            const textColor = idx === 0 ? "var(--mint)" : idx === 1 ? "#ff6b81" : idx === 2 ? "var(--accent-cyan)" : idx === 3 ? "var(--gold)" : "var(--accent-lavender)";
            const icons = ["calendar", "zap", "users", "alert", "target"];
            
            // Éclatement précis du contenu textuel en repères visuels clairs
            let details = [];
            if (idx === 0) {
              details = [
                { label: "Cadre", val: "Programme Régional d'Inspection et de Contrôle (PRIC)." },
                { label: "Préavis", val: "Courrier officiel reçu quelques jours à semaines à l'avance." },
                { label: "Réflexe Cadre", val: "Rassembler le 'Classeur d'inspection' et vérifier les plannings." }
              ];
            } else if (idx === 1) {
              details = [
                { label: "Préavis", val: "AUCUN · Présentation immédiate 24h/24 (matin, nuit, week-end)." },
                { label: "Objectif", val: "Constater la réalité brute du fonctionnement opérationnel." },
                { label: "Réflexe Cadre", val: "Vérifier les cartes des inspecteurs et installer la cellule d'accueil." }
              ];
            } else if (idx === 2) {
              details = [
                { label: "Tutelles", val: "Inspecteurs ARS (Soins/Santé) + Contrôleurs CD (Dépendance/Social)." },
                { label: "Champs", val: "Soins infirmiers, hygiène, effectifs socio-éducatifs et tarification." },
                { label: "Réflexe Cadre", val: "Mobiliser le Cadre de santé et le Directeur d'établissement." }
              ];
            } else if (idx === 3) {
              details = [
                { label: "Déclencheur", val: "Signalement EIGS, réclamation famille, alerte maltraitance SIRENA." },
                { label: "Ambiance", val: "Investigation ciblée, recherche immédiate d'anomalies de prise en charge." },
                { label: "Réflexe Cadre", val: "Fournir la chronologie REX factuelle et les mesures correctives." }
              ];
            } else {
              details = [
                { label: "Thématique", val: "Risque spécifique : médicament (PUI), contention/NAPIR, sécurité incendie." },
                { label: "Acteurs", val: "Pharmacien PUI, médecin coordonnateur, cadre et responsable SSI." },
                { label: "Réflexe Cadre", val: "Mettre à disposition les ordonnanciers, DUERP et fiches de suivi." }
              ];
            }

            return `
              <article class="content-card glass-panel apple-card" style="padding:22px;display:flex;flex-direction:column;justify-content:space-between;border-top:3.5px solid ${textColor}">
                <div>
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
                    <span class="apple-pill" style="background:${pillColor};color:${textColor}">
                      ${icon(icons[idx] || "shield", 12)} TYPE 0${idx+1}
                    </span>
                    ${isUrgent ? `<span class="tag warning" style="font-size:10.5px;padding:3px 9px;border-radius:999px">${icon("alert", 11)} Alerte / Inopiné</span>` : `<span class="tag compact-tag" style="font-size:10.5px">Programmé</span>`}
                  </div>
                  
                  <h3 style="font-size:16.5px;font-weight:720;letter-spacing:-0.02em;margin:0 0 10px;color:var(--text)">
                    ${esc(t.type)}
                  </h3>
                  
                  <p style="font-size:13px;line-height:1.6;color:var(--text-soft);margin:0 0 16px">
                    ${esc(t.context)}
                  </p>
                </div>

                <div class="apple-card-points" style="border-top:1px solid rgba(255,255,255,0.07);padding-top:12px;margin-top:auto">
                  ${details.map(d => `
                    <div style="font-size:12.5px;margin-bottom:6px;line-height:1.5">
                      <strong style="color:var(--text);font-weight:680">${esc(d.label)} :</strong>
                      <span style="color:var(--text-soft)"> ${esc(d.val)}</span>
                    </div>
                  `).join("")}
                </div>
              </article>
            `;
          }).join("")}
        </div>
      </div>

      <!-- 2. VISITE DE CONFORMITÉ ARS / CONSEIL DÉPARTEMENTAL (CASF D.313-11) -->
      ${confGuide ? `
        <div class="section-block" data-page-theme="Conformité" style="margin-top:36px">
          <div class="section-title-row">
            <div>
              <span class="eyebrow" style="color:var(--gold);font-size:11px;font-weight:750;letter-spacing:0.08em;text-transform:uppercase">PRÉALABLE OBLIGATOIRE À L'OUVERTURE</span>
              <h2 style="font-size:24px;font-weight:750;letter-spacing:-0.025em;margin:4px 0 6px">La Visite de Conformité (CASF art. D. 313-11)</h2>
              <p style="font-size:13px;color:var(--text-soft);margin:0">Le contrôle in situ conditionnant la mise en service effective de tout établissement ou extension autorisée.</p>
            </div>
          </div>

          <div class="notice compact-notice" style="margin-bottom:18px;background:rgba(248,211,136,0.06);border-left:3.5px solid var(--gold);border-radius:14px;padding:14px 18px">
            ${icon("shield", 18)}
            <span style="font-size:13px;line-height:1.6"><strong>Règle d'or légale :</strong> ${esc(confGuide.legalBasis)}</span>
          </div>

          <div class="grid-2col" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:18px;margin-bottom:18px">
            <article class="content-card glass-panel apple-card" style="padding:22px">
              <h4 style="font-size:15px;font-weight:720;color:var(--text);margin:0 0 12px;display:flex;align-items:center;gap:8px">
                ${icon("target", 16)} 4 Objectifs du contrôle
              </h4>
              <ul class="bullet-list" style="font-size:13px;line-height:1.65;color:var(--text-soft);margin:0">
                ${confGuide.objectifs.map(ob => `<li>${esc(ob)}</li>`).join("")}
              </ul>
            </article>

            <article class="content-card glass-panel apple-card" style="padding:22px">
              <h4 style="font-size:15px;font-weight:720;color:var(--text);margin:0 0 12px;display:flex;align-items:center;gap:8px">
                ${icon("file", 16)} 8 Pièces indispensables du dossier
              </h4>
              <ul class="bullet-list" style="font-size:13px;line-height:1.65;color:var(--text-soft);margin:0">
                ${confGuide.documentsRequis.map(d => `<li>${esc(d)}</li>`).join("")}
              </ul>
            </article>
          </div>

          <div class="process-steps-list" style="margin-top:14px">
            ${confGuide.deroulement.map((st, i) => `
              <article class="process-step-item glass-panel apple-card" style="padding:16px 20px">
                <div class="step-marker" style="background:var(--gold);color:#0b1420;font-weight:800;font-size:13px">0${i+1}</div>
                <div class="step-content">
                  <h4 style="font-size:15px;font-weight:720;margin:0 0 4px">${esc(st.etape)}</h4>
                  <p style="font-size:13px;color:var(--text-soft);margin:0;line-height:1.6">${esc(st.details)}</p>
                </div>
              </article>
            `).join("")}
          </div>
        </div>
      ` : ""}

      <!-- 3. SYSTÈME SIRENA & MATÉRIOVIGILANCE -->
      <div class="section-block" data-page-theme="Vigilances" style="margin-top:36px">
        <div class="section-title-row">
          <div>
            <span class="eyebrow" style="color:var(--mint);font-size:11px;font-weight:750;letter-spacing:0.08em;text-transform:uppercase">VIGILANCES SANITAIRES & SIGNALEMENTS</span>
            <h2 style="font-size:24px;font-weight:750;letter-spacing:-0.025em;margin:4px 0 6px">Système SIRENA & Matériovigilance des Dispositifs Médicaux</h2>
            <p style="font-size:13px;color:var(--text-soft);margin:0">Comment l'ARS instruit les alertes sanitaires et comment réagir en cas d'incident sur un dispositif médical.</p>
          </div>
        </div>

        <div class="grid-2col" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(310px,1fr));gap:18px">
          <!-- SIRENA -->
          ${sirenaGuide ? `
            <article class="content-card glass-panel apple-card" style="padding:22px;border-top:3.5px solid var(--accent-mint)">
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
                <span class="icon-bubble mint">${icon("network", 16)}</span>
                <h3 style="font-size:16px;font-weight:720;margin:0">Plateforme SIRENA de l'ARS</h3>
              </div>
              <p style="font-size:13px;line-height:1.6;color:var(--text-soft);margin-bottom:14px">${esc(sirenaGuide.overview)}</p>
              <div style="font-size:12.5px;font-weight:700;margin-bottom:8px;color:var(--text)">Circuit d'instruction :</div>
              <div style="display:flex;flex-direction:column;gap:8px">
                ${sirenaGuide.circuitSignalement.map(c => `
                  <div style="padding:10px 12px;background:rgba(255,255,255,0.03);border-radius:10px;font-size:12.5px;line-height:1.5">
                    <strong style="color:var(--mint)">${esc(c.acteur)} :</strong> <span style="color:var(--text-soft)">${esc(c.role)}</span>
                  </div>
                `).join("")}
              </div>
            </article>
          ` : ""}

          <!-- Matériovigilance -->
          ${matvigGuide ? `
            <article class="content-card glass-panel apple-card" style="padding:22px;border-top:3.5px solid var(--accent-coral)">
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
                <span class="icon-bubble coral">${icon("alert", 16)}</span>
                <h3 style="font-size:16px;font-weight:720;margin:0">Matériovigilance (Dispositifs Médicaux)</h3>
              </div>
              <p style="font-size:13px;line-height:1.6;color:var(--text-soft);margin-bottom:14px">${esc(matvigGuide.overview)}</p>
              <div style="padding:12px 14px;background:rgba(244,63,94,0.08);border-radius:12px;margin-bottom:14px;border:1px solid rgba(244,63,94,0.25)">
                <strong style="font-size:13px;color:#ff6b81">${icon("shield", 14)} Règle absolue de Quarantaine :</strong>
                <p style="font-size:12.5px;color:var(--text-soft);margin:4px 0 0;line-height:1.55">Isoler immédiatement le DM (lit, lève-personne, seringue). Ne JAMAIS le nettoyer, ne pas le réparer ni changer les réglages avant l'expertise contradictoire.</p>
              </div>
              <div style="display:flex;flex-direction:column;gap:8px">
                ${matvigGuide.procedureEnCasDIncident.map(p => `
                  <div style="font-size:12.5px;line-height:1.55">
                    <strong style="color:var(--text)">${esc(p.action)} :</strong> <span style="color:var(--text-soft)">${esc(p.detail)}</span>
                  </div>
                `).join("")}
              </div>
            </article>
          ` : ""}
        </div>
      </div>

      <!-- 4. SÉCURITÉ ERP & COMMISSION DE SÉCURITÉ -->
      ${erpGuide ? `
        <div class="section-block" data-page-theme="ERP" style="margin-top:36px">
          <div class="section-title-row">
            <div>
              <span class="eyebrow" style="color:var(--accent-coral);font-size:11px;font-weight:750;letter-spacing:0.08em;text-transform:uppercase">SÉCURITÉ INCENDIE EN ERP</span>
              <h2 style="font-size:24px;font-weight:750;letter-spacing:-0.025em;margin:4px 0 6px">Sécurité ERP & Commission de Sécurité</h2>
              <p style="font-size:13px;color:var(--text-soft);margin:0">Règles spécifiques au Type U (Sanitaire) et Type J (Médico-social) et vérification des documents réglementaires.</p>
            </div>
          </div>

          <div class="notice compact-notice" style="margin-bottom:18px;border-radius:14px;padding:14px 18px">
            ${icon("shield", 18)}
            <span style="font-size:13px;line-height:1.6"><strong>Principe fondamental :</strong> ${esc(erpGuide.overview)}</span>
          </div>

          <div class="grid-2col" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:18px;margin-bottom:18px">
            ${erpGuide.types.map(tp => `
              <article class="content-card glass-panel apple-card" style="padding:22px;border-top:3.5px solid ${tp.type.includes('Type U') ? 'var(--accent-cyan)' : 'var(--accent-lavender)'}">
                <h4 style="font-size:15.5px;font-weight:720;margin:0 0 4px">${esc(tp.type)}</h4>
                <div style="font-size:12px;color:var(--text-soft);margin-bottom:10px">Champ : ${esc(tp.scope)}</div>
                <ul class="bullet-list" style="font-size:13px;line-height:1.6;color:var(--text-soft);margin:0">
                  ${tp.rules.map(r => `<li>${esc(r)}</li>`).join("")}
                </ul>
              </article>
            `).join("")}
          </div>

          <!-- Documents Réglementaires & Contrôles Périodiques -->
          <article class="content-card glass-panel apple-card" style="padding:22px;margin-top:16px">
            <h4 style="font-size:15.5px;font-weight:720;color:var(--text);margin:0 0 14px;display:flex;align-items:center;gap:8px">
              ${icon("file", 18)} 9 Vérifications Techniques & Documents Réglementaires Obligatoires
            </h4>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:14px">
              ${erpGuide.documentsReglementaires.map(doc => `
                <div style="padding:12px 14px;background:rgba(255,255,255,0.03);border-radius:12px;border:1px solid rgba(255,255,255,0.06)">
                  <div style="font-size:13.5px;font-weight:720;color:var(--text);margin-bottom:3px">${esc(doc.doc)}</div>
                  <span class="tag compact-tag" style="font-size:10.5px;margin-bottom:6px;display:inline-block">${esc(doc.frequence)}</span>
                  <p style="font-size:12.5px;color:var(--text-soft);margin:0;line-height:1.55">${esc(doc.contenu)}</p>
                </div>
              `).join("")}
            </div>
          </article>
        </div>
      ` : ""}

      <!-- 5. NAPIR : ATTEINTE AU DROIT D'ALLER ET VENIR -->
      ${napirGuide ? `
        <div class="section-block" data-page-theme="NAPIR" style="margin-top:36px">
          <div class="section-title-row">
            <div>
              <span class="eyebrow" style="color:var(--accent-rose);font-size:11px;font-weight:750;letter-spacing:0.08em;text-transform:uppercase">LIBERTÉS FONDAMENTALES & BIENTRAITANCE</span>
              <h2 style="font-size:24px;font-weight:750;letter-spacing:-0.025em;margin:4px 0 6px">Mesures NAPIR & Atteinte au droit d'aller et venir</h2>
              <p style="font-size:13px;color:var(--text-soft);margin:0">Contention physique, barrières de lit, unités fermées et respect absolu de la dignité selon la loi Bien Vieillir 2024.</p>
            </div>
          </div>

          <aside class="ethical-dignity-banner glass-panel" style="margin-bottom:18px;background:rgba(244,63,94,0.05);border-color:rgba(244,63,94,0.3);border-radius:16px;padding:16px 20px">
            <div class="ethical-badge">${icon("heart", 16)} <span>CADRE LÉGAL INTRANSIGEANT DE LA HAS ET DU CASF</span></div>
            <p class="ethical-text" style="font-size:13.5px;line-height:1.6">${esc(napirGuide.overview)}</p>
          </aside>

          <div class="grid-2col" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:18px">
            <article class="content-card glass-panel apple-card" style="padding:22px">
              <h4 style="font-size:15px;font-weight:720;margin:0 0 12px">${icon("shield", 16)} 4 Principes Cardinaux d'Encadrement</h4>
              <div style="display:flex;flex-direction:column;gap:12px">
                ${napirGuide.principesCardinaux.map(p => `
                  <div>
                    <strong style="font-size:13px;color:var(--text)">${esc(p.principe)}</strong>
                    <p style="font-size:12.5px;color:var(--text-soft);margin:3px 0 0;line-height:1.55">${esc(p.regle)}</p>
                  </div>
                `).join("")}
              </div>
            </article>

            <article class="content-card glass-panel apple-card" style="padding:22px">
              <h4 style="font-size:15px;font-weight:720;margin:0 0 12px">${icon("clipboard", 16)} Check-list de Contrôle du Cadre</h4>
              <ul class="bullet-list" style="font-size:13px;line-height:1.65;color:var(--text-soft);margin:0">
                ${napirGuide.checkListCadre.map(ck => `<li>${esc(ck)}</li>`).join("")}
              </ul>
              <div style="margin-top:14px;padding:10px 12px;background:rgba(244,63,94,0.08);border-radius:10px;font-size:12px;color:#ff6b81;line-height:1.5">
                <strong>Attention pénale :</strong> Toute contention sans prescription médicale en cours expose à des poursuites pour séquestration arbitraire (art. 224-1 Code pénal).
              </div>
            </article>
          </div>
        </div>
      ` : ""}

      <!-- 6. PRÉPARATION EN AMONT & CLASSEUR D'INSPECTION -->
      <div class="section-block" data-page-theme="Préparation" style="margin-top:36px">
        <div class="section-title-row">
          <div>
            <span class="eyebrow" style="color:var(--mint);font-size:11px;font-weight:750;letter-spacing:0.08em;text-transform:uppercase">PHASE AMONT · ANTICIPATION CONTINUE</span>
            <h2 style="font-size:24px;font-weight:750;letter-spacing:-0.025em;margin:4px 0 6px">${esc(guide.preparationPhase.title)}</h2>
            <p style="font-size:13px;color:var(--text-soft);margin:0">${esc(guide.preparationPhase.desc)}</p>
          </div>
        </div>

        <div class="notice compact-notice" style="margin-bottom:18px;border-radius:14px;padding:14px 18px">
          ${icon("users", 16)}
          <span style="font-size:13px"><strong>Cellule d'accueil inspection :</strong> ${esc(guide.preparationPhase.crisisCell)}</span>
        </div>

        <div class="inspection-docs-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px">
          ${guide.preparationPhase.documents.map(group => `
            <article class="content-card glass-panel apple-card" style="padding:20px">
              <h4 style="font-size:14.5px;font-weight:720;color:var(--text);margin:0 0 10px;display:flex;align-items:center;gap:6px">
                ${icon("file", 14)} ${esc(group.group)}
              </h4>
              <ul class="bullet-list" style="font-size:13px;line-height:1.6;color:var(--text-soft);margin:0">
                ${group.items.map(it => `<li>${esc(it)}</li>`).join("")}
              </ul>
            </article>
          `).join("")}
        </div>
      </div>

      ${isUnlocked ? `
        <!-- 7. LE DÉROULEMENT SUR LE TERRAIN JOUR J -->
        <div class="section-block" data-page-theme="Jour J" style="margin-top:36px">
          <div class="section-title-row">
            <div>
              <span class="eyebrow" style="color:var(--gold);font-size:11px;font-weight:750;letter-spacing:0.08em;text-transform:uppercase">LE DÉROULEMENT SUR LE TERRAIN</span>
              <h2 style="font-size:24px;font-weight:750;letter-spacing:-0.025em;margin:4px 0 6px">${esc(guide.dayJPhase.title)}</h2>
              <p style="font-size:13px;color:var(--text-soft);margin:0">Chronologie rigoureuse d'une visite d'inspection in situ pour garder la maîtrise des échanges.</p>
            </div>
          </div>

          <div class="process-steps-list">
            ${guide.dayJPhase.steps.map(st => `
              <article class="process-step-item glass-panel apple-card" style="padding:16px 20px">
                <div class="step-marker" style="font-weight:800;font-size:13px">0${st.step}</div>
                <div class="step-content">
                  <h4 style="font-size:15px;font-weight:720;margin:0 0 6px">${esc(st.name)}</h4>
                  <p style="font-size:13px;color:var(--text-soft);margin:0;line-height:1.6">${esc(st.action)}</p>
                </div>
              </article>
            `).join("")}
          </div>
        </div>

        <!-- 8. POST-INSPECTION & PHASE CONTRADICTOIRE -->
        <div class="section-block" data-page-theme="Post-inspection" style="margin-top:36px">
          <div class="section-title-row">
            <div>
              <span class="eyebrow" style="color:var(--mint);font-size:11px;font-weight:750;letter-spacing:0.08em;text-transform:uppercase">APRÈS LA VISITE · PHASE CONTRADICTOIRE & SUIVI</span>
              <h2 style="font-size:24px;font-weight:750;letter-spacing:-0.025em;margin:4px 0 6px">${esc(guide.postInspectionPhase.title)}</h2>
              <p style="font-size:13px;color:var(--text-soft);margin:0">Transformer les constats des inspecteurs en plan de mise en conformité protecteur et pérenne.</p>
            </div>
          </div>

          <div class="post-inspection-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px">
            ${guide.postInspectionPhase.substeps.map((sub, i) => `
              <article class="content-card glass-panel apple-card" style="padding:20px;border-left:3.5px solid var(--accent-mint)">
                <h4 style="font-size:15px;font-weight:720;margin:0 0 6px">${esc(sub.name)}</h4>
                <p style="font-size:13px;line-height:1.6;color:var(--text-soft);margin:0">${esc(sub.desc)}</p>
              </article>
            `).join("")}
          </div>

          <div class="notice compact-notice" style="margin-top:20px;border-left:3.5px solid var(--accent-coral);border-radius:14px;padding:14px 18px">
            ${icon("alert", 18)}
            <div>
              <strong style="color:#ff6b81">Graduation des sanctions de tutelle :</strong>
              <ul class="bullet-list" style="margin-top:6px;font-size:13px;color:var(--text-soft)">
                ${guide.postInspectionPhase.sanctions.map(s => `<li>${esc(s)}</li>`).join("")}
              </ul>
            </div>
          </div>
        </div>
      ` : paywallGate(
        "Protocole Jour J & Phase Contradictoire ARS (Premium)",
        "Accédez au déroulé détaillé en 6 étapes le jour J, à la conduite de la réunion de clôture, à la rédaction du mémoire en réponse contradictoire et au pilotage du Plan d'Actions Correctives (PAC).",
        `<div class="premium-preview-grid"><div><strong>Jour J</strong><span>6 étapes chronologiques</span></div><div><strong>Contradictoire</strong><span>Mémoire en réponse sous 1 mois</span></div><div><strong>Plan d'action</strong><span>Levée des injonctions et prescriptions</span></div></div>`
      )}

      ${sourceLinks(guide.sources)}
    </section>
  `;
}

function renderManagementTransition() {
  const guide = MANAGEMENT_TRANSITION_GUIDE;
  if (!guide) return "";
  const isUnlocked = isPremiumUnlocked();

  return `
    <section class="page" aria-labelledby="transition-title">
      ${sectionHead(
        "GOUVERNANCE & LEADERSHIP INSTITUTIONNEL",
        "Changement de direction, <span class=\"text-gradient\">tenir le cap, sécuriser la passation et accompagner le renouveau.</span>",
        "Les 4 contextes de transition, les 4 enjeux majeurs pour l'établissement, le dossier de passation du service (RH, sécurité ERP, vigilances, usagers) et le positionnement stratégique du cadre de santé comme garant de la stabilité.",
        `<button class="button subtle" data-nav="responsabilite-penale">${icon("shield",16)}Responsabilité pénale</button><button class="button subtle" data-nav="metiers">${icon("briefcase",16)}Métiers de direction</button><button class="button subtle" data-nav="reunions">${icon("calendar",16)}Instances & Réunions</button>`
      )}

      <!-- Bannière Éthique -->
      <aside class="ethical-dignity-banner glass-panel" style="margin-bottom:24px;border-left:4px solid var(--accent-lavender);border-radius:16px;padding:16px 20px">
        <div class="ethical-badge">${icon("heart", 18)} <span>LE CAP DÉONTOLOGIQUE INVARIABLE</span></div>
        <p class="ethical-text" style="font-size:14px;line-height:1.65">${esc(guide.ethicalAnchor)}</p>
      </aside>

      <div class="notice glass-panel" style="margin:16px 0 28px;border-radius:16px;padding:16px 20px">
        ${icon("spark", 18)}
        <span style="font-size:13.5px;line-height:1.6"><strong>Repère managérial :</strong> ${esc(guide.overview)}</span>
      </div>

      ${renderAccessStatusBar()}

      <!-- 1. CONTEXTES DÉCISIONNELS -->
      <div class="section-block" data-page-theme="Contextes">
        <div class="section-title-row" style="margin-bottom:20px">
          <div>
            <span class="eyebrow" style="color:var(--accent-lavender);font-size:11px;font-weight:750;letter-spacing:0.08em;text-transform:uppercase">4 SITUATIONS DE DÉPART ET D'ARRIVÉE</span>
            <h2 style="font-size:24px;font-weight:750;letter-spacing:-0.025em;margin:4px 0 6px">Les différents contextes de changement de direction</h2>
            <p style="font-size:13px;color:var(--text-soft);margin:0">Identifier la dynamique de transition pour adapter sa communication et son accompagnement des équipes.</p>
          </div>
        </div>
        <div class="transition-contexts-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:18px">
          ${guide.contexts.map((ctx, i) => `
            <article class="content-card glass-panel apple-card" style="padding:22px;display:flex;flex-direction:column;justify-content:space-between;border-top:3.5px solid ${i === 0 ? 'var(--mint)' : i === 1 ? 'var(--accent-coral)' : i === 2 ? 'var(--gold)' : 'var(--accent-cyan)'}">
              <div>
                <span class="apple-pill" style="background:rgba(255,255,255,0.06);color:var(--text-soft);margin-bottom:10px">
                  SITUATION 0${i+1}
                </span>
                <h3 style="font-size:16.5px;font-weight:720;letter-spacing:-0.02em;margin:0 0 10px;color:var(--text)">${esc(ctx.title)}</h3>
                <p style="font-size:13px;line-height:1.6;color:var(--text-soft);margin:0">${esc(ctx.desc)}</p>
              </div>
            </article>
          `).join("")}
        </div>
      </div>

      <!-- 2. LES 4 ENJEUX INSTITUTIONNELS -->
      <div class="section-block" data-page-theme="Enjeux" style="margin-top:36px">
        <div class="section-title-row" style="margin-bottom:20px">
          <div>
            <span class="eyebrow" style="color:var(--gold);font-size:11px;font-weight:750;letter-spacing:0.08em;text-transform:uppercase">LES 4 ENJEUX MAJEURS DE L'ÉTABLISSEMENT</span>
            <h2 style="font-size:24px;font-weight:750;letter-spacing:-0.025em;margin:4px 0 6px">Ce qui se joue lors d'une transition managériale</h2>
            <p style="font-size:13px;color:var(--text-soft);margin:0">Préserver l'équilibre institutionnel et la qualité d'accueil pendant toute la période de passation.</p>
          </div>
        </div>
        <div class="transition-challenges-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:18px">
          ${guide.challenges.map(ch => `
            <article class="content-card glass-panel apple-card" style="padding:22px">
              <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
                <span class="icon-bubble coral" style="padding:8px">${icon(ch.icon, 18)}</span>
                <h3 style="font-size:15.5px;font-weight:720;margin:0">${esc(ch.challenge)}</h3>
              </div>
              <p style="font-size:13px;line-height:1.6;color:var(--text-soft);margin:0">${esc(ch.desc)}</p>
            </article>
          `).join("")}
        </div>
      </div>

      ${isUnlocked ? `
        <!-- 3. POSTURE DU CADRE -->
        <div class="section-block" data-page-theme="Positionnement" style="margin-top:36px">
          <div class="section-title-row" style="margin-bottom:20px">
            <div>
              <span class="eyebrow" style="color:var(--accent-lavender);font-size:11px;font-weight:750;letter-spacing:0.08em;text-transform:uppercase">POSTURE & ENGAGEMENT DU CADRE</span>
              <h2 style="font-size:24px;font-weight:750;letter-spacing:-0.025em;margin:4px 0 6px">Le positionnement du cadre : pilier de stabilité et courroie de transmission</h2>
              <p style="font-size:13px;color:var(--text-soft);margin:0">Adopter l'attitude juste entre loyauté institutionnelle, écoute des soignants et objectivité opérationnelle.</p>
            </div>
          </div>

          <div class="cadre-posture-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:18px">
            ${guide.cadreRole.posture.map(p => `
              <article class="content-card glass-panel apple-card" style="padding:22px;border-top:3.5px solid var(--accent-lavender)">
                <h4 style="font-size:15.5px;font-weight:720;margin:0 0 10px;color:var(--text)">${esc(p.title)}</h4>
                <p style="font-size:13px;line-height:1.6;color:var(--text-soft);margin:0">${esc(p.desc)}</p>
              </article>
            `).join("")}
          </div>
        </div>

        <!-- 4. DOSSIER DE PASSATION -->
        <div class="section-block" data-page-theme="Passation" style="margin-top:36px">
          <div class="section-title-row" style="margin-bottom:20px">
            <div>
              <span class="eyebrow" style="color:var(--mint);font-size:11px;font-weight:750;letter-spacing:0.08em;text-transform:uppercase">OUTIL CONCRET POUR LE NOUVEAU DIRECTEUR</span>
              <h2 style="font-size:24px;font-weight:750;letter-spacing:-0.025em;margin:4px 0 6px">${esc(guide.cadreRole.handoverDossier.title)}</h2>
              <p style="font-size:13px;color:var(--text-soft);margin:0">La trame d'état des lieux factuelle et synthétique que le cadre doit préparer pour la première rencontre.</p>
            </div>
          </div>

          <div class="handover-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:18px">
            ${guide.cadreRole.handoverDossier.sections.map(sec => `
              <article class="content-card glass-panel apple-card" style="padding:22px;border-left:3.5px solid var(--accent-cyan)">
                <h4 style="font-size:15px;font-weight:720;color:var(--text);margin:0 0 10px;display:flex;align-items:center;gap:8px">
                  ${icon("file", 16)} ${esc(sec.name)}
                </h4>
                <p style="font-size:13px;line-height:1.6;color:var(--text-soft);margin:0">${esc(sec.content)}</p>
              </article>
            `).join("")}
          </div>

          <div class="notice compact-notice" style="margin-top:22px;border-left:3.5px solid var(--gold);border-radius:14px;padding:16px 20px">
            ${icon("spark", 18)}
            <div>
              <strong style="color:var(--gold);font-size:13.5px">4 Conseils pour réussir le premier entretien avec le nouveau chef d'établissement :</strong>
              <ul class="bullet-list" style="margin-top:8px;font-size:13px;line-height:1.65;color:var(--text-soft)">
                ${guide.cadreRole.firstMeetingTips.map(tip => `<li>${esc(tip)}</li>`).join("")}
              </ul>
            </div>
          </div>
        </div>
      ` : paywallGate(
        "Posture du Cadre & Dossier de Passation Complet (Premium)",
        "Accédez aux 4 volets du dossier de passation, aux grilles de cartographie d'équipe et aux clés relationnelles pour réussir le premier entretien avec le nouveau chef d'établissement.",
        `<div class="premium-preview-grid"><div><strong>Dossier de passation</strong><span>RH, résidents, risques et projets</span></div><div><strong>Posture</strong><span>Devoir de réserve et courroie de transmission</span></div><div><strong>Entretien J1</strong><span>Co-construction et partenariat</span></div></div>`
      )}

      ${sourceLinks(guide.sources)}
    </section>
  `;
}

function renderPenalResponsibility() {
  const guide = DIRECTOR_PENAL_RESPONSIBILITY_GUIDE || window.MOSAQUE_DATA?.DIRECTOR_PENAL_RESPONSIBILITY_GUIDE;
  const erpGuide = ERP_SECURITY_GUIDE || window.MOSAQUE_DATA?.ERP_SECURITY_GUIDE;
  if (!guide) return "";
  const isUnlocked = isPremiumUnlocked();

  return `
    <section class="page" aria-labelledby="penal-responsibility-title">
      ${sectionHead(
        "DROIT PÉNAL DE LA SANTÉ · GOUVERNANCE & GESTION DES RISQUES",
        "Responsabilité Pénale du Directeur, <span class=\"text-gradient\">maîtriser le risque juridique et protéger l'institution.</span>",
        "Fondements de la loi Fauchon, distinction auteur direct / indirect, cartographie des infractions (homicide involontaire, non-dénonciation de maltraitance art. 434-3, mise en danger ERP), délégation de pouvoir (C.A.M.) et conduite réflexe en cas d'enquête judiciaire.",
        `<button class="button subtle" data-nav="changement-direction">${icon("rotate",16)}Changement de direction</button><button class="button subtle" data-nav="inspection-ars">${icon("target",16)}Inspection ARS</button><button class="button subtle" data-nav="droit-sante">${icon("shield",16)}Droit de la santé</button>`
      )}

      <!-- Bannière Éthique & Responsabilité -->
      <aside class="ethical-dignity-banner glass-panel" style="border-left:4px solid var(--accent-coral);margin-bottom:20px">
        <div class="ethical-badge">${icon("shield", 18)} <span>LA DIGNITÉ ET LA SÉCURITÉ DES USAGERS : BOUSSOLE PÉNALE CARDINALE</span></div>
        <p class="ethical-text" style="font-size:14px;line-height:1.65">
          La responsabilité pénale du directeur n'est ni une fatalité ni un piège abstrait : elle constitue la garantie juridique suprême que la structure de santé ou médico-sociale préserve la vie, la sécurité, la santé physique et psychique et le respect absolu de la dignité des personnes accueillies et des professionnels. Une organisation rigoureuse, tracée et bienveillante constitue le plus solide rempart légal.
        </p>
      </aside>

      <!-- Aperçu Général -->
      <div class="notice glass-panel" style="margin:16px 0 24px;border:1px solid rgba(244,63,94,0.3);background:rgba(244,63,94,0.04)">
        ${icon("alert", 20)}
        <div style="font-size:13px;line-height:1.6">
          <strong>Principe fondamental de responsabilité personnelle :</strong> ${esc(guide.overview)}
        </div>
      </div>

      ${renderAccessStatusBar()}

      <!-- 1. LES FONDEMENTS JURIDIQUES (APPLE DESIGN RESTYLING) -->
      <div class="section-block" data-page-theme="Fondements">
        <div class="section-title-row" style="margin-bottom:20px">
          <div>
            <span class="eyebrow" style="color:var(--mint);font-size:11px;font-weight:750;letter-spacing:0.08em;text-transform:uppercase">CADRE LÉGAL OPPOSABLE</span>
            <h2 style="font-size:24px;font-weight:750;letter-spacing:-0.025em;margin:4px 0 6px">Les 2 principes clés de la responsabilité pénale</h2>
            <p style="font-size:13px;color:var(--text-soft);margin:0">Comprendre la mécanique de l'imputation pénale en droit de la santé et du travail.</p>
          </div>
        </div>

        <div class="penal-principles-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(330px,1fr));gap:20px">
          
          <!-- CARTE 1 : ART 121-2 DU CODE PÉNAL - CUMUL PERSONNE MORALE / PHYSIQUE -->
          <article class="content-card glass-panel apple-card penal-principle-card" style="padding:24px;border-top:4px solid var(--mint);display:flex;flex-direction:column;justify-content:space-between">
            <div>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
                <span class="apple-pill" style="background:rgba(117,224,194,0.14);color:var(--mint);font-weight:750">
                  ${icon("shield", 12)} ARTICLE 121-2 DU CODE PÉNAL
                </span>
                <span class="tag compact-tag" style="font-size:10.5px">Principe de Cumul</span>
              </div>

              <h3 style="font-size:18px;font-weight:750;letter-spacing:-0.02em;margin:0 0 10px;color:var(--text)">
                Cumul : Personne Morale & Personne Physique
              </h3>

              <p style="font-size:13px;line-height:1.6;color:var(--text-soft);margin:0 0 18px">
                La responsabilité pénale de la structure (l'établissement de santé, l'association gestionnaire ou la société commerciale) n'exclut jamais celle du directeur pour les mêmes faits.
              </p>

              <div class="penal-duo-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:12px;margin-bottom:16px">
                <div class="penal-sub-box" style="padding:14px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:14px">
                  <div style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:750;color:var(--text);margin-bottom:8px">
                    🏢 <span>L'Établissement</span>
                  </div>
                  <div style="font-size:12px;color:var(--text-soft);line-height:1.55">
                    <strong style="color:var(--mint)">Personne Morale</strong><br>
                    • Amendes décuplées (taux x5)<br>
                    • Fermeture temporaire ou définitive<br>
                    • Affichage public du jugement
                  </div>
                </div>

                <div class="penal-sub-box" style="padding:14px;background:rgba(244,63,94,0.05);border:1px solid rgba(244,63,94,0.22);border-radius:14px">
                  <div style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:750;color:#ff6b81;margin-bottom:8px">
                    👤 <span>Le Directeur</span>
                  </div>
                  <div style="font-size:12px;color:var(--text-soft);line-height:1.55">
                    <strong style="color:#ff6b81">Personne Physique</strong><br>
                    • Peines d'emprisonnement ferme/sursis<br>
                    • Amendes pénales personnelles<br>
                    • <span style="color:#ff6b81;font-weight:750">STRICTEMENT NON ASSURABLE</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="penal-takeaway" style="padding:12px 14px;background:rgba(117,224,194,0.06);border-radius:12px;border:1px solid rgba(117,224,194,0.2);display:flex;align-items:flex-start;gap:8px;font-size:12px;line-height:1.55">
              ${icon("shield", 14)}
              <span><strong>Règle d'or jurisprudentielle :</strong> Le Parquet assigne quasi-systématiquement les deux entités de concert afin de sanctionner la faute organisationnelle globale et la chaîne managériale.</span>
            </div>
          </article>

          <!-- CARTE 2 : LOI FAUCHON ART 121-3 DU CODE PÉNAL - AUTEUR DIRECT VS INDIRECT -->
          <article class="content-card glass-panel apple-card penal-principle-card" style="padding:24px;border-top:4px solid var(--gold);display:flex;flex-direction:column;justify-content:space-between">
            <div>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
                <span class="apple-pill" style="background:rgba(245,158,11,0.14);color:var(--gold);font-weight:750">
                  ${icon("balance", 12)} LOI FAUCHON · ART. 121-3 DU CODE PÉNAL
                </span>
                <span class="tag warning" style="font-size:10.5px">Fautes Involontaires</span>
              </div>

              <h3 style="font-size:18px;font-weight:750;letter-spacing:-0.02em;margin:0 0 10px;color:var(--text)">
                Distinction clé : Auteur Direct vs Auteur Indirect
              </h3>

              <p style="font-size:13px;line-height:1.6;color:var(--text-soft);margin:0 0 18px">
                La loi du 10 juillet 2000 (dite loi Fauchon) protège les décideurs institutionnels : en matière non intentionnelle, la responsabilité pénale du directeur exige des fautes d'une gravité exceptionnelle.
              </p>

              <div class="penal-duo-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:12px;margin-bottom:16px">
                <div class="penal-sub-box" style="padding:14px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:14px">
                  <div style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:750;color:var(--text);margin-bottom:8px">
                    🩺 <span>Auteur Direct</span>
                  </div>
                  <div style="font-size:12px;color:var(--text-soft);line-height:1.55">
                    <strong style="color:var(--text)">Professionnel de terrain</strong><br>
                    • A commis le geste matériel ou l'acte de soin<br>
                    • Seuil de condamnation : <strong style="color:var(--gold)">Faute simple</strong> (simple inattention, négligence ou maladresse ordinaire)
                  </div>
                </div>

                <div class="penal-sub-box" style="padding:14px;background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.25);border-radius:14px">
                  <div style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:750;color:var(--gold);margin-bottom:8px">
                    🎯 <span>Auteur Indirect</span>
                  </div>
                  <div style="font-size:12px;color:var(--text-soft);line-height:1.55">
                    <strong style="color:var(--gold)">Le Directeur / Organisateur</strong><br>
                    • A créé la situation de risque sans causer directement le dommage<br>
                    • <strong>Double filtre strict Loi Fauchon :</strong><br>
                    <span style="display:inline-block;margin-top:3px;color:var(--text);font-weight:650">1. Faute caractérisée</span> (risque grave connu et non traité)<br>
                    <span style="display:inline-block;margin-top:2px;color:var(--text);font-weight:650">2. Violation délibérée</span> d'une règle de sécurité
                  </div>
                </div>
              </div>
            </div>

            <div class="penal-takeaway" style="padding:12px 14px;background:rgba(245,158,11,0.06);border-radius:12px;border:1px solid rgba(245,158,11,0.22);display:flex;align-items:flex-start;gap:8px;font-size:12px;line-height:1.55">
              ${icon("alert", 14)}
              <span><strong>Bouclier de gestion :</strong> Une difficulté budgétaire ou un manque d'effectif conjoncturel ne suffit pas à caractériser la faute pénale. La preuve d'actions engagées et d'alertes tracées auprès de l'ARS exonère le directeur.</span>
            </div>
          </article>

        </div>
      </div>

      <!-- 2. CARTOGRAPHIE DES INFRACTIONS MAJEURES (APPLE DESIGN RESTYLING) -->
      <div class="section-block" data-page-theme="Infractions" style="margin-top:36px">
        <div class="section-title-row" style="margin-bottom:20px">
          <div>
            <span class="eyebrow" style="color:var(--accent-coral);font-size:11px;font-weight:750;letter-spacing:0.08em;text-transform:uppercase">JURISPRUDENCE & RISQUES CONCRETS</span>
            <h2 style="font-size:24px;font-weight:750;letter-spacing:-0.025em;margin:4px 0 6px">Les 5 infractions majeures engageant le chef d'établissement</h2>
            <p style="font-size:13px;color:var(--text-soft);margin:0">Analyse des chefs de poursuite les plus fréquents en milieu hospitalier et médico-social.</p>
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:18px">
          ${guide.principalesInfractions.map((inf, idx) => {
            const styles = [
              { border: "var(--accent-coral)", pillBg: "rgba(244,63,94,0.14)", pillColor: "#ff6b81", icon: "alert" },
              { border: "var(--accent-cyan)", pillBg: "rgba(143,199,245,0.14)", pillColor: "var(--accent-cyan)", icon: "shield" },
              { border: "var(--gold)", pillBg: "rgba(245,158,11,0.14)", pillColor: "var(--gold)", icon: "target" },
              { border: "var(--accent-rose)", pillBg: "rgba(251,113,133,0.14)", pillColor: "var(--accent-rose)", icon: "heart" },
              { border: "var(--mint)", pillBg: "rgba(117,224,194,0.14)", pillColor: "var(--mint)", icon: "users" }
            ][idx % 5];

            return `
              <article class="content-card glass-panel apple-card penal-infraction-card" style="padding:22px;border-left:4.5px solid ${styles.border}">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:14px">
                  <div style="flex:1;min-width:260px">
                    <span class="apple-pill" style="background:${styles.pillBg};color:${styles.pillColor};margin-bottom:6px">
                      ${icon(styles.icon, 12)} INFRACTION N°0${idx+1}
                    </span>
                    <h3 style="font-size:17px;font-weight:750;letter-spacing:-0.02em;margin:0;color:var(--text)">
                      ${esc(inf.nom)}
                    </h3>
                  </div>
                  <div class="penal-sanction-tag" style="padding:6px 14px;border-radius:999px;background:rgba(244,63,94,0.12);border:1px solid rgba(244,63,94,0.3);color:#ff6b81;font-size:12px;font-weight:750;display:inline-flex;align-items:center;gap:6px">
                    ${icon("alert", 13)} ${esc(inf.sanction)}
                  </div>
                </div>

                <div style="font-size:12px;font-weight:750;letter-spacing:0.04em;text-transform:uppercase;color:var(--gold);margin:14px 0 8px;display:flex;align-items:center;gap:6px">
                  ${icon("file", 14)} Cas concrets issus de la jurisprudence hospitalière & médico-sociale :
                </div>

                <div class="penal-cases-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:10px">
                  ${inf.exemplesJurisprudence.map(ex => `
                    <div class="penal-case-box" style="padding:12px 14px;background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.06);border-radius:12px;font-size:12.5px;line-height:1.55;color:var(--text-soft);display:flex;align-items:flex-start;gap:8px">
                      <span style="color:${styles.pillColor};font-size:14px;line-height:1;margin-top:2px">▸</span>
                      <span>${esc(ex)}</span>
                    </div>
                  `).join("")}
                </div>
              </article>
            `;
          }).join("")}
        </div>
      </div>

      ${isUnlocked ? `
        <!-- 3. LA DÉLÉGATION DE POUVOIR : LE BOUCLIER JURIDIQUE -->
        <div class="section-block" data-page-theme="Délégation" style="margin-top:28px">
          <div class="section-title-row">
            <div>
              <span class="eyebrow" style="color:var(--mint)">SÉCURISATION JURIDIQUE</span>
              <h2>La Délégation de Pouvoir : conditions et limites</h2>
              <p>Comment transférer valablement la responsabilité pénale et protéger l'organisation.</p>
            </div>
          </div>

          <div class="notice compact-notice" style="margin-bottom:16px;background:rgba(117,224,194,0.06);border-left:3px solid var(--mint)">
            ${icon("shield", 16)}
            <span><strong>Principe :</strong> ${esc(guide.delegationPouvoir.principe)}</span>
          </div>

          <div class="grid-3col" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px;margin-bottom:16px">
            ${guide.delegationPouvoir.conditionsValidite.map(c => `
              <article class="content-card glass-panel" style="border-top:3px solid var(--accent-mint)">
                <h4 style="font-size:15px;color:var(--mint);margin:0 0 6px">${esc(c.critere)}</h4>
                <p style="font-size:12.5px;color:var(--text-soft);line-height:1.55;margin:0">${esc(c.exigence)}</p>
              </article>
            `).join("")}
          </div>

          <article class="content-card glass-panel">
            <h4 style="font-size:14px;color:var(--gold);margin:0 0 8px">${icon("alert", 14)} Limites strictes : Ce qui ne peut JAMAIS être délégué</h4>
            <ul class="bullet-list" style="font-size:13px;line-height:1.6;color:var(--text-soft)">
              ${guide.delegationPouvoir.limites.map(l => `<li>${esc(l)}</li>`).join("")}
            </ul>
          </article>
        </div>

        <!-- 4. GUIDE RÉFLEXE ENQUÊTE JUDICIAIRE -->
        <div class="section-block" data-page-theme="Réflexes" style="margin-top:28px">
          <div class="section-title-row">
            <div>
              <span class="eyebrow" style="color:var(--accent-coral)">CONDUITE DE CRISE</span>
              <h2>Guide Réflexe : Perquisition, Garde à vue et Enquête judiciaire</h2>
              <p>Les 5 réflexes immédiats pour faire valoir ses droits fondamentaux dès la première minute.</p>
            </div>
          </div>

          <div class="process-steps-list">
            ${guide.guideReflexeGardeAVue.map((ref, idx) => `
              <article class="process-step-item glass-panel" style="padding:14px 18px">
                <div class="step-marker" style="background:var(--accent-coral);color:#fff;font-weight:750">0${idx+1}</div>
                <div class="step-content">
                  <p style="font-size:13.5px;color:var(--text);margin:0;line-height:1.6">${esc(ref)}</p>
                </div>
              </article>
            `).join("")}
          </div>
        </div>
      ` : paywallGate(
        "Délégation de Pouvoir & Guide Réflexe Judiciaire (Premium)",
        "Accédez au guide complet de rédaction des délégations de pouvoir (modèle C.A.M. conforme à la jurisprudence de la Cour de cassation) et aux protocoles d'assistance en cas de garde à vue ou perquisition.",
        `<div class="premium-preview-grid"><div><strong>Délégation C.A.M.</strong><span>Compétence, Autorité, Moyens réels</span></div><div><strong>Garde à vue</strong><span>5 réflexes immédiats avec avocat</span></div><div><strong>Perquisition</strong><span>Vérification de commission rogatoire</span></div></div>`
      )}

      ${sourceLinks(["codePenal", "loiFauchon", "codeSantePublique", "codeTravailConges"])}
    </section>
  `;
}


/* --- 7. PAGE DÉDIÉE : GLOSSAIRE EXHAUSTIF DES SIGLES DE LA SANTÉ --- */
function renderGlossary() {
  const terms = GLOSSARY_TERMS || [];
  const categories = ["Tout", "Sanitaire", "Médico-social", "RH & Droit", "Qualité & Soins", "Instances & Tutelles"];
  const alphaLetters = [...new Set(terms.map(t => t.sigle.charAt(0).toUpperCase()))].sort();
  const letters = ["Tout", ...alphaLetters];

  return `
    <section class="page" aria-labelledby="glossary-title">
      ${sectionHead(
        "REPÈRES & VOCABULAIRE · " + terms.length + " SIGLES OFFICIELS",
        "Le Glossaire des sigles, <span class=\"text-gradient\">décoder le système en un clin d’œil.</span>",
        "De l'ARS au GIR, du CPOM au CITIS : tous les acronymes du sanitaire, du social, du médico-social, du droit hospitalier et de la gestion décodés pour les cadres et étudiants.",
        `<button class="button subtle" data-nav="documents">${icon("file",16)}Documents</button><button class="button subtle" data-nav="reunions">${icon("calendar",16)}Instances</button>`
      )}

      <div class="glossary-header-tools glass-panel">
        <div class="glossary-search-row">
          <label class="search-box" style="flex:1">
            <span data-icon="search"></span>
            <input class="form-control" id="glossary-query" type="search" placeholder="Rechercher un sigle (ex: ARS, CPOM, CITIS, GIR, DUI, ETP, HAS, MAS…) ou une définition…" value="${esc(state.glossaryQuery || "")}" aria-label="Rechercher un sigle">
          </label>
          <button class="button subtle" type="button" data-action="reset-glossary-filters" title="Réinitialiser les filtres">
            ${icon("reset", 14)} Réinitialiser
          </button>
        </div>

        <div class="glossary-filter-bar" role="tablist" aria-label="Filtrer par thématique">
          ${categories.map(cat => `
            <button type="button" class="glossary-cat-btn ${(state.glossaryCategory || "Tout") === cat ? "is-active" : ""}" data-glossary-cat="${esc(cat)}" role="tab" aria-selected="${String((state.glossaryCategory || "Tout") === cat)}">
              ${esc(cat)}
            </button>
          `).join("")}
        </div>

        <div class="glossary-letter-bar" role="tablist" aria-label="Filtrer par lettre initiale">
          ${letters.map(letter => {
            const isAll = letter === "Tout";
            const isActive = (state.glossaryLetter || "Tout") === letter;
            return `
              <button type="button" class="glossary-letter-btn ${isAll ? "is-all-btn" : ""} ${isActive ? "is-active" : ""}" data-glossary-letter="${esc(letter)}" role="tab" aria-selected="${String(isActive)}">
                ${isAll ? "Tous" : esc(letter)}
              </button>
            `;
          }).join("")}
        </div>
      </div>

      <div class="section-block" style="margin-top:20px">
        <div class="section-title-row" style="margin-bottom:14px">
          <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
            <span class="eyebrow" id="glossary-count-label">RÉSULTATS DE RECHERCHE</span>
          </div>
        </div>
        <div class="glossary-grid" id="glossary-results">
          ${renderGlossaryItems()}
        </div>
      </div>
    </section>
  `;
}

function renderGlossaryItems() {
  const allTerms = GLOSSARY_TERMS || [];
  const q = (state.glossaryQuery || "").trim().toLowerCase();
  const cat = state.glossaryCategory || "Tout";
  const letter = state.glossaryLetter || "Tout";

  const filtered = allTerms.filter(item => {
    const matchCat = cat === "Tout" || item.cat === cat;
    const matchLetter = letter === "Tout" || item.sigle.toUpperCase().startsWith(letter.toUpperCase());
    const matchQuery = !q || item.sigle.toLowerCase().includes(q) || item.full.toLowerCase().includes(q) || item.def.toLowerCase().includes(q);
    return matchCat && matchLetter && matchQuery;
  });

  if (!filtered.length) {
    return `
      <div class="empty-state glass-panel" style="grid-column:1/-1;padding:36px;text-align:center">
        ${icon("search", 28)}
        <h3 style="margin-top:12px">Aucun sigle correspondant trouvé</h3>
        <p style="color:var(--muted)">Essayez d'autres mots-clés ou réinitialisez les filtres par lettre et thématique.</p>
        <button class="button subtle" style="margin-top:14px" data-action="reset-glossary-filters">Réinitialiser les filtres</button>
      </div>
    `;
  }

  return filtered.map(t => `
    <article class="content-card glass-panel glossary-card" data-sigle="${esc(t.sigle)}">
      <div class="glossary-card-head">
        <span class="glossary-sigle">${esc(t.sigle)}</span>
        <span class="tag ${tagColor(t.cat)}">${esc(t.cat)}</span>
      </div>
      <h3 class="glossary-full-title">${esc(t.full)}</h3>
      <p class="glossary-def">${esc(t.def)}</p>
      <div class="glossary-card-footer">
        <button class="quiet-link" type="button" data-action="copy-glossary-def" data-copy-sigle="${esc(t.sigle)}" data-copy-full="${esc(t.full)}" data-copy-def="${esc(t.def)}" title="Copier la définition">
          ${icon("clipboard", 13)} Copier la définition
        </button>
      </div>
    </article>
  `).join("");
}

function updateGlossaryResults() {
  const container = $("#glossary-results");
  if (!container) return;
  container.innerHTML = renderGlossaryItems();
  const countLabel = $("#glossary-count-label");
  if (countLabel) {
    const q = (state.glossaryQuery || "").trim().toLowerCase();
    const cat = state.glossaryCategory || "Tout";
    const letter = state.glossaryLetter || "Tout";
    const count = (GLOSSARY_TERMS || []).filter(item => {
      const matchCat = cat === "Tout" || item.cat === cat;
      const matchLetter = letter === "Tout" || item.sigle.toUpperCase().startsWith(letter.toUpperCase());
      const matchQuery = !q || item.sigle.toLowerCase().includes(q) || item.full.toLowerCase().includes(q) || item.def.toLowerCase().includes(q);
      return matchCat && matchLetter && matchQuery;
    }).length;
    countLabel.textContent = `${count} SIGLE${count > 1 ? "S" : ""} DISPONIBLE${count > 1 ? "S" : ""}`;
  }
  hydrateIcons(container);
}

function renderHealthLaw() {
  const sections = [
    { id:"droits-usager", title:"Droits fondamentaux de l’usager", icon:"people", items:[
      ["Respect de la dignité","Consentement éclairé, respect de l’intimité, absence de maltraitance et prise en compte des souhaits."],
      ["Projet personnalisé","Participation à l’élaboration, suivi des objectifs et révision selon les besoins et les choix."],
      ["Dossier & confidentialité","Accès au dossier, secret professionnel, traçabilité, consentement et durée de conservation proportionnée."],
      ["Expérience et recours","Réclamation, médiation, conseil de la vie sociale, défenseur des droits et procédures juridictionnelles."]
    ]},
    { id:"consentement", title:"Consentement, soins et contraintes", icon:"shield", items:[
      ["Principe","Toute personne reçoit une information loyale, claire et adaptée avant une décision médicale ou un soin."],
      ["Personnes protégées","Le consentement du représentant légal ne dispense pas de recueillir la volonté de la personne."],
      ["Urgence","Les soins nécessaires peuvent être réalisés dans l’urgence, sans substituer à une décision légale."],
      ["Contention / isolement","Décision motivée, prescription médicale, surveillance renforcée, traçabilité et réévaluation régulière."]
    ]},
    { id:"maltraitance", title:"Maltraitance, signalement et sanctions", icon:"alert", items:[
      ["Maltraitance avérée","Informer les autorités compétentes, protéger la personne, préserver les preuves et conduire une analyse indépendante."],
      ["Signe ou suspicion","Évaluation immédiate selon les procédures internes, signalement proportionné et vigilance sur les représailles."],
      ["Sanctions pénales","Abandonner les soins, violences, omission de porter secours ou atteinte aux droits peuvent relever du Code pénal."],
      ["Sanctions professionnelles","Sanctions disciplinaires, suspension temporaire, retrait d’autorisation ou contrôle judiciaire selon les faits."]
    ]},
    { id:"evenements", title:"Événements indésirables et déclarations", icon:"pulse", items:[
      ["ARS / e-SIN","Désignations locales, délais propres à la gravité et obligations selon le type d’établissement."],
      ["Malveillance / incendie / décès","Signalement rapide aux autorités compétentes, sécurisation du lieu et accompagnement des proches."],
      ["Parquet / procureur","Obligation de certaines personnes dès connaissance d’un crime ou délit, notamment via l’article 40 du Code de procédure pénale."],
      ["Assureur","Déclaration contractuelle, conservation des pièces, gestion des demandes et accompagnement du sinistre."]
    ]},
    { id:"responsabilites", title:"Responsabilités du directeur et des équipes", icon:"briefcase", items:[
      ["Responsabilité civile","Réparer un dommage causé par une faute, une organisation défaillante ou un manquement de prévention."],
      ["Responsabilité pénale","Individualiser les actes ou omissions fautifs ; déléguer ne dispense pas de contrôler les moyens."],
      ["Responsabilité disciplinaire","Respect des obligations du statut, de la convention, du contrat et des règles hiérarchiques."],
      ["Droits du travail","Information, prévention, surveillance de la santé, délégations écrites et maîtrise des horaires."]
    ]},
    { id:"autorites", title:"Autorités, contrôles et recours", icon:"network", items:[
      ["ARS","Autorisation, contrôle, tarification, CPOM, déclaration des événements graves et mises en demeure."],
      ["Conseil départemental / CNSA","Droits sociaux, aides, tarification médico-sociale, financement, inspections et procédures territoriales."],
      ["HAS","Évaluation de la qualité, référentiels, patients traceurs, rapports et recommandations."],
      ["Justice","Tribunal judiciaire, administratif, pénal, prud’hommes et commissions selon la nature du litige."]
    ]}
  ];
  return `<section class="page" aria-labelledby="health-law-title">
    ${sectionHead("DROIT DE LA SANTÉ & RESPONSABILITÉ", "Les droits, obligations <span class=\"text-gradient\">et sanctions à connaître</span>", "Repères pratiques pour les directeurs, cadres, professionnels qualité et futurs managers. Les sanctions dépendent toujours des faits, du statut, des textes applicables et de la procédure.", ``)}
    <div class="law-alert">${icon("info",18)}<span><strong>Cadre pédagogique.</strong> Cette page aide au repérage. Elle ne remplace pas la consultation du texte officiel, du conseil juridique ou d’un défenseur des droits.</span></div>
    ${[["Droits & consentement", sections.slice(0, 2)], ["Signalements", sections.slice(2, 4)], ["Responsabilités & autorités", sections.slice(4)]].map(([label, items]) => `<div data-page-theme="${esc(label)}"><div class="law-grid">${items.map(section => `<article class="law-card glass-panel">
      <div class="law-card-head"><span class="icon-bubble">${icon(section.icon,18)}</span><h2>${esc(section.title)}</h2></div>
      <div class="law-list">${section.items.map(([title,body]) => `<div><strong>${esc(title)}</strong><p>${esc(body)}</p></div>`).join("")}</div>
    </article>`).join("")}</div></div>`).join("")}
    ${sourceLinks(["loi2002","cdu","cnil","signalement","vigilances","loi2005"])}
  </section>`;
}
function softwareCards(list=SOFTWARES) {
  if(!list.length) return `<div class="empty-state"><strong>Aucun logiciel correspondant</strong>Essayez un autre terme ou un acronyme.</div>`;
  return list.map(item=>`<article class="software-card glass-panel"><div class="software-top"><span class="icon-bubble">${icon(item.group.includes("Ressources")?"users":item.group.includes("Pilotage")?"chart":item.group.includes("Dossier")?"file":item.group.includes("Échanges")?"shield":"layers",17)}</span><span class="tag ${tagColor(item.group)}">${esc(item.group)}</span></div><h3>${esc(item.name)}</h3><p>${esc(item.what)}</p><div class="software-example"><strong>Repère</strong><span>${esc(item.examples)}</span></div>${sourceLinks(item.sources || [item.source])}</article>`).join("");
}
function renderSoftware() {
  return `<section class="page" aria-labelledby="software-title">${sectionHead("BOÎTE À OUTILS · NUMÉRIQUE", "Les logiciels qui font tourner <span class=\"text-gradient\">les établissements.</span>", "Une carte des grandes familles d’outils sanitaires et médico-sociaux : à quoi ils servent, qui les utilise et ce qu’un manager doit vérifier avant un choix ou un déploiement.", `<button class="button subtle" data-action="open-sources">${icon("book",16)}Références</button>`)}
    <div class="notice">${icon("shield",17)}<span><strong>À garder en tête.</strong> Les noms de produits ci-dessous sont des exemples, pas un classement ni une recommandation. Les gammes évoluent ; vérifiez le référencement Ségur demandé, la sécurité, l’interopérabilité, les coûts complets et les conditions de sortie du contrat.</span></div>
    <div data-page-theme="Familles de logiciels">
    <div class="software-toolbar section-block"><label class="search-box"><span data-icon="search"></span><input id="software-query" class="form-control" type="search" placeholder="DPI, DUI, planning, paie, qualité…" aria-label="Rechercher un logiciel ou une famille"></label><span class="tag mint" id="software-count">${SOFTWARES.length} familles</span></div>
    <div class="software-grid section-block" id="software-results">${softwareCards()}</div>
    </div>
    <section class="section-block software-selection" data-page-theme="Avant de choisir"><div class="section-title-row"><div><span class="eyebrow">AVANT DE SIGNER</span><h2>La checklist d’un choix numérique</h2></div></div><div class="focus-row"><article class="focus-card glass-panel"><span class="eyebrow">USAGES</span><h3>Tester avec le terrain</h3><p>Associer soignants, équipes d’accompagnement, fonctions support, personnes accompagnées et représentants selon le projet.</p></article><article class="focus-card glass-panel"><span class="eyebrow">DONNÉES</span><h3>Protéger les accès</h3><p>Vérifier hébergement, habilitations par rôle, journalisation, sauvegardes, continuité et procédure de violation.</p></article><article class="focus-card glass-panel"><span class="eyebrow">DÉPLOIEMENT</span><h3>Prévoir l’après</h3><p>Chiffrer reprise et qualité des données, interfaces, formation, support, dépendances, réversibilité et temps métier nécessaire.</p></article></div>${sourceLinks(["ansSoftware","ansDui","mssante","viaTrajectoire"])}</section>
  </section>`;
}

const mapDescriptions = {
  personne:{ title:"Personne accompagnée / patient", type:"Au centre du projet", copy:"Ses droits, choix, préférences, expérience et consentement orientent les décisions de service.", related:["Projet personnalisé","CVS / CDU","Équipes"] },
  direction:{ title:"Direction", type:"Arbitre et organise", copy:"Relie les besoins des personnes, l’organisation des équipes, les exigences, les ressources et les partenaires. Son champ d’action dépend des délégations.", related:["Équipes & cadres","Projet d’établissement","EPRD / ERRD","ARS","COPIL"] },
  equipes:{ title:"Équipes & cadres", type:"Métiers et encadrement", copy:"Conçoivent et mettent en œuvre les accompagnements, font remonter les risques et contribuent aux documents et évaluations.", related:["Direction","CVS / CSE","DUERP","Projet d’établissement"] },
  cvscse:{ title:"CVS · CSE / CST", type:"Deux formes de participation distinctes", copy:"Le CVS recueille l’expression des personnes accompagnées en ESSMS ; les instances sociales représentent les personnels selon le statut.", related:["Personne accompagnée","Projet d’établissement","DUERP","Équipes"] },
  projet:{ title:"Projet d’établissement", type:"Cap collectif", copy:"La direction le pilote avec les personnes, les professionnels et les partenaires. Il relie missions, organisation, coopération et qualité.", related:["Direction","CVS / CSE","HAS","Département"] },
  duerp:{ title:"DUERP", type:"Prévention des risques professionnels", copy:"L’employeur porte l’évaluation ; les encadrants et professionnels décrivent le travail réel et suivent les actions de prévention.", related:["Direction","Équipes & cadres","CSE / F3SCT"] },
  eprd:{ title:"EPRD · ERRD", type:"Prévision et réalisé budgétaires", copy:"Le service financier et la direction fiabilisent les hypothèses. Le régime et le calendrier de dépôt dépendent de la structure.", related:["Direction","ARS","Département","CNSA"] },
  has:{ title:"HAS", type:"Référentiels et qualité", copy:"La HAS propose les cadres d’évaluation des ESSMS et de certification des établissements de santé. Les dispositifs sont distincts.", related:["Projet d’établissement","Évaluation ESSMS","Équipes"] },
  ars:{ title:"ARS", type:"Autorité régionale", copy:"Régule l’offre sanitaire et médico-sociale, autorise, finance ou contrôle selon les compétences en jeu.", related:["Direction","EPRD","CNSA","Établissements"] },
  departement:{ title:"Département", type:"Autorité territoriale", copy:"Compétences sociales, autonomie, aide sociale, protection de l’enfance et tarification de certains ESSMS.", related:["Direction","Personne accompagnée","EPRD","MDPH"] },
  mdph:{ title:"MDPH / CDAPH", type:"Droits et orientation", copy:"La personne formule sa demande ; l’évaluation et les décisions de compensation/orientation interviennent dans son parcours.", related:["Personne accompagnée","Direction","Département"] },
  cnsa:{ title:"CNSA", type:"Branche Autonomie et financements", copy:"La CNSA finance et pilote des crédits de la branche Autonomie en lien avec les autorités territoriales ; les crédits ponctuels ne sont pas récurrents par défaut.", related:["ARS","Département","EPRD / ERRD"] },
  anap:{ title:"ANAP", type:"Appui et expertise", copy:"Ressources, outils et accompagnements pour la performance des établissements. L’ANAP n’est pas un régulateur ni un organe de contrôle.", related:["Direction","COPIL","Projet d’établissement"] },
  copil:{ title:"COPIL", type:"Gouvernance de projet", copy:"Suit objectifs, risques, budget et arbitrages d’un projet. Le sponsor et les décideurs habilités valident les choix qui engagent l’établissement.", related:["Direction","Projet d’établissement","EPRD / ERRD","Équipes"] }
};
function mapMarkup() {
  const nodeIcon = type => type === "Participation" ? "people" : type === "Gouvernance" ? "layers" : type === "Métiers" ? "users" : type === "Documents" ? "file" : type === "Instances" ? "calendar" : "network";
  const nodes = MAP_NODES.map(node => `<button class="map-node type-${esc(node.type.replace(/\s/g,""))}" data-map-node="${esc(node.id)}" type="button" aria-pressed="${node.id === state.selectedMapNode}" aria-label="${esc(node.label.replace(/\n/g," "))} · ${esc(node.type)}. Glisser pour déplacer."><span class="node-glint" aria-hidden="true"></span><span class="node-icon" aria-hidden="true">${icon(nodeIcon(node.type),19)}</span><span class="node-label">${node.label.split("\n").map(line => `<span>${esc(line)}</span>`).join("")}</span></button>`).join("");
  return `<div class="map-world" id="map-world" role="group" aria-label="Espace 3D interactif : faites glisser le fond pour orbiter et les bulles pour les déplacer"><canvas class="map-canvas" id="map-canvas" aria-hidden="true"></canvas><div class="map-nodes" id="map-nodes">${nodes}</div></div>`;
}
function renderMap() {
  if (!isPremiumUnlocked()) {
    return `<section class="page" aria-labelledby="map-title">
      ${sectionHead("VUE SYSTÉMIQUE · CARTE 3D", "Les interactions de votre établissement, <span class='text-gradient'>en accès Premium</span>", "Explorez les liens entre personnes accompagnées, directions, équipes, instances, documents et partenaires dans une carte 3D interactive.", ``)}
      ${paywallGate("Carte des interactions Premium", "Accédez à la vue 3D interactive, aux filtres, aux liens directionnels, aux déplacements et à la profondeur de lecture du système.", `<div class="premium-preview-grid"><div><strong>Vue 3D</strong><span>Orbite, zoom et profondeur</span></div><div><strong>Liens</strong><span>Relations directionnelles</span></div><div><strong>Filtres</strong><span>Par métiers, instances et acteurs</span></div></div>`)}
    </section>`;
  }
  const groups = ["Tout", ...new Set(MAP_NODES.map(node => node.type))];
  const detailsOpen = state.mapDetailsOpen === true;
  return `<section class="page map-page" aria-labelledby="map-title">
    ${sectionHead("VUE SYSTÉMIQUE · CARTE 3D", "Qui demande quoi ? <span class='text-gradient'>Qui agit avec qui ?</span>", "Pincez pour zoomer, glissez à deux doigts pour vous déplacer, un doigt pour orbiter ou déplacer une bulle.", `<button class="button subtle" data-action="map-reset">${icon("reset",15)}Réinitialiser la vue</button>`)}
    <div class="map-layout">
      <div class="map-frame glass-panel" id="map-frame">
        <div class="map-toolbar">${renderPills("map", groups, state.mapFilter)}<div class="map-toolbar-actions"><button class="button subtle map-gesture-toggle" data-action="map-gesture" aria-pressed="${state.mapGesture === "rotate"}" title="Geste à un doigt sur le fond de la carte">${icon(state.mapGesture === "rotate" ? "rotate" : "move",15)}${state.mapGesture === "rotate" ? "Orbite" : "Déplacer"}</button><button class="button subtle" data-action="map-settings" aria-expanded="false" aria-controls="map-controls">${icon("layers",15)}Réglages</button></div></div>
        <div class="map-controls" id="map-controls" role="group" aria-label="Réglages de la scène en trois dimensions" hidden>
          <label class="map-control"><span>Zoom <output id="map-zoom-output">${Math.round(state.mapZoom * 100)} %</output></span><input id="map-zoom" type="range" min="40" max="300" value="${Math.round(state.mapZoom * 100)}" aria-label="Zoom de la scène 3D"></label>
          <label class="map-control"><span>Inclinaison · X <output id="map-angle-x-output">${Math.round(state.mapRotation.x)}°</output></span><input id="map-rotate-x" type="range" min="0" max="360" value="${Math.round(state.mapRotation.x)}" aria-label="Incliner la scène sur l’axe X, rotation complète de 360 degrés"></label>
          <label class="map-control"><span>Orientation · Y <output id="map-angle-y-output">${Math.round(state.mapRotation.y)}°</output></span><input id="map-rotate-y" type="range" min="0" max="360" value="${Math.round(state.mapRotation.y)}" aria-label="Orienter la scène sur l’axe Y, rotation complète de 360 degrés"></label>
          <label class="map-control"><span>Profondeur · Z <output id="map-angle-z-output">${Math.round(state.mapRotation.z)}°</output></span><input id="map-rotate-z" type="range" min="0" max="360" value="${Math.round(state.mapRotation.z)}" aria-label="Tourner la scène autour de l’axe de profondeur Z, rotation complète de 360 degrés"></label>
          <label class="map-control"><span>Perspective <output id="map-depth-output">${state.mapPerspective} px</output></span><input id="map-depth" type="range" min="450" max="1800" step="50" value="${state.mapPerspective}" aria-label="Régler la profondeur de la perspective"></label>
          <label class="map-control"><span>Avancer / reculer · Z <output id="map-scene-depth-output">${state.mapSceneDepth}</output></span><input id="map-scene-depth" type="range" min="-220" max="220" value="${state.mapSceneDepth}" aria-label="Déplacer toute la carte vers l’avant ou l’arrière sur l’axe Z"></label>
          <button type="button" class="button subtle map-reset-inline" data-action="map-reset">${icon("reset",15)}Réinitialiser la vue</button>
        </div>
        <div class="map-viewport${state.mapGesture === "pan" ? " is-panning" : ""}" id="map-viewport" role="region" aria-label="Carte en trois dimensions">
          ${mapMarkup()}
          <div class="map-hint" id="map-hint" aria-hidden="true">${icon("move",14)}<span>Pincez pour zoomer · 2 doigts pour déplacer</span></div>
          <div class="map-fab" role="group" aria-label="Zoom et affichage">
            <button type="button" class="map-fab-btn" data-action="map-zoom-in" aria-label="Zoom avant">+</button>
            <button type="button" class="map-fab-btn" data-action="map-zoom-out" aria-label="Zoom arrière">−</button>
            <button type="button" class="map-fab-btn" data-action="map-fit" aria-label="Recentrer la carte">${icon("target",16)}</button>
            <button type="button" class="map-fab-btn" data-action="map-expand" aria-pressed="false" aria-label="Agrandir la carte">${icon("zoomin",16)}</button>
          </div>
          <aside class="map-details glass-panel${detailsOpen ? "" : " is-collapsed"}" id="map-details" aria-live="polite" aria-atomic="true"></aside>
        </div>
        <div class="map-legend"><span><i></i>Personnes & métiers</span><span><i></i>Gouvernance</span><span><i></i>Instances</span><span><i></i>Documents</span><span><i></i>Acteurs externes</span></div>
      </div>
    </div>
  </section>`;
}
const PEER_REGIONS = ["Île-de-France","Auvergne-Rhône-Alpes","Bourgogne-Franche-Comté","Bretagne","Centre-Val de Loire","Corse","Grand Est","Hauts-de-France","Normandie","Nouvelle-Aquitaine","Occitanie","Pays de la Loire","Provence-Alpes-Côte d’Azur","Outre-mer"];
const PEER_PLACES = ["Sanitaire", "Médico-social · handicap", "Médico-social · grand âge", "Social · protection de l’enfance", "Social · précarité", "Domicile / parcours", "Autre"];
const PEER_ROLES = ["Adjoint·e de direction","Directeur·rice","Chef·fe de service / cadre","Responsable qualité / risques","Responsable RH / organisation","Responsable finances / contrôle de gestion","Chef·fe de projet / chargé·e de mission","Cadre de santé","Étudiant·e / alternant·e","Autre"];
function communityTabs(active) {
  const tabs = [["reseau", "Réseau", "users"], ["inscription-annuaire", "Inscription au réseau", "userplus"]];
  return `<nav class="community-tabs" aria-label="Espace annuaire alumni">${tabs.map(([id, label, name]) => `<button type="button" class="community-tab${id === active ? " is-active" : ""}" data-nav="${id}"${id === active ? ' aria-current="page"' : ""}>${icon(name, 15)}<span>${label}</span></button>`).join("")}<button type="button" class="community-tab community-tab-link" data-nav="timeline">${icon("message", 15)}<span>Fil d’actualités</span></button></nav>`;
}
function renderNetwork() {
  if (!isPremiumUnlocked()) {
    return `<section class="page" aria-labelledby="network-title">
      ${sectionHead("COMMUNAUTÉ ALUMNI · RÉSEAU", "L’annuaire de promotion, <span class=\"text-gradient\">réservé aux membres</span>", "Retrouvez des expériences, ajoutez votre fiche, filtrez les profils et accédez au fil d’actualité après activation du Premium.", ``)}
      ${communityTabs("reseau")}
      ${paywallGate("Annuaire Alumni Premium", "Accès réservé aux abonnés Premium : fiches, filtres, coordonnées autorisées, export et connexion au fil d’actualité.", `<div class="empty-state"><strong>Annuaire masqué</strong>Aucune fiche réseau n’est chargée en mode Freemium.</div>`)}
    </section>`;
  }
  const regionOptions = PEER_REGIONS;
  return `<section class="page" aria-labelledby="network-title">${sectionHead("COMMUNAUTÉ · RÉSEAU DE PROMOTION", "Le réseau alumni, <span class=\"text-gradient\">à portée de main.</span>", "Retrouvez une expérience, un secteur ou un interlocuteur de votre promotion. Pour apparaître dans le réseau, utilisez l’onglet « Inscription au réseau ».", `<button class="button subtle" data-action="export-peers">${icon("download",15)}Exporter mes fiches</button>`)}
    ${communityTabs("reseau")}
    <section class="network-results glass-panel"><div class="section-title-row"><div><span class="eyebrow">ANNUAIRE VOLONTAIRE · PROMOTIONS SANTÉ</span><h2 style="margin-top:10px">Trouver un pair ou une expérience</h2><p id="peer-count">Chargement des fiches…</p></div><div class="section-title-actions"><button class="button primary" data-nav="inscription-annuaire">${icon("userplus",14)}Ajouter ma fiche</button><button class="button subtle" data-action="clear-peers">${icon("trash",14)}Tout supprimer</button></div></div>
      <div class="network-tools">
        <div class="network-search-wrap">
          <span class="search-lens">${icon("search", 16)}</span>
          <input class="form-control apple-search-input" id="peer-query" type="search" placeholder="Rechercher par nom, rôle, compétence, mot-clé…" aria-label="Rechercher une personne" value="${esc(state.queries.peers || "")}">
          <button type="button" class="search-clear-btn" id="peer-search-clear" data-action="reset-peer-filters" aria-label="Effacer la recherche" ${state.queries.peers ? "" : "hidden"}>✕</button>
        </div>
        <div style="flex:1;min-width:200px">${renderCustomSelect({ id: "peer-experience-filter", name: "experienceFilter", options: [{ value: "Tout", label: "Toutes les compétences" }, ...RESEARCH_AREAS.map(item => ({ value: item, label: item }))], value: "Tout", placeholder: "Toutes les compétences", search: true })}</div>
        <div style="flex:1;min-width:180px">${renderCustomSelect({ id: "peer-region-filter", name: "regionFilter", options: [{ value: "Tout", label: "Toutes les régions" }, ...regionOptions.map(item => ({ value: item, label: item }))], value: "Tout", placeholder: "Toutes les régions", search: true })}</div>
      </div>
      <div class="peer-list" id="peer-list"></div><p class="field-hint" style="margin-top:12px">Les fiches sont synchronisées avec la promotion quand la connexion le permet, et conservées sur cet appareil.</p>
    </section>
  </section>`;
}

function renderPeerRegistration() {
  const regionOptions = PEER_REGIONS;
  const placeOptions = PEER_PLACES;
  const roles = PEER_ROLES;
  return `<section class="page${state.onboarding ? " onboarding-step" : ""}">${state.onboarding
    ? sectionHead("BIENVENUE · ÉTAPE FACULTATIVE", "Rejoindre le <span class=\"text-gradient\">réseau</span>", "Créez votre fiche maintenant ou passez cette étape : vous pourrez vous inscrire plus tard depuis « Inscription au réseau ». La consultation du réseau nécessite un accès Premium.")
    : sectionHead("COMMUNAUTÉ · PARTAGE D’EXPÉRIENCE", "Rejoindre le réseau, <span class=\"text-gradient\">en une minute.</span>", "Créez ou mettez à jour votre fiche volontaire pour partager votre expérience et vos coordonnées.", `<button class="button subtle" data-nav="reseau">${icon("users",15)}Voir le réseau</button>`)}
    ${state.onboarding ? "" : communityTabs("inscription-annuaire")}
    <div class="network-layout is-single"><section class="network-form-card glass-panel"><span class="eyebrow" id="peer-form-eyebrow">${state.editingPeerId ? "MODIFICATION" : "AJOUTER UNE FICHE"}</span><h2 id="peer-form-title" style="margin-top:12px;font-size:22px">${state.editingPeerId ? "Modifier ma fiche alumni" : "Partager son expérience"}</h2><p class="muted" style="font-size:10px;line-height:1.6;margin-bottom:0">Les champs marqués d’un astérisque sont requis. Mettez à jour vos coordonnées, lieu d'exercice et expériences.</p>
      <form class="network-form" id="peer-form" novalidate>
        <input type="hidden" id="peer-edit-id" name="editId" value="${state.editingPeerId || ''}">
        <div class="form-grid"><div><label class="field-label" for="peer-name">Nom affiché *</label><input class="form-control" id="peer-name" name="name" maxlength="70" required placeholder="Prénom Nom"></div><div><label class="field-label" for="peer-email">Courriel de contact *</label><input class="form-control" id="peer-email" name="email" type="email" maxlength="120" required placeholder="prenom@exemple.fr"></div></div>
        <div class="form-grid">
          <div>
            <label class="field-label" id="peer-region-label">Région *</label>
            ${renderCustomSelect({ id: "peer-region", name: "region", options: regionOptions.map(item => ({ value: item, label: item })), placeholder: "Choisir une région", search: true, required: true })}
          </div>
          <div>
            <label class="field-label" id="peer-place-label">Lieu d’exercice / secteur *</label>
            ${renderCustomSelect({ id: "peer-place", name: "sector", options: placeOptions.map(item => ({ value: item, label: item })), placeholder: "Choisir un secteur", search: true, required: true })}
          </div>
        </div>
        <div class="form-grid">
          <div>
            <label class="field-label" id="peer-role-label">Rôle actuel *</label>
            ${renderCustomSelect({ id: "peer-role", name: "role", options: roles.map(item => ({ value: item, label: item })), placeholder: "Choisir un rôle", search: true, required: true })}
          </div>
          <div><label class="field-label" for="peer-linkedin">Profil LinkedIn (optionnel, conservé sur cet appareil)</label><input class="form-control" id="peer-linkedin" name="linkedin" placeholder="https://www.linkedin.com/in/prenom-nom" maxlength="180"></div>
        </div>
        <div style="margin-bottom:14px">
          <div>
            <label class="field-label" id="peer-exp-label">Domaines d’expérience * (sélection multiple)</label>
            <div class="multiselect-wrap" id="peer-exp-multiselect">
              <div class="multiselect-trigger" tabindex="0" id="peer-exp-trigger" role="combobox" aria-labelledby="peer-exp-label" aria-expanded="false">
                <div class="multiselect-tags" id="peer-exp-tags">
                  <span class="multiselect-placeholder">Choisir 1 ou plusieurs domaines…</span>
                </div>
                <span class="multiselect-arrow">${icon("chevron-down", 14)}</span>
              </div>
              <div class="multiselect-dropdown glass-panel" id="peer-exp-dropdown" hidden>
                <div class="multiselect-search">
                  <input type="text" class="form-control" id="peer-exp-search" placeholder="Filtrer une compétence…">
                </div>
                <div class="multiselect-options" id="peer-exp-options" role="listbox" aria-multiselectable="true">
                  ${RESEARCH_AREAS.map(item => `
                    <div class="multiselect-option" data-value="${esc(item)}" role="option" tabindex="0">
                      <span class="multiselect-checkbox" aria-hidden="true"></span>
                      <span>${esc(item)}</span>
                    </div>
                  `).join("")}
                </div>
                <div class="multiselect-footer">
                  <span id="peer-exp-count">0 domaine sélectionné</span>
                  <button type="button" class="button tiny primary" id="peer-exp-validate-btn">Valider</button>
                </div>
              </div>
              <input type="hidden" name="experience" id="peer-experience-input" required>
            </div>
          </div>
        </div>
        <div><label class="field-label" for="peer-summary">Résumé de l’expérience *</label><textarea class="form-control" id="peer-summary" name="summary" maxlength="420" required placeholder="Ex. pilotage de l’évaluation HAS, organisation du service, résultats ou apprentissages…"></textarea><p class="field-hint">420 caractères maximum · pas de données personnelles ou de santé.</p></div>
        <label class="consent-row"><input type="checkbox" name="consent" required><span>J’autorise la publication de ma fiche et de mes coordonnées dans le réseau. Les fiches synchronisées sont accessibles publiquement. *</span></label>
        <div class="privacy-box"><strong>Vos données.</strong> Les fiches synchronisées, y compris votre courriel de contact, sont accessibles publiquement. Ne saisissez pas de données de santé ni de données personnelles de tiers.</div>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
      <button class="button primary" id="peer-submit-btn" type="submit">${icon(state.editingPeerId ? "check" : "userplus",15)} ${state.editingPeerId ? "Mettre à jour ma fiche alumni" : "Enregistrer la fiche"}</button>
      ${state.onboarding ? `<button class="button subtle" type="button" data-action="skip-onboarding">Passer cette étape</button>` : ""}
      <button class="button subtle" id="peer-cancel-edit-btn" type="button" data-action="cancel-edit-peer" ${state.editingPeerId ? '' : 'hidden'}>${icon("close",14)} Annuler la modification</button>
      <p class="field-error" id="peer-form-error" role="alert" hidden></p>
    </div>
      </form>
    </section></div>
  </section>`;
}

function renderTimeline() {
  if (!isPremiumUnlocked()) {
    return `<section class="page" aria-labelledby="timeline-title">
      ${sectionHead("ESPACE PRO & CAS PRATIQUES", "Forum d'entraide & Réseau de direction", "Espace d'échange professionnel réservé aux promotions et établissements partenaires : offres de poste, retours d'expérience et projets inter-établissements.", ``)}
      ${paywallGate("Espace Partenaires & Forum d'Échange", "Accès réservé aux cohortes et établissements partenaires : offres d'emploi/stage, événements professionnels, partages de protocoles et retours d'expérience. ⚖️ Aucun nom de patient ou résident.", `<div class="empty-state"><strong>Espace réservé aux promotions & partenaires</strong>Connectez-vous avec un compte partenaire ou activez un code école/établissement pour accéder aux échanges.</div>`)}
    </section>`;
  }
  return `<section class="page" aria-labelledby="timeline-title">${sectionHead("ESPACE PRO & CAS PRATIQUES", "Forum d'entraide & Réseau de direction", "Offres d'alternance/postes, partages d'expériences managériales et événements inter-établissements. ⚖️ Rappel : aucun nom de patient ou résident.", `<button class="button subtle" data-nav="reseau">${icon("userplus", 15)} Annuaire</button>`)}

    <div class="section-block">
      <div style="display:flex;justify-content:flex-end;margin-bottom:16px">
        <button class="button primary" data-action="toggle-post-form">${icon("message", 15)} Publier une annonce</button>
      </div>

      <!-- Formulaire de publication -->
      <div class="glass-panel" id="timeline-post-form-wrap" style="padding:22px;margin-bottom:24px;display:none;border:1px solid rgba(135,199,247,0.35);border-radius:var(--radius-lg)">
        <h3 style="font-size:17px;margin:0 0 14px;color:var(--text)">Créer une publication professionnelle (Offre, Événement ou Annonce)</h3>
        <form id="timeline-post-form">
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin-bottom:14px">
            <div>
              <label class="field-label" id="timeline-post-type-label" for="timeline-post-type-select">Type de publication *</label>
              <select name="type" class="form-control" id="timeline-post-type-select" style="font-size:13.5px;font-weight:600;cursor:pointer" required>
                <option value="job_offer" selected>💼 Offre d'emploi / Alternance / Stage</option>
                <option value="event">📅 Événement / Job Dating / Rencontre</option>
                <option value="announcement">📢 Annonce générale / Appel à projets</option>
              </select>
            </div>
            <div>
              <label class="field-label">Titre de l'annonce *</label>
              <input type="text" name="title" class="form-control" placeholder="Ex: Job Dating Cadres & Direction MAS" required maxlength="120">
            </div>
            <div>
              <label class="field-label">Établissement / Organisme *</label>
              <input type="text" name="organization" class="form-control" placeholder="Ex: MAS Les Tournesols (GHU)" required maxlength="100">
            </div>
            <div>
              <label class="field-label">Lieu / Ville *</label>
              <input type="text" name="location" class="form-control" placeholder="Ex: Paris 14e (75)" required maxlength="80">
            </div>
          </div>
          <div id="timeline-event-extra-fields" style="display:none;margin-bottom:14px">
            <label class="field-label">Date & horaires de l'événement (ex: Mardi 15 déc. 2026 à 14h00)</label>
            <input type="text" name="eventDate" class="form-control" placeholder="Ex: Mardi 15 décembre 2026 de 14h à 18h" maxlength="100">
          </div>
          <div style="margin-bottom:14px">
            <label class="field-label">Description détaillée *</label>
            <textarea name="content" class="form-control" rows="3" placeholder="Présentez les missions, profils recherchés, dates clés et modalités de participation..." required maxlength="600"></textarea>
          </div>
          <div style="display:flex;justify-content:flex-end;gap:10px">
            <button type="button" class="button subtle" data-action="toggle-post-form">Annuler</button>
            <button type="submit" class="button primary" id="timeline-post-submit-btn">${icon("send", 14)} Diffuser l'annonce</button>
          </div>
        </form>
      </div>

      <!-- Feed des posts -->
      <div id="timeline-feed" class="timeline-feed">
        ${renderTimelinePosts()}
      </div>
    </div>
  </section>`;
}


/* --- MODULE QUALITÉ, ÉVÉNEMENTS INDÉSIRABLES & AGÉVAL --- */
function adverseEventCards() {
  const ei = ADVERSE_EVENTS;
  return ei.levels.map(lvl => {
    return `<article class="content-card">
      <button class="card-hit" data-action="open-adverse-level" data-level="${lvl.level}">
        <div class="card-top">
          <div class="card-title-line">
            <span class="icon-bubble ${lvl.color === 'red' || lvl.color === 'coral' ? 'coral' : ''}">${icon(lvl.level === 1 ? 'check' : lvl.level === 2 ? 'info' : lvl.level === 3 ? 'pulse' : 'shield', 17)}</span>
            <div>
              <h3>${esc(lvl.name)}</h3>
              <p>${esc(lvl.definition.slice(0, 95))}...</p>
            </div>
          </div>
        </div>
        <div class="meta-row">
          <span class="tag ${lvl.color}">${esc(lvl.short)}</span>
          ${lvl.externalDeclaration ? '<span class="tag coral">Signalement externe obligatoire</span>' : '<span class="tag mint">Gestion interne</span>'}
        </div>
        <div class="card-copy" style="margin:8px 0">
          <strong style="font-size:11px;color:var(--text-2);text-transform:uppercase;letter-spacing:0.04em">Quand choisir ce niveau ?</strong>
          <p style="font-size:12px;margin-top:3px">${esc(lvl.whenToChoose)}</p>
        </div>
        <div class="card-foot">
          <span>Pilote : ${esc(lvl.leadRole)}</span>
          ${icon("arrow-up-right", 13)}
        </div>
      </button>
    </article>`;
  }).join("");
}

function qualityToolCards(list = QUALITY_TOOLS) {
  return list.map(item => `<article class="content-card">
    <button class="card-hit" data-action="open-quality-tool" data-id="${esc(item.id)}">
      <div class="card-top">
        <div class="card-title-line">
          <span class="icon-bubble">${icon("shield", 17)}</span>
          <div>
            <h3>${esc(item.name)}</h3>
            <p>${esc(item.category)}</p>
          </div>
        </div>
      </div>
      <div class="meta-row">
        <span class="tag mint">${esc(item.target)}</span>
        <span class="tag sky">${esc(item.editor)}</span>
      </div>
      <p class="card-copy">${esc(item.purpose)}</p>
      <div class="card-foot">
        <span>Méthode, atouts & points d'appui</span>
        ${icon("arrow-up-right", 13)}
      </div>
    </button>
  </article>`).join("");
}

function renderEiSimulator(selectedLevel = 4) {
  const levels = (ADVERSE_EVENTS && ADVERSE_EVENTS.levels) || [];
  const current = levels.find(l => l.level === Number(selectedLevel)) || levels[3] || levels[0];
  if (!current) return "";
  const isEigs = current.level === 4;
  const badgeColor = current.color === "red" ? "danger" : current.color;

  return `<div class="ei-simulator-card glass-panel" id="ei-simulator" data-sim-level="${current.level}">
    <div class="ei-simulator-head" style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:14px">
      <div style="display:flex;align-items:center;gap:12px">
        <span class="icon-bubble ${current.color}" style="width:42px;height:42px;border-radius:12px">${icon("shield", 20)}</span>
        <div>
          <span class="eyebrow" style="color:var(--${badgeColor})">SIMULATEUR DE TRIAGE & DÉCISION AGEVAL</span>
          <h3 style="margin:2px 0 0;font-size:17px;font-weight:750">Quelle conduite managériale selon la gravité ?</h3>
        </div>
      </div>
      <div>
        ${isEigs ? `<span class="ei-beacon-alarm" style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.3);color:var(--danger);font-size:11px;font-weight:700"><span class="live-pulse-dot" style="background:var(--danger)"></span> CELLULE DE CRISE & ARS REQUIS</span>` : `<span class="tag ${current.color}">${esc(current.short)}</span>`}
      </div>
    </div>
    <p style="font-size:13px;color:var(--text-soft);margin:0 0 16px;line-height:1.55">
      Sélectionnez le niveau pour prévisualiser instantanément la chaîne de responsabilités managériales, les délais d'alerte, les actions obligatoires et le circuit de déclaration externe (e-SIN / ARS / CD / Procureur).
    </p>
    <div class="ei-stepper-grid" role="radiogroup" aria-label="Niveau de gravité de l'événement indésirable">
      ${levels.map(l => {
        const active = l.level === current.level;
        return `<button type="button" class="ei-step-btn level-${l.level} ${active ? "is-active" : ""}" data-action="sim-select-level" data-level="${l.level}" role="radio" aria-checked="${active ? "true" : "false"}">
          <span class="ei-step-badge">${l.level}</span>
          <span class="ei-step-name">${esc(l.short.split(" : ")[1] || l.short)}</span>
        </button>`;
      }).join("")}
    </div>
    <div class="ei-diag-panel">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:14px;flex-wrap:wrap">
        <div>
          <h4 style="font-size:16px;font-weight:750;margin:0 0 4px;color:var(--text)">${esc(current.name)}</h4>
          <p style="font-size:13px;color:var(--text-soft);margin:0">${esc(current.definition)}</p>
        </div>
        <button type="button" class="button tiny subtle" data-action="open-adverse-level" data-level="${current.level}" style="flex-shrink:0">
          ${icon("book", 13)} <span>Fiche détaillée</span>
        </button>
      </div>
      <div style="background:rgba(255,255,255,0.03);border:1px solid var(--stroke);border-radius:12px;padding:12px 14px;margin-bottom:14px">
        <strong style="display:block;font-size:11.5px;text-transform:uppercase;letter-spacing:0.04em;color:var(--${badgeColor});margin-bottom:4px">
          ${icon("check", 13)} Quand choisir ce niveau ?
        </strong>
        <p style="font-size:13px;color:var(--text);margin:0;line-height:1.5">${esc(current.whenToChoose)}</p>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(260px, 1fr));gap:12px;margin-bottom:14px">
        <div style="background:var(--surface-soft);border:1px solid var(--stroke);border-radius:12px;padding:12px 14px">
          <strong style="display:block;font-size:11.5px;text-transform:uppercase;letter-spacing:0.04em;color:var(--text-soft);margin-bottom:6px">
            ${icon("briefcase", 13)} Qui pilote la gestion ?
          </strong>
          <p style="font-size:13px;color:var(--text);margin:0;font-weight:600">${esc(current.leadRole)}</p>
        </div>
        <div style="background:var(--surface-soft);border:1px solid var(--stroke);border-radius:12px;padding:12px 14px">
          <strong style="display:block;font-size:11.5px;text-transform:uppercase;letter-spacing:0.04em;color:var(--text-soft);margin-bottom:6px">
            ${icon("shield", 13)} Déclaration externe (ARS / CD / Parquet)
          </strong>
          <p style="font-size:13px;margin:0;font-weight:600;color:${current.externalDeclaration === true ? 'var(--danger)' : current.externalDeclaration === false ? 'var(--mint)' : 'var(--coral)'}">
            ${current.externalDeclaration === true ? '🚨 Obligatoire sans délai (Volet 1 e-SIN < 48h)' : current.externalDeclaration === false ? '✅ Interne uniquement (Saisie AgEval)' : esc(current.externalDeclaration)}
          </p>
        </div>
      </div>
      <div style="margin-bottom:14px">
        <strong style="display:block;font-size:12px;color:var(--text-soft);margin-bottom:8px">
          ${icon("layers", 13)} Exemples concrets en établissement :
        </strong>
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:8px">
          ${current.examples.map(ex => `<div style="padding:8px 12px;background:rgba(255,255,255,0.02);border:1px solid var(--stroke);border-radius:8px;font-size:12px;color:var(--text-soft);line-height:1.4">• ${esc(ex)}</div>`).join("")}
        </div>
      </div>
      <div>
        <strong style="display:block;font-size:12px;color:var(--text-soft);margin-bottom:8px">
          ${icon("arrow-up-right", 13)} Conduite à tenir immédiate & actions imposées :
        </strong>
        <ul class="ei-consequences-list" style="margin:0;padding-left:18px;font-size:12.5px;line-height:1.6;color:var(--text)">
          ${current.consequences.map(c => `<li>${esc(c)}</li>`).join("")}
        </ul>
      </div>
    </div>
  </div>`;
}

function renderQuality() {
  const ei = ADVERSE_EVENTS;
  return `<section class="page" aria-labelledby="quality-title">
    ${sectionHead("QUALITÉ & SÉCURITÉ · GESTION DES RISQUES", "AgEval, signalements et <span class=\"text-gradient\">gestion des événements indésirables.</span>", "Recueillir, hiérarchiser et traiter chaque événement indésirable (EI). Comprendre les 4 niveaux d'EI, ce que chaque niveau provoque comme circuit d'actions, et s'approprier les outils institutionnels comme AgEval de l'ANAP.", `<button class="button subtle" data-nav="rex">${icon("lightbulb",16)}Voir la démarche REX</button>`)}
    
    <div class="notice">${icon("info",18)}<span><strong>Culture juste & non punitive.</strong> ${esc(ei.culture)}</span></div>

    ${renderEiSimulator(state.eiSimLevel || 4)}

    <div class="section-block" data-page-theme="Niveaux d’EI">
      <div class="section-title-row">
        <div>
          <h2>Les 4 niveaux d'Événements Indésirables</h2>
          <p>Quand choisir quel niveau, qui alerte-t-on, et que provoque chaque décision en termes d'actions immédiates, d'analyses et de déclarations ?</p>
        </div>
      </div>
      <div class="result-grid">${adverseEventCards()}</div>
    </div>

    <div class="section-block" data-page-theme="Circuit de traitement">
      <div class="section-title-row">
        <div>
          <h2>Le circuit décisionnel du traitement d'un EI</h2>
          <p>Les 5 étapes incontournables sous la responsabilité du manager.</p>
        </div>
      </div>
      <div class="focus-row">
        ${ei.process.map((step, idx) => `<article class="focus-card glass-panel">
          <span class="eyebrow">ÉTAPE 0${idx+1}</span>
          <p style="margin-top:8px;font-weight:600;color:var(--text);font-size:13px">${esc(step)}</p>
        </article>`).join("")}
      </div>
    </div>

    <div class="section-block" data-page-theme="Outils qualité">
      <div class="section-title-row">
        <div>
          <h2>Outils institutionnels de la qualité</h2>
          <p>AgEval (ANAP), audits croisés, patient traceur et référentiels HAS.</p>
        </div>
      </div>
      <div class="result-grid">${qualityToolCards()}</div>
    </div>

    <div class="section-block" data-page-theme="Déclarations">
      <div class="section-title-row">
        <div>
          <h2>Matrice des déclarations externes obligatoires</h2>
          <p>Quand et à qui le directeur / cadre d'astreinte doit-il obligatoirement déclarer un événement ?</p>
        </div>
      </div>
      <div class="glass-panel" style="padding:18px;overflow-x:auto">
        <table class="data-table" style="width:100%;border-collapse:collapse;font-size:12px">
          <thead>
            <tr style="border-bottom:1px solid var(--stroke-strong);text-align:left;color:var(--muted)">
              <th style="padding:8px">Autorité destinataire</th>
              <th style="padding:8px">Portail / Canal</th>
              <th style="padding:8px">Périmètre d'application</th>
              <th style="padding:8px">Délai réglementaire</th>
              <th style="padding:8px">Base légale</th>
            </tr>
          </thead>
          <tbody>
            ${ei.externalReportingMatrix.map(row => `<tr style="border-bottom:1px solid var(--stroke)">
              <td style="padding:10px 8px;font-weight:600;color:var(--text)">${esc(row.authority)}</td>
              <td style="padding:10px 8px;color:var(--mint)">${esc(row.portal)}</td>
              <td style="padding:10px 8px">${esc(row.scope)}</td>
              <td style="padding:10px 8px;color:var(--coral);font-weight:600">${esc(row.deadline)}</td>
              <td style="padding:10px 8px;color:var(--muted)"><small>${esc(row.legalRef)}</small></td>
            </tr>`).join("")}
          </tbody>
        </table>
      </div>
    </div>

    ${sourceLinks(["ageval","signalement","hasEsms","hasHealth","pnsp"])}
  </section>`;
}

/* --- MODULE RETOURS D'EXPÉRIENCE (REX & CREX) --- */
function renderRex() {
  const rex = REX_GUIDE;
  const isUnlocked = isPremiumUnlocked();
  return `<section class="page" aria-labelledby="rex-title">
    ${sectionHead("MÉTHODOLOGIE QUALITÉ · SÉCURITÉ", "Le Retour d’Expérience (REX), <span class=\"text-gradient\">outil de progrès collectif.</span>", "Comprendre pourquoi et comment mener un REX : son intérêt managérial, ses prérequis éthiques, la méthode en 6 étapes, qui réunir autour de la table et comment éviter les pièges de la culpabilisation.", `<button class="button subtle" data-nav="qualite">${icon("shield",16)}Gestion des EI</button>`)}
    
    <div class="notice">${icon("info",18)}<span><strong>Définition clé.</strong> ${esc(rex.definition)}</span></div>

    ${renderAccessStatusBar()}
    <div class="section-block" data-page-theme="Intérêt du REX">
      <div class="section-title-row">
        <div>
          <h2>Pourquoi mener un REX ? Les 6 bénéfices majeurs</h2>
          <p>Le REX dépasse le traitement à chaud pour sécuriser durablement l'organisation.</p>
        </div>
      </div>
      <div class="focus-row">
        ${rex.interest.slice(0, 3).map((item, idx) => `<article class="focus-card glass-panel">
          <span class="eyebrow">INTÉRÊT 0${idx+1}</span>
          <p style="margin-top:8px;font-weight:600;color:var(--text);font-size:13px">${esc(item)}</p>
        </article>`).join("")}
      </div>
      <div class="focus-row" style="margin-top:14px">
        ${rex.interest.slice(3).map((item, idx) => `<article class="focus-card glass-panel">
          <span class="eyebrow">INTÉRÊT 0${idx+4}</span>
          <p style="margin-top:8px;font-weight:600;color:var(--text);font-size:13px">${esc(item)}</p>
        </article>`).join("")}
      </div>
    </div>

    ${isUnlocked ? `
    <div class="section-block" data-page-theme="La méthode">
      <div class="section-title-row">
        <div>
          <h2>Les 6 étapes de la méthode REX</h2>
          <p>Une démarche rigoureuse inspirée de la méthode ALARM et des recommandations HAS.</p>
        </div>
      </div>
      <div class="result-grid">
        ${rex.steps.map(s => `<article class="content-card">
          <div class="card-top">
            <div class="card-title-line">
              <span class="icon-bubble">${icon("lightbulb",17)}</span>
              <div>
                <h3>${esc(s.title)}</h3>
              </div>
            </div>
          </div>
          <p class="card-copy" style="margin-top:6px">${esc(s.detail)}</p>
        </article>`).join("")}
      </div>
    </div>

    <div class="section-block" data-page-theme="Participants">
      <div class="section-title-row">
        <div>
          <h2>Avec qui mener le REX ?</h2>
          <p>Le casting est déterminant pour la réussite et la légitimité de l'analyse.</p>
        </div>
      </div>
      <div class="documents-layout">
        <div class="glass-panel" style="padding:22px">
          <h3 style="margin-bottom:14px">Composition type d'une séance REX</h3>
          ${detailCell("1. Animateur / Méthodologue neutre", rex.who.animateur)}
          ${detailCell("2. Professionnels de terrain en poste", rex.who.participantsDirects)}
          ${detailCell("3. Cadre de proximité du service", rex.who.cadreProximite)}
          ${detailCell("4. Experts techniques invités selon le sujet", rex.who.expertsPonctuels)}
          ${detailCell("5. Direction d'établissement", rex.who.direction)}
        </div>
        <aside class="doc-toolbox glass-panel">
          <span class="eyebrow">LES PIÈGES À ÉVITER</span>
          <h3 style="margin-top:12px">Les 4 dérives courantes</h3>
          <ul class="bullet-list" style="margin-top:12px">
            ${rex.pitfalls.map(p => `<li>${esc(p)}</li>`).join("")}
          </ul>
        </aside>
      </div>
    </div>

    <div class="section-block" data-page-theme="Formats">
      <div class="section-title-row">
        <div>
          <h2>Les différents formats de retour d'expérience</h2>
          <p>Adapter la durée et le cadre à la gravité de la situation.</p>
        </div>
      </div>
      <div class="result-grid">
        ${rex.formats.map(f => `<article class="content-card">
          <div class="card-top">
            <div class="card-title-line">
              <span class="icon-bubble">${icon("calendar",17)}</span>
              <div>
                <h3>${esc(f.name)}</h3>
                <p>Durée conseillée : ${esc(f.duration)}</p>
              </div>
            </div>
          </div>
          <span class="tag gold">${esc(f.target)}</span>
          <p class="card-copy" style="margin-top:8px"><strong>Animation :</strong> ${esc(f.animation)}</p>
        </article>`).join("")}
      </div>
    </div>

    ` : `<div data-page-theme="Méthode Premium">${paywallGate("Méthode ALARM & Protocole d'Animation REX (45% Campus)", "Accédez à la démarche complète en 6 étapes, aux 7 dimensions causales de la grille ALARM et à la composition type d'une séance sans culpabilisation.", `
      <div class="section-block"><div class="result-grid">${rex.steps.slice(0,2).map(s => `<article class="content-card"><h3>${esc(s.title)}</h3><p>${esc(s.detail)}</p></article>`).join("")}</div></div>
    `)}</div>`}

    ${sourceLinks(["rexHas","crex","rexEssms","hasHealth"])}
  </section>`;
}

/* --- MODULE CORPS DE MÉTIER SUPPORT & ORGANIGRAMME --- */
function supportJobCards(list = SUPPORT_JOBS, offset = 0) {
  if (!list.length) return `<div class="empty-state"><strong>Aucun métier support trouvé</strong>Essayez une autre recherche ou un autre filtre.</div>`;
  return list.map((job, idx) => `<article class="content-card job-card">
    <button class="card-hit" data-action="open-support-job" data-id="${esc(job.id)}">
      <span class="tag ${tagColor(job.family)} level-tag">${esc(job.orgaLevel)}</span>
      <div class="card-top">
        <div>
          <h3>${esc(job.name)}</h3>
          <p class="card-copy">${esc(job.placement)}</p>
        </div>
      </div>
      <div class="meta-row">
        <span class="tag ${tagColor(job.family)}">${esc(job.family)}</span>
        <span class="meta-label">Métier support ${String(idx+offset+1).padStart(2,"0")}</span>
      </div>
      <p class="card-copy" style="font-size:12px;margin:8px 0">${esc(job.role.slice(0, 110))}...</p>
      <div class="card-foot">
        <span>Organigramme, rôle & interactions</span>
        ${icon("arrow-up-right",13)}
      </div>
    </button>
  </article>`).join("");
}

function renderSupportJobs() {
  const families = ["Tout", ...new Set(SUPPORT_JOBS.map(j => j.family))];
  const list = state.filters.supportJobs === "Tout" 
    ? SUPPORT_JOBS 
    : SUPPORT_JOBS.filter(j => j.family === state.filters.supportJobs);

  return `<section class="page" aria-labelledby="support-jobs-title">
    ${sectionHead("MANAGEMENT · ÉQUIPES TRANSVERSALES", "Les corps de métier support, <span class=\"text-gradient\">piliers du quotidien.</span>", "Gouvernante, ASH/ASR, ASL/magasiniers, maintenance, logistique, SI, qualité, guichet unique : découvrez leur place exacte dans l'organigramme, leurs missions, leurs défis managériaux et comment chaque corps de métier interagit avec les soignants, éducateurs et la direction.", `<button class="button subtle" data-nav="metiers">${icon("briefcase",16)}Voir les métiers de direction</button>`)}
    
    <div class="notice">${icon("info",18)}<span><strong>L'interdépendance au cœur de la performance.</strong> Un établissement ne fonctionne pas sans une alliance étroite entre le soin, l'éducatif et les fonctions support. Une panne d'ascenseur, une rupture de protections ou un bionettoyage défaillant impactent immédiatement la dignité de la personne accompagnée.</span></div>

    <div data-page-theme="Les métiers">
    <div class="filter-bar">
      <label class="search-box">
        <span data-icon="search"></span>
        <input class="form-control" id="support-job-query" type="search" placeholder="Métier support, mission, rôle, outil..." aria-label="Rechercher un métier support">
      </label>
      ${renderFilterSelect("supportJobs", families, state.filters.supportJobs, "Filtrer les métiers support par famille", "Toutes les familles")}
      <span class="filter-count" id="support-job-count" aria-live="polite">${list.length} métier${list.length === 1 ? "" : "s"}</span>
    </div>

    <div class="jobs-layout section-block">
      <div class="job-grid" id="support-job-results">${supportJobCards(list)}</div>
      <aside class="job-side glass-panel">
        <span class="eyebrow">ORGANIGRAMME TYPE</span>
        <h3 style="margin-top:12px">Positionnement sous la direction</h3>
        <div class="org-chain">
          <div class="org-node focus">Direction d'Établissement / Pôle</div>
          <i class="org-connector"></i>
          <div class="org-node">Adjoint·e de Direction / DAF</div>
          <i class="org-connector"></i>
          <div class="org-node">Gouvernante · Resp. Logistique · Resp. SI · Resp. Maintenance · Guichet Unique</div>
          <i class="org-connector"></i>
          <div class="org-node">ASH / ASR · Magasiniers ASL · Techniciens maintenance · Techniciens SI</div>
        </div>
        <div class="notice" style="margin-top:16px">${icon("info",16)}<span><strong>Lien fonctionnel Qualité :</strong> L'équipe Qualité traverse l'ensemble de cet organigramme de manière transversale.</span></div>
      </aside>
    </div>

    </div>
    <div class="section-block" data-page-theme="Interactions entre métiers">
      <div class="section-title-row">
        <div>
          <h2>Matrice des interactions transversales</h2>
          <p>Comment les différents métiers interagissent concrètement pour sécuriser le fonctionnement global.</p>
        </div>
      </div>
      <div class="focus-row">
        <article class="focus-card glass-panel">
          <span class="eyebrow">SOINS ↔ HÔTELLERIE</span>
          <h3 style="margin-top:6px">IDEC & Gouvernante / ASH</h3>
          <p>Synchronisation quotidienne des heures de toilettes et de ménage pour préserver le repos des résidents. Transmission orale des signaux d'alerte (refus de repas, fatigue, douleur) observés par l'ASH.</p>
        </article>
        <article class="focus-card glass-panel">
          <span class="eyebrow">SOINS ↔ MAINTENANCE</span>
          <h3 style="margin-top:6px">Soignants & Techniciens</h3>
          <p>Signalement immédiat des lits bloqués, rails de transfert défaillants ou sonnettes d'appel en panne. Interventions coordonnées pour ne pas interrompre un soin intime.</p>
        </article>
        <article class="focus-card glass-panel">
          <span class="eyebrow">LOGISTIQUE ↔ SOINS</span>
          <h3 style="margin-top:6px">Magasinier ASL & Pharmacie / Soins</h3>
          <p>Gestion des stocks tampons en étage, réassort sans rupture des dispositifs médicaux (compresses, gants, protections) et respect strict des conditions de conservation.</p>
        </article>
      </div>
      <div class="focus-row" style="margin-top:14px">
        <article class="focus-card glass-panel">
          <span class="eyebrow">SI ↔ TOUS MÉTIERS</span>
          <h3 style="margin-top:6px">Équipe SI & Utilisateurs</h3>
          <p>Paramétrage et assistance du Dossier Usager Informatisé (DUI/DPI Ségur), sécurisation des mots de passe et formation continue pour décharger les soignants des lourdeurs techniques.</p>
        </article>
        <article class="focus-card glass-panel">
          <span class="eyebrow">GUICHET UNIQUE ↔ PÔLES</span>
          <h3 style="margin-top:6px">Admissions & Équipes de prise en charge</h3>
          <p>Évaluation des demandes d'admission, régulation de la liste d'attente globale et passerelles directes entre hébergement permanent, accueil de jour et répit sans rupture de droits.</p>
        </article>
        <article class="focus-card glass-panel">
          <span class="eyebrow">QUALITÉ ↔ TOUS MÉTIERS</span>
          <h3 style="margin-top:6px">Qualité & Terrain</h3>
          <p>Diffusion des protocoles actualisés, recueil bienveillant des événements indésirables (AgEval) et animation des retours d'expérience pour progresser ensemble.</p>
        </article>
      </div>
    </div>
  </section>`;
}

/* --- MODULE POLITIQUE DE SANTÉ & RÉFORMES RÉGLEMENTAIRES --- */
function lawCards(list = HEALTH_POLICY.nationalLaws) {
  return list.map((law, idx) => `<article class="content-card">
    <button class="card-hit" data-action="open-health-law" data-id="${esc(law.id)}">
      <div class="card-top">
        <div class="card-title-line">
          <span class="icon-bubble">${icon("clipboard",17)}</span>
          <div>
            <h3>${esc(law.title)}</h3>
            <p>${esc(law.subtitle)}</p>
          </div>
        </div>
      </div>
      <div class="meta-row">
        <span class="tag gold">${law.year}</span>
        <span class="tag mint">${esc(law.status)}</span>
        <span class="tag sky">${esc(law.scope)}</span>
      </div>
      <p class="card-copy" style="margin:8px 0">${esc(law.summary.slice(0, 115))}...</p>
      <div class="card-foot">
        <span>Impacts pour le manager & outils créés</span>
        ${icon("arrow-up-right",13)}
      </div>
    </button>
  </article>`).join("");
}

function renderHealthPolicy() {
  const hp = HEALTH_POLICY;
  const isUnlocked = isPremiumUnlocked();
  return `<section class="page" aria-labelledby="policy-title">
    ${sectionHead("CADRE RÉGLEMENTAIRE & STRATÉGIQUE", "Politique de santé et <span class=\"text-gradient\">réformes nationales & régionales.</span>", "Maîtriser les lois fondatrices (2002-2, 2005, ASV) et les réformes récentes (Bien Vieillir 2024, Ségur du numérique, SAD, PRS 3 de l'ARS). Comprendre ce que chaque texte change concrètement pour votre établissement, vos budgets et vos équipes.", `<button class="button subtle" data-action="open-sources">${icon("book",16)}Légifrance & ARS</button>`)}
    
    <div class="notice">${icon("info",18)}<span><strong>Veille réglementaire active (Mise à jour ${esc(hp.lastUpdate)}).</strong> ${esc(hp.vision)}</span></div>

    ${renderAccessStatusBar()}
    <div class="section-block" data-page-theme="Lois nationales">
      <div class="section-title-row">
        <div>
          <h2>Les 10 grandes lois structurantes</h2>
          <p>De la loi 2002-2 à la loi Bien Vieillir de 2024 : le socle juridique indispensable à tout dirigeant.</p>
        </div>
      </div>
      <div class="result-grid" id="law-results">${pagedCards("laws", hp.nationalLaws, lawCards)}</div>
    </div>

    ${isUnlocked ? `
    <div class="section-block" data-page-theme="Projet régional">
      <div class="section-title-row">
        <div>
          <h2>L'échelon régional : Le Projet Régional de Santé (PRS 3 de l'ARS)</h2>
          <p>${esc(hp.regionalFramework.description)}</p>
        </div>
      </div>
      <div class="focus-row">
        ${hp.regionalFramework.components.map(comp => `<article class="focus-card glass-panel">
          <span class="eyebrow">VOLET PRS</span>
          <h3 style="margin-top:6px">${esc(comp.name)}</h3>
          <p>${esc(comp.role)}</p>
        </article>`).join("")}
      </div>
      <div class="notice" style="margin-top:14px">${icon("info",16)}<span><strong>Conseil stratégique pour le manager :</strong> ${esc(hp.regionalFramework.managerAction)}</span></div>
    </div>

    <div class="section-block" data-page-theme="Département">
      <div class="section-title-row">
        <div>
          <h2>L'échelon départemental & la tarification</h2>
          <p>${esc(hp.departmentalFramework.description)}</p>
        </div>
      </div>
      <div class="focus-row">
        ${hp.departmentalFramework.components.map(comp => `<article class="focus-card glass-panel">
          <span class="eyebrow">DÉPARTEMENT</span>
          <h3 style="margin-top:6px">${esc(comp.name)}</h3>
          <p>${esc(comp.role)}</p>
        </article>`).join("")}
      </div>
    </div>

    <div class="section-block" data-page-theme="Qui décide ?">
      <div class="section-title-row">
        <div>
          <h2>Grille de synthèse : qui décide quoi dans le système ?</h2>
          <p>Distinguer les compétences des 4 niveaux institutionnels.</p>
        </div>
      </div>
      <div class="glass-panel" style="padding:18px;overflow-x:auto">
        <table class="data-table" style="width:100%;border-collapse:collapse;font-size:12px">
          <thead>
            <tr style="border-bottom:1px solid var(--stroke-strong);text-align:left;color:var(--muted)">
              <th style="padding:8px">Échelon</th>
              <th style="padding:8px">Autorités clés</th>
              <th style="padding:8px">Impact direct sur votre établissement</th>
            </tr>
          </thead>
          <tbody>
            ${hp.managerSummaryGrid.map(row => `<tr style="border-bottom:1px solid var(--stroke)">
              <td style="padding:10px 8px;font-weight:600;color:var(--text)">${esc(row.level)}</td>
              <td style="padding:10px 8px;color:var(--sky);font-weight:600">${esc(row.authority)}</td>
              <td style="padding:10px 8px">${esc(row.impact)}</td>
            </tr>`).join("")}
          </tbody>
        </table>
      </div>
    </div>

    ` : `<div data-page-theme="Cadre territorial Premium">${paywallGate("Cadre Stratégique ARS, Département & Synthèse Décisionnelle (45% Campus)", "Accédez aux orientations du PRS 3 ARS, aux mécanismes d'arbitrage départemental et à la grille comparative des compétences institutionnelles.", `
      <div class="section-block"><div class="focus-row">${hp.regionalFramework.components.slice(0,2).map(c => `<article class="focus-card glass-panel"><h3>${esc(c.name)}</h3><p>${esc(c.role)}</p></article>`).join("")}</div></div>
    `)}</div>`}

    ${sourceLinks(["loi2002","loi2005","loi2015","loi2024autonomie","prs","segurNum"])}
  </section>`;
}

function detailModal(kind, item) {
  let title = "", kicker = "FICHE REPÈRE", lede = "", cells = [], sourceIds = [];
  if (kind === "establishment") {
    title = item.name; kicker = item.family.toUpperCase(); lede = item.definition; sourceIds = item.sources;
    cells = [["Public accueilli",item.audience],["Dispositifs fréquents",item.devices],["Métiers présents",item.professions],["Partenaires privilégiés",item.partners],["Le regard du manager",item.manager,true],["Statut / type",item.type]];
  } else if (kind === "job") {
    title = item.name; kicker = item.level.toUpperCase(); lede = item.path; sourceIds = item.sources;
    const isUnlocked = isPremiumUnlocked();
    if (item.isPremium && !isUnlocked) {
      openDialog("ACCÈS PREMIUM MÉTIERS", paywallGate("Fiche métier réservée", `« ${item.name} » fait partie des fiches institutionnelles Premium. Abonnez-vous pour accéder aux délégations, responsabilités, indiciaires et interactions CODIR.`));
      return;
    } else {
      cells = [["Place dans l’organigramme",item.placement],["Personnes encadrées",item.reports],["Champ de décision",item.decisions,true],["Déclinaisons selon le lieu",item.variants,true],["Point de vigilance",item.boundary,true]];
    }
  } else if (kind === "meeting") {
    title = item.name; kicker = item.kind.toUpperCase(); lede = item.full;
    cells = [["Qui participe ?",item.who],["But",item.purpose],["Niveau décisionnel",item.decision],["Votre rôle de manager",item.manager,true],["À retenir",item.caution,true]]; sourceIds = item.sources;
  } else if (kind === "document") {
    title = item.name; kicker = item.category.toUpperCase(); lede = item.purpose; sourceIds = item.sources;
    cells = [["Statut",item.status],["Qui le produit ?",item.who],["Qui associer ?",item.involve,true],["Quand le produire ou le réviser ?",item.when,true],["Utilité managériale",item.manager,true],["Trame de production",item.steps]];
  } else if (kind === "actor") {
    title = item.name; kicker = item.type.toUpperCase(); lede = item.role; sourceIds = item.sources;
    cells = [["Place par rapport à l’établissement",item.position,true],["Comment interagir ?",item.interaction,true],["Ce que l’on peut en tirer",item.value,true]];
  } else if (kind === "quality_tool") {
    title = item.name; kicker = item.category.toUpperCase(); lede = item.purpose; sourceIds = item.sources;
    cells = [
      ["Public cible", item.target],
      ["Éditeur / Origine", item.editor],
      ["Comment ça marche ?", item.howItWorks, true],
      ["Points forts & atouts", item.strengths, true],
      ["Limites & points de vigilance", item.limits, true]
    ];
  } else if (kind === "support_job") {
    title = item.name; kicker = item.family.toUpperCase(); lede = item.role; sourceIds = item.sources;
    const interactionsList = Object.entries(item.interactions).map(([k, v]) => `${k.toUpperCase().replace('_', ' ')} : ${v}`);
    cells = [
      ["Niveau hiérarchique", item.orgaLevel],
      ["Rattachement hiérarchique", item.placement],
      ["Équipe encadrée", item.reports],
      ["Missions & rôle détaillé", item.role, true],
      ["Interactions croisées avec les autres corps de métier", interactionsList, true],
      ["Défis managériaux du dirigeant", item.challenges, true],
      ["Outils, logiciels & supports", item.tools, true]
    ];
  } else if (kind === "health_law") {
    title = item.title; kicker = item.scope.toUpperCase(); lede = item.subtitle; sourceIds = item.sources;
    cells = [
      ["Année d'adoption", String(item.year)],
      ["Statut juridique", item.status],
      ["Résumé & dispositions majeures", item.summary, true],
      ["Outils & dispositifs créés par la loi", item.toolsCreated, true],
      ["Impact concret pour le manager d'établissement", item.managerImpact, true]
    ];
  } else if (kind === "adverse_level") {
    title = item.name; kicker = "NIVEAU D'ÉVÉNEMENT INDÉSIRABLE"; lede = item.definition; sourceIds = ["signalement", "ageval"];
    cells = [
      ["Quand choisir ce niveau ?", item.whenToChoose, true],
      ["Exemples concrets du terrain", item.examples, true],
      ["Ce que ce choix provoque comme actions", item.consequences, true],
      ["Pilote de l'analyse & responsabilité", item.leadRole],
      ["Signalement externe obligatoire", item.externalDeclaration ? "OUI — ARS / Portail e-SIN / Procureur si délit" : "NON — Gestion et traçabilité interne"]
    ];
  }

  const content = `<h2 class="dialog-title" id="dialog-title">${esc(title)}</h2><p class="dialog-lede">${esc(lede)}</p><div class="dialog-content-grid">${cells.map(cell => detailCell(cell[0],cell[1],cell[2])).join("")}</div>${sourceLinks(sourceIds)}<div class="separator"></div><div class="meta-row"><span class="tag mint">Repère pédagogique</span><span class="muted" style="font-size:9px">Vérifier le statut, l’autorisation et les délégations locales avant décision.</span></div>`;
  openDialog(kicker, content);
}
function openDialog(kicker, content, { fromHistory = false } = {}) {
  dialogAnimation?.cancel();
  dialog.style.opacity = "";
  dialog.style.transform = "";
  activeDialog = { kicker, content };
  if (fromHistory) dialogHistoryActive = true;
  else {
    try {
      const historyState = { ...(window.history?.state || {}), page:state.page, scrollY:window.scrollY || 0, dialog:true };
      if (dialogHistoryActive) window.history?.replaceState(historyState, "", window.location.href);
      else if (typeof window.history?.pushState === "function") window.history.pushState(historyState, "", window.location.href);
      dialogHistoryActive = typeof window.history?.pushState === "function";
    } catch { dialogHistoryActive = false; }
  }
  dialogKicker.textContent = kicker;
  dialogContent.innerHTML = content;
  hydrateIcons(dialog);
  if (!dialog.open) dialog.showModal();
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || typeof dialog.animate !== "function") return;
  dialogAnimation = dialog.animate(
    [{ opacity:0, transform:"translate3d(0,12px,0) scale(.985)" }, { opacity:1, transform:"translate3d(0,0,0) scale(1)" }],
    { duration:365, easing:"cubic-bezier(.18,.72,.23,1)" }
  );
  const opening = dialogAnimation;
  opening.onfinish = () => { if (dialogAnimation === opening) { opening.cancel(); dialogAnimation = null; } };
}
function closeDialog({ fromHistory = false } = {}) {
  if (!dialog.open) return;
  dialogAnimation?.cancel();
  dialogAnimation = null;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || typeof dialog.animate !== "function") {
    dialog.close();
    finishDialogHistory(fromHistory);
    return;
  }
  const closing = dialog.animate(
    [{ opacity:1, transform:"translate3d(0,0,0) scale(1)" }, { opacity:0, transform:"translate3d(0,8px,0) scale(.99)" }],
    { duration:277, easing:"cubic-bezier(.4,0,1,1)", fill:"forwards" }
  );
  dialogAnimation = closing;
  closing.onfinish = () => {
    if (dialog.open) dialog.close();
    closing.cancel();
    if (dialogAnimation === closing) dialogAnimation = null;
    finishDialogHistory(fromHistory);
  };
}
function finishDialogHistory(fromHistory) {
  const returnToPreviousEntry = dialogHistoryActive && !fromHistory;
  dialogHistoryActive = false;
  if (returnToPreviousEntry && typeof window.history?.back === "function") window.history.back();
}
function bindDialogGestures() {
  const grabber = $("#dialog-grabber");
  const dialogEl = $("#app-dialog");
  if (!grabber || !dialogEl) return;

  let startY = null;
  let lastY = null;
  let lastTime = 0;
  let velocityY = 0;
  let isDragging = false;

  function rubberBand(distance, dimension = 320, constant = 0.55) {
    return (distance * dimension * constant) / (dimension + constant * distance);
  }

  grabber.addEventListener("pointerdown", event => {
    if (event.button !== undefined && event.button !== 0) return;
    startY = event.clientY;
    lastY = event.clientY;
    lastTime = performance.now();
    velocityY = 0;
    isDragging = true;
    dialogEl.style.transition = "none";
    grabber.setPointerCapture?.(event.pointerId);
  });

  grabber.addEventListener("pointermove", event => {
    if (!isDragging || startY === null) return;
    const dy = event.clientY - startY;
    const now = performance.now();
    const dt = now - lastTime;
    if (dt > 0) {
      velocityY = (event.clientY - lastY) / dt;
    }
    lastY = event.clientY;
    lastTime = now;

    if (dy > 0) {
      // Suivi 1:1 direct du doigt vers le bas
      dialogEl.style.transform = `translate3d(0, ${dy}px, 0)`;
      const opacity = Math.max(0.25, 1 - dy / 420);
      dialogEl.style.opacity = `${opacity}`;
    } else {
      // Effet élastique Apple (Rubber-banding) vers le haut
      const resistance = -rubberBand(Math.abs(dy));
      dialogEl.style.transform = `translate3d(0, ${resistance}px, 0)`;
    }
  });

  const onDragEnd = () => {
    if (!isDragging || startY === null) return;
    const dy = lastY - startY;
    isDragging = false;
    startY = null;

    // Projection de moment (Velocity handoff Apple)
    const projected = dy + velocityY * 160;

    if (projected > 110 || dy > 140) {
      dialogEl.style.transition = "transform .38s var(--ease-out), opacity .35s var(--ease-out)";
      dialogEl.style.transform = "translate3d(0, 100%, 0)";
      dialogEl.style.opacity = "0";
      setTimeout(() => {
        closeDialog();
        dialogEl.style.transform = "";
        dialogEl.style.opacity = "";
        dialogEl.style.transition = "";
      }, 360);
    } else {
      // Rappel élastique fluide (Spring return) sans à-coups
      dialogEl.style.transition = "transform .48s var(--ease-spring), opacity .42s var(--ease-out)";
      dialogEl.style.transform = "translate3d(0, 0, 0)";
      dialogEl.style.opacity = "1";
      setTimeout(() => {
        dialogEl.style.transform = "";
        dialogEl.style.opacity = "";
        dialogEl.style.transition = "";
      }, 480);
    }
  };

  grabber.addEventListener("pointerup", onDragEnd);
  grabber.addEventListener("pointercancel", onDragEnd);
}
function openSearch() {
  state.cmdFilter = "all";
  const html = `<div class="cmd-palette">
    <div class="cmd-header">
      <div class="cmd-input-wrap">
        <span class="cmd-search-icon">${icon("search", 18)}</span>
        <input class="cmd-input" id="global-search" type="search" autofocus placeholder="Rechercher structures, métiers, lois, AgEval, ETP, REX, documents…" aria-label="Recherche globale" autocomplete="off">
        <span class="cmd-shortcut">ESC</span>
      </div>
      <div class="cmd-filters" role="tablist" aria-label="Filtrer la recherche">
        <button type="button" class="cmd-filter-pill is-active" data-action="cmd-filter" data-category="all" role="tab" aria-selected="true">Tout (13 thèmes)</button>
        <button type="button" class="cmd-filter-pill" data-action="cmd-filter" data-category="structures" role="tab" aria-selected="false">Établissements</button>
        <button type="button" class="cmd-filter-pill" data-action="cmd-filter" data-category="metiers" role="tab" aria-selected="false">Métiers</button>
        <button type="button" class="cmd-filter-pill" data-action="cmd-filter" data-category="qualite" role="tab" aria-selected="false">Qualité & EI</button>
        <button type="button" class="cmd-filter-pill" data-action="cmd-filter" data-category="lois" role="tab" aria-selected="false">Lois & Droits</button>
        <button type="button" class="cmd-filter-pill" data-action="cmd-filter" data-category="rh" role="tab" aria-selected="false">RH & Outils</button>
      </div>
    </div>
    <div class="cmd-results" id="global-results" aria-live="polite"></div>
    <div class="cmd-footer">
      <div class="cmd-footer-hints">
        <span><kbd>↑</kbd> <kbd>↓</kbd> Naviguer</span>
        <span><kbd>↵</kbd> Ouvrir</span>
        <span><kbd>ESC</kbd> Fermer</span>
      </div>
      <div class="cmd-footer-brand">Mosaïque Santé · Executive Command</div>
    </div>
  </div>`;
  openDialog("RECHERCHE EXECUTIVE", html);
  setTimeout(() => {
    $("#global-search")?.focus();
    globalSearchResults("");
  }, 25);
}

function openSources() {
  const sorted = Object.values(SOURCES).sort((a,b) => a.label.localeCompare(b.label,"fr"));
  const html = `<h2 class="dialog-title" id="dialog-title">Sources, périmètre et limites</h2><p class="dialog-lede">Le contenu privilégie Légifrance, la HAS, la CNSA, l’ANAP, l’EHESP, le service public et FINESS. Les liens ouvrent les ressources officielles dans un nouvel onglet.</p><div class="notice" style="margin:16px 0">${icon("info",18)}<span>Cette application est une base de travail pédagogique, pas un avis juridique, médical ou financier. La version des textes et le périmètre d’autorisation de chaque site doivent être contrôlés avant action.</span></div><div class="sources-grid">${sorted.map(source => `<a class="source-card" href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${icon("external",15)}<span>${esc(source.label)}<small>${new URL(source.url).hostname}</small></span></a>`).join("")}</div><div class="separator"></div><p class="field-hint">La liste d’établissements présente les grandes familles et des types courants. La nomenclature détaillée dépend de FINESS et des textes applicables. Certains termes d’usage local (CODIREL, DUERME, EAM…) doivent être confirmés dans votre organisation.</p>`;
  openDialog("SOURCES OFFICIELLES", html);
}
function openProfileNote() {
  const html = `<h2 class="dialog-title" id="dialog-title">Comment les pistes ont été adaptées</h2><p class="dialog-lede">Les documents fournis décrivent un Master 2 Management des établissements de santé à l’IAE Paris-Est, une licence en économie et management de la santé et une alternance d’adjoint de direction en MAS.</p><div class="dialog-content-grid">${detailCell("Expérience retenue", "Pilotage qualité HAS, gestion des risques, organisation RH/planning, EPRD/CNR, coordination métier et transformation numérique.",true)}${detailCell("Pistes à court terme", ["Adjoint de direction ESSMS","Responsable qualité / gestion des risques","Chef de projet / chargé de mission","Responsable RH ou organisation","Pilotage administratif et financier"])}${detailCell("Voies à consolider", ["Concours D3S / DH pour les corps de direction de la FPH","CAFDES selon employeur et projet de carrière","Expertise droit social, budget et management d’équipes"])}${detailCell("Limite essentielle", "Un diplôme ne vaut pas délégation de signature, qualification clinique, concours ou expérience requise. Chaque poste doit être lu à partir de sa fiche et de son statut.",true)}</div>${sourceLinks(["iae","d3s","dh","cafdes"])}`;
  openDialog("PARCOURS MASTER MES", html);
}
function openMeetingTemplate() {
  const html = `<h2 class="dialog-title" id="dialog-title">Trame express de réunion</h2><p class="dialog-lede">Une réunion utile produit une décision compréhensible ou une prochaine action tenue par quelqu’un.</p><div class="dialog-content-grid">${detailCell("Avant",["Objectif et décision attendue","Participants nécessaires et pouvoir de décision","Documents envoyés à l’avance","Durée, animateur et prise de notes"])}${detailCell("Pendant",["Distinguer faits, questions et arbitrages","Donner la parole aux personnes concernées","Nommer les risques et désaccords","Vérifier ce qui est réellement décidé"])}${detailCell("Après",["Relevé de décisions concis","Action, responsable et échéance","Information aux absents et personnes concernées","Date de suivi et preuve de clôture"],true)}</div><button class="button primary" data-action="close-dialog" style="margin-top:18px">${icon("check",15)}C’est prêt</button>`;
  openDialog("OUTIL MANAGER", html);
}
function openDocument(kind, id) {
  const item = DOCUMENTS.find(doc => doc.id === id);
  if (item) detailModal("document",item);
}

function globalSearchResults(query) {
  const needle = (query || "").trim().toLocaleLowerCase("fr");
  const resultBox = $("#global-results");
  if (!resultBox) return;
  const currentCategory = state.cmdFilter || "all";

  const searchableJobs = isPremiumUnlocked() ? JOBS : JOBS.filter(item => item.isPremium !== true);
  
  const allCollections = [
    ...ESTABLISHMENTS.map(item => ({ kind:"establishment", id:item.id, cat:"structures", label:item.name, detail:`${item.short || ""} · ${item.family}`, badge:"Structure", icon:"building", item })),
    ...searchableJobs.map(item => ({ kind:"job", id:item.id, cat:"metiers", label:item.name, detail:`${item.level} · ${item.sector}`, badge:"Direction", icon:"briefcase", item })),
    ...(typeof SUPPORT_JOBS !== "undefined" ? SUPPORT_JOBS : []).map(item => ({ kind:"support_job", id:item.id, cat:"metiers", label:item.title, detail:`${item.family} · ${item.level}`, badge:"Support", icon:"people", item })),
    ...(typeof QUALITY_TOOLS !== "undefined" ? QUALITY_TOOLS : []).map(item => ({ kind:"quality_tool", id:item.id, cat:"qualite", label:item.name, detail:`${item.editor} · ${item.purpose}`, badge:"Outil Qualité", icon:"shield", item })),
    ...((typeof ADVERSE_EVENTS !== "undefined" && ADVERSE_EVENTS.levels) || []).map(item => ({ kind:"adverse_level", id:String(item.level), cat:"qualite", label:item.name, detail:item.short, badge:"Niveau EI", icon:"alert", item })),
    ...((typeof AUDIT_GUIDE !== "undefined" && AUDIT_GUIDE.types) || []).map(item => ({ kind:"audit", id:item.id, cat:"qualite", label:item.title, detail:item.desc, badge:"Audit HAS", icon:"target", item })),
    ...((typeof GLOSSARY_TERMS !== "undefined" ? GLOSSARY_TERMS : [])).map(item => ({ kind:"glossary", id:item.sigle, cat:"rh", label:`${item.sigle} — ${item.full}`, detail:item.def.slice(0, 95) + "…", badge:"Sigle", icon:"book", item })),
    ...((typeof RH_LEAVE_TYPES !== "undefined" ? RH_LEAVE_TYPES : [])).map(item => ({ kind:"rh_leave", id:item.id, cat:"rh", label:item.title, detail:item.subtitle, badge:"Congé RH", icon:"calendar", item })),
    ...((typeof HEALTH_POLICY !== "undefined" && HEALTH_POLICY.nationalLaws) || []).map(item => ({ kind:"health_law", id:item.id, cat:"lois", label:`${item.year} · ${item.name}`, detail:item.theme, badge:"Loi Santé", icon:"clipboard", item })),
    ...DOCUMENTS.map(item => ({ kind:"document", id:item.id, cat:"lois", label:item.name, detail:item.category, badge:"Document", icon:"file", item })),
    ...MEETINGS.map(item => ({ kind:"meeting", id:item.id, cat:"structures", label:`${item.name} (${item.full})`, detail:item.kind, badge:"Instance", icon:"calendar", item })),
    ...ACTORS.map(item => ({ kind:"actor", id:item.id, cat:"structures", label:item.name, detail:item.type, badge:"Partenaire", icon:"network", item })),
    ...(typeof CONVENTIONS !== "undefined" ? CONVENTIONS : []).map(item => ({ kind:"convention", id:item.idcc || item.name, cat:"rh", label:item.name, detail:`${item.idcc} · ${item.scope}`, badge:"Convention", icon:"file", item })),
    ...SOFTWARES.map(item => ({ kind:"software", id:item.name, cat:"rh", label:item.name, detail:`${item.group} · ${item.what}`, badge:"Logiciel", icon:"layers", item })),
    ...FAQ.map((item, idx) => ({ kind:"faq", id:String(idx), cat:"rh", label:item.q, detail:item.a.slice(0, 90) + "…", badge:"FAQ RH", icon:"help", item }))
  ];

  let list = allCollections;
  if (currentCategory !== "all") {
    list = list.filter(record => record.cat === currentCategory);
  }

  if (!needle) {
    const quickPicks = [
      { kind:"establishment", id:"mas", cat:"structures", label:"MAS (Maison d’Accueil Spécialisée)", detail:"Établissement médico-social · Handicap lourd", badge:"Populaire", icon:"building" },
      { kind:"adverse_level", id:"4", cat:"qualite", label:"Niveau 4 — EIGS & Décès inattendu", detail:"Cellule de crise, signalement ARS e-SIN sous 48h, ALARM", badge:"Urgence", icon:"alert" },
      { kind:"quality_tool", id:"ageval", cat:"qualite", label:"AgEval (ANAP)", detail:"Plateforme nationale d'évaluation et gestion des EI", badge:"Outil clé", icon:"shield" },
      { kind:"health_law", id:"loi-2002-2", cat:"lois", label:"Loi 2002-2 du 2 janvier 2002", detail:"Rénovation de l'action sociale et 7 outils usagers", badge:"Fondateur", icon:"clipboard" },
      { kind:"health_law", id:"bien-vieillir-2024", cat:"lois", label:"Loi Bien Vieillir 2024", detail:"Gouvernance, maltraitance, SPDA et carte professionnelle", badge:"Récent", icon:"spark" },
      { kind:"convention", id:"ccn51", cat:"rh", label:"Convention FEHAP (CCN 51)", detail:"Établissements privés d'intérêt collectif à but non lucratif", badge:"RH", icon:"file" }
    ];
    resultBox.innerHTML = `
      <div class="cmd-group-label">Accès rapides recommandés</div>
      ${quickPicks.map((record, index) => `
        <button class="cmd-item ${index === 0 ? "is-selected" : ""}" data-action="open-search-result" data-kind="${record.kind}" data-id="${record.id}" role="option">
          <div class="cmd-item-icon">${icon(record.icon, 16)}</div>
          <div class="cmd-item-body">
            <div class="cmd-item-title">${esc(record.label)}</div>
            <div class="cmd-item-sub">${esc(record.detail)}</div>
          </div>
          <span class="cmd-item-badge">${esc(record.badge)}</span>
        </button>
      `).join("")}
      <div class="cmd-group-label" style="margin-top:14px">Ou tapez directement un mot-clé ci-dessus</div>
    `;
    hydrateIcons(resultBox);
    return;
  }

  const matches = list.filter(record => {
    const hay = (record.label + " " + record.detail + " " + JSON.stringify(record.item)).toLocaleLowerCase("fr");
    return hay.includes(needle);
  }).slice(0, 16);

  if (!matches.length) {
    resultBox.innerHTML = `<div class="empty-state">
      <strong>Aucun résultat pour « ${esc(query)} »</strong>
      <span>Vérifiez l'orthographe ou changez d'onglet (${currentCategory === 'all' ? 'Toutes catégories' : currentCategory}).</span>
    </div>`;
    return;
  }

  resultBox.innerHTML = matches.map((record, index) => `
    <button class="cmd-item ${index === 0 ? "is-selected" : ""}" data-action="open-search-result" data-kind="${record.kind}" data-id="${record.id}" role="option">
      <div class="cmd-item-icon">${icon(record.icon, 16)}</div>
      <div class="cmd-item-body">
        <div class="cmd-item-title">${esc(record.label)}</div>
        <div class="cmd-item-sub">${esc(record.detail)}</div>
      </div>
      <span class="cmd-item-badge">${esc(record.badge)}</span>
    </button>
  `).join("");
  hydrateIcons(resultBox);
}

function pagedCards(group, list, renderCards) {
  const pageSize = 6;
  const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
  const page = Math.min(resultPages[group] || 0, totalPages - 1);
  resultPages[group] = page;
  const cards = renderCards(list.slice(page * pageSize, (page + 1) * pageSize), page * pageSize);
  if (totalPages === 1) return cards;
  return `${cards}<nav class="result-pagination" aria-label="Pages des résultats">
    <button class="button subtle" type="button" data-result-group="${group}" data-result-page="${page - 1}" ${page === 0 ? "disabled" : ""}>Précédent</button>
    <span role="status">Page ${page + 1} sur ${totalPages} · ${list.length} résultats</span>
    <button class="button subtle" type="button" data-result-group="${group}" data-result-page="${page + 1}" ${page === totalPages - 1 ? "disabled" : ""}>Suivant</button>
  </nav>`;
}
function applyFilter(group, preservePage = false) {
  if (!preservePage) resultPages[group] = 0;
  if (group === "supportJobs") {
    const value = state.filters.supportJobs;
    const query = state.queries.supportJobs.trim().toLocaleLowerCase("fr");
    const filtered = SUPPORT_JOBS.filter(job => {
      const matchGroup = value === "Tout" || job.family === value;
      const matchQuery = !query || JSON.stringify(job).toLocaleLowerCase("fr").includes(query);
      return matchGroup && matchQuery;
    });
    const results = $("#support-job-results");
    if (results) results.innerHTML = pagedCards(group, filtered, supportJobCards);
    const countEl = $("#support-job-count");
    if (countEl) countEl.textContent = `${filtered.length} métier${filtered.length === 1 ? "" : "s"}`;
    hydrateIcons(stage);
    return;
  }

  if (group === "establishments") {
    const query = state.queries.establishments.toLocaleLowerCase("fr");
    const list = ESTABLISHMENTS.filter(item => (state.filters.establishments === "Tout" || item.family === state.filters.establishments) && JSON.stringify(item).toLocaleLowerCase("fr").includes(query));
    $("#establishment-results").innerHTML = pagedCards(group, list, establishmentCards);
    $("#establishment-count").textContent = `${list.length} fiche${list.length === 1 ? "" : "s"}`;
  } else if (group === "jobs") {
    const query = state.queries.jobs.toLocaleLowerCase("fr");
    const source = isPremiumUnlocked() ? JOBS : JOBS.filter(item => item.isPremium !== true);
    const list = source.filter(item => (state.filters.jobs === "Tout" || item.sector === state.filters.jobs) && JSON.stringify(item).toLocaleLowerCase("fr").includes(query));
    $("#job-results").innerHTML = pagedCards(group, list, jobCards);
  } else if (group === "meetings") {
    const query = state.queries.meetings.toLocaleLowerCase("fr");
    const list = MEETINGS.filter(item => (state.filters.meetings === "Tout" || item.kind === state.filters.meetings) && JSON.stringify(item).toLocaleLowerCase("fr").includes(query));
    $("#meeting-results").innerHTML = pagedCards(group, list, meetingCards);
  } else if (group === "documents") {
    const query = state.queries.documents.toLocaleLowerCase("fr");
    const list = DOCUMENTS.filter(item => (state.filters.documents === "Tout" || item.category === state.filters.documents) && JSON.stringify(item).toLocaleLowerCase("fr").includes(query));
    $("#document-results").innerHTML = pagedCards(group, list, documentCards);
  } else if (group === "actors") {
    const query = state.queries.actors.toLocaleLowerCase("fr");
    const list = ACTORS.filter(item => (state.filters.actors === "Tout" || item.type === state.filters.actors) && JSON.stringify(item).toLocaleLowerCase("fr").includes(query));
    $("#actor-results").innerHTML = pagedCards(group, list, actorCards);
  } else if (group === "faq") {
    const query = state.queries.faq.toLocaleLowerCase("fr");
    const list = FAQ.filter(item => JSON.stringify(item).toLocaleLowerCase("fr").includes(query));
    $("#faq-results").innerHTML = pagedCards(group, list, renderFaqList);
  } else if (group === "laws") {
    $("#law-results").innerHTML = pagedCards(group, HEALTH_POLICY.nationalLaws, lawCards);
  } else if (group === "software") {
    const query = state.queries.software.toLocaleLowerCase("fr");
    const list = SOFTWARES.filter(item => JSON.stringify(item).toLocaleLowerCase("fr").includes(query));
    $("#software-results").innerHTML = pagedCards(group, list, softwareCards);
    const count=$("#software-count"); if(count) count.textContent=`${list.length} famille${list.length===1?"":"s"}`;
  }
  hydrateIcons(stage);
}
function toggleFavorite(id) {
  state.favorites = state.favorites.includes(id) ? state.favorites.filter(value => value !== id) : [...state.favorites, id];
  writeJSON(STORE.favorites, state.favorites);
  const button = $(`.favorite-button[data-id="${CSS.escape(id)}"]`);
  if (button) {
    const saved = state.favorites.includes(id);
    button.classList.toggle("is-saved",saved);
    button.setAttribute("aria-pressed",String(saved));
    button.setAttribute("aria-label",`${saved ? "Retirer des" : "Ajouter aux"} favoris`);
  }
  if (state.page === "accueil") renderPage("accueil");
  showToast(state.favorites.includes(id) ? "Fiche ajoutée aux favoris." : "Fiche retirée des favoris.");
}
const peerMultiSelect = {
  selected: new Set(),
  isOpen: false,
  init() {
    const wrap = $("#peer-exp-multiselect");
    if (!wrap) return;
    this.selected.clear();
    this.render();
  },
  toggleOption(value) {
    if (!value) return;
    if (this.selected.has(value)) {
      this.selected.delete(value);
    } else {
      this.selected.add(value);
    }
    this.render();
  },
  remove(value) {
    this.selected.delete(value);
    this.render();
  },
  open() {
    const dropdown = $("#peer-exp-dropdown");
    const wrap = $("#peer-exp-multiselect");
    if (!dropdown || !wrap) return;
    this.isOpen = true;
    dropdown.hidden = false;
    wrap.classList.add("is-open");
    $("#peer-exp-trigger")?.setAttribute("aria-expanded", "true");
    $("#peer-exp-search")?.focus();
  },
  close() {
    const dropdown = $("#peer-exp-dropdown");
    const wrap = $("#peer-exp-multiselect");
    if (!dropdown || !wrap) return;
    this.isOpen = false;
    dropdown.hidden = true;
    wrap.classList.remove("is-open");
    $("#peer-exp-trigger")?.setAttribute("aria-expanded", "false");
    const search = $("#peer-exp-search");
    if (search) { search.value = ""; this.filterOptions(""); }
  },
  filterOptions(query) {
    const q = query.toLowerCase().trim();
    $$(".multiselect-option", $("#peer-exp-options")).forEach(opt => {
      const text = (opt.dataset.value || "").toLowerCase();
      opt.style.display = text.includes(q) ? "flex" : "none";
    });
  },
  render() {
    const tagsBox = $("#peer-exp-tags");
    const countBox = $("#peer-exp-count");
    const hiddenInput = $("#peer-experience-input");
    if (!tagsBox || !hiddenInput) return;
    const arr = Array.from(this.selected);
    hiddenInput.value = arr.join(", ");
    if (arr.length === 0) {
      tagsBox.innerHTML = `<span class="multiselect-placeholder">Choisir 1 ou plusieurs domaines…</span>`;
      if (countBox) countBox.textContent = "0 domaine sélectionné";
    } else {
      tagsBox.innerHTML = arr.map(exp => `
        <span class="multiselect-chip">
          <span>${esc(exp)}</span>
          <button type="button" class="multiselect-chip-remove" data-remove-exp="${esc(exp)}" aria-label="Supprimer ${esc(exp)}">×</button>
        </span>
      `).join("");
      if (countBox) countBox.textContent = `${arr.length} domaine${arr.length > 1 ? "s" : ""} sélectionné${arr.length > 1 ? "s" : ""}`;
    }
    const optBox = $("#peer-exp-options");
    if (optBox) {
      $$(".multiselect-option", optBox).forEach(opt => {
        const val = opt.dataset.value;
        const isSelected = this.selected.has(val);
        opt.classList.toggle("is-selected", isSelected);
        opt.setAttribute("aria-selected", isSelected ? "true" : "false");
      });
    }
  }
};

function renderPeerList() {
  const box = $("#peer-list");
  if (!box) return;
  const query = ($("#peer-query")?.value || state.queries.peers).toLocaleLowerCase("fr");
  const experience = $("#peer-experience-filter")?.value || "Tout";
  const region = $("#peer-region-filter")?.value || "Tout";
  const list = state.peers.filter(peer => {
    const peerExps = Array.isArray(peer.experiences) && peer.experiences.length
      ? peer.experiences
      : (peer.experience ? peer.experience.split(",").map(s => s.trim()) : []);
    const matchExp = experience === "Tout" || peerExps.some(e => e.toLowerCase() === experience.toLowerCase()) || (peer.experience && peer.experience.toLowerCase().includes(experience.toLowerCase()));
    const matchRegion = region === "Tout" || peer.region === region;
    const matchQuery = JSON.stringify(peer).toLocaleLowerCase("fr").includes(query);
    return matchExp && matchRegion && matchQuery;
  });
  const count = $("#peer-count");
  if (count) count.textContent = `${list.length} fiche${list.length === 1 ? "" : "s"} visible${list.length === 1 ? "" : "s"} · ${state.peers.length} dans le réseau`;
  const isUnlocked = isPremiumUnlocked();
  const visibleList = isUnlocked ? list : list.slice(0, 3);
  const paywallNotice = !isUnlocked && list.length > 3
    ? paywallGate("Annuaire Complet des Pairs (45% Campus)", "Débloquez l'accès à l'ensemble du réseau des alumni, aux coordonnées directes et aux filtres avancés par région.")
    : "";
  box.innerHTML = visibleList.length ? visibleList.map(peer => {
    const expList = Array.isArray(peer.experiences) && peer.experiences.length
      ? peer.experiences
      : (peer.experience ? peer.experience.split(",").map(s => s.trim()).filter(Boolean) : []);
    const initials = (peer.name || "Alumni").trim().split(/\s+/).filter(Boolean).slice(0, 2).map(part => (part[0] || "").toUpperCase()).join("") || "AL";
    return `<article class="peer-card" id="peer-card-${esc(peer.id)}">
      <div class="peer-avatar" aria-hidden="true">${esc(initials)}</div>
      <div class="peer-card-body">
        <div class="peer-card-header">
          <div>
            <h3 class="peer-card-title">${esc(peer.name)} <span class="peer-verified-badge">Alumni vérifié</span></h3>
            <p class="peer-card-sub">${esc(peer.role)} · ${esc(peer.sector)} · ${esc(peer.region)}</p>
          </div>
          ${peer.linkedin ? `<a class="linkedin-btn" href="${esc(peer.linkedin)}" target="_blank" rel="noopener noreferrer">${icon("linkedin", 13)}<span>LinkedIn</span></a>` : ''}
        </div>
        <div class="peer-card-meta">
          ${expList.map(exp => `<span class="tag mint">${esc(exp)}</span>`).join("")}
        </div>
        ${peer.summary ? `<p class="peer-card-summary">${esc(peer.summary)}</p>` : ''}
        <div class="peer-card-actions">
          <a class="peer-contact-pill" href="mailto:${esc(peer.email)}">${icon("mail", 13)}<span>${esc(peer.email)}</span></a>
          <div style="display:flex;gap:8px;align-items:center">
            <button class="button tiny subtle" data-action="edit-peer" data-id="${esc(peer.id)}">${icon("edit", 13)} Modifier</button>
            <button class="peer-delete" data-action="delete-peer" data-id="${esc(peer.id)}" aria-label="Supprimer la fiche de ${esc(peer.name)}">${icon("trash",14)}</button>
          </div>
        </div>
      </div>
    </article>`;
  }).join("") + paywallNotice : `<div class="peer-empty-state"><div class="peer-empty-icon">${icon("search", 24)}</div><h3 style="margin:0 0 6px;font-size:16px">${state.peers.length ? "Aucun profil ne correspond à vos critères" : "Votre réseau alumni commence ici"}</h3><p style="margin:0 0 16px;font-size:12.5px;color:var(--text-soft);max-width:440px;margin-inline:auto">${state.peers.length ? "Essayez d'élargir la recherche ou de réinitialiser les filtres région et compétences." : "Ajoutez votre fiche dès maintenant pour inaugurer l'annuaire de promotion et partager votre expérience."}</p>${state.peers.length ? `<button class="button subtle" data-action="reset-peer-filters">${icon("reset", 14)}Réinitialiser les filtres</button>` : `<button class="button primary" data-nav="inscription-annuaire">${icon("userplus", 14)}Ajouter ma fiche</button>`}</div>`;
  hydrateIcons(box);
}

function renderTimelinePosts() {
  const posts = state.posts || [];
  if (!posts.length) {
    return `<div class="empty-state">Aucune publication sur le fil pour l'instant. Soyez le premier à poster une offre ou un événement !</div>`;
  }
  return posts.map(renderTimelinePost).join("");
}

const PARTICIPATION_CHOICES = {
  personal: { label: "Je viens", short: "en personne", emoji: "🙋", unit: "participant" },
  staff: { label: "J'envoie un salarié", short: "salarié(s) délégué(s)", emoji: "👥", unit: "salarié" },
  apprentice: { label: "J'envoie un alternant", short: "alternant(s) délégué(s)", emoji: "🎓", unit: "alternant" },
  residents: { label: "J'envoie des résidents / patients", short: "résident(s) / patient(s)", emoji: "🏠", unit: "personne accompagnée" },
  other: { label: "Autre délégation", short: "autre(s) délégation(s)", emoji: "🤝", unit: "personne" },
  none: { label: "Simple commentaire", short: "", emoji: "💬", unit: "" }
};

function participationStats(post) {
  const stats = { personal: 0, staff: 0, apprentice: 0, residents: 0, other: 0 };
  const legacy = post.rsvp || {};
  stats.personal += Number(legacy.personal) || 0;
  stats.staff += Number(legacy.delegate_staff) || 0;
  stats.apprentice += Number(legacy.delegate_intern) || 0;
  (post.comments || []).forEach(comment => {
    if (stats[comment.participation] !== undefined) stats[comment.participation] += Math.max(1, Number(comment.count) || 1);
  });
  return stats;
}

function currentUserUid() {
  return window.mosaiqueAuthState?.user?.uid || "";
}

function canDeletePost(post) {
  const uid = currentUserUid();
  if (post.author?.uid) return Boolean(uid) && post.author.uid === uid;
  return !post.isRemote;
}

function renderTimelineComments(post) {
  const comments = post.comments || [];
  if (!comments.length) return "";
  const expanded = state.openComments.has(post.id);
  const visible = expanded ? comments : comments.slice(-2);
  const hidden = comments.length - visible.length;
  return `<div class="timeline-comments">
    ${hidden > 0 ? `<button type="button" class="timeline-comments-toggle" data-action="toggle-comments" data-post-id="${esc(post.id)}">Voir les ${comments.length} commentaires</button>` : (expanded && comments.length > 2 ? `<button type="button" class="timeline-comments-toggle" data-action="toggle-comments" data-post-id="${esc(post.id)}">Réduire</button>` : "")}
    ${visible.map(comment => {
      const choice = PARTICIPATION_CHOICES[comment.participation];
      const detail = comment.participation && comment.participation !== "none"
        ? `${Math.max(1, Number(comment.count) || 1)} · ${choice.label.replace(/^J'envoie /, "Envoi : ").replace(/^Je viens$/, "Présence")}${comment.detail ? ` (${esc(comment.detail)})` : ""}`
        : "";
      return `<div class="timeline-comment">
        <div class="timeline-comment-avatar" aria-hidden="true">${esc((comment.authorName || "MA").slice(0, 2).toUpperCase())}</div>
        <div class="timeline-comment-body">
          <div class="timeline-comment-head"><strong>${esc(comment.authorName || "Membre")}</strong><span>${esc(formatRelativeDate(comment.createdAt))}</span></div>
          ${detail && choice ? `<span class="tag mint timeline-comment-tag">${choice.emoji} ${detail}</span>` : ""}
          ${comment.text ? `<p>${esc(comment.text)}</p>` : ""}
        </div>
      </div>`;
    }).join("")}
  </div>`;
}

function formatRelativeDate(iso) {
  const time = Date.parse(iso || "");
  if (!time) return "À l'instant";
  const minutes = Math.floor((Date.now() - time) / 60000);
  if (minutes < 2) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return `Il y a ${days} jour${days > 1 ? "s" : ""}`;
}

function renderTimelinePost(post) {
    const isJob = post.type === "job_offer";
    const isEvent = post.type === "event";
    const stats = participationStats(post);
    const statChips = ["personal", "staff", "apprentice", "residents", "other"].filter(key => stats[key] > 0)
      .map(key => `<span class="timeline-rsvp-stat"><strong>${stats[key]}</strong> ${PARTICIPATION_CHOICES[key].short}</span>`).join("");

    return `
      <article class="timeline-post glass-panel" id="post-${esc(post.id)}">
        <div class="timeline-post-header">
          <div class="timeline-author-info">
            <div class="timeline-author-avatar">${esc(post.author.avatar || post.author.name.slice(0,2).toUpperCase())}</div>
            <div>
              <div style="display:flex;align-items:center;gap:8px">
                <strong style="color:var(--text);font-size:14px">${esc(post.author.name)}</strong>
                ${post.author.linkedin ? `<a class="linkedin-btn" href="${esc(post.author.linkedin)}" target="_blank" rel="noopener noreferrer" style="padding:2px 8px;font-size:10px">${icon("linkedin", 11)} <span>Profil</span></a>` : ''}
              </div>
              <p style="margin:2px 0 0;font-size:11.5px;color:var(--muted)">${esc(post.author.role)} · ${esc(post.date)}</p>
            </div>
          </div>
          <span class="tag ${isJob ? 'mint' : isEvent ? 'gold' : 'sky'}" style="font-size:11px">
            ${isJob ? icon("briefcase", 12) + " OFFRE D'EMPLOI / STAGE" : isEvent ? icon("calendar", 12) + " ÉVÉNEMENT ÉTABLISSEMENT" : icon("spark", 12) + " PARTAGE RÉSEAU"}
          </span>
        </div>

        <div>
          <h3 class="timeline-post-title">${esc(post.title)}</h3>
          <p style="font-size:13px;font-weight:600;color:var(--sky);margin:2px 0 8px">${esc(post.organization)}</p>
          <p style="font-size:13px;color:var(--text-soft);line-height:1.55;margin:0">${esc(post.content)}</p>
        </div>

        ${isEvent ? `
          <div class="timeline-event-box">
            <div class="timeline-event-row">
              ${icon("clock", 16)} <strong>Date & Horaires :</strong> <span>${esc(post.eventDate || "À préciser")}</span>
            </div>
            <div class="timeline-event-row">
              ${icon("map", 16)} <strong>Lieu / Accès :</strong> <span>${esc(post.location || "En présentiel & Visioconférence")}</span>
            </div>
            ${post.contact ? `<div class="timeline-event-row">${icon("message", 16)} <strong>Contact :</strong> <a class="inline-link" href="mailto:${esc(post.contact)}">${esc(post.contact)}</a></div>` : ''}
          </div>
        ` : ''}

        ${isJob ? `
          <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:10px 14px;border-radius:12px;background:var(--surface-soft);border:1px solid var(--stroke);font-size:12px">
            <span class="tag sky">${esc(post.contract || "CDI / Alternance")}</span>
            <span class="muted">${icon("map", 13)} ${esc(post.location || "France")}</span>
            ${post.contact ? `<a class="inline-link" href="mailto:${esc(post.contact)}" style="margin-left:auto">${icon("send", 12)} Postuler : ${esc(post.contact)}</a>` : ''}
          </div>
        ` : ''}

        ${statChips ? `<div class="timeline-rsvp-stats" aria-label="Participations annoncées">${statChips}</div>` : ""}
        ${renderTimelineComments(post)}

        <div class="timeline-post-footer">
          <div class="timeline-post-actions">
            <button type="button" class="button tiny subtle timeline-like${post.isLiked ? " is-liked" : ""}" data-action="like-post" data-post-id="${esc(post.id)}" aria-pressed="${post.isLiked ? "true" : "false"}">
              ${icon("heart", 14)} <span>${post.likes || 0}</span>
            </button>
            <button type="button" class="button tiny primary timeline-comment-btn" data-action="open-comment-dialog" data-post-id="${esc(post.id)}">
              ${icon("message", 14)} <span>${isEvent ? "Répondre / Commenter" : "Commenter"}</span>${post.comments?.length ? ` <small>(${post.comments.length})</small>` : ""}
            </button>
          </div>
          ${canDeletePost(post) ? `<button type="button" class="button tiny danger timeline-delete" data-action="delete-post" data-post-id="${esc(post.id)}" aria-label="Supprimer cette publication">${icon("trash", 13)} <span>Supprimer</span></button>` : `<span class="muted" style="font-size:11px">Visible par toute la promotion</span>`}
        </div>
      </article>
    `;
}

function findPost(postId) {
  return (state.posts || []).find(p => p.id === postId);
}

function refreshPost(postId) {
  const post = findPost(postId);
  const current = document.getElementById(`post-${postId}`);
  if (!current) return;
  if (!post) { current.remove(); return; }
  const template = document.createElement("template");
  template.innerHTML = renderTimelinePost(post).trim();
  const next = template.content.firstElementChild;
  current.replaceWith(next);
  hydrateIcons(next);
}

function refreshFeed() {
  const feed = $("#timeline-feed");
  if (!feed) return;
  feed.innerHTML = renderTimelinePosts();
  hydrateIcons(feed);
}

function openCommentDialog(postId) {
  const post = findPost(postId);
  if (!post) return;
  const isEvent = post.type === "event";
  const choices = ["none", "personal", "staff", "apprentice", "residents", "other"];
  const content = `<h2 class="dialog-title" id="dialog-title">Commenter &amp; indiquer votre participation</h2>
    <p class="dialog-lede">${esc(post.title)} · ${esc(post.organization)}</p>
    <form id="comment-form" class="comment-form" data-post-id="${esc(post.id)}" novalidate>
      <fieldset class="comment-choices">
        <legend class="field-label">${isEvent ? "Votre venue" : "Votre réponse"} *</legend>
        <div class="comment-choice-grid">
          ${choices.map((key, index) => `<label class="comment-choice"><input type="radio" name="participation" value="${key}"${index === 0 ? " checked" : ""}><span><b>${PARTICIPATION_CHOICES[key].emoji}</b>${key === "none" ? "Commentaire seul" : PARTICIPATION_CHOICES[key].label}</span></label>`).join("")}
        </div>
      </fieldset>
      <div class="comment-extra form-grid">
        <div><label class="field-label" for="comment-count">Nombre de personnes</label><input class="form-control" id="comment-count" name="count" type="number" min="1" max="99" value="1" inputmode="numeric"></div>
        <div class="comment-other-field"><label class="field-label" for="comment-detail">Précisez la délégation *</label><input class="form-control" id="comment-detail" name="detail" maxlength="80" placeholder="Ex. équipe éducative, bénévoles, famille…"></div>
      </div>
      <div><label class="field-label" for="comment-text">Votre message</label><textarea class="form-control" id="comment-text" name="text" rows="4" maxlength="500" placeholder="Ex. Nous serons représentés par notre cadre de santé et deux résidents…"></textarea><p class="field-hint">500 caractères maximum · pas de données de santé ni de données personnelles de tiers.</p></div>
      <p class="field-error" id="comment-error" role="alert" hidden></p>
      <div class="comment-actions">
        <button type="button" class="button subtle" data-action="close-dialog">Annuler</button>
        <button type="submit" class="button primary">${icon("send", 14)} Envoyer</button>
      </div>
    </form>`;
  openDialog("COMMENTAIRE & PARTICIPATION", content);
  setTimeout(() => $("#comment-text")?.focus(), 240);
}

function submitComment(form) {
  const post = findPost(form.dataset.postId);
  if (!post) { closeDialog(); return; }
  const fd = new FormData(form);
  const participation = String(fd.get("participation") || "none");
  const text = String(fd.get("text") || "").trim();
  const detail = String(fd.get("detail") || "").trim();
  const count = Math.min(99, Math.max(1, Math.round(Number(fd.get("count")) || 1)));
  const error = $("#comment-error");
  const fail = message => { if (error) { error.hidden = false; error.textContent = message; } };
  if (!PARTICIPATION_CHOICES[participation]) return fail("Choix de participation invalide.");
  if (participation === "none" && !text) return fail("Écrivez un message ou choisissez une participation.");
  if (participation === "other" && !detail) return fail("Précisez le type de délégation (ex. équipe éducative, bénévoles).");

  const profile = state.auth?.profile || {};
  const comment = {
    id: "c-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    authorName: (profile.name || profile.email || "Membre Alumni").slice(0, 80),
    authorUid: currentUserUid(),
    participation,
    count: participation === "none" ? 0 : count,
    detail: participation === "other" ? detail.slice(0, 80) : "",
    text: text.slice(0, 500),
    createdAt: new Date().toISOString()
  };
  post.comments = [...(post.comments || []), comment];
  post.commentsCount = post.comments.length;
  state.openComments.add(post.id);
  writeJSON(STORE.posts, state.posts);
  closeDialog();
  refreshPost(post.id);

  const summary = participation === "none" ? "Votre commentaire est publié." : `${PARTICIPATION_CHOICES[participation].label} : enregistré.`;
  dispatchNotification({
    id: `notif-comment-sent-${comment.id}`,
    title: "Réponse enregistrée",
    text: `${summary} (${post.title})`,
    icon: "check",
    targetNav: "timeline",
    targetPostId: post.id,
    targetUid: currentUserUid() || "all"
  }, { silentToast: true });

  const postAuthorUid = post.authorUid || post.author?.uid;
  if (postAuthorUid && postAuthorUid !== currentUserUid()) {
    const isRsvp = participation !== "none";
    dispatchNotification({
      id: `notif-comment-received-${comment.id}`,
      title: isRsvp ? "Nouvelle participation à votre événement" : "Nouveau commentaire sur votre publication",
      text: `${comment.authorName} : ${text ? `« ${text.slice(0, 65)} »` : (PARTICIPATION_CHOICES[participation]?.label || "A répondu")} (« ${post.title} »)`,
      icon: isRsvp ? "calendar" : "message",
      targetNav: "timeline",
      targetPostId: post.id,
      targetUid: postAuthorUid,
      authorUid: currentUserUid()
    }, { silentToast: true });
  }

  showToast(`✅ ${summary}`);

  if (post.isRemote && typeof window.addCommentToFirestore === "function") {
    window.addCommentToFirestore(post.id, comment).catch(err => console.warn("[Firestore] Commentaire non synchronisé :", err.message));
  }
}

function confirmDeletePost(postId) {
  const post = findPost(postId);
  if (!post) return;
  openDialog("SUPPRESSION", `<h2 class="dialog-title" id="dialog-title">Supprimer cette publication ?</h2>
    <p class="dialog-lede">« ${esc(post.title)} » et ses ${(post.comments || []).length} commentaire(s) seront définitivement supprimés pour toute la promotion. Cette action est irréversible.</p>
    <div class="comment-actions">
      <button type="button" class="button subtle" data-action="close-dialog">Annuler</button>
      <button type="button" class="button danger-solid" data-action="confirm-delete-post" data-post-id="${esc(post.id)}">${icon("trash", 14)} Supprimer définitivement</button>
    </div>`);
}

function deletePost(postId) {
  const post = findPost(postId);
  closeDialog();
  if (!post || !canDeletePost(post)) return;
  state.posts = state.posts.filter(p => p.id !== postId);
  delete state.rsvps[postId];
  writeJSON(STORE.posts, state.posts);
  writeJSON(STORE.rsvps, state.rsvps);
  const el = document.getElementById(`post-${postId}`);
  const finish = () => { refreshFeed(); showToast("Publication supprimée."); };
  if (el && typeof el.animate === "function" && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    el.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "scale(.97) translateY(-6px)" }], { duration: 285, easing: "ease-out", fill: "forwards" }).onfinish = finish;
  } else finish();
  if (post.isRemote && typeof window.deletePostFromFirestore === "function") {
    window.deletePostFromFirestore(postId).catch(() => showToast("Suppression locale effectuée ; la suppression distante a été refusée."));
  }
}

function handleLikePost(postId) {
  const post = findPost(postId);
  if (!post) return;
  post.isLiked = !post.isLiked;
  const delta = post.isLiked ? 1 : -1;
  post.likes = Math.max(0, (post.likes || 0) + delta);
  writeJSON(STORE.posts, state.posts);
  refreshPost(postId);
  if (post.isLiked) {
    const postAuthorUid = post.authorUid || post.author?.uid;
    if (postAuthorUid && postAuthorUid !== currentUserUid()) {
      const myName = state.auth?.profile?.name || "Un membre alumni";
      dispatchNotification({
        id: `notif-like-${post.id}-${post.likes}`,
        title: "Nouveau j'aime sur votre publication",
        text: `${myName} a aimé votre annonce « ${post.title} ».`,
        icon: "heart",
        targetNav: "timeline",
        targetPostId: post.id,
        targetUid: postAuthorUid,
        authorUid: currentUserUid()
      }, { silentToast: true });
    }
  }
  if (post.isRemote && typeof window.adjustPostLikes === "function") {
    window.adjustPostLikes(postId, delta).catch(err => console.warn("[Firestore] J'aime non synchronisé :", err.message));
  }
}

function editPeer(id) {
  if (!state.peers.some(p => p.id === id)) return;
  state.editingPeerId = id;
  renderPage("inscription-annuaire");
}

function fillPeerForm(peer) {
  const form = $("#peer-form");
  if (!form) return;
  
  const editIdInput = $("#peer-edit-id");
  if (editIdInput) editIdInput.value = peer.id;
  
  if ($("#peer-name")) $("#peer-name").value = peer.name || "";
  if ($("#peer-email")) $("#peer-email").value = peer.email || "";
  setCustomSelectValue("peer-region", peer.region || "");
  setCustomSelectValue("peer-place", peer.sector || "");
  setCustomSelectValue("peer-role", peer.role || "");
  if ($("#peer-linkedin")) $("#peer-linkedin").value = peer.linkedin || "";
  if ($("#peer-summary")) $("#peer-summary").value = peer.summary || "";
  
  const exps = Array.isArray(peer.experiences) && peer.experiences.length 
    ? peer.experiences 
    : (peer.experience ? peer.experience.split(",").map(s => s.trim()).filter(Boolean) : []);
  peerMultiSelect.selected = new Set(exps);
  peerMultiSelect.render();

  const submitBtn = $("#peer-submit-btn");
  if (submitBtn) submitBtn.innerHTML = `${icon("check", 15)} Mettre à jour ma fiche alumni`;
  const cancelBtn = $("#peer-cancel-edit-btn");
  if (cancelBtn) cancelBtn.hidden = false;
  const formTitle = $("#peer-form-title");
  if (formTitle) formTitle.textContent = `Modifier ma fiche (${peer.name})`;
  const eyebrow = $("#peer-form-eyebrow");
  if (eyebrow) eyebrow.textContent = "MODIFICATION EN COURS";
}

function highlightPeerCard() {
  const id = state.highlightPeerId;
  if (!id) return;
  state.highlightPeerId = null;
  requestAnimationFrame(() => {
    const card = document.getElementById(`peer-card-${id}`);
    if (!card) return;
    card.scrollIntoView({ behavior: "smooth", block: "center" });
    card.classList.add("is-highlighted");
    setTimeout(() => card.classList.remove("is-highlighted"), 3200);
  });
}

function cancelEditPeer() {
  state.editingPeerId = null;
  showToast("Mode modification annulé.");
  renderPage("reseau");
}

function getAccountNotifs() {
  const myUid = currentUserUid();
  const myEmail = (state.auth?.profile?.email || "").toLowerCase();
  return (state.notifs || []).filter(n => {
    if (n.targetUid && n.targetUid !== "all") {
      return Boolean(myUid && n.targetUid === myUid);
    }
    if (n.targetEmail) {
      return Boolean(myEmail && n.targetEmail.toLowerCase() === myEmail);
    }
    if (n.authorUid && myUid && n.authorUid === myUid && n.isBroadcast) {
      return false;
    }
    return true;
  });
}

function updateNotifBadge(animate = false) {
  const accountNotifs = getAccountNotifs();
  const unreadCount = accountNotifs.filter(n => n.unread).length;
  const badge = $("#notif-badge");
  if (badge) {
    const prevCount = Number(badge.textContent) || 0;
    badge.textContent = unreadCount > 99 ? "99+" : unreadCount;
    badge.hidden = unreadCount === 0;
    if (animate || (unreadCount > prevCount && unreadCount > 0)) {
      badge.classList.remove("has-bounce");
      void badge.offsetWidth;
      badge.classList.add("has-bounce");
    }
  }
}

function dispatchNotification(notifData, { silentToast = false, animate = true } = {}) {
  if (!notifData || !notifData.title) return;
  if (!Array.isArray(state.notifs)) state.notifs = [];
  
  const id = notifData.id || `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const existing = state.notifs.find(n => n.id === id);
  if (existing) return;

  const newNotif = {
    id,
    title: String(notifData.title || "").trim(),
    text: String(notifData.text || "").trim(),
    icon: notifData.icon || "bell",
    date: notifData.date || "À l'instant",
    timestamp: notifData.timestamp || Date.now(),
    unread: notifData.unread !== false,
    targetNav: notifData.targetNav || "",
    targetPostId: notifData.targetPostId || "",
    targetPeerId: notifData.targetPeerId || "",
    targetUid: notifData.targetUid || "all",
    targetEmail: notifData.targetEmail || "",
    authorUid: notifData.authorUid || "",
    isBroadcast: notifData.targetUid === "all" || !notifData.targetUid
  };

  state.notifs = [newNotif, ...state.notifs].slice(0, 60);
  writeJSON(STORE.notifs, state.notifs);
  updateNotifBadge(animate);

  if (state.notifsOpen) {
    renderNotifPopoverContent();
  }

  const myUid = currentUserUid();
  const concernsMe = (!newNotif.targetUid || newNotif.targetUid === "all" || newNotif.targetUid === myUid) &&
                     (!newNotif.authorUid || newNotif.authorUid !== myUid || !newNotif.isBroadcast);

  if (!silentToast && concernsMe) {
    showToast(`🔔 ${newNotif.title}`);
    try { navigator.vibrate?.(35); } catch (_) {}
  }
}

function renderNotifPopoverContent() {
  const popover = $("#notif-popover");
  if (!popover) return;
  const notifs = getAccountNotifs();
  const unreadCount = notifs.filter(n => n.unread).length;
  popover.innerHTML = `
    <div class="notif-header">
      <h3 style="display:flex;align-items:center;gap:6px">
        ${icon("bell", 16)} <span>Notifications</span>
        ${notifs.length ? `<span class="tag sky" style="font-size:10px;padding:2px 6px;border-radius:6px">${notifs.length}</span>` : ''}
      </h3>
      <div style="display:flex;align-items:center;gap:6px">
        ${unreadCount > 0 ? `<button class="button tiny subtle" data-action="mark-all-notifs-read" style="min-height:28px;padding:3px 8px;font-size:10.5px">Tout lire</button>` : `<span class="muted" style="font-size:11px">À jour</span>`}
        ${notifs.length > 0 ? `<button class="icon-button" data-action="clear-all-notifs" aria-label="Effacer les notifications" title="Effacer l'historique" style="min-width:28px;min-height:28px;border-radius:8px">${icon("trash", 13)}</button>` : ''}
        <button class="icon-button" data-action="toggle-notifications" aria-label="Fermer" style="min-width:28px;min-height:28px;border-radius:8px">${icon("close", 14)}</button>
      </div>
    </div>
    <div class="notif-list" style="display:flex;flex-direction:column;gap:8px;margin-top:10px">
      ${notifs.length ? notifs.map(n => `
        <div class="notif-item ${n.unread ? 'is-unread' : ''}" 
             role="button" 
             tabindex="0"
             data-action="open-notif" 
             data-notif-id="${esc(n.id)}"
             data-nav="${esc(n.targetNav || '')}"
             data-post-id="${esc(n.targetPostId || '')}"
             data-peer-id="${esc(n.targetPeerId || '')}">
          <span class="notif-bubble ${n.unread ? 'is-unread-bubble' : ''}">
            ${icon(n.icon || "bell", 15)}
          </span>
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:6px">
              <strong style="font-size:12px;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(n.title)}</strong>
              ${n.unread ? `<span class="notif-unread-dot" title="Non lu" aria-label="Non lu"></span>` : ''}
            </div>
            <p style="margin:3px 0 0;font-size:11.5px;color:var(--text-soft);line-height:1.4">${esc(n.text)}</p>
            <div style="display:flex;align-items:center;justify-content:space-between;margin-top:6px">
              <span class="notif-time">${esc(n.date || "À l'instant")}</span>
              ${n.targetNav ? `<span class="notif-action-hint">${n.targetNav === "timeline" ? "Voir la publication →" : n.targetNav === "reseau" ? "Voir la fiche →" : "Consulter →"}</span>` : ''}
            </div>
          </div>
        </div>
      `).join("") : `<div class="empty-state" style="padding:24px 12px;text-align:center"><span style="font-size:24px;display:block;margin-bottom:6px">🔔</span><strong>Aucune notification</strong>Toutes les annonces et arrivées de promotion apparaîtront ici.</div>`}
    </div>
  `;
  hydrateIcons(popover);
}

function toggleNotifications() {
  state.notifsOpen = !state.notifsOpen;
  const popover = $("#notif-popover");
  if (!popover) return;
  if (!state.notifsOpen) {
    popover.hidden = true;
    return;
  }
  popover.hidden = false;
  renderNotifPopoverContent();
}

function openNotification(notifId, { nav, postId, peerId } = {}) {
  const notif = (state.notifs || []).find(n => n.id === notifId);
  if (notif) {
    notif.unread = false;
    writeJSON(STORE.notifs, state.notifs);
    updateNotifBadge();
  }
  state.notifsOpen = false;
  const popover = $("#notif-popover");
  if (popover) popover.hidden = true;

  const targetNav = nav || notif?.targetNav;
  const targetPostId = postId || notif?.targetPostId;
  const targetPeerId = peerId || notif?.targetPeerId;

  if (targetNav) {
    renderPage(targetNav);
    if (targetNav === "timeline" && targetPostId) {
      state.openComments.add(targetPostId);
      setTimeout(() => {
        const postEl = document.getElementById(`post-${targetPostId}`);
        if (postEl) {
          postEl.scrollIntoView({ behavior: "smooth", block: "center" });
          postEl.classList.add("is-highlighted");
          setTimeout(() => postEl.classList.remove("is-highlighted"), 3000);
        }
      }, 350);
    } else if (targetNav === "reseau" && targetPeerId) {
      state.highlightPeerId = targetPeerId;
      setTimeout(() => {
        const peerEl = document.getElementById(`peer-${targetPeerId}`);
        if (peerEl) {
          peerEl.scrollIntoView({ behavior: "smooth", block: "center" });
          peerEl.classList.add("is-highlighted");
          setTimeout(() => peerEl.classList.remove("is-highlighted"), 3000);
        }
      }, 350);
    }
  }
}

function markAllNotifsRead() {
  const myNotifs = getAccountNotifs();
  myNotifs.forEach(n => { n.unread = false; });
  writeJSON(STORE.notifs, state.notifs);
  updateNotifBadge();
  renderNotifPopoverContent();
  showToast("Toutes les notifications sont marquées comme lues.");
}

function clearAllNotifs() {
  const myUid = currentUserUid();
  state.notifs = (state.notifs || []).filter(n => {
    if (n.targetUid && n.targetUid === myUid) return false;
    if (!n.targetUid || n.targetUid === "all") return false;
    return true;
  });
  writeJSON(STORE.notifs, state.notifs);
  updateNotifBadge();
  renderNotifPopoverContent();
  showToast("Historique des notifications effacé.");
}

const STARTER_NOTIFS_SEEDED_KEY = "mosaique-starter-notifs-seeded";
function ensureStarterNotifications() {
  if (readStoredValue(STARTER_NOTIFS_SEEDED_KEY) === "1") return;
  if (!Array.isArray(state.notifs) || state.notifs.length === 0) {
    const starter = [
      {
        id: "notif-seed-welcome",
        title: "Bienvenue sur le Campus Mosaïque",
        text: "Accédez aux repères de direction, fiches sanitaires et médico-sociales.",
        icon: "spark",
        date: "Aujourd'hui",
        timestamp: Date.now() - 3600000,
        unread: true,
        targetNav: "accueil",
        targetUid: "all",
        isBroadcast: true
      },
      {
        id: "notif-seed-timeline",
        title: "Fil d'actualité en direct",
        text: "Publiez vos annonces, recrutements et événements pour la promotion.",
        icon: "briefcase",
        date: "Aujourd'hui",
        timestamp: Date.now() - 1800000,
        unread: true,
        targetNav: "timeline",
        targetUid: "all",
        isBroadcast: true
      },
      {
        id: "notif-seed-network",
        title: "Annuaire des pairs & Alumni",
        text: "Retrouvez les directeurs, cadres et collègues diplômés du secteur.",
        icon: "users",
        date: "Aujourd'hui",
        timestamp: Date.now() - 900000,
        unread: true,
        targetNav: "reseau",
        targetUid: "all",
        isBroadcast: true
      }
    ];
    state.notifs = starter;
    writeJSON(STORE.notifs, state.notifs);
  }
  writeStoredValue(STARTER_NOTIFS_SEEDED_KEY, "1");
}

async function addPeer(form) {
  const formData = new FormData(form);
  const error = $("#peer-form-error");
  const required = ["name","email","region","sector","role","experience","summary"];
  const missing = required.find(name => !String(formData.get(name) || "").trim());
  if (missing || !formData.get("consent")) {
    const msg = !formData.get("consent") ? "Le consentement est requis pour enregistrer la fiche." : "Complétez les champs obligatoires (dont au moins un domaine d'expérience) avant de continuer.";
    if (error) { error.hidden = false; error.textContent = msg; error.scrollIntoView({ behavior: "smooth", block: "nearest" }); }
    showToast("⚠️ " + msg);
    form.elements[missing || "consent"]?.focus();
    return;
  }
  const email = String(formData.get("email")).trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    const msg = "Saisissez une adresse courriel valide.";
    if (error) { error.hidden = false; error.textContent = msg; }
    showToast("⚠️ " + msg);
    form.elements.email.focus();
    return;
  }
  const expArray = Array.from(peerMultiSelect.selected);
  if (!expArray.length) {
    const msg = "Sélectionnez au moins un domaine d'expérience à partager.";
    if (error) { error.hidden = false; error.textContent = msg; }
    showToast("⚠️ " + msg);
    $("#peer-exp-trigger")?.focus();
    return;
  }
  const editId = $("#peer-edit-id")?.value;
  const isEditing = Boolean(editId);
  const linkedin = String(formData.get("linkedin") || "").trim();

  let peer;
  if (isEditing) {
    const existingIndex = state.peers.findIndex(p => p.id === editId);
    if (existingIndex !== -1) {
      peer = {
        ...state.peers[existingIndex],
        name: String(formData.get("name")).trim(),
        email,
        region: String(formData.get("region")),
        sector: String(formData.get("sector")),
        role: String(formData.get("role")),
        linkedin,
        experience: expArray.join(", "),
        experiences: expArray,
        summary: String(formData.get("summary")).trim(),
        updatedAt: new Date().toISOString()
      };
      state.peers[existingIndex] = peer;
    }
  } else {
    peer = {
      id: crypto.randomUUID?.() || `peer-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
      name: String(formData.get("name")).trim(),
      email,
      region: String(formData.get("region")),
      sector: String(formData.get("sector")),
      role: String(formData.get("role")),
      linkedin,
      experience: expArray.join(", "),
      experiences: expArray,
      summary: String(formData.get("summary")).trim(),
      consent: true,
      createdAt: new Date().toISOString()
    };
    {
      const button = $("#peer-submit-btn");
      const skip = $("[data-action='skip-onboarding']");
      if (typeof window.saveAlumniToFirestore !== "function") {
        showToast("Synchronisation indisponible. Réessayez ou passez cette étape.");
        return;
      }
      button.disabled = true;
      if (skip) skip.disabled = true;
      try {
        peer.id = await window.saveAlumniToFirestore(peer);
        peer.isRemote = true;
      } catch (err) {
        console.warn("[Firestore] Inscription au réseau impossible :", err);
        if (error) { error.hidden = false; error.textContent = "La fiche n’a pas pu être publiée. Réessayez ou passez cette étape."; }
        showToast("La fiche n’a pas pu être publiée.");
        return;
      } finally {
        button.disabled = false;
        if (skip) skip.disabled = false;
      }
    }
    state.peers = [peer, ...state.peers];
  }

  writeJSON(STORE.peers, state.peers);
  if (state.onboarding) {
    dispatchNotification({
      id: `notif-welcome-${peer.id}`,
      title: "Bienvenue dans l'annuaire Alumni",
      text: `Votre fiche alumni (${peer.name}) est désormais active et partagée avec la promotion.`,
      icon: "check",
      targetNav: "reseau",
      targetPeerId: peer.id,
      targetUid: currentUserUid() || "all"
    }, { silentToast: true });
    finishOnboarding();
    showToast("Votre fiche a été publiée dans le réseau.");
    return;
  }
  if (!isEditing) {
    dispatchNotification({
      id: `notif-welcome-${peer.id}`,
      title: "Bienvenue dans l'annuaire Alumni",
      text: `Votre fiche alumni (${peer.name}) est désormais active et partagée avec la promotion.`,
      icon: "check",
      targetNav: "reseau",
      targetPeerId: peer.id,
      targetUid: currentUserUid() || "all"
    }, { silentToast: true });
    state.queries.peers = "";
    state.highlightPeerId = peer.id;
    peerMultiSelect.selected.clear();
    renderPage("reseau");
    showToast("Votre fiche a été publiée dans le réseau.");
    return;
  }
  state.editingPeerId = null;
  state.queries.peers = "";
  state.highlightPeerId = peer?.id;
  peerMultiSelect.selected.clear();
  renderPage("reseau");
  if (typeof window.saveAlumniToFirestore === "function") {
    window.saveAlumniToFirestore(peer)
      .then(() => showToast("🎉 Fiche enregistrée et synchronisée avec la promo !"))
      .catch(err => {
        console.warn("[Firestore] Synchronisation distante différée :", err.message);
        showToast("🎉 Fiche alumni enregistrée et ajoutée à l'annuaire !");
      });
  } else {
    showToast("🎉 Fiche alumni enregistrée et ajoutée à l'annuaire !");
  }
}
function exportPeers() {
  if (!isPremiumUnlocked()) {
    showToast("🔒 L'exportation de l'annuaire est réservée aux abonnés Campus.");
    renderPage("abonnement");
    return;
  }
  if (!state.peers.length) { showToast("Aucune fiche locale à exporter."); return; }
  const blob = new Blob([JSON.stringify(state.peers,null,2)],{type:"application/json"});
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a"); link.href = url; link.download = "annuaire-mosaique-sante.json"; link.click(); URL.revokeObjectURL(url);
  showToast("Export JSON téléchargé.");
}
function downloadFlashcardsPdf() {
  const api = window.MOSAQUE_FLASHCARDS;
  if (!api) {
    showToast("Flashcards indisponibles. Rechargez la page.");
    return;
  }
  api.exportPdf({ deckId: state.flashDeck })
    .catch(() => showToast("L’export PDF a été interrompu. Réessayez."));
}
function renderFlashcards() {
  const api = window.MOSAQUE_FLASHCARDS;
  if (!api) {
    return `<section class="page"><div class="empty-state"><strong>Flashcards indisponibles</strong>Rechargez la page pour charger le module de révision.</div></section>`;
  }
  return api.renderPage({
    deckId: state.flashDeck,
    query: state.queries.flashcards,
    studyMode: state.flashStudyMode,
    revealed: state.flashRevealed
  });
}
function syncMicroAdVisibility() {
  const ad = $("#micro-ad");
  if (!ad) return;
  ad.hidden = isPremiumUnlocked();
}
function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add("is-visible");
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => toastEl.classList.remove("is-visible"),2600);
}
function closeMenu() {
  const shouldRestoreFocus = mobileMenuQuery.matches;
  sidebar.classList.remove("is-open");
  sidebar.removeAttribute("role");
  sidebar.removeAttribute("aria-modal");
  sidebar.inert = mobileMenuQuery.matches;
  document.body.classList.remove("menu-open");
  const backdrop = $(".sidebar-backdrop");
  if (backdrop) {
    backdrop.style.pointerEvents = "none";
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || typeof backdrop.animate !== "function") backdrop.remove();
    else {
      const exit = backdrop.animate([{ opacity:1 }, { opacity:0 }], { duration:245, easing:"ease-in", fill:"forwards" });
      exit.onfinish = () => backdrop.remove();
    }
  }
  const toggle = $(".menu-toggle");
  toggle?.setAttribute("aria-expanded","false");
  if (shouldRestoreFocus) toggle?.focus({ preventScroll:true });
}
function toggleMenu() {
  if (sidebar.classList.contains("is-open")) { closeMenu(); return; }
  $(".sidebar-backdrop")?.remove();
  document.body.classList.add("menu-open");
  sidebar.classList.add("is-open");
  sidebar.inert = false;
  sidebar.setAttribute("role", "dialog");
  sidebar.setAttribute("aria-modal", "true");
  $(".menu-toggle")?.setAttribute("aria-expanded","true");
  const backdrop = document.createElement("button"); backdrop.className="sidebar-backdrop"; backdrop.type="button"; backdrop.setAttribute("aria-label","Fermer le menu"); backdrop.addEventListener("click",closeMenu); document.body.append(backdrop);
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches && backdrop.animate) backdrop.animate([{ opacity:0 }, { opacity:1 }], { duration:285, easing:"ease-out" });
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (sidebar.classList.contains("is-open")) $(".sidebar-close", sidebar)?.focus({ preventScroll:true });
  }));
}
sidebar.inert = mobileMenuQuery.matches;
mobileMenuQuery.addEventListener("change", () => {
  if (!mobileMenuQuery.matches && sidebar.classList.contains("is-open")) closeMenu();
  sidebar.inert = mobileMenuQuery.matches && !sidebar.classList.contains("is-open");
});
function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
function rotateMapPoint(point, rotation = state.mapRotation) {
  const rx=rotation.x*Math.PI/180, ry=rotation.y*Math.PI/180, rz=rotation.z*Math.PI/180;
  const cx=Math.cos(rx), sx=Math.sin(rx), cy=Math.cos(ry), sy=Math.sin(ry), cz=Math.cos(rz), sz=Math.sin(rz);
  const y1=point.y*cx-point.z*sx, z1=point.y*sx+point.z*cx;
  const x2=point.x*cy+z1*sy, z2=-point.x*sy+z1*cy;
  return { x:x2*cz-y1*sz, y:x2*sz+y1*cz, z:z2 };
}
function inverseRotateMapPoint(point, rotation = state.mapRotation) {
  return rotateMapPoint(rotateMapPoint(rotateMapPoint(point,{x:0,y:0,z:-rotation.z}),{x:0,y:-rotation.y,z:0}),{x:-rotation.x,y:0,z:0});
}
function projectMapPoint(point, width, height, time = 0, index = 0, drift = true) {
  const floating=drift && !mapRuntime?.reduced;
  const bob=floating ? Math.sin(time*.000853 + index*1.47)*4 : 0;
  const rotated=rotateMapPoint({x:point.x,y:point.y+bob,z:point.z+state.mapSceneDepth+(floating?Math.sin(time*.000711+index)*3:0)});
  const distance = Math.max(260,state.mapPerspective-rotated.z);
  const perspectiveScale = state.mapPerspective/distance;
  const zoom=state.mapZoom;
  return {
    x:width/2+state.mapPan.x+rotated.x*perspectiveScale*zoom,
    y:height/2+state.mapPan.y-rotated.y*perspectiveScale*zoom,
    z:rotated.z,
    scale:clamp(perspectiveScale*zoom,.8,1.5),
    perspectiveScale
  };
}
function resizeMapScene(scene) {
  if (!scene?.world || !scene.canvas) return;
  scene.width=scene.world.clientWidth;
  scene.height=scene.world.clientHeight;
  scene.dpr=Math.min(window.devicePixelRatio||1,1.6);
  scene.canvas.width=Math.round(scene.width*scene.dpr);
  scene.canvas.height=Math.round(scene.height*scene.dpr);
  scene.context.setTransform(scene.dpr,0,0,scene.dpr,0,0);
  if (state.mapZoomAuto) { state.mapZoom=fitMapZoom(scene); syncMapZoomControl(); }
  requestMapFrame();
}
function traceMapLine(context, from, to, color, alpha, width = 1) {
  context.globalAlpha=alpha;
  context.strokeStyle=color;
  context.lineWidth=width;
  context.beginPath(); context.moveTo(from.x,from.y); context.lineTo(to.x,to.y); context.stroke();
}
function drawMapScene(time = performance.now()) {
  const scene=mapRuntime;
  if (!scene?.context || !scene.visible || document.visibilityState === "hidden") return;
  const {context:ctx,width,height}=scene;
  if (!width || !height) return;
  ctx.setTransform(scene.dpr,0,0,scene.dpr,0,0);
  ctx.clearRect(0,0,width,height);
  const projected=new Map();
  MAP_NODES.forEach((node,index) => {
    const point=projectMapPoint(state.mapPositions[node.id],width,height,time,index);
    projected.set(node.id,point);
    const button=scene.nodes.get(node.id);
    if (button) {
      button.style.setProperty("--node-x",`${point.x.toFixed(2)}px`);
      button.style.setProperty("--node-y",`${point.y.toFixed(2)}px`);
      button.style.setProperty("--bubble-scale",point.scale.toFixed(3));
      const depthOrder=String(Math.round(point.z*3+1000));
      if(button.style.zIndex!==depthOrder) button.style.zIndex=depthOrder;
    }
  });
  scene.projected=projected;

  const gridY=-235;
  for (let x=-420;x<=420;x+=105) {
    const a=projectMapPoint({x,y:gridY,z:-280},width,height,time,0,false), b=projectMapPoint({x,y:gridY,z:280},width,height,time,0,false);
    traceMapLine(ctx,a,b,"rgba(134,182,199,.15)",.7,.8);
  }
  for (let z=-280;z<=280;z+=70) {
    const a=projectMapPoint({x:-420,y:gridY,z},width,height,time,0,false), b=projectMapPoint({x:420,y:gridY,z},width,height,time,0,false);
    traceMapLine(ctx,a,b,"rgba(134,182,199,.12)",.65,.8);
  }
  const origin=projectMapPoint({x:0,y:0,z:0},width,height,time,0,false);
  const axisX=projectMapPoint({x:185,y:0,z:0},width,height,time,0,false);
  const axisY=projectMapPoint({x:0,y:185,z:0},width,height,time,0,false);
  const axisZ=projectMapPoint({x:0,y:0,z:185},width,height,time,0,false);
  traceMapLine(ctx,origin,axisX,"#78dfc1",.45,1.4);
  traceMapLine(ctx,origin,axisY,"#c2b6ff",.42,1.4);
  traceMapLine(ctx,origin,axisZ,"#91cafa",.5,1.4);
  ctx.font="700 10px system-ui, sans-serif";
  ctx.fillStyle="rgba(170,238,219,.8)"; ctx.fillText("X",axisX.x+5,axisX.y);
  ctx.fillStyle="rgba(210,201,255,.8)"; ctx.fillText("Y",axisY.x+5,axisY.y);
  ctx.fillStyle="rgba(180,218,255,.85)"; ctx.fillText("Z",axisZ.x+5,axisZ.y);

  const selectedNeighbors=new Set(nodeRelated(state.selectedMapNode));
  MAP_EDGES.forEach(([from,to,label],index) => {
    const a=projected.get(from), b=projected.get(to);
    if (!a || !b) return;
    const related=state.selectedMapNode && (from===state.selectedMapNode || to===state.selectedMapNode || selectedNeighbors.has(from) && selectedNeighbors.has(to));
    const typeFrom=MAP_NODES.find(node=>node.id===from)?.type, typeTo=MAP_NODES.find(node=>node.id===to)?.type;
    const passesFilter=state.mapFilter==="Tout" || typeFrom===state.mapFilter || typeTo===state.mapFilter;
    const alpha=(!passesFilter || state.selectedMapNode && !related) ? .1 : related ? .86 : .42;
    const color=related ? "#83e8cc" : "#86a8bb";
    ctx.globalAlpha=alpha;
    ctx.strokeStyle=color;
    ctx.lineWidth=related?1.8:1.05;
    ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
    if (alpha>.2) {
      const angle=Math.atan2(b.y-a.y,b.x-a.x), arrowSize=5.5;
      ctx.fillStyle=color; ctx.beginPath(); ctx.moveTo(b.x,b.y);
      ctx.lineTo(b.x-arrowSize*Math.cos(angle-.48),b.y-arrowSize*Math.sin(angle-.48));
      ctx.lineTo(b.x-arrowSize*Math.cos(angle+.48),b.y-arrowSize*Math.sin(angle+.48)); ctx.closePath(); ctx.fill();
      const progress=(time*.00016+index*.291)%1;
      const px=a.x+(b.x-a.x)*progress, py=a.y+(b.y-a.y)*progress;
      ctx.globalAlpha=related ? .95 : .58; ctx.fillStyle=related?"#c4ffe9":"#b8ddf4";
      ctx.beginPath(); ctx.arc(px,py,related?2.8:2.1,0,Math.PI*2); ctx.fill();
    }
    if (related && label && passesFilter) {
      const labelX=(a.x+b.x)/2, labelY=(a.y+b.y)/2+(index%2?14:-13);
      ctx.font="650 10px system-ui, sans-serif";
      const labelWidth=ctx.measureText(label).width+12;
      ctx.globalAlpha=.92; ctx.fillStyle="rgba(7,17,29,.9)";
      ctx.fillRect(labelX-labelWidth/2,labelY-9,labelWidth,18);
      ctx.strokeStyle="rgba(165,223,223,.42)"; ctx.lineWidth=.8;
      ctx.strokeRect(labelX-labelWidth/2,labelY-9,labelWidth,18);
      ctx.fillStyle="#f0fbff"; ctx.textAlign="center"; ctx.textBaseline="middle";
      ctx.fillText(label,labelX,labelY,260);
      ctx.textAlign="start"; ctx.textBaseline="alphabetic";
    }
  });
  ctx.globalAlpha=1;
}
function requestMapFrame() {
  const scene=mapRuntime;
  if (!scene || scene.frame || !scene.visible || document.visibilityState === "hidden") return;
  scene.frame=requestAnimationFrame(time => {
    scene.frame=0;
    drawMapScene(time);
    if (!scene.reduced && scene.visible && document.visibilityState !== "hidden") requestMapFrame();
  });
}
function destroyMapScene() {
  const scene=mapRuntime;
  if (!scene) return;
  if (scene.frame) cancelAnimationFrame(scene.frame);
  scene.resizeObserver?.disconnect();
  scene.intersectionObserver?.disconnect();
  window.removeEventListener("resize",scene.onResize);
  document.removeEventListener("visibilitychange",scene.onVisibility);
  document.body.classList.remove("map-expanded");
  mapRuntime=null;
}
function startMapScene() {
  destroyMapScene();
  const world=$("#map-world"), canvas=$("#map-canvas");
  if (!world || !canvas) return;
  const context=canvas.getContext("2d");
  if (!context) return;
  const scene={world,canvas,context,nodes:new Map($$("[data-map-node]",world).map(node=>[node.dataset.mapNode,node])),projected:new Map(),width:0,height:0,dpr:1,frame:0,visible:true,reduced:matchMedia("(prefers-reduced-motion: reduce)").matches,drag:null};
  scene.onResize=()=>resizeMapScene(scene);
  scene.onVisibility=()=>{ if (document.visibilityState==="hidden") { if(scene.frame) cancelAnimationFrame(scene.frame); scene.frame=0; } else requestMapFrame(); };
  if ("ResizeObserver" in window) { scene.resizeObserver=new ResizeObserver(scene.onResize); scene.resizeObserver.observe(world); }
  else window.addEventListener("resize",scene.onResize,{passive:true});
  if ("IntersectionObserver" in window) {
    scene.intersectionObserver=new IntersectionObserver(entries=>{
      scene.visible=entries[0]?.isIntersecting ?? true;
      if(scene.visible) requestMapFrame(); else if(scene.frame) { cancelAnimationFrame(scene.frame); scene.frame=0; }
    },{threshold:.03});
    scene.intersectionObserver.observe(world);
  }
  document.addEventListener("visibilitychange",scene.onVisibility);
  mapRuntime=scene;
  resizeMapScene(scene);
  attach3DMap(scene);
}
function nodeRelated(nodeId) {
  return MAP_EDGES.filter(([from,to]) => from === nodeId || to === nodeId).map(([from,to]) => from === nodeId ? to : from);
}
function updateMapSelection() {
  const selected=state.selectedMapNode;
  const related=nodeRelated(selected);
  $$("[data-map-node]").forEach(button=>{
    const id=button.dataset.mapNode, isSelected=id===selected;
    const matchesFilter=state.mapFilter==="Tout" || MAP_NODES.find(node=>node.id===id)?.type===state.mapFilter;
    button.classList.toggle("is-selected",isSelected);
    button.classList.toggle("is-dimmed",!matchesFilter && !isSelected || !!selected && !isSelected && !related.includes(id));
    button.setAttribute("aria-pressed",String(isSelected));
  });
  const node=MAP_NODES.find(item=>item.id===selected), detail=mapDescriptions[selected], box=$("#map-details");
  if (node && detail && box) {
    const z=Math.round(state.mapPositions[selected]?.z || 0);
    box.innerHTML=`<div class="map-details-head"><div><span class="tag ${tagColor(node.type)}">${esc(detail.type)}</span><h3>${esc(detail.title)}</h3></div><button type="button" class="map-details-toggle" data-action="map-details-toggle" aria-expanded="${!box.classList.contains("is-collapsed")}" aria-label="Afficher ou masquer le détail">${icon("chevron-down",16)}</button></div><div class="map-details-body"><p>${esc(detail.copy)}</p><span class="meta-label">LIENS DIRECTS</span><div class="map-detail-related">${detail.related.map(item=>`<span>${esc(item)}</span>`).join("")}</div><label class="map-node-depth"><span>Profondeur de cette bulle <output id="map-node-depth-output">${z}</output></span><input id="map-node-depth" type="range" min="-260" max="260" value="${z}" aria-label="Déplacer ${esc(detail.title)} en profondeur sur l’axe Z"></label><div class="source-links">${sourceLinks(selected === "duerp" ? ["duerp"] : selected === "eprd" ? ["cnsaData"] : selected === "has" ? ["hasEsms","hasHealth"] : selected === "anap" ? ["anap"] : selected === "cnsa" ? ["cnsa"] : selected === "cvscse" ? ["cvs","cse"] : ["casfRights"])}</div></div>`;
    hydrateIcons(box);
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches && box.animate) box.animate([{opacity:.55,transform:"translate3d(0,5px,0)"},{opacity:1,transform:"translate3d(0,0,0)"}],{duration:302,easing:"cubic-bezier(.18,.72,.23,1)"});
  }
  requestMapFrame();
}
const MAP_ZOOM_MIN = .4, MAP_ZOOM_MAX = 3;
function fitMapZoom(scene = mapRuntime) {
  if (!scene?.width) return 1;
  return clamp(Math.min(scene.width / 1000, scene.height / 700), .5, 1.6);
}
function syncMapZoomControl() {
  const slider=$("#map-zoom"), output=$("#map-zoom-output");
  const percent=Math.round(state.mapZoom*100);
  if (slider) slider.value=String(percent);
  if (output) output.value=`${percent} %`;
}
function zoomMapAt(factor, focusX, focusY, scene = mapRuntime) {
  if (!scene) return;
  const next=clamp(state.mapZoom*factor,MAP_ZOOM_MIN,MAP_ZOOM_MAX), ratio=next/state.mapZoom;
  const dx=focusX-scene.width/2, dy=focusY-scene.height/2;
  state.mapPan={x:clamp(dx-(dx-state.mapPan.x)*ratio,-2400,2400),y:clamp(dy-(dy-state.mapPan.y)*ratio,-1800,1800)};
  state.mapZoom=next;
  state.mapZoomAuto=false;
  syncMapZoomControl();
  requestMapFrame();
}
function fitMapView() {
  const scene=mapRuntime;
  if (!scene) return;
  state.mapZoom=fitMapZoom(scene);
  state.mapZoomAuto=true;
  state.mapPan={x:0,y:0};
  syncMapZoomControl();
  requestMapFrame();
}
function setMapExpanded(expanded) {
  const frame=$("#map-frame");
  if (!frame) return;
  frame.classList.toggle("is-expanded",expanded);
  document.body.classList.toggle("map-expanded",expanded);
  const button=$("[data-action='map-expand']");
  button?.setAttribute("aria-pressed",String(expanded));
  button?.setAttribute("aria-label",expanded ? "Réduire la carte" : "Agrandir la carte");
  if (button) button.innerHTML=icon(expanded ? "close" : "zoomin",16);
  requestAnimationFrame(() => mapRuntime && resizeMapScene(mapRuntime));
}
function attach3DMap(scene) {
  const {world}=scene;
  const pointers=new Map();
  let drag=null, pinch=null, momentum=0, lastTap={time:0,x:0,y:0};
  const stopMomentum=()=>{ if (momentum) { cancelAnimationFrame(momentum); momentum=0; } };
  const pair=()=>{
    const [a,b]=[...pointers.values()];
    return { cx:(a.x+b.x)/2, cy:(a.y+b.y)/2, dist:Math.hypot(a.x-b.x,a.y-b.y)||1, angle:Math.atan2(b.y-a.y,b.x-a.x) };
  };
  const hideHint=()=>$("#map-hint")?.classList.add("is-hidden");
  const startSingle=(event,nodeButton)=>{
    if (nodeButton) {
      const id=nodeButton.dataset.mapNode;
      state.selectedMapNode=id;
      updateMapSelection();
      drag={kind:"node",id,startX:event.clientX,startY:event.clientY,position:{...state.mapPositions[id]},moved:false};
      nodeButton.setPointerCapture?.(event.pointerId);
    } else {
      drag={kind:state.mapGesture,startX:event.clientX,startY:event.clientY,rotation:{...state.mapRotation},pan:{...state.mapPan},moved:false,last:{x:event.clientX,y:event.clientY,t:event.timeStamp},vx:0,vy:0};
      world.setPointerCapture?.(event.pointerId);
    }
    scene.drag=drag;
  };
  world.addEventListener("pointerdown",event=>{
    if (event.pointerType==="mouse" && event.button!==0) return;
    stopMomentum();
    hideHint();
    pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
    world.classList.add("is-dragging");
    if (pointers.size===2) {
      drag=null; scene.drag=null;
      const t=pair();
      pinch={dist:t.dist,cx:t.cx,cy:t.cy,angle:t.angle,rotZ:state.mapRotation.z};
      world.setPointerCapture?.(event.pointerId);
      return;
    }
    if (pointers.size>2) return;
    startSingle(event,event.target.closest("[data-map-node]"));
  });
  world.addEventListener("pointermove",event=>{
    if (!pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
    if (pinch && pointers.size>=2) {
      const t=pair(), rect=world.getBoundingClientRect();
      zoomMapAt(t.dist/pinch.dist,t.cx-rect.left,t.cy-rect.top,scene);
      state.mapPan={x:clamp(state.mapPan.x+t.cx-pinch.cx,-2400,2400),y:clamp(state.mapPan.y+t.cy-pinch.cy,-1800,1800)};
      let twist=(t.angle-pinch.angle)*180/Math.PI;
      twist=((twist+180)%360+360)%360-180;
      const effective=Math.sign(twist)*Math.max(0,Math.abs(twist)-12);
      if (effective) { state.mapRotation.z=(((pinch.rotZ-effective)%360)+360)%360; syncMapAngles(); }
      pinch.dist=t.dist; pinch.cx=t.cx; pinch.cy=t.cy;
      requestMapFrame();
      return;
    }
    if (!drag) return;
    const dx=event.clientX-drag.startX, dy=event.clientY-drag.startY;
    if (Math.abs(dx)+Math.abs(dy)>3) drag.moved=true;
    if (drag.kind==="node") {
      const point=scene.projected.get(drag.id), scale=(point?.perspectiveScale || 1)*state.mapZoom;
      if (event.shiftKey || event.altKey) state.mapPositions[drag.id].z=clamp(drag.position.z-dy/scale,-260,260);
      else {
        const delta=inverseRotateMapPoint({x:dx/scale,y:-dy/scale,z:0});
        state.mapPositions[drag.id]={x:clamp(drag.position.x+delta.x,-420,420),y:clamp(drag.position.y+delta.y,-300,300),z:clamp(drag.position.z+delta.z,-260,260)};
      }
      if (drag.id===state.selectedMapNode) {
        const slider=$("#map-node-depth"), output=$("#map-node-depth-output");
        if(slider) slider.value=String(Math.round(state.mapPositions[drag.id].z));
        if(output) output.value=String(Math.round(state.mapPositions[drag.id].z));
      }
    } else {
      const elapsed=Math.max(1,event.timeStamp-drag.last.t);
      drag.vx=drag.vx*.6+((event.clientX-drag.last.x)/elapsed)*.4;
      drag.vy=drag.vy*.6+((event.clientY-drag.last.y)/elapsed)*.4;
      drag.last={x:event.clientX,y:event.clientY,t:event.timeStamp};
      if (drag.kind==="rotate") {
        state.mapRotation.y=((drag.rotation.y+dx*.48)%360+360)%360;
        state.mapRotation.x=((drag.rotation.x-dy*.48)%360+360)%360;
        syncMapAngles();
      } else {
        state.mapPan={x:clamp(drag.pan.x+dx,-2400,2400),y:clamp(drag.pan.y+dy,-1800,1800)};
      }
    }
    requestMapFrame();
  });
  const glide=(kind,vx,vy)=>{
    if (scene.reduced || Math.hypot(vx,vy)<.12) return;
    let last=performance.now();
    const step=now=>{
      const dt=Math.min(32,now-last); last=now;
      const decay=Math.pow(.94,dt/16);
      vx*=decay; vy*=decay;
      if (Math.hypot(vx,vy)<.02 || mapRuntime!==scene) { momentum=0; return; }
      if (kind==="rotate") {
        state.mapRotation.y=((state.mapRotation.y+vx*dt*.48)%360+360)%360;
        state.mapRotation.x=((state.mapRotation.x-vy*dt*.48)%360+360)%360;
        syncMapAngles();
      } else state.mapPan={x:clamp(state.mapPan.x+vx*dt,-2400,2400),y:clamp(state.mapPan.y+vy*dt,-1800,1800)};
      requestMapFrame();
      momentum=requestAnimationFrame(step);
    };
    momentum=requestAnimationFrame(step);
  };
  const finish=event=>{
    if (!pointers.has(event.pointerId)) return;
    pointers.delete(event.pointerId);
    if (pinch) {
      if (pointers.size<2) {
        pinch=null;
        const rest=[...pointers.values()][0];
        if (rest) { drag={kind:"pan",startX:rest.x,startY:rest.y,pan:{...state.mapPan},moved:true,last:{x:rest.x,y:rest.y,t:event.timeStamp},vx:0,vy:0}; scene.drag=drag; }
      }
      if (!pointers.size) world.classList.remove("is-dragging");
      return;
    }
    if (pointers.size) return;
    if (drag?.moved) mapClickSuppressionUntil=performance.now()+260;
    if (drag && drag.kind!=="node") {
      if (!drag.moved && event.type==="pointerup") {
        const now=performance.now();
        if (now-lastTap.time<320 && Math.hypot(event.clientX-lastTap.x,event.clientY-lastTap.y)<32) {
          const rect=world.getBoundingClientRect();
          if (state.mapZoom>1.35) fitMapView(); else zoomMapAt(2,event.clientX-rect.left,event.clientY-rect.top,scene);
          lastTap={time:0,x:0,y:0};
        } else lastTap={time:now,x:event.clientX,y:event.clientY};
      } else if (drag.moved && event.type==="pointerup" && event.timeStamp-drag.last.t<80) glide(drag.kind,drag.vx,drag.vy);
    }
    drag=null; scene.drag=null; world.classList.remove("is-dragging");
  };
  world.addEventListener("pointerup",finish);
  world.addEventListener("pointercancel",finish);
  world.addEventListener("lostpointercapture",finish);
  world.addEventListener("wheel",event=>{
    const nodeButton=event.target.closest("[data-map-node]");
    if (nodeButton && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      const selectionChanged=state.selectedMapNode!==nodeButton.dataset.mapNode;
      state.selectedMapNode=nodeButton.dataset.mapNode;
      state.mapPositions[state.selectedMapNode].z=clamp(state.mapPositions[state.selectedMapNode].z-event.deltaY*.34,-260,260);
      if(selectionChanged) updateMapSelection();
      const slider=$("#map-node-depth"), output=$("#map-node-depth-output");
      if(slider) slider.value=String(Math.round(state.mapPositions[state.selectedMapNode].z));
      if(output) output.value=String(Math.round(state.mapPositions[state.selectedMapNode].z));
      requestMapFrame();
      return;
    }
    // Pincement du pavé tactile (ctrl + molette) ou molette en mode agrandi : zoom ; sinon la page défile normalement.
    if (!event.ctrlKey && !event.metaKey && !$("#map-frame")?.classList.contains("is-expanded")) return;
    event.preventDefault();
    const rect=world.getBoundingClientRect();
    zoomMapAt(Math.exp(-event.deltaY*(event.ctrlKey ? .01 : .0016)),event.clientX-rect.left,event.clientY-rect.top,scene);
  },{passive:false});
}
function syncMapAngles() {
  for (const axis of ["x","y","z"]) {
    const control=$(`#map-rotate-${axis}`), output=$(`#map-angle-${axis}-output`);
    if(control) control.value=String(Math.round(state.mapRotation[axis]));
    if(output) output.value=`${Math.round(state.mapRotation[axis])}°`;
  }
}
function syncMapControls() {
  syncMapAngles();
  const gesture=$(".map-gesture-toggle"), rotating=state.mapGesture==="rotate";
  $("#map-viewport")?.classList.toggle("is-panning",!rotating);
  if(gesture) { gesture.setAttribute("aria-pressed",String(rotating)); gesture.innerHTML=`${icon(rotating?"rotate":"move",15)}${rotating?"Orbite":"Déplacer"}`; }
}
function beginMapAdjustment() {
  $("#map-world")?.classList.add("is-adjusting");
  window.clearTimeout(mapAdjustmentTimer);
  mapAdjustmentTimer=window.setTimeout(()=>$("#map-world")?.classList.remove("is-adjusting"),120);
}

function toggleAccordion(trigger) {
  const opening = trigger.getAttribute("aria-expanded") !== "true";
  trigger.setAttribute("aria-expanded",String(opening));
  const panel = $("#" + CSS.escape(trigger.getAttribute("aria-controls")));
  if (!panel) return;
  accordionAnimations.get(panel)?.cancel();
  if (opening) {
    panel.hidden = false;
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches && panel.animate) {
      const animation = panel.animate([{ opacity:0, transform:"translate3d(0,-4px,0)" }, { opacity:1, transform:"translate3d(0,0,0)" }], { duration:302, easing:"cubic-bezier(.18,.72,.23,1)" });
      accordionAnimations.set(panel,animation);
    }
    return;
  }
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || !panel.animate) { panel.hidden = true; return; }
  const animation = panel.animate([{ opacity:1, transform:"translate3d(0,0,0)" }, { opacity:0, transform:"translate3d(0,-3px,0)" }], { duration:230, easing:"ease-in" });
  accordionAnimations.set(panel,animation);
  animation.onfinish = () => { if (trigger.getAttribute("aria-expanded") !== "true") panel.hidden = true; };
}


/* --- MODULE AUDITS QUALITÉ & MÉTHODOLOGIE --- */
function auditTypologyCards() {
  const guide = AUDIT_GUIDE;
  return guide.typology.map((item, idx) => `<article class="content-card audit-card">
    <div class="card-top">
      <div class="card-title-line">
        <span class="icon-bubble">${icon("target", 17)}</span>
        <div>
          <h3>${esc(item.type)}</h3>
          <p><strong>Cible :</strong> ${esc(item.target)}</p>
        </div>
      </div>
    </div>
    <div class="meta-row">
      <span class="meta-label">Type 0${idx+1}</span>
      <span class="tag sky"><strong>Quand :</strong> ${esc(item.when)}</span>
    </div>
    <p class="card-copy">${esc(item.scope)}</p>
    <div class="detail-cell audit-questions">
      <strong>Questions clés investiguées :</strong>
      <p>${esc(item.keyQuestions)}</p>
    </div>
    <div class="card-foot">
      <span><strong>Acteurs :</strong> ${esc(item.actors)}</span>
    </div>
  </article>`).join("");
}

function renderAudit() {
  const guide = AUDIT_GUIDE;
  const isUnlocked = isPremiumUnlocked();
  return `<section class="page" aria-labelledby="audit-title">
    ${sectionHead("MÉTHODOLOGIE QUALITÉ · ÉVALUATION", "L'Audit Qualité, <span class=\"text-gradient\">mesurer pour progresser.</span>", "À quoi sert un audit, comment le mener en 5 étapes rigoureuses, qui est visé selon chaque situation (patient traceur, audit clinique, audit croisé, audit flash) et comment transformer les constats en plan d'actions durable sans braquer les équipes.", `<button class="button subtle" data-nav="qualite">${icon("shield",16)}Gestion des EI</button>`)}
    
    <div class="notice">${icon("info",18)}<span><strong>Définition & posture.</strong> ${esc(guide.definition)}</span></div>

    ${renderAccessStatusBar()}
    <div class="section-block" data-page-theme="Finalités">
      <div class="section-title-row">
        <div>
          <h2>À quoi sert un audit ? Les 5 finalités fondamentales</h2>
          <p>L'audit n'est pas une inspection policière : c'est un diagnostic partagé au service de la bientraitance et de la sécurité.</p>
        </div>
      </div>
      <div class="focus-row">
        ${guide.purpose.slice(0, 3).map((p, idx) => `<article class="focus-card glass-panel">
          <span class="eyebrow">FINALITÉ 0${idx+1}</span>
          <p style="margin-top:8px;font-weight:600;color:var(--text);font-size:13px">${esc(p)}</p>
        </article>`).join("")}
      </div>
      <div class="focus-row" style="margin-top:14px">
        ${guide.purpose.slice(3).map((p, idx) => `<article class="focus-card glass-panel">
          <span class="eyebrow">FINALITÉ 0${idx+4}</span>
          <p style="margin-top:8px;font-weight:600;color:var(--text);font-size:13px">${esc(p)}</p>
        </article>`).join("")}
      </div>
    </div>

    <div class="section-block" data-page-theme="Types d’audits">
      <div class="section-title-row">
        <div>
          <h2>Les 6 types d'audits : qui est visé selon quel cas ?</h2>
          <p>Du patient traceur HAS à l'audit flash de 15 minutes, choisir le bon outil d'évaluation.</p>
        </div>
      </div>
      <div class="audit-typology-grid">${auditTypologyCards()}</div>
    </div>

    ${isUnlocked ? `
    <div class="section-block" data-page-theme="Méthode">
      <div class="section-title-row">
        <div>
          <h2>Comment mener un audit en 5 étapes</h2>
          <p>La démarche méthodologique éprouvée pour garantir rigueur, objectivité et adhésion des professionnels.</p>
        </div>
      </div>
      <div class="result-grid">
        ${guide.steps.map(s => `<article class="content-card">
          <div class="card-top">
            <div class="card-title-line">
              <span class="icon-bubble">${icon("check",17)}</span>
              <div>
                <h3>${esc(s.title)}</h3>
              </div>
            </div>
          </div>
          <p class="card-copy" style="margin-top:6px">${esc(s.detail)}</p>
        </article>`).join("")}
      </div>
    </div>

    <div class="section-block" data-page-theme="Bonnes pratiques">
      <div class="section-title-row">
        <div>
          <h2>Les 4 facteurs clés de succès d'un audit réussi</h2>
          <p>Les repères managériaux indispensables pour le futur dirigeant.</p>
        </div>
      </div>
      <div class="documents-layout">
        <div class="glass-panel" style="padding:22px">
          <h3 style="margin-bottom:12px">Posture & bonnes pratiques de l'auditeur</h3>
          <ul class="bullet-list">
            ${guide.successFactors.map(f => `<li>${esc(f)}</li>`).join("")}
          </ul>
        </div>
        <aside class="doc-toolbox glass-panel">
          <span class="eyebrow">OUTILS PRATIQUES</span>
          <h3 style="margin-top:12px">Grilles & référentiels types</h3>
          <p style="font-size:12px;margin:8px 0;color:var(--text-2)">Disponibles en consultation :</p>
          <ul class="step-list">
            <li><strong>Grille Patient / Accompagné Traceur</strong><span>22 critères centrés sur l'usager</span></li>
            <li><strong>Grille Bionettoyage & Hygiène RABC</strong><span>Audit des locaux et du circuit linge</span></li>
            <li><strong>Grille Circuit du Médicament</strong><span>Prescription, dispensation, pilulier, administration</span></li>
            <li><strong>Grille Dossier Usager (DUI)</strong><span>Complétude des 7 outils loi 2002-2</span></li>
          </ul>
        </aside>
      </div>
    </div>

    ` : `<div data-page-theme="Méthode Premium">${paywallGate("Méthodologie d'Audit en 5 Étapes & Grilles Types HAS (45% Campus)", "Accédez au protocole d'évaluation en 5 étapes, aux 4 grilles d'audit types (patient traceur, bionettoyage, médicament, DUI) et aux facteurs clés de succès.", `
      <div class="section-block"><div class="result-grid">${guide.steps.slice(0,2).map(s => `<article class="content-card"><h3>${esc(s.title)}</h3><p>${esc(s.detail)}</p></article>`).join("")}</div></div>
    `)}</div>`}

    ${sourceLinks(["auditHas","hasEsms","anapAudit","cofrac"])}
  </section>`;
}

function renderSecu() {
  const secu = SECURITY_SOCIALE;
  const isUnlocked = isPremiumUnlocked();
  if (!isUnlocked) {
    return `<section class="page" aria-labelledby="secu-title">
      ${sectionHead("PROTECTION SOCIALE & FINANCEMENT", "La Sécurité Sociale, <span class=\"text-gradient\">réservée au Premium</span>", "Comprenez les branches, l’ONDAM, les financements, les mécanismes de tarification et la matrice « Qui paie quoi ».", ``)}
      ${paywallGate("Sécurité Sociale & financement Premium", "Accédez à l’intégralité de l’analyse de la Sécurité Sociale, aux matrices de financement, aux interactions directeur/caisses et aux impacts budgétaires.", `<div class="premium-preview-grid"><div><strong>5 branches</strong><span>Maladie, retraite, famille, AT/MP, autonomie</span></div><div><strong>ONDAM</strong><span>Plafonds et sous-objectifs</span></div><div><strong>Qui paie quoi</strong><span>Matrice des établissements</span></div></div>`)}
    </section>`;
  }

  return `<section class="page" aria-labelledby="secu-title">
    ${renderAccessStatusBar()}
    ${sectionHead("PROTECTION SOCIALE & FINANCEMENT DE LA SANTÉ", "La Sécurité Sociale, <span class=\"text-gradient\">moteur financier et régulateur.</span>", "Comprendre les ordonnances de 1945, l'architecture des 5 branches (dont la Branche Autonomie), l'enveloppe ONDAM, les modèles de tarification (T2A, forfaits soins, CPOM) et la matrice comparative 'Qui paie quoi' pour 9 catégories d'établissements.", `<button class="button subtle" data-nav="etablissements">${icon("building",16)}Établissements</button>`)}

    <!-- Principes Fondateurs 1945 -->
    <div class="secu-hero-card" data-page-theme="Fondations">
      <div style="display:flex;align-items:flex-start;gap:16px;flex-wrap:wrap">
        <span class="icon-bubble" style="background:rgba(135,199,247,0.18);color:var(--sky);flex:0 0 44px;width:44px;height:44px;border-radius:14px">${icon("shield", 22)}</span>
        <div style="flex:1;min-width:280px">
          <span class="eyebrow" style="color:var(--sky)">FONDATIONS DE 1945 · LAROQUE & CROIZAT</span>
          <h2 style="font-size:20px;font-weight:750;margin:6px 0 10px;color:var(--text)">${esc(secu.history.founders)}</h2>
          <blockquote style="font-style:italic;color:var(--text-soft);margin:0 0 16px;font-size:13.5px;line-height:1.6;border-left:3px solid var(--sky);padding-left:14px">« ${esc(secu.history.quote)} »</blockquote>
          <div class="secu-principles-grid">
            ${secu.history.principles.map(p => `
              <div class="secu-principle-item">
                <strong>${esc(p.title)}</strong>
                <span>${esc(p.desc)}</span>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    </div>

    <!-- Les 5 Branches -->
    <div class="section-block" data-page-theme="Les branches">
      <div class="section-title-row">
        <div>
          <h2>Les 5 Branches de la Sécurité Sociale & Leurs Liens avec le Manager</h2>
          <p>De la Maladie à la 5e Branche Autonomie (Loi 2020), les caisses de tutelle et financeurs de vos établissements.</p>
        </div>
      </div>
      <div class="secu-branch-grid">
        ${secu.branches.map(b => `
          <article class="secu-branch-card">
            <div class="secu-branch-header">
              <span class="icon-bubble" style="background:rgba(135,199,247,0.14);color:var(--${b.color || 'sky'});flex:0 0 38px;width:38px;height:38px;border-radius:12px">${icon(b.icon || "shield", 18)}</span>
              <div style="flex:1">
                <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px">
                  <span class="eyebrow">${esc(b.budget)}</span>
                  <span class="tag sky" style="font-size:10px">${esc(b.pilot)}</span>
                </div>
                <h3 class="secu-branch-title">${esc(b.name)}</h3>
              </div>
            </div>
            <p class="secu-branch-scope">${esc(b.scope)}</p>
            <div class="secu-callout esms">
              <strong>🏥 Lien Établissements & Services (ESMS) :</strong>
              <span>${esc(b.esmsLink)}</span>
            </div>
            <div class="secu-callout manager">
              <strong>💼 Action Concrète du Directeur :</strong>
              <span>${esc(b.managerAction)}</span>
            </div>
          </article>
        `).join("")}
      </div>
    </div>

    <!-- ONDAM -->
    <div class="section-block" data-page-theme="ONDAM">
      <div class="section-title-row">
        <div>
          <h2>L'ONDAM : Le Plafond National de Dépenses de Santé</h2>
          <p>Le cadre macro-économique annuel qui conditionne les enveloppes budgétaires des hôpitaux et des ESSMS.</p>
        </div>
      </div>
      <div class="secu-ondam-box">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:14px;border-bottom:1px solid var(--stroke);padding-bottom:16px;margin-bottom:16px">
          <div>
            <span class="eyebrow">${esc(secu.ondam.name)}</span>
            <p style="font-size:13.5px;color:var(--text-soft);margin:6px 0 0;line-height:1.6">${esc(secu.ondam.role)}</p>
          </div>
          <span class="tag mint" style="font-size:12px;padding:6px 12px">${icon("check", 13)} Plafond voté chaque année par le Parlement (LFSS)</span>
        </div>
        <div class="secu-subobj-grid">
          ${(secu.ondam.subObjectives || []).map(item => `
            <div class="secu-subobj-card">
              <div class="secu-subobj-head">
                <strong>${esc(item.name)}</strong>
                <span class="tag sky" style="font-size:10.5px">${esc(item.share)}</span>
              </div>
              <p style="font-size:12px;color:var(--text-soft);margin:0;line-height:1.55">${esc(item.desc)}</p>
            </div>
          `).join("")}
        </div>
        <div style="padding:14px 16px;background:rgba(248,211,136,0.08);border:1px solid rgba(248,211,136,0.25);border-radius:12px;font-size:12.5px;line-height:1.6">
          <strong style="color:var(--gold);display:block;margin-bottom:3px;font-size:13px">Impact concret pour le Directeur :</strong>
          <span style="color:var(--text-soft)">${esc(secu.ondam.impactManager)}</span>
        </div>
      </div>
    </div>

    <!-- Modèles de Tarification -->
    <div class="section-block" data-page-theme="Tarification">
      <div class="section-title-row">
        <div>
          <h2>Les Principaux Mécanismes de Tarification</h2>
          <p>De la T2A à la tarification ternaire des EHPAD, les modèles économiques régissant les recettes de vos structures.</p>
        </div>
      </div>
      <div class="secu-tarification-grid">
        ${(secu.fundingMechanisms || []).map(m => `
          <article class="secu-tarification-card">
            <span class="tag sky" style="font-size:10px">${esc(m.target || m.facility || "Régulation financière")}</span>
            <h3>${esc(m.name)}</h3>
            <p>${esc(m.desc || m.description || "")}</p>
          </article>
        `).join("")}
      </div>
    </div>

    <!-- 6 Interactions Directeur & Sécu + Matrice Qui Paie Quoi (Campus Gate) -->
    ${isUnlocked ? `
      <div class="section-block" data-page-theme="Rôle du directeur">
        <div class="section-title-row">
          <div>
            <h2>Les 6 Interactions Directes Directeur — Sécurité Sociale</h2>
            <p>Facturation FIDES, contrôles d'activité T2A, contentieux avec le médecin-conseil, subventions TMS CARSAT et accès aux droits des usagers.</p>
          </div>
        </div>
        <div class="secu-interaction-grid">
          ${secu.managerInteractions.map(inter => `
            <article class="secu-interaction-card">
              <div class="secu-interaction-header">
                <span class="secu-interaction-num">${esc(inter.num)}</span>
                <h3>${esc(inter.title)}</h3>
              </div>
              <p>${esc(inter.detail)}</p>
            </article>
          `).join("")}
        </div>
      </div>

      <div class="section-block" data-page-theme="Qui paie quoi ?">
        <div class="section-title-row">
          <div>
            <h2>Matrice Comparative 'Qui Paie Quoi' par Type d'Établissement</h2>
            <p>Répartition précise entre Assurance Maladie, Département, Résident et Complémentaires sur 9 types de structures.</p>
          </div>
        </div>
        <!-- Vue Ordinateur : Tableau complet lisible -->
        <div class="secu-table-wrap">
          <table class="secu-table">
            <thead>
              <tr>
                <th>Établissement</th>
                <th>Section Soins</th>
                <th>Section Dépendance</th>
                <th>Section Hébergement</th>
                <th>Part Usager / Reste à charge</th>
              </tr>
            </thead>
            <tbody>
              ${secu.whoPaysWhat.map(row => `
                <tr>
                  <td style="font-weight:700;color:var(--text)">${esc(row.facility)}</td>
                  <td style="color:var(--sky)">${esc(row.soins)}</td>
                  <td style="color:var(--mint)">${esc(row.dependance)}</td>
                  <td style="color:var(--gold)">${esc(row.hebergement)}</td>
                  <td style="color:var(--text-soft)">${esc(row.userPart)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
        <!-- Vue Mobile : Fiches synthétiques aérées -->
        <div class="secu-matrix-cards">
          ${secu.whoPaysWhat.map(row => `
            <div class="secu-matrix-card">
              <h3>${esc(row.facility)}</h3>
              <div class="secu-matrix-item">
                <strong>Soins :</strong>
                <span style="color:var(--sky)">${esc(row.soins)}</span>
              </div>
              <div class="secu-matrix-item">
                <strong>Dépendance :</strong>
                <span style="color:var(--mint)">${esc(row.dependance)}</span>
              </div>
              <div class="secu-matrix-item">
                <strong>Hébergement :</strong>
                <span style="color:var(--gold)">${esc(row.hebergement)}</span>
              </div>
              <div class="secu-matrix-item">
                <strong>Reste à charge :</strong>
                <span>${esc(row.userPart)}</span>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    ` : paywallGate("Matrice Comparative 'Qui Paie Quoi' & 6 Interactions Directeur (45% Campus)", "Accédez à la matrice des flux financiers pour les 9 catégories d'établissements et aux 6 protocoles de négociation avec la CPAM et la CARSAT.", `
      <div class="section-block">
        <div class="secu-interaction-grid">
          ${secu.managerInteractions.slice(0, 2).map(inter => `
            <article class="secu-interaction-card">
              <div class="secu-interaction-header">
                <span class="secu-interaction-num">${esc(inter.num)}</span>
                <h3>${esc(inter.title)}</h3>
              </div>
              <p>${esc(inter.detail)}</p>
            </article>
          `).join("")}
        </div>
      </div>
    `)}

    ${sourceLinks(["ameli", "cnsa", "cnsaFunding", "hospital"])}
  </section>`;
}

function openConventionModal() {
  dialogKicker.textContent = "CONVENTIONS B2B & ÉTABLISSEMENTS";
  dialogContent.innerHTML = `
    <div style="padding:10px 0">
      <h2 style="font-size:22px;margin:0 0 8px;color:var(--text)">Demande de Convention ou Devis d'Équipe</h2>
      <p style="font-size:13px;color:var(--text-soft);margin:0 0 18px;line-height:1.5">
        Équipez votre promotion de Master (IAE, EHESP, IFCS) ou vos cadres d'établissement (EHPAD, MAS, FAM, Clinique). Les licences d'équipe incluent l'accès complet, la facturation administrative (Chorus Pro/OPCO) et le support prioritaire.
      </p>
      <form id="convention-request-form" style="display:grid;gap:12px">
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px">
          <div>
            <label class="field-label">Votre nom & prénom *</label>
            <input type="text" name="name" class="form-control" required placeholder="Ex: Dr. Martin Dupont" value="${esc(state.auth?.profile?.name || '')}">
          </div>
          <div>
            <label class="field-label">Votre fonction *</label>
            <input type="text" name="role" class="form-control" required placeholder="Ex: Directeur d'EHPAD / Resp. Master MES">
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px">
          <div>
            <label class="field-label">Établissement ou Université *</label>
            <input type="text" name="organization" class="form-control" required placeholder="Ex: IAE / GHU Paris / EHPAD Les Pins">
          </div>
          <div>
            <label class="field-label">Adresse email professionnelle *</label>
            <input type="email" name="email" class="form-control" required placeholder="Ex: direction@etablissement.fr" value="${esc(state.auth?.profile?.email || '')}">
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px">
          <div>
            <label class="field-label">Type de structure *</label>
            <select name="type" class="form-control" style="cursor:pointer" required>
              <option value="ecole">Université / École / IAE / EHESP (Master)</option>
              <option value="ehpad">EHPAD / Résidence Autonomie</option>
              <option value="handicap">Secteur Handicap (MAS / FAM / IME / SESSAD)</option>
              <option value="sanitaire">Établissement Hospitalier / Clinique / SSR</option>
              <option value="autre">Autre structure / Cabinet de conseil</option>
            </select>
          </div>
          <div>
            <label class="field-label">Nombre approximatif de licences *</label>
            <select name="seats" class="form-control" style="cursor:pointer" required>
              <option value="1-5">Équipe Direction (1 à 5 cadres / CODIR)</option>
              <option value="15-35">Promotion d'étudiants (15 à 35 alternants/étudiants)</option>
              <option value="50+">Campus complet / Multi-promos (50+ licences)</option>
              <option value="groupement">Groupement d'établissements / GHT</option>
            </select>
          </div>
        </div>
        <div>
          <label class="field-label">Précisions ou besoins spécifiques</label>
          <textarea name="notes" class="form-control" rows="3" placeholder="Indiquez vos besoins : date de rentrée, calendrier d'inspection ARS, besoins de facturation Chorus Pro..."></textarea>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:10px">
          <button type="button" class="button subtle" data-action="close-dialog">Annuler</button>
          <button type="submit" class="button primary">${icon("send", 14)} Transmettre la demande de convention</button>
        </div>
      </form>
    </div>
  `;
  dialog.showModal();
}

function renderSubscription() {
  const isUnlocked = isPremiumUnlocked();
  const pricing = PRICING_DATA;
  const currentPlan = state.auth?.plan || (isUnlocked ? "universal" : "freemium");

  return `<section class="page" aria-labelledby="sub-title">
    ${renderAccessStatusBar()}
    ${sectionHead("ABONNEMENT & ACCÈS PREMIUM", "Formules disponibles dans l’application", "Chaque abonnement donne accès aux contenus Premium présents dans Mosaïque Santé : métiers institutionnels, RH, droit, Sécurité Sociale, annuaire, timeline, carte 3D et flashcards PDF.", ``)}

    <!-- Bannière VIP Statut Actuel -->
    <div class="subscription-vip-banner glass-panel ${isUnlocked ? 'is-unlocked' : 'is-freemium'}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:16px">
        <div style="flex:1;min-width:260px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
            <span class="icon-bubble" style="width:28px;height:28px;background:${isUnlocked ? 'rgba(117,224,194,0.18)' : 'rgba(245,207,139,0.18)'};color:${isUnlocked ? 'var(--mint)' : 'var(--gold)'}">${icon("spark", 15)}</span>
            <span class="eyebrow" style="color:${isUnlocked ? 'var(--mint)' : 'var(--gold)'}">${isUnlocked ? "CAMPUS DÉBLOQUÉ · ACCÈS INTÉGRAL 100%" : "ESPACE FREEMIUM · 55% DES RESSOURCES ACCESSIBLES"}</span>
          </div>
          <h2 style="font-size:22px;font-weight:780;margin:4px 0 6px;color:var(--text);letter-spacing:-0.02em">
            ${isUnlocked ? "👑 Vous disposez de l'accès illimité Campus" : "🔒 Vous utilisez l'accès découverte Mosaïque Santé"}
          </h2>
          <p style="font-size:13px;color:var(--text-soft);margin:0;max-width:680px;line-height:1.6">
            ${isUnlocked 
              ? `Formule active : <strong>${esc(currentPlan)}</strong>. L'intégralité des modules approfondis est ouverte : fiches de direction, grilles RH, droit opposable, Sécurité Sociale, audit HAS, REX, annuaire alumni et flashcards 3D.`
              : `Les 55% de ressources socles restent en libre accès permanent. L'abonnement ouvre les 45% de modules réservés à la gouvernance, à la qualité HAS et à la communauté.`}
          </p>
          <div class="vip-banner-meter">
            <div class="vip-progress-track">
              <div class="vip-progress-fill ${isUnlocked ? 'unlocked' : 'freemium'}"></div>
            </div>
            <span style="font-size:11px;font-weight:750;color:${isUnlocked ? 'var(--mint)' : 'var(--gold)'}">${isUnlocked ? "100% ILLIMITÉ" : "55% DÉCOUVERTE"}</span>
          </div>
        </div>
        <div style="display:flex;gap:8px;align-items:center;margin-top:6px">
          ${isUnlocked 
            ? `<button class="button subtle" data-action="reset-auth-profile">${icon("reset", 14)}Verrouiller (mode test)</button>`
            : `<button class="button primary" data-action="simulate-subscribe" data-plan="Pass Annuel Pro" data-price-id="price_1UeF8MCn4c8lYjEAcTVuxqSh">${icon("spark", 15)}Débloquer mon accès</button>`}
        </div>
      </div>
    </div>

    <!-- Conventions B2B & Souscription Sécurisée -->
    <div class="glass-panel" style="padding:22px;margin-bottom:28px;background:rgba(248,211,136,0.04);border:1px dashed rgba(248,211,136,0.3);border-radius:18px">
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:12px">
        <span class="icon-bubble" style="background:rgba(248,211,136,0.15);color:var(--gold);padding:8px">${icon("briefcase", 18)}</span>
        <div>
          <h3 style="font-size:15px;color:var(--gold);margin:0;font-weight:750">Conventions B2B, Devis & Déploiement Sécurisé</h3>
          <span style="font-size:12px;color:var(--text-soft);line-height:1.5;display:block;margin-top:2px">Facturation Chorus Pro, mandat administratif ou virement bancaire pour établissements et instituts de formation (IAE, EHESP). Déploiement immédiat de cohortes par clés d'activation.</span>
        </div>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="button primary" data-action="request-convention">${icon("briefcase",15)}Demander une convention ou un devis B2B</button>
        <button class="button subtle" data-action="request-partnership">${icon("lock",14)}Activer un code promo ou clé Campus</button>
      </div>
    </div>

    <!-- Formules Écoles & Universités -->
    <div class="section-block">
      <div class="section-title-row">
        <div>
          <h2>Formules pour les écoles et promotions</h2>
          <p>Accès Premium groupé pour l'ensemble des étudiants et intervenants d'une promotion.</p>
        </div>
      </div>
      <div class="pricing-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:18px">
        ${pricing.tiers.schools.map(t => `
          <article class="pricing-card glass-panel${t.popular ? ' is-popular' : ''}">
            ${t.popular ? `<span class="pricing-popular-pill">RECOMMANDÉ ÉCOLES</span>` : ''}
            <div>
              <span class="eyebrow" style="color:var(--sky)">${esc(t.students)}</span>
              <h3 style="font-size:20px;font-weight:800;margin:6px 0 2px">${esc(t.name)}</h3>
              <div class="pricing-amount-row">
                <span class="pricing-amount">${esc(t.price)}</span>
                <span style="color:var(--text-2);font-size:12px">${esc(t.period)}</span>
              </div>
              <span style="display:inline-block;font-size:11.5px;color:var(--mint);font-weight:700;margin-bottom:14px">${esc(t.perStudent)}</span>
              <div class="pricing-feature-list">
                ${t.features.map(f => `
                  <div class="pricing-feature-item">
                    <span class="pricing-check-icon">${icon("check", 12)}</span>
                    <span>${esc(f)}</span>
                  </div>
                `).join("")}
              </div>
            </div>
            <button class="button ${t.popular ? 'primary' : 'subtle'}" style="margin-top:20px;width:100%" data-action="simulate-subscribe" data-plan="${esc(t.name)}" data-price-id="${esc(t.priceId || '')}">
              ${icon("briefcase", 15)}Souscrire pour mon école
            </button>
          </article>
        `).join("")}
      </div>
    </div>

    <!-- Formules Individuelles & Étudiants -->
    <div class="section-block">
      <div class="section-title-row">
        <div>
          <h2>Formules Individuelles & Pass Pro</h2>
          <p>Accès personnel complet pour les cadres, directeurs et étudiants en management de la santé.</p>
        </div>
      </div>
      <div class="pricing-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:18px">
        ${pricing.tiers.individuals.map(t => `
          <article class="pricing-card glass-panel${t.popular ? ' is-popular' : ''}">
            ${t.popular ? `<span class="pricing-popular-pill">LE PLUS CHOISI</span>` : (t.badge ? `<span style="position:absolute;top:10px;right:14px;font-size:10px;font-weight:750;color:var(--gold);background:rgba(248,211,136,0.15);padding:3px 8px;border-radius:10px">${esc(t.badge)}</span>` : '')}
            <div>
              <h3 style="font-size:18px;font-weight:780;margin:0 0 6px">${esc(t.name)}</h3>
              <div class="pricing-amount-row">
                <span class="pricing-amount">${esc(t.price)}</span>
                <span style="color:var(--text-2);font-size:12px">${esc(t.period)}</span>
              </div>
              <span style="display:inline-block;font-size:11.5px;color:var(--text-soft);margin-bottom:12px">${esc(t.subtitle)}</span>
              <div class="pricing-feature-list">
                ${t.features.map(f => `
                  <div class="pricing-feature-item">
                    <span class="pricing-check-icon">${icon("check", 12)}</span>
                    <span>${esc(f)}</span>
                  </div>
                `).join("")}
              </div>
            </div>
            <button class="button ${t.popular ? 'primary' : 'subtle'}" style="margin-top:18px;width:100%" data-action="simulate-subscribe" data-plan="${esc(t.name)}" data-price-id="${esc(t.priceId || '')}">
              ${icon("star", 14)}Choisir cette formule
            </button>
          </article>
        `).join("")}
      </div>
    </div>

    <!-- Formule Établissement (Pack CODIR) -->
    <div class="section-block">
      <div class="section-title-row">
        <div>
          <h2>Formule pour une équipe de direction</h2>
          <p>Accès Premium pour cinq comptes aux modules de gouvernance dans Mosaïque Santé.</p>
        </div>
      </div>
      <div class="glass-panel" style="padding:26px;border-radius:20px">
        ${pricing.tiers.etablissement.map(t => `
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:20px">
            <div style="flex:1;min-width:280px">
              <span class="eyebrow" style="color:var(--mint)">5 LICENCES ÉQUIPE DIRECTION (CODIR)</span>
              <h3 style="font-size:22px;font-weight:800;margin:6px 0 4px">${esc(t.name)} — ${esc(t.price)} ${esc(t.period)}</h3>
              <p style="font-size:13px;color:var(--text-soft);margin:0 0 14px">${esc(t.subtitle)}</p>
              <div class="pricing-feature-list">
                ${t.features.map(f => `
                  <div class="pricing-feature-item">
                    <span class="pricing-check-icon">${icon("check", 12)}</span>
                    <span>${esc(f)}</span>
                  </div>
                `).join("")}
              </div>
            </div>
            <button class="button primary" data-action="simulate-subscribe" data-plan="${esc(t.name)}" data-price-id="${esc(t.priceId || '')}">
              ${icon("building", 16)}Souscrire pour l'établissement
            </button>
          </div>
        `).join("")}
      </div>
    </div>

    <!-- Compte utilisateur sécurisé -->
    <div class="section-block">
      <div class="section-title-row">
        <div>
          <h2>Accès Premium</h2>
          <p>Validez votre email puis utilisez un code d’accès. Vous pouvez gérer votre profil dans « Mon compte ».</p>
        </div>
      </div>
      <div class="account-grid">
        <section class="glass-panel account-card premium-code-card">
          <span class="eyebrow">ACCÈS PREMIUM</span>
          <h3>Utiliser un code d’accès</h3>
          <p class="muted">Vous devez être connecté et votre email doit être vérifié. Code de test public, sans paiement : <strong>TEST-MOSAIQUE-COMPLET</strong>.</p>
          <form id="premium-code-form" class="account-form">
            <label><span class="field-label">Code d’accès</span><input class="form-control" name="code" minlength="6" maxlength="40" placeholder="Ex. CAMPUS-XXXX-XXXX" autocomplete="off" required></label>
            <button class="button primary" type="submit">${icon("spark",14)}Activer mon accès</button>
          </form>
          ${isUnlocked ? `<button class="button subtle" type="button" data-action="download-flashcards">${icon("download",14)}Télécharger mes flashcards PDF</button>` : ""}
        </section>
      </div>
    </div>

    ${sourceLinks(["iae", "ehesp", "d3s", "cafdes"])}
  </section>`;
}

function renderAccount() {
  const profile = state.auth?.profile || {};
  const passwordProvider = window.firebaseAuth?.currentUser?.providerData?.some(provider => provider.providerId === "password");
  return `<section class="page">
    ${sectionHead("PROFIL & SÉCURITÉ", "Mon <span class=\"text-gradient\">compte</span>", "Modifiez votre nom affiché et gérez la sécurité de votre connexion.")}
    <div class="account-grid">
      <section class="glass-panel account-card">
        <span class="eyebrow">MON PROFIL</span><h2>Informations du compte</h2>
        <p class="muted">${esc(profile.email || "")}</p>
        <span class="tag ${profile.emailVerified ? "mint" : "gold"}">${profile.emailVerified ? "Email vérifié" : "Email à vérifier"}</span>
        ${profile.emailVerified ? "" : `<button class="button subtle" type="button" data-action="resend-verification">${icon("send",14)}Renvoyer la validation</button>`}
        <form id="profile-update-form" class="account-form">
          <label><span class="field-label">Pseudo / nom affiché</span><input class="form-control" name="name" value="${esc(profile.name || "")}" minlength="2" maxlength="80" autocomplete="nickname" required></label>
          <button class="button primary" type="submit">${icon("check",14)}Enregistrer le pseudo</button>
        </form>
        <button class="button subtle danger" type="button" data-action="sign-out">${icon("logout",14)}Se déconnecter</button>
      </section>
      <section class="glass-panel account-card">
        <span class="eyebrow">SÉCURITÉ</span><h2>Mot de passe</h2>
        ${passwordProvider ? `<form id="password-update-form" class="account-form">
          <label><span class="field-label">Nouveau mot de passe</span><input class="form-control" name="password" type="password" minlength="8" autocomplete="new-password" required></label>
          <label><span class="field-label">Confirmer le mot de passe</span><input class="form-control" name="passwordConfirm" type="password" minlength="8" autocomplete="new-password" required></label>
          <button class="button primary" type="submit">${icon("lock",14)}Modifier le mot de passe</button>
        </form>` : `<p class="muted">Votre connexion utilise Google. Gérez votre mot de passe auprès de Google.</p>`}
      </section>
    </div>
  </section>`;
}

function attachPageHandlers() {
  if (state.page === "etablissements") {
    const input = $("#establishment-query"); if (input) input.value = state.queries.establishments;
    applyFilter("establishments");
  }
  if (state.page === "metiers") {
    const input = $("#job-query"); if (input) input.value = state.queries.jobs;
    applyFilter("jobs");
  }
  if (state.page === "metiers-support") {
    const input = $("#support-job-query"); if (input) input.value = state.queries.supportJobs;
    applyFilter("supportJobs");
  }
  if (state.page === "reunions") {
    const input = $("#meeting-query"); if (input) input.value = state.queries.meetings;
    applyFilter("meetings");
  }
  if (state.page === "documents") {
    const input = $("#document-query"); if (input) input.value = state.queries.documents;
    applyFilter("documents");
  }
  if (state.page === "acteurs") {
    const input = $("#actor-query"); if (input) input.value = state.queries.actors;
    applyFilter("actors");
  }
  if (state.page === "rh") {
    const input = $("#faq-query"); if (input) input.value = state.queries.faq;
    applyFilter("faq");
    renumberEtptRows();
    calculateEtp();
    syncForfaitCalendar();
  }
  if (state.page === "logiciels") {
    const input = $("#software-query"); if (input) input.value = state.queries.software;
    applyFilter("software");
  }
  if (state.page === "documents") updateChecklistProgress();
  if (state.page === "glossaire") updateGlossaryResults();
  if (state.page === "carte") syncMapControls();
  if (state.page === "flashcards") bindFlashcardSearch();
}
function bindFlashcardSearch() {
  const input = $("#flash-query");
  if (!input) return;
  input.value = state.queries.flashcards;
  input.addEventListener("input", () => {
    state.queries.flashcards = input.value;
    const query = input.value.trim().toLowerCase();
    const cards = $$(".flash-card", stage);
    let shown = 0;
    cards.forEach(card => {
      const match = !query || (card.dataset.search || "").includes(query);
      card.hidden = !match;
      if (match) shown += 1;
    });
    const counter = $(".flash-count", stage);
    if (counter) counter.textContent = `${shown} / ${cards.length} cartes`;
  });
}
function updateChecklistProgress() {
  const progress = $("#checklist-progress");
  if (!progress) return;
  const count = [0,1,2,3,4].filter(index => state.docChecks[`check-${index}`]).length;
  progress.textContent = `${count} repère${count === 1 ? "" : "s"} coché${count === 1 ? "" : "s"} sur 5.`;
  const countEl = $("#document-check-count");
  if (countEl) countEl.textContent = `${count} repère${count === 1 ? "" : "s"} coché${count === 1 ? "" : "s"}`;
}
document.addEventListener("click", event => {
  const resultPage = event.target.closest("[data-result-page]");
  if (resultPage) {
    const results = resultPage.closest("[id$='-results']");
    const group = resultPage.dataset.resultGroup;
    const next = Number(resultPage.dataset.resultPage);
    const direction = next > (resultPages[group] || 0) ? 1 : -1;
    resultPages[group] = next;
    applyFilter(resultPage.dataset.resultGroup, true);
    results?.querySelector("button, a")?.focus({ preventScroll:true });
    results?.scrollIntoView({ block:"start", behavior:"auto" });
    if (results && event.detail !== 0) animateContent([...results.children].filter(child => !child.matches(".result-pagination")), direction);
    return;
  }
  const pageTheme = event.target.closest(".page-theme-tab");
  if (pageTheme) {
    selectPageTheme(pageTheme, event.detail !== 0);
    return;
  }
  const authMode = event.target.closest("[data-auth-mode]");
  if (authMode) {
    if (authFlowUnavailable()) return;
    authMessage = "";
    $("#auth-status").textContent = "";
    setAuthMode(authMode.dataset.authMode);
    return;
  }
  const nav = event.target.closest("[data-nav]");
  if (nav) {
    event.preventDefault();
    if (nav.dataset.nav === "compte" && !state.auth?.profile?.uid) {
      document.body.classList.add("auth-open");
      setAuthMode("signin");
      $("#auth-title")?.focus();
      return;
    }
    if (state.onboarding) showToast("Enregistrez votre fiche ou passez cette étape pour continuer.");
    else renderPage(nav.dataset.nav, { immediate:event.detail === 0 });
    return;
  }

  // Fermeture du popover notifications au clic extérieur
  if (state.notifsOpen && !event.target.closest("#notif-popover") && !event.target.closest("[data-action=\"toggle-notifications\"]")) {
    state.notifsOpen = false;
    const popover = $("#notif-popover");
    if (popover) popover.hidden = true;
  }

  // Custom single-select dropdowns
  const customTrigger = event.target.closest('[data-action="toggle-custom-select"]');
  if (customTrigger) {
    event.preventDefault();
    const targetId = customTrigger.dataset.selectTarget;
    const wrap = document.getElementById(`${targetId}-multiselect`);
    const dropdown = document.getElementById(`${targetId}-dropdown`);
    if (wrap && dropdown) {
      const willOpen = dropdown.hidden;
      $$(".custom-select-wrap.is-open").forEach(other => {
        if (other !== wrap) {
          other.classList.remove("is-open");
          const otherDrop = other.querySelector(".multiselect-dropdown");
          if (otherDrop) otherDrop.hidden = true;
          const otherTrig = other.querySelector(".multiselect-trigger");
          if (otherTrig) otherTrig.setAttribute("aria-expanded", "false");
        }
      });
      if (peerMultiSelect.isOpen) peerMultiSelect.close();
      if (willOpen) {
        wrap.classList.add("is-open");
        dropdown.hidden = false;
        customTrigger.setAttribute("aria-expanded", "true");
        wrap.closest(".filter-bar, .network-tools, .form-grid, #timeline-post-form-wrap")?.classList.add("is-open");
        const searchInput = dropdown.querySelector('input[type="text"]');
        if (searchInput) {
          searchInput.value = "";
          filterCustomOptions(targetId, "");
          searchInput.focus();
        }
      } else {
        wrap.classList.remove("is-open");
        dropdown.hidden = true;
        customTrigger.setAttribute("aria-expanded", "false");
        wrap.closest(".filter-bar, .network-tools, .form-grid, #timeline-post-form-wrap")?.classList.remove("is-open");
      }
    }
    return;
  }

  const customOpt = event.target.closest(".multiselect-option[data-select-for]");
  if (customOpt) {
    event.preventDefault();
    const id = customOpt.dataset.selectFor;
    const val = customOpt.dataset.value;
    const input = document.getElementById(id);
    if (input) {
      input.value = val;
      input.dispatchEvent(new Event("change", { bubbles: true }));
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
    setCustomSelectValue(id, val);
    const wrap = document.getElementById(`${id}-multiselect`);
    if (wrap) {
      wrap.classList.remove("is-open");
      wrap.closest(".filter-bar, .network-tools, .form-grid, #timeline-post-form-wrap")?.classList.remove("is-open");
    }
    const dropdown = document.getElementById(`${id}-dropdown`);
    if (dropdown) dropdown.hidden = true;
    const trigger = document.getElementById(`${id}-trigger`);
    if (trigger) {
      trigger.setAttribute("aria-expanded", "false");
      trigger.focus();
    }
    return;
  }

  // Multi-select expériences alumni
  const removeChip = event.target.closest("[data-remove-exp]");
  if (removeChip) {
    event.preventDefault();
    event.stopPropagation();
    peerMultiSelect.remove(removeChip.dataset.removeExp);
    return;
  }
  const expTrigger = event.target.closest("#peer-exp-trigger");
  if (expTrigger) {
    event.preventDefault();
    $$(".custom-select-wrap.is-open").forEach(w => {
      w.classList.remove("is-open");
      const d = w.querySelector(".multiselect-dropdown");
      if (d) d.hidden = true;
      const t = w.querySelector(".multiselect-trigger");
      if (t) t.setAttribute("aria-expanded", "false");
      w.closest(".filter-bar, .network-tools, .form-grid, #timeline-post-form-wrap")?.classList.remove("is-open");
    });
    if (peerMultiSelect.isOpen) peerMultiSelect.close();
    else peerMultiSelect.open();
    return;
  }
  const expOpt = event.target.closest("#peer-exp-options .multiselect-option");
  if (expOpt) {
    event.preventDefault();
    peerMultiSelect.toggleOption(expOpt.dataset.value);
    return;
  }
  const validateBtn = event.target.closest("#peer-exp-validate-btn");
  if (validateBtn) {
    event.preventDefault();
    peerMultiSelect.close();
    return;
  }
  if (peerMultiSelect.isOpen && !event.target.closest("#peer-exp-multiselect")) {
    peerMultiSelect.close();
  }
  if (!event.target.closest(".custom-select-wrap")) {
    $$(".custom-select-wrap.is-open").forEach(w => {
      w.classList.remove("is-open");
      const d = w.querySelector(".multiselect-dropdown");
      if (d) d.hidden = true;
      const t = w.querySelector(".multiselect-trigger");
      if (t) t.setAttribute("aria-expanded", "false");
      w.closest(".filter-bar, .network-tools, .form-grid, #timeline-post-form-wrap")?.classList.remove("is-open");
    });
  }

  // RH tabs handler - intercepté avant le check data-action
  const rhTab = event.target.closest("[data-rh-tab]");
  if (rhTab) {
    event.preventDefault();
    const tabId = rhTab.dataset.rhTab;
    const tabs = $$(".rh-tab");
    const previous = tabs.findIndex(t => t.classList.contains("is-active"));
    const next = tabs.indexOf(rhTab);
    $$(".rh-tab").forEach(t => {
      const active = t.dataset.rhTab === tabId;
      t.classList.toggle("is-active", active);
      t.setAttribute("aria-selected", String(active));
    });
    $$(".rh-tab-panel").forEach(p => p.classList.toggle("is-active", p.dataset.rhPanel === tabId));
    // Re-init calculators when switching to calculateurs tab
    if (tabId === "calculateurs") { renumberEtptRows(); calculateEtp(); syncForfaitCalendar(); }
    if (tabId === "questions") { const input = $("#faq-query"); if (input) { input.value = state.queries.faq; applyFilter("faq"); } }
    if (event.detail !== 0 && previous !== next) animateContent([$(".rh-tab-panel.is-active")], next > previous ? 1 : -1);
    return;
  }

  // Glossaire filtres catégorie & lettre - interceptés avant data-action
  const glossCat = event.target.closest("[data-glossary-cat]");
  if (glossCat) {
    event.preventDefault();
    state.glossaryCategory = glossCat.dataset.glossaryCat;
    $$(".glossary-cat-btn").forEach(b => b.classList.toggle("is-active", b === glossCat));
    updateGlossaryResults();
    return;
  }
  const glossLetter = event.target.closest("[data-glossary-letter]");
  if (glossLetter) {
    event.preventDefault();
    state.glossaryLetter = glossLetter.dataset.glossaryLetter;
    $$(".glossary-letter-btn").forEach(b => b.classList.toggle("is-active", b === glossLetter));
    updateGlossaryResults();
    return;
  }

  const actionEl = event.target.closest("[data-action]");
  if (!actionEl) return;
  const action = actionEl.dataset.action;
  if (action === "open-auth") {
    if (sidebar.classList.contains("is-open")) closeMenu();
    document.body.classList.add("auth-open");
    setAuthMode("signin");
    $("#auth-title")?.focus();
    return;
  }
  if (action === "close-auth") {
    document.body.classList.remove("auth-open");
    return;
  }
  if (action === "request-convention") {
    openConventionModal();
    return;
  }
  if (action === "request-partnership") {
    const code = window.prompt("Entrez votre code d'activation Campus ou Clé d'Établissement :");
    if (code) {
      if (typeof window.redeemPremiumCodeMosaque === "function") {
        window.redeemPremiumCodeMosaque(code.trim())
          .then(() => {
            showToast("👑 Félicitations ! Votre accès Campus Partenaire est activé.");
            renderPage("abonnement", { immediate: true });
          })
          .catch(err => showToast(err.message || "Code invalide ou expiré."));
      } else {
        localStorage.setItem("mosaique-premium-code", "1");
        state.auth.isUnlocked = true;
        state.auth.verifiedPaid = true;
        state.auth.plan = "Partenaire Campus";
        writeJSON(STORE.auth, state.auth);
        showToast("👑 Accès Campus Partenaire activé avec succès.");
        renderPage("abonnement", { immediate: true });
      }
    }
    return;
  }
  if (action === "skip-onboarding") { finishOnboarding(); return; }
  if (action === "toggle-menu") toggleMenu();
  if (action === "open-search") openSearch();
  if (action === "toggle-post-form") {
    const wrap = $("#timeline-post-form-wrap");
    if (!wrap) return;
    const isHidden = wrap.style.display === "none" || wrap.style.display === "";
    wrap.style.display = isHidden ? "block" : "none";
    if (isHidden) {
      wrap.scrollIntoView({ behavior: "smooth", block: "nearest" });
      setTimeout(() => wrap.querySelector("input, select, textarea")?.focus(), 120);
    }
    return;
  }

  if (action === "toggle-notifications") {
    toggleNotifications();
    return;
  }
  if (action === "mark-all-notifs-read") {
    markAllNotifsRead();
    return;
  }
  if (action === "clear-all-notifs") {
    clearAllNotifs();
    return;
  }
  if (action === "open-notif") {
    openNotification(actionEl.dataset.notifId, {
      nav: actionEl.dataset.nav,
      postId: actionEl.dataset.postId,
      peerId: actionEl.dataset.peerId
    });
    return;
  }
  if (action === "edit-peer") {
    editPeer(actionEl.dataset.id);
    return;
  }
  if (action === "cancel-edit-peer") {
    cancelEditPeer();
    return;
  }
  if (action === "open-comment-dialog") {
    openCommentDialog(actionEl.dataset.postId);
    return;
  }
  if (action === "toggle-comments") {
    const id = actionEl.dataset.postId;
    if (state.openComments.has(id)) state.openComments.delete(id); else state.openComments.add(id);
    refreshPost(id);
    return;
  }
  if (action === "delete-post") {
    confirmDeletePost(actionEl.dataset.postId);
    return;
  }
  if (action === "confirm-delete-post") {
    deletePost(actionEl.dataset.postId);
    return;
  }
  if (action === "like-post") {
    handleLikePost(actionEl.dataset.postId);
    return;
  }
  if (action === "set-post-type") {
    const type = actionEl.dataset.type;
    state.timelineComposeType = type;
    $("[data-action='set-post-type']").forEach(btn => {
      btn.classList.toggle("is-selected", btn.dataset.type === type);
    });
    const jobFields = $("#post-job-fields");
    const eventFields = $("#post-event-fields");
    if (jobFields) jobFields.hidden = type !== "job_offer";
    if (eventFields) eventFields.hidden = type !== "event";
    return;
  }
  if (action === "toggle-freemium-test") {
    if (isPremiumUnlocked()) lockAppFreemium();
    return;
  }
  if (action === "quick-unlock-universal") {
    showToast("Cette ancienne fonction de déverrouillage est désactivée.");
    return;
  }
  if (action === "prompt-universal-key") {
    renderPage("abonnement");
    return;
  }
  if (action === "simulate-subscribe") {
    const plan = actionEl.dataset.plan || "Pass Annuel Pro";
    const priceId = actionEl.dataset.priceId || "";
    if (!priceId) {
      showToast(`« ${plan} » n’est pas encore associé à un Price ID Stripe.`);
      return;
    }
    if (typeof window.signInAlumni !== "function") {
      showToast("L’authentification sécurisée n’est pas encore chargée.");
      return;
    }
    const startCheckout = async () => {
      if (!window.firebaseAuth?.currentUser) await window.signInAlumni();
      if (typeof window.startPremiumCheckout === "function") await window.startPremiumCheckout(priceId);
      else showToast("Le point de paiement Stripe n’est pas encore configuré.");
    };
    startCheckout().catch(err => showToast(err.message || "Paiement Stripe indisponible."));
    return;
  }
  if (action === "resend-verification") {
    window.resendMosaqueEmail?.()
      .then(() => showToast("Email de validation renvoyé."))
      .catch(err => showToast(err.message || "Impossible d’envoyer l’email."));
    return;
  }
  if (action === "sign-in-google") {
    if (authFlowUnavailable()) return;
    if (typeof window.signInWithGoogleMosaque !== "function") {
      showToast("Authentification indisponible. Vérifiez votre connexion et rechargez la page.");
      return;
    }
    setAuthBusy(true);
    authFlowPending = true;
    authMessage = "";
    unlockRequested = true;
    window.signInWithGoogleMosaque()
      .then(result => {
        if (result.isNewUser) queueOnboarding(result.user.uid);
        showToast("Connexion Google réussie.");
      })
      .catch(err => { unlockRequested = false; showToast(authErrorMessage(err, "Impossible de se connecter avec Google.")); })
      .finally(() => { setAuthBusy(false); finishAuthFlow(); });
    return;
  }
  if (action === "reset-password") {
    const email = window.prompt("Adresse email utilisée pour votre compte ?");
    if (!email) return;
    if (typeof window.sendMosaqueReset !== "function") {
      showToast("Authentification indisponible. Vérifiez votre connexion et rechargez la page.");
      return;
    }
    window.sendMosaqueReset(email.trim())
      .then(() => showToast("Email de réinitialisation envoyé."))
      .catch(err => showToast(err.message || "Impossible d’envoyer l’email."));
    return;
  }
  if (action === "sign-out") {
    if (typeof window.signOutMosaque !== "function") {
      showToast("Authentification indisponible. Réessayez après avoir rechargé la page.");
      return;
    }
    window.signOutMosaque()
      .then(() => {
        writeStoredValue(STORE.premiumCode,"0");
        showToast("Déconnexion effectuée.");
      })
      .catch(err => showToast(err.message || "Impossible de se déconnecter."));
    return;
  }
  if (action === "download-flashcards") {
    downloadFlashcardsPdf();
    return;
  }
  if (action === "select-flash-deck") {
    state.flashDeck = actionEl.dataset.deck || state.flashDeck;
    state.flashRevealed = new Set();
    renderPage("flashcards", { immediate: true });
    return;
  }
  if (action === "toggle-flash-mode") {
    state.flashStudyMode = !state.flashStudyMode;
    state.flashRevealed = new Set();
    renderPage("flashcards", { immediate: true });
    return;
  }
  if (action === "reveal-card") {
    const cardId = actionEl.dataset.card;
    if (!cardId) return;
    if (state.flashRevealed.has(cardId)) state.flashRevealed.delete(cardId);
    else state.flashRevealed.add(cardId);
    renderPage("flashcards", { immediate: true });
    return;
  }
  if (action === "reset-auth-profile") {
    state.auth = { isUnlocked:false, verifiedPaid:false, plan:"freemium", profile:{} };
    writeJSON(STORE.auth, state.auth);
    showToast("Profil réinitialisé en mode freemium.");
    renderPage("abonnement");
    return;
  }

  if (action === "open-sources") {
    if (sidebar.classList.contains("is-open")) closeMenu();
    openSources();
  }
  if (action === "open-profile-note") openProfileNote();
  if (action === "meeting-template") openMeetingTemplate();
  if (action === "close-dialog") closeDialog();
  if (action === "scroll-tool-section") {
    const target=document.getElementById(actionEl.dataset.target);
    if(target) { target.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"}); target.setAttribute("tabindex","-1"); target.focus({preventScroll:true}); }
  }
  if (action === "add-etpt-row") {
    const lines=$("#etpt-lines");
    if(lines) { lines.insertAdjacentHTML("beforeend",etptLine($$("[data-etpt-row]",lines).length)); renumberEtptRows(); calculateEtp(); $("[data-etpt-hours]",lines.lastElementChild)?.focus(); }
  }
  if (action === "remove-etpt-row") {
    const rows=$$("[data-etpt-row]");
    if(rows.length>1) { actionEl.closest("[data-etpt-row]")?.remove(); renumberEtptRows(); calculateEtp(); }
  }
  if (action === "reset-glossary-filters") {
    state.glossaryQuery = "";
    state.glossaryCategory = "Tout";
    state.glossaryLetter = "Tout";
    const input = $("#glossary-query");
    if (input) input.value = "";
    $$(".glossary-cat-btn").forEach(btn => btn.classList.toggle("is-active", btn.dataset.glossaryCat === "Tout"));
    $$(".glossary-letter-btn").forEach(btn => btn.classList.toggle("is-active", btn.dataset.glossaryLetter === "Tout"));
    updateGlossaryResults();
    return;
  }
  if (action === "copy-glossary-def") {
    const sigle = actionEl.dataset.copySigle || "";
    const full = actionEl.dataset.copyFull || "";
    const def = actionEl.dataset.copyDef || "";
    const text = `${sigle} (${full}) : ${def}`;
    navigator.clipboard?.writeText(text)
      .then(() => showToast(`Définition de ${sigle} copiée dans le presse-papier.`))
      .catch(() => showToast("Erreur lors de la copie."));
    return;
  }
  /* Anciens gestionnaires glossaire déplacés en amont */
  if (action === "copy-job-description") {
    const preview=$("#job-description-preview"),value=preview?.value.trim();
    if(!value) { showToast("Générez d’abord le brouillon de fiche de poste."); return; }
    if(navigator.clipboard?.writeText) navigator.clipboard.writeText(value).then(()=>showToast("Brouillon copié."),()=>{preview.focus();preview.select();showToast("Sélectionnez le texte puis copiez-le.");});
    else { preview.focus();preview.select();showToast("Sélectionnez le texte puis copiez-le."); }
  }
  if (action === "toggle-theme") {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    if (!writeStoredValue(STORE.theme,next)) showToast("Le thème ne peut pas être mémorisé sur ce fichier local.");
    const toggle = $(".theme-toggle"); if (toggle) toggle.innerHTML = icon(next === "dark" ? "sun" : "moon");
    $("meta[name='theme-color']")?.setAttribute("content", next === "dark" ? "#0b1420" : "#f3f7f7");
  }
  if (action === "favorite") { event.stopPropagation(); toggleFavorite(actionEl.dataset.id); }
  if (action === "open-establishment") detailModal("establishment",ESTABLISHMENTS.find(item => item.id === actionEl.dataset.id));
  if (action === "open-job") detailModal("job",JOBS.find(item => item.id === actionEl.dataset.id));
  if (action === "open-meeting") detailModal("meeting",MEETINGS.find(item => item.id === actionEl.dataset.id));
  if (action === "open-document") openDocument("document",actionEl.dataset.id);
  if (action === "open-actor") detailModal("actor",ACTORS.find(item => item.id === actionEl.dataset.id));

  if (action === "open-quality-tool") detailModal("quality_tool", QUALITY_TOOLS.find(item => item.id === actionEl.dataset.id));
  if (action === "open-support-job") detailModal("support_job", SUPPORT_JOBS.find(item => item.id === actionEl.dataset.id));
  if (action === "open-health-law") detailModal("health_law", HEALTH_POLICY.nationalLaws.find(item => item.id === actionEl.dataset.id));
  if (action === "open-adverse-level") detailModal("adverse_level", ADVERSE_EVENTS.levels.find(item => item.level === Number(actionEl.dataset.level)));

  if (action === "sim-select-level") {
    const lvl = Number(actionEl.dataset.level) || 4;
    state.eiSimLevel = lvl;
    const sim = $("#ei-simulator");
    if (sim) {
      const parent = sim.parentNode;
      const temp = document.createElement("div");
      temp.innerHTML = renderEiSimulator(lvl);
      const newSim = temp.firstElementChild;
      if (newSim && parent) {
        parent.replaceChild(newSim, sim);
        hydrateIcons(newSim);
      }
    }
    return;
  }

  if (action === "copy-etp-summary") {
    const ref = $("#etp-week-reference")?.value || "35";
    const active = $("#etp-active-hours")?.value || "0";
    const etp = $("#etp-current-output")?.value || "0,00";
    const etpt = $("#etpt-total-output")?.value || "0,00";
    const annualOut = $("#etpt-hours-output")?.textContent || "";
    const summary = `📊 SYNTHÈSE RESSOURCES HUMAINES & EFFECTIFS (Mosaïque Santé)\n• Heures actives hebdomadaires : ${active} h\n• Référence temps plein : ${ref} h / semaine\n• ETP contractuel à la date : ${etp} ETP\n• ETPT consolidé sur l'année : ${etpt} ETPT\n• Volume d'heures annuelles : ${annualOut}\n—\nGénéré depuis Mosaïque Santé · Module RH & Effectifs`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(summary).then(() => {
        showToast("✅ Synthèse RH copiée dans le presse-papier !");
      }).catch(() => {
        showToast("Impossible de copier automatiquement.");
      });
    } else {
      showToast("Presse-papier non disponible sur ce navigateur.");
    }
    return;
  }

  if (action === "cmd-filter") {
    state.cmdFilter = actionEl.dataset.category || "all";
    $$(".cmd-filter-pill").forEach(p => {
      const active = p === actionEl;
      p.classList.toggle("is-active", active);
      p.setAttribute("aria-selected", String(active));
    });
    const searchInput = $("#global-search");
    globalSearchResults(searchInput?.value || "");
    return;
  }

  if (action === "toggle-faq") {
    toggleAccordion(actionEl);
  }
  if (action === "open-search-result") {
    const kind = actionEl.dataset.kind, id = actionEl.dataset.id;
    if (kind === "software") {
      const item = SOFTWARES.find(entry => entry.name === id || entry.name === actionEl.querySelector("strong, .cmd-item-title")?.textContent);
      if(item) openDialog("LOGICIEL MÉTIER",`<h2 class="dialog-title" id="dialog-title">${esc(item.name)}</h2><p class="dialog-lede">${esc(item.what)}</p>${detailCell("Exemple / repère",item.examples)}${sourceLinks(item.sources || [item.source])}`);
    } else if (kind === "faq") {
      const found = FAQ[Number(id)] || FAQ.find(item => item.q === id || item.q === actionEl.querySelector("strong, .cmd-item-title")?.textContent);
      if (found) openDialog("QUESTION RH",`<h2 class="dialog-title" id="dialog-title">${esc(found.q)}</h2><p class="dialog-lede">${esc(found.a)}</p>${sourceLinks(found.sources || [])}`);
    } else if (kind === "quality_tool") {
      const q = QUALITY_TOOLS.find(item => item.id === id);
      if (q) detailModal("quality_tool", q);
    } else if (kind === "support_job") {
      const j = SUPPORT_JOBS.find(item => item.id === id);
      if (j) detailModal("support_job", j);
    } else if (kind === "health_law") {
      const l = HEALTH_POLICY.nationalLaws.find(item => item.id === id);
      if (l) detailModal("health_law", l);
    } else if (kind === "adverse_level") {
      const lvl = ADVERSE_EVENTS.levels.find(item => item.level === Number(id));
      if (lvl) detailModal("adverse_level", lvl);
    } else if (kind === "convention") {
      const c = CONVENTIONS.find(item => (item.idcc && item.idcc === id) || item.name === id);
      if (c) openDialog("CONVENTION COLLECTIVE", `<h2 class="dialog-title" id="dialog-title">${esc(c.name)}</h2><p class="dialog-lede">${esc(c.scope)}</p>${detailCell("IDCC / Statut", c.idcc)}${detailCell("Points de vigilance", c.watch)}${sourceLinks([c.source])}`);
    } else if (kind === "audit") {
      renderPage("audit");
      closeDialog();
    } else {
      const map = { establishment:ESTABLISHMENTS, job:JOBS, meeting:MEETINGS, document:DOCUMENTS, actor:ACTORS };
      const item = map[kind]?.find(entry => entry.id === id);
      if (item) detailModal(kind,item);
    }
  }
  if (action === "reset-checklist") {
    state.docChecks = {}; writeJSON(STORE.checks,state.docChecks);
    $$("[data-check]").forEach(input => { input.checked = false; }); updateChecklistProgress();
  }
  if (action === "map-reset") {
    state.mapPositions=createInitialMapPositions(); state.mapRotation={x:8,y:352,z:0}; state.mapPerspective=1050; state.mapSceneDepth=0; state.mapZoom=1; state.mapZoomAuto=true; state.mapPan={x:0,y:0}; state.mapGesture="rotate"; state.mapFilter="Tout"; state.selectedMapNode="direction";
    renderPage("carte");
  }
  if (action === "map-gesture") { state.mapGesture=state.mapGesture === "rotate" ? "pan" : "rotate"; syncMapControls(); }
  if (action === "map-settings") {
    const panel=$("#map-controls");
    if (panel) { panel.hidden=!panel.hidden; actionEl.setAttribute("aria-expanded",String(!panel.hidden)); requestAnimationFrame(() => mapRuntime && resizeMapScene(mapRuntime)); }
  }
  if (action === "map-zoom-in" || action === "map-zoom-out") {
    const scene=mapRuntime;
    if (scene) zoomMapAt(action === "map-zoom-in" ? 1.3 : 1/1.3,scene.width/2,scene.height/2,scene);
  }
  if (action === "map-fit") fitMapView();
  if (action === "map-expand") setMapExpanded(!$("#map-frame")?.classList.contains("is-expanded"));
  if (action === "map-details-toggle") {
    const box=$("#map-details");
    if (box) {
      const collapsed=box.classList.toggle("is-collapsed");
      state.mapDetailsOpen=!collapsed;
      actionEl.setAttribute("aria-expanded",String(!collapsed));
    }
  }
  if (action === "delete-peer") {
    state.peers = state.peers.filter(peer => peer.id !== actionEl.dataset.id); writeJSON(STORE.peers,state.peers); renderPeerList(); showToast("Fiche supprimée de cet appareil.");
  }
  if (action === "reset-peer-filters") {
    const q = $("#peer-query");
    if (q) q.value = "";
    state.queries.peers = "";
    const clearBtn = $("#peer-search-clear");
    if (clearBtn) clearBtn.hidden = true;
    const expFilter = $("#peer-experience-filter");
    if (expFilter) expFilter.value = "Tout";
    const regFilter = $("#peer-region-filter");
    if (regFilter) regFilter.value = "Tout";
    const expDisplay = $("#peer-experience-filter-display");
    if (expDisplay) { expDisplay.textContent = "Toutes les compétences"; expDisplay.classList.remove("has-value"); }
    const regDisplay = $("#peer-region-filter-display");
    if (regDisplay) { regDisplay.textContent = "Toutes les régions"; regDisplay.classList.remove("has-value"); }
    renderPeerList();
    return;
  }
  if (action === "clear-peers") {
    if (!state.peers.length) { showToast("L’annuaire local est déjà vide."); return; }
    if (window.confirm("Supprimer toutes les fiches enregistrées dans ce navigateur ?")) { state.peers=[]; writeJSON(STORE.peers,state.peers); renderPeerList(); showToast("Les fiches locales ont été supprimées."); }
  }
  if (action === "export-peers") exportPeers();
});

document.addEventListener("input", event => {
  const el = event.target;
  if (el.form?.id === "welcome-signup-form") updateAuthLock();
  if (el.id === "establishment-query") { state.queries.establishments=el.value; applyFilter("establishments"); }
  if (el.id === "job-query") { state.queries.jobs=el.value; applyFilter("jobs"); }
  if (el.id === "meeting-query") { state.queries.meetings=el.value; applyFilter("meetings"); }
  if (el.id === "document-query") { state.queries.documents=el.value; applyFilter("documents"); }
  if (el.id === "actor-query") { state.queries.actors=el.value; applyFilter("actors"); }
  if (el.id === "faq-query") { state.queries.faq=el.value; applyFilter("faq"); }
  if (el.id === "glossary-query") { state.glossaryQuery = el.value; updateGlossaryResults(); }
  if (el.id === "software-query") { state.queries.software=el.value; applyFilter("software"); }
  if (el.id === "timeline-post-type-select") {
    const isEvent = el.value === "event";
    const extra = $("#timeline-event-extra-fields");
    if (extra) extra.style.display = isEvent ? "block" : "none";
    const submitBtn = $("#timeline-post-submit-btn");
    if (submitBtn) {
      submitBtn.innerHTML = `${icon("send", 14)} ${isEvent ? "Diffuser l'événement" : el.value === "job_offer" ? "Diffuser l'offre" : "Diffuser l'annonce"}`;
    }
  }

  if (el.id === "support-job-query") { state.queries.supportJobs=el.value; applyFilter("supportJobs"); }

  if (el.id === "etp-active-hours" || el.id === "etp-week-reference" || el.id === "etp-annual-reference" || el.matches("[data-etpt-hours], [data-etpt-months]")) calculateEtp();
  if (el.id === "forfait-year") syncForfaitCalendar();
  else if (["forfait-holidays","forfait-cp","forfait-extra-leave","forfait-days"].includes(el.id)) calculateForfait();
  if (el.id === "global-search") globalSearchResults(el.value);
  if (el.id === "peer-exp-search") peerMultiSelect.filterOptions(el.value);
  if (el.dataset.customSearch) filterCustomOptions(el.dataset.customSearch, el.value);
  if (el.dataset.action === "filter-select-search") {
    const menu = el.closest(".filter-select-menu");
    if (menu) {
      const q = el.value.toLowerCase().trim();
      $$(".filter-select-option", menu).forEach(opt => {
        const text = opt.textContent.toLowerCase();
        opt.style.display = text.includes(q) ? "flex" : "none";
      });
    }
  }
  if (el.id === "peer-query") {
    state.queries.peers = el.value;
    const clearBtn = $("#peer-search-clear");
    if (clearBtn) clearBtn.hidden = !el.value;
    renderPeerList();
  }
  if (el.id === "map-zoom") {
    state.mapZoom=Number(el.value)/100;
    state.mapZoomAuto=false;
    const output=$("#map-zoom-output");
    if (output) output.value=`${el.value} %`;
    requestMapFrame();
  }
  const mapAxis = el.id.match(/^map-rotate-([xyz])$/)?.[1];
  if (mapAxis) {
    beginMapAdjustment();
    state.mapRotation[mapAxis]=Number(el.value);
    const output = $(`#map-angle-${mapAxis}-output`);
    if (output) output.value=`${el.value}°`;
    requestMapFrame();
  }
  if (el.id === "map-depth") {
    beginMapAdjustment();
    state.mapPerspective=Number(el.value);
    const output = $("#map-depth-output");
    if (output) output.value=`${el.value} px`;
    requestMapFrame();
  }
  if (el.id === "map-scene-depth") {
    state.mapSceneDepth=Number(el.value);
    const output=$("#map-scene-depth-output");
    if(output) output.value=el.value;
    requestMapFrame();
  }
  if (el.id === "map-node-depth" && state.mapPositions[state.selectedMapNode]) {
    state.mapPositions[state.selectedMapNode].z=Number(el.value);
    const output=$("#map-node-depth-output");
    if(output) output.value=el.value;
    requestMapFrame();
  }
});

document.addEventListener("change", event => {
  const el = event.target;
  if (el.matches("[data-check]")) {
    state.docChecks[el.dataset.check]=el.checked; writeJSON(STORE.checks,state.docChecks); updateChecklistProgress();
  }
  if (el.id === "peer-experience-filter" || el.id === "peer-region-filter") renderPeerList();
  if (el.id === "timeline-post-type-select") {
    const isEvent = el.value === "event";
    const extra = $("#timeline-event-extra-fields");
    if (extra) extra.style.display = isEvent ? "block" : "none";
    const submitBtn = $("#timeline-post-submit-btn");
    if (submitBtn) {
      submitBtn.innerHTML = `${icon("send", 14)} ${isEvent ? "Diffuser l'événement" : el.value === "job_offer" ? "Diffuser l'offre" : "Diffuser l'annonce"}`;
    }
  }
});

document.addEventListener("mousedown", event => {
  if (event.button === 0 && event.target.closest(".filter-select [data-filter-choice]")) event.preventDefault();
});
document.addEventListener("toggle", event => {
  if (event.target.matches?.(".filter-select")) {
    const bar = event.target.closest(".filter-bar");
    if (bar) bar.classList.toggle("is-open", event.target.open);
  }
}, true);
document.addEventListener("click", event => {
  const dropdown = event.target.closest(".filter-select");
  $$(".filter-select[open]").forEach(open => {
    if (open !== dropdown) {
      open.open = false;
      open.closest(".filter-bar")?.classList.remove("is-open");
    }
  });
  const option = event.target.closest("[data-filter-choice]");
  if (!dropdown || !option) return;
  const group = dropdown.dataset.selectFilter;
  state.filters[group] = option.dataset.filterChoice;
  const label = $("span", option).textContent;
  const trigger = $("summary", dropdown);
  $(".filter-select-value", trigger).textContent = label;
  trigger.setAttribute("aria-label", `${dropdown.dataset.filterLabel} : ${label}`);
  $$("[data-filter-choice]", dropdown).forEach(item => item.setAttribute("aria-pressed", String(item === option)));
  dropdown.open = false;
  dropdown.closest(".filter-bar")?.classList.remove("is-open");
  trigger.focus({ preventScroll:true });
  applyFilter(group);
});
document.addEventListener("focusout", event => {
  const dropdown = event.target.closest(".filter-select");
  if (dropdown) requestAnimationFrame(() => {
    if (!dropdown.contains(document.activeElement)) {
      dropdown.open = false;
      dropdown.closest(".filter-bar")?.classList.remove("is-open");
    }
  });
});
document.addEventListener("click", event => {
  const filter = event.target.closest("[data-filter-group]");
  if (!filter) return;
  const group = filter.dataset.filterGroup;
  if (group === "map") {
    state.mapFilter=filter.dataset.filterValue;
    $$("[data-filter-group=map]").forEach(button => { const active=button.dataset.filterValue===state.mapFilter; button.classList.toggle("is-selected",active); button.setAttribute("aria-pressed",String(active)); });
    updateMapSelection(); return;
  }
  state.filters[group]=filter.dataset.filterValue;
  $$(`[data-filter-group="${CSS.escape(group)}"]`).forEach(button => { const active=button.dataset.filterValue===state.filters[group]; button.classList.toggle("is-selected",active); button.setAttribute("aria-pressed",String(active)); });
  applyFilter(group);
});

document.addEventListener("click", event => {
  const node = event.target.closest("[data-map-node]");
  if (!node || performance.now() < mapClickSuppressionUntil) return;
  state.selectedMapNode=node.dataset.mapNode; updateMapSelection();
});
document.addEventListener("keydown", event => {
  if (event.key === "Tab" && sidebar.classList.contains("is-open")) {
    const focusable = $$('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])', sidebar)
      .filter(element => element.getClientRects().length);
    if (focusable.length) {
      const current = focusable.indexOf(document.activeElement);
      const next = current < 0 ? (event.shiftKey ? focusable.length - 1 : 0)
        : (current + (event.shiftKey ? -1 : 1) + focusable.length) % focusable.length;
      event.preventDefault();
      focusable[next].focus();
    }
    return;
  }
  const pageTheme = event.target.closest(".page-theme-tab");
  if (pageTheme && ["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
    event.preventDefault();
    const tabs = $$(".page-theme-tab", pageTheme.parentElement);
    const index = tabs.indexOf(pageTheme);
    const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    selectPageTheme(tabs[next], false);
    tabs[next].focus();
    return;
  }
  const dropdown = event.target.closest(".filter-select");
  if (dropdown) {
    const options = $$("[data-filter-choice]", dropdown);
    if (event.key === "Escape" && dropdown.open) {
      event.preventDefault();
      dropdown.open = false;
      dropdown.closest(".filter-bar")?.classList.remove("is-open");
      $("summary", dropdown).focus();
      return;
    }
    if (event.target.matches("summary") && event.key === "ArrowDown") {
      event.preventDefault();
      dropdown.open = true;
      dropdown.closest(".filter-bar")?.classList.add("is-open");
      (options.find(option => option.getAttribute("aria-pressed") === "true") || options[0])?.focus();
      return;
    }
    const index = options.indexOf(event.target);
    if (index >= 0 && ["ArrowDown","ArrowUp","Home","End"].includes(event.key)) {
      event.preventDefault();
      const next = event.key === "Home" ? 0 : event.key === "End" ? options.length - 1 : (index + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length;
      options[next].focus();
      return;
    }
  }
  if (event.key === "Escape") {
    const openCustom = $(".custom-select-wrap.is-open");
    if (openCustom) {
      openCustom.classList.remove("is-open");
      openCustom.closest(".filter-bar, .network-tools, .form-grid, #timeline-post-form-wrap")?.classList.remove("is-open");
      const d = openCustom.querySelector(".multiselect-dropdown");
      if (d) d.hidden = true;
      const t = openCustom.querySelector(".multiselect-trigger");
      if (t) {
        t.setAttribute("aria-expanded", "false");
        t.focus();
      }
      return;
    }
  }
  if (event.key === "Escape" && document.body.classList.contains("map-expanded")) { setMapExpanded(false); return; }
  if (event.key === "Escape" && peerMultiSelect.isOpen) { peerMultiSelect.close(); return; }
  if (event.key === "Escape" && sidebar.classList.contains("is-open")) { closeMenu(); return; }
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); openSearch(); }
  const cmdPalette = $("#global-results")?.closest(".cmd-palette");
  if (cmdPalette) {
    const items = $$(".cmd-item", cmdPalette);
    const selected = $(".cmd-item.is-selected", cmdPalette);
    let idx = items.indexOf(selected);
    if (event.key === "ArrowDown") {
      event.preventDefault();
      const nextIdx = idx < items.length - 1 ? idx + 1 : 0;
      items.forEach((it, i) => it.classList.toggle("is-selected", i === nextIdx));
      items[nextIdx]?.scrollIntoView({ block: "nearest" });
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      const prevIdx = idx > 0 ? idx - 1 : items.length - 1;
      items.forEach((it, i) => it.classList.toggle("is-selected", i === prevIdx));
      items[prevIdx]?.scrollIntoView({ block: "nearest" });
      return;
    }
    if (event.key === "Enter" && selected) {
      event.preventDefault();
      selected.click();
      return;
    }
  }
  if ((event.key === "Enter" || event.key === " ") && event.target.matches?.(".multiselect-option[data-select-for]")) {
    event.preventDefault();
    event.target.click();
    return;
  }
  if ((event.key === "Enter" || event.key === " ") && event.target.matches?.('[data-action="toggle-custom-select"]')) {
    event.preventDefault();
    event.target.click();
    return;
  }
  if ((event.key === "Enter" || event.key === " ") && event.target.matches?.("#peer-exp-options .multiselect-option")) {
    event.preventDefault();
    peerMultiSelect.toggleOption(event.target.dataset.value);
    return;
  }
  if (event.target.matches?.("[data-map-node]")) {
    const position=state.mapPositions[event.target.dataset.mapNode], step=event.shiftKey?18:12;
    const deltas={ArrowLeft:{x:-step},ArrowRight:{x:step},ArrowUp:event.shiftKey?{z:step}:{y:step},ArrowDown:event.shiftKey?{z:-step}:{y:-step}};
    if (position && deltas[event.key]) {
      event.preventDefault();
      for (const [axis,delta] of Object.entries(deltas[event.key])) position[axis]=clamp(position[axis]+delta,axis==="x"?-420:axis==="y"?-300:-260,axis==="x"?420:axis==="y"?300:260);
      state.selectedMapNode=event.target.dataset.mapNode; updateMapSelection(); return;
    }
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); state.selectedMapNode=event.target.dataset.mapNode; updateMapSelection(); }
  }
});
dialog.addEventListener("click", event => { if (event.target === dialog) closeDialog(); });
dialog.addEventListener("cancel", event => { event.preventDefault(); closeDialog(); });
document.addEventListener("submit", event => {
  if (event.target.id === "convention-request-form") {
    event.preventDefault();
    const fd = new FormData(event.target);
    const data = Object.fromEntries(fd.entries());
    const existingReqs = readJSON("mosaique-conventions", []);
    existingReqs.push({ ...data, id: "conv-" + Date.now(), createdAt: new Date().toISOString() });
    writeJSON("mosaique-conventions", existingReqs);
    if (dialog.open) closeDialog();
    showToast("✅ Demande de convention transmise ! Nous vous recontacterons sous 24h.");
    return;
  }
  if (event.target.id === "comment-form") {
    event.preventDefault();
    submitComment(event.target);
    return;
  }
  
  if (event.target.id === "timeline-post-form") {
    event.preventDefault();
    const form = event.target;
    const fd = new FormData(form);
    const title = String(fd.get("title") || "").trim();
    const org = String(fd.get("organization") || "").trim();
    const content = String(fd.get("content") || "").trim();
    if (!title || !org || !content) {
      showToast("Veuillez renseigner le titre, l'établissement et la description.");
      return;
    }
    // CORRECTION CRITIQUE : lire le type choisi par l'utilisateur dans le menu déroulant
    const type = String(fd.get("type") || "job_offer");
    const eventDate = String(fd.get("eventDate") || "").trim();
    const location = String(fd.get("location") || "").trim();
    const typeLabel = type === "event" ? "Événement" : type === "job_offer" ? "Offre d'emploi" : "Annonce";

    const newPost = {
      id: "post-" + Date.now(),
      author: {
        name: state.auth?.profile?.name || "Membre Alumni MES",
        role: state.auth?.profile?.role || "Direction / Cadre de santé",
        avatar: (state.auth?.profile?.name || "MA").slice(0, 2).toUpperCase(),
        linkedin: "",
        uid: currentUserUid()
      },
      type,
      title,
      organization: org,
      contract: String(fd.get("contract") || ""),
      contact: String(fd.get("contact") || ""),
      eventDate: eventDate,
      location: location,
      content,
      date: "À l'instant",
      createdAt: new Date().toISOString(),
      likes: 0,
      commentsCount: 0,
      comments: [],
      isLiked: false
    };
    state.posts = [newPost, ...(state.posts || [])];
    writeJSON(STORE.posts, state.posts);

    dispatchNotification({
      id: `notif-post-created-${newPost.id}`,
      title: `${typeLabel} publiée sur le fil`,
      text: `Votre publication « ${newPost.title} » est en ligne pour toute la promo.`,
      icon: "check",
      targetNav: "timeline",
      targetPostId: newPost.id,
      targetUid: currentUserUid() || "all"
    }, { silentToast: true });

    // Sync to Firestore
    if (typeof window.savePostToFirestore === "function") {
      window.savePostToFirestore(newPost)
        .then(() => { newPost.isRemote = true; writeJSON(STORE.posts, state.posts); })
        .catch(err => {
          console.warn("[Firestore] Synchronisation post différée :", err.message);
        });
    }
    form.reset();
    showToast(`🎉 ${typeLabel} publié(e) avec succès sur le fil d'actualités !`);
    const feed = $("#timeline-feed");
    if (feed) {
      feed.innerHTML = renderTimelinePosts();
      hydrateIcons(feed);
      feed.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    const wrap = $("#timeline-post-form-wrap");
    if (wrap) wrap.style.display = "none";
    const extra = $("#timeline-event-extra-fields");
    if (extra) extra.style.display = "none";
    const submitBtn = $("#timeline-post-submit-btn");
    if (submitBtn) submitBtn.innerHTML = `${icon("send", 14)} Diffuser l'offre`;
    return;
  }
  if (event.target.id === "peer-form") { event.preventDefault(); addPeer(event.target); }
  if (event.target.id === "welcome-signup-form") {
    event.preventDefault();
    if (authFlowUnavailable()) return;
    const fd = new FormData(event.target);
    const name = String(fd.get("name") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const password = String(fd.get("password") || "");
    const passwordConfirm = String(fd.get("passwordConfirm") || "");
    if (password !== passwordConfirm) { showToast("Les deux mots de passe doivent être identiques."); return; }
    if (password.length < 8) { showToast("Le mot de passe doit contenir au moins 8 caractères."); return; }
    if (typeof window.signUpMosaque !== "function" || typeof window.signOutMosaque !== "function") {
      showToast("Authentification indisponible. Vérifiez votre connexion et rechargez la page.");
      return;
    }
    setAuthBusy(true);
    authFlowPending = true;
    authMessage = "";
    $("#auth-status").textContent = "Création du compte en cours…";
    window.signUpMosaque({ name,email,password })
      .then(async user => {
        queueOnboarding(user.uid);
        try {
          await window.signOutMosaque();
        } catch (error) {
          console.error("Compte créé, mais déconnexion impossible après l’inscription :", error);
          throw new Error("Compte créé, mais la déconnexion a échoué. Votre session reste ouverte.");
        }
        pendingAuthState = { user:null, premium:false };
        event.target.reset();
        setAuthMode("signin");
        $("#welcome-signin-form").elements.namedItem("email").value = email;
        authMessage = "Compte créé. Un email de validation a été envoyé ; connectez-vous pour continuer.";
        $("#auth-status").textContent = authMessage;
        $("#welcome-signin-form").elements.namedItem("email").focus();
      })
      .catch(err => {
        if (window.firebaseAuth?.currentUser) queueOnboarding(window.firebaseAuth.currentUser.uid);
        authMessage = authErrorMessage(err, "Impossible de créer le compte.");
        $("#auth-status").textContent = authMessage;
        showToast(authMessage);
      })
      .finally(() => { setAuthBusy(false); finishAuthFlow(); });
    return;
  }
  if (["auth-signin-form", "welcome-signin-form"].includes(event.target.id)) {
    event.preventDefault();
    if (authFlowUnavailable()) return;
    const fd = new FormData(event.target);
    if (typeof window.signInMosaque !== "function") {
      showToast("Authentification indisponible. Vérifiez votre connexion et rechargez la page.");
      return;
    }
    setAuthBusy(true);
    authFlowPending = true;
    authMessage = "";
    $("#auth-status").textContent = "";
    unlockRequested = true;
    window.signInMosaque(String(fd.get("email") || "").trim(), String(fd.get("password") || ""))
      .then(() => showToast("Connexion réussie."))
      .catch(err => { unlockRequested = false; showToast(authErrorMessage(err, "Impossible de se connecter.")); })
      .finally(() => { setAuthBusy(false); finishAuthFlow(); });
    return;
  }
  if (event.target.id === "password-update-form") {
    event.preventDefault();
    const fd = new FormData(event.target);
    const password = String(fd.get("password") || "");
    const confirm = String(fd.get("passwordConfirm") || "");
    if (password !== confirm) { showToast("Les deux mots de passe doivent être identiques."); return; }
    if (password.length < 8) { showToast("Le mot de passe doit contenir au moins 8 caractères."); return; }
    if (typeof window.updateMosaquePassword !== "function") { showToast("Authentification indisponible."); return; }
    const form = event.target;
    const button = $("button[type='submit']", form);
    button.disabled = true;
    window.updateMosaquePassword(password)
      .then(() => { form.reset(); showToast("Mot de passe modifié avec succès."); })
      .catch(err => showToast(authErrorMessage(err, "Impossible de modifier le mot de passe.")))
      .finally(() => { button.disabled = false; });
    return;
  }
  if (event.target.id === "profile-update-form") {
    event.preventDefault();
    const name = String(new FormData(event.target).get("name") || "").trim();
    if (name.length < 2) { showToast("Le pseudo doit contenir au moins deux caractères."); return; }
    if (typeof window.updateMosaqueName !== "function") { showToast("Authentification indisponible."); return; }
    const button = $("button[type='submit']", event.target);
    button.disabled = true;
    window.updateMosaqueName(name)
      .then(() => showToast("Pseudo mis à jour."))
      .catch(err => showToast(authErrorMessage(err, "Impossible de modifier le pseudo.")))
      .finally(() => { button.disabled = false; });
    return;
  }
  if (event.target.id === "premium-code-form") {
    event.preventDefault();
    const fd = new FormData(event.target);
    window.redeemPremiumCode?.(String(fd.get("code") || "").trim())
      .then(result => {
        showToast(result.testMode ? "Mode complet de test activé, sans paiement." : "Code Premium validé.");
        renderPage("abonnement", { immediate:true });
      })
      .catch(err => showToast(err.message || "Code Premium invalide."));
    return;
  }

  if (event.target.id === "job-description-form") {
    event.preventDefault();
    const form=event.target,fields=new FormData(form),field=name=>String(fields.get(name)||"").trim()||"À préciser avec RH / le manager";
    const content=[
      `FICHE DE POSTE — ${field("title")}`,
      `Structure / secteur : ${field("organization")}`,
      `Rattachement hiérarchique : ${field("reporting")}`,
      `Périmètre / équipe : ${field("team")}`,
      "",
      "FINALITÉ ET MISSIONS PRINCIPALES",
      field("missions"),
      "",
      "AUTONOMIE, DÉCISIONS ET DÉLÉGATIONS",
      field("authority"),
      "",
      "COMPÉTENCES, QUALIFICATIONS ET CONDITIONS",
      field("profile"),
      "",
      "À compléter avant validation : statut / convention, temps de travail, rémunération, moyens, liens fonctionnels, indicateurs, date et version.",
      "Document de travail à valider par les personnes compétentes. La fiche ne remplace pas le contrat de travail ni une délégation écrite."
    ].join("\n");
    const preview=$("#job-description-preview"); if(preview) { preview.value=content; preview.focus({preventScroll:true}); showToast("Brouillon de fiche de poste généré."); }
  }
});

function pageFromHash() {
  let page = "";
  try { page = decodeURIComponent(window.location.hash.slice(1)); } catch { page = ""; }
  return NAV.some(item => item.id === page) ? page : "accueil";
}
function authErrorMessage(error, fallback) {
  const messages = {
    "auth/invalid-credential": "Email ou mot de passe incorrect.",
    "auth/user-not-found": "Email ou mot de passe incorrect.",
    "auth/wrong-password": "Email ou mot de passe incorrect.",
    "auth/email-already-in-use": "Cette adresse email est déjà utilisée.",
    "auth/invalid-email": "L’adresse email est invalide.",
    "auth/weak-password": "Le mot de passe est trop faible.",
    "auth/network-request-failed": "Connexion réseau impossible. Vérifiez votre accès à Internet.",
    "auth/too-many-requests": "Trop de tentatives. Réessayez plus tard.",
    "auth/requires-recent-login": "Pour des raisons de sécurité, déconnectez-vous puis reconnectez-vous avant de modifier votre mot de passe.",
    "auth/configuration-not-found": "L’authentification Firebase n’est pas encore configurée pour cette application.",
    "auth/operation-not-allowed": "Cette méthode de connexion n’est pas activée pour cette application.",
    "auth/popup-closed-by-user": "Connexion Google annulée.",
    "auth/cancelled-popup-request": "Connexion Google annulée. Veuillez réessayer.",
    "auth/popup-blocked": "La fenêtre Google a été bloquée. Autorisez les fenêtres pop-up et réessayez.",
    "auth/unauthorized-domain": "Ce domaine n’est pas autorisé pour la connexion Firebase.",
    "auth/account-exists-with-different-credential": "Un compte existe déjà avec cette adresse. Connectez-vous avec votre méthode habituelle."
  };
  return messages[error?.code] || (error?.code ? fallback : error?.message || fallback);
}
function syncPageFromLocation() {
  const historyState = window.history?.state;
  if (historyState?.dialog) {
    routedHash = window.location.hash;
    if (!dialog.open && activeDialog) openDialog(activeDialog.kicker, activeDialog.content, { fromHistory:true });
    else if (!dialog.open && !activeDialog) {
      dialogHistoryActive = false;
      try { window.history?.replaceState({ ...historyState, dialog:false }, "", window.location.href); } catch {}
    }
    return;
  }
  if (dialog.open) closeDialog({ fromHistory:true });
  if (window.location.hash === routedHash) return;
  routedHash = window.location.hash;
  const nextIndex = historyState?.navigationIndex;
  const direction = Number.isInteger(nextIndex) && nextIndex > navigationIndex ? 1 : -1;
  if (Number.isInteger(nextIndex)) navigationIndex = nextIndex;
  renderPage(pageFromHash(), { fromHistory:true, restoreScrollY:historyState?.scrollY ?? null, direction });
}
function initNavigation() {
  window.addEventListener("popstate", syncPageFromLocation);
  window.addEventListener("hashchange", syncPageFromLocation);
  const initialPage = pageFromHash();
  if (!window.location.hash) {
    try {
      window.history?.replaceState({ page:initialPage, scrollY:window.scrollY || 0 }, "", "#accueil");
      routedHash = window.location.hash;
    } catch {
      try { window.location.hash = "#accueil"; routedHash = window.location.hash; }
      catch { /* Le fichier local reste navigable sans URL profonde. */ }
    }
  }
  renderPage(initialPage, { immediate:true, fromHistory:true, restoreScrollY:window.history?.state?.scrollY ?? 0 });
}

let initialAlumniSyncDone = false;
let initialPostsSyncDone = false;
const knownPeerKeys = new Set();
const knownPostIds = new Set();
const knownCommentIds = new Set();

function initFirestoreSync() {
  let attempts = 0;
  const poll = () => {
    attempts++;
    if (typeof window.subscribeToAlumni === "function") {
      // Subscribe to alumni
      window.subscribeToAlumni((remoteAlumni) => {
        if (remoteAlumni && remoteAlumni.length) {
          const map = new Map(state.peers.map(p => [p.email || p.id, p]));
          remoteAlumni.forEach(r => map.set(r.email || r.id, { ...map.get(r.email || r.id), ...r }));
          state.peers = Array.from(map.values()).sort((a,b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
          writeJSON(STORE.peers, state.peers);
          if (state.page === "reseau") renderPeerList();

          // Notifications temps réel pour les alumni
          if (!initialAlumniSyncDone) {
            remoteAlumni.forEach(r => knownPeerKeys.add(r.email || r.id));
            initialAlumniSyncDone = true;
          } else {
            remoteAlumni.forEach(r => {
              const key = r.email || r.id;
              if (!knownPeerKeys.has(key)) {
                knownPeerKeys.add(key);
                const joinTime = r.createdAt ? new Date(r.createdAt).getTime() : 0;
                const isLive = joinTime && (Date.now() - joinTime < 180000) && (joinTime > pageLoadTime);
                const myUid = currentUserUid();
                const isMe = (myUid && r.authorUid === myUid) || (state.auth?.profile?.email && r.email === state.auth.profile.email);
                if (isLive && !isMe) {
                  dispatchNotification({
                    id: `notif-alumni-join-${r.id}`,
                    title: "Nouveau membre dans le réseau",
                    text: `${r.name} (${r.role || "Alumni"}) a rejoint la promotion${r.region ? ` (${r.region})` : ""}.`,
                    icon: "users",
                    targetNav: "reseau",
                    targetPeerId: r.id,
                    targetUid: "all",
                    authorUid: r.authorUid || r.email || "",
                    date: "À l'instant"
                  }, { silentToast: false, animate: true });
                }
              }
            });
          }
        }
      }, () => {
        // Mode silencieux : règles de sécurité en attente de déploiement
      });

      // Subscribe to posts (real-time)
      if (typeof window.subscribeToPostsFirestore === "function") {
        window.subscribeToPostsFirestore((remotePosts) => {
          const localById = new Map((state.posts || []).map(p => [p.id, p]));
          const remoteIds = new Set(remotePosts.map(p => p.id));
          const merged = remotePosts.map(r => ({ ...localById.get(r.id), ...r, isLiked: localById.get(r.id)?.isLiked === true }));
          // Le serveur fait foi : une publication distante absente du flux a été supprimée.
          const localOnly = (state.posts || []).filter(p => !remoteIds.has(p.id) && !p.isRemote);
          state.posts = [...merged, ...localOnly].sort((a,b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
          writeJSON(STORE.posts, state.posts);
          if (state.page === "timeline") refreshFeed();

          // Notifications temps réel pour les publications et commentaires
          if (!initialPostsSyncDone) {
            remotePosts.forEach(r => {
              knownPostIds.add(r.id);
              (r.comments || []).forEach(c => knownCommentIds.add(c.id));
            });
            initialPostsSyncDone = true;
          } else {
            remotePosts.forEach(r => {
              if (!knownPostIds.has(r.id)) {
                knownPostIds.add(r.id);
                const postTime = r.createdAt ? new Date(r.createdAt).getTime() : 0;
                const isLive = postTime && (Date.now() - postTime < 180000) && (postTime > pageLoadTime);
                const myUid = currentUserUid();
                const isMine = myUid && (r.authorUid === myUid || r.author?.uid === myUid);
                if (isLive && !isMine) {
                  const typeLabel = r.type === "event" ? "Nouvel événement" : r.type === "job_offer" ? "Nouvelle offre d'emploi" : "Nouvelle annonce";
                  dispatchNotification({
                    id: `notif-post-${r.id}`,
                    title: `${typeLabel} : ${r.title}`,
                    text: `Publié par ${r.authorName || r.author?.name || "Membre Alumni"} · ${r.organization || "Réseau Santé"}`,
                    icon: r.type === "event" ? "calendar" : r.type === "job_offer" ? "briefcase" : "message",
                    targetNav: "timeline",
                    targetPostId: r.id,
                    targetUid: "all",
                    authorUid: r.authorUid || r.author?.uid || "",
                    date: "À l'instant"
                  }, { silentToast: false, animate: true });
                }
              }

              // Vérification des commentaires entrants
              (r.comments || []).forEach(c => {
                if (!knownCommentIds.has(c.id)) {
                  knownCommentIds.add(c.id);
                  const commentTime = c.createdAt ? new Date(c.createdAt).getTime() : 0;
                  const isLive = commentTime && (Date.now() - commentTime < 180000) && (commentTime > pageLoadTime);
                  const myUid = currentUserUid();
                  const isMyPost = Boolean(myUid && (r.authorUid === myUid || r.author?.uid === myUid));
                  if (isLive && isMyPost && c.authorUid !== myUid) {
                    const isRsvp = c.participation && c.participation !== "none";
                    dispatchNotification({
                      id: `notif-comment-received-${c.id}`,
                      title: isRsvp ? "Nouvelle participation à votre événement" : "Nouveau commentaire sur votre publication",
                      text: `${c.authorName} : ${c.text ? `« ${c.text.slice(0, 65)} »` : (PARTICIPATION_CHOICES[c.participation]?.label || "A répondu")} (« ${r.title} »)`,
                      icon: isRsvp ? "calendar" : "message",
                      targetNav: "timeline",
                      targetPostId: r.id,
                      targetUid: myUid,
                      authorUid: c.authorUid || "",
                      date: "À l'instant"
                    }, { silentToast: false, animate: true });
                  }
                }
              });
            });
          }
        }, () => {
          // Mode silencieux : règles de sécurité posts en attente
        });
      }
    } else if (attempts < 10) {
      setTimeout(poll, 300);
    }
  };
  poll();
}

function initTheme() {
  const theme = readStoredValue(STORE.theme);
  if (theme === "light" || theme === "dark") document.documentElement.dataset.theme=theme;
  const toggle = $(".theme-toggle"); if (toggle) toggle.innerHTML = icon(document.documentElement.dataset.theme === "dark" ? "sun" : "moon");
  $("meta[name='theme-color']")?.setAttribute("content", document.documentElement.dataset.theme === "dark" ? "#0b1420" : "#f3f7f7");
}
function initPlatformHints() {
  const shortcut = $("#search-shortcut");
  if (!shortcut) return;
  const platform = navigator.userAgentData?.platform || navigator.platform || "";
  shortcut.textContent = /mac|iphone|ipad|ipod/i.test(platform) ? "⌘ K" : "Ctrl K";
}
function initServiceWorker() {
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
    navigator.serviceWorker.register("./sw.js").catch(error => console.warn("Service worker indisponible :", error));
  }
}

initTheme();
initPlatformHints();
bindDialogGestures();
initNavigation();
initServiceWorker();
ensureStarterNotifications();
updateNotifBadge();
initFirestoreSync();
syncMicroAdVisibility();
const authStatusTimer = setTimeout(() => {
  $("#auth-status").textContent = "Authentification indisponible ou trop lente. Vérifiez votre connexion et rechargez la page.";
}, 12000);
function queueOnboarding(uid) {
  pendingOnboardingUid = uid;
  if (!writeStoredValue(ONBOARDING_KEY, uid)) showToast("Cette étape ne pourra pas être reprise après rechargement sur cet appareil.");
}
function finishAuthFlow() {
  authFlowPending = false;
  if (pendingAuthState) {
    const detail = pendingAuthState;
    pendingAuthState = null;
    applyAuthState(detail);
  }
}
function finishOnboarding() {
  try { localStorage.removeItem(ONBOARDING_KEY); }
  catch { showToast("Impossible de mémoriser la fin de cette étape sur cet appareil."); }
  pendingOnboardingUid = null;
  state.onboarding = false;
  peerMultiSelect.selected.clear();
  peerMultiSelect.isOpen = false;
  renderPage("accueil", { immediate:true });
}
function applyAuthState({ user, premium }) {
  if (authFlowPending) {
    pendingAuthState = { user, premium };
    return;
  }
  clearTimeout(authStatusTimer);
  if (!user && unlockTimer) {
    clearTimeout(unlockTimer);
    unlockTimer = 0;
    unlockState = null;
    unlockRequested = false;
    $("#auth-lock").classList.remove("is-unlocked");
    document.body.classList.remove("auth-leaving");
    setAuthBusy(false);
  }
  if (user && unlockRequested && !document.body.classList.contains("is-authenticated") && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    unlockState = { user, premium };
    if (!unlockTimer) {
      $("#auth-lock").classList.add("is-unlocked");
      $("#auth-status").textContent = "Connexion réussie…";
      setAuthBusy(true);
      unlockTimer = setTimeout(() => {
        document.body.classList.add("auth-leaving");
        unlockTimer = setTimeout(() => {
          unlockTimer = 0;
          const detail = unlockState;
          unlockState = null;
          unlockRequested = false;
          setAuthBusy(false);
          if (window.firebaseAuth?.currentUser?.uid === detail.user.uid) {
            applyAuthState(detail);
            [$(".main-column"), sidebar, $(".bottom-nav")].forEach(element => {
              element?.animate?.([{ opacity:.25 }, { opacity:1 }], { duration:1000, easing:"cubic-bezier(.18,.72,.23,1)" });
            });
          } else {
            $("#auth-lock").classList.remove("is-unlocked");
            $("#auth-status").textContent = "Connexion interrompue. Veuillez réessayer.";
          }
          document.body.classList.remove("auth-leaving");
        }, 700);
      }, 1400);
    }
    return;
  }
  unlockRequested = false;
  if (!user) $("#auth-lock").classList.remove("is-unlocked");
  $("#auth-status").textContent = user ? "" : authMessage;
  const wasAuthenticated = document.body.classList.contains("is-authenticated");
  document.body.classList.toggle("is-authenticated", Boolean(user));
  if (user) {
    document.body.classList.remove("auth-open");
  }
  if (user && !wasAuthenticated) {
    $("#welcome-signin-form").reset();
    $("#welcome-signup-form").reset();
  }
  const codeActive = Boolean(user) && readStoredValue(STORE.premiumCode) === "1";
  const premiumActive = premium === true || codeActive;
  state.auth = {
    isUnlocked: premiumActive,
    verifiedPaid: premiumActive,
    plan: premiumActive ? "premium-active" : "freemium",
    profile: user ? {
      uid: user.uid,
      name: user.displayName || "",
      email: user.email || "",
      emailVerified: user.emailVerified === true
    } : {}
  };
  const wasOnboarding = state.onboarding;
  state.onboarding = Boolean(user?.uid && (pendingOnboardingUid === user.uid || readStoredValue(ONBOARDING_KEY) === user.uid));
  writeJSON(STORE.auth, state.auth);
  updateNotifBadge();
  if (state.notifsOpen) renderNotifPopoverContent();
  const avatar = $(".avatar-button");
  if (avatar) avatar.textContent = (user?.displayName || user?.email || "M").trim().charAt(0).toUpperCase();
  document.documentElement.classList.toggle("is-premium-user", premium === true);
  syncMicroAdVisibility();
  if (!user && wasAuthenticated) {
    if (sidebar.classList.contains("is-open")) closeMenu();
    if (dialog.open) {
      dialogAnimation?.cancel();
      dialogAnimation = null;
      dialog.close();
      dialogHistoryActive = false;
      activeDialog = null;
    }
    try {
      window.history.replaceState({ page:"accueil", scrollY:0 }, "", "#accueil");
      routedHash = window.location.hash;
    } catch (error) {
      console.warn("Impossible de mettre à jour l’adresse après la déconnexion :", error);
    }
    renderPage("accueil", { immediate:true, fromHistory:true, restoreScrollY:0 });
  } else if (state.onboarding && !wasOnboarding) {
    renderPage("inscription-annuaire", { immediate:true });
  } else if (!state.onboarding && ["compte","abonnement","metiers","rh","secu","carte","reseau","inscription-annuaire","timeline","audit","inspection-ars","changement-direction","glossaire"].includes(state.page)) {
    renderPage(state.page, { immediate:true });
  }
  if (!user && wasAuthenticated) {
    showToast("Déconnexion effectuée. Vous êtes en mode découverte.");
  }
}
window.addEventListener("mosaique-auth-change", event => applyAuthState(event.detail || {}));
if (window.mosaiqueAuthState) applyAuthState(window.mosaiqueAuthState);
})();
