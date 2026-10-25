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
  ["FAQ", "#faq"],
];
const navHref = (h) => (h.startsWith("#") ? u("") + h : u(h));

const LOGO = `<svg class="mark" viewBox="0 0 32 32" aria-hidden="true"><rect x="2" y="2" width="12" height="12" rx="2"/><rect x="18" y="2" width="12" height="12" rx="2" class="mark-key"/><rect x="2" y="18" width="12" height="12" rx="2"/><path d="M24 18v12M24 23h4M24 27h3" class="mark-line"/></svg>`;

function layout({ title, description = SITE.description, path: p = "", body, bodyClass = "", jsonld }) {
  const fullTitle = title ? `${title} | ${SITE.name}` : SITE.title;
  const canonical = abs(p);
  const ga = SITE.analytics?.ga4;
  const cfg = {
    base: BASE,
    contact: { email: SITE.contact.email, web3formsKey: SITE.contact.web3formsKey, formspreeId: SITE.contact.formspreeId },
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
<meta name="theme-color" content="#101826">
<link rel="icon" href="${u("icons/icon.svg")}" type="image/svg+xml">
<link rel="apple-touch-icon" href="${u("icons/apple-touch-icon.png")}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans+KR:wght@400;500;600;700&display=swap">
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
    <a class="brand" href="${u("")}" aria-label="${esc(SITE.nameFull)} 홈">${LOGO}<span>${esc(SITE.name)}</span></a>
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="nav">메뉴</button>
    <nav id="nav" class="nav" aria-label="주요 메뉴">
      ${NAV.map(([t, h]) => `<a href="${navHref(h)}">${t}</a>`).join("")}
      <a class="nav-cta" href="${u("")}#contact">무료 진단 신청</a>
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
    c.email && `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>`,
    c.telegram && `<a href="https://t.me/${esc(c.telegram.replace(/^@/, ""))}" target="_blank" rel="noopener">텔레그램 ${esc(c.telegram)}</a>`,
    c.kakao && `<a href="${esc(c.kakao)}" target="_blank" rel="noopener">카카오톡 상담</a>`,
  ].filter(Boolean);
  return `<footer class="foot">
  <div class="wrap foot-grid">
    <div class="foot-brand">
      <a class="brand" href="${u("")}">${LOGO}<span>${esc(SITE.name)}</span></a>
      <p>AI 마케팅, AI 개발, 블록체인 연동·관리를 한 팀에서. 기획부터 운영까지 이어서 책임지는 기술 파트너입니다.</p>
      ${reach.length ? `<p class="foot-reach">${reach.join("")}</p>` : ""}
    </div>
    <div>
      <h2>서비스</h2>
      ${HOME.services.items.map((s) => `<a href="${u("")}#${s.id}">${esc(s.name)}</a>`).join("")}
    </div>
    <div>
      <h2>회사</h2>
      <a href="${u("")}#process">진행 방식</a>
      <a href="${u("")}#why">일하는 방식</a>
      <a href="${u("")}#faq">자주 묻는 질문</a>
    </div>
    <div>
      <h2>자료</h2>
      <a href="${u("markets/")}">시장 데이터</a>
      <a href="${u("insights/")}">인사이트</a>
      <a href="${u("")}#contact">상담 신청</a>
    </div>
  </div>
  <div class="wrap foot-legal">
    ${biz.length ? `<p>${biz.join("<span aria-hidden=\"true\"> | </span>")}</p>` : ""}
    <p>사이트의 시장 데이터와 프로젝트 정보는 참고용이며 투자 권유가 아닙니다.</p>
    <p class="foot-row"><span>© ${new Date().getFullYear()} ${esc(SITE.name)}</span><a href="${u("privacy/")}">개인정보처리방침</a><a href="${u("terms/")}">이용약관</a></p>
  </div>
</footer>`;
}

/* ---------- 홈 ---------- */
function home() {
  const h = HOME;
  const axes = [
    { name: "AI 마케팅", line: "더 똑똑한 마케팅, 데이터로 성장하다.", href: `${u("")}#ai-marketing` },
    { name: "AI 개발", line: "아이디어를 실제로, AI로 구현하다.", href: `${u("")}#ai-development` },
    { name: "블록체인", line: "시스템을 연결하고, 신뢰를 설계하다.", href: `${u("")}#blockchain` },
    { name: "시장 데이터", line: "빠르게 변하는 시장, 데이터로 읽다.", href: u("markets/") },
  ];

  const hero = `<section class="hero" aria-labelledby="hero-title">
  <div class="wrap hero-grid">
    <div class="hero-copy">
      <h1 id="hero-title">${esc(h.hero.title).replace("\n", "<br>")}</h1>
      <p class="lead">${esc(h.hero.lead)}</p>
      <div class="actions">
        <a class="btn btn-key" href="#contact">${esc(h.hero.primary)}</a>
        <a class="btn btn-ghost" href="#services">${esc(h.hero.secondary)}</a>
      </div>
    </div>
    <aside class="chain" aria-labelledby="chain-title">
      <div class="chain-head">
        <h2 id="chain-title">지금 생성되는 블록</h2>
        <span class="chain-status" data-chain-status>연결 중</span>
      </div>
      <ol class="blocks" data-blocks aria-live="polite" aria-relevant="additions">
        ${Array.from({ length: 5 }, () => `<li class="block is-skeleton"><span class="b-chain"></span><span class="b-main"><span class="b-h">&nbsp;</span><span class="b-hash">&nbsp;</span></span><span class="b-meta">&nbsp;</span></li>`).join("")}
      </ol>
      <p class="chain-foot">비트코인·이더리움 메인넷 실시간 · 블록 하나하나가 BLOCKKEY가 다루는 데이터입니다.</p>
    </aside>
  </div>
  <ul class="wrap axes">
    ${axes.map((a) => `<li><a href="${a.href}"><strong>${esc(a.name)}</strong><span>${esc(a.line)}</span></a></li>`).join("")}
  </ul>
</section>`;

  const services = `<section id="services" class="sec" aria-labelledby="services-title">
  <div class="wrap">
    <div class="sec-head">
      <h2 id="services-title">${esc(h.services.title)}</h2>
      <p>${esc(h.services.lead)}</p>
    </div>
    <div class="svc-list">
      ${h.services.items.map((s) => `<article id="${s.id}" class="svc">
        <h3>${esc(s.name)}</h3>
        <div class="svc-body">
          <p class="svc-headline">${esc(s.headline)}</p>
          <p>${esc(s.text)}</p>
        </div>
        <ul class="svc-deliv" aria-label="${esc(s.name)} 주요 작업">${s.deliverables.map((d) => `<li>${esc(d)}</li>`).join("")}</ul>
      </article>`).join("")}
    </div>
  </div>
</section>`;

  const useCases = `<section id="use-cases" class="sec sec-alt" aria-labelledby="uc-title">
  <div class="wrap">
    <div class="sec-head">
      <h2 id="uc-title">${esc(h.useCases.title)}</h2>
      <p class="fine">${esc(h.useCases.note)}</p>
    </div>
    <div class="uc-grid">
      ${h.useCases.items.map((c) => `<article class="uc">
        <p class="uc-area">${esc(c.area)}</p>
        <h3>${esc(c.problem)}</h3>
        <p>${esc(c.approach)}</p>
        <p class="tags">${c.tags.map((t) => `<span>${esc(t)}</span>`).join("")}</p>
      </article>`).join("")}
    </div>
    <p class="uc-cta">우리 회사에도 적용할 수 있을지 궁금하다면 <a href="#contact">현재 상황을 알려 주세요.</a></p>
  </div>
</section>`;

  const process = `<section id="process" class="sec" aria-labelledby="process-title">
  <div class="wrap">
    <div class="sec-head">
      <h2 id="process-title">${esc(h.process.title)}</h2>
      <p>${esc(h.process.lead)}</p>
    </div>
    <ol class="steps">
      ${h.process.steps.map((s, i) => `<li class="step">
        <span class="step-n" aria-hidden="true">${i + 1}</span>
        <h3>${esc(s.name)} <span class="step-time">${esc(s.time)}</span></h3>
        <p>${esc(s.text)}</p>
      </li>`).join("")}
    </ol>
  </div>
</section>`;

  const why = `<section id="why" class="sec sec-ink" aria-labelledby="why-title">
  <div class="wrap why-grid">
    <div>
      <h2 id="why-title">${esc(h.why.title)}</h2>
      <p class="why-lead">${esc(h.why.lead)}</p>
      <blockquote class="honest">${esc(h.why.honesty)}</blockquote>
    </div>
    <div>
      <dl class="why-list">
        ${h.why.items.map((w) => `<div><dt>${esc(w.name)}</dt><dd>${esc(w.text)}</dd></div>`).join("")}
      </dl>
      <h3 class="stack-title">${esc(h.why.stackTitle)}</h3>
      <p class="stack">${h.why.stack.map((s) => `<span>${esc(s)}</span>`).join("")}</p>
    </div>
  </div>
</section>`;

  const eco = `<section id="ecosystem" class="sec" aria-labelledby="eco-title">
  <div class="wrap">
    <div class="sec-head">
      <h2 id="eco-title">프로젝트와 글로벌 Web3 생태계</h2>
      <p class="fine">${esc(ECO.note)}</p>
    </div>
    <div class="eco-grid">
      <div class="eco-col">
        <h3>관심 프로젝트</h3>
        <ul class="eco-list">
          ${ECO.featured.map((p) => `<li><a href="${esc(p.url)}" target="_blank" rel="noopener"><img src="${esc(p.logo)}" alt="" width="32" height="32" loading="lazy"><span><strong>${esc(p.name)}</strong><small>${esc(p.symbol)} · CoinMarketCap</small></span></a></li>`).join("")}
        </ul>
      </div>
      <div class="eco-col eco-wide">
        <h3>${esc(ECO.marketWatch.title)}</h3>
        <ul class="eco-list">
          ${ECO.marketWatch.items.map((p) => `<li><a href="${esc(p.url)}" target="_blank" rel="noopener"><img src="${esc(p.logo)}" alt="" width="32" height="32" loading="lazy"><span><strong>${esc(p.name)} (${esc(p.symbol)})</strong><small>${esc(p.date)} ${esc(p.event)}</small></span></a></li>`).join("")}
        </ul>
        <p class="fine">${esc(ECO.marketWatch.note)}</p>
      </div>
      <div class="eco-col">
        <h3>글로벌 크립토 VC</h3>
        <ul class="eco-list eco-vc">
          ${ECO.vcs.map((v) => `<li><a href="${esc(v.url)}" target="_blank" rel="noopener"><img src="https://www.google.com/s2/favicons?domain=${esc(v.domain)}&amp;sz=64" alt="" width="20" height="20" loading="lazy"><span>${esc(v.name)}</span></a></li>`).join("")}
        </ul>
      </div>
    </div>
  </div>
</section>`;

  const faq = `<section id="faq" class="sec sec-alt" aria-labelledby="faq-title">
  <div class="wrap faq-grid">
    <div class="sec-head">
      <h2 id="faq-title">자주 받는 질문</h2>
      <p>더 궁금한 점은 아래 상담 신청으로 남겨 주세요. ${esc(SITE.contact.replyTime)}됩니다.</p>
    </div>
    <div class="faq">
      ${h.faq.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join("")}
    </div>
  </div>
</section>`;

  const contact = `<section id="contact" class="sec" aria-labelledby="contact-title">
  <div class="wrap contact-grid">
    <div>
      <h2 id="contact-title">${esc(h.contact.title)}</h2>
      <p class="lead-dark">${esc(h.contact.lead)}</p>
      <ul class="checks">${h.contact.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
    </div>
    <form class="form" data-contact novalidate>
      <div class="row2">
        <label><span>이름 <b aria-hidden="true">*</b></span><input name="name" autocomplete="name" required></label>
        <label><span>회사 / 팀</span><input name="company" autocomplete="organization"></label>
      </div>
      <div class="row2">
        <label><span>이메일 <b aria-hidden="true">*</b></span><input name="email" type="email" autocomplete="email" required></label>
        <label><span>연락처</span><input name="phone" type="tel" autocomplete="tel"></label>
      </div>
      <fieldset>
        <legend>관심 서비스</legend>
        <div class="chips">${h.contact.interests.map((t) => `<label class="chip"><input type="checkbox" name="interest" value="${esc(t)}"><span>${esc(t)}</span></label>`).join("")}</div>
      </fieldset>
      <label><span>문의 내용 <b aria-hidden="true">*</b></span><textarea name="message" rows="5" required placeholder="예: 쇼핑몰 광고 리포트를 매주 수작업으로 만들고 있어요. 자동화할 수 있을까요?"></textarea></label>
      <input type="text" name="_gotcha" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
      <label class="agree"><input type="checkbox" name="agree" required> <span><a href="${u("privacy/")}" target="_blank">개인정보처리방침</a>에 동의합니다 (상담 목적으로만 사용)</span></label>
      <button class="btn btn-key" type="submit">상담 신청하기</button>
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

  return layout({ path: "", body: hero + services + useCases + process + why + eco + faq + contact, bodyClass: "home", jsonld: [jsonld, faqLd] });
}

/* ---------- 시장 데이터 ---------- */
function markets() {
  const body = `<section class="page-hero">
  <div class="wrap">
    <p class="crumb"><a href="${u("")}">홈</a></p>
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
