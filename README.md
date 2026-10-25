# BLOCKKEY AI

AI 마케팅 · AI 개발 · 블록체인 연동·관리 회사 소개 사이트. base44에서 옮겨 와 GitHub Pages로 운영합니다.

- 호스팅: GitHub Pages (무료)
- 서버·DB·외부 패키지 없음 (Node 22만 있으면 빌드)
- `main`에 커밋하면 1~2분 뒤 자동 반영

## 페이지
| 주소 | 내용 |
|---|---|
| `/` | 홈: 히어로(실시간 BTC·ETH 블록), 서비스, 적용 예시, 진행 방식, 강점, 생태계, FAQ, 상담 신청 |
| `/markets/` | 시세·거래량·업비트 김프·도미넌스·공포탐욕지수·체인별 TVL (브라우저에서 공개 API 직접 호출, 키 불필요) |
| `/insights/` | 인사이트 글 목록 + 글 페이지 |
| `/privacy/`, `/terms/` | 개인정보처리방침, 이용약관 |

## 자주 하는 수정

### 문구 바꾸기 → `data/home.json`
히어로, 서비스 3개, 적용 예시, 진행 단계, 강점, FAQ, 상담 안내 문구가 전부 여기 있어요. GitHub 웹에서 파일 열고 연필 아이콘 → 수정 → **Commit changes**.

### 프로젝트·상장 종목·VC 바꾸기 → `data/ecosystem.json`
- `featured`: 관심 프로젝트
- `marketWatch`: 이달의 신규 상장 (월마다 `title`과 `items` 교체)
- `vcs`: 글로벌 VC 목록

로고는 CoinMarketCap 이미지 주소(`https://s2.coinmarketcap.com/static/img/coins/128x128/번호.png`)를 넣으면 돼요.

### 시세 페이지 코인 → `data/markets.json`
CoinGecko id와 심볼. 업비트 원화마켓에 없는 코인은 `"upbit": false`.

### 인사이트 글 쓰기 → `content/insights/영문-주소.md`
```markdown
---
title: 글 제목
date: 2026-10-26
category: AI 마케팅
summary: 목록에 보일 한두 줄 요약
---
## 소제목
본문 (마크다운)
```
`draft: true`를 넣으면 숨김. 내 컴퓨터에서는 `npm run new -- "글 제목" 영문-주소 카테고리`.

## 사이트 설정 — `site.config.json`
| 항목 | 설명 |
|---|---|
| `domain` | 도메인 연결 후 `blockkey.co.kr` 처럼 입력 (CNAME 자동 생성) |
| `contact.web3formsKey` | **상담 폼 접수용** (추천). [web3forms.com](https://web3forms.com)에서 이메일 입력 → 받은 Access Key 붙여넣기. 신청 내용이 그 메일로 옴 |
| `contact.formspreeId` | Formspree를 쓸 경우 폼 ID (`xyzabcd`) |
| `contact.email` | 위 두 개가 비어 있으면 상담 버튼이 이 주소로 메일 앱을 열어요. 푸터에도 표시 |
| `contact.telegram`, `contact.kakao` | 푸터 연락 채널 (`@아이디`, 카카오 오픈채팅 주소) |
| `analytics.ga4` | GA4 측정 ID (`G-XXXX`) |
| `footer` | 상호, 대표, 사업자등록번호, 주소 |

## 도메인 연결
1. DNS에 레코드 추가
   - 루트 도메인: A 레코드 4개 `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `www`: CNAME → `probe2928-crypto.github.io`
2. 저장소 **Settings → Pages → Custom domain**에 입력 → Save → **Enforce HTTPS**
3. `site.config.json`의 `domain`에 같은 도메인 입력 후 커밋

## 로컬 미리보기
```bash
npm run dev     # http://localhost:4321
```

## 구조
```
data/               홈 문구, 생태계, 시세 코인 목록
content/insights/   인사이트 글 (마크다운)
content/legal/      개인정보처리방침, 이용약관
public/             CSS, JS, 아이콘, 공유 이미지
scripts/            빌드·로컬 서버·새 글
.github/workflows/  자동 빌드·배포
```

## base44에서 바뀐 점
- 5장짜리 자동 슬라이드 → 첫 화면 한 장 + 실시간 블록 피드, 슬라이드 4개 문구는 히어로 하단 바로가기로
- 디자인: 검정+민트 → 잉크 네이비 + 황동(KEY) 포인트, 본문은 밝은 톤으로 가독성 개선
- 시장 데이터: 업비트 김치 프리미엄, BTC 도미넌스, 공포·탐욕 지수 추가
- 인사이트: 카드 4개 → 실제 글 4편 + 글 추가 구조
- SEO: 페이지별 메타·OG 이미지·사이트맵·구조화 데이터(회사, FAQ, 글)
- 상담 신청: base44 내부 DB 대신 Web3Forms/Formspree/메일 중 선택
