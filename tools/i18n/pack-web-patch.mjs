// 한글 패치(웹 버전)만 묶는다: 원본 v0.1.1 위에 덮어쓰는 파일 + git patch + 안내문.
// 게임 소재(public/assets 등)와 Electron 부분은 넣지 않는다.
import { cpSync, mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const BASE = 'v0.1.1';
const version = JSON.parse(readFileSync('package.json', 'utf8')).version;
const name = `StrongholdProtocol-KR-web-patch-${version}`;
const out = join('dist', name);

// 플레이에 필요한 파일 + 사전 재생성 도구(GPL 소스)
const FILES = [
  'public/js/i18n',
  'public/i18n',
  'public/js/main.js',
  'public/js/ui/richText.js',
  'public/js/ui/settings.js',
  'public/js/screens/lobby.js',
  'tools/i18n',
];
// 수정한 원본 파일 (git apply용 patch에 넣는다)
const PATCHED = ['public/js/main.js', 'public/js/screens/lobby.js', 'public/js/ui/richText.js', 'public/js/ui/settings.js', 'public/js/i18n', 'public/i18n', 'tools/i18n'];

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
for (const f of FILES) cpSync(f, join(out, 'files', f), { recursive: true });
for (const f of ['LICENSE', 'NOTICE.md']) cpSync(f, join(out, f));

// 작업 트리 기준 diff (추가 파일 포함: 임시 index 사용)
const env = { ...process.env, GIT_INDEX_FILE: join(out, '.tmp-index') };
execFileSync('git', ['read-tree', BASE], { env });
execFileSync('git', ['add', '--', ...PATCHED], { env });
const patch = execFileSync('git', ['diff', '--cached', '--binary', BASE, '--', ...PATCHED], { env, maxBuffer: 1 << 28 });
rmSync(env.GIT_INDEX_FILE);
writeFileSync(join(out, 'ko-patch.diff'), patch);

writeFileSync(join(out, 'INSTALL-KO.txt'), '\uFEFF' + `위수 협의: 맹약 — 한글 패치 (웹 버전) ${version}
================================================

sganggs/Stronghold-Protocol ${BASE}용 한국어 표시 패치입니다. 게임 파일은 들어 있지 않습니다.
비공식·비상업 팬 작품이며 어떤 형태의 수익화도 금지입니다 (NOTICE.md).
코드는 GPL-3.0-or-later (LICENSE)입니다.
번역 사전 중 공식 한국 서버 텍스트로 만든 부분의 권리는 Hypergryph / Yostar에 있습니다.

[방법 A] 원본 완전판(Release) 사용
  1. https://github.com/sganggs/Stronghold-Protocol/releases 에서 ${BASE} 완전판을 받아 풉니다.
  2. 이 압축 파일의 files 폴더 안 내용(public, tools)을 원본 폴더에 덮어씁니다.
  3. 원본 안내대로 실행합니다 (Windows: scripts\\start-windows.bat).
  4. 브라우저에서 http://localhost:3000 을 엽니다. 처음부터 한국어로 나옵니다.
     중국어로 바꾸려면 로비 오른쪽 위 [中文] 버튼, 또는 게임 화면 왼쪽 아래 톱니바퀴 → [언어]

[방법 B] git 소스 사용
  git clone https://github.com/sganggs/Stronghold-Protocol.git
  cd Stronghold-Protocol
  git apply --3way <이 폴더>/ko-patch.diff
  npm install && npm run setup && npm start

원본이 ${BASE}보다 새 버전이면 방법 B를 쓰세요. 덮어쓰기(A)는 수정된 원본 파일
(main.js, richText.js, settings.js, lobby.js)의 새 변경을 지울 수 있습니다.

언어 설정은 브라우저마다 따로 저장됩니다. 같은 서버에 접속한 친구도 처음에는 한국어로 보고,
각자 바꿀 수 있습니다.
번역은 서버를 연 쪽에 패치가 있으면 모두에게 적용됩니다.
`);

const zip = join('dist', `${name}.zip`);
rmSync(zip, { force: true });
// Windows 기본 tar(bsdtar)는 -a로 zip을 만든다
const tar = process.platform === 'win32' ? 'C:\\Windows\\System32\\tar.exe' : 'bsdtar';
execFileSync(tar, ['-a', '-c', '-f', `${name}.zip`, name], { cwd: 'dist' });
console.log(`wrote ${zip}`);
