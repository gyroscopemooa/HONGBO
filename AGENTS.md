<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## 더홍보 커뮤니티 글 작성 요청

사용자가 “지금 업데이트”, “지금 커뮤 글 작성해줘”, “커뮤니티 글 써줘”처럼 요청하면 다음 기준으로 작성부터 실제 공개 게시, 관련 기존 글 보완, 필요한 커밋·Git push·운영 배포, 운영 확인까지 완료한다. 여기서 ‘수동’은 사용자의 명령으로 작업을 시작한다는 뜻이며 사용자가 직접 업로드해야 한다는 뜻이 아니다. 이미 승인된 게시 허락을 반복 요청하지 않는다. 유료 글쓰기 API와 사용자의 명령 없이 실행되는 예약·무인 자동화는 아직 연결하지 않는다. 사용자가 초안만 요청하면 공개하지 않는다.

- 먼저 현재 게시·초안 상태를 확인하여 동일 요청을 중복 발행하지 않는다. 기존 관리자 화면 또는 이미 승인된 서버 전용 관리 경로로 저장하고 공개 URL을 확인한다. 비밀 키를 소스·로그·원고에 남기지 않는다.
- 관련 변경만 선별 커밋·push한다. 관련 없는 작업은 보존하며 강제 push하지 않는다. DB 콘텐츠 변경은 운영 페이지에 즉시 반영되는지 확인하고, 실행 코드나 정적 콘텐츠 변경으로 필요한 경우에만 추가 배포한다. 실제 인증·권한 장애가 있으면 구체적으로 보고한다.

- 실제 사용자 문의, 반복 질문, 제공받은 검색 실적 CSV를 근거로 질문 하나를 정한다. 데이터가 없으면 주제를 제안하되 검색 수요가 검증됐다고 주장하지 않는다. 검색량·순위·인기도·사용 후기를 꾸미지 않는다.
- 현재 커뮤니티 글을 확인할 수 있으면 같은 질문의 글부터 찾는다. 겹치면 기존 글 개선안을 먼저 작성한다. 확인할 수 없으면 중복 여부를 확인 필요 항목에 남긴다.
- 결과는 관리자 폼에 맞게 제목, 주제(promotion/content/website/service), 해결할 질문 하나, 첫 문단의 답, 준비 조건과 실행 순서, 안 되는 경우와 대안, 관련 안내, 선택적 서비스 연결, 추가 확인 사항을 포함한다.
- 본문은 링크 없이도 핵심 해결 방법을 알 수 있는 일반 텍스트로 작성한다. 확인한 기능만 설명하며 과도한 키워드 반복이나 분량 채우기를 하지 않는다.
- 관련 링크는 실제 존재와 관련성을 확인하고 `목적을 설명하는 문구 | URL` 형식으로 제공한다. 서비스 연결은 문구와 주소를 별도로 준다. 기존 글 URL을 임의로 바꾸지 않는다.
- 관련 있는 기존 글과 새 글을 양방향으로 연결하고 기존 글의 보완 위치를 결과에 기록한다. 새 글의 실제 주소를 확인한 뒤 링크를 넣으며 기존 URL을 유지한다. 관련 없는 글을 억지로 연결하지 않는다. 같은 주제의 최근 글 영역은 공개 글에 자동 표시되지만 기존 본문과 수동 관련 안내는 필요한 부분을 직접 보완한다.
- 외부 커뮤니티용 요청이면 해당 게시판 규칙과 질문에 맞춰 작성하고 더홍보 운영자 관계를 밝힌다. 동일 홍보 문구를 여러 곳에 복제하거나 외부 링크만으로 검색 순위 상승을 보장하지 않는다.
- 발행 후 확인할 항목은 질문 해결 반응, 링크 클릭, 실제 이용이다. 현재 구현되지 않은 자동 측정·검색 실적 연동 기능을 있다고 설명하지 않는다.

구현: 공개 목록 `/community`, 상세 `/community/[id]`, 운영자 수동 작성 `/admin/community/new`. 글쓰기와 공개 변경은 관리자만 가능하며 일반 회원 글쓰기·댓글과 자동 생성 API는 현재 범위에 포함하지 않는다.
