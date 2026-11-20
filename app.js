(() => {
"use strict";

const { ACTORS, CONVENTIONS, DOCUMENTS, ESTABLISHMENTS, FAQ, JOBS, MAP_EDGES, MAP_NODES, MEETINGS, NAV, RESEARCH_AREAS, SOFTWARES, SOURCES, QUALITY_TOOLS, ADVERSE_EVENTS, SUPPORT_JOBS, REX_GUIDE, HEALTH_POLICY, SAMPLE_PEERS, AUDIT_GUIDE, SECURITY_SOCIALE, PRICING_DATA, TIMELINE_POSTS, SAMPLE_NOTIFICATIONS } = window.MOSAQUE_DATA;

let motionApi = null;
const loadMotionEnhancement = () => import("https://cdn.jsdelivr.net/npm/motion@14.14.0/+esm")
  .then(api => { motionApi = api; })
  .catch(() => { /* Les animations Web Animations API prennent le relais hors ligne. */ });
if ("requestIdleCallback" in window) window.requestIdleCallback(loadMotionEnhancement, { timeout:1800 });
else window.setTimeout(loadMotionEnhancement, 700);

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const stage = $("#page-stage");
const sidebar = $("#sidebar");
const dialog = $("#app-dialog");
const dialogContent = $("#dialog-content");
const dialogKicker = $("#dialog-kicker");
const toastEl = $("#toast");
const STORE = { theme:"mosaique-theme", favorites:"mosaique-favorites", checks:"mosaique-doc-checks", peers:"mosaique-peers", auth:"mosaique-auth", posts:"mosaique-posts", rsvps:"mosaique-rsvps", notifs:"mosaique-notifs" };
let pageTransitionToken = 0;
let pageTransitionDirection = 0;
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
  queries: { establishments:"", jobs:"", meetings:"", documents:"", actors:"", faq:"", software:"", peers:"", supportJobs:"", qualityTools:"", laws:"" },
  favorites: readJSON(STORE.favorites, []),
  docChecks: readJSON(STORE.checks, {}),
  peers: readJSON(STORE.peers, []),
  mapFilter: "Tout",
  auth: readJSON(STORE.auth, { isUnlocked: true, plan: "universal", role: "dirigeant" }),
  posts: readJSON(STORE.posts, []),
  rsvps: readJSON(STORE.rsvps, {}),
  notifs: readJSON(STORE.notifs, []),
  editingPeerId: null,
  notifsOpen: false,
  timelineComposeType: "job_offer",
  selectedMapNode: "direction",
  mapPositions: createInitialMapPositions(),
  mapRotation: { x:8, y:352, z:0 },
  mapPerspective: 1050,
  mapSceneDepth: 0,
  mapZoom: 1,
  mapPan: { x:0, y:0 },
  mapGesture: "rotate",
  toastTimer: 0
};

function isPremiumUnlocked() {
  return Boolean(state.auth && state.auth.isUnlocked);
}

function unlockApp(plan = "universal", details = {}) {
  state.auth = {
    isUnlocked: true,
    plan,
    unlockedAt: new Date().toISOString(),
    ...details
  };
  writeJSON(STORE.auth, state.auth);
  showToast("👑 Accès universel débloqué avec succès !");
  renderPage(state.page);
}

function lockAppFreemium() {
  state.auth = {
    isUnlocked: false,
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
      <span class="tag ${isUnlocked ? 'mint' : 'gold'}">${isUnlocked ? '👑 Accès Universel Actif (100% Débloqué)' : 'Mode Freemium (55% Accessible)'}</span>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      ${isUnlocked
        ? `<button class="button tiny subtle" data-action="toggle-freemium-test">${icon("lock", 12)}Tester la vue Freemium (55%)</button>`
        : `<button class="button tiny primary" data-action="quick-unlock-universal">${icon("spark", 12)}Débloquer l'accès universel</button>`}
      <button class="button tiny subtle" data-nav="abonnement">${icon("star", 12)}Gérer l'abonnement</button>
    </div>
  </div>`;
}

function paywallGate(title = "Ressource réservée aux abonnés", description = "Ce module approfondi fait partie des 45% de contenus spécialisés du campus (fiches de direction, méthodologies HAS, déclarations ARS et annuaire). Accessible dès 19 €/an pour les étudiants ou 59 €/an en Pass Pro.", previewHtml = "") {
  return `<div class="paywall-wrapper">
    ${previewHtml ? `<div class="paywall-blur" aria-hidden="true">${previewHtml}</div>` : ''}
    <div class="paywall-overlay">
      <div class="paywall-box">
        <span class="paywall-badge">${icon("lock", 13)} Ressource Premium (Campus MES)</span>
        <h3>${esc(title)}</h3>
        <p>${esc(description)}</p>
        <div class="paywall-actions">
          <button class="button primary" data-nav="abonnement">${icon("star", 15)}Découvrir les offres (dès 19 €/an)</button>
          <button class="button subtle" data-action="prompt-universal-key">${icon("spark", 15)}Entrer mon code d'accès maître</button>
        </div>
      </div>
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
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${paths[name] || paths.info}</svg>`;
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
  return groups.map(group => `<div class="nav-group"><div class="nav-heading">${esc(group)}</div>${NAV.filter(item => item.group === group).map(item => `<button class="nav-link${state.page === item.id ? " is-active" : ""}" data-nav="${item.id}"${state.page === item.id ? ' aria-current="page"' : ""}><span class="nav-icon">${icon(item.icon)}</span><span>${esc(item.label)}</span>${item.id === "etablissements" ? `<span class="nav-count">${ESTABLISHMENTS.length}</span>` : ""}</button>`).join("")}</div>`).join("");
}
function syncNavigation() {
  $("#desktop-nav").innerHTML = navMarkup();
  $$('.bottom-link').forEach(link => {
    const toolsPage = ["reunions","documents","rh","logiciels","qualite","rex","audit","politique","timeline"].includes(state.page);
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
function renderPage(page = state.page, { immediate = false, fromHistory = false, restoreScrollY = null } = {}) {
  if (!NAV.some(item => item.id === page)) page = "accueil";
  if (!fromHistory && page !== state.page) {
    pageScrollPositions.set(state.page, window.scrollY || 0);
    try {
      window.history?.replaceState({ ...(window.history.state || {}), page:state.page, scrollY:window.scrollY || 0 }, "", window.location.href);
      window.history?.pushState({ page, scrollY:0 }, "", `#${page}`);
      routedHash = window.location.hash;
    } catch {
      try { window.location.hash = `#${page}`; routedHash = window.location.hash; }
      catch { /* La page reste navigable même sans historique du navigateur. */ }
    }
  }
  pageTransitionDirection = immediate ? 0 : fromHistory ? -1 : 1;
  const transitionToken = ++pageTransitionToken;
  const currentPage = $(".page", stage);
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const replacePage = () => {
    if (transitionToken !== pageTransitionToken) return;
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
      logiciels:renderSoftware,
      carte:renderMap,
      reseau:renderNetwork,
      timeline:renderTimeline,
      qualite:renderQuality,
      rex:renderRex,
      politique:renderHealthPolicy,
      "metiers-support":renderSupportJobs,
      audit:renderAudit,
      secu:renderSecu,
      abonnement:renderSubscription
    };
    stage.innerHTML = (renderers[page] || renderHome)();
    hydrateIcons(stage);
    attachPageHandlers();
    animateIn();
    if (page === "carte") {
      startMapScene();
      updateMapSelection();
    }
    if (page === "reseau") {
      renderPeerList();
      peerMultiSelect.init();
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
      window.scrollTo({ top:0, behavior:reduceMotion ? "auto" : "smooth" });
    }
  };

  if (document.startViewTransition && !immediate && !reduceMotion) {
    document.startViewTransition(() => {
      replacePage();
    });
    return;
  }

  if (!currentPage || immediate || reduceMotion || typeof currentPage.animate !== "function") {
    replacePage();
    return;
  }
  const exit = currentPage.animate(
    [{ opacity:1, transform:"translate3d(0,0,0) scale(1)" }, { opacity:0, transform:`translate3d(${pageTransitionDirection > 0 ? -8 : 8}px,0,0) scale(.997)` }],
    { duration:115, easing:"cubic-bezier(.4,0,1,1)", fill:"forwards" }
  );
  exit.onfinish = replacePage;
}
function animateIn() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const page = $(".page", stage);
  const cards = $$(".content-card, .tool-card, .guide-card, .convention-card, .software-card, .etp-source-card, .peer-card, .actor-card", stage).slice(0,14);
  if (motionApi?.animate) {
    if (page) motionApi.animate(page, { opacity:[0,1], x:[pageTransitionDirection * 11,0], y:[pageTransitionDirection === 0 ? 4 : 0,0], scale:[.997,1] }, { duration:.28, ease:"easeOut" });
    if (cards.length && motionApi.stagger) motionApi.animate(cards, { opacity:[0,1], y:[7,0] }, { duration:.23, delay:motionApi.stagger(.025), ease:"easeOut" });
    return;
  }
  if (page?.animate) page.animate(
    [{ opacity:0, transform:`translate3d(${pageTransitionDirection * 11}px,${pageTransitionDirection === 0 ? 4 : 0}px,0) scale(.997)` }, { opacity:1, transform:"translate3d(0,0,0) scale(1)" }],
    { duration:280, easing:"cubic-bezier(.18,.72,.23,1)" }
  );
  cards.forEach((card, index) => card.animate?.(
    [{ opacity:0, transform:"translate3d(0,7px,0)" }, { opacity:1, transform:"translate3d(0,0,0)" }],
    { duration:230, delay:index * 25, easing:"cubic-bezier(.18,.72,.23,1)" }
  ));
}

function renderHome() {
  const saved = state.favorites.length;
  return `<section class="page page-home" aria-labelledby="home-title">
    ${renderAccessStatusBar()}
    <div class="hero" data-visual>
      <div class="hero-copy"><span class="eyebrow">VOTRE CAMPUS DE MANAGEMENT EN SANTÉ</span><h1 id="home-title">Comprendre le système.<br><em>Mieux piloter le quotidien.</em></h1><p class="lede">Des repères concrets pour les managers du sanitaire, du social et du médico-social — avec un focus sur votre parcours Master MES et l’expérience de terrain en MAS.</p><div class="hero-actions">${navButton("etablissements","Explorer les établissements","building")}<button class="button subtle" data-nav="carte">${icon("network",16)}Voir les interactions</button></div></div>
      <div class="hero-art"><div class="hero-orbit" role="group" aria-label="Raccourcis vers les équipes, la qualité, les outils et les partenaires"><div class="orbit-ring one"></div><div class="orbit-ring two"></div><div class="orbit-ring three"></div><div class="orbit-center">${icon("layers",26)}<strong>DIRECTION</strong><small>AU CENTRE DU<br>SYSTÈME</small></div><button class="orbit-node n1" data-nav="metiers" aria-label="Ouvrir les métiers et les équipes" title="Métiers et équipes">${icon("users",20)}<small>ÉQUIPES</small></button><button class="orbit-node n2" data-nav="documents" aria-label="Ouvrir les repères qualité" title="Qualité et documents">${icon("shield",20)}<small>QUALITÉ</small></button><button class="orbit-node n3" data-nav="documents" aria-label="Ouvrir les outils et documents" title="Outils et documents">${icon("file",20)}<small>OUTILS</small></button><button class="orbit-node n4" data-nav="acteurs" aria-label="Ouvrir les partenaires" title="Acteurs et partenaires">${icon("network",20)}<small>PARTENAIRES</small></button></div><p class="hero-caption">Une vision reliée aux parcours</p></div>
    </div>
    
    <div class="onboarding-banner glass-panel">
      <div class="onboarding-head">
        <span class="icon-bubble" style="background:rgba(98, 222, 184, 0.15);color:var(--mint);padding:8px">${icon("spark", 22)}</span>
        <div>
          <h2>Bienvenue sur Mosaïque Santé · Votre guide de démarrage rapide</h2>
          <p>Conçue pour les futurs dirigeants, directeurs adjoints, cadres de santé et responsables qualité du secteur sanitaire et médico-social.</p>
        </div>
      </div>
      <div class="onboarding-grid">
        <div class="onboarding-card">
          <span class="onboarding-num">1</span>
          <div>
            <h3>Comprendre les structures & leurs flux</h3>
            <p>Explorez les 12 types d'établissements (MAS, EHPAD, CH, IME), le fonctionnement de la Sécurité Sociale (les 5 branches, l'ONDAM) et les mécanismes de tarification (T2A, forfaits soins, CPOM).</p>
          </div>
        </div>
        <div class="onboarding-card">
          <span class="onboarding-num">2</span>
          <div>
            <h3>Maîtriser les métiers & leurs coopérations</h3>
            <p>Consultez les 40+ fiches de postes détaillées (Direction, Qualité, Soignants AS/IDE, Éducatif, Paramédical, RH, Compta) avec leurs interactions croisées au quotidien et marges de décision.</p>
          </div>
        </div>
        <div class="onboarding-card">
          <span class="onboarding-num">3</span>
          <div>
            <h3>Rejoindre la communauté & les événements</h3>
            <p>Accédez à l'annuaire des diplômés alumni, publiez ou postulez à des offres de stage/alternance, et confirmez votre participation aux événements et job datings inter-établissements.</p>
          </div>
        </div>
      </div>
    </div>

    <div class="dashboard-stats glass-panel" aria-label="Contenu de la boîte à outils">
      <div class="dashboard-stat"><div class="stat-icon">${icon("building",17)}</div><div><strong>${ESTABLISHMENTS.length}</strong><span>types de structures</span></div></div>
      <div class="dashboard-stat"><div class="stat-icon">${icon("briefcase",17)}</div><div><strong>${JOBS.length}</strong><span>pistes métiers</span></div></div>
      <div class="dashboard-stat"><div class="stat-icon">${icon("file",17)}</div><div><strong>${DOCUMENTS.length}</strong><span>documents repères</span></div></div>
      <div class="dashboard-stat"><div class="stat-icon">${icon("star",17)}</div><div><strong>${saved}</strong><span>fiches enregistrées</span></div></div>
    </div>
    <div class="dashboard-lower">
      <div class="quick-panel glass-panel"><div class="section-title-row"><div><h2>Où voulez-vous aller ?</h2><p>Accès direct aux repères les plus utiles.</p></div></div><div class="quick-grid">
        <button class="quick-tile" data-nav="secu"><span class="icon-bubble">${icon("shield")}</span><span><strong>Sécurité Sociale & Liens</strong><small>Les 5 branches, l'ONDAM, CPAM/CARSAT, tarification et flux financiers.</small></span></button>
        <button class="quick-tile" data-nav="abonnement"><span class="icon-bubble">${icon("spark")}</span><span><strong>Abonnement & Campus</strong><small>Pass étudiant 19 €, packs école et code d'accès maître universel.</small></span></button>
        <button class="quick-tile" data-nav="logiciels"><span class="icon-bubble">${icon("layers")}</span><span><strong>Logiciels métiers de santé</strong><small>DPI, DUI (NETSoins), AgEval, GMAO, SIRH, planning et MSSanté.</small></span></button>
        <button class="quick-tile" data-nav="qualite"><span class="icon-bubble">${icon("shield")}</span><span><strong>Qualité & Événements (AgEval)</strong><small>Niveaux d'EI (1 à 4), signalements ARS (e-SIN) et culture juste.</small></span></button>
        <button class="quick-tile" data-nav="audit"><span class="icon-bubble">${icon("target")}</span><span><strong>Audits qualité & méthodes</strong><small>À quoi ça sert, 6 typologies (traceurs, APC), méthode en 5 étapes.</small></span></button>
        <button class="quick-tile" data-nav="rex"><span class="icon-bubble">${icon("lightbulb")}</span><span><strong>Mener un REX / CREX</strong><small>Méthode en 6 étapes, grille ALARM, sécurité psychologique.</small></span></button>
        <button class="quick-tile" data-nav="metiers-support"><span class="icon-bubble">${icon("people")}</span><span><strong>Corps de métier support</strong><small>Gouvernante, ASH, ASL, maintenance, SI, logistique et guichet unique.</small></span></button>
        <button class="quick-tile" data-nav="politique"><span class="icon-bubble">${icon("clipboard")}</span><span><strong>Politique de santé & lois</strong><small>Loi 2002-2, 2005, Ségur, Bien Vieillir 2024, PRS 3 ARS et schémas départementaux.</small></span></button>
        <button class="quick-tile" data-nav="metiers"><span class="icon-bubble">${icon("briefcase")}</span><span><strong>Métiers & responsabilités</strong><small>Direction d'établissement, RQGR, CGRAS, D3S, CAFDES et encadrement.</small></span></button>
        <button class="quick-tile" data-nav="documents"><span class="icon-bubble">${icon("file")}</span><span><strong>Documents de pilotage</strong><small>EPRD, CPOM, DUERP, PAAQ : qui le produit et comment le faire vivre.</small></span></button>
        <button class="quick-tile" data-nav="reunions"><span class="icon-bubble">${icon("calendar")}</span><span><strong>Réunions & instances</strong><small>CODIR, COPIL Qualité, CVS, CSE, CREX : qui décide et qui associer.</small></span></button>
        <button class="quick-tile" data-nav="rh"><span class="icon-bubble">${icon("users")}</span><span><strong>Questions RH & calculateurs</strong><small>35+ FAQ droit du travail, calculs ETP/ETPT et forfait jours.</small></span></button>
      </div></div>
      <aside class="profile-card glass-panel"><span class="tag violet">PARCOURS MES</span><h3>Un profil hybride, ancré dans le terrain</h3><p>Les fiches métiers privilégient les passerelles entre direction, qualité, pilotage RH, budget et transformation numérique, avec une expérience de référence en MAS.</p><div class="profile-chip-row"><span class="tag mint">Qualité HAS</span><span class="tag sky">Pilotage RH</span><span class="tag gold">EPRD · CNR</span></div><button class="button subtle" data-nav="metiers">Voir les pistes adaptées ${icon("arrow",15)}</button></aside>
    </div>
    <div class="section-block"><div class="section-title-row"><div><h2>Les cinq repères d’un manager</h2><p>Une décision solide croise le vécu des personnes, les équipes, les obligations, les moyens et les partenaires.</p></div></div><div class="focus-row"><article class="focus-card glass-panel"><span class="eyebrow">01 · PERSONNES</span><h3>Partir de la personne accompagnée</h3><p>Relier le projet personnalisé, les droits, l’expression et la continuité du parcours.</p></article><article class="focus-card glass-panel"><span class="eyebrow">02 · ÉQUIPES</span><h3>Rendre l’organisation tenable</h3><p>Prévenir les risques, soutenir les collectifs et clarifier les rôles de décision.</p></article><article class="focus-card glass-panel"><span class="eyebrow">03 · PILOTAGE</span><h3>Relier les moyens aux résultats</h3><p>Lire budget, effectifs, qualité et activité ensemble ; demander un arbitrage au bon niveau.</p></article></div></div>
    <div class="section-block notice">${icon("info",18)}<span><strong>Repère de lecture.</strong> Les textes, autorisations, conventions, statuts et compétences territoriales changent le cadre applicable. Chaque fiche indique les vérifications à faire avant une décision de gestion.</span></div>
  </section>`;
}

function renderPills(group, values, selected) {
  return `<div class="pills" role="group" aria-label="Filtrer les résultats">${values.map(value => `<button class="pill${selected === value ? " is-selected" : ""}" data-filter-group="${group}" data-filter-value="${esc(value)}" aria-pressed="${selected === value}">${esc(value)}</button>`).join("")}</div>`;
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
    <div class="filter-bar"><label class="search-box"><span data-icon="search"></span><input class="form-control" id="establishment-query" type="search" placeholder="Nom, public, mission, métier…" autocomplete="off" aria-label="Rechercher un établissement"></label><span class="filter-count" id="establishment-count" aria-live="polite"></span></div>
    ${renderPills("establishments", families, state.filters.establishments)}
    <div class="section-block"><div class="result-grid" id="establishment-results">${establishmentCards()}</div></div>
  </section>`;
}
function jobCards(list = JOBS) {
  if (!list.length) return `<div class="empty-state"><strong>Aucune piste correspondante</strong>Essayez un autre domaine ou un mot-clé.</div>`;
  const isUnlocked = isPremiumUnlocked();
  return list.map((item,index) => `<article class="content-card job-card"><button class="card-hit" data-action="open-job" data-id="${esc(item.id)}">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
      <span class="tag ${tagColor(item.sector)} level-tag">${esc(item.level)}</span>
      ${item.isPremium && !isUnlocked ? `<span class="tag gold" style="display:inline-flex;align-items:center;gap:4px;font-size:10px">${icon("lock",11)} Premium</span>` : ''}
    </div>
    <div class="card-top"><div><h3>${esc(item.name)}</h3><p class="card-copy">${esc(item.placement)}</p></div></div>
    <div class="meta-row"><span class="tag ${tagColor(item.sector)}">${esc(item.sector)}</span><span class="meta-label">Piste ${String(index+1).padStart(2,"0")}</span></div>
    <div class="card-foot"><span>Responsabilités et déclinaisons</span>${icon("arrow-up-right",13)}</div>
  </button></article>`).join("");
}
function renderJobs() {
  const sectors = ["Tout", ...new Set(JOBS.map(item => item.sector))];
  return `<section class="page" aria-labelledby="jobs-title">
    ${renderAccessStatusBar()}
    ${sectionHead("VOTRE PARCOURS · MASTER MES", "Des responsabilités <span class=\"text-gradient\">à votre portée.</span>", "Une cartographie de postes cohérente avec le Master Management des établissements de santé, une expérience d’adjoint de direction en MAS et un profil qualité / RH / gestion / transformation.", `<button class="button subtle" data-action="open-profile-note">${icon("spark",16)}Lire le cadrage</button>`)}
    <div class="notice">${icon("info",18)}<span><strong>Le diplôme ouvre des pistes, il ne confère pas une délégation.</strong> Les postes, qualifications requises, voies d’accès publiques et personnes encadrées dépendent du statut, du texte applicable, de l’employeur et de la fiche de poste.</span></div>
    <div class="filter-bar"><label class="search-box"><span data-icon="search"></span><input class="form-control" id="job-query" type="search" placeholder="Poste, décision, équipe…" aria-label="Rechercher un métier"></label></div>
    ${renderPills("jobs", sectors, state.filters.jobs)}
    <div class="jobs-layout section-block"><div class="job-grid" id="job-results">${jobCards()}</div><aside class="job-side glass-panel"><span class="eyebrow">LIRE L’ORGANIGRAMME</span><h3 style="margin-top:12px">Le pouvoir suit la délégation</h3><div class="org-chain"><div class="org-node">Personne morale · conseil / gestionnaire</div><i class="org-connector"></i><div class="org-node focus">Direction d’établissement</div><i class="org-connector"></i><div class="org-node">Adjoint·e / directions fonctionnelles</div><i class="org-connector"></i><div class="org-node">Chefs de service · cadres de proximité</div><i class="org-connector"></i><div class="org-node">Professionnels et équipes</div></div><p class="small-note">Les liens fonctionnels (qualité, finances, RH, projets) traversent cette ligne hiérarchique sans créer automatiquement de responsabilité directe.</p><div class="source-links">${sourceLinks(["iae","d3s","dh","cafdes"])}</div></aside></div>
    <div class="section-block"><div class="section-title-row"><div><h2>Points à vérifier avant une candidature</h2><p>La réalité du poste tient dans ses délégations, son équipe et son régime d’emploi.</p></div></div><div class="focus-row"><article class="focus-card glass-panel"><span class="eyebrow">STATUT</span><h3>Public, associatif, privé</h3><p>Concours/statut, convention collective, employeur et autorité de rattachement changent les marges de manœuvre.</p></article><article class="focus-card glass-panel"><span class="eyebrow">PÉRIMÈTRE</span><h3>Hiérarchique ou transversal</h3><p>Demandez qui vous reporte, qui vous évalue et qui tranche un désaccord de ressources ou de soins.</p></article><article class="focus-card glass-panel"><span class="eyebrow">DÉLÉGATION</span><h3>Décisions réellement confiées</h3><p>Vérifiez budget délégué, actes RH, astreintes, signatures et responsabilités en cas d’incident.</p></article></div></div>
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
    <div class="filter-bar"><label class="search-box"><span data-icon="search"></span><input class="form-control" id="meeting-query" type="search" placeholder="Sigle, objectif, participants…" aria-label="Rechercher une réunion"></label></div>
    ${renderPills("meetings", kinds, state.filters.meetings)}<div class="section-block meeting-grid" id="meeting-results">${meetingCards()}</div>
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
    <div class="filter-bar"><label class="search-box"><span data-icon="search"></span><input class="form-control" id="document-query" type="search" placeholder="Nom, date, responsable, usage…" aria-label="Rechercher un document"></label><span class="filter-count" id="document-check-count">${checked} repère${checked === 1 ? "" : "s"} coché${checked === 1 ? "" : "s"}</span></div>
    ${renderPills("documents", cats, state.filters.documents)}
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
    <div class="filter-bar"><label class="search-box"><span data-icon="search"></span><input class="form-control" id="actor-query" type="search" placeholder="Acteur, rôle, appui, financement…" aria-label="Rechercher un acteur"></label></div>
    ${renderPills("actors", types, state.filters.actors)}<div class="section-block actor-grid" id="actor-results">${actorCards()}</div>
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
  return `<article class="tool-card glass-panel calculator-card" id="outil-etp"><div class="tool-card-head"><span class="icon-bubble">${icon("chart",17)}</span><div><span class="eyebrow">CALCULATEUR INTERACTIF</span><h2>ETP & ETPT</h2></div></div><p class="tool-intro">Séparez la quotité des contrats actifs à une date de leur présence annualisée.</p>
    <div class="form-grid etp-current-grid"><label><span class="field-label">Heures contractuelles hebdomadaires des salariés avec contrat actif à la date</span><input id="etp-active-hours" class="form-control" type="number" min="0" max="100000" step="0.25" value="0"><span class="field-hint">Additionnez les quotités contractualisées à cette date ; absences et présence planifiable se suivent à part.</span></label><label><span class="field-label">Référence hebdomadaire temps plein</span><input id="etp-week-reference" class="form-control" type="number" min="1" max="60" step="0.25" value="35"><span class="field-hint">Remplacez 35 h si l’organisation applique une autre référence.</span></label></div>
    <div class="metric-strip"><div><span>ETP contractuels à la date</span><output id="etp-current-output" aria-live="polite">0,00</output></div><small>Heures contractuelles actives ÷ référence temps plein</small></div>
    <div class="etpt-heading"><div><h3>Calculer l’ETPT annuel</h3><p>Une ligne par quotité stable. Scindez une ligne si les heures changent en cours d’année.</p></div><button class="button subtle" type="button" data-action="add-etpt-row">${icon("userplus",15)}Ajouter une période</button></div>
    <div class="etpt-lines" id="etpt-lines">${etptLine(0)}${etptLine(1)}</div>
    <div class="form-grid annual-reference"><label><span class="field-label">Heures annuelles à temps plein (facultatif)</span><input id="etp-annual-reference" class="form-control" type="number" min="1" max="3000" step="1" placeholder="Ex. selon votre accord"><span class="field-hint">Saisissez la référence annuelle de votre structure pour convertir en heures.</span></label><div class="metric-tile"><span>ETPT sur la période</span><output id="etpt-total-output" aria-live="polite">0,00</output><small id="etpt-hours-output">Renseignez une référence annuelle pour obtenir les heures.</small></div></div>
    <p class="formula-note"><strong>Formules :</strong> ETP = quotité des contrats actifs à la date ; ETPT = somme des (quotités × mois sous contrat ÷ 12). L’effectif physique compte des personnes, l’ETP mesure une quotité contractuelle à une date et l’ETPT pondère la présence sous contrat sur l’année. Les absences et la capacité réellement planifiable se suivent à part.</p>
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
  const reference=Number($("#etp-week-reference")?.value)||0;
  const activeHours=Number($("#etp-active-hours")?.value)||0;
  const etpOutput=$("#etp-current-output");
  if(etpOutput) etpOutput.value=reference>0?formatNumber(activeHours/reference):"—";
  let etpt=0;
  $$("[data-etpt-row]").forEach(row=>{
    const hours=Number($("[data-etpt-hours]",row)?.value)||0;
    const months=Math.min(12,Math.max(0,Number($("[data-etpt-months]",row)?.value)||0));
    if(reference>0) etpt+=(hours/reference)*(months/12);
  });
  const total=$("#etpt-total-output"); if(total) total.value=reference>0?formatNumber(etpt):"—";
  const annual=Number($("#etp-annual-reference")?.value)||0;
  const annualOut=$("#etpt-hours-output");
  if(annualOut) annualOut.textContent=annual>0?`${formatNumber(etpt*annual)} heures équivalent temps plein sur la période`:"Renseignez une référence annuelle pour obtenir les heures.";
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
  return `<section class="page" aria-labelledby="faq-title">${sectionHead("BOÎTE À OUTILS · RH & RECRUTEMENT", "Les bons repères RH, <span class=\"text-gradient\">calculés et prêts à l’emploi.</span>", "Conventions, temps de travail, recrutement et effectifs. Les règles dépendent du statut, de l’accord applicable, du calendrier de l’établissement et des délégations.", `<button class="button subtle" data-nav="logiciels">${icon("layers",16)}Logiciels métiers</button><button class="button subtle" data-action="open-sources">${icon("book",16)}Sources</button>`)}
    <div class="rh-tabs" role="tablist" aria-label="Sections RH">
      <button class="rh-tab is-active" data-action="rh-tab" data-rh-tab="calculateurs" role="tab" aria-selected="true">${icon("chart",14)} Calculateurs</button>
      <button class="rh-tab" data-action="rh-tab" data-rh-tab="conventions" role="tab" aria-selected="false">${icon("file",14)} Conventions</button>
      <button class="rh-tab" data-action="rh-tab" data-rh-tab="recrutement" role="tab" aria-selected="false">${icon("briefcase",14)} Recrutement</button>
      <button class="rh-tab" data-action="rh-tab" data-rh-tab="questions" role="tab" aria-selected="false">${icon("info",14)} Questions RH</button>
    </div>
    <div class="rh-tab-panel is-active" data-rh-panel="calculateurs">
      <div class="rh-calculator-grid section-block">${renderEtpCalculator()}${renderForfaitCalculator()}</div>
      <section class="section-block" id="etp-disponibles"><div class="section-title-row"><div><span class="eyebrow">OÙ CHERCHER LES MOYENS</span><h2>Retrouver les ETP réellement disponibles</h2><p>Le chiffre dépend de la question posée : autorisation, budget, postes pourvus ou présence réelle.</p></div></div><div class="etp-source-grid"><article class="etp-source-card"><strong>Emplois autorisés / financés</strong><span>Notifications de financement, CPOM, budget prévisionnel ou EPRD/ERRD selon le secteur et le cadre de l'établissement ; tableau d'emplois pour le public.</span></article><article class="etp-source-card"><strong>Postes pourvus</strong><span>Tableau des effectifs RH, contrats, quotités, paie et date d'arrêté. Déduire les vacances et distinguer les postes ouverts des personnes recrutées.</span></article><article class="etp-source-card"><strong>Capacité présente</strong><span>Planning, absences, restrictions, formation, intérim, heures supplémentaires, repos et compétences minimales nécessaires au service.</span></article><article class="etp-source-card"><strong>À rapprocher</strong><span>Budget RH, masse salariale, remplacements et ETP par service/métier. Faire valider les définitions par RH et finances avant de comparer.</span></article></div><p class="formula-note">Un poste budgété vacant n'est pas une personne disponible ; un effectif physique n'est pas une capacité équivalente temps plein. Documentez la date, le périmètre et la définition de chaque chiffre.</p>${sourceLinks(["etpGuide","cnsaData"])}</section>
    </div>
    <div class="rh-tab-panel" data-rh-panel="conventions">
      <section class="section-block" id="conventions"><div class="section-title-row"><div><span class="eyebrow">DROIT SOCIAL · REPÈRES DE BRANCHE</span><h2>Conventions et statuts courants</h2><p>Quelques repères fréquents ; le champ conventionnel de l'employeur doit toujours être confirmé.</p></div></div><div class="convention-grid">${renderConventionCards()}</div><div class="notice section-block">${icon("info",17)}<span><strong>Vérification pratique.</strong> Regardez l'intitulé et l'IDCC sur le bulletin de paie, recherchez l'employeur avec son SIRET, puis relisez le champ d'application, la convention consolidée, les avenants et les accords d'entreprise. L'APE est un indice, pas à lui seul la preuve de la convention applicable.</span></div>${sourceLinks(["collectiveAgreement"])}</section>
    </div>
    <div class="rh-tab-panel" data-rh-panel="recrutement">
      ${renderRecruitmentGuides()}
      ${renderJobDescriptionBuilder()}
    </div>
    <div class="rh-tab-panel" data-rh-panel="questions">
      <section class="section-block" id="faq-search"><div class="section-title-row"><div><span class="eyebrow">RÉPONSES COURTES · ${FAQ.length} REPÈRES</span><h2>Questions RH fréquentes</h2><p>Recherche par thème, sigle ou situation.</p></div></div><div class="faq-layout"><div><label class="search-box"><span data-icon="search"></span><input class="form-control" id="faq-query" type="search" placeholder="Convention, forfait jours, entretien, ETP…" aria-label="Rechercher une réponse RH"></label><div class="faq-list section-block" id="faq-results">${renderFaqList()}</div></div><aside class="faq-aside glass-panel"><span class="eyebrow">POSTURE DE MANAGER</span><h3>Écouter · cadrer · tracer</h3><p>Pour une situation individuelle, protégez la confidentialité, partez des faits, vérifiez le cadre applicable et sollicitez RH ou juridique au bon moment.</p><div class="separator"></div><span class="tag gold">Repères pédagogiques</span><p style="margin-top:10px">Ces réponses facilitent le premier repérage ; elles ne remplacent ni les textes à jour, ni les accords collectifs, ni une analyse individualisée par les personnes habilitées.</p>${sourceLinks(["duerp","cse","servicePublicWork"])}</aside></div></section>
    </div>  </section>`;
}
function softwareCards(list=SOFTWARES) {
  if(!list.length) return `<div class="empty-state"><strong>Aucun logiciel correspondant</strong>Essayez un autre terme ou un acronyme.</div>`;
  return list.map(item=>`<article class="software-card glass-panel"><div class="software-top"><span class="icon-bubble">${icon(item.group.includes("Ressources")?"users":item.group.includes("Pilotage")?"chart":item.group.includes("Dossier")?"file":item.group.includes("Échanges")?"shield":"layers",17)}</span><span class="tag ${tagColor(item.group)}">${esc(item.group)}</span></div><h3>${esc(item.name)}</h3><p>${esc(item.what)}</p><div class="software-example"><strong>Repère</strong><span>${esc(item.examples)}</span></div>${sourceLinks(item.sources || [item.source])}</article>`).join("");
}
function renderSoftware() {
  return `<section class="page" aria-labelledby="software-title">${sectionHead("BOÎTE À OUTILS · NUMÉRIQUE", "Les logiciels qui font tourner <span class=\"text-gradient\">les établissements.</span>", "Une carte des grandes familles d’outils sanitaires et médico-sociaux : à quoi ils servent, qui les utilise et ce qu’un manager doit vérifier avant un choix ou un déploiement.", `<button class="button subtle" data-action="open-sources">${icon("book",16)}Références</button>`)}
    <div class="notice">${icon("shield",17)}<span><strong>À garder en tête.</strong> Les noms de produits ci-dessous sont des exemples, pas un classement ni une recommandation. Les gammes évoluent ; vérifiez le référencement Ségur demandé, la sécurité, l’interopérabilité, les coûts complets et les conditions de sortie du contrat.</span></div>
    <div class="software-toolbar section-block"><label class="search-box"><span data-icon="search"></span><input id="software-query" class="form-control" type="search" placeholder="DPI, DUI, planning, paie, qualité…" aria-label="Rechercher un logiciel ou une famille"></label><span class="tag mint" id="software-count">${SOFTWARES.length} familles</span></div>
    <div class="software-grid section-block" id="software-results">${softwareCards()}</div>
    <section class="section-block software-selection"><div class="section-title-row"><div><span class="eyebrow">AVANT DE SIGNER</span><h2>La checklist d’un choix numérique</h2></div></div><div class="focus-row"><article class="focus-card glass-panel"><span class="eyebrow">USAGES</span><h3>Tester avec le terrain</h3><p>Associer soignants, équipes d’accompagnement, fonctions support, personnes accompagnées et représentants selon le projet.</p></article><article class="focus-card glass-panel"><span class="eyebrow">DONNÉES</span><h3>Protéger les accès</h3><p>Vérifier hébergement, habilitations par rôle, journalisation, sauvegardes, continuité et procédure de violation.</p></article><article class="focus-card glass-panel"><span class="eyebrow">DÉPLOIEMENT</span><h3>Prévoir l’après</h3><p>Chiffrer reprise et qualité des données, interfaces, formation, support, dépendances, réversibilité et temps métier nécessaire.</p></article></div>${sourceLinks(["ansSoftware","ansDui","mssante","viaTrajectoire"])}</section>
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
  const groups = ["Tout", ...new Set(MAP_NODES.map(node => node.type))];
  return `<section class="page" aria-labelledby="map-title">
    ${sectionHead("VUE SYSTÉMIQUE · CARTE 3D", "Qui demande quoi ? <span class='text-gradient'>Qui agit avec qui ?</span>", "Faites glisser le fond pour orbiter autour du réseau. Les bulles se déplacent indépendamment dans l’espace ; leurs textes restent lisibles et suivent chaque mouvement.", `<button class="button subtle" data-action="map-reset">${icon("reset",15)}Réinitialiser la vue</button>`)}
    <div class="map-layout">
      <div class="map-frame glass-panel">
        <div class="map-toolbar">${renderPills("map", groups, state.mapFilter)}<label class="meta-row map-zoom-label"><span class="meta-label">Zoom</span><input id="map-zoom" type="range" min="70" max="145" value="${Math.round(state.mapZoom * 100)}" aria-label="Zoom de la scène 3D"></label></div>
        <div class="map-controls" role="group" aria-label="Réglages de la scène en trois dimensions">
          <label class="map-control"><span>Inclinaison · X <output id="map-angle-x-output">${Math.round(state.mapRotation.x)}°</output></span><input id="map-rotate-x" type="range" min="0" max="360" value="${Math.round(state.mapRotation.x)}" aria-label="Incliner la scène sur l’axe X, rotation complète de 360 degrés"></label>
          <label class="map-control"><span>Orientation · Y <output id="map-angle-y-output">${Math.round(state.mapRotation.y)}°</output></span><input id="map-rotate-y" type="range" min="0" max="360" value="${Math.round(state.mapRotation.y)}" aria-label="Orienter la scène sur l’axe Y, rotation complète de 360 degrés"></label>
          <label class="map-control"><span>Profondeur · Z <output id="map-angle-z-output">${Math.round(state.mapRotation.z)}°</output></span><input id="map-rotate-z" type="range" min="0" max="360" value="${Math.round(state.mapRotation.z)}" aria-label="Tourner la scène autour de l’axe de profondeur Z, rotation complète de 360 degrés"></label>
          <label class="map-control"><span>Perspective <output id="map-depth-output">${state.mapPerspective} px</output></span><input id="map-depth" type="range" min="450" max="1800" step="50" value="${state.mapPerspective}" aria-label="Régler la profondeur de la perspective"></label>
          <label class="map-control"><span>Avancer / reculer · Z <output id="map-scene-depth-output">${state.mapSceneDepth}</output></span><input id="map-scene-depth" type="range" min="-220" max="220" value="${state.mapSceneDepth}" aria-label="Déplacer toute la carte vers l’avant ou l’arrière sur l’axe Z"></label>
          <button class="button subtle map-gesture-toggle" data-action="map-gesture" aria-pressed="${state.mapGesture === "rotate"}">${icon(state.mapGesture === "rotate" ? "rotate" : "move",15)}Mode : ${state.mapGesture === "rotate" ? "orbite" : "déplacement"}</button>
        </div>
        <div class="map-viewport${state.mapGesture === "pan" ? " is-panning" : ""}" id="map-viewport" role="region" aria-label="Carte en trois dimensions">${mapMarkup()}</div>
        <div class="map-legend"><span><i></i>Personnes & métiers</span><span><i></i>Gouvernance</span><span><i></i>Instances</span><span><i></i>Documents</span><span><i></i>Acteurs externes</span></div>
        <div class="map-callout"><strong>Gestes :</strong> glissez le fond pour orbiter, ou passez en déplacement pour translater la scène. Glissez une bulle pour déplacer X/Y ; utilisez la molette ou son réglage Z pour sa profondeur. Le curseur « Avancer / reculer » agit sur toute la scène. Sur ordinateur, Maj + glisser règle Z.</div>
      </div>
      <aside class="map-details glass-panel" id="map-details" aria-live="polite" aria-atomic="true"></aside>
    </div>
  </section>`;
}function renderNetwork() {
  const regionOptions = ["Île-de-France","Auvergne-Rhône-Alpes","Bourgogne-Franche-Comté","Bretagne","Centre-Val de Loire","Corse","Grand Est","Hauts-de-France","Normandie","Nouvelle-Aquitaine","Occitanie","Pays de la Loire","Provence-Alpes-Côte d’Azur","Outre-mer"];
  const placeOptions = ["Sanitaire", "Médico-social · handicap", "Médico-social · grand âge", "Social · protection de l’enfance", "Social · précarité", "Domicile / parcours", "Autre"];
  const roles = ["Adjoint·e de direction","Directeur·rice","Chef·fe de service / cadre","Responsable qualité / risques","Responsable RH / organisation","Responsable finances / contrôle de gestion","Chef·fe de projet / chargé·e de mission","Cadre de santé","Étudiant·e / alternant·e","Autre"];
  return `<section class="page" aria-labelledby="network-title">${sectionHead("COMMUNAUTÉ · PARTAGE D’EXPÉRIENCE", "Le réseau de promotion, <span class=\"text-gradient\">à portée de main.</span>", "Créez un annuaire volontaire pour retrouver une expérience, un secteur ou un interlocuteur de votre promotion. Cette version ne se connecte pas à Firebase : les fiches restent dans ce navigateur.", `<button class="button subtle" data-action="export-peers">${icon("download",15)}Exporter mes fiches</button>`)}
    <div class="network-layout"><section class="network-form-card glass-panel"><span class="eyebrow" id="peer-form-eyebrow">${state.editingPeerId ? "MODIFICATION" : "AJOUTER UNE FICHE"}</span><h2 id="peer-form-title" style="margin-top:12px;font-size:22px">${state.editingPeerId ? "Modifier ma fiche alumni" : "Partager son expérience"}</h2><p class="muted" style="font-size:10px;line-height:1.6;margin-bottom:0">Les champs marqués d’un astérisque sont requis. Mettez à jour vos coordonnées, lieu d'exercice et expériences.</p>
      <form class="network-form" id="peer-form" novalidate>
        <input type="hidden" id="peer-edit-id" name="id" value="${state.editingPeerId || ''}">
        <div class="form-grid"><div><label class="field-label" for="peer-name">Nom affiché *</label><input class="form-control" id="peer-name" name="name" maxlength="70" required placeholder="Prénom Nom"></div><div><label class="field-label" for="peer-email">Courriel de contact *</label><input class="form-control" id="peer-email" name="email" type="email" maxlength="120" required placeholder="prenom@exemple.fr"></div></div>
        <div class="form-grid"><div><label class="field-label" for="peer-region">Région *</label><select class="form-control" id="peer-region" name="region" required><option value="">Choisir une région</option>${regionOptions.map(item => `<option>${esc(item)}</option>`).join("")}</select></div><div><label class="field-label" for="peer-place">Lieu d’exercice / secteur *</label><select class="form-control" id="peer-place" name="sector" required><option value="">Choisir un secteur</option>${placeOptions.map(item => `<option>${esc(item)}</option>`).join("")}</select></div></div>
        <div class="form-grid">
          <div><label class="field-label" for="peer-role">Rôle actuel *</label><select class="form-control" id="peer-role" name="role" required><option value="">Choisir un rôle</option>${roles.map(item => `<option>${esc(item)}</option>`).join("")}</select></div>
          <div><label class="field-label" for="peer-linkedin">Profil LinkedIn (optionnel)</label><input class="form-control" id="peer-linkedin" name="linkedin" placeholder="https://www.linkedin.com/in/prenom-nom" maxlength="180"></div>
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
        <label class="consent-row"><input type="checkbox" name="consent" required><span>J’autorise l’affichage de ces coordonnées aux personnes qui utiliseront cet annuaire. Je peux supprimer ma fiche depuis ce navigateur. *</span></label>
        <div class="privacy-box"><strong>Prototype local.</strong> Les fiches sont stockées dans le localStorage de cet appareil et ne sont pas envoyées sur un serveur. Avant une diffusion de promotion, il faudra définir les accès, la durée de conservation, la suppression et l’hébergement Firebase.</div>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
      <button class="button primary" id="peer-submit-btn" type="submit">${icon(state.editingPeerId ? "check" : "userplus",15)} ${state.editingPeerId ? "Mettre à jour ma fiche alumni" : "Enregistrer la fiche"}</button>
      <button class="button subtle" id="peer-cancel-edit-btn" type="button" data-action="cancel-edit-peer" ${state.editingPeerId ? '' : 'hidden'}>${icon("close",14)} Annuler la modification</button>
      <p class="field-error" id="peer-form-error" role="alert" hidden></p>
    </div>
      </form>
    </section><section class="network-results glass-panel"><div class="section-title-row"><div><span class="eyebrow">ANNUAIRE VOLONTAIRE</span><h2 style="margin-top:10px">Trouver une expérience</h2><p id="peer-count">Chargement des fiches locales…</p></div><button class="button subtle" data-action="clear-peers">${icon("trash",14)}Tout supprimer</button></div>
      <div class="network-tools"><label class="search-box"><span data-icon="search"></span><input class="form-control" id="peer-query" type="search" placeholder="Nom, rôle, mot-clé…" aria-label="Rechercher une personne"></label><select class="form-control" id="peer-experience-filter" aria-label="Filtrer par expérience"><option value="Tout">Toutes les expériences</option>${RESEARCH_AREAS.map(item => `<option>${esc(item)}</option>`).join("")}</select><select class="form-control" id="peer-region-filter" aria-label="Filtrer par région"><option value="Tout">Toutes les régions</option>${regionOptions.map(item => `<option>${esc(item)}</option>`).join("")}</select></div>
      <div class="peer-list" id="peer-list"></div><p class="field-hint" style="margin-top:12px">L’annuaire local n’est visible que dans le même navigateur. Pour un usage collectif, la prochaine étape sera l’authentification et les règles d’accès Firebase.</p>
    </section></div>

  </section>`;
}

function renderTimeline() {
  return `<section class="page" aria-labelledby="timeline-title">${sectionHead("COMMUNAUTÉ ALUMNI · ANNONCES & ÉVÉNEMENTS", "Le fil d'actualité, <span class=\"text-gradient\">en temps réel.</span>", "Publiez des offres d'alternance, invitez aux job datings et événements inter-établissements avec confirmation de participation.", `<button class="button subtle" data-nav="reseau">${icon("userplus", 15)} Annuaire Alumni</button>`)}

    <div class="section-block">
      <div style="display:flex;justify-content:flex-end;margin-bottom:16px">
        <button class="button primary" data-action="toggle-post-form">${icon("message", 15)} Publier une annonce</button>
      </div>

      <!-- Formulaire de publication -->
      <div class="glass-panel" id="timeline-post-form-wrap" style="padding:22px;margin-bottom:24px;display:none;border:1px solid rgba(135,199,247,0.35);border-radius:var(--radius-lg)">
        <h3 style="font-size:17px;margin:0 0 14px;color:var(--text)">Créer un post alumni (Offre de poste, Événement ou Annonce)</h3>
        <form id="timeline-post-form">
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin-bottom:14px">
            <div>
              <label class="field-label">Type de publication *</label>
              <select name="type" class="form-control" required id="timeline-post-type-select">
                <option value="job_offer">💼 Offre d'emploi / Alternance / Stage</option>
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

function renderQuality() {
  const ei = ADVERSE_EVENTS;
  return `<section class="page" aria-labelledby="quality-title">
    ${sectionHead("QUALITÉ & SÉCURITÉ · GESTION DES RISQUES", "AgEval, signalements et <span class=\"text-gradient\">gestion des événements indésirables.</span>", "Recueillir, hiérarchiser et traiter chaque événement indésirable (EI). Comprendre les 4 niveaux d'EI, ce que chaque niveau provoque comme circuit d'actions, et s'approprier les outils institutionnels comme AgEval de l'ANAP.", `<button class="button subtle" data-nav="rex">${icon("lightbulb",16)}Voir la démarche REX</button>`)}
    
    <div class="notice">${icon("info",18)}<span><strong>Culture juste & non punitive.</strong> ${esc(ei.culture)}</span></div>

    <div class="section-block">
      <div class="section-title-row">
        <div>
          <h2>Les 4 niveaux d'Événements Indésirables</h2>
          <p>Quand choisir quel niveau, qui alerte-t-on, et que provoque chaque décision en termes d'actions immédiates, d'analyses et de déclarations ?</p>
        </div>
      </div>
      <div class="result-grid">${adverseEventCards()}</div>
    </div>

    <div class="section-block">
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

    <div class="section-block">
      <div class="section-title-row">
        <div>
          <h2>Outils institutionnels de la qualité</h2>
          <p>AgEval (ANAP), audits croisés, patient traceur et référentiels HAS.</p>
        </div>
      </div>
      <div class="result-grid">${qualityToolCards()}</div>
    </div>

    <div class="section-block">
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

    <div class="section-block">
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

    ${renderAccessStatusBar()}
    ${isUnlocked ? `
    <div class="section-block">
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

    <div class="section-block">
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

    <div class="section-block">
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

    ` : paywallGate("Méthode ALARM & Protocole d'Animation REX (45% Campus)", "Accédez à la démarche complète en 6 étapes, aux 7 dimensions causales de la grille ALARM et à la composition type d'une séance sans culpabilisation.", `
      <div class="section-block"><div class="result-grid">${rex.steps.slice(0,2).map(s => `<article class="content-card"><h3>${esc(s.title)}</h3><p>${esc(s.detail)}</p></article>`).join("")}</div></div>
    `)}

    ${sourceLinks(["rexHas","crex","rexEssms","hasHealth"])}
  </section>`;
}

/* --- MODULE CORPS DE MÉTIER SUPPORT & ORGANIGRAMME --- */
function supportJobCards(list = SUPPORT_JOBS) {
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
        <span class="meta-label">Métier support 0${idx+1}</span>
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

    <div class="filter-bar">
      <label class="search-box">
        <span data-icon="search"></span>
        <input class="form-control" id="support-job-query" type="search" placeholder="Métier support, mission, rôle, outil..." aria-label="Rechercher un métier support">
      </label>
      <span class="filter-count" id="support-job-count">${list.length} métier${list.length === 1 ? "" : "s"}</span>
    </div>

    ${renderPills("supportJobs", families, state.filters.supportJobs)}

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

    <div class="section-block">
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

    <div class="section-block">
      <div class="section-title-row">
        <div>
          <h2>Les 10 grandes lois structurantes</h2>
          <p>De la loi 2002-2 à la loi Bien Vieillir de 2024 : le socle juridique indispensable à tout dirigeant.</p>
        </div>
      </div>
      <div class="result-grid">${lawCards()}</div>
    </div>

    ${renderAccessStatusBar()}
    ${isUnlocked ? `
    <div class="section-block">
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

    <div class="section-block">
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

    <div class="section-block">
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

    ` : paywallGate("Cadre Stratégique ARS, Département & Synthèse Décisionnelle (45% Campus)", "Accédez aux orientations du PRS 3 ARS, aux mécanismes d'arbitrage départemental et à la grille comparative des compétences institutionnelles.", `
      <div class="section-block"><div class="focus-row">${hp.regionalFramework.components.slice(0,2).map(c => `<article class="focus-card glass-panel"><h3>${esc(c.name)}</h3><p>${esc(c.role)}</p></article>`).join("")}</div></div>
    `)}

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
      cells = [
        ["Place dans l’organigramme", item.placement],
        ["Personnes encadrées", item.reports],
        ["Champ de décision & Délégations", paywallGate("Fiche de poste institutionnelle réservée", "Les grilles indiciaires, marges de décision auprès des autorités de tutelle (ARS, HAS, Sécu) et interactions CODIR sont réservées aux membres Campus."), true]
      ];
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
    { duration:230, easing:"cubic-bezier(.18,.72,.23,1)" }
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
    { duration:175, easing:"cubic-bezier(.4,0,1,1)", fill:"forwards" }
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
  if (!grabber) return;
  let startY = null;
  grabber.addEventListener("pointerdown", event => {
    if (event.button !== undefined && event.button !== 0) return;
    startY = event.clientY;
    grabber.setPointerCapture?.(event.pointerId);
  });
  grabber.addEventListener("pointerup", event => {
    if (startY !== null && event.clientY - startY > 76) closeDialog();
    startY = null;
  });
  grabber.addEventListener("pointercancel", () => { startY = null; });
}
function openSearch() {
  const html = `<h2 class="dialog-title" id="dialog-title">Rechercher dans Mosaïque Santé</h2><p class="dialog-lede">Cherchez un établissement, un document, une instance, un métier ou un acteur.</p><label class="search-box" style="display:block;margin-top:16px"><span data-icon="search"></span><input class="form-control" id="global-search" type="search" autofocus placeholder="Ex. DUERP, MAS, CVS, EPRD…" aria-label="Recherche globale"></label><div class="search-results section-block" id="global-results" aria-live="polite"><div class="empty-state"><strong>Votre recherche apparaîtra ici</strong>Les fiches s’ouvrent directement depuis les résultats.</div></div>`;
  openDialog("RECHERCHE GLOBALE", html);
  setTimeout(() => $("#global-search")?.focus(), 20);
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
  const needle = query.trim().toLocaleLowerCase("fr");
  const resultBox = $("#global-results");
  if (!resultBox) return;
  if (!needle) { resultBox.innerHTML = `<div class="empty-state"><strong>Votre recherche apparaîtra ici</strong>Les fiches s’ouvrent directement depuis les résultats.</div>`; return; }
  const collections = [
    ...ESTABLISHMENTS.map(item => ({kind:"establishment",item,label:item.name,detail:item.family})),
    ...JOBS.map(item => ({kind:"job",item,label:item.name,detail:item.level})),
    ...MEETINGS.map(item => ({kind:"meeting",item,label:`${item.name} · ${item.full}`,detail:item.kind})),
    ...DOCUMENTS.map(item => ({kind:"document",item,label:item.name,detail:item.category})),
    ...ACTORS.map(item => ({kind:"actor",item,label:item.name,detail:item.type})),
    ...SOFTWARES.map(item => ({kind:"software",item,label:item.name,detail:item.group})),
    ...FAQ.map(item => ({kind:"faq",item,label:item.q,detail:"Question RH"}))
  ];
  const matches = collections.filter(record => JSON.stringify(record.item).toLocaleLowerCase("fr").includes(needle)).slice(0,12);
  resultBox.innerHTML = matches.length ? matches.map((record,index) => `<button class="quick-tile search-result" style="width:100%;min-height:60px;margin-bottom:7px;align-items:center" data-action="open-search-result" data-kind="${record.kind}" data-id="${record.kind === "faq" ? index : record.item.id}"><span class="icon-bubble">${icon(record.kind === "document" ? "file" : record.kind === "job" ? "briefcase" : record.kind === "meeting" ? "calendar" : record.kind === "actor" ? "network" : record.kind === "software" ? "layers" : "building",15)}</span><span><strong>${esc(record.label)}</strong><small>${esc(record.detail)}</small></span>${icon("arrow-up-right",14)}</button>`).join("") : `<div class="empty-state"><strong>Aucun résultat</strong>Essayez un autre mot-clé.</div>`;
}

function applyFilter(group) {
  if (group === "supportJobs") {
    const value = state.filters.supportJobs;
    const input = $("#support-job-query");
    const query = (input?.value || "").trim().toLocaleLowerCase("fr");
    const filtered = SUPPORT_JOBS.filter(job => {
      const matchGroup = value === "Tout" || job.family === value;
      const matchQuery = !query || JSON.stringify(job).toLocaleLowerCase("fr").includes(query);
      return matchGroup && matchQuery;
    });
    const results = $("#support-job-results");
    if (results) results.innerHTML = supportJobCards(filtered);
    const countEl = $("#support-job-count");
    if (countEl) countEl.textContent = `${filtered.length} métier${filtered.length === 1 ? "" : "s"}`;
    $$('[data-filter-group="supportJobs"]').forEach(p => p.classList.toggle("is-selected", p.dataset.filterValue === value));
    return;
  }

  if (group === "establishments") {
    const query = state.queries.establishments.toLocaleLowerCase("fr");
    const list = ESTABLISHMENTS.filter(item => (state.filters.establishments === "Tout" || item.family === state.filters.establishments) && JSON.stringify(item).toLocaleLowerCase("fr").includes(query));
    $("#establishment-results").innerHTML = establishmentCards(list);
    $("#establishment-count").textContent = `${list.length} fiche${list.length === 1 ? "" : "s"}`;
  } else if (group === "jobs") {
    const query = state.queries.jobs.toLocaleLowerCase("fr");
    const list = JOBS.filter(item => (state.filters.jobs === "Tout" || item.sector === state.filters.jobs) && JSON.stringify(item).toLocaleLowerCase("fr").includes(query));
    $("#job-results").innerHTML = jobCards(list);
  } else if (group === "meetings") {
    const query = state.queries.meetings.toLocaleLowerCase("fr");
    const list = MEETINGS.filter(item => (state.filters.meetings === "Tout" || item.kind === state.filters.meetings) && JSON.stringify(item).toLocaleLowerCase("fr").includes(query));
    $("#meeting-results").innerHTML = meetingCards(list);
  } else if (group === "documents") {
    const query = state.queries.documents.toLocaleLowerCase("fr");
    const list = DOCUMENTS.filter(item => (state.filters.documents === "Tout" || item.category === state.filters.documents) && JSON.stringify(item).toLocaleLowerCase("fr").includes(query));
    $("#document-results").innerHTML = documentCards(list);
  } else if (group === "actors") {
    const query = state.queries.actors.toLocaleLowerCase("fr");
    const list = ACTORS.filter(item => (state.filters.actors === "Tout" || item.type === state.filters.actors) && JSON.stringify(item).toLocaleLowerCase("fr").includes(query));
    $("#actor-results").innerHTML = actorCards(list);
  } else if (group === "faq") {
    const query = state.queries.faq.toLocaleLowerCase("fr");
    const list = FAQ.filter(item => JSON.stringify(item).toLocaleLowerCase("fr").includes(query));
    $("#faq-results").innerHTML = renderFaqList(list);
  } else if (group === "software") {
    const query = state.queries.software.toLocaleLowerCase("fr");
    const list = SOFTWARES.filter(item => JSON.stringify(item).toLocaleLowerCase("fr").includes(query));
    $("#software-results").innerHTML = softwareCards(list);
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
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px">
          <div>
            <h3 style="margin:0;font-size:15px;color:var(--text)">${esc(peer.name)}</h3>
            <p style="margin:2px 0 0;font-size:12px;color:var(--muted)">${esc(peer.role)} · ${esc(peer.sector)} · ${esc(peer.region)}</p>
          </div>
          ${peer.linkedin ? `<a class="linkedin-btn" href="${esc(peer.linkedin)}" target="_blank" rel="noopener noreferrer">${icon("linkedin", 13)}<span>LinkedIn</span></a>` : ''}
        </div>
        <div class="meta-row" style="display:flex;flex-wrap:wrap;gap:5px;margin-top:8px">
          ${expList.map(exp => `<span class="tag mint">${esc(exp)}</span>`).join("")}
        </div>
        <p style="margin-top:8px;line-height:1.6;font-size:13px;color:var(--text-soft)">${esc(peer.summary)}</p>
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-top:12px;padding-top:8px;border-top:1px solid var(--stroke)">
          <a class="inline-link" href="mailto:${esc(peer.email)}" style="font-size:12px">${esc(peer.email)}</a>
          <div style="display:flex;gap:6px">
            <button class="button tiny subtle" data-action="edit-peer" data-id="${esc(peer.id)}">${icon("edit", 13)} Modifier</button>
            <button class="peer-delete" data-action="delete-peer" data-id="${esc(peer.id)}" aria-label="Supprimer la fiche de ${esc(peer.name)}">${icon("trash",14)}</button>
          </div>
        </div>
      </div>
    </article>`;
  }).join("") + paywallNotice : `<div class="empty-state"><strong>${state.peers.length ? "Aucune fiche dans ce filtre" : "Votre annuaire commence ici"}</strong>${state.peers.length ? "Essayez un autre domaine, région ou mot-clé." : "Ajoutez une première fiche avec le formulaire ci-contre pour enrichir le réseau de promotion."}</div>`;
  hydrateIcons(box);
}

function renderTimelinePosts() {
  const posts = state.posts || [];
  if (!posts.length) {
    return `<div class="empty-state">Aucune publication sur le fil pour l'instant. Soyez le premier à poster une offre ou un événement !</div>`;
  }
  return posts.map(post => {
    const isJob = post.type === "job_offer";
    const isEvent = post.type === "event";
    const userRsvp = state.rsvps?.[post.id] || null;
    const rsvpCounts = post.rsvp || { personal: 0, delegate_intern: 0, delegate_staff: 0 };

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

          <!-- MODULE DE PARTICIPATION & DÉLÉGATION D'ÉTABLISSEMENT -->
          <div class="timeline-rsvp-panel">
            <div class="timeline-rsvp-title">Indiquer votre présence ou déléguer un représentant :</div>
            <div class="timeline-rsvp-options">
              <button type="button" class="timeline-rsvp-btn ${userRsvp === 'personal' ? 'is-active' : ''}" data-action="rsvp" data-post-id="${esc(post.id)}" data-choice="personal">
                ${icon("check", 14)} 🙋 Je viens en personne
              </button>
              <button type="button" class="timeline-rsvp-btn ${userRsvp === 'delegate_intern' ? 'is-active' : ''}" data-action="rsvp" data-post-id="${esc(post.id)}" data-choice="delegate_intern">
                ${icon("users", 14)} 🎓 J'envoie un alternant
              </button>
              <button type="button" class="timeline-rsvp-btn ${userRsvp === 'delegate_staff' ? 'is-active' : ''}" data-action="rsvp" data-post-id="${esc(post.id)}" data-choice="delegate_staff">
                ${icon("building", 14)} 👥 J'envoie des salariés
              </button>
              ${userRsvp ? `
                <button type="button" class="timeline-rsvp-btn" data-action="rsvp" data-post-id="${esc(post.id)}" data-choice="cancel" style="color:var(--coral);border-color:rgba(248,139,125,0.3)">
                  ${icon("close", 13)} Annuler mon choix
                </button>
              ` : ''}
            </div>

            <div class="timeline-rsvp-stats">
              <span class="timeline-rsvp-stat"><strong>${rsvpCounts.personal || 0}</strong> en personne</span>
              <span>·</span>
              <span class="timeline-rsvp-stat"><strong>${rsvpCounts.delegate_intern || 0}</strong> alternant(s) délégué(s)</span>
              <span>·</span>
              <span class="timeline-rsvp-stat"><strong>${rsvpCounts.delegate_staff || 0}</strong> salarié(s) représentant(s)</span>
            </div>
          </div>
        ` : ''}

        ${isJob ? `
          <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:10px 14px;border-radius:12px;background:var(--surface-soft);border:1px solid var(--stroke);font-size:12px">
            <span class="tag sky">${esc(post.contract || "CDI / Alternance")}</span>
            <span class="muted">${icon("map", 13)} ${esc(post.location || "France")}</span>
            ${post.contact ? `<a class="inline-link" href="mailto:${esc(post.contact)}" style="margin-left:auto">${icon("send", 12)} Postuler : ${esc(post.contact)}</a>` : ''}
          </div>
        ` : ''}

        <div class="timeline-post-footer">
          <div style="display:flex;align-items:center;gap:16px">
            <button type="button" class="button tiny subtle" data-action="like-post" data-post-id="${esc(post.id)}" style="display:inline-flex;align-items:center;gap:5px;${post.isLiked ? 'color:var(--mint);font-weight:700' : ''}">
              ${icon("heart", 14)} <span>${post.likes || 0}</span>
            </button>
            <span class="muted" style="font-size:11.5px">${icon("message", 13)} ${post.commentsCount || 0} commentaire(s)</span>
          </div>
          <span class="muted" style="font-size:11px">Visible par toute la promotion</span>
        </div>
      </article>
    `;
  }).join("");
}

function handleRsvp(postId, choice) {
  const post = (state.posts || []).find(p => p.id === postId);
  if (!post) return;
  if (!post.rsvp) post.rsvp = { personal: 0, delegate_intern: 0, delegate_staff: 0 };
  
  const currentChoice = state.rsvps[postId] || null;

  if (choice === "cancel") {
    if (currentChoice && post.rsvp[currentChoice] > 0) post.rsvp[currentChoice]--;
    delete state.rsvps[postId];
    showToast("Votre choix de participation a été annulé.");
  } else if (currentChoice === choice) {
    post.rsvp[choice] = Math.max(0, post.rsvp[choice] - 1);
    delete state.rsvps[postId];
    showToast("Participation retirée.");
  } else {
    if (currentChoice && post.rsvp[currentChoice] > 0) post.rsvp[currentChoice]--;
    post.rsvp[choice] = (post.rsvp[choice] || 0) + 1;
    state.rsvps[postId] = choice;

    const labelMap = {
      personal: "Participation en personne",
      delegate_intern: "Délégation d'un alternant",
      delegate_staff: "Délégation de salariés pour représenter l'établissement"
    };

    // Add a live notification
    const newNotif = {
      id: "notif-" + Date.now(),
      title: "Confirmation enregistrée",
      text: `Votre statut a été mis à jour : "${labelMap[choice]}" pour l'événement "${post.title}".`,
      date: "À l'instant",
      icon: "check",
      unread: true
    };
    state.notifs = [newNotif, ...state.notifs];
    writeJSON(STORE.notifs, state.notifs);
    updateNotifBadge();
    showToast(`✅ Statut enregistré : ${labelMap[choice]} !`);
  }

  writeJSON(STORE.posts, state.posts);
  writeJSON(STORE.rsvps, state.rsvps);

  const feed = $("#timeline-feed");
  if (feed) {
    feed.innerHTML = renderTimelinePosts();
    hydrateIcons(feed);
  }
}

function handleLikePost(postId) {
  const post = (state.posts || []).find(p => p.id === postId);
  if (!post) return;
  post.isLiked = !post.isLiked;
  post.likes = Math.max(0, (post.likes || 0) + (post.isLiked ? 1 : -1));
  writeJSON(STORE.posts, state.posts);
  const feed = $("#timeline-feed");
  if (feed) {
    feed.innerHTML = renderTimelinePosts();
    hydrateIcons(feed);
  }
}

function editPeer(id) {
  const peer = state.peers.find(p => p.id === id);
  if (!peer) return;
  state.editingPeerId = id;
  const form = $("#peer-form");
  if (!form) return;
  
  const editIdInput = $("#peer-edit-id");
  if (editIdInput) editIdInput.value = peer.id;
  
  if ($("#peer-name")) $("#peer-name").value = peer.name || "";
  if ($("#peer-email")) $("#peer-email").value = peer.email || "";
  if ($("#peer-region")) $("#peer-region").value = peer.region || "";
  if ($("#peer-place")) $("#peer-place").value = peer.sector || "";
  if ($("#peer-role")) $("#peer-role").value = peer.role || "";
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

  form.scrollIntoView({ behavior: "smooth", block: "start" });
  $("#peer-name")?.focus();
}

function cancelEditPeer() {
  state.editingPeerId = null;
  const form = $("#peer-form");
  if (!form) return;
  form.reset();
  const editIdInput = $("#peer-edit-id");
  if (editIdInput) editIdInput.value = "";
  peerMultiSelect.selected.clear();
  peerMultiSelect.render();
  const submitBtn = $("#peer-submit-btn");
  if (submitBtn) submitBtn.innerHTML = `${icon("userplus", 15)} Enregistrer la fiche`;
  const cancelBtn = $("#peer-cancel-edit-btn");
  if (cancelBtn) cancelBtn.hidden = true;
  const formTitle = $("#peer-form-title");
  if (formTitle) formTitle.textContent = "Partager son expérience";
  const eyebrow = $("#peer-form-eyebrow");
  if (eyebrow) eyebrow.textContent = "AJOUTER UNE FICHE";
  showToast("Mode modification annulé.");
}

function updateNotifBadge() {
  const unreadCount = (state.notifs || []).filter(n => n.unread).length;
  const badge = $("#notif-badge");
  if (badge) {
    badge.textContent = unreadCount;
    badge.hidden = unreadCount === 0;
  }
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
  const unreadCount = (state.notifs || []).filter(n => n.unread).length;
  popover.innerHTML = `
    <div class="notif-header">
      <h3 style="display:flex;align-items:center;gap:6px">${icon("bell", 16)} Notifications (${state.notifs.length})</h3>
      <div style="display:flex;align-items:center;gap:8px">
        ${unreadCount > 0 ? `<button class="button tiny subtle" data-action="mark-all-notifs-read" style="min-height:30px;padding:4px 10px;font-size:10px">Tout lire</button>` : `<span class="muted" style="font-size:11px">À jour</span>`}
        <button class="icon-button" data-action="toggle-notifications" aria-label="Fermer les notifications" style="min-width:32px;min-height:32px;border-radius:9px">${icon("close", 15)}</button>
      </div>
    </div>
    <div class="notif-list" style="display:flex;flex-direction:column;gap:8px;margin-top:10px">
      ${state.notifs.length ? state.notifs.map(n => `
        <div class="notif-item ${n.unread ? 'is-unread' : ''}">
          <span class="icon-bubble" style="flex-shrink:0;margin-top:2px">${icon(n.icon || "bell", 15)}</span>
          <div style="flex:1">
            <strong>${esc(n.title)}</strong>
            <p style="margin:2px 0 0">${esc(n.text)}</p>
            <span class="notif-time">${esc(n.date)}</span>
          </div>
        </div>
      `).join("") : `<div class="empty-state" style="padding:16px 0">Aucune notification pour le moment.</div>`}
    </div>
  `;
  hydrateIcons(popover);
}

function markAllNotifsRead() {
  state.notifs.forEach(n => { n.unread = false; });
  writeJSON(STORE.notifs, state.notifs);
  updateNotifBadge();
  toggleNotifications();
  showToast("Toutes les notifications sont marquées comme lues.");
}

function addPeer(form) {
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
  const expVal = String(formData.get("experience") || "").trim();
  const expArray = expVal ? expVal.split(",").map(s => s.trim()).filter(Boolean) : [];
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
    state.peers = [peer, ...state.peers];
  }

  writeJSON(STORE.peers, state.peers);
  form.reset();
  state.editingPeerId = null;
  const editIdInput = $("#peer-edit-id");
  if (editIdInput) editIdInput.value = "";
  const submitBtn = $("#peer-submit-btn");
  if (submitBtn) submitBtn.innerHTML = `${icon("userplus", 15)} Enregistrer la fiche`;
  const cancelBtn = $("#peer-cancel-edit-btn");
  if (cancelBtn) cancelBtn.hidden = true;
  const formTitle = $("#peer-form-title");
  if (formTitle) formTitle.textContent = "Partager son expérience";
  const eyebrow = $("#peer-form-eyebrow");
  if (eyebrow) eyebrow.textContent = "AJOUTER UNE FICHE";

  peerMultiSelect.selected.clear();
  peerMultiSelect.render();
  if (error) error.hidden = true;

  // Réinitialiser les filtres pour que la nouvelle fiche soit immédiatement visible
  state.queries.peers = "";
  const peerQueryInput = $("#peer-query");
  if (peerQueryInput) peerQueryInput.value = "";
  const peerExpFilter = $("#peer-experience-filter");
  if (peerExpFilter) peerExpFilter.value = "Tout";
  const peerRegFilter = $("#peer-region-filter");
  if (peerRegFilter) peerRegFilter.value = "Tout";

  renderPeerList();

  // Scroll fluide vers la fiche créée pour confirmation visuelle immédiate
  setTimeout(() => {
    const card = document.getElementById(`peer-card-${peer.id}`);
    if (card) {
      card.scrollIntoView({ behavior: "smooth", block: "center" });
      card.style.transition = "all 0.4s ease";
      card.style.borderColor = "var(--mint)";
      card.style.boxShadow = "0 0 0 3px rgba(98, 222, 184, 0.4)";
      setTimeout(() => {
        card.style.borderColor = "";
        card.style.boxShadow = "";
      }, 3000);
    }
  }, 120);

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
function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add("is-visible");
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => toastEl.classList.remove("is-visible"),2600);
}
function closeMenu() {
  const shouldRestoreFocus = sidebar.contains(document.activeElement);
  sidebar.classList.remove("is-open");
  document.body.classList.remove("menu-open");
  const backdrop = $(".sidebar-backdrop");
  if (backdrop) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || typeof backdrop.animate !== "function") backdrop.remove();
    else {
      const exit = backdrop.animate([{ opacity:1 }, { opacity:0 }], { duration:155, easing:"ease-in", fill:"forwards" });
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
  $(".menu-toggle")?.setAttribute("aria-expanded","true");
  const backdrop = document.createElement("button"); backdrop.className="sidebar-backdrop"; backdrop.type="button"; backdrop.setAttribute("aria-label","Fermer le menu"); backdrop.addEventListener("click",closeMenu); document.body.append(backdrop);
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches && backdrop.animate) backdrop.animate([{ opacity:0 }, { opacity:1 }], { duration:180, easing:"ease-out" });
}
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
  const bob=floating ? Math.sin(time*.0012 + index*1.47)*4 : 0;
  const rotated=rotateMapPoint({x:point.x,y:point.y+bob,z:point.z+state.mapSceneDepth+(floating?Math.sin(time*.001+index)*3:0)});
  const distance = Math.max(260,state.mapPerspective-rotated.z);
  const perspectiveScale = state.mapPerspective/distance;
  const zoom=state.mapZoom;
  return {
    x:width/2+state.mapPan.x+rotated.x*perspectiveScale*zoom,
    y:height/2+state.mapPan.y-rotated.y*perspectiveScale*zoom,
    z:rotated.z,
    scale:clamp(perspectiveScale*zoom,.82,1.38),
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
    box.innerHTML=`<span class="tag ${tagColor(node.type)}">${esc(detail.type)}</span><h3>${esc(detail.title)}</h3><p>${esc(detail.copy)}</p><span class="meta-label">LIENS DIRECTS</span><div class="map-detail-related">${detail.related.map(item=>`<span>${esc(item)}</span>`).join("")}</div><label class="map-node-depth"><span>Profondeur de cette bulle <output id="map-node-depth-output">${z}</output></span><input id="map-node-depth" type="range" min="-260" max="260" value="${z}" aria-label="Déplacer ${esc(detail.title)} en profondeur sur l’axe Z"><small>La position et le texte de la bulle suivent en direct.</small></label><p class="map-node-tip">Glisser la bulle : X/Y · Maj + glisser ou molette : Z.</p><div class="source-links">${sourceLinks(selected === "duerp" ? ["duerp"] : selected === "eprd" ? ["cnsaData"] : selected === "has" ? ["hasEsms","hasHealth"] : selected === "anap" ? ["anap"] : selected === "cnsa" ? ["cnsa"] : selected === "cvscse" ? ["cvs","cse"] : ["casfRights"])}</div>`;
    hydrateIcons(box);
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches && box.animate) box.animate([{opacity:.55,transform:"translate3d(0,5px,0)"},{opacity:1,transform:"translate3d(0,0,0)"}],{duration:190,easing:"cubic-bezier(.18,.72,.23,1)"});
  }
  requestMapFrame();
}
function attach3DMap(scene) {
  const {world}=scene;
  let drag=null;
  world.addEventListener("pointerdown",event=>{
    if (event.button!==undefined && event.button!==0) return;
    const nodeButton=event.target.closest("[data-map-node]");
    if (nodeButton) {
      const id=nodeButton.dataset.mapNode;
      state.selectedMapNode=id;
      updateMapSelection();
      drag={kind:"node",id,startX:event.clientX,startY:event.clientY,position:{...state.mapPositions[id]},moved:false};
      scene.drag=drag;
      nodeButton.setPointerCapture?.(event.pointerId);
    } else {
      drag={kind:state.mapGesture,startX:event.clientX,startY:event.clientY,rotation:{...state.mapRotation},pan:{...state.mapPan},moved:false};
      scene.drag=drag;
      world.setPointerCapture?.(event.pointerId);
    }
    world.classList.add("is-dragging");
  });
  world.addEventListener("pointermove",event=>{
    if (!drag) return;
    const dx=event.clientX-drag.startX, dy=event.clientY-drag.startY;
    if (Math.abs(dx)+Math.abs(dy)>3) drag.moved=true;
    if (drag.kind==="node") {
      const point=scene.projected.get(drag.id), scale=point?.perspectiveScale || 1;
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
    } else if (drag.kind==="rotate") {
      state.mapRotation.y=((drag.rotation.y+dx*.48)%360+360)%360;
      state.mapRotation.x=((drag.rotation.x-dy*.48)%360+360)%360;
      syncMapAngles();
    } else {
      state.mapPan={x:clamp(drag.pan.x+dx,-1200,1200),y:clamp(drag.pan.y+dy,-800,800)};
    }
    requestMapFrame();
  });
  const finish=()=>{
    if (drag?.moved) mapClickSuppressionUntil=performance.now()+260;
    drag=null; scene.drag=null; world.classList.remove("is-dragging");
  };
  world.addEventListener("pointerup",finish);
  world.addEventListener("pointercancel",finish);
  world.addEventListener("lostpointercapture",finish);
  world.addEventListener("wheel",event=>{
    const nodeButton=event.target.closest("[data-map-node]");
    if (!nodeButton) return;
    event.preventDefault();
    const selectionChanged=state.selectedMapNode!==nodeButton.dataset.mapNode;
    state.selectedMapNode=nodeButton.dataset.mapNode;
    state.mapPositions[state.selectedMapNode].z=clamp(state.mapPositions[state.selectedMapNode].z-event.deltaY*.34,-260,260);
    if(selectionChanged) updateMapSelection();
    const slider=$("#map-node-depth"), output=$("#map-node-depth-output");
    if(slider) slider.value=String(Math.round(state.mapPositions[state.selectedMapNode].z));
    if(output) output.value=String(Math.round(state.mapPositions[state.selectedMapNode].z));
    requestMapFrame();
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
  if(gesture) { gesture.setAttribute("aria-pressed",String(rotating)); gesture.innerHTML=`${icon(rotating?"rotate":"move",15)}Mode : ${rotating?"orbite":"déplacement"}`; }
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
      const animation = panel.animate([{ opacity:0, transform:"translate3d(0,-4px,0)" }, { opacity:1, transform:"translate3d(0,0,0)" }], { duration:190, easing:"cubic-bezier(.18,.72,.23,1)" });
      accordionAnimations.set(panel,animation);
    }
    return;
  }
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || !panel.animate) { panel.hidden = true; return; }
  const animation = panel.animate([{ opacity:1, transform:"translate3d(0,0,0)" }, { opacity:0, transform:"translate3d(0,-3px,0)" }], { duration:145, easing:"ease-in" });
  accordionAnimations.set(panel,animation);
  animation.onfinish = () => { if (trigger.getAttribute("aria-expanded") !== "true") panel.hidden = true; };
}


/* --- MODULE AUDITS QUALITÉ & MÉTHODOLOGIE --- */
function auditTypologyCards() {
  const guide = AUDIT_GUIDE;
  return guide.typology.map((item, idx) => `<article class="content-card">
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
      <span class="tag sky">${esc(item.when)}</span>
      <span class="meta-label">Type 0${idx+1}</span>
    </div>
    <p class="card-copy" style="margin:8px 0">${esc(item.scope)}</p>
    <div class="detail-cell" style="margin:8px 0;background:rgba(255,255,255,0.03);padding:10px;border-radius:8px">
      <strong style="font-size:11px;color:var(--text-2);text-transform:uppercase;letter-spacing:0.04em">Questions clés investiguées :</strong>
      <p style="font-size:12px;margin-top:3px;font-style:italic;color:var(--text)">"${esc(item.keyQuestions)}"</p>
    </div>
    <div class="card-foot">
      <span>Acteurs : ${esc(item.actors)}</span>
      ${icon("arrow-up-right", 13)}
    </div>
  </article>`).join("");
}

function renderAudit() {
  const guide = AUDIT_GUIDE;
  const isUnlocked = isPremiumUnlocked();
  return `<section class="page" aria-labelledby="audit-title">
    ${sectionHead("MÉTHODOLOGIE QUALITÉ · ÉVALUATION", "L'Audit Qualité, <span class=\"text-gradient\">mesurer pour progresser.</span>", "À quoi sert un audit, comment le mener en 5 étapes rigoureuses, qui est visé selon chaque situation (patient traceur, audit clinique, audit croisé, audit flash) et comment transformer les constats en plan d'actions durable sans braquer les équipes.", `<button class="button subtle" data-nav="qualite">${icon("shield",16)}Gestion des EI</button>`)}
    
    <div class="notice">${icon("info",18)}<span><strong>Définition & posture.</strong> ${esc(guide.definition)}</span></div>

    <div class="section-block">
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

    <div class="section-block">
      <div class="section-title-row">
        <div>
          <h2>Les 6 types d'audits : qui est visé selon quel cas ?</h2>
          <p>Du patient traceur HAS à l'audit flash de 15 minutes, choisir le bon outil d'évaluation.</p>
        </div>
      </div>
      <div class="result-grid">${auditTypologyCards()}</div>
    </div>

    ${renderAccessStatusBar()}
    ${isUnlocked ? `
    <div class="section-block">
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

    <div class="section-block">
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

    ` : paywallGate("Méthodologie d'Audit en 5 Étapes & Grilles Types HAS (45% Campus)", "Accédez au protocole d'évaluation en 5 étapes, aux 4 grilles d'audit types (patient traceur, bionettoyage, médicament, DUI) et aux facteurs clés de succès.", `
      <div class="section-block"><div class="result-grid">${guide.steps.slice(0,2).map(s => `<article class="content-card"><h3>${esc(s.title)}</h3><p>${esc(s.detail)}</p></article>`).join("")}</div></div>
    `)}

    ${sourceLinks(["auditHas","hasEsms","anapAudit","cofrac"])}
  </section>`;
}

function renderSecu() {
  const secu = SECURITY_SOCIALE;
  const isUnlocked = isPremiumUnlocked();

  return `<section class="page" aria-labelledby="secu-title">
    ${renderAccessStatusBar()}
    ${sectionHead("PROTECTION SOCIALE & FINANCEMENT DE LA SANTÉ", "La Sécurité Sociale, <span class=\"text-gradient\">moteur financier et régulateur.</span>", "Comprendre les ordonnances de 1945, l'architecture des 5 branches (dont la Branche Autonomie), l'enveloppe ONDAM, les modèles de tarification (T2A, forfaits soins, CPOM) et la matrice comparative 'Qui paie quoi' pour 9 catégories d'établissements.", `<button class="button subtle" data-nav="etablissements">${icon("building",16)}Établissements</button>`)}

    <!-- Principes Fondateurs 1945 -->
    <div class="secu-hero-card">
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
    <div class="section-block">
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
    <div class="section-block">
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
    <div class="section-block">
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
      <div class="section-block">
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

      <div class="section-block">
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
function renderSubscription() {
  const isUnlocked = isPremiumUnlocked();
  const pricing = PRICING_DATA;
  const currentPlan = state.auth?.plan || (isUnlocked ? "universal" : "freemium");
  const profile = state.auth?.profile || {};

  return `<section class="page" aria-labelledby="sub-title">
    ${renderAccessStatusBar()}
    ${sectionHead("ABONNEMENT & TARIFICATION CAMPUS", "Formules d'accès, tarifs écoles et gestion des profils", "Accès complet aux 16 métiers institutionnels (HAS, ARS, ANAP, Sécurité Sociale), aux modules REX & Audit approfondis, au calculateur ETPT et à l'annuaire réseau illimité.", `<button class="button subtle" data-action="toggle-freemium-test">${icon("rotate", 15)}Basculer mode ${isUnlocked ? "Freemium (55%)" : "Débloqué (100%)"}</button>`)}

    <!-- Bannière Statut Actuel -->
    <div class="glass-panel" style="padding:22px;margin-bottom:24px;border-left:4px solid ${isUnlocked ? 'var(--mint)' : 'var(--gold)'}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:14px">
        <div>
          <span class="eyebrow">${isUnlocked ? "CAMPUS DÉBLOQUÉ · ACCÈS 100%" : "ESPACE FREEMIUM · 55% DES RESSOURCES LIBRES"}</span>
          <h2 style="font-size:20px;font-weight:750;margin:4px 0 6px;color:var(--text)">
            ${isUnlocked ? "👑 Vous disposez de l'accès intégral illimité" : "🔒 Vous utilisez la version découverte de Mosaïque Santé"}
          </h2>
          <p style="font-size:13px;color:var(--text-2);margin:0;max-width:650px">
            ${isUnlocked 
              ? `Formule active : <strong>${esc(currentPlan)}</strong>. Tous les 41 métiers, la matrice de la Sécu, les fiches d'audit et l'annuaire complet sont ouverts.`
              : `55% des modules sont accessibles gratuitement (fiches métiers clés, panorama des 28 structures, principes de la Sécu, FAQ RH). Débloquez les 45% réservés aux abonnés via votre école ou un pass individuel.`}
          </p>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          ${isUnlocked 
            ? `<button class="button subtle" data-action="reset-auth-profile">${icon("reset", 14)}Verrouiller (mode test)</button>`
            : `<button class="button primary" data-action="quick-unlock-universal">${icon("spark", 15)}Débloquer via code maître</button>`}
        </div>
      </div>
    </div>

    <!-- Saisie Code Maître Universel -->
    <div class="glass-panel" style="padding:22px;margin-bottom:28px;background:rgba(248,211,136,0.04);border:1px dashed rgba(248,211,136,0.3)">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
        <span class="icon-bubble" style="background:rgba(248,211,136,0.15);color:var(--gold);padding:8px">${icon("spark", 18)}</span>
        <div>
          <h3 style="font-size:15px;color:var(--gold);margin:0">Vous avez un code partenaire ou un code maître ?</h3>
          <span style="font-size:12px;color:var(--text-2)">Entrez votre clé d'accès universelle pour déverrouiller immédiatement 100% de l'application.</span>
        </div>
      </div>
      <form id="master-code-form" style="display:flex;gap:8px;max-width:520px;flex-wrap:wrap">
        <input type="text" id="master-code-input" placeholder="Ex: MOSAIQUE-MASTER-2026" value="${isUnlocked ? 'MOSAIQUE-MASTER-2026' : ''}" style="flex:1;min-width:200px;padding:10px 14px;border-radius:10px;border:1px solid var(--stroke);background:rgba(0,0,0,0.2);color:var(--text);font-family:monospace;font-size:13px;text-transform:uppercase" required />
        <button type="submit" class="button primary">${icon("check", 14)}Activer mon code</button>
      </form>
      <span style="display:block;margin-top:8px;font-size:11.5px;color:var(--muted)">Clé maître universelle fournie par le créateur : <code>MOSAIQUE-MASTER-2026</code></span>
    </div>

    <!-- Formules Écoles & Universités -->
    <div class="section-block">
      <div class="section-title-row">
        <div>
          <h2>Formules Établissements d'Enseignement (Écoles, Universités, IAE, EHESP)</h2>
          <p>Abonnements de cohorte avec gestion centralisée des étudiants, accès enseignants et mises à jour réglementaires.</p>
        </div>
      </div>
      <div class="pricing-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:16px">
        ${pricing.tiers.schools.map(t => `
          <article class="pricing-card glass-panel${t.popular ? ' is-popular' : ''}" style="position:relative;padding:24px;border-radius:18px;display:flex;flex-direction:column;justify-content:space-between;${t.popular ? 'border:1px solid var(--mint);box-shadow:0 0 25px rgba(98,222,184,0.1)' : ''}">
            ${t.popular ? `<span style="position:absolute;top:12px;right:14px;font-size:10px;font-weight:700;color:var(--mint);background:rgba(98,222,184,0.15);padding:3px 8px;border-radius:10px">RECOMMANDÉ</span>` : ''}
            <div>
              <span class="eyebrow" style="color:var(--sky)">${esc(t.students)}</span>
              <h3 style="font-size:20px;font-weight:800;margin:6px 0 2px">${esc(t.name)}</h3>
              <div style="display:flex;align-items:baseline;gap:4px;margin:12px 0 6px">
                <span style="font-size:32px;font-weight:800;color:var(--text)">${esc(t.price)}</span>
                <span style="color:var(--text-2);font-size:12px">${esc(t.period)}</span>
              </div>
              <span style="display:inline-block;font-size:11.5px;color:var(--mint);font-weight:600;margin-bottom:14px">${esc(t.perStudent)}</span>
              <ul class="bullet-list" style="margin-top:10px;font-size:12.5px">
                ${t.features.map(f => `<li>${esc(f)}</li>`).join("")}
              </ul>
            </div>
            <button class="button ${t.popular ? 'primary' : 'subtle'}" style="margin-top:20px;width:100%" data-action="simulate-subscribe" data-plan="${esc(t.name)}">
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
          <h2>Formules Individuelles & Pass Étudiant</h2>
          <p>Pour les étudiants autonomes préparant un concours (D3S, CAFDES, DH) ou les professionnels hors convention école.</p>
        </div>
      </div>
      <div class="pricing-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:16px">
        ${pricing.tiers.individuals.map(t => `
          <article class="pricing-card glass-panel${t.popular ? ' is-popular' : ''}" style="position:relative;padding:22px;border-radius:16px;display:flex;flex-direction:column;justify-content:space-between;${t.popular ? 'border:1px solid var(--gold);box-shadow:0 0 25px rgba(248,211,136,0.1)' : ''}">
            ${t.badge ? `<span style="position:absolute;top:10px;right:12px;font-size:10px;font-weight:700;color:var(--gold);background:rgba(248,211,136,0.15);padding:3px 8px;border-radius:10px">${esc(t.badge)}</span>` : ''}
            <div>
              <h3 style="font-size:17px;font-weight:750;margin:0 0 6px">${esc(t.name)}</h3>
              <div style="display:flex;align-items:baseline;gap:4px;margin:8px 0 4px">
                <span style="font-size:28px;font-weight:800;color:var(--text)">${esc(t.price)}</span>
                <span style="color:var(--text-2);font-size:12px">${esc(t.period)}</span>
              </div>
              <span style="display:inline-block;font-size:11.5px;color:var(--text-2);margin-bottom:12px">${esc(t.subtitle)}</span>
              <ul class="bullet-list" style="margin-top:8px;font-size:12px">
                ${t.features.map(f => `<li>${esc(f)}</li>`).join("")}
              </ul>
            </div>
            <button class="button ${t.popular ? 'primary' : 'subtle'}" style="margin-top:18px;width:100%" data-action="simulate-subscribe" data-plan="${esc(t.name)}">
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
          <h2>Formule Établissement de Santé / ESSMS (Pack CODIR)</h2>
          <p>Équipez votre direction, votre responsable qualité et vos cadres de santé.</p>
        </div>
      </div>
      <div class="glass-panel" style="padding:24px;border-radius:18px">
        ${pricing.tiers.etablissement.map(t => `
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px">
            <div>
              <span class="eyebrow" style="color:var(--mint)">5 LICENCES ÉQUIPE DIRECTION</span>
              <h3 style="font-size:20px;font-weight:800;margin:4px 0">${esc(t.name)} — ${esc(t.price)} ${esc(t.period)}</h3>
              <p style="font-size:13px;color:var(--text-2);margin:0 0 10px">${esc(t.subtitle)}</p>
              <ul class="bullet-list" style="font-size:12.5px">
                ${t.features.map(f => `<li>${esc(f)}</li>`).join("")}
              </ul>
            </div>
            <button class="button primary" data-action="simulate-subscribe" data-plan="${esc(t.name)}">
              ${icon("building", 16)}Souscrire pour l'établissement
            </button>
          </div>
        `).join("")}
      </div>
    </div>

    <!-- Fiche d'identification apprenant -->
    <div class="section-block">
      <div class="section-title-row">
        <div>
          <h2>Identification & Rattachement Promotion</h2>
          <p>Personnalisez votre expérience en renseignant votre école ou organisme gestionnaire.</p>
        </div>
      </div>
      <div class="glass-panel" style="padding:22px;border-radius:18px">
        <form id="auth-profile-form">
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin-bottom:14px">
            <div>
              <label style="display:block;font-size:12px;font-weight:600;color:var(--text-2);margin-bottom:4px">Nom et Prénom</label>
              <input type="text" name="name" value="${esc(profile.name || '')}" placeholder="Ex: Alexandre Dupont" style="width:100%;padding:9px 12px;border-radius:10px;border:1px solid var(--stroke);background:rgba(0,0,0,0.15);color:var(--text);font-size:13px" />
            </div>
            <div>
              <label style="display:block;font-size:12px;font-weight:600;color:var(--text-2);margin-bottom:4px">Adresse Email</label>
              <input type="email" name="email" value="${esc(profile.email || '')}" placeholder="alexandre@etablissement.fr" style="width:100%;padding:9px 12px;border-radius:10px;border:1px solid var(--stroke);background:rgba(0,0,0,0.15);color:var(--text);font-size:13px" />
            </div>
            <div>
              <label style="display:block;font-size:12px;font-weight:600;color:var(--text-2);margin-bottom:4px">Profil / Statut</label>
              <select name="role" style="width:100%;padding:9px 12px;border-radius:10px;border:1px solid var(--stroke);background:rgba(0,0,0,0.15);color:var(--text);font-size:13px">
                <option value="Étudiant Master MES" ${profile.role === "Étudiant Master MES" ? "selected" : ""}>Étudiant Master MES (IAE)</option>
                <option value="Élève Directeur (EHESP)" ${profile.role === "Élève Directeur (EHESP)" ? "selected" : ""}>Élève Directeur D3S/DH/CAFDES (EHESP)</option>
                <option value="Directeur d'Établissement" ${profile.role === "Directeur d'Établissement" ? "selected" : ""}>Directeur / Adjoint d'Établissement</option>
                <option value="Cadre de Santé / Soignant" ${profile.role === "Cadre de Santé / Soignant" ? "selected" : ""}>Cadre de Santé / IDEC / Soignant</option>
                <option value="Responsable Qualité" ${profile.role === "Responsable Qualité" ? "selected" : ""}>Responsable Qualité / Gestion des Risques</option>
                <option value="Autre" ${profile.role === "Autre" ? "selected" : ""}>Autre profil du secteur</option>
              </select>
            </div>
            <div>
              <label style="display:block;font-size:12px;font-weight:600;color:var(--text-2);margin-bottom:4px">Établissement / École de rattachement</label>
              <input type="text" name="school" value="${esc(profile.school || '')}" placeholder="Ex: IAE Paris-Est, EHESP, GHU Paris" style="width:100%;padding:9px 12px;border-radius:10px;border:1px solid var(--stroke);background:rgba(0,0,0,0.15);color:var(--text);font-size:13px" />
            </div>
          </div>
          <div style="display:flex;justify-content:flex-end;margin-top:8px">
            <button type="submit" class="button primary">${icon("check", 15)}Enregistrer mon profil apprenant</button>
          </div>
        </form>
      </div>
    </div>

    ${sourceLinks(["iae", "ehesp", "d3s", "cafdes"])}
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
  if (state.page === "carte") syncMapControls();
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
  const nav = event.target.closest("[data-nav]");
  if (nav) { event.preventDefault(); renderPage(nav.dataset.nav); return; }

  // Fermeture du popover notifications au clic extérieur
  if (state.notifsOpen && !event.target.closest("#notif-popover") && !event.target.closest("[data-action=\"toggle-notifications\"]")) {
    state.notifsOpen = false;
    const popover = $("#notif-popover");
    if (popover) popover.hidden = true;
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
    if (peerMultiSelect.isOpen) peerMultiSelect.close();
    else peerMultiSelect.open();
    return;
  }
  const expOpt = event.target.closest(".multiselect-option");
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

  // RH tabs handler - intercepté avant le check data-action
  const rhTab = event.target.closest("[data-rh-tab]");
  if (rhTab) {
    event.preventDefault();
    const tabId = rhTab.dataset.rhTab;
    $$(".rh-tab").forEach(t => {
      const active = t.dataset.rhTab === tabId;
      t.classList.toggle("is-active", active);
      t.setAttribute("aria-selected", String(active));
    });
    $$(".rh-tab-panel").forEach(p => p.classList.toggle("is-active", p.dataset.rhPanel === tabId));
    // Re-init calculators when switching to calculateurs tab
    if (tabId === "calculateurs") { renumberEtptRows(); calculateEtp(); syncForfaitCalendar(); }
    if (tabId === "questions") { const input = $("#faq-query"); if (input) { input.value = state.queries.faq; applyFilter("faq"); } }
    return;
  }

  const actionEl = event.target.closest("[data-action]");
  if (!actionEl) return;
  const action = actionEl.dataset.action;
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
  if (action === "edit-peer") {
    editPeer(actionEl.dataset.id);
    return;
  }
  if (action === "cancel-edit-peer") {
    cancelEditPeer();
    return;
  }
  if (action === "rsvp") {
    handleRsvp(actionEl.dataset.postId, actionEl.dataset.choice);
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
    else unlockApp("universal", { name: "Master Admin" });
    return;
  }
  if (action === "quick-unlock-universal") {
    unlockApp("universal", { name: "Master Admin" });
    return;
  }
  if (action === "prompt-universal-key") {
    renderPage("abonnement");
    setTimeout(() => {
      const input = $("#master-code-input");
      if (input) { input.focus(); input.scrollIntoView({ behavior: "smooth", block: "center" }); }
    }, 200);
    return;
  }
  if (action === "simulate-subscribe") {
    const plan = actionEl.dataset.plan || "Pass Annuel Pro";
    unlockApp(plan, { name: "Abonné " + plan });
    showToast(`👑 Formule "${plan}" activée avec succès !`);
    return;
  }
  if (action === "reset-auth-profile") {
    state.auth = { isUnlocked: false, plan: "freemium", profile: {} };
    writeJSON(STORE.auth, state.auth);
    showToast("Profil réinitialisé en mode freemium.");
    renderPage("abonnement");
    return;
  }

  if (action === "open-sources") openSources();
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

  if (action === "toggle-faq") {
    toggleAccordion(actionEl);
  }
  if (action === "open-search-result") {
    const kind = actionEl.dataset.kind, id = actionEl.dataset.id;
    if (kind === "software") {
      const item=SOFTWARES.find(entry=>entry.name===actionEl.querySelector("strong")?.textContent);
      if(item) openDialog("LOGICIEL MÉTIER",`<h2 class="dialog-title" id="dialog-title">${esc(item.name)}</h2><p class="dialog-lede">${esc(item.what)}</p>${detailCell("Exemple / repère",item.examples)}${sourceLinks(item.sources || [item.source])}`);
    } else if (kind === "faq") {
      const found = FAQ.find(item => item.q === actionEl.querySelector("strong")?.textContent);
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
    state.mapPositions=createInitialMapPositions(); state.mapRotation={x:8,y:352,z:0}; state.mapPerspective=1050; state.mapSceneDepth=0; state.mapZoom=1; state.mapPan={x:0,y:0}; state.mapGesture="rotate"; state.mapFilter="Tout"; state.selectedMapNode="direction";
    renderPage("carte");
  }
  if (action === "map-gesture") { state.mapGesture=state.mapGesture === "rotate" ? "pan" : "rotate"; syncMapControls(); }
  if (action === "delete-peer") {
    state.peers = state.peers.filter(peer => peer.id !== actionEl.dataset.id); writeJSON(STORE.peers,state.peers); renderPeerList(); showToast("Fiche supprimée de cet appareil.");
  }
  if (action === "clear-peers") {
    if (!state.peers.length) { showToast("L’annuaire local est déjà vide."); return; }
    if (window.confirm("Supprimer toutes les fiches enregistrées dans ce navigateur ?")) { state.peers=[]; writeJSON(STORE.peers,state.peers); renderPeerList(); showToast("Les fiches locales ont été supprimées."); }
  }
  if (action === "export-peers") exportPeers();
});

document.addEventListener("input", event => {
  const el = event.target;
  if (el.id === "establishment-query") { state.queries.establishments=el.value; applyFilter("establishments"); }
  if (el.id === "job-query") { state.queries.jobs=el.value; applyFilter("jobs"); }
  if (el.id === "meeting-query") { state.queries.meetings=el.value; applyFilter("meetings"); }
  if (el.id === "document-query") { state.queries.documents=el.value; applyFilter("documents"); }
  if (el.id === "actor-query") { state.queries.actors=el.value; applyFilter("actors"); }
  if (el.id === "faq-query") { state.queries.faq=el.value; applyFilter("faq"); }
  if (el.id === "software-query") { state.queries.software=el.value; applyFilter("software"); }

  if (el.id === "support-job-query") {
    const query = el.value.trim().toLocaleLowerCase("fr");
    const filtered = SUPPORT_JOBS.filter(job => {
      const matchGroup = state.filters.supportJobs === "Tout" || job.family === state.filters.supportJobs;
      const matchQuery = !query || JSON.stringify(job).toLocaleLowerCase("fr").includes(query);
      return matchGroup && matchQuery;
    });
    const results = $("#support-job-results");
    if (results) results.innerHTML = supportJobCards(filtered);
    const countEl = $("#support-job-count");
    if (countEl) countEl.textContent = `${filtered.length} métier${filtered.length === 1 ? "" : "s"}`;
  }

  if (el.id === "etp-active-hours" || el.id === "etp-week-reference" || el.id === "etp-annual-reference" || el.matches("[data-etpt-hours], [data-etpt-months]")) calculateEtp();
  if (el.id === "forfait-year") syncForfaitCalendar();
  else if (["forfait-holidays","forfait-cp","forfait-extra-leave","forfait-days"].includes(el.id)) calculateForfait();
  if (el.id === "global-search") globalSearchResults(el.value);
  if (el.id === "peer-exp-search") peerMultiSelect.filterOptions(el.value);
  if (el.id === "peer-query") { state.queries.peers=el.value; renderPeerList(); }
  if (el.id === "map-zoom") {
    state.mapZoom=Number(el.value)/100;
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
  if (event.key === "Escape" && peerMultiSelect.isOpen) { peerMultiSelect.close(); return; }
  if (event.key === "Escape" && sidebar.classList.contains("is-open")) { closeMenu(); return; }
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); openSearch(); }
  if ((event.key === "Enter" || event.key === " ") && event.target.matches?.(".multiselect-option")) {
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
        linkedin: ""
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
      likes: 0,
      commentsCount: 0,
      isLiked: false,
      rsvp: type === "event" ? { personal: 1, delegate_intern: 0, delegate_staff: 0 } : undefined
    };
    if (type === "event") {
      state.rsvps[newPost.id] = "personal";
      writeJSON(STORE.rsvps, state.rsvps);
    }
    state.posts = [newPost, ...(state.posts || [])];
    writeJSON(STORE.posts, state.posts);

    // Sync to Firestore
    if (typeof window.savePostToFirestore === "function") {
      window.savePostToFirestore(newPost)
        .then(() => showToast(`🎉 ${typeLabel} publié(e) et synchronisé(e) avec le réseau !`))
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
    return;
  }
  if (event.target.id === "peer-form") { event.preventDefault(); addPeer(event.target); }
  if (event.target.id === "master-code-form") {
    event.preventDefault();
    const input = $("#master-code-input");
    const val = (input?.value || "").trim().toUpperCase();
    if (val === PRICING_DATA.masterCode || val === "MOSAIQUE-MASTER-2026" || val === "MASTER" || val === "ADMIN") {
      unlockApp("universal", { name: "Super-Admin Universel" });
      showToast("👑 Code maître validé ! Accès universel (100%) débloqué.");
    } else {
      showToast("❌ Code invalide. Utilisez le code maître : MOSAIQUE-MASTER-2026");
    }
    return;
  }
  if (event.target.id === "auth-profile-form") {
    event.preventDefault();
    const fd = new FormData(event.target);
    const name = String(fd.get("name") || "").trim() || "Utilisateur";
    const email = String(fd.get("email") || "").trim();
    const role = String(fd.get("role") || "").trim();
    const school = String(fd.get("school") || "").trim();
    state.auth = {
      ...state.auth,
      profile: { name, email, role, school },
      identifiedAt: new Date().toISOString()
    };
    writeJSON(STORE.auth, state.auth);
    showToast(`Profil enregistré pour ${name} (${role}).`);
    renderPage("abonnement");
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
  renderPage(pageFromHash(), { fromHistory:true, restoreScrollY:window.history?.state?.scrollY ?? null });
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
        }
      }, () => {
        // Mode silencieux : règles de sécurité en attente de déploiement
      });
      // Subscribe to posts (real-time)
      if (typeof window.subscribeToPostsFirestore === "function") {
        window.subscribeToPostsFirestore((remotePosts) => {
          if (remotePosts && remotePosts.length) {
            const map = new Map(state.posts.map(p => [p.id, p]));
            remotePosts.forEach(r => map.set(r.id, { ...map.get(r.id), ...r }));
            state.posts = Array.from(map.values()).sort((a,b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
            writeJSON(STORE.posts, state.posts);
            if (state.page === "timeline") {
              const feed = $("#timeline-feed");
              if (feed) { feed.innerHTML = renderTimelinePosts(); hydrateIcons(feed); }
            }
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
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
}

initTheme();
initPlatformHints();
bindDialogGestures();
initNavigation();
initServiceWorker();
initFirestoreSync();
})();
