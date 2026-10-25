/* BLOCKKEY 사이트 스크립트 — 외부 라이브러리 없음 */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const BK = window.BK || {};
  const T = BK.t || {};
  const LOC = T.locale || "ko-KR";
  const fmt = (s, h) => String(s).replace("{h}", h);
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  async function getJSON(url, opts = {}, ms = 9000) {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), ms);
    try {
      const r = await fetch(url, { cache: "no-store", ...opts, signal: ctl.signal });
      if (!r.ok) throw new Error(r.status);
      return await r.json();
    } finally { clearTimeout(t); }
  }
  // 백그라운드 탭에서는 멈추는 반복 실행
  function every(ms, fn) {
    let id = null;
    const start = () => { if (!id) { fn(); id = setInterval(fn, ms); } };
    const stop = () => { clearInterval(id); id = null; };
    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
    start();
  }

  /* ---------- 메뉴 ---------- */
  const menuBtn = $(".menu-btn"), nav = $("#nav");
  if (menuBtn && nav) {
    menuBtn.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      menuBtn.setAttribute("aria-expanded", open);
      $(".menu-txt", menuBtn).textContent = open ? T.close : T.menu;
    });
    nav.addEventListener("click", (e) => {
      if (e.target.closest("a")) { nav.classList.remove("is-open"); menuBtn.setAttribute("aria-expanded", "false"); $(".menu-txt", menuBtn).textContent = T.menu; }
    });
  }
  // 현재 페이지 메뉴 표시
  $$(".nav a").forEach((a) => { if (a.pathname !== BK.base && location.pathname.startsWith(a.pathname) && !a.hash) a.setAttribute("aria-current", "page"); });

  /* ---------- 첫 화면 장면 슬라이드 ---------- */
  const hero = $("[data-hero]");
  if (hero && $$(".slide", hero).length > 1) {
    const slides = $$(".slide", hero), tabs = $$("[data-go]", hero);
    let cur = 0, userPaused = false, busy = false;
    const toneOf = (s) => (s.classList.contains("is-light") ? "light" : "dark"); // 밝은 배경 장면엔 is-light
    hero.dataset.tone = toneOf(slides[0]);
    hero.style.setProperty("--dur", "7.5s");

    function go(n) {
      n = (n + slides.length) % slides.length;
      if (n === cur || busy) return;
      busy = true;
      const prev = slides[cur], next = slides[n];
      slides.forEach((s) => s.classList.remove("is-leave"));
      prev.classList.remove("is-active", "is-enter");
      prev.classList.add("is-leave");
      prev.setAttribute("aria-hidden", "true");
      next.removeAttribute("aria-hidden");
      next.classList.add("is-active", "is-enter");
      hero.dataset.tone = toneOf(next);
      tabs.forEach((t, i) => (i === n ? t.setAttribute("aria-current", "true") : t.removeAttribute("aria-current")));
      cur = n;
      onShow(next);
      setTimeout(() => { prev.classList.remove("is-leave"); busy = false; }, 1400);
      setTimeout(() => next.classList.remove("is-enter"), 2600);
    }
    // 진행 막대가 다 차면 다음 장면 (멈춤·호버 중에는 막대도 멈춤)
    tabs.forEach((t) => $(".tab-bar i", t).addEventListener("animationend", () => { if (t.getAttribute("aria-current") === "true") go(cur + 1); }));
    tabs.forEach((t) => t.addEventListener("click", () => go(+t.dataset.go)));
    $("[data-next]", hero)?.addEventListener("click", () => go(cur + 1));
    $("[data-prev]", hero)?.addEventListener("click", () => go(cur - 1));
    // 사용자가 멈춤을 눌렀거나 키보드로 컨트롤에 머물 때만 멈춤 (마우스를 올려도 계속 움직임)
    const setPaused = () => hero.classList.toggle("is-paused", userPaused || !!hero.querySelector(":focus-visible"));
    $("[data-pause]", hero)?.addEventListener("click", (e) => {
      userPaused = !userPaused;
      e.currentTarget.setAttribute("aria-label", userPaused ? T.play : T.pause);
      setPaused();
    });
    hero.addEventListener("focusin", setPaused);
    hero.addEventListener("focusout", () => setTimeout(setPaused));
    document.addEventListener("visibilitychange", () => hero.classList.toggle("is-paused", document.hidden || userPaused));
    hero.addEventListener("keydown", (e) => { if (e.key === "ArrowRight") go(cur + 1); if (e.key === "ArrowLeft") go(cur - 1); });
    let sx = null;
    hero.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse") sx = e.clientX; });
    hero.addEventListener("pointerup", (e) => { if (sx !== null) { const dx = e.clientX - sx; if (Math.abs(dx) > 50) go(cur + (dx < 0 ? 1 : -1)); sx = null; } });

    // 장면별 움직임: 퍼프라인 숫자 카운트, 체인브리프 실시간 시세
    function onShow(s) {
      const num = $("[data-count]", s);
      if (num) {
        const to = +num.dataset.count, t0 = performance.now();
        const step = (t) => { const p = Math.min(1, (t - t0 - 700) / 1400); num.textContent = Math.round(to * (p < 0 ? 0 : 1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); };
        requestAnimationFrame(step);
      }
      if (s.classList.contains("s-cb")) cbLive();
    }
    let cbAt = 0;
    async function cbLive() {
      if (Date.now() - cbAt < 60000) return;
      cbAt = Date.now();
      const box = $("[data-cb-live]");
      if (!box) return;
      // 업비트 가격은 따로, 김프(CoinGecko 필요)는 실패해도 가격만 보여 줌
      try {
        const up = await getJSON("https://api.upbit.com/v1/ticker?markets=KRW-BTC");
        const krw = up[0].trade_price;
        $("[data-cb-btc]").textContent = "₩" + Math.round(krw).toLocaleString("ko-KR");
        try {
          const g = await getJSON("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,tether&vs_currencies=usd,krw");
          const rate = g.tether.krw / g.tether.usd, kimp = (krw / (g.bitcoin.usd * rate) - 1) * 100;
          $("[data-cb-kimp]").textContent = (kimp > 0 ? "+" : "") + kimp.toFixed(2) + "%";
        } catch { const k = $("[data-cb-kimp]"); k.previousElementSibling.hidden = true; k.hidden = true; cbAt = 0; }
      } catch { box.hidden = true; cbAt = 0; }
    }
    cbLive();
  }

  /* ---------- 시장 데이터 ---------- */
  const rowsEl = $("[data-mk-rows]");
  if (rowsEl) {
    const coins = BK.coins || [];
    let data = [], sortKey = "volume";
    const usd = (p) => p == null ? "—" : "$" + (p >= 1000 ? p.toLocaleString("en-US", { maximumFractionDigits: 0 }) : p >= 1 ? p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : p.toPrecision(4));
    const krw = (p) => p == null ? "—" : (p >= 100 ? Math.round(p).toLocaleString("ko-KR") : p.toLocaleString("ko-KR", { maximumFractionDigits: 2 }));
    const big = (n) => n == null ? "—" : n >= 1e12 ? `$${(n / 1e12).toFixed(2)}T` : n >= 1e9 ? `$${(n / 1e9).toFixed(2)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : `$${Math.round(n).toLocaleString("en-US")}`;
    const pct = (v, d = 2) => v == null || isNaN(v) ? "—" : `${v > 0 ? "+" : ""}${v.toFixed(d)}%`;
    const dir = (v) => (v > 0 ? "up" : v < 0 ? "down" : "");
    const stat = (k, v, cls) => { const el = $(`[data-stat="${k}"]`); if (el) { el.textContent = v; if (cls !== undefined) el.className = "stat-s " + cls; } };

    function drawTable() {
      const key = { volume: (c) => c.total_volume, cap: (c) => c.market_cap, change: (c) => c.price_change_percentage_24h }[sortKey];
      const rows = [...data].sort((a, b) => (key(b) ?? -Infinity) - (key(a) ?? -Infinity));
      rowsEl.innerHTML = rows.map((c) => `<tr>
        <td><span class="coin"><img src="${c.image}" alt="" width="24" height="24" loading="lazy"><span>${c.ko}<small>${c.symbol.toUpperCase()}</small></span></span></td>
        <td>${usd(c.current_price)}</td>
        <td class="${dir(c.price_change_percentage_24h)}">${pct(c.price_change_percentage_24h)}</td>
        <td>${krw(c.upbit)}</td>
        <td class="${dir(c.kimp)}">${pct(c.kimp)}</td>
        <td>${big(c.total_volume)}</td>
        <td>${big(c.market_cap)}</td>
      </tr>`).join("") || `<tr><td colspan="7" class="empty">${T.loadFail}</td></tr>`;
    }
    $$("[data-sort]").forEach((b) => b.addEventListener("click", () => {
      sortKey = b.dataset.sort;
      $$("[data-sort]").forEach((x) => x.setAttribute("aria-pressed", x === b));
      drawTable();
    }));

    async function loadCoins() {
      const ids = coins.map((c) => c.id).join(",");
      const [g, fx, up] = await Promise.all([
        getJSON(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&price_change_percentage=24h`),
        getJSON("https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=krw,usd").catch(() => null),
        getJSON(`https://api.upbit.com/v1/ticker?markets=${coins.filter((c) => c.upbit !== false).map((c) => "KRW-" + c.symbol).join(",")}`).catch(() => []),
      ]);
      // USDT 원화 가격 ÷ USD 가격 ≈ 원/달러 환율
      const rate = fx?.tether?.krw && fx?.tether?.usd ? fx.tether.krw / fx.tether.usd : null;
      const upMap = Object.fromEntries((up || []).map((t) => [t.market.replace("KRW-", ""), t.trade_price]));
      data = g.map((c) => {
        const conf = coins.find((x) => x.id === c.id) || {};
        const upbit = upMap[c.symbol.toUpperCase()] ?? null;
        return { ...c, ko: conf.name || c.name, upbit, kimp: upbit && rate ? (upbit / (c.current_price * rate) - 1) * 100 : null };
      });
      drawTable();
      const btc = data.find((c) => c.id === "bitcoin");
      if (btc) { stat("btc", usd(btc.current_price)); stat("btcChg", `24h ${pct(btc.price_change_percentage_24h)}`, dir(btc.price_change_percentage_24h)); }
    }
    async function loadGlobal() {
      const g = await getJSON("https://api.coingecko.com/api/v3/global");
      stat("dom", `${g.data.market_cap_percentage.btc.toFixed(1)}%`);
    }
    async function loadTvl() {
      const chains = await getJSON("https://api.llama.fi/v2/chains");
      const total = chains.reduce((s, c) => s + (c.tvl || 0), 0);
      stat("tvl", big(total));
      const top = chains.filter((c) => c.tvl > 0).sort((a, b) => b.tvl - a.tvl).slice(0, 10);
      const max = top[0]?.tvl || 1;
      $("[data-tvl]").innerHTML = top.map((c, i) => `<li><span class="rank">${i + 1}</span><span>${c.name}</span><span class="bar" aria-hidden="true"><i style="width:${(c.tvl / max * 100).toFixed(1)}%"></i></span><span class="val">${big(c.tvl)}</span></li>`).join("");
    }
    const FNG = T.fng || {};
    async function loadFng() {
      const f = await getJSON("https://api.alternative.me/fng/?limit=1");
      const now = f.data[0];
      stat("fng", now.value);
      stat("fngLbl", FNG[now.value_classification] || now.value_classification, "");
    }
    async function loadAll() {
      const res = await Promise.allSettled([loadCoins(), loadGlobal(), loadTvl(), loadFng()]);
      if (res[0].status === "rejected" && !data.length) drawTable();
      // CoinGecko 무료 호출 제한(분당)에 걸리면 30초 뒤 한 번 더
      if ((res[0].status === "rejected" || res[1].status === "rejected") && !loadAll.retried) { loadAll.retried = true; setTimeout(() => { loadAll.retried = false; loadAll(); }, 30000); }
      if (res[2].status === "rejected") { const t = $("[data-tvl]"); if (t && !t.querySelector(".bar")) t.innerHTML = `<li class="empty">${T.tvlFail}</li>`; }
      const u = $("[data-mk-updated]");
      if (u) u.textContent = new Date().toLocaleTimeString(LOC, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    }
    $("[data-mk-refresh]")?.addEventListener("click", loadAll);
    every(120000, loadAll);
  }

  /* ---------- 상담 신청 폼 ---------- */
  const form = $("[data-contact]");
  if (form) {
    const msg = $("[data-form-msg]");
    const say = (t, cls) => { msg.textContent = t; msg.className = "form-msg " + (cls || ""); };
    const c = BK.contact || {};
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (form._gotcha.value) return; // 스팸 봇
      let bad = null;
      for (const el of $$("[required]", form)) {
        const empty = el.type === "checkbox" ? !el.checked : !el.value.trim();
        const wrong = el.type === "email" && el.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value);
        el.setAttribute("aria-invalid", empty || wrong);
        if ((empty || wrong) && !bad) bad = el;
      }
      if (bad) {
        say(bad.name === "agree" ? T.agree : bad.name === "email" && bad.value ? T.emailFmt : T.required, "err");
        bad.focus();
        return;
      }
      const fd = new FormData(form);
      const Lb = T.labels;
      const payload = {
        [Lb.name]: fd.get("name"), [Lb.company]: fd.get("company") || "-", [Lb.email]: fd.get("email"), [Lb.phone]: fd.get("phone") || "-",
        [Lb.interest]: fd.getAll("interest").join(", ") || "-", [Lb.message]: fd.get("message"),
      };
      const subject = `${T.subject} ${payload[Lb.name]}${payload[Lb.company] !== "-" ? ` / ${payload[Lb.company]}` : ""}`;
      const btn = $("button[type=submit]", form);
      btn.disabled = true; say(T.sending);
      try {
        if (c.web3formsKey) {
          const r = await getJSON("https://api.web3forms.com/submit", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ access_key: c.web3formsKey, subject, from_name: "BLOCKKEY 웹사이트", replyto: payload[Lb.email], ...payload }) }, 15000);
          if (!r.success) throw new Error(r.message);
        } else if (c.formspreeId) {
          await getJSON(`https://formspree.io/f/${c.formspreeId}`, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ _subject: subject, _replyto: payload[Lb.email], ...payload }) }, 15000);
        } else if (c.email) {
          const body = Object.entries(payload).map(([k, v]) => `${k}: ${v}`).join("\n");
          location.href = `mailto:${c.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
          say(T.mailOpen, "ok");
          btn.disabled = false;
          return;
        } else if (c.telegram) {
          const text = `${subject}\n` + Object.entries(payload).map(([k, v]) => `${k}: ${v}`).join("\n");
          let copied = false;
          try { await navigator.clipboard.writeText(text); copied = true; } catch {}
          window.open(`https://t.me/${c.telegram}`, "_blank", "noopener");
          say(copied ? fmt(T.tgCopied, c.telegram) : fmt(T.tgSend, c.telegram), "ok");
          if (!copied) { msg.insertAdjacentHTML("beforeend", `<textarea class="tg-copy" readonly rows="6"></textarea>`); msg.querySelector(".tg-copy").value = text; }
          btn.disabled = false;
          return;
        } else {
          throw new Error("no-endpoint");
        }
        form.reset();
        $$("[aria-invalid]", form).forEach((el) => el.removeAttribute("aria-invalid"));
        say(T.ok, "ok");
      } catch (err) {
        say(err.message === "no-endpoint" ? T.notReady : T.netFail, "err");
      } finally { btn.disabled = false; }
    });
    form.addEventListener("input", (e) => { if (e.target.getAttribute("aria-invalid") === "true") e.target.removeAttribute("aria-invalid"); });
  }
})();
