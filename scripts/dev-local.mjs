// 로컬 미리보기용: .env.local 의 Supabase(운영) 설정을 무시하고 파일 저장소(.data/db.json)로 실행합니다.
// 운영 데이터를 건드리지 않고 화면을 확인할 때 사용하세요:  node scripts/dev-local.mjs
import { spawn } from "node:child_process";

const env = {
  ...process.env,
  NEXT_PUBLIC_SUPABASE_URL: "",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
  SUPABASE_SERVICE_ROLE_KEY: "",
};
const port = process.env.PORT || "3100";
const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--port", port], { stdio: "inherit", env });
child.on("exit", (code) => process.exit(code ?? 0));
