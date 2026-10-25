// 외부 패키지 없이 쓰는 작은 도우미: 마크다운 → HTML, 프런트매터 파서

const escHTML = (s = "") => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function inline(s) {
  return escHTML(s)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img src="$2" alt="$1" loading="lazy">')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, h) => `<a href="${h}"${/^https?:/.test(h) ? ' target="_blank" rel="noopener"' : ""}>${t}</a>`)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>");
}

/** 기사·속보에 필요한 만큼의 마크다운: 제목(##, ###), 문단, 목록, 인용, 굵게/기울임, 링크, 이미지, 인라인 코드 */
export function markdown(src = "") {
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (!l.trim()) { i++; continue; }
    let m;
    if ((m = l.match(/^(#{1,4})\s+(.*)$/))) {
      const n = Math.max(2, m[1].length);
      out.push(`<h${n}>${inline(m[2])}</h${n}>`); i++; continue;
    }
    if (/^>\s?/.test(l)) {
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ""));
      out.push(`<blockquote>${markdown(buf.join("\n"))}</blockquote>`); continue;
    }
    if (/^\s*[-*]\s+/.test(l)) {
      const buf = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) buf.push(`<li>${inline(lines[i++].replace(/^\s*[-*]\s+/, ""))}</li>`);
      out.push(`<ul>${buf.join("")}</ul>`); continue;
    }
    if (/^\s*\d+[.)]\s+/.test(l)) {
      const buf = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) buf.push(`<li>${inline(lines[i++].replace(/^\s*\d+[.)]\s+/, ""))}</li>`);
      out.push(`<ol>${buf.join("")}</ol>`); continue;
    }
    if (/^(---|\*\*\*)\s*$/.test(l)) { out.push("<hr>"); i++; continue; }
    const buf = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|>|\s*[-*]\s+|\s*\d+[.)]\s+)/.test(lines[i])) buf.push(lines[i++]);
    out.push(`<p>${buf.map(inline).join("<br>")}</p>`);
  }
  return out.join("\n");
}

export const esc = escHTML;

/** --- 로 감싼 YAML 비슷한 머리말(key: value) + 본문 분리 */
export function frontmatter(src = "") {
  const m = src.replace(/\r\n/g, "\n").match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: src };
  const data = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^([\w-]+):\s*(.*)$/);
    if (!kv) continue;
    let v = kv[2].trim().replace(/^["']|["']$/g, "");
    if (v === "true") v = true; else if (v === "false") v = false;
    else if (/^\[.*\]$/.test(v)) v = v.slice(1, -1).split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
    data[kv[1]] = v;
  }
  return { data, body: m[2] };
}
