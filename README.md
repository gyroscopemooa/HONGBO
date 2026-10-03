# 더홍보 (thehongbo.com)

> 앱도, 가게도, 사이트도, 물건도. 그냥 홍보하세요.
> 누구나 무엇이든 **무료로 홍보**하고, 방문자는 바로 발견해서 원래 링크로 이동하는 범용 홍보 게시판.

기획 기준 문서: [`docs/thehongbo_claude_build_prompt_v2.md`](docs/thehongbo_claude_build_prompt_v2.md) · 디자인 기준: [`docs/concept.png`](docs/concept.png)

- **스택**: Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Supabase (Auth + Postgres + Storage) · Cloudflare Workers (OpenNext) · Pretendard
- **MVP 범위**: 홍보글 등록 → 메인/목록 노출 → 상세 → 외부 클릭 루프. (결제·포인트·채팅·팔로우·댓글·별점은 의도적으로 제외)

---

## 1. 바로 실행해 보기 (Supabase 없이)

환경변수가 없으면 **로컬 미리보기 모드**로 동작합니다. 데이터는 `.data/db.json` 파일에 저장되고, 첫 실행 때 운영자 초기 콘텐츠(38개)가 자동으로 들어갑니다.

```bash
npm install
npm run dev        # http://localhost:3000
```

- `/auth` 화면에 **테스트 회원 / 테스트 관리자 로그인** 버튼이 나옵니다. (개발 환경 + Supabase 미설정일 때만 표시)
- 초기화하려면 `.data` 폴더를 지우세요.

> ⚠️ 로컬 미리보기 모드는 운영용이 아닙니다. 운영 서버(`NODE_ENV=production`)에서는 테스트 로그인이 꺼지고 Google 로그인(Supabase)만 사용합니다.

## 2. 운영 설정 (Supabase + Google 로그인 + Cloudflare)

### 2-1. Supabase 프로젝트
1. [supabase.com](https://supabase.com) 에서 새 프로젝트를 만듭니다.
2. **SQL Editor** 에서 아래 두 파일 내용을 차례로 실행합니다.
   - [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) — 테이블 · 인덱스 · RLS · 함수 · 이미지 버킷(`post-images`)
   - [`supabase/seed.sql`](supabase/seed.sql) — 운영자 초기 콘텐츠(홍보글 38 · 배너 5 · 공지 4). 여러 번 실행해도 중복되지 않습니다.
3. **Project Settings → API** 에서 `Project URL`, `anon public`, `service_role` 키를 확인합니다.

### 2-2. Google 로그인
1. [Google Cloud Console](https://console.cloud.google.com) → *API 및 서비스 → 사용자 인증 정보* → **OAuth 클라이언트 ID(웹 애플리케이션)** 생성
2. *승인된 리디렉션 URI* 에는 **Supabase 콜백 주소 하나만** 넣습니다.
   `https://<프로젝트ID>.supabase.co/auth/v1/callback` (Supabase → Authentication → Sign In / Providers → Google 화면에 표시됨)
3. Supabase 의 같은 Google 설정에 클라이언트 ID / 시크릿을 넣고 Enable 합니다.
4. Supabase **Authentication → URL Configuration**
   - Site URL: 운영 도메인 (도메인 연결 전에는 `http://localhost:3000`)
   - Redirect URLs: `http://localhost:3000/auth/callback`, `https://www.thehongbo.com/auth/callback`, (테스트용) `https://thehongbo.<계정>.workers.dev/auth/callback`
5. Google 의 *OAuth 동의 화면* 을 **프로덕션으로 게시**해야 누구나 로그인할 수 있습니다.

### 2-3. 환경변수 (로컬)
`.env.example` 을 `.env.local` 로 복사해 채웁니다.

| 변수 | 설명 |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | 사이트 대표 주소 (canonical · sitemap · OG) |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 공개 값 |
| `SUPABASE_SERVICE_ROLE_KEY` | **서버 전용 비밀 키** (절대 `NEXT_PUBLIC_` 금지) |
| `ADMIN_EMAILS` | 관리자 이메일(쉼표 구분). 이 이메일로 Google 로그인하면 `/admin` 접근 |
| `NEXT_PUBLIC_CONTACT_EMAIL` | (선택) 문의하기·광고문의 페이지에 표시할 이메일 |

### 2-4. Cloudflare 배포 (Workers + OpenNext)

`@opennextjs/cloudflare` 어댑터로 Cloudflare Workers 에 배포하도록 준비되어 있습니다. (`wrangler.jsonc`, `open-next.config.ts`)
압축 후 Workers 업로드 크기는 약 1.6 MiB 로 무료 플랜 한도(3 MiB) 안입니다.

1. 코드를 GitHub 저장소에 푸시합니다.
2. Cloudflare 대시보드 → **Workers & Pages → Create → Import a repository** 로 저장소를 연결합니다.
   - Worker 이름: `hongbo` (`wrangler.jsonc` 의 `name` 과 같아야 합니다)
   - Build command: `npx opennextjs-cloudflare build`
   - Deploy command: `npx opennextjs-cloudflare deploy`
3. **Build 변수** (Settings → Build → Variables and secrets) — 빌드할 때 화면 코드에 박히는 공개 값입니다.
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`, (선택) `NEXT_PUBLIC_CONTACT_EMAIL`
4. **런타임 Secret** (Worker → Settings → Variables and secrets, 유형 **Secret**) — 배포 때 지워지지 않도록 Secret 으로 등록합니다.
   - `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAILS`
   - 안전하게 `NEXT_PUBLIC_*` 값도 같은 이름의 Secret 으로 한 번 더 넣어두면 런타임에서도 읽힙니다.
5. 배포가 끝나면 `https://thehongbo.<계정>.workers.dev` 주소가 생깁니다. 도메인을 연결하기 전에는 이 주소로 테스트하세요.

> ⚠️ **무료 플랜 주의**: Workers 무료 플랜은 요청당 CPU 시간이 10ms 로 제한됩니다. 페이지에 따라 서버 렌더링이 이 한도를 넘어 `Error 1102` 가 날 수 있어요. 오류가 보이면 Workers Paid(월 $5)로 올리세요.

로컬에서 Workers 런타임(workerd)으로 미리보기: `npm run preview`

### 2-5. 도메인 연결 (Cloudflare)

1. Cloudflare 대시보드 → **Domain Registration → Register Domains** 에서 `thehongbo.com` 을 구매합니다. (원가 판매)
2. Worker → **Settings → Domains & Routes → Add → Custom domain** 에서 `www.thehongbo.com` 을 추가합니다. (DNS 는 자동 설정)
3. 루트 `thehongbo.com` → `www` 리다이렉트: Rules → Redirect Rules 에서 `thehongbo.com/*` 를 `https://www.thehongbo.com/${1}` (301)로 보냅니다. 루트 도메인에 프록시된 DNS 레코드가 필요하면 더미 A 레코드(`192.0.2.1`, 프록시 켬)를 추가합니다.
4. 도메인이 연결되면 **한 번에** 바꿉니다.
   - Cloudflare Build 변수 `NEXT_PUBLIC_SITE_URL` = `https://www.thehongbo.com` (바꾼 뒤 재배포)
   - Supabase **Site URL** = `https://www.thehongbo.com`
5. 배포 후 `https://www.thehongbo.com/sitemap.xml` 을 Google Search Console / 네이버 서치어드바이저에 제출합니다.

## 3. 화면 · 라우트

| 경로 | 설명 |
| --- | --- |
| `/` | 메인 (히어로 · 카테고리 타일 · 오늘의 인기 홍보 · 배너 · 최신 홍보글 · 랭킹 · 공지/사이드) |
| `/posts` `?sort=latest\|popular` | 전체 홍보글 |
| `/category/[slug]` | 카테고리별 (`apps` `websites` `services` `offline` `products` `content` `events` `free`) |
| `/search?q=` | 검색 (제목 · 한 줄 소개 · 상세 설명 · 태그) |
| `/region?region=서울` | 지역별 |
| `/post/[id]` | 상세 (외부 이동 CTA · 신고 · 링크 복사 · 같은 카테고리 추천) |
| `/write` · `/post/[id]/edit` | 통합 글쓰기 / 수정 (로그인 필요) |
| `/mypage` | 내 홍보 (수정 · 삭제 · 다시 홍보하기 · 닉네임) |
| `/auth` | Google 로그인 |
| `/admin` | 관리자 (홍보글 · 신고 · 사용자 · 배너 · 공지 · 초기 콘텐츠 일괄 관리) |
| `/terms` `/privacy` `/policy` `/contact` `/notices` | 약관 · 개인정보처리방침 · 운영정책 · 문의 · 공지 |

## 4. 운영 가이드

- **초기 콘텐츠(seed)**: 모든 글에 `is_seed = true` 가 붙어 있고 조회수·작성자 등은 만들지 않았습니다. 실제 글이 쌓이면 `/admin` 대시보드에서 *초기 글 모두 숨기기*(되돌릴 수 있음) 또는 *삭제*를 누르세요. 초기 글의 외부 링크는 `example.com` 자리표시자이므로, 실제 서비스로 바꾸려면 `/admin/posts` 의 *수정* 으로 링크를 교체하세요.
- **메인 인기 홍보**: 운영자가 *메인 고정 + 순위* 를 준 글이 먼저 노출됩니다. 최근 72시간 유효 조회·클릭이 300건 이상 쌓이면 자동으로 실제 인기순으로 전환됩니다. (`src/lib/constants.ts` 의 `LIMITS`)
- **노출 기간**: 일반 글은 60일 후 목록에서 내려가고(삭제 아님) 작성자가 *다시 홍보하기* 로 연장합니다. 초기 글은 만료되지 않습니다. (`LIMITS.postLifetimeDays`)
- **스팸 대응**: 계정당 10분 3개 · 하루 10개 제한, 같은 링크 반복 등록 차단, 기본 금지 키워드 필터(`src/lib/policy.ts`), 신고 → 관리자 확인 후 숨김.
- **보안**: 외부 링크는 http/https만 허용(사설 IP·localhost 차단), 링크 미리보기는 SSRF 방어 fetch(`src/lib/safe-fetch.ts`: DNS-over-HTTPS 로 대상 IP 검사), 업로드는 매직바이트 검증 + 로그인 필수, 관리자 액션은 서버에서 매번 권한 재확인, 모든 테이블 RLS 활성화.
- **이미지**: 업로드 전에 브라우저에서 16:9 · 최대 960px · webp 로 줄이므로(EXIF 제거) 서버 이미지 최적화를 쓰지 않습니다.

## 5. 스크립트

```bash
npm run dev            # 개발 서버
npm run build          # Next.js 프로덕션 빌드
npm run start          # Next.js 프로덕션 실행 (Node)
npm run lint           # ESLint
npm run typecheck      # tsc --noEmit
npm run preview        # Cloudflare Workers 런타임으로 빌드 + 로컬 미리보기
npm run deploy         # Cloudflare 로 직접 배포 (wrangler 로그인 필요)
npm run seed:images    # public/seed, public/defaults 이미지 재생성
npm run seed:sql       # supabase/seed.sql 재생성 (src/data/seed.ts 기준)
```

## 6. 폴더 구조

```
src/
  app/                 라우트 (페이지 · 서버 액션 · API)
  components/          UI 컴포넌트 (PostCard · PostForm · Hero · Carousel …)
  data/seed.ts         운영자 초기 콘텐츠 정의
  lib/
    store/             저장소 계층 (supabase.ts = 운영 / local.ts = 로컬 미리보기)
    validation.ts      글 입력 검증 (서버에서 다시 검증)
    safe-fetch.ts      SSRF 방어 fetch · og.ts 링크 미리보기 파싱
    auth.ts · queries.ts · policy.ts · constants.ts …
  middleware.ts        Supabase 세션 갱신 (Cloudflare 호환을 위해 엣지 방식 사용)
supabase/              migrations/0001_init.sql · seed.sql
scripts/               seed 이미지/SQL 생성 스크립트
wrangler.jsonc · open-next.config.ts   Cloudflare Workers 배포 설정
```
