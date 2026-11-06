# 더홍보 → Threads 공식 계정 자동 홍보 (검토용 초안)

이 폴더는 **기존 Next.js 사이트와 분리된** Cloudflare Worker입니다. 별도 배포 전까지 사이트에 영향이 없고, 배포하더라도 `AUTOPOST_ENABLED=false`가 기본값이므로 게시하지 않습니다.

## 목표

- 공개된 더홍보의 **신규 게시글**만 10분 간격으로 검색합니다.
- **원문 우선**: 실제 게시글 제목 + 한 줄 소개(없으면 본문 일부)를 글의 앞부분에 유지합니다. AI가 생성한 SNS식 짧은 소개는 중간에만 보충합니다. 뒤에는 실제 글 링크 + 더홍보 자체 홍보 + 유머러스한 공식 담당자 한마디를 붙입니다.
- 10종의 서로 다른 유머 마무리 문구를 게시글 ID에 따라 순환합니다. 약 5개 중 1개는 가벼운 인사말로 시작하되 대다수는 바로 원문 소개로 시작합니다. 재시도해도 문구가 바뀌지 않습니다.
- `USE_AI=false`면 비용 없는 원문 기반 템플릿, `USE_AI=true`면 OpenAI API로 홍보 문장을 재작성합니다.
- 최초 시작 시각 이후의 글만 처리하고, 초기 샘플 글(`is_seed=true`)은 제외합니다.
- 게시글별 1회만 예약하고, 24시간 최대 발행 수를 제한합니다. 애매한 API 오류는 재시도하지 않고 `review`로 남깁니다.

## SNS 문구 예시 (모두 가상의 게시글)

```text
📢 울산 신규 카페 오픈

오픈 기념 음료 할인 이벤트 진행! 가까운 분들은 구경해 보세요.

🔎 원문 보기: https://www.thehongbo.com/post/123

광고냐고요? 맞습니다. 근데 꽤 열심히 하고 있죠. 😎
무료 홍보는 더홍보에서! #더홍보
```

- 실제 없는 혜택/가격/주소를 만들어내지 않습니다.
- 너무 잦은 반복홍보로 보이지 않도록 일일 발행 제한을 둡니다.
- 사용자 공개 글을 외부 플랫폼에 재게시하는 목적을 서비스 고지에 반영하고, 연락처 등 개인정보 노출 가능성을 검토하세요.

## 사용자 계정에서 준비할 것 (휴대폰 가능)

1. Threads에 더홍보 공식 프로필 만들기.
2. [Meta for Developers](https://developers.facebook.com/apps/) → Create App → Threads 사용 사례로 앱 만들기.
3. 공식 계정이 게시를 승인하도록 OAuth 설정(`threads_basic`, `threads_content_publish`). 토큰 발급·장기 토큰 갱신 관리 필요. 앱 역할 이외 사용자는 별도 검수가 필요할 수 있습니다.
4. Cloudflare Workers에 아래 **Secret**을 직접 등록하세요. 어떤 비밀 키도 GitHub/채팅에 붙여넣지 마세요.
5. Supabase SQL Editor에서 `sql/0001_threads_promotion.sql`을 실행하세요.
6. 게시물의 공식 SNS 재게시에 대해 작성자 고지/동의 및 운영정책을 확인한 후 발행을 활성화하세요.

## Worker 별도 배포 준비

프로젝트 루트에서 (Wrangler 로그인 필요):

```sh
cd automation/threads
npx wrangler deploy
```

배포할 Worker 이름은 `hongbo-threads-promo`입니다. 기존 `hongbo` 사이트 Worker와 분리됩니다.

### Variables (일반 변수)

| 이름 | 예시 | 기능 |
| --- | --- | --- |
| `AUTOPOST_ENABLED` | `false` | 모든 준비가 끝나면 `true` |
| `THREADS_START_AT` | `2026-11-07T09:00:00+09:00` | 첫 활성화한 시점부터 시작, 과거글 일괄 재게시 방지. **실제 활성화 시각으로 설정** |
| `SITE_URL` | `https://www.thehongbo.com` | 글 링크 |
| `MAX_POSTS_PER_DAY` | `6` | 하루 최대 1~20개 |
| `USE_AI` | `false` | AI 문구 재작성 선택 |
| `OPENAI_MODEL` | `gpt-4.1-mini` | AI 모델 선택 |

### Secrets (민감 키)

- `SUPABASE_URL` (프로젝트 URL, 공개값이지만 서버 설정으로 관리)
- `SUPABASE_SERVICE_ROLE_KEY` (DB 전체 접근 가능: 절대로 공개하지 않기)
- `THREADS_ACCESS_TOKEN` (공식 프로필에서 발급한 Threads 사용자 토큰)
- `OPENAI_API_KEY` (선택, `USE_AI=true`일 때만)

`THREADS_START_AT`이 없거나 날짜로 해석되지 않으면 자동 발행은 실패하도록 설계했습니다.

## 발행 검증

1. 먼저 `AUTOPOST_ENABLED=false`로 배포: 10분마다 아무 글도 발행하지 않음.
2. Supabase SQL 적용, Meta 토큰 준비, 고지/동의 확인.
3. 발행 시작 시각을 미래 현재 시각으로 입력. 실제 신규 글 하나로 검증.
4. Worker 로그와 `select * from public.threads_promotion_jobs order by claimed_at desc;`로 확인.
5. 실패하면 `review` 기록을 확인하고 수동 조치. 불확실한 발행을 자동 재전송하지 않습니다.

## 현재 초안의 한계

- 소스 게시글은 공개 상태이지만, 작성자 동의를 확보하는 UI나 관리자 승인 UI는 아직 없습니다. 실제 전체 자동화 전 추가하세요.
- Meta 토큰은 만료되므로 유효기간 점검과 장기 토큰 갱신이 필요합니다.
- 홍보글에 개인정보나 부적절한 문구가 포함될 수 있으므로 초기에는 소수 게시글 시험 발행을 권장합니다.
- API·서비스 계정 권한, Cloudflare 실배포, 실서비스 DB 스키마 적용은 아직 검증되지 않았습니다.
