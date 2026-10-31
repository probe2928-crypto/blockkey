// BLOCKKEY 정적 사이트 빌드: content/ + data/ + public/ → dist/
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { markdown, frontmatter, esc } from "./lib.mjs";
import { T as I18N, LANGS, LANG_LABEL, LANG_NAME } from "./i18n.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const json = (p) => JSON.parse(read(p));

const SITE = json("site.config.json");
const ECO = json("data/ecosystem.json");
const MKT = json("data/markets.json");
const ADS = json("data/ads.json");
const PJ = json("data/projects.json");
// 언어별 상태: 빌드 루프가 언어마다 바꿔 끼운다
let LANG = "ko", L = I18N.ko, HOME = json("data/home.json"), insights = [];
const tr = (o, k) => (LANG !== "ko" && o && o[`${k}_${LANG}`] != null ? o[`${k}_${LANG}`] : o?.[k]);
const prefix = (lang = LANG) => (lang === "ko" ? "" : `${lang}/`);

// 커스텀 도메인이면 "/", GitHub Pages 기본 주소면 "/blockkey/"
const BASE = (process.env.BASE_PATH || "/").replace(/\/+$/, "") + "/";
const ORIGIN = SITE.domain ? `https://${SITE.domain}` : (process.env.SITE_URL || "").replace(/\/+$/, "");
const u = (p = "", lang = LANG) => BASE + prefix(lang) + String(p).replace(/^\/+/, "");
const ua = (p = "") => BASE + String(p).replace(/^\/+/, ""); // 공용 파일(css, js, 이미지)
const abs = (p = "", lang = LANG) => (ORIGIN ? ORIGIN + u(p, lang) : u(p, lang));
const BUILD_ID = Date.now().toString(36);

/* ---------- 글 ---------- */
function loadInsights(lang) {
  const dir = lang === "ko" ? "content/insights" : `content/insights/${lang}`;
  if (!fs.existsSync(path.join(ROOT, dir))) return [];
  return fs.readdirSync(path.join(ROOT, dir))
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const { data, body } = frontmatter(read(`${dir}/${f}`));
      return { slug: f.replace(/\.md$/, ""), ...data, date: String(data.date || ""), html: fixLinks(markdown(body)) };
    })
    .filter((p) => !p.draft)
    .sort((a, b) => b.date.localeCompare(a.date));
}

// 마크다운 안의 "/markets/" 같은 사이트 내부 링크에 BASE 붙이기
function fixLinks(html) {
  return html.replace(/href="\/(?!\/)([^"]*)"/g, (_, p) => `href="${u(p)}"`);
}
const fmtDate = (d) => {
  const m = String(d).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? L.fmtDate(+m[1], +m[2], +m[3]) : d;
};

/* ---------- 공통 레이아웃 ---------- */
const NAV = () => L.nav;
const navHref = (h) => (h.startsWith("#") ? u("") + h : u(h));
const TG = (SITE.contact.telegram || "").replace(/^@/, "");
const ROMAN = ["I", "II", "III", "IV", "V", "VI"];

// 히어로 오브제: 알루미늄 덩어리에 열쇠 구멍 겸 스피커 유닛 같은 동심원. 페이지의 유일한 장식.
// 엠블럼: 알루미늄 링 + 샴페인 골드 실린더 + 열쇠 구멍. 헤더·푸터·인트로 공용
const EMBLEM = (cls = "emblem") => `<svg class="${cls}" viewBox="0 0 40 40" aria-hidden="true"><defs><linearGradient id="em-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ecdcb8"/><stop offset="1" stop-color="#9c7b44"/></linearGradient></defs><circle cx="20" cy="20" r="18.4" fill="none" stroke="currentColor" stroke-width="1.1" opacity=".75"/><circle cx="20" cy="20" r="13.6" fill="none" stroke="currentColor" stroke-width=".6" opacity=".35"/><circle cx="20" cy="20" r="8.6" fill="url(#em-g)"/><circle cx="20" cy="17.6" r="2.3" fill="#1a1408"/><rect x="18.9" y="18" width="2.2" height="7" rx="1.1" fill="#1a1408"/></svg>`;
const OBJ_LABEL = "__OBJ__";
const OBJECT_SRC = `<svg class="obj" viewBox="0 0 520 620" role="img" aria-label="${OBJ_LABEL}">
  <defs>
    <linearGradient id="alu" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#e9e9e7"/><stop offset=".38" stop-color="#b9babb"/><stop offset=".62" stop-color="#8d8e90"/><stop offset="1" stop-color="#4a4b4d"/>
    </linearGradient>
    <linearGradient id="edge" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/>
    </linearGradient>
    <radialGradient id="well" cx=".42" cy=".38" r=".75">
      <stop offset="0" stop-color="#3a3b3d"/><stop offset=".6" stop-color="#151516"/><stop offset="1" stop-color="#050505"/>
    </radialGradient>
    <radialGradient id="ring" cx=".5" cy=".5" r=".5">
      <stop offset=".86" stop-color="#2a2b2c"/><stop offset=".93" stop-color="#d9d9d6"/><stop offset="1" stop-color="#6c6d6f"/>
    </radialGradient>
    <linearGradient id="champ" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#e6d3ad"/><stop offset=".5" stop-color="#b8975c"/><stop offset="1" stop-color="#7d6234"/>
    </linearGradient>
    <linearGradient id="sweep" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <pattern id="brush" width="4" height="520" patternUnits="userSpaceOnUse"><rect width="1" height="520" fill="#fff" opacity=".05"/><rect x="2" width="1" height="520" fill="#000" opacity=".04"/></pattern>
    <clipPath id="body"><rect x="70" y="40" width="380" height="520" rx="34"/></clipPath>
    <filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="22"/></filter>
  </defs>
  <ellipse cx="260" cy="596" rx="190" ry="16" fill="#000" opacity=".55" filter="url(#soft)"/>
  <g clip-path="url(#body)">
    <rect x="70" y="40" width="380" height="520" fill="url(#alu)"/>
    <rect x="70" y="40" width="380" height="520" fill="url(#brush)"/>
    <rect x="70" y="40" width="380" height="520" fill="url(#edge)"/>
    <rect class="obj-sweep" x="-160" y="40" width="160" height="520" fill="url(#sweep)"/>
  </g>
  <rect x="70.5" y="40.5" width="379" height="519" rx="34" fill="none" stroke="#fff" stroke-opacity=".35"/>
  <circle cx="260" cy="268" r="128" fill="url(#ring)"/>
  <circle cx="260" cy="268" r="112" fill="url(#well)"/>
  <circle cx="260" cy="268" r="84" fill="none" stroke="#fff" stroke-opacity=".06"/>
  <circle cx="260" cy="268" r="58" fill="none" stroke="#fff" stroke-opacity=".08"/>
  <circle cx="260" cy="268" r="30" fill="url(#champ)"/>
  <rect x="255" y="250" width="10" height="36" rx="5" fill="#2b2112"/>
  <circle cx="260" cy="252" r="9" fill="#2b2112"/>
  <text x="260" y="478" text-anchor="middle" class="obj-word">BLOCKKEY</text>
  <line x1="236" y1="500" x2="284" y2="500" stroke="url(#champ)" stroke-width="1.2"/>
</svg>`;

function layout({ title, description = L.description, path: p = "", body, bodyClass = "", jsonld }) {
  const fullTitle = title ? `${title} | ${SITE.name}` : L.title;
  const canonical = abs(p);
  const ga = SITE.analytics?.ga4;
  const cfg = {
    base: BASE,
    contact: { email: SITE.contact.email, web3formsKey: SITE.contact.web3formsKey, formspreeId: SITE.contact.formspreeId, telegram: TG },
    lang: LANG,
    t: L.js,
    coins: MKT.coins.map((c) => ({ ...c, name: tr(c, "name") })),
  };
  return `<!doctype html>
<html lang="${L.htmlLang}">
<head>
<meta charset="utf-8">
<script>(function(){var h=location.hostname;if(h!=="probe2928-crypto.github.io")return;try{if(sessionStorage.getItem("q_play")==="1")return}catch(e){}var p=new URLSearchParams(location.search);if(p.get("src")==="twa"||document.referrer.indexOf("android-app://")===0)return;var s=document.createElement("script");s.async=true;s.src="https://www.googletagmanager.com/gtag/js?id=G-8YQ1BGBDR7";document.head.appendChild(s);window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments)};var D={ad_storage:"denied",ad_user_data:"denied",ad_personalization:"denied"};gtag("consent","default",Object.assign({analytics_storage:"denied",region:["AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IS","IE","IT","LV","LI","LT","LU","MT","NL","NO","PL","PT","RO","SK","SI","ES","SE","GB","CH"]},D));gtag("consent","default",Object.assign({analytics_storage:"granted"},D));gtag("js",new Date());gtag("config","G-8YQ1BGBDR7",{allow_google_signals:false,allow_ad_personalization_signals:false})})();</script>
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(SITE.nameFull)}">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${esc((ORIGIN || "") + ua("og.png"))}">
<meta property="og:locale" content="${L.ogLocale}">
${p === "404.html" ? "" : LANGS.map((l) => `<link rel="alternate" hreflang="${l}" href="${esc(abs(p, l))}">`).join("\n") + `\n<link rel="alternate" hreflang="x-default" href="${esc(abs(p, "ko"))}">`}
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#000000">
<link rel="icon" href="${ua("icons/icon.svg")}" type="image/svg+xml">
<link rel="apple-touch-icon" href="${ua("icons/apple-touch-icon.png")}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,400..700&family=Cormorant+Garamond:ital,wght@1,300;1,400&family=DM+Serif+Display:ital@0;1&family=Hahmlet:wght@200;300;400&family=Marcellus&family=Noto+Sans+KR:wght@300;400;500&display=swap">
<link rel="stylesheet" href="${ua("style.css")}?v=${BUILD_ID}">
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` : ""}
${ga ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${esc(ga)}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${esc(ga)}');</script>` : ""}
<script>window.BK=${JSON.stringify(cfg)}</script>
${bodyClass === "home" ? `<script>try{if(!sessionStorage.getItem("bk-intro")&&!matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.classList.add("intro-on")}catch(e){}</script>` : ""}
<script src="${ua("app.js")}?v=${BUILD_ID}" defer></script>
</head>
<body class="${bodyClass}">
${bodyClass === "home" ? `<div class="intro" aria-hidden="true"><div class="intro-in">${EMBLEM("intro-em")}<p class="intro-word">${"BLOCKKEY".split("").map((c, i) => `<span style="--i:${i}">${c}</span>`).join("")}</p><p class="intro-sign">L'art de relier.</p></div></div>` : ""}
<a class="skip" href="#main">${L.skip}</a>
<header class="top">
  <div class="wrap top-in">
    <a class="brand" href="${u("")}" aria-label="${esc(SITE.nameFull)} ${L.home}">${EMBLEM()}<span>BLOCKKEY</span></a>
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="nav"><span class="menu-lines" aria-hidden="true"></span><span class="menu-txt">${L.menu}</span></button>
    <nav id="nav" class="nav" aria-label="${L.mainNav}">
      ${NAV().map(([t, h]) => `<a href="${navHref(h)}">${t}</a>`).join("")}
    </nav>
    <div class="lang" role="group" aria-label="${L.langPick}">${LANGS.map((l) => `<a href="${esc(p === "404.html" ? u("", l) : u(p, l))}" hreflang="${l}" lang="${l}"${l === LANG ? ' aria-current="true"' : ""} title="${LANG_NAME[l]}">${LANG_LABEL[l]}</a>`).join("")}</div>
  </div>
</header>
<main id="main">
${body}
</main>
${footer()}
<script src="https://probe2928-crypto.github.io/chainbrief/network.js" data-site="blockkey" defer></script>
</body>
</html>`;
}

function footer() {
  const f = SITE.footer || {};
  const biz = [f.company && `${L.bizCompany} ${esc(f.company)}`, f.ceo && `${L.bizCeo} ${esc(f.ceo)}`, f.registration && `${L.bizReg} ${esc(f.registration)}`, f.address && esc(f.address)].filter(Boolean);
  const c = SITE.contact || {};
  const reach = [
    TG && `<a href="https://t.me/${esc(TG)}" target="_blank" rel="noopener">Telegram @${esc(TG)}</a>`,
    c.email && `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>`,
    c.kakao && `<a href="${esc(c.kakao)}" target="_blank" rel="noopener">${L.kakao}</a>`,
    c.community && `<a href="${esc(c.community)}" target="_blank" rel="noopener">${esc(LANG === "ko" ? c.communityLabel || L.community : L.community)}</a>`,
  ].filter(Boolean);
  return `<footer class="foot">
  <div class="wrap">
    <p class="foot-word" aria-hidden="true">BLOCKKEY</p>
    <div class="foot-grid">
      <div class="foot-brand">
        <p class="foot-sign">${EMBLEM("foot-em")}<span>L'art de relier.</span></p>
        <p>${L.footAbout}</p>
        ${reach.length ? `<p class="foot-reach">${reach.join("")}</p>` : ""}
      </div>
      <nav aria-label="${L.footServices}"><h2>${L.footServices}</h2>${HOME.services.items.map((s) => `<a href="${u("")}#${s.id}">${esc(s.name)}</a>`).join("")}</nav>
      <nav aria-label="${L.footCompany}"><h2>${L.footCompany}</h2><a href="${u("")}#process">${L.footProcess}</a><a href="${u("")}#why">${L.footWhy}</a><a href="${u("")}#faq">${L.footFaq}</a></nav>
      <nav aria-label="${L.footResources}"><h2>${L.footResources}</h2><a href="${u("projects/")}">${L.footProjects}</a><a href="${u("markets/")}">${L.footMarkets}</a><a href="${u("insights/")}">${L.footInsights}</a><a href="${u("")}#contact">${L.footContact}</a></nav>
    </div>
    <div class="foot-legal">
      ${biz.length ? `<p>${biz.join("<span aria-hidden=\"true\"> | </span>")}</p>` : ""}
      <p>${L.footDisclaimer}</p>
      <p class="foot-row"><span>© ${new Date().getFullYear()} ${esc(SITE.name)}</span><a href="${u("privacy/")}">${L.privacy}</a><a href="${u("terms/")}">${L.terms}</a></p>
    </div>
  </div>
</footer>`;
}

/* ---------- 광고 배너 ---------- */
const adsFor = (place) => ADS.items.filter((a) => a.enabled && a.placements.includes(place));

// 브랜드별 배너 카드: 체인브리프는 디도니 마스트헤드, 퍼프라인은 메종 광고 문법
function adCard(a, size = "") {
  const head = a.kind === "chainbrief"
    ? `<span class="pc-mast" aria-hidden="true">${esc(a.brand)}</span><span class="pc-rule" aria-hidden="true"></span><span class="pc-tag">${esc(tr(a, "tagline") || "")}</span>`
    : a.kind === "perpline"
      ? `<span class="pc-word" aria-hidden="true">${esc(a.brand)}</span><span class="pc-rule" aria-hidden="true"></span><span class="pc-head" lang="en" aria-hidden="true">${esc(a.headline[0])} <em>${esc(a.headline[1])}</em></span>`
      : `<span class="pc-word">${esc(a.brand)}</span>`;
  return `<a class="pc pc-${esc(a.kind)} ${size}" href="${esc(a.url)}" target="_blank" rel="sponsored noopener" aria-label="${esc(tr(a, "label"))}: ${esc(LANG === "ko" ? a.brandKo || a.brand : a.brand)} — ${esc(tr(a, "title"))}">
    <span class="pc-label">${esc(tr(a, "label"))}</span>
    <span class="pc-visual">${head}</span>
    <span class="pc-copy">
      <span class="pc-title">${esc(tr(a, "title"))}</span>
      <span class="pc-text">${esc(tr(a, "text"))}</span>
      <span class="pc-cta">${esc(tr(a, "cta"))}</span>
    </span>
    ${tr(a, "words") ? `<span class="pc-run" aria-hidden="true"><span>${[...tr(a, "words"), ...tr(a, "words")].map((w) => `<i>${esc(w)}</i>`).join("")}</span></span>` : ""}
  </a>`;
}
function ad(place) {
  const list = adsFor(place);
  if (!list.length) return "";
  const notes = list.filter((a) => tr(a, "note")).map((a) => `<p class="ad-note">${esc(a.brand)}: ${esc(tr(a, "note"))}</p>`).join("");
  return `<aside class="partners partners-${list.length > 1 ? "duo" : "solo"}" aria-label="${L.partnersAria}">
  <div class="wrap">
    <p class="partners-h"><span lang="fr">Les maisons partenaires</span></p>
    <div class="partners-grid">${list.map((a) => adCard(a, list.length > 1 ? "" : "pc-wide")).join("")}</div>
    ${notes}
  </div>
</aside>`;
}

// 장면 비주얼: L'intelligence — 스피커 유닛처럼 퍼져 나가는 동심원(데이터의 파동)
const ART_INTEL = `<svg class="art art-intel" viewBox="0 0 480 480" aria-hidden="true">
  <defs>
    <radialGradient id="ai-core" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#3c3d3f"/><stop offset=".7" stop-color="#141415"/><stop offset="1" stop-color="#050505"/></radialGradient>
    <linearGradient id="ai-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ecdcb8"/><stop offset=".5" stop-color="#b8975c"/><stop offset="1" stop-color="#7d6234"/></linearGradient>
    <linearGradient id="ai-alu" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f0f0ee"/><stop offset=".5" stop-color="#a9aaac"/><stop offset="1" stop-color="#4c4d4f"/></linearGradient>
  </defs>
  <g class="ai-waves" fill="none" stroke="#c8c9cb">
    <circle cx="240" cy="240" r="120"/><circle cx="240" cy="240" r="120"/><circle cx="240" cy="240" r="120"/><circle cx="240" cy="240" r="120"/>
  </g>
  <g class="ai-ticks" stroke="#8f9093" stroke-width="1">
    ${Array.from({ length: 60 }, (_, i) => { const a = (i * 6 * Math.PI) / 180, r1 = 196, r2 = i % 5 ? 203 : 212; return `<line x1="${(240 + r1 * Math.cos(a)).toFixed(1)}" y1="${(240 + r1 * Math.sin(a)).toFixed(1)}" x2="${(240 + r2 * Math.cos(a)).toFixed(1)}" y2="${(240 + r2 * Math.sin(a)).toFixed(1)}"/>`; }).join("")}
  </g>
  <circle cx="240" cy="240" r="132" fill="url(#ai-alu)"/>
  <circle cx="240" cy="240" r="120" fill="url(#ai-core)"/>
  <circle cx="240" cy="240" r="92" fill="none" stroke="#fff" stroke-opacity=".07"/>
  <circle cx="240" cy="240" r="62" fill="none" stroke="#fff" stroke-opacity=".09"/>
  <circle class="ai-dot" cx="240" cy="240" r="26" fill="url(#ai-gold)"/>
  <circle class="ai-orbit" cx="240" cy="44" r="4" fill="#cdb27f"/>
</svg>`;

// 장면 비주얼: La confiance — 브러시드 알루미늄 블록 세 개를 금선이 잇고, 빛이 선을 따라 흐름
const cube = (x, y, s, cls = "") => `<g class="cube ${cls}" transform="translate(${x} ${y})">
  <path d="M0 ${-s} L${s * .87} ${-s / 2} L0 0 L${-s * .87} ${-s / 2}Z" fill="url(#cf-top)"/>
  <path d="M${-s * .87} ${-s / 2} L0 0 L0 ${s} L${-s * .87} ${s / 2}Z" fill="url(#cf-left)"/>
  <path d="M${s * .87} ${-s / 2} L0 0 L0 ${s} L${s * .87} ${s / 2}Z" fill="url(#cf-right)"/>
  <path d="M0 ${-s} L${s * .87} ${-s / 2} L0 0 L${-s * .87} ${-s / 2}Z" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width=".8"/>
</g>`;
const ART_TRUST = `<svg class="art art-trust" viewBox="0 0 520 440" aria-hidden="true">
  <defs>
    <linearGradient id="cf-top" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4f4f2"/><stop offset="1" stop-color="#b9babc"/></linearGradient>
    <linearGradient id="cf-left" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9c9da0"/><stop offset="1" stop-color="#55565a"/></linearGradient>
    <linearGradient id="cf-right" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6e6f72"/><stop offset="1" stop-color="#2b2c2e"/></linearGradient>
    <linearGradient id="cf-gold" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b8975c"/><stop offset="1" stop-color="#e6d3ad"/></linearGradient>
    <filter id="cf-soft"><feGaussianBlur stdDeviation="14"/></filter>
  </defs>
  <ellipse cx="260" cy="400" rx="200" ry="14" fill="#000" opacity=".7" filter="url(#cf-soft)"/>
  <path id="cf-line" d="M110 250 L260 170 L410 250" fill="none" stroke="url(#cf-gold)" stroke-width="1.2"/>
  <path class="cf-flow" d="M110 250 L260 170 L410 250" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" pathLength="100"/>
  ${cube(110, 270, 62, "c1")}${cube(260, 190, 74, "c2")}${cube(410, 270, 62, "c3")}
  <circle cx="260" cy="190" r="7" fill="#cdb27f"/>
</svg>`;

function heroSlides(h) {
  const partners = adsFor("hero");
  const scenes = h.hero.scenes || [];
  const brandScene = (s, art) => `<article class="slide s-bk s-${esc(s.id)}" data-name="BLOCKKEY" aria-roledescription="slide" aria-hidden="true">
    <div class="slide-bg" aria-hidden="true"></div>
    <div class="wrap slide-grid">
      <div class="slide-copy">
        <p class="sign" lang="fr">${esc(s.fr)}</p>
        <h2 class="scene-title">${esc(s.title).replace("\n", "<br>")}</h2>
        <p class="lead">${esc(s.lead)}</p>
        <ul class="scene-points">${s.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
        <div class="actions"><a class="btn btn-light" href="${esc(s.href)}">${esc(s.cta)}</a></div>
      </div>
      <div class="slide-art" data-tilt>${art}<span class="glare" aria-hidden="true"></span></div>
    </div>
  </article>`;
  const main = `<article class="slide s-bk s-main is-active" data-name="BLOCKKEY" aria-roledescription="slide">
    <div class="slide-bg" aria-hidden="true"></div>
    <div class="wrap slide-grid">
      <div class="slide-copy">
        <p class="sign">L'art de relier.</p>
        <h1 id="hero-title">${esc(h.hero.title).replace("\n", "<br>")}</h1>
        <p class="lead">${esc(h.hero.lead)}</p>
        <div class="actions">
          <a class="btn btn-light" href="#contact">${esc(h.hero.primary)}</a>
          <a class="link-under" href="#services">${esc(h.hero.secondary)}</a>
        </div>
      </div>
      <div class="slide-art hero-obj" data-tilt>${OBJECT_SRC.replace("__OBJ__", esc(L.objLabel))}<span class="glare" aria-hidden="true"></span></div>
    </div>
  </article>`;
  const partnerScene = (a) => {
    if (a.kind === "chainbrief") return `<article class="slide s-cb" data-name="${esc(a.brand)}" aria-roledescription="slide" aria-hidden="true">
      <div class="slide-bg" aria-hidden="true"></div>
      <div class="wrap slide-center">
        <p class="slide-ad">${esc(tr(a, "label"))} · Partenaire</p>
        <p class="cb-mast" aria-hidden="true">${esc(a.brand).split("").map((c, k) => `<span style="--k:${k}">${c}</span>`).join("")}</p>
        <span class="cb-rule" aria-hidden="true"></span>
        <h2 class="cb-tag">${esc(tr(a, "title"))}</h2>
        <p class="cb-live" data-cb-live><span>${L.cbLiveBtc}</span><strong data-cb-btc>—</strong><span>${L.cbLiveKimp}</span><strong data-cb-kimp>—</strong></p>
        <a class="btn btn-ink" href="${esc(a.url)}" target="_blank" rel="sponsored noopener">${esc(tr(a, "cta"))}</a>
      </div>
      <div class="slide-run" aria-hidden="true"><span>${[...tr(a, "words"), ...tr(a, "words"), ...tr(a, "words")].map((w) => `<i>${esc(w)}</i>`).join("")}</span></div>
    </article>`;
    if (a.kind === "perpline") return `<article class="slide s-pl" data-name="${esc(a.brand)}" aria-roledescription="slide" aria-hidden="true">
      <div class="slide-bg" aria-hidden="true"></div>
      <div class="wrap slide-center">
        <p class="slide-ad">${esc(tr(a, "label"))} · Partenaire</p>
        <p class="pl-word" aria-hidden="true">${esc(a.brand)}</p>
        <span class="pl-rule" aria-hidden="true"></span>
        <p class="pl-head" lang="en"><span>${esc(a.headline[0])}</span> <em>${esc(a.headline[1])}</em></p>
        <h2 class="pl-ko">${esc(tr(a, "title"))}</h2>
        <p class="pl-stat"><span class="pl-num" data-count="50">50</span><span class="pl-pct">%</span><span class="pl-cap">${L.plCap}</span></p>
        <a class="btn btn-tone" href="${esc(a.url)}" target="_blank" rel="sponsored noopener">${esc(tr(a, "cta"))}</a>
        <p class="pl-note">${esc(tr(a, "note"))}</p>
      </div>
      <div class="slide-run" aria-hidden="true"><span>${[...tr(a, "words"), ...tr(a, "words")].map((w) => `<i>${esc(w)}</i>`).join("")}</span></div>
    </article>`;
    return "";
  };
  // 순서: BLOCKKEY → 파트너 → BLOCKKEY → 파트너 → BLOCKKEY
  const arts = { intelligence: ART_INTEL, confiance: ART_TRUST };
  const own = [main, ...scenes.map((s) => brandScene(s, arts[s.id] || ""))];
  const order = [];
  own.forEach((o, i) => { order.push({ html: o, name: "BLOCKKEY" }); if (partners[i]) order.push({ html: partnerScene(partners[i]), name: partners[i].brand }); });
  partners.slice(own.length).forEach((p) => order.push({ html: partnerScene(p), name: p.brand }));
  const total = order.length;
  const html = order.map((o, i) => o.html.replace('aria-roledescription="slide"', `aria-roledescription="slide" aria-label="${i + 1} / ${total}: ${esc(o.name)}"`)).join("");
  return `<section class="hero" aria-roledescription="carousel" aria-label="${L.heroAria}" data-hero>
  <div class="slides">${html}</div>
  ${total > 1 ? `<div class="wrap slide-ui">
    <ol class="slide-tabs">${order.map((s, i) => `<li><button type="button" data-go="${i}"${i === 0 ? ' aria-current="true"' : ""}><span class="tab-n">${String(i + 1).padStart(2, "0")}</span><span class="tab-name">${esc(s.name)}</span><span class="tab-bar"><i></i></span></button></li>`).join("")}</ol>
    <div class="slide-nav">
      <button type="button" data-prev aria-label="${L.prev}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>
      <button type="button" data-pause aria-label="${L.pause}"><svg viewBox="0 0 24 24" aria-hidden="true" class="i-pause"><path d="M9 5v14M15 5v14"/></svg><svg viewBox="0 0 24 24" aria-hidden="true" class="i-play"><path d="M8 5l11 7-11 7z"/></svg></button>
      <button type="button" data-next aria-label="${L.next}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button>
    </div>
  </div>` : ""}
</section>`;
}

/* ---------- 홈 ---------- */
function home() {
  const h = HOME;

  const hero = heroSlides(h);

  const statement = `<section class="statement" aria-label="${L.statementAria}">
  <div class="wrap">
    <p class="statement-text">${L.statement}</p>
    <p class="statement-sub">${esc(h.services.lead.replace(/^[^.]*\.\s*/, ""))}</p>
  </div>
</section>`;

  const services = `<section id="services" class="sec" aria-labelledby="services-title">
  <div class="wrap">
    <h2 id="services-title" class="sec-title">${esc(h.services.title)}</h2>
    <div class="svc-list">
      ${h.services.items.map((s) => `<article id="${s.id}" class="svc">
        <header class="svc-name">
          <h3>${esc(s.name)}</h3>
          <p class="fr" lang="fr">${esc(s.fr || "")}</p>
        </header>
        <div class="svc-body">
          <p class="svc-headline">${esc(s.headline)}</p>
          <p>${esc(s.text)}</p>
        </div>
        <ul class="svc-deliv" aria-label="${esc(L.deliverablesOf(s.name))}">${s.deliverables.map((d) => `<li>${esc(d)}</li>`).join("")}</ul>
      </article>`).join("")}
    </div>
  </div>
</section>`;

  const useCases = `<section id="use-cases" class="sec sec-stone" aria-labelledby="uc-title">
  <div class="wrap">
    <div class="sec-head">
      <h2 id="uc-title" class="sec-title">${esc(h.useCases.title)}</h2>
      <p class="fine">${esc(h.useCases.note)}</p>
    </div>
    <div class="uc-grid">
      ${h.useCases.items.map((c) => `<article class="uc">
        <p class="uc-area">${esc(c.area)}</p>
        <h3>${esc(c.problem)}</h3>
        <p>${esc(c.approach)}</p>
      </article>`).join("")}
    </div>
    <p class="uc-cta"><a class="link-under" href="#contact">${L.ucCta}</a></p>
  </div>
</section>`;

  const process = `<section id="process" class="sec" aria-labelledby="process-title">
  <div class="wrap">
    <div class="sec-head">
      <h2 id="process-title" class="sec-title">${esc(h.process.title)}</h2>
      <p>${esc(h.process.lead)}</p>
    </div>
    <ol class="steps">
      ${h.process.steps.map((s, i) => `<li class="step">
        <span class="step-n" aria-hidden="true">${ROMAN[i]}</span>
        <h3>${esc(s.name)}</h3>
        <p class="step-time">${esc(s.time)}</p>
        <p>${esc(s.text)}</p>
      </li>`).join("")}
    </ol>
  </div>
</section>`;

  const why = `<section id="why" class="sec sec-black" aria-labelledby="why-title">
  <div class="wrap">
    <h2 id="why-title" class="sec-title">${esc(h.why.title)}</h2>
    <dl class="why-list">
      ${h.why.items.map((w) => `<div><dt>${esc(w.name)}</dt><dd>${esc(w.text)}</dd></div>`).join("")}
    </dl>
    <blockquote class="honest"><p>${esc(h.why.honesty)}</p></blockquote>
    <div class="stack">
      <h3>${esc(h.why.stackTitle)}</h3>
      <p>${h.why.stack.map((s) => `<span>${esc(s)}</span>`).join("")}</p>
    </div>
  </div>
</section>`;

  const mw = ECO.marketWatch;
  const eco = `<section id="ecosystem" class="sec" aria-labelledby="eco-title">
  <div class="wrap">
    <div class="sec-head">
      <h2 id="eco-title" class="sec-title">${L.ecoTitle}</h2>
      <p class="fine">${esc(tr(ECO, "note"))}</p>
    </div>

    <div class="eco-block">
      <h3 class="eco-h">${esc(tr(mw, "title"))}</h3>
      <ol class="listings">
        ${mw.items.map((p) => `<li><a class="lst" href="${esc(p.url)}" target="_blank" rel="noopener">
          <span class="lst-day">${esc(p.day || tr(p, "date"))}</span>
          <img class="lst-logo" src="${esc(p.logo)}" alt="" width="56" height="56" loading="lazy">
          <span class="lst-name">${esc(p.name)}<small>${esc(p.symbol)}</small></span>
          <span class="lst-ex">${(p.exchanges || []).map((e, k) => `<span class="ex-chip ex-${e === "업비트" ? "upbit" : e === "빗썸" ? "bithumb" : "etc"}">${esc((tr(p, "exchanges") || [])[k] || e)}</span>`).join("")}${tr(p, "market") ? `<span class="lst-mkt">${esc(tr(p, "market"))}</span>` : ""}</span>
          <span class="lst-go">${L.cmc}</span>
        </a></li>`).join("")}
      </ol>
      <p class="fine">${esc(tr(mw, "note"))}</p>
    </div>

    <div class="eco-two">
      <div class="eco-block">
        <h3 class="eco-h">${L.featured}</h3>
        <ul class="projects">
          ${ECO.featured.map((p) => `<li><a class="prj" href="${esc(p.url)}" target="_blank" rel="noopener">
            <img src="${esc(p.logo)}" alt="" width="48" height="48" loading="lazy">
            <span><strong>${esc(p.name)}</strong><small>${esc(p.symbol)}</small></span>
          </a></li>`).join("")}
        </ul>
      </div>
      <div class="eco-block">
        <h3 class="eco-h">${L.vcs}</h3>
        <ul class="vcs">
          ${ECO.vcs.map((v) => `<li><a class="vc" href="${esc(v.url)}" target="_blank" rel="noopener"><img src="https://www.google.com/s2/favicons?domain=${esc(v.domain)}&amp;sz=128" alt="" width="32" height="32" loading="lazy"><span>${esc(v.name)}</span></a></li>`).join("")}
        </ul>
      </div>
    </div>
  </div>
</section>`;

  const faq = `<section id="faq" class="sec sec-stone" aria-labelledby="faq-title">
  <div class="wrap faq-grid">
    <div>
      <h2 id="faq-title" class="sec-title">${L.faqTitle}</h2>
      <p class="side-note">${esc(L.faqNote(SITE.contact.replyTime))}</p>
    </div>
    <div class="faq">
      ${h.faq.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join("")}
    </div>
  </div>
</section>`;

  const viaTg = !SITE.contact.web3formsKey && !SITE.contact.formspreeId && !SITE.contact.email && TG;
  const contact = `<section id="contact" class="sec sec-contact" aria-labelledby="contact-title">
  <div class="wrap contact-grid">
    <div>
      <h2 id="contact-title" class="sec-title">${esc(h.contact.title)}</h2>
      <p class="side-note">${esc(h.contact.lead)}</p>
      <ul class="checks">${h.contact.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
      ${TG ? `<p class="tg-line">${L.tgLine} <a class="link-under" href="https://t.me/${esc(TG)}" target="_blank" rel="noopener">${L.telegram} @${esc(TG)}</a></p>` : ""}
    </div>
    <form class="form" data-contact novalidate>
      <div class="row2">
        <label><span>${L.fName} <b aria-hidden="true">*</b></span><input name="name" autocomplete="name" required></label>
        <label><span>${L.fCompany}</span><input name="company" autocomplete="organization"></label>
      </div>
      <div class="row2">
        <label><span>${L.fEmail} <b aria-hidden="true">*</b></span><input name="email" type="email" autocomplete="email" required></label>
        <label><span>${L.fPhone}</span><input name="phone" autocomplete="tel"></label>
      </div>
      <fieldset>
        <legend>${L.fInterest}</legend>
        <div class="chips">${h.contact.interests.map((t) => `<label class="chip"><input type="checkbox" name="interest" value="${esc(t)}"><span>${esc(t)}</span></label>`).join("")}</div>
      </fieldset>
      <label><span>${L.fMessage} <b aria-hidden="true">*</b></span><textarea name="message" rows="5" required placeholder="${esc(L.fPlaceholder)}"></textarea></label>
      <input type="text" name="_gotcha" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
      <label class="agree"><input type="checkbox" name="agree" required> <span>${L.fAgree(`<a href="${u("privacy/")}" target="_blank">${L.privacy}</a>`)}</span></label>
      <div class="form-end">
        <button class="btn btn-dark" type="submit">${viaTg ? L.fSubmitTg : L.fSubmit}</button>
        ${viaTg ? `<p class="fine">${esc(L.fTgNote(TG))}</p>` : ""}
      </div>
      <p class="form-msg" data-form-msg role="status"></p>
    </form>
  </div>
</section>`;

  const jsonld = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: SITE.nameFull,
    description: L.description,
    url: abs(""),
    areaServed: "KR",
    knowsAbout: L.knowsAbout,
    ...(SITE.contact.email ? { email: SITE.contact.email } : {}),
  };
  const faqLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: h.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };

  return layout({ path: "", body: hero + statement + services + useCases + process + ad("home") + why + eco + faq + contact, bodyClass: "home", jsonld: [jsonld, faqLd] });
}

/* ---------- 시장 데이터 ---------- */
function markets() {
  const body = `<section class="page-hero">
  <div class="wrap">
    <p class="crumb"><a href="${u("")}">BLOCKKEY</a></p>
    <h1>${L.mkTitle}</h1>
    <p class="lead">${L.mkLead}</p>
    <p class="mk-meta"><span>${L.mkSource}</span><span>${L.mkAuto}</span><span>${L.mkLast} <time data-mk-updated>—</time></span><button class="btn-small" type="button" data-mk-refresh>${L.refresh}</button></p>
  </div>
</section>
<section class="sec sec-tight" aria-labelledby="mk-ov">
  <div class="wrap">
    <h2 id="mk-ov" class="h-sm">${L.mkOverview}</h2>
    <div class="stats">
      <div class="stat"><span class="stat-l">${L.stBtc}</span><strong data-stat="btc">—</strong><span class="stat-s" data-stat="btcChg"></span></div>
      <div class="stat"><span class="stat-l">${L.stDom}</span><strong data-stat="dom">—</strong><span class="stat-s">${L.stDomSub}</span></div>
      <div class="stat"><span class="stat-l">${L.stTvl}</span><strong data-stat="tvl">—</strong><span class="stat-s">${L.stTvlSub}</span></div>
      <div class="stat"><span class="stat-l">${L.stFng}</span><strong data-stat="fng">—</strong><span class="stat-s" data-stat="fngLbl"></span></div>
    </div>
  </div>
</section>
<section class="sec sec-tight" aria-labelledby="mk-coins">
  <div class="wrap">
    <div class="tbl-head">
      <h2 id="mk-coins" class="h-sm">${L.mkCoins}</h2>
      <div class="seg" role="group" aria-label="${L.sortAria}">
        <button type="button" data-sort="volume" aria-pressed="true">${L.sortVol}</button>
        <button type="button" data-sort="cap" aria-pressed="false">${L.sortCap}</button>
        <button type="button" data-sort="change" aria-pressed="false">${L.sortChg}</button>
      </div>
    </div>
    <div class="tbl-wrap">
      <table class="tbl">
        <thead><tr><th scope="col">${L.thAsset}</th><th scope="col">${L.thPrice}</th><th scope="col">24h</th><th scope="col">${L.thUpbit}</th><th scope="col">${L.thKimp}</th><th scope="col">${L.thVol}</th><th scope="col">${L.thCap}</th></tr></thead>
        <tbody data-mk-rows><tr><td colspan="7" class="empty">${L.mkLoading}</td></tr></tbody>
      </table>
    </div>
    <p class="fine">${L.kimpNote}</p>
  </div>
</section>
${ad("markets-top")}
<section class="sec sec-tight" aria-labelledby="mk-tvl">
  <div class="wrap">
    <h2 id="mk-tvl" class="h-sm">${L.tvlTitle}</h2>
    <p class="fine">${L.tvlNote} <a href="${u("insights/reading-crypto-data/")}">${L.tvlHow}</a></p>
    <ol class="tvl" data-tvl><li class="empty">${L.tvlLoading}</li></ol>
  </div>
</section>
${ad("markets-bottom")}
<section class="sec sec-tight" aria-labelledby="mk-ex">
  <div class="wrap">
    <h2 id="mk-ex" class="h-sm">${L.exTitle}</h2>
    <ul class="ex-list">
      ${MKT.explorers.map((e) => `<li><a href="${esc(e.url)}" target="_blank" rel="noopener"><strong>${esc(e.name)}</strong><span>${esc(tr(e, "desc"))}</span></a></li>`).join("")}
    </ul>
    <p class="fine">${L.exNote} <a href="${u("")}#contact">${L.exCta}</a></p>
  </div>
</section>`;
  return layout({ title: L.mkPageTitle, description: L.mkPageDesc, path: "markets/", body, bodyClass: "markets" });
}

/* ---------- 관리 프로젝트 ---------- */
function projects() {
  const items = PJ.items || [];
  const body = `<section class="page-hero">
  <div class="wrap">
    <p class="crumb"><a href="${u("")}">BLOCKKEY</a></p>
    <h1>${L.pjTitle}</h1>
    <p class="lead">${L.pjLead}</p>
  </div>
</section>
<section class="sec sec-tight">
  <div class="wrap">
    <ul class="pj-list">
      ${items.map((p, i) => `<li class="pj-row">
        <div class="pj-vis"><img src="${ua(`projects/${p.slug}/cover-m.jpg`)}" alt="" loading="lazy" decoding="async"><img class="pj-lg" src="${ua(`projects/${p.slug}/logo.png`)}" alt="${esc(p.name)}" loading="lazy"></div>
        <div class="pj-body">
          <p class="pj-no">${String(i + 1).padStart(2, "0")} · ${esc(tr(p, "sector"))}</p>
          <h2>${esc(p.name)}</h2>
          <p class="pj-sum">${esc(tr(p, "summary"))}</p>
          <dl class="pj-dl"><dt>${L.pjRole}</dt><dd>${esc(tr(p, "role"))}</dd><dt>${L.pjSince}</dt><dd>${esc(p.since)}</dd><dt>${L.pjStatus}</dt><dd><span class="pj-live"></span>${esc(tr(p, "status"))}</dd></dl>
          <p class="pj-links">${p.website ? `<a class="btn-line" href="${esc(p.website)}" target="_blank" rel="noopener">${L.pjSite} →</a>` : ""}${tr(p, "story") ? `<a class="btn-line" href="${esc(tr(p, "story"))}" target="_blank" rel="noopener">${L.pjStory} →</a>` : ""}</p>
        </div>
      </li>`).join("")}
    </ul>
    <p class="fine">${L.pjNote}</p>
  </div>
</section>
${ctaBand()}`;
  return layout({ title: L.pjPageTitle, description: L.pjPageDesc, path: "projects/", body, bodyClass: "pjpage" });
}

/* ---------- 인사이트 ---------- */
function insightList() {
  const body = `<section class="page-hero">
  <div class="wrap">
    <p class="crumb"><a href="${u("")}">BLOCKKEY</a></p>
    <h1>${L.inTitle}</h1>
    <p class="lead">${L.inLead}</p>
  </div>
</section>
<section class="sec sec-tight">
  <div class="wrap">
    <ul class="post-list">
      ${insights.map((p) => `<li><a href="${u(`insights/${p.slug}/`)}">
        <span class="post-cat">${esc(p.category || "")}</span>
        <strong>${esc(p.title)}</strong>
        <span class="post-sum">${esc(p.summary || "")}</span>
        <time datetime="${esc(p.date)}">${fmtDate(p.date)}</time>
      </a></li>`).join("")}
    </ul>
  </div>
</section>
${ad("insights")}
${ctaBand()}`;
  return layout({ title: L.inPageTitle, description: L.inPageDesc, path: "insights/", body, bodyClass: "insights" });
}

function insightPage(p) {
  const idx = insights.indexOf(p);
  const next = insights[idx + 1];
  const body = `<article class="post">
  <header class="page-hero">
    <div class="wrap wrap-narrow">
      <p class="crumb"><a href="${u("insights/")}">${L.inPageTitle}</a></p>
      <h1>${esc(p.title)}</h1>
      <p class="post-meta"><span>${esc(p.category || "")}</span><time datetime="${esc(p.date)}">${fmtDate(p.date)}</time></p>
    </div>
  </header>
  <div class="wrap wrap-narrow prose">
    ${p.html}
    ${next ? `<p class="post-next">${L.nextPost} <a href="${u(`insights/${next.slug}/`)}">${esc(next.title)}</a></p>` : ""}
  </div>
</article>
${ad("insights")}
${ctaBand()}`;
  const jsonld = { "@context": "https://schema.org", "@type": "Article", headline: p.title, description: p.summary, datePublished: p.date, author: { "@type": "Organization", name: SITE.nameFull }, publisher: { "@type": "Organization", name: SITE.nameFull } };
  return layout({ title: p.title, description: p.summary, path: `insights/${p.slug}/`, body, bodyClass: "insights", jsonld });
}

function ctaBand() {
  return `<section class="cta-band">
  <div class="wrap cta-in">
    <p>${L.ctaText}</p>
    <a class="btn btn-key" href="${u("")}#contact">${L.ctaBtn}</a>
  </div>
</section>`;
}

/* ---------- 약관 ---------- */
function legal(name) {
  const lf = LANG === "ko" ? `content/legal/${name}.md` : `content/legal/${LANG}/${name}.md`;
  const { data, body } = frontmatter(read(fs.existsSync(path.join(ROOT, lf)) ? lf : `content/legal/${name}.md`));
  const html = `<section class="page-hero">
  <div class="wrap wrap-narrow">
    <h1>${esc(data.title)}</h1>
    <p class="post-meta"><span>${L.revised} ${esc(data.updated)}</span></p>
  </div>
</section>
<div class="wrap wrap-narrow prose legal">${fixLinks(markdown(body))}</div>`;
  return layout({ title: data.title, path: `${name}/`, body: html, bodyClass: "legal-page" });
}

function notFound() {
  return layout({ title: L.nfTitle, path: "404.html", body: `<section class="page-hero nf"><div class="wrap"><h1>${L.nfTitle}</h1><p class="lead">${L.nfLead}</p><div class="actions"><a class="btn btn-key" href="${u("")}">${L.nfHome}</a><a class="btn btn-line" href="${u("")}#contact">${L.nfContact}</a></div></div></section>` });
}

/* ---------- 쓰기 ---------- */
function write(rel, content) {
  const f = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, content);
}

fs.rmSync(DIST, { recursive: true, force: true });
fs.cpSync(path.join(ROOT, "public"), DIST, { recursive: true });

const urls = [];
for (const lang of LANGS) {
  LANG = lang; L = I18N[lang];
  HOME = json(lang === "ko" ? "data/home.json" : `data/home.${lang}.json`);
  insights = loadInsights(lang);
  const P = prefix(lang);
  write(`${P}index.html`, home());
  write(`${P}markets/index.html`, markets());
  write(`${P}projects/index.html`, projects());
  write(`${P}insights/index.html`, insightList());
  for (const p of insights) write(`${P}insights/${p.slug}/index.html`, insightPage(p));
  write(`${P}privacy/index.html`, legal("privacy"));
  write(`${P}terms/index.html`, legal("terms"));
  urls.push(...["", "markets/", "insights/", ...insights.map((p) => `insights/${p.slug}/`), "privacy/", "terms/"].map((p) => abs(p)));
}
LANG = "ko"; L = I18N.ko; HOME = json("data/home.json"); insights = loadInsights("ko");
write("404.html", notFound());

write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((p) => `  <url><loc>${p}</loc></url>`).join("\n")}\n</urlset>\n`);
write("robots.txt", `User-agent: *\nAllow: /\n${ORIGIN ? `Sitemap: ${ORIGIN}${ua("sitemap.xml")}\n` : ""}`);
if (SITE.domain) write("CNAME", SITE.domain + "\n");

console.log(`빌드 완료 → dist/ (페이지 ${urls.length + 1}개, 언어 ${LANGS.join("·")}, BASE=${BASE})`);
