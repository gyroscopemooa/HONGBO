# 더홍보 → Threads (PR #10 이어서 개발)

운영 자동 발행 기본 OFF. 기존 사이트 Worker와 별도인 `hongbo-threads-promo`에만 배포한다.
초기 개발 단계에서는 운영 변경을 하지 않았다. 아래 후속 진행 상태를 기준으로 확인한다.

## 후속 진행 상태 (2026-11-07)

- 작성자가 마스킹 입력 도구 `preflight.ps1`로 `VERIFIED: @iamthehongbo` 결과를 확인했다. 도구는 토큰을 저장하거나 게시하지 않는다.
- 운영 DB 읽기 전용 조회로 0001/0002의 테이블과 lease/publish_started_at 컬럼을 확인했다. 설정은 enabled=false, use_ai=false, daily_limit=6이다. 이번 확인에서 SQL은 재실행하지 않았다.
- 사용자 승인 후 별도 `hongbo-threads-promo` Worker를 OFF 상태로 배포했다. 최초 버전: `06e61a53-6f8c-4806-8d82-46f68d6b60c8`, 10분 Cron, AUTOPOST_ENABLED=false / USE_AI=false.
- SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY를 Cloudflare Secret으로 등록했다. 값은 새 파일이나 로그에 기록하지 않았다.
- Threads 토큰 Secret 및 발급/만료 시각 등록, 사이트 관리자 UI 운영 배포, 실제 1건 게시 테스트와 최종 ON 승인은 아직 남아 있다. 기존 사이트 Worker는 변경하지 않았다.

## 구현

- 10분 Cron. DB `enabled=false`와 Worker `AUTOPOST_ENABLED=false` 두 스위치 모두 켜야 발행된다.
- 한국 시간 자정 기준 일일 기본 6개, 관리자에서 1~20개. 안전상 실패·검토 중인 예약도 당일 한도를 사용한다.
- 최초 `published_at >= THREADS_START_AT`인 공개 active 글만 조회. 끌어올리기는 bumped_at만 변경하므로 신규로 오인하지 않는다.
- 샘플·숨김·차단·삭제·만료·기존 처리 글 제외. 원문별 PK, 설정 행 잠금, 작업별 UUID lease로 중복/동시 실행을 방지한다.
- `/post/[id]/threads`: 작성자 본인만 선택 동의·철회. 기존 글의 동의는 추정하지 않는다. 글 상세의 작성자 메뉴에서 접근한다.
- `/admin/threads`: ON/OFF, AI 선택 ON/OFF, 일일 한도, 최근 50개 작업, 원문/Threads 링크, 문구 미리보기, 글별 승인/제외, 안전한 재시도.
- 원문 전체·부가 정보·링크 미리보기의 개인정보/민감정보를 관리자가 검토한 글만 발행 가능. 내용 해시가 바뀌면 재검토한다. 이메일·전화·주민번호·민감어 패턴은 추가로 자동 차단한다. 패턴 검사만으로 모든 개인정보를 식별할 수 있다고 보장하지 않는다.
- 제목 + 원문 소개/일부 + 정확한 원문 URL + 더홍보 소개 + 순환 유머. 이모지에 여유를 둔 보수적 430 가중 문자 예산, 게시 직전 500 상한 검사.
- AI는 자유로운 사실 생성 대신 검토된 세 가지 비사실성 멘트 중 하나를 선택한다. 유효하지 않은 출력/실패 시 원문 템플릿. 자유 생성형 SNS 카피는 구현하지 않았다.
- 계정은 코드에서 `iamthehongbo`로 고정. 환경변수로 다른 계정을 허용할 수 없다. 큐 예약 전과 컨테이너 생성 직전 GET /me 확인.
- `POST /{user_id}/threads`로 TEXT 컨테이너 생성 → 상태 FINISHED 확인 → DB에 publishing 단계 기록/원문·동의 재확인 → `POST /{user_id}/threads_publish`에 creation_id 전달.
- auto_publish_text를 사용하지 않는다. 게시 요청 전 실패만 10/20분 후 최대 3회 안전 재시도. publishing 이후의 오류·타임아웃·DB 결과 불확실은 review이며 자동/관리자 재전송 금지. 15분 이상 남은 실행도 review로 격리.
- 비밀키나 API 응답 원문을 로그에 남기지 않고 오류 코드만 남긴다. 공개 HTTP 트리거 없음.

## SQL 적용: 반드시 사전 검토/승인 후

현재 운영에는 해당 스키마가 존재하므로 재실행하지 않는다. 신규 환경에서만 `sql/0001_threads_promotion.sql` 후 `sql/0002_safe_queue.sql`을 순서대로 적용한다. 이미 0001을 적용했다면 0002만 적용한다. 0002는 재실행용이 아니며 트랜잭션 전체가 성공해야 한다.

기존 posts의 행/컬럼을 변경하거나 삭제하지 않는다. 새 Threads 전용 테이블·함수·권한만 변경한다. 기존 초안 job의 FK cascade를 제거하여 원문이 물리 삭제되어도 중복 방지 이력은 보존한다. Supabase service_role만 접근하며 anon/authenticated는 테이블·RPC 권한이 없다. 앱 서버가 매 요청 인증/관리자 또는 작성자 권한을 검증한다.

SQL 검증은 격리된 PGlite PostgreSQL 엔진의 테스트용 posts 테이블에서 수행한다. 실제 Supabase의 역할·확장·네트워크까지 검증한 것은 아니다. 별도 스테이징에서 0001→0002 적용, 동의→승인→예약, 권한 거부, 동시 호출을 다시 확인한다.

## 로컬 검증 (외부 발행 없음)

```sh
cd automation/threads
npm ci --ignore-scripts
npm test
cd ../..
npm run typecheck
npm run lint
npm run build
npx wrangler deploy --dry-run --config automation/threads/wrangler.jsonc
```

토큰을 받은 뒤 별도 Secret 관리 도구에서 환경변수를 주입하고 `node automation/threads/preflight.mjs` 실행: GET /me만 호출한다. 토큰 값은 채팅·CLI 인자·GitHub·원고에 넣지 않는다. 출력에는 계정 확인 결과와 만료 상태만 표시된다.

## Meta PC 준비

1. Meta 개발자 앱 Gyroscope에서 Threads 테스터 @iamthehongbo, 수락 상태, threads_basic/threads_content_publish 확인.
2. PC에서 공식 계정으로 로그인하여 앱의 Threads 사용자 토큰 발급 절차를 진행한다. 브라우저 OAuth 흐름 사용 시 등록된 redirect URI, 승인 요청 URI, 코드 교환 redirect_uri가 완전히 일치해야 한다. 흰 화면의 원인은 아직 실제 브라우저로 재현하지 못했다.
3. 단기 토큰은 공식 장기 토큰 교환 절차로 교환한다. 반환 expires_in으로 만료 시각을 계산하고 발급 시각과 함께 기록한다.
4. GET /me 검증 후 토큰을 별도 Worker의 Cloudflare Secret에 등록한다. SQL service role 키도 별도 Secret에 저장한다.

## 별도 Worker 설정

필수 Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, THREADS_ACCESS_TOKEN.
필수 서버 변수: THREADS_START_AT(최초 신규 글 허용 기준, 승인 시 결정), THREADS_TOKEN_ISSUED_AT, THREADS_TOKEN_EXPIRES_AT(ISO 8601).
선택 Secret: OPENAI_API_KEY. AI 사용에는 별도 비용 승인 후 Worker ALLOW_PAID_AI, USE_AI와 DB use_ai가 모두 true여야 한다. ALLOW_PAID_AI가 없거나 false면 API 키가 있어도 호출하지 않는다. 기본은 둘 다 false. OPENAI_MODEL 기본 gpt-4.1-mini.

THREADS_START_AT을 임의로 과거로 되돌리지 않는다. 재배포 시 config의 AUTOPOST_ENABLED=false가 복원될 수 있으므로 배포 설정 변경은 반드시 검토한다. 기존 사이트 Worker `hongbo`에 이 Cron이나 Threads 토큰을 추가하지 않는다.

## 장기 토큰 수명

만료 정보가 없거나 만료되면 발행을 차단한다. 7일 이내 만료는 token_health=expiring 로그. `src/token.mjs`의 refreshLongLivedToken은 만료 전/발급 24시간 이후에만 갱신 요청하고 양쪽 계정을 검증한다. 토큰은 반환/로그하지 않고 호출자가 제공한 안전한 Secret 저장 어댑터로만 전달한다.

**자동 Secret 교체 어댑터와 무인 갱신 스케줄은 연결하지 않았다.** 운영자의 Secret 버전 관리 경로를 결정하고 해당 어댑터 및 만료 알림을 연결해야 한다. 갱신 실패 시 기존 저장값을 덮어쓰지 않는다. 이미 만료된 토큰은 새 OAuth 승인이 필요하다. 만료 로그는 알림 발송 기능이 아니다.

## 최종 승인 뒤 운영 순서

1. 스테이징 SQL/관리자·작성자 권한 검증 → 운영 SQL 적용 승인.
2. PC 토큰 발급, Secret 등록, 읽기 전용 preflight.
3. 사이트의 동의/관리자 화면과 별도 Worker를 OFF 상태로 배포하는 것에 대한 승인.
4. 작성자가 동의한 새 글 하나 검토, 실제 API 컨테이너/문자 수/상태/링크 확인. 공개 테스트 발행은 별도 승인 후 한도 1로 통제한다.
5. 성공한 원문/Threads URL 및 중복 방지, 철회·OFF 동작 확인. 최종 승인 후에만 한도 6과 자동 ON.

동의 철회/숨김은 게시 직전 DB 검사에서 반영한다. DB와 외부 SNS는 하나의 트랜잭션이 아니므로 발행 요청이 이미 시작된 경우 중단·삭제를 보장할 수 없다. 이미 공유된 SNS 글의 삭제는 운영자 처리다. review의 publish_started_at이 있으면 이력을 지우거나 재전송하지 말고 공식 계정과 container/thread ID를 대조한다.

## 공식 API 확인 근거 (2026-11-07)

Meta 공식 Postman 컬렉션에서 TEXT/media_type, auto_publish_text의 의미, creation_id 게시, 토큰 교환/갱신 경로를 확인했다:
- https://www.postman.com/meta/threads/documentation/dht3nzz/threads-api
- https://www.postman.com/meta/threads/request/34203612-c940a17f-e719-4b5b-9d28-7390bc658fb7
- https://www.postman.com/meta/threads/request/34203612-7a45f35b-0646-4d4e-ace7-5b32ad56f327

Meta 개발 문서 본문은 이번 환경에서 HTTP 429로 차단됐다. 실제 연결 전에 다음 문서에서 현재 문자 계산/컨테이너 상태/토큰 갱신 조건을 다시 확인하고 실토큰으로 검증해야 한다:
- https://developers.facebook.com/docs/threads/posts/
- https://developers.facebook.com/docs/threads/get-started/long-lived-tokens/

## 기존 실패 분석

초안 index.mjs에 실제 줄바꿈 대신 문자 `\\n`이 들어가 node --check 단계에서 SyntaxError를 재현했다. 수정 후 Worker 검사를 통과했다. 기존 Validate survey feature 실행은 GitHub가 단계 정보를 제공하지 않고 로그 다운로드가 404 BlobNotFound를 반환하여 과거 실패의 정확한 원인은 확정하지 못했다. 새 커밋의 CI 결과로 별도 확인한다.

### 최신 GitHub CI 차단 원인 확인

2026-11-07 커밋 e405ed7의 두 실행 화면에서 다음 안내를 직접 확인했다: “The job was not started because your account is locked due to a billing issue.”
코드 단계가 실행되기 전 GitHub 계정 결제 잠금으로 차단된 것이다. 계정 소유자가 결제/잠금을 해결한 뒤 CI를 다시 실행해야 한다. 결제 설정은 변경하지 않았다.

- Threads: https://github.com/gyroscopemooa/HONGBO/actions/runs/42323243080
- 사이트: https://github.com/gyroscopemooa/HONGBO/actions/runs/42323243079

최종 로컬 검증: 테스트 23개, typecheck, lint, Next.js production build, Worker dry-run 모두 통과. 운영 DB 적용과 실제 Threads API 발행 검증은 미실시.

## 비용 최소화 운영 (2026-11-07)

- 사용자 요청에 따라 유료 AI 호출을 서버 ALLOW_PAID_AI=false로 차단했다. 원문 기반 템플릿과 순환 멘트를 사용한다.
- 기존 10분 Cron 유지: 하루 144회, 30일 4,320회. 별도 웹훅/유료 큐를 추가하지 않는다. OFF일 때 외부 호출 없이 종료한다.
- 정상 토큰 상태 로그와 자동 invocation 로그를 제거하고 trace sampling을 1%로 낮췄다. 오류/발행 로그와 DB 중복 방지 이력은 유지한다.
- 무료 한도 내 운영을 목표로 하며 계정 전체 요금제/합산 사용량 때문에 전체 청구액 0원을 보장하지 않는다. 유료 플랜 전환이나 결제는 하지 않았다.
- 기록은 게시글 수에 따라 증가한다. 중복 방지 이력은 자동 삭제하지 않는다. DB 전체 용량과 계정 사용량 점검은 필요하다.
- 검증: 테스트 24개 통과, Wrangler dry-run 통과. OFF 배포 버전 924c35b4-4160-4057-8205-d1eec74ae078.

## 수동 게시 및 문구 개선 (2026-11-07)

- 사용자 승인으로 기본 홍보글 41번을 공식 Threads GUI에서 수동 게시했다: https://www.threads.com/@iamthehongbo/post/DfbFJcPnwob
- 게시 전 전용 작업 이력을 review로 예약하고, 성공 확인 후 published 및 공개 링크를 기록했다. 원문은 변경하지 않았으며 자동 재게시 대상에서 제외된다.
- 이는 브라우저 수동 게시이며 Worker/Threads API 게시 경로의 실연동 테스트를 대신하지 않는다. 정기 발행 OFF 및 사이트 관리자 UI 운영 배포 보류는 유지한다.
- 앞멘트 12개(일반 8개/신규 4개), 뒷멘트 16개. 템플릿의 이모지를 제거했다. 대부분 원문 제목부터 시작하고 5개 중 1개에 앞멘트를 붙인다.
- 신규 표현은 원래 published_at이 실행 기준 24시간 이내일 때만 사용한다. 조회 실패/시각 누락/과거 글은 일반 표현을 사용한다. bumped_at/updated_at은 사용하지 않는다.
- 테스트 25개 및 배포 dry-run 통과. 실제 41번은 승인받은 맞춤 문구를 사용했다.

## 더홍보 자체 홍보 수동 게시 (2026-11-07)

- 사용자 요청으로 공식 계정 GUI에서 게시: https://www.threads.com/@iamthehongbo/post/DfbFu4wH1Nr
- 게시글 주제는 프로필에 없던 `무료홍보`, 본문에는 `#더홍보`. 마지막 문장은 “여러분은 만드는 일과 알리는 일 중 뭐가 더 어렵나요?”
- `src/self-promo.mjs`에 수동 작성용 앞멘트 6개, 질문형 마무리 12개와 관련 주제 후보 3개를 보관했다. 12개 초안의 길이와 질문 마무리 검증 통과.
- 이 파일은 예약 Worker에서 사용하지 않는다. 자체 홍보 자동 발행이나 자동 주제 태그 연동이 완료됐다는 의미는 아니다. 정기 발행 OFF 유지.

## 운영 활성화 (2026-11-07, 사용자 정기 ON 승인)

- 최신 origin/main의 좋아요 기능을 기존 PR 브랜치에 병합한 뒤 사이트 관리자 `/admin/threads`와 작성자 `/post/[id]/threads` 동의 화면을 운영 배포했다. 사이트 버전: 2f131ccd-acb8-48d8-9f98-52beee86738d.
- 실제 Worker 인증 점검에서 redirect:error 런타임 실패를 발견했다. redirect:manual + 비-2xx 차단으로 수정하여 토큰이 리디렉션 대상으로 전송되지 않게 유지했다. 앞뒤 공백은 제거하고 내부 공백/비ASCII 토큰은 차단한다.
- 운영 Worker AUTOPOST_ENABLED=true 및 DB enabled=true, use_ai=false, daily_limit=6을 인증된 읽기 전용 API로 확인했다. @iamthehongbo, tokenHealth=healthy 확인. 임시 PREFLIGHT_KEY는 확인 후 삭제하여 진단 경로를 닫는다.
- THREADS_START_AT=2026-11-07T02:32:14.000Z (한국 11:32:14). 이후 등록된 기본 posts 중 작성자 동의와 관리자 원문 검토를 마친 글만 10분 간격으로 발행한다. 과거 글/커뮤니티/리뷰는 대상이 아니다.
- 설정 파일의 기본 AUTOPOST_ENABLED=false는 유지한다. 승인된 ON 재배포 명령은 `wrangler deploy --config automation/threads/wrangler.jsonc --var AUTOPOST_ENABLED:true`이다. 일반 deploy는 OFF로 돌아가므로 활성화 상태를 반드시 읽어 확인한다.
- 초기 ON 배포 버전 9e3e93a9-c6e3-4de7-beff-0d71fb0bef3a (후속 임시 Secret 추가/삭제로 버전이 갱신될 수 있음).
- 검증: 테스트 28개, typecheck, lint, Next/OpenNext build, 운영 배포 사전 검증 통과. 실제 API 계정 인증 및 DB 연결 성공. 실제 컨테이너/게시 API의 성공 발행은 아직 미확인이다. 기존 두 게시물은 GUI 수동 게시였다. 첫 적격 글의 발행 결과는 별도 확인이 필요하다.

## 글쓰기 선택 동의 + 자동 검사 (2026-11-07)

- 사용자 승인에 따라 새 기본 홍보글 작성 폼에 기본 해제된 Threads 선택 동의를 추가했다. 체크 여부는 임시저장 초안에 보관하지 않는다. 기존 글/기존 동의는 소급 전환하지 않는다.
- 서버가 작성자 인증 후 기존 consent RPC로 소유권을 다시 검사하고 `threads-v2-auto` 동의를 저장한다. 원문 및 부가정보 검사 통과 시 현재 source_hash를 자동 승인한다. 이미지/연락처/주소 및 개인정보·민감정보 패턴은 검토 대기한다.
- 자동 승인 UPDATE는 동의 시각/작성자/버전/제외 여부를 비교하여 동시 철회·운영자 제외를 덮어쓰지 않는다. 자동 승인은 approved_by=null로 관리자 승인과 구별한다. 기존 claim/prepare의 원문 해시 비교와 불확실 발행 잠금은 유지한다.
- v2 동의가 있는 원문 수정은 재검사한다. 불일치하는 기존 해시는 발행되지 않는다. 글 생성 후 동의 저장 오류는 원문 등록을 되돌리지 않고 사용자에게 재확인 안내를 표시한다.
- `/policy#threads`, 작성 폼, 개별 동의 화면, 관리자 상태 설명을 일치시켰다. 자동 검사의 한계, 선택 동의, 외부 공개, 미리보기, 철회 및 기발행 삭제 요청 절차를 고지한다.
- SQL 마이그레이션/기존 posts 데이터 변경 없음. 정기 발행 ON, 10분/일6개/유료 AI OFF 유지. 테스트 30개, typecheck/lint 통과.

## Threads 문구 운영 기준 (2026-11-08)

- 수동 게시와 자동글 모두 안내형 시작 → 광고 대상 중심 설명 → 대상 서비스 직접 링크 → 관련 해시태그 → 이용자 질문으로 마무리한다.
- 시작 멘트는 매번 포함한다. 기존 안내/홍보 담당자 말투를 순환하며 최신 표현은 최초 등록 24시간 이내만 사용한다.
- 운동앱은 운동일지·운동기록·루틴관리 질문, 번역 앱은 자막·언어 질문 등 제목/요약에 맞는 질문을 선택한다. 질문은 해시태그 뒤 마지막 문장으로 배치한다.
- “홍보 어떻게 하시나요?”는 더홍보 자체 홍보용이다. 타 서비스 홍보를 더홍보 자체 홍보처럼 쓰지 않는다.
- 등록된 HTTPS external_url을 우선 사용하며 잘못된 URL, 자격증명 포함 URL, 120자 가중 길이 초과 URL은 원문 링크로 대체한다. 외부 주소 변경도 기존 source_hash 발행 전 검사 대상이다.
- 자동글 질문 33종(운동 6종 포함), 기존 시작 34종 유지. 유료 AI 호출 없이 원문 기반으로 선택한다.
- 테스트 37개 및 Worker dry-run 통과. 운영 배포 버전: 114e0807-aa0e-4c53-ac19-0d4ae0c07701. 기존 AUTOPOST_ENABLED=true / USE_AI=false / ALLOW_PAID_AI=false / 10분 Cron 유지.
- 헬띠루틴 수동 게시: https://www.threads.com/@iamthehongbo/post/DfeJlqqH1p0 . 앞선 DfeJJkZH0z8은 사용자가 삭제했다. 현재 글은 수정 메뉴가 없어 새 시작/질문 문구를 소급 적용하지 못했다. 별도 삭제·재게시하지 않는다.

## 첫머리 더홍보 안내 문구 보완 (2026-11-09)

- 일반 시작 문구 16개와 최신 글 시작 문구 12개를 더홍보 안내형으로 다듬었다. 모든 시작 문구에 더홍보를 표시한다.
- “더홍보가 새로운 홍보글을 가져왔습니다~”, “더홍보에 올라온 최신 홍보글이에요~” 등을 반영했다. 최신 표현은 기존대로 최초 등록 24시간 이내에만 사용한다.
- 기존 게시물은 수정하거나 재게시하지 않았다. 이후 발행분에 적용된다.
- 기존 테스트 37개 및 Worker dry-run 통과. 운영 버전 b8c44488-e36d-4491-9e63-e68d5644c9c6 배포 후 AUTOPOST_ENABLED=true / USE_AI=false / ALLOW_PAID_AI=false를 다시 확인했다. 10분 Cron 유지. 새 문구의 실제 공개 게시 결과는 아직 확인하지 않았다.

### 관리자 미리보기 반영 (2026-11-09)

- 관리자 미리보기에도 published_at/external_url을 전달해 실제 게시 템플릿과 같은 최신 글 판단 및 목적지 선택을 사용한다. 기존 승인 상태와 과거 처리 내역은 변경하지 않는다.
- 사이트 Worker hongbo에도 새 문구를 배포했다: f665625c-fc2d-4bcf-b7c6-b51abab79665. typecheck, 변경 페이지 ESLint, Next/OpenNext 빌드 통과. 전체 lint는 기존 tmp 및 하위 .wrangler의 임시 파일 오류로 실패했다.

## 등록된 더홍보 글로 연결 (2026-11-12)

- 최신 사용자 요청에 따라 자동 홍보 링크는 고객 external_url 대신 항상 `https://www.thehongbo.com/post/{post_id}`를 사용한다. 위 2026-11-08의 외부 링크 우선 기준을 대체한다. 예: 등록 글 78번은 `/post/78`로 연결한다.
- Worker의 원문 추가 조회는 최신 문구 판단용 published_at만 읽는다. 관리자 미리보기는 같은 formatter를 사용한다. 기존 글의 external_url 데이터, 승인/동의/중복 방지 상태와 이미 공개된 Threads 게시물은 변경하지 않는다.
- 검증: 전체 Threads 테스트 38개, typecheck, 변경 JS 파일 ESLint, Next production build, Worker dry-run 통과. 모든 게시 요청 테스트는 네트워크 mock으로만 수행했다.
- 사이트 `hongbo`는 GitHub main push에 연결된 Cloudflare Workers Builds로 자동 배포된다. 별도 자동발행 Worker `hongbo-threads-promo`의 Git 연결은 확인되지 않았다. 사이트 빌드 성공을 자동발행 Worker 반영 완료로 간주하지 않는다. 별도 Worker 배포 시 현재 vars/cron을 먼저 확인하고 보존해야 한다.
