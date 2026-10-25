// BLOCKKEY 정적 사이트 빌드: content/ + data/ + public/ → dist/
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { markdown, frontmatter, esc } from "./lib.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const json = (p) => JSON.parse(read(p));

const SITE = json("site.config.json");
const HOME = json("data/home.json");
const ECO = json("data/ecosystem.json");
const MKT = json("data/markets.json");
const ADS = json("data/ads.json");

// 커스텀 도메인이면 "/", GitHub Pages 기본 주소면 "/blockkey/"
const BASE = (process.env.BASE_PATH || "/").replace(/\/+$/, "") + "/";
const ORIGIN = SITE.domain ? `https://${SITE.domain}` : (process.env.SITE_URL || "").replace(/\/+$/, "");
const u = (p = "") => BASE + String(p).replace(/^\/+/, "");
const abs = (p = "") => (ORIGIN ? ORIGIN + u(p) : u(p));
const BUILD_ID = Date.now().toString(36);

/* ---------- 글 ---------- */
const insights = fs.readdirSync(path.join(ROOT, "content/insights"))
  .filter((f) => f.endsWith(".md"))
  .map((f) => {
    const { data, body } = frontmatter(read(`content/insights/${f}`));
    return { slug: f.replace(/\.md$/, ""), ...data, date: String(data.date || ""), html: fixLinks(markdown(body)) };
  })
  .filter((p) => !p.draft)
  .sort((a, b) => b.date.localeCompare(a.date));

// 마크다운 안의 "/markets/" 같은 사이트 내부 링크에 BASE 붙이기
function fixLinks(html) {
  return html.replace(/href="\/(?!\/)([^"]*)"/g, (_, p) => `href="${u(p)}"`);
}
const fmtDate = (d) => {
  const m = String(d).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}. ${+m[2]}. ${+m[3]}.` : d;
};

/* ---------- 공통 레이아웃 ---------- */
const NAV = [
  ["서비스", "#services"],
  ["진행 방식", "#process"],
  ["시장 데이터", "markets/"],
  ["인사이트", "insights/"],
  ["문의", "#contact"],
];
const navHref = (h) => (h.startsWith("#") ? u("") + h : u(h));
const TG = (SITE.contact.telegram || "").replace(/^@/, "");
const ROMAN = ["I", "II", "III", "IV", "V", "VI"];

// 히어로 오브제: 알루미늄 덩어리에 열쇠 구멍 겸 스피커 유닛 같은 동심원. 페이지의 유일한 장식.
const OBJECT = `<svg class="obj" viewBox="0 0 520 620" role="img" aria-label="BLOCKKEY 오브제: 알루미늄 블록에 새긴 열쇠 실린더">
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

function layout({ title, description = SITE.description, path: p = "", body, bodyClass = "", jsonld }) {
  const fullTitle = title ? `${title} | ${SITE.name}` : SITE.title;
  const canonical = abs(p);
  const ga = SITE.analytics?.ga4;
  const cfg = {
    base: BASE,
    contact: { email: SITE.contact.email, web3formsKey: SITE.contact.web3formsKey, formspreeId: SITE.contact.formspreeId, telegram: TG },
    coins: MKT.coins,
  };
  return `<!doctype html>
<html lang="${SITE.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(SITE.nameFull)}">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${esc(abs("og.png"))}">
<meta property="og:locale" content="ko_KR">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#000000">
<link rel="icon" href="${u("icons/icon.svg")}" type="image/svg+xml">
<link rel="apple-touch-icon" href="${u("icons/apple-touch-icon.png")}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,300;1,400&family=Hahmlet:wght@200;300;400&family=Marcellus&family=Noto+Sans+KR:wght@300;400;500&display=swap">
<link rel="stylesheet" href="${u("style.css")}?v=${BUILD_ID}">
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` : ""}
${ga ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${esc(ga)}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${esc(ga)}');</script>` : ""}
<script>window.BK=${JSON.stringify(cfg)}</script>
<script src="${u("app.js")}?v=${BUILD_ID}" defer></script>
</head>
<body class="${bodyClass}">
<a class="skip" href="#main">본문으로 건너뛰기</a>
<header class="top">
  <div class="wrap top-in">
    <a class="brand" href="${u("")}" aria-label="${esc(SITE.nameFull)} 홈">BLOCKKEY</a>
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="nav"><span class="menu-lines" aria-hidden="true"></span><span class="menu-txt">메뉴</span></button>
    <nav id="nav" class="nav" aria-label="주요 메뉴">
      ${NAV.map(([t, h]) => `<a href="${navHref(h)}">${t}</a>`).join("")}
    </nav>
  </div>
</header>
<main id="main">
${body}
</main>
${footer()}
</body>
</html>`;
}

function footer() {
  const f = SITE.footer || {};
  const biz = [f.company && `상호 ${esc(f.company)}`, f.ceo && `대표 ${esc(f.ceo)}`, f.registration && `사업자등록번호 ${esc(f.registration)}`, f.address && esc(f.address)].filter(Boolean);
  const c = SITE.contact || {};
  const reach = [
    TG && `<a href="https://t.me/${esc(TG)}" target="_blank" rel="noopener">Telegram @${esc(TG)}</a>`,
    c.email && `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>`,
    c.kakao && `<a href="${esc(c.kakao)}" target="_blank" rel="noopener">카카오톡 상담</a>`,
    c.community && `<a href="${esc(c.community)}" target="_blank" rel="noopener">${esc(c.communityLabel || "커뮤니티")}</a>`,
  ].filter(Boolean);
  return `<footer class="foot">
  <div class="wrap">
    <p class="foot-word" aria-hidden="true">BLOCKKEY</p>
    <div class="foot-grid">
      <div class="foot-brand">
        <p class="foot-sign">L'art de relier.</p>
        <p>AI 마케팅, AI 개발, 블록체인 연동·관리를 한 팀에서. 기획부터 운영까지 이어서 책임지는 기술 파트너입니다.</p>
        ${reach.length ? `<p class="foot-reach">${reach.join("")}</p>` : ""}
      </div>
      <nav aria-label="서비스"><h2>서비스</h2>${HOME.services.items.map((s) => `<a href="${u("")}#${s.id}">${esc(s.name)}</a>`).join("")}</nav>
      <nav aria-label="회사"><h2>회사</h2><a href="${u("")}#process">진행 방식</a><a href="${u("")}#why">일하는 방식</a><a href="${u("")}#faq">자주 묻는 질문</a></nav>
      <nav aria-label="자료"><h2>자료</h2><a href="${u("markets/")}">시장 데이터</a><a href="${u("insights/")}">인사이트</a><a href="${u("")}#contact">상담 신청</a></nav>
    </div>
    <div class="foot-legal">
      ${biz.length ? `<p>${biz.join("<span aria-hidden=\"true\"> | </span>")}</p>` : ""}
      <p>사이트의 시장 데이터와 프로젝트 정보는 참고용이며 투자 권유가 아닙니다.</p>
      <p class="foot-row"><span>© ${new Date().getFullYear()} ${esc(SITE.name)}</span><a href="${u("privacy/")}">개인정보처리방침</a><a href="${u("terms/")}">이용약관</a></p>
    </div>
  </div>
</footer>`;
}

/* ---------- 광고 배너 ---------- */
function ad(place) {
  return ADS.items.filter((a) => a.enabled && a.placements.includes(place)).map((a) => `<aside class="ad" aria-label="${esc(a.label)}: ${esc(a.brand)}">
  <div class="wrap">
    <a class="ad-in" href="${esc(a.url)}" target="_blank" rel="sponsored noopener">
      <span class="ad-tag">${esc(a.label)}</span>
      <span class="ad-brand">${esc(a.brand)}</span>
      <span class="ad-body"><span class="ad-title">${esc(a.title)}</span><span class="ad-text">${esc(a.text)}</span></span>
      <span class="ad-cta">${esc(a.cta)}</span>
    </a>
    ${a.note ? `<p class="ad-note">${esc(a.note)}</p>` : ""}
  </div>
</aside>`).join("");
}

/* ---------- 홈 ---------- */
function home() {
  const h = HOME;

  const hero = `<section class="hero" aria-labelledby="hero-title">
  <div class="wrap hero-grid">
    <div class="hero-copy">
      <p class="sign">L'art de relier.</p>
      <h1 id="hero-title">${esc(h.hero.title).replace("\n", "<br>")}</h1>
      <p class="lead">${esc(h.hero.lead)}</p>
      <div class="actions">
        <a class="btn btn-light" href="#contact">${esc(h.hero.primary)}</a>
        <a class="link-under" href="#services">${esc(h.hero.secondary)}</a>
      </div>
    </div>
    <div class="hero-obj">${OBJECT}</div>
  </div>
</section>`;

  const statement = `<section class="statement" aria-label="BLOCKKEY 소개">
  <div class="wrap">
    <p class="statement-text">마케팅은 데이터로,<br>제품은 AI로,<br>신뢰는 블록체인으로.</p>
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
        <ul class="svc-deliv" aria-label="${esc(s.name)} 주요 작업">${s.deliverables.map((d) => `<li>${esc(d)}</li>`).join("")}</ul>
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
    <p class="uc-cta"><a class="link-under" href="#contact">우리 회사에도 적용할 수 있을지 묻기</a></p>
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

  const eco = `<section id="ecosystem" class="sec" aria-labelledby="eco-title">
  <div class="wrap">
    <div class="sec-head">
      <h2 id="eco-title" class="sec-title">프로젝트와 글로벌 Web3 생태계</h2>
      <p class="fine">${esc(ECO.note)}</p>
    </div>
    <div class="eco-grid">
      <div class="eco-col eco-wide">
        <h3>${esc(ECO.marketWatch.title)}</h3>
        <ul class="eco-list">
          ${ECO.marketWatch.items.map((p) => `<li><a href="${esc(p.url)}" target="_blank" rel="noopener"><img src="${esc(p.logo)}" alt="" width="28" height="28" loading="lazy"><span class="eco-n">${esc(p.name)} <small>${esc(p.symbol)}</small></span><span class="eco-d">${esc(p.date)} · ${esc(p.event)}</span></a></li>`).join("")}
        </ul>
        <p class="fine">${esc(ECO.marketWatch.note)}</p>
      </div>
      <div class="eco-col">
        <h3>관심 프로젝트</h3>
        <ul class="eco-list">
          ${ECO.featured.map((p) => `<li><a href="${esc(p.url)}" target="_blank" rel="noopener"><img src="${esc(p.logo)}" alt="" width="28" height="28" loading="lazy"><span class="eco-n">${esc(p.name)} <small>${esc(p.symbol)}</small></span></a></li>`).join("")}
        </ul>
        <h3 class="eco-h2">글로벌 크립토 VC</h3>
        <ul class="eco-vc">
          ${ECO.vcs.map((v) => `<li><a href="${esc(v.url)}" target="_blank" rel="noopener">${esc(v.name)}</a></li>`).join("")}
        </ul>
      </div>
    </div>
  </div>
</section>`;

  const faq = `<section id="faq" class="sec sec-stone" aria-labelledby="faq-title">
  <div class="wrap faq-grid">
    <div>
      <h2 id="faq-title" class="sec-title">자주 받는 질문</h2>
      <p class="side-note">더 궁금한 점은 상담 신청이나 텔레그램으로 남겨 주세요. ${esc(SITE.contact.replyTime)}됩니다.</p>
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
      ${TG ? `<p class="tg-line">바로 대화하고 싶다면 <a class="link-under" href="https://t.me/${esc(TG)}" target="_blank" rel="noopener">텔레그램 @${esc(TG)}</a></p>` : ""}
    </div>
    <form class="form" data-contact novalidate>
      <div class="row2">
        <label><span>이름 <b aria-hidden="true">*</b></span><input name="name" autocomplete="name" required></label>
        <label><span>회사 / 팀</span><input name="company" autocomplete="organization"></label>
      </div>
      <div class="row2">
        <label><span>이메일 <b aria-hidden="true">*</b></span><input name="email" type="email" autocomplete="email" required></label>
        <label><span>연락처 · 텔레그램</span><input name="phone" autocomplete="tel"></label>
      </div>
      <fieldset>
        <legend>관심 서비스</legend>
        <div class="chips">${h.contact.interests.map((t) => `<label class="chip"><input type="checkbox" name="interest" value="${esc(t)}"><span>${esc(t)}</span></label>`).join("")}</div>
      </fieldset>
      <label><span>문의 내용 <b aria-hidden="true">*</b></span><textarea name="message" rows="5" required placeholder="예: 쇼핑몰 광고 리포트를 매주 수작업으로 만들고 있어요. 자동화할 수 있을까요?"></textarea></label>
      <input type="text" name="_gotcha" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
      <label class="agree"><input type="checkbox" name="agree" required> <span><a href="${u("privacy/")}" target="_blank">개인정보처리방침</a>에 동의합니다 (상담 목적으로만 사용)</span></label>
      <div class="form-end">
        <button class="btn btn-dark" type="submit">${viaTg ? "텔레그램으로 상담 신청" : "상담 신청하기"}</button>
        ${viaTg ? `<p class="fine">작성한 내용이 복사되고 @${esc(TG)} 대화창이 열립니다. 붙여넣고 보내 주세요.</p>` : ""}
      </div>
      <p class="form-msg" data-form-msg role="status"></p>
    </form>
  </div>
</section>`;

  const jsonld = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: SITE.nameFull,
    description: SITE.description,
    url: abs(""),
    areaServed: "KR",
    knowsAbout: ["AI 마케팅", "LLM 애플리케이션 개발", "스마트 컨트랙트", "블록체인 연동"],
    ...(SITE.contact.email ? { email: SITE.contact.email } : {}),
  };
  const faqLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: h.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };

  return layout({ path: "", body: hero + statement + services + useCases + process + why + eco + ad("home") + faq + contact, bodyClass: "home", jsonld: [jsonld, faqLd] });
}

/* ---------- 시장 데이터 ---------- */
function markets() {
  const body = `<section class="page-hero">
  <div class="wrap">
    <p class="crumb"><a href="${u("")}">BLOCKKEY</a></p>
    <h1>디지털 자산 데이터 허브</h1>
    <p class="lead">주요 코인 시세와 24시간 거래량, 업비트 김치 프리미엄, 체인별 TVL을 한 화면에서 확인하세요. 표시된 수치는 투자 권유가 아닙니다.</p>
    <p class="mk-meta"><span>출처 CoinGecko · Upbit · DefiLlama · Alternative.me</span><span>약 2분마다 자동 갱신</span><span>마지막 조회 <time data-mk-updated>—</time></span><button class="btn-small" type="button" data-mk-refresh>새로고침</button></p>
  </div>
</section>
<section class="sec sec-tight" aria-labelledby="mk-ov">
  <div class="wrap">
    <h2 id="mk-ov" class="h-sm">시장 개요</h2>
    <div class="stats">
      <div class="stat"><span class="stat-l">비트코인 (USD)</span><strong data-stat="btc">—</strong><span class="stat-s" data-stat="btcChg"></span></div>
      <div class="stat"><span class="stat-l">비트코인 도미넌스</span><strong data-stat="dom">—</strong><span class="stat-s">전체 시가총액 대비</span></div>
      <div class="stat"><span class="stat-l">전체 체인 TVL</span><strong data-stat="tvl">—</strong><span class="stat-s">DefiLlama 합계</span></div>
      <div class="stat"><span class="stat-l">공포·탐욕 지수</span><strong data-stat="fng">—</strong><span class="stat-s" data-stat="fngLbl"></span></div>
    </div>
  </div>
</section>
<section class="sec sec-tight" aria-labelledby="mk-coins">
  <div class="wrap">
    <div class="tbl-head">
      <h2 id="mk-coins" class="h-sm">주요 코인 시세</h2>
      <div class="seg" role="group" aria-label="정렬">
        <button type="button" data-sort="volume" aria-pressed="true">거래량 순</button>
        <button type="button" data-sort="cap" aria-pressed="false">시가총액 순</button>
        <button type="button" data-sort="change" aria-pressed="false">상승률 순</button>
      </div>
    </div>
    <div class="tbl-wrap">
      <table class="tbl">
        <thead><tr><th scope="col">자산</th><th scope="col">가격 (USD)</th><th scope="col">24h</th><th scope="col">업비트 (원)</th><th scope="col">김프</th><th scope="col">24h 거래량</th><th scope="col">시가총액</th></tr></thead>
        <tbody data-mk-rows><tr><td colspan="7" class="empty">시세를 불러오는 중입니다.</td></tr></tbody>
      </table>
    </div>
    <p class="fine">김프(김치 프리미엄) = 업비트 원화 가격 ÷ (글로벌 USD 가격 × 환율) − 1. 업비트 원화마켓에 없는 코인은 — 로 표시합니다.</p>
  </div>
</section>
${ad("markets")}
<section class="sec sec-tight" aria-labelledby="mk-tvl">
  <div class="wrap">
    <h2 id="mk-tvl" class="h-sm">체인별 TVL 상위</h2>
    <p class="fine">TVL(Total Value Locked)은 체인 기반 DeFi에 예치된 자산의 추정 달러 가치입니다. 거래량이나 활성 주소 수와는 다른 지표입니다. <a href="${u("insights/reading-crypto-data/")}">지표 읽는 법</a></p>
    <ol class="tvl" data-tvl><li class="empty">TVL을 불러오는 중입니다.</li></ol>
  </div>
</section>
<section class="sec sec-tight" aria-labelledby="mk-ex">
  <div class="wrap">
    <h2 id="mk-ex" class="h-sm">직접 확인하기</h2>
    <ul class="ex-list">
      ${MKT.explorers.map((e) => `<li><a href="${esc(e.url)}" target="_blank" rel="noopener"><strong>${esc(e.name)}</strong><span>${esc(e.desc)}</span></a></li>`).join("")}
    </ul>
    <p class="fine">실시간 체결, 고래 지갑 추적, 순유입·순유출 같은 지표는 각 데이터 제공사의 별도 API 연동이 필요합니다. 이 페이지는 실제로 연결된 데이터만 표시합니다. 회사 대시보드에 이런 데이터를 붙이고 싶다면 <a href="${u("")}#contact">상담을 신청하세요.</a></p>
  </div>
</section>`;
  return layout({ title: "시장 데이터", description: "주요 코인 시세, 거래량, 업비트 김치 프리미엄, 체인별 TVL, 공포·탐욕 지수를 한 화면에서.", path: "markets/", body, bodyClass: "markets" });
}

/* ---------- 인사이트 ---------- */
function insightList() {
  const body = `<section class="page-hero">
  <div class="wrap">
    <p class="crumb"><a href="${u("")}">홈</a></p>
    <h1>AI · 블록체인 인사이트</h1>
    <p class="lead">사업에 바로 쓸 수 있는 AI와 블록체인 핵심 개념을 쉽게 정리합니다.</p>
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
  return layout({ title: "인사이트", description: "AI 마케팅 자동화, 온체인 데이터 읽기, 블록체인 연동 체크리스트 등 실무 가이드.", path: "insights/", body, bodyClass: "insights" });
}

function insightPage(p) {
  const idx = insights.indexOf(p);
  const next = insights[idx + 1];
  const body = `<article class="post">
  <header class="page-hero">
    <div class="wrap wrap-narrow">
      <p class="crumb"><a href="${u("insights/")}">인사이트</a></p>
      <h1>${esc(p.title)}</h1>
      <p class="post-meta"><span>${esc(p.category || "")}</span><time datetime="${esc(p.date)}">${fmtDate(p.date)}</time></p>
    </div>
  </header>
  <div class="wrap wrap-narrow prose">
    ${p.html}
    ${next ? `<p class="post-next">다음 글 <a href="${u(`insights/${next.slug}/`)}">${esc(next.title)}</a></p>` : ""}
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
    <p>우리 회사에 맞는 방법이 궁금하다면, 지금 상황을 한두 줄로 알려 주세요.</p>
    <a class="btn btn-key" href="${u("")}#contact">무료 진단 신청</a>
  </div>
</section>`;
}

/* ---------- 약관 ---------- */
function legal(name) {
  const { data, body } = frontmatter(read(`content/legal/${name}.md`));
  const html = `<section class="page-hero">
  <div class="wrap wrap-narrow">
    <h1>${esc(data.title)}</h1>
    <p class="post-meta"><span>최종 개정일 ${esc(data.updated)}</span></p>
  </div>
</section>
<div class="wrap wrap-narrow prose legal">${fixLinks(markdown(body))}</div>`;
  return layout({ title: data.title, path: `${name}/`, body: html, bodyClass: "legal-page" });
}

function notFound() {
  return layout({ title: "페이지를 찾을 수 없습니다", path: "404.html", body: `<section class="page-hero nf"><div class="wrap"><h1>페이지를 찾을 수 없습니다</h1><p class="lead">주소가 바뀌었거나 삭제된 페이지입니다.</p><div class="actions"><a class="btn btn-key" href="${u("")}">홈으로 가기</a><a class="btn btn-line" href="${u("")}#contact">상담 신청</a></div></div></section>` });
}

/* ---------- 쓰기 ---------- */
function write(rel, content) {
  const f = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, content);
}

fs.rmSync(DIST, { recursive: true, force: true });
fs.cpSync(path.join(ROOT, "public"), DIST, { recursive: true });

write("index.html", home());
write("markets/index.html", markets());
write("insights/index.html", insightList());
for (const p of insights) write(`insights/${p.slug}/index.html`, insightPage(p));
write("privacy/index.html", legal("privacy"));
write("terms/index.html", legal("terms"));
write("404.html", notFound());

const urls = ["", "markets/", "insights/", ...insights.map((p) => `insights/${p.slug}/`), "privacy/", "terms/"];
write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((p) => `  <url><loc>${abs(p)}</loc></url>`).join("\n")}\n</urlset>\n`);
write("robots.txt", `User-agent: *\nAllow: /\n${ORIGIN ? `Sitemap: ${abs("sitemap.xml")}\n` : ""}`);
if (SITE.domain) write("CNAME", SITE.domain + "\n");

console.log(`빌드 완료 → dist/ (페이지 ${urls.length + 1}개, 인사이트 ${insights.length}개, BASE=${BASE})`);
