// 새 인사이트 글 만들기: npm run new -- "글 제목" 영문-주소 [카테고리]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const [title, slug, category = "인사이트"] = process.argv.slice(2);
if (!title || !slug || !/^[a-z0-9-]+$/.test(slug)) {
  console.log('사용법: npm run new -- "글 제목" 영문-소문자-주소 [카테고리]');
  process.exit(1);
}
const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../content/insights");
const file = path.join(dir, `${slug}.md`);
if (fs.existsSync(file)) { console.log(`이미 있음: ${file}`); process.exit(1); }
const today = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
fs.writeFileSync(file, `---\ntitle: ${title}\ndate: ${today}\ncategory: ${category}\nsummary: 목록에 보일 한두 줄 요약\n---\n## 소제목\n본문을 마크다운으로 씁니다.\n`);
console.log(`만들었어요: content/insights/${slug}.md`);
