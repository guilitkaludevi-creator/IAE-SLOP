/* ---------------------------------------------------------------------------
   Mosaïque Santé · Flashcards
   Cartes de révision construites depuis les repères de l'application.
   - format adapté au contenu : densité et largeur calculées carte par carte
   - charte « verre dépoli & lumière douce » : papier sable, encre ardoise,
     accents sauge et terracotta, filets fins, rayons généreux
   Exposé via window.MOSAQUE_FLASHCARDS, configuré par app.js.
--------------------------------------------------------------------------- */
(function () {
  "use strict";

  const DENSITY = {
    COMPACT: "compact",
    REGULAR: "regular",
    LONG: "long"
  };

  /* Seuils de densité, mesurés sur la longueur utile du verso. */
  const DENSITY_THRESHOLDS = {
    compactMax: 150,
    longMin: 340
  };

  const DECKS = [
    {
      id: "etablissements",
      label: "Établissements",
      hint: "Structures, publics et rôle du manager",
      accent: "#4f9c8a",
      accentSoft: "rgba(79, 156, 138, .14)",
      build: item => ({
        front: item.name,
        sub: item.sector || item.family || "",
        back: [
          { label: "Publics accueillis", text: item.audience },
          { label: "Pour le manager", text: item.manager }
        ]
      })
    },
    {
      id: "metiers",
      label: "Métiers de direction",
      hint: "Positionnement, trajectoire et limites",
      accent: "#c1734f",
      accentSoft: "rgba(193, 115, 79, .14)",
      build: item => ({
        front: item.name,
        sub: item.level || "",
        back: [
          { label: "Trajectoire", text: item.path },
          { label: "Limite du poste", text: item.boundary }
        ]
      })
    },
    {
      id: "reunions",
      label: "Réunions & instances",
      hint: "À quoi sert l'instance, comment la tenir",
      accent: "#7f7fa8",
      accentSoft: "rgba(127, 127, 168, .14)",
      build: item => ({
        front: item.name,
        sub: item.full || item.kind || "",
        back: [
          { label: "Objet", text: item.purpose },
          { label: "Point de vigilance", text: item.caution }
        ]
      })
    },
    {
      id: "documents",
      label: "Documents de pilotage",
      hint: "Obligation, contenu, usage",
      accent: "#5b87a0",
      accentSoft: "rgba(91, 135, 160, .14)",
      build: item => ({
        front: item.name,
        sub: item.category || "",
        back: [
          { label: "Finalité", text: item.purpose },
          { label: "Quand l'actualiser", text: item.when }
        ]
      })
    },
    {
      id: "acteurs",
      label: "Acteurs institutionnels",
      hint: "Compétence et valeur ajoutée",
      accent: "#b08c3e",
      accentSoft: "rgba(176, 140, 62, .14)",
      build: item => ({
        front: item.name,
        sub: item.type || "",
        back: [
          { label: "Rôle", text: item.role },
          { label: "Ce qu'il apporte", text: item.value }
        ]
      })
    },
    {
      id: "rh",
      label: "Questions RH",
      hint: "Question de direction, réponse courte",
      accent: "#a1647d",
      accentSoft: "rgba(161, 100, 125, .14)",
      build: item => ({
        front: item.q,
        sub: item.tag || "",
        back: [{ label: "Réponse", text: item.a }]
      })
    },
    {
      id: "logiciels",
      label: "Logiciels métiers",
      hint: "Famille d'outil et cadre d'usage",
      accent: "#5f8f6d",
      accentSoft: "rgba(95, 143, 109, .14)",
      build: item => ({
        front: item.name,
        sub: item.group || "",
        back: [
          { label: "Ce que couvre l'outil", text: item.what },
          { label: "Points de contrôle", text: item.examples }
        ]
      })
    },
    {
      id: "qualite",
      label: "Qualité & Événements Indésirables",
      hint: "AgEval, Niveaux d'EI et Déclarations obligatoires",
      accent: "#2dd4bf",
      accentSoft: "rgba(45, 212, 191, .16)",
      build: item => ({
        front: item.name,
        sub: `Niveau ${item.level} · ${item.short || ""}`,
        back: [
          { label: "Quand choisir ce niveau ?", text: item.whenToChoose },
          { label: "Ce que ce choix provoque", text: item.consequences },
          { label: "Déclaration externe", text: item.externalDeclaration ? "OUI — ARS / Parquet art. 40 CPP" : "NON — Traitement et traçabilité interne AgEval" }
        ]
      })
    },
    {
      id: "politique",
      label: "Politique & Lois de Santé",
      hint: "Lois 2002-2, 2005, 2024 Bien Vieillir, PRS 3",
      accent: "#38bdf8",
      accentSoft: "rgba(56, 189, 248, .16)",
      build: item => ({
        front: item.title,
        sub: `${item.year || ""} · ${item.status || ""}`,
        back: [
          { label: "Dispositions majeures", text: item.summary },
          { label: "Impact pour le manager", text: item.managerImpact }
        ]
      })
    }
  ];

  const SOURCE_KEYS = {
    etablissements: "ESTABLISHMENTS",
    metiers: "JOBS",
    reunions: "MEETINGS",
    documents: "DOCUMENTS",
    acteurs: "ACTORS",
    rh: "FAQ",
    logiciels: "SOFTWARES"
  };

  let deps = {
    data: {},
    esc: value => String(value == null ? "" : value),
    icon: () => "",
    isPremiumUnlocked: () => false,
    paywallGate: () => "",
    onLocked: null,
    onError: null,
    onSaved: null
  };

  function configure(next) {
    deps = Object.assign({}, deps, next || {});
  }

  function cleanText(value) {
    return String(value == null ? "" : value)
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function backLength(back) {
    return back.reduce((total, block) => total + cleanText(block.text).length, 0);
  }

  function densityFor(card) {
    const length = backLength(card.back);
    if (length <= DENSITY_THRESHOLDS.compactMax) return DENSITY.COMPACT;
    if (length >= DENSITY_THRESHOLDS.longMin) return DENSITY.LONG;
    return DENSITY.REGULAR;
  }

  function buildDeck(deckDef) {
    let source = [];
    if (deckDef.id === "qualite") {
      source = deps.data?.ADVERSE_EVENTS?.levels || [];
    } else if (deckDef.id === "politique") {
      source = deps.data?.HEALTH_POLICY?.nationalLaws || [];
    } else {
      source = deps.data?.[SOURCE_KEYS[deckDef.id]] || [];
    }
    const cards = source.map((item, index) => {
      const shaped = deckDef.build(item);
      const back = (shaped.back || [])
        .map(block => ({ label: cleanText(block.label), text: cleanText(block.text) }))
        .filter(block => block.text);
      const card = {
        id: `${deckDef.id}-${index}`,
        deck: deckDef.id,
        front: cleanText(shaped.front),
        sub: cleanText(shaped.sub),
        back
      };
      card.density = densityFor(card);
      return card;
    }).filter(card => card.front && card.back.length);
    return { id: deckDef.id, label: deckDef.label, hint: deckDef.hint, accent: deckDef.accent, accentSoft: deckDef.accentSoft, cards };
  }

  let deckCache = null;
  function allDecks() {
    if (!deckCache) deckCache = DECKS.map(buildDeck);
    return deckCache;
  }

  function deckById(id) {
    const decks = allDecks();
    return decks.find(deck => deck.id === id) || decks[0];
  }
/* --- Rendu dans l'application ------------------------------------------ */

  function matchesQuery(card, query) {
    if (!query) return true;
    const haystack = [card.front, card.sub, ...card.back.map(block => `${block.label} ${block.text}`)]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  }

  function renderBlock(block) {
    return `<div class="flash-block">
        <span class="flash-block-label">${deps.esc(block.label)}</span>
        <p>${deps.esc(block.text)}</p>
      </div>`;
  }

  function renderCard(card, deck, position, options) {
    const revealed = !options.studyMode || options.revealed.has(card.id);
    const wide = card.density === DENSITY.LONG ? " flash-card--wide" : "";
    return `<article class="flash-card${wide}" data-density="${card.density}" style="--flash-accent:${deck.accent};--flash-accent-soft:${deck.accentSoft}">
        <header class="flash-card-head">
          <span class="flash-deck">${deps.esc(deck.label)}</span>
          <span class="flash-num">${String(position + 1).padStart(2, "0")}</span>
        </header>
        <h2 class="flash-front">${deps.esc(card.front)}</h2>
        ${card.sub ? `<p class="flash-sub">${deps.esc(card.sub)}</p>` : ""}
        <div class="flash-body"${revealed ? "" : " hidden"}>
          ${card.back.map(renderBlock).join("")}
        </div>
        <footer class="flash-card-foot">
          <span class="flash-brand">Mosaïque Santé · Révision MES</span>
          ${options.studyMode
            ? `<button class="flash-reveal" type="button" data-action="reveal-card" data-card="${card.id}" aria-expanded="${revealed}">${deps.icon(revealed ? "check" : "spark", 14)}${revealed ? "Verso affiché" : "Révéler"}</button>`
            : `<button class="flash-reveal" type="button" data-action="reveal-card" data-card="${card.id}" aria-expanded="${revealed}">${deps.icon(revealed ? "check" : "spark", 14)}${revealed ? "Masquer détails" : "Voir repères"}</button>`}
        </footer>
      </article>`;
  }

  function renderDeckTabs(activeDeck, decks) {
    return `<div class="flash-decks" role="tablist" aria-label="Jeux de cartes">${decks.map(deck => {
      const active = deck.id === activeDeck.id;
      return `<button class="flash-deck-tab${active ? " is-active" : ""}" type="button" role="tab" aria-selected="${active}" data-action="select-flash-deck" data-deck="${deck.id}" style="--flash-accent:${deck.accent};--flash-accent-soft:${deck.accentSoft}">
          <span class="flash-deck-tab-label">${deps.esc(deck.label)}</span>
          <span class="flash-deck-tab-count">${deck.cards.length}</span>
        </button>`;
    }).join("")}</div>`;
  }

  function renderPage(options = {}) {
    const decks = allDecks();
    const deck = deckById(options.deckId);
    const query = (options.query || "").trim().toLowerCase();
    const visible = deck.cards.filter(card => matchesQuery(card, query));
    const studyMode = Boolean(options.studyMode);
    const revealed = options.revealed instanceof Set ? options.revealed : new Set();
    const totalCards = decks.reduce((total, item) => total + item.cards.length, 0);

    if (!deps.isPremiumUnlocked()) {
      return `<section class="page page-flashcards">
        ${deps.paywallGate(
          "Flashcards · les repères en cartes mémo",
          `Les ${totalCards} cartes de révision (établissements, métiers, instances, documents, acteurs, RH, logiciels) sont réservées aux abonnés. Chaque carte est mise en page selon son contenu, en recto-verso, avec un export PDF prêt à imprimer.`,
          ""
        )}
        <div class="flash-teaser" aria-hidden="true">
          ${decks.slice(0, 4).map(deckItem => `<div class="flash-teaser-card" style="--flash-accent:${deckItem.accent};--flash-accent-soft:${deckItem.accentSoft}">
            <span class="flash-deck">${deps.esc(deckItem.label)}</span>
            <strong>${deckItem.cards.length} cartes</strong>
            <span class="flash-teaser-hint">${deps.esc(deckItem.hint)}</span>
          </div>`).join("")}
        </div>
      </section>`;
    }

    return `<section class="page page-flashcards" data-study="${studyMode}" aria-labelledby="flash-title">
      <div class="page-head">
        <div class="page-head-copy">
          <span class="eyebrow">RÉVISION · CARTES MÉMO</span>
          <h1 id="flash-title">Les repères, <span class="text-gradient">en un coup d’œil.</span></h1>
          <p class="lede">${totalCards} cartes construites à partir des fiches de l’application. Le format s’ajuste au contenu : une carte courte reste compacte, une carte dense s’élargit pour éviter les blocs vides.</p>
        </div>
        <div class="page-actions">
          <button class="button primary" type="button" data-action="download-flashcards">${deps.icon("download", 16)}Télécharger le PDF</button>
        </div>
      </div>

      ${renderDeckTabs(deck, decks)}

      <div class="flash-toolbar">
        <label class="search-box flash-search">
          ${deps.icon("search", 17)}
          <input class="form-control" id="flash-query" type="search" placeholder="Rechercher dans les cartes" value="${deps.esc(options.query || "")}" autocomplete="off">
        </label>
        <div class="flash-toolbar-meta">
          <span class="flash-count">${visible.length} / ${deck.cards.length} cartes</span>
          <button class="button subtle flash-mode-toggle" type="button" data-action="toggle-flash-mode" aria-pressed="${studyMode}">
            ${deps.icon(studyMode ? "check" : "layers", 15)}${studyMode ? "Mode révision actif" : "Mode révision"}
          </button>
        </div>
      </div>
      ${visible.length
        ? `<div class="flash-grid">${visible.map(card => renderCard(card, deck, deck.cards.indexOf(card), { studyMode, revealed })).join("")}</div>`
        : `<div class="empty-state"><strong>Aucune carte ne correspond</strong>Essayez un autre mot-clé ou changez de jeu de cartes.</div>`}
    </section>`;
  }
/* --- Export PDF : charte papier sable, cartes au format adaptatif ------ */

  const PDF = {
    width: 210,
    height: 297,
    margin: 14,
    gap: 6,
    footer: 12,
    ink: [32, 47, 50],
    inkSoft: [58, 80, 82],
    muted: [110, 122, 118],
    paper: [247, 243, 237],
    card: [255, 253, 249],
    line: [222, 213, 199],
    bodySize: 8.4,
    lineFactor: 1.42,
    pt: 0.3528,
    minRowBreak: 26
  };

  const PDF_FONT_SCALES = [1, 0.94, 0.88, 0.82, 0.76, 0.7];

  function sanitizeForPdf(text) {
    return String(text == null ? "" : text)
      .replace(/[\u2018\u2019\u2032]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2013\u2014]/g, "-")
      .replace(/\u2026/g, "...")
      .replace(/[\u2192\u21D2]/g, "->")
      .replace(/\u2265/g, ">=")
      .replace(/\u2264/g, "<=")
      .replace(/[\u00A0\u202F\u2009]/g, " ")
      .replace(/[\u2022\u25CF\u25AA]/g, "-")
      .replace(/[^\x09\x0A\x0D\x20-\x7E\u00A0-\u017F\u2013\u2014\u2018\u2019\u201C\u201D\u2026\u20AC]/g, "");
  }

  function frontSizeFor(text) {
    const length = text.length;
    if (length <= 38) return 13.2;
    if (length <= 62) return 11.6;
    if (length <= 92) return 10.4;
    if (length <= 130) return 9.4;
    return 8.6;
  }

  function layoutCard(pdf, card, deck, width, scale) {
    const pad = 5;
    const inner = width - pad * 2;
    const bodySize = PDF.bodySize * scale;
    const lineHeight = bodySize * PDF.lineFactor * PDF.pt;
    const frontSize = frontSizeFor(card.front) * Math.min(scale + 0.08, 1);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(frontSize);
    const frontLines = pdf.splitTextToSize(sanitizeForPdf(card.front), inner);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(bodySize);
    const subLines = card.sub ? pdf.splitTextToSize(sanitizeForPdf(card.sub), inner) : [];

    const blocks = card.back.map(block => ({
      label: sanitizeForPdf(block.label),
      lines: pdf.splitTextToSize(sanitizeForPdf(block.text), inner)
    }));

    const headHeight = 4.2;
    const frontHeight = frontLines.length * frontSize * PDF.pt * 1.16;
    const subHeight = subLines.length ? subLines.length * bodySize * PDF.pt * 1.3 + 1.4 : 0;
    const bodyHeight = blocks.reduce((total, block) => total + 3.5 + block.lines.length * lineHeight + 2, 0);
    const footHeight = 5;
    const height = pad + headHeight + 2.4 + frontHeight + subHeight + 3 + bodyHeight + footHeight + pad;

    return {
      width,
      height,
      pad,
      inner,
      bodySize,
      lineHeight,
      frontSize,
      frontLines,
      subLines,
      blocks,
      headHeight,
      frontHeight,
      subHeight,
      bodyHeight,
      footHeight
    };
  }

  function fitCard(pdf, card, deck, width, maxHeight) {
    let layout = null;
    for (const scale of PDF_FONT_SCALES) {
      layout = layoutCard(pdf, card, deck, width, scale);
      if (layout.height <= maxHeight) return layout;
    }
    /* Dernier recours : on coupe le texte du verso pour tenir dans la page. */
    const last = layout;
    const overflow = last.height - maxHeight;
    const linesToDrop = Math.ceil(overflow / last.lineHeight);
    if (linesToDrop > 0) {
      let remaining = Math.max(1, linesToDrop);
      for (let index = last.blocks.length - 1; index >= 0 && remaining > 0; index -= 1) {
        const block = last.blocks[index];
        const drop = Math.min(block.lines.length - 1, remaining);
        if (drop > 0) {
          block.lines = block.lines.slice(0, block.lines.length - drop);
          block.lines[block.lines.length - 1] += " ...";
          remaining -= drop;
        }
      }
      last.height = maxHeight;
    }
    return last;
  }

  function paintPageBackground(pdf) {
    pdf.setFillColor(...PDF.paper);
    pdf.rect(0, 0, PDF.width, PDF.height, "F");
  }

  function drawRunningHead(pdf, sectionLabel, sectionAccent) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7.2);
    pdf.setTextColor(...PDF.muted);
    pdf.text("MOSAIQUE SANTE  .  FLASHCARDS", PDF.margin, 11);
    if (sectionLabel) {
      pdf.setTextColor(...sectionAccent);
      pdf.text(sanitizeForPdf(sectionLabel).toUpperCase(), PDF.width - PDF.margin, 11, { align: "right" });
    }
    pdf.setDrawColor(...PDF.line);
    pdf.setLineWidth(0.25);
    pdf.line(PDF.margin, 13.2, PDF.width - PDF.margin, 13.2);
  }

  function drawCard(pdf, layout, x, y, card, deck, rowHeight) {
    const height = rowHeight || layout.height;
    pdf.setFillColor(...PDF.card);
    pdf.setDrawColor(...PDF.line);
    pdf.setLineWidth(0.25);
    pdf.roundedRect(x, y, layout.width, height, 3.2, 3.2, "FD");

    /* Filet d'accent vertical, signature de la charte. */
    pdf.setFillColor(...hexToRgb(deck.accent));
    pdf.roundedRect(x + 0.9, y + 1.6, 0.7, height - 3.2, 0.35, 0.35, "F");

    let cursor = y + layout.pad;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(6.4);
    pdf.setTextColor(...hexToRgb(deck.accent));
    pdf.text(sanitizeForPdf(deck.label).toUpperCase(), x + layout.pad + 1.4, cursor + 2.4);
    cursor += layout.headHeight + 2.4;

    pdf.setFontSize(layout.frontSize);
    pdf.setTextColor(...PDF.ink);
    layout.frontLines.forEach(line => {
      pdf.text(line, x + layout.pad + 1.4, cursor + layout.frontSize * PDF.pt * 0.82);
      cursor += layout.frontSize * PDF.pt * 1.16;
    });

    if (layout.subLines.length) {
      cursor += 1.4;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(layout.bodySize);
      pdf.setTextColor(...PDF.muted);
      layout.subLines.forEach(line => {
        pdf.text(line, x + layout.pad + 1.4, cursor + layout.bodySize * PDF.pt * 0.8);
        cursor += layout.bodySize * PDF.pt * 1.3;
      });
    }

    cursor += 3;
    pdf.setDrawColor(...PDF.line);
    pdf.line(x + layout.pad + 1.4, cursor, x + layout.width - layout.pad, cursor);
    cursor += 3;

    layout.blocks.forEach(block => {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(6.2);
      pdf.setTextColor(...hexToRgb(deck.accent));
      pdf.text(block.label.toUpperCase(), x + layout.pad + 1.4, cursor + 2.2);
      cursor += 3.5;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(layout.bodySize);
      pdf.setTextColor(...PDF.inkSoft);
      block.lines.forEach(line => {
        pdf.text(line, x + layout.pad + 1.4, cursor + layout.bodySize * PDF.pt * 0.8);
        cursor += layout.lineHeight;
      });
      cursor += 2;
    });

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(6);
    pdf.setTextColor(...PDF.muted);
    pdf.text("Mosaique Sante", x + layout.pad + 1.4, y + height - layout.pad + 1.2);
    pdf.setFont("helvetica", "bold");
    pdf.text(sanitizeForPdf(deck.label), x + layout.width - layout.pad, y + height - layout.pad + 1.2, { align: "right" });
  }

  function hexToRgb(hex) {
    const value = String(hex || "").replace("#", "");
    const full = value.length === 3 ? value.split("").map(char => char + char).join("") : value;
    const int = parseInt(full || "4f9c8a", 16);
    return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
  }
const CONTENT_TOP = 20;
  const CONTENT_BOTTOM = 282;
  const COLUMN_WIDTH = (PDF.width - PDF.margin * 2 - PDF.gap) / 2;
  const FULL_WIDTH = PDF.width - PDF.margin * 2;
  const MAX_HALF_HEIGHT = 78;
  const SECTION_HEIGHT = 12;

  function drawCover(pdf, decks, totalCards) {
    pdf.addPage();
    paintPageBackground(pdf);

    pdf.setFillColor(...PDF.card);
    pdf.setDrawColor(...PDF.line);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(PDF.margin, 18, FULL_WIDTH, 118, 6, 6, "FD");
    pdf.setFillColor(79, 156, 138);
    pdf.roundedRect(PDF.margin + 1.2, 20, 1.4, 114, 0.7, 0.7, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(79, 156, 138);
    pdf.text("MOSAIQUE SANTE  .  CARTES MEMO", PDF.margin + 10, 34);

    pdf.setFontSize(30);
    pdf.setTextColor(...PDF.ink);
    pdf.text("Flashcards", PDF.margin + 10, 56);
    pdf.setFontSize(15);
    pdf.setTextColor(...PDF.inkSoft);
    pdf.text("Les reperes du management en sante, en cartes.", PDF.margin + 10, 68);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(...PDF.muted);
    const intro = pdf.splitTextToSize(
      "Chaque carte tient sur un format adapte a son contenu : les cartes courtes restent compactes et se placent par deux, les cartes denses occupent toute la largeur. Recto : la notion. Verso : les reperes utiles au manager.",
      FULL_WIDTH - 20
    );
    pdf.text(intro, PDF.margin + 10, 82);

    pdf.setDrawColor(...PDF.line);
    pdf.line(PDF.margin + 10, 106, PDF.width - PDF.margin - 10, 106);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(...PDF.ink);
    pdf.text(`${totalCards} cartes`, PDF.margin + 10, 116);

    let leftY = 138;
    let rightY = 138;
    const half = Math.ceil(decks.length / 2);
    decks.forEach((deck, index) => {
      const columnLeft = index < half;
      const x = PDF.margin + 6 + (columnLeft ? 0 : FULL_WIDTH / 2 + 4);
      const y = columnLeft ? leftY : rightY;
      pdf.setFillColor(...hexToRgb(deck.accent));
      pdf.circle(x + 1.2, y - 1.2, 1.2, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9.5);
      pdf.setTextColor(...PDF.ink);
      pdf.text(sanitizeForPdf(deck.label), x + 5, y);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7.6);
      pdf.setTextColor(...PDF.muted);
      pdf.text(sanitizeForPdf(deck.hint), x + 5, y + 4.2);
      pdf.text(`${deck.cards.length} cartes`, x + 5, y + 8.4);
      if (columnLeft) leftY += 16; else rightY += 16;
    });

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.4);
    pdf.setTextColor(...PDF.muted);
    pdf.text(
      "Mosaique Sante  .  reperes pedagogiques, a verifier avant toute decision.",
      PDF.width / 2, PDF.height - 16, { align: "center" }
    );
  }

  function buildRows(pdf, decks) {
    const rows = [];
    decks.forEach(deck => {
      rows.push({ type: "section", deck });
      let buffer = [];
      const flush = () => {
        for (let index = 0; index < buffer.length; index += 2) {
          rows.push({ type: "row", deck, cards: buffer.slice(index, index + 2), full: false });
        }
        buffer = [];
      };
      deck.cards.forEach(card => {
        const half = layoutCard(pdf, card, deck, COLUMN_WIDTH, 1);
        if (half.height > MAX_HALF_HEIGHT) {
          flush();
          rows.push({ type: "row", deck, cards: [card], full: true });
        } else {
          buffer.push(card);
        }
      });
      flush();
    });
    return rows;
  }

  function drawSectionBand(pdf, deck, y) {
    pdf.setFillColor(...hexToRgb(deck.accent));
    pdf.roundedRect(PDF.margin, y, 2.2, 7, 0.6, 0.6, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(...PDF.ink);
    pdf.text(sanitizeForPdf(deck.label), PDF.margin + 6, y + 4.6);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.6);
    pdf.setTextColor(...PDF.muted);
    pdf.text(sanitizeForPdf(deck.hint), PDF.width - PDF.margin, y + 4.6, { align: "right" });
    pdf.setDrawColor(...PDF.line);
    pdf.setLineWidth(0.2);
    pdf.line(PDF.margin, y + 8.4, PDF.width - PDF.margin, y + 8.4);
  }

  async function exportPdf(options = {}) {
    if (!deps.isPremiumUnlocked()) {
      deps.onLocked?.();
      return false;
    }
    let jsPDF;
    try {
      ({ jsPDF } = await import("https://cdn.jsdelivr.net/npm/jspdf@2.5.2/+esm"));
    } catch {
      deps.onError?.("Telechargement PDF indisponible hors connexion. Reessayez avec une connexion.");
      return false;
    }

    const decks = options.deckId && options.deckId !== "all"
      ? [deckById(options.deckId)]
      : allDecks();
    const totalCards = decks.reduce((total, deck) => total + deck.cards.length, 0);
    const pdf = new jsPDF({ unit: "mm", format: "a4", compress: true });

    drawCover(pdf, decks, totalCards);

    pdf.addPage();
    paintPageBackground(pdf);

    let y = CONTENT_TOP;
    let currentSection = null;

    const startPage = () => {
      pdf.addPage();
      paintPageBackground(pdf);
      drawRunningHead(pdf, currentSection ? currentSection.label : "", hexToRgb(currentSection ? currentSection.accent : "#4f9c8a"));
      y = CONTENT_TOP;
    };

    buildRows(pdf, decks).forEach(item => {
      if (item.type === "section") {
        currentSection = item.deck;
        if (y + SECTION_HEIGHT > CONTENT_BOTTOM) startPage();
        else if (y === CONTENT_TOP) drawRunningHead(pdf, item.deck.label, hexToRgb(item.deck.accent));
        drawSectionBand(pdf, item.deck, y);
        y += SECTION_HEIGHT;
        return;
      }

      if (item.full) {
        const layout = fitCard(pdf, item.cards[0], item.deck, FULL_WIDTH, CONTENT_BOTTOM - CONTENT_TOP);
        if (y + layout.height > CONTENT_BOTTOM) startPage();
        drawCard(pdf, layout, PDF.margin, y, item.cards[0], item.deck, layout.height);
        y += layout.height + PDF.gap;
        return;
      }

      const layouts = item.cards.map(card => fitCard(pdf, card, item.deck, COLUMN_WIDTH, MAX_HALF_HEIGHT * 1.8));
      const rowHeight = Math.max(...layouts.map(layout => layout.height));
      if (y + rowHeight > CONTENT_BOTTOM) startPage();
      layouts.forEach((layout, index) => {
        const x = PDF.margin + index * (COLUMN_WIDTH + PDF.gap);
        drawCard(pdf, layout, x, y, item.cards[index], item.deck, rowHeight);
      });
      y += rowHeight + PDF.gap;
    });

    const totalPages = pdf.getNumberOfPages();
    for (let page = 2; page <= totalPages; page += 1) {
      pdf.setPage(page);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      pdf.setTextColor(...PDF.muted);
      pdf.text("Mosaique Sante  .  Flashcards", PDF.margin, PDF.height - 8);
      pdf.text(`${page - 1} / ${totalPages - 1}`, PDF.width - PDF.margin, PDF.height - 8, { align: "right" });
    }

    pdf.save(options.fileName || "mosaique-sante-flashcards.pdf");
    deps.onSaved?.(totalCards, totalPages - 1);
    return true;
  }

  window.MOSAQUE_FLASHCARDS = {
    configure,
    allDecks,
    deckById,
    renderPage,
    exportPdf,
    DENSITY
  };
})();
