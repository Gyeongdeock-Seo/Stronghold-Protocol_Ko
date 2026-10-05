#!/usr/bin/env node
// tools/setup.mjs — 한 번의 명령어로 새로운 클론 환경을 준비합니다 (docs/DEPLOY.md).
//
//   node tools/setup.mjs [옵션]
//
// 단계 (각 단계는 이미 완료된 경우 건너뛰므로 재실행 비용이 적습니다 — 시작 스크립트가 매 실행 시 호출함):
//   1. Node.js ≥ 22 버전 확인 (미충족 시 명확한 메시지 + 다운로드 링크 제공).
//   2. 의존성 패키지: node_modules가 없거나 불완전할 때 `npm ci` 실행 (`npm install`로 대체 가능).
//   3. public/vendor 내 클라이언트 라이브러리 (tools/vendor.mjs) 누락 시 복사.
//   4. 게임 데이터 (data/*.json, 커밋됨) 존재 및 파싱 가능 여부 확인.
//   5. 리소스/오디오 (tools/fetch-assets.mjs, public/assets에 약 270MB, 이어받기 지원, 미러 대체) 
//      public/assets가 없거나 data/assets.json에 명시된 파일이 디스크에 없을 때 다운로드. 
//      실패 시 경고만 표시되며 게임은 대체 리소스로 실행되고 다음 실행 시 이어받습니다.
//   6. 선택 사항: 로컬에 설치된 명일방주 클라이언트(Windows 기본 설치, macOS의 CrossOver
//      또는 PlayCover, 또는 --game <디렉터리>)에서 tools/local-extract/extract.py를 사용해
//      프로젝트 로컬 Python 가상환경(.venv-extract)에 공식 보드/UI 리소스 추출 후
//      보드 타일 자르기 수행 (tools/crop-board-atlas.mjs → tiles.json). 터미널에서 한 번 물어봄
//      (응답은 .cache/setup-state.json에 저장되며, 터미널이 없으면 건너뜀). 치명적 에러 없음.
//
// 옵션:
//   --check          상태만 보고하고 변경하지 않음 (필수 요소가 누락되면 종료 코드 1)
//   --no-assets      리소스/오디오 다운로드 건너뛰기
//   --no-local       로컬 클라이언트 감지 및 추출 건너뛰기
//   --local          묻지 않고 로컬 클라이언트에서 추출 (이미 완료된 경우 재추출)
//   --game <디렉터리> 로컬 클라이언트의 AssetBundle 루트 (…/StreamingAssets/AB/Windows 또는 PlayCover …/Documents/Bundles)
//   -y, --yes        모든 질문에 "yes"로 응답
//   --quiet          출력 줄 수 줄이기 (scripts/launch.mjs에서 사용)
//   -h, --help
//
// 종료 코드: 0 = `npm start` 실행 준비 완료 (선택 항목은 건너뛰었을 수 있음), 1 = 필수 요소 누락.
// 헬퍼 함수는 tools/doctor.mjs 및 scripts/launch.mjs에 내보내지며, main()은 직접 실행될 때만 작동합니다.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const MIN_NODE = 22;
export const IS_WIN = process.platform === 'win32';
export const IS_MAC = process.platform === 'darwin';
const NODE_URL = 'https://nodejs.org/ko/download';

/** 서버가 필요로 하는 데이터 파일 (server/data.js DATA_FILES) + 클라이언트가 사용하는 이모티콘 카탈로그 */
export const DATA_FILES = ['config', 'chess', 'bonds', 'garrisons', 'items', 'bands', 'effects', 'choices',
  'enemies', 'factions', 'waves', 'stages', 'bosses', 'tokens', 'assets', 'emotes'];
/** 반드시 설치되어야 하는 런타임 패키지 (package.json dependencies) */
export const RUNTIME_PACKAGES = ['ws', 'pixi.js', 'pixi-spine', 'preact', 'htm'];
/** 클라이언트가 구동되기 위해 필수적인 벤더 파일 (tools/vendor.mjs; three.js는 선택 사항) */
export const VENDOR_REQUIRED = ['pixi.min.js', 'pixi-spine.js', 'preact.module.js', 'hooks.module.js', 'htm.module.js'];
export const VENDOR_OPTIONAL = ['three.core.js', 'three.module.js'];

const STATE_FILE = path.join(ROOT, '.cache', 'setup-state.json');
export const VENV_DIR = path.join(ROOT, '.venv-extract');
const EXTRACT_PY = path.join(ROOT, 'tools', 'local-extract', 'extract.py');
const EXTRACT_REQ = path.join(ROOT, 'tools', 'local-extract', 'requirements.txt');
const LOCAL_MANIFEST = path.join(ROOT, 'data', 'local-assets.json');
const LOCAL_BOARD_ATLAS = path.join(ROOT, 'public', 'assets', 'local', 'map', 'autochess', 'TX_autochessi_D.png');
const LOCAL_BOARD_TILES = path.join(ROOT, 'public', 'assets', 'local', 'map', 'autochess', 'tiles.json');

// ---------------------------------------------------------------------------------------------------
// 헬퍼 함수
// ---------------------------------------------------------------------------------------------------

const color = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (code) => (s) => (color ? `\x1b[${code}m${s}\x1b[0m` : String(s));
export const c = { ok: paint('32'), warn: paint('33'), err: paint('31'), dim: paint('2'), bold: paint('1'), cyan: paint('36') };
export const mark = { ok: c.ok('✔'), warn: c.warn('!'), err: c.err('✘'), skip: c.dim('–') };

export const nodeMajor = () => Number(process.versions.node.split('.')[0]);
const exists = (p) => { try { fs.accessSync(p); return true; } catch { return false; } };
const readJson = (p) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; } };
const mb = (n) => `${(n / 1048576).toFixed(0)} MB`;
/** 터미널 표시 너비 (CJK / 전각 문자는 2칸 차지) */
export const displayWidth = (s) => [...String(s)].reduce((n, ch) => n + (ch.codePointAt(0) >= 0x2e80 ? 2 : 1), 0);
export const padDisplay = (s, w) => s + ' '.repeat(Math.max(0, w - displayWidth(s)));

/** 표준 입출력을 상속받아 명령어를 실행합니다. Windows의 `.cmd` 심(npm)은 쉘이 필요합니다. */
function run(cmd, args, { cwd = ROOT, env, shell = false } = {}) {
  const r = spawnSync(cmd, args, { cwd, stdio: 'inherit', env: { ...process.env, ...env }, shell });
  if (r.error) return { ok: false, code: -1, error: r.error };
  return { ok: r.status === 0, code: r.status };
}

/** 명령어를 실행하고 출력을 캡처합니다 (예외를 발생시키지 않음). */
export function capture(cmd, args, { timeout = 15000, shell = false, env } = {}) {
  try {
    const r = spawnSync(cmd, args, { encoding: 'utf8', timeout, shell, windowsHide: true, env: env ? { ...process.env, ...env } : process.env });
    return { ok: !r.error && r.status === 0, status: r.status, out: `${r.stdout || ''}${r.stderr || ''}`.trim() };
  } catch (e) {
    return { ok: false, status: -1, out: String(e?.message || e) };
  }
}

function npmCommand() {
  const execPath = process.env.npm_execpath; // `npm run …`을 통해 시작되었을 때 설정됨
  if (execPath && /npm-cli\.js$/i.test(execPath) && exists(execPath)) return { cmd: process.execPath, pre: [execPath], shell: false };
  return { cmd: IS_WIN ? 'npm.cmd' : 'npm', pre: [], shell: IS_WIN };
}

function loadState() { return readJson(STATE_FILE) || {}; }
function saveState(patch) {
  try {
    fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify({ ...loadState(), ...patch }, null, 1) + '\n');
  } catch { /* 최선 처리 */ }
}

/** TTY 환경에서 예/아니오 질문을 합니다 (Enter / 타임아웃 시 기본값 `def`). 비 TTY → null 반환. */
async function ask(question, def, timeoutMs = 60000) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) return null;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const hint = def ? '[Y/n]' : '[y/N]';
  try {
    return await new Promise((resolve) => {
      const t = setTimeout(() => { process.stdout.write(c.dim(`\n  (${timeoutMs / 1000}초 동안 입력이 없어 기본값으로 진행합니다)\n`)); resolve(def); }, timeoutMs);
      rl.question(`  ${question} ${hint} `, (a) => {
        clearTimeout(t);
        const s = String(a || '').trim().toLowerCase();
        resolve(s === '' ? def : /^(y|yes|예|네|좋음|1)$/.test(s));
      });
    });
  } finally {
    rl.close();
  }
}

// ---------------------------------------------------------------------------------------------------
// 검사 항목 (tools/doctor.mjs용으로 내보냄)
// ---------------------------------------------------------------------------------------------------

/** Node.js 버전 검사 */
export function checkNode() {
  const major = nodeMajor();
  return { ok: major >= MIN_NODE, version: process.versions.node, major, recommended: major >= MIN_NODE };
}

/** 런타임 의존성 패키지 설치 여부 검사 */
export function checkDeps() {
  const missing = RUNTIME_PACKAGES.filter((p) => !exists(path.join(ROOT, 'node_modules', ...p.split('/'), 'package.json')));
  return { ok: missing.length === 0, missing, hasNodeModules: exists(path.join(ROOT, 'node_modules')) };
}

/** public/vendor 파일 존재 여부 검사 */
export function checkVendor() {
  const dir = path.join(ROOT, 'public', 'vendor');
  const missing = VENDOR_REQUIRED.filter((f) => !exists(path.join(dir, f)));
  const optionalMissing = VENDOR_OPTIONAL.filter((f) => !exists(path.join(dir, f)));
  return { ok: missing.length === 0, missing, optionalMissing };
}

/** data/*.json 파일 존재 및 파싱 가능 여부 검사 */
export function checkData() {
  const missing = [];
  const broken = [];
  for (const name of DATA_FILES) {
    const p = path.join(ROOT, 'data', `${name}.json`);
    if (!exists(p)) { missing.push(name); continue; }
    if (readJson(p) == null) broken.push(name);
  }
  return { ok: !missing.length && !broken.length, missing, broken };
}

/** 매니페스트의 모든 '/assets/…' 또는 '/fonts/…' URL 수집 */
function manifestUrls(node, out = []) {
  if (typeof node === 'string') { if (/^\/(assets|fonts)\//.test(node)) out.push(node); }
  else if (Array.isArray(node)) for (const x of node) manifestUrls(x, out);
  else if (node && typeof node === 'object') for (const x of Object.values(node)) manifestUrls(x, out);
  return out;
}

/**
 * 다운로드된 리소스/오디오 완성도 검사. data/assets.json과 public/ 폴더를 비교합니다.
 * @returns {{ ok: boolean, present: boolean, manifest: boolean, total: number, missing: number, sample: string[], bytes: number }}
 */
export function checkAssets() {
  const pub = path.join(ROOT, 'public');
  const present = exists(path.join(pub, 'assets'));
  const m = readJson(path.join(ROOT, 'data', 'assets.json'));
  if (!m) return { ok: false, present, manifest: false, total: 0, missing: 0, sample: [], bytes: 0 };
  const urls = [...new Set(manifestUrls(m))];
  const missing = [];
  for (const u of urls) {
    let st = null;
    try { st = fs.statSync(path.join(pub, ...u.split('/').filter(Boolean).map(decodeURIComponent))); } catch { /* 누락됨 */ }
    if (!st || !st.size) missing.push(u);
  }
  return { ok: present && missing.length === 0 && urls.length > 0, present, manifest: true, total: urls.length, missing: missing.length, sample: missing.slice(0, 5), bytes: Number(m.stats?.bytes) || 0 };
}

/** 로컬 클라이언트 리소스가 없을 때 게임이 대신 렌더링하는 대체 스타일 설명 */
export const LOCAL_ART_FALLBACK = '3D 보드 대신 2D를 사용하며, 일부 공식 UI 아이콘 및 원석충 모델은 대체 스타일로 표시됩니다';
/** 클라이언트가 없는 머신에서 로컬 리소스를 가져오는 방법 안내 */
export const LOCAL_ART_COPY_HINT = '클라이언트가 없는 서버는 동일 버전의 통합팩에서 public/assets/local 및 data/local-assets.json을 복사할 수 있습니다';

/**
 * 로컬 클라이언트 리소스 (선택 사항) 상태 검사
 */
export function checkLocal() {
  const m = readJson(LOCAL_MANIFEST);
  const count = m && m.groups ? Object.values(m.groups).reduce((n, g) => n + Object.keys(g || {}).length, 0) : 0;
  const enemySpines = !!(m && m.groups && Object.keys(m.groups).some((g) => g.startsWith('spine/enemy/')));
  return { manifest: !!m, count, board3d: exists(LOCAL_BOARD_ATLAS), tiles: exists(LOCAL_BOARD_TILES), enemySpines, dirPresent: exists(path.join(ROOT, 'public', 'assets', 'local')) };
}

/** 추출된 아틀라스에서 보드 타일을 잘라냅니다. */
function cropBoardTiles(log) {
  const r = capture(process.execPath, [path.join(ROOT, 'tools', 'crop-board-atlas.mjs')], { timeout: 120000 });
  if (!r.ok) log(c.warn(`  보드 텍스처 자르기 실패 (node tools/crop-board-atlas.mjs): ${r.out.split(/\r?\n/).slice(-3).join(' ')}`));
  return r.ok && exists(LOCAL_BOARD_TILES);
}

// ---------------------------------------------------------------------------------------------------
// 로컬 명일방주 클라이언트 감지
// ---------------------------------------------------------------------------------------------------

const AB_TAIL = ['Arknights_Data', 'StreamingAssets', 'AB', 'Windows'];

/** 현재 OS 기준 AssetBundle 루트 후보 경로 목록 */
export function clientCandidates() {
  const home = os.homedir();
  const out = [];
  const add = (p, kind) => out.push({ path: p, kind });
  if (IS_WIN) {
    const drives = ['C', 'D', 'E', 'F', 'G', 'H'];
    const bases = [
      ['Program Files', 'Hypergryph Launcher', 'games', 'Arknights'],
      ['Program Files (x86)', 'Hypergryph Launcher', 'games', 'Arknights'],
      ['Hypergryph Launcher', 'games', 'Arknights'],
      ['Games', 'Hypergryph Launcher', 'games', 'Arknights'],
      ['Program Files', 'Hypergryph', 'Arknights'],
      ['Arknights'],
    ];
    for (const d of drives) for (const b of bases) add(path.win32.join(`${d}:\\`, ...b, ...AB_TAIL), 'Windows');
  }
  if (IS_MAC) {
    const bottles = path.join(home, 'Library', 'Application Support', 'CrossOver', 'Bottles');
    let names = [];
    try { names = fs.readdirSync(bottles); } catch { /* CrossOver 없음 */ }
    names.sort((a, b) => (b === 'Arknights') - (a === 'Arknights'));
    for (const n of names) {
      for (const pf of ['Program Files', 'Program Files (x86)']) {
        add(path.join(bottles, n, 'drive_c', pf, 'Hypergryph Launcher', 'games', 'Arknights', ...AB_TAIL), `CrossOver (${n})`);
      }
    }
    add(path.join(home, 'Library', 'Containers', 'com.hypergryph.arknights', 'Data', 'Documents', 'Bundles'), 'PlayCover');
  }
  if (!IS_WIN) {
    for (const prefix of [path.join(home, '.wine'), path.join(home, 'Games', 'arknights')]) {
      add(path.join(prefix, 'drive_c', 'Program Files', 'Hypergryph Launcher', 'games', 'Arknights', ...AB_TAIL), 'Wine');
    }
  }
  return out;
}

/** 디렉터리가 오토체스 번들을 포함하는 AssetBundle 루트인지 확인합니다. */
export function inspectClientRoot(dir) {
  if (!dir || !exists(dir)) return { exists: false, autochess: false };
  const autochess = exists(path.join(dir, 'ui', 'autochess')) || exists(path.join(dir, 'arts', 'maps', 'map_autochess'));
  return { exists: true, autochess };
}

/** 설치된 첫 번째 클라이언트를 찾습니다. */
export function findClient(explicit) {
  const list = explicit ? [{ path: path.resolve(explicit), kind: '--game' }] : clientCandidates();
  let partial = null;
  for (const cand of list) {
    const info = inspectClientRoot(cand.path);
    if (info.exists && info.autochess) return { ...cand, ...info };
    if (info.exists && !partial) partial = { ...cand, ...info };
  }
  return partial;
}

// ---------------------------------------------------------------------------------------------------
// Python (선택 사항)
// ---------------------------------------------------------------------------------------------------

/** 사용 가능한 Python ≥ 3.8 실행 파일 검색 */
export function findPython() {
  const cands = IS_WIN ? [['py', ['-3']], ['python', []], ['python3', []]] : [['python3', []], ['python', []]];
  for (const [cmd, pre] of cands) {
    const r = capture(cmd, [...pre, '--version'], { timeout: 10000 });
    const m = /Python (\d+)\.(\d+)(?:\.(\d+))?/.exec(r.out);
    if (!r.ok || !m) continue;
    const major = Number(m[1]);
    const minor = Number(m[2]);
    if (major === 3 && minor >= 8) return { cmd, args: pre, version: `${m[1]}.${m[2]}${m[3] ? '.' + m[3] : ''}`, minor };
  }
  return null;
}

export function venvPython() {
  return IS_WIN ? path.join(VENV_DIR, 'Scripts', 'python.exe') : path.join(VENV_DIR, 'bin', 'python');
}

const PY_ENV = { PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8', PYTHONDONTWRITEBYTECODE: '1', PIP_DISABLE_PIP_VERSION_CHECK: '1' };

/** .venv-extract 가상환경 생성 및 필요 패키지 설치 */
function ensureVenv(py, log) {
  const vpy = venvPython();
  if (!exists(vpy)) {
    log(`  Python 가상환경 생성 중: ${path.relative(ROOT, VENV_DIR)} …`);
    const r = run(py.cmd, [...py.args, '-m', 'venv', VENV_DIR], { env: PY_ENV });
    if (!r.ok || !exists(vpy)) return { ok: false, why: 'python -m venv 실패 (Debian/Ubuntu 환경에서는 `sudo apt install python3-venv` 필요)' };
  }
  if (capture(vpy, ['-c', 'import UnityPy, lz4, PIL'], { env: PY_ENV }).ok) return { ok: true, python: vpy };
  log('  UnityPy / lz4 / Pillow 설치 중 (최초 실행 시 약 1–3분 소요) …');
  const r = run(vpy, ['-m', 'pip', 'install', '-r', EXTRACT_REQ], { env: PY_ENV });
  if (!r.ok || !capture(vpy, ['-c', 'import UnityPy, lz4, PIL'], { env: PY_ENV }).ok) {
    return { ok: false, why: 'pip 의존성 설치 실패 (최신 Python 버전 사용으로 인한 컴파일 빌드 문제 시, Python 3.12 설치 후 .venv-extract 폴더를 삭제하고 다시 시도하세요)' };
  }
  return { ok: true, python: vpy };
}

// ---------------------------------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------------------------------

function parseArgs(argv) {
  const o = { check: false, assets: true, local: 'ask', game: null, yes: false, quiet: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--check') o.check = true;
    else if (a === '--no-assets') o.assets = false;
    else if (a === '--no-local') o.local = 'no';
    else if (a === '--local') o.local = 'force';
    else if (a === '--game') { o.game = argv[++i] || null; if (o.local !== 'no') o.local = 'force'; }
    else if (a.startsWith('--game=')) { o.game = a.slice(7) || null; if (o.local !== 'no') o.local = 'force'; }
    else if (a === '-y' || a === '--yes') o.yes = true;
    else if (a === '--quiet' || a === '-q') o.quiet = true;
    else if (a === '-h' || a === '--help') o.help = true;
    else throw new Error(`알 수 없는 옵션: ${a} (--help 로 사용법 확인)`);
  }
  return o;
}

function helpText() {
  const src = fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n');
  const start = src.findIndex((l) => l.startsWith('//   node tools/setup.mjs'));
  const end = src.findIndex((l, i) => i > start && l.startsWith('// Exit code'));
  return src.slice(start, end + 1).map((l) => l.replace(/^\/\/ ?/, '')).join('\n');
}

async function main() {
  let opts;
  try { opts = parseArgs(process.argv.slice(2)); } catch (e) { console.error(e.message); return 2; }
  if (opts.help) { console.log(helpText()); return 0; }
  const log = (s = '') => console.log(s);
  const say = (s) => { if (!opts.quiet) log(s); };
  const summary = [];
  const add = (state, label, detail = '') => summary.push({ state, label, detail });
  let fatal = false;

  say(c.bold('\n위수 협약: 맹약 · setup') + c.dim(`  (${ROOT})`));

  // 1. Node
  const node = checkNode();
  if (!node.ok) {
    log(`${mark.err} Node.js ${node.version} 버전이 너무 낮습니다: ${MIN_NODE} 이상이 필요합니다 (22 / 24 LTS 권장).`);
    log(`  다운로드: ${NODE_URL}` + (IS_WIN ? '   또는 터미널 실행: winget install OpenJS.NodeJS.LTS' : IS_MAC ? '   또는: brew install node@22' : ''));
    return 1;
  }
  add('ok', 'Node.js', `v${node.version}${node.recommended ? '' : ' (사용 가능; 22 / 24 LTS 권장)'}`);

  // 2. npm dependencies
  let deps = checkDeps();
  if (!deps.ok && !opts.check) {
    log(`\n${c.cyan('▶')} 의존성 패키지 설치 중 (npm ci) …`);
    const npm = npmCommand();
    let r = run(npm.cmd, [...npm.pre, 'ci', '--no-audit', '--no-fund'], { shell: npm.shell });
    if (!r.ok) {
      log(c.warn('  npm ci 실패, npm install 로 재시도 중 …'));
      r = run(npm.cmd, [...npm.pre, 'install', '--no-audit', '--no-fund'], { shell: npm.shell });
    }
    deps = checkDeps();
  }
  if (deps.ok) add('ok', '의존성 node_modules');
  else { add('err', '의존성 node_modules', `누락됨: ${deps.missing.join(', ')} → npm install 실행 필요`); fatal = true; }

  // 3. vendor
  let vendor = checkVendor();
  if (!vendor.ok && deps.ok && !opts.check) {
    log(`\n${c.cyan('▶')} 프론트엔드 라이브러리를 public/vendor 로 복사 중 …`);
    run(process.execPath, [path.join(ROOT, 'tools', 'vendor.mjs')]);
    vendor = checkVendor();
  }
  if (vendor.ok) add('ok', '프론트엔드 라이브러리 public/vendor', vendor.optionalMissing.length ? ' (three.js 누락: 3D 보드가 2D로 대체됨)' : '');
  else { add('err', '프론트엔드 라이브러리 public/vendor', `누락됨: ${vendor.missing.join(', ')} → node tools/vendor.mjs 실행 필요`); fatal = true; }

  // 4. data
  const data = checkData();
  if (data.ok) add('ok', '게임 데이터 data/*.json');
  else {
    add('err', '게임 데이터 data/*.json', [data.missing.length && `누락됨: ${data.missing.join(', ')}`, data.broken.length && `파싱 불가: ${data.broken.join(', ')}`].filter(Boolean).join('; ') + ' → git checkout -- data/ 또는 node tools/build-data.mjs 실행');
    if (data.missing.some((n) => n !== 'assets' && n !== 'emotes') || data.broken.length > 0) fatal = true;
  }

  // 5. assets
  let assets = checkAssets();
  if (!opts.assets) add(assets.ok ? 'ok' : 'skip', '리소스/오디오 public/assets', assets.ok ? `${assets.total}개 파일` : '건너뜀 (--no-assets)');
  else if (!assets.ok && deps.ok && !opts.check) {
    const what = !assets.present ? `최초 다운로드 약 ${assets.bytes ? mb(assets.bytes) : '270 MB'}, 언제든 중단 가능하며 다시 실행 시 이어받습니다`
      : `누락된 파일 ${assets.missing}개 다운로드 중`;
    log(`\n${c.cyan('▶')} 리소스 및 오디오 다운로드 중 (${what}) …`);
    const r = run(process.execPath, [path.join(ROOT, 'tools', 'fetch-assets.mjs')]);
    assets = checkAssets();
    if (!r.ok && !assets.ok) log(c.warn('  리소스 다운로드가 완료되지 않았습니다 (네트워크 문제?). 게임은 임시 대체 이미지로 실행 가능하며, 나중에 setup을 다시 실행해 이어받을 수 있습니다.'));
  }
  if (opts.assets) {
    if (assets.ok) add('ok', '리소스/오디오 public/assets', `${assets.total}개 파일`);
    else if (!assets.present) add('warn', '리소스/오디오 public/assets', '다운로드 안 됨 (임시 대체 이미지 사용) → node tools/fetch-assets.mjs');
    else add('warn', '리소스/오디오 public/assets', `누락 ${assets.missing}/${assets.total}개 파일 → setup 재실행으로 이어받기 가능`);
  }

  // 6. local client (optional)
  const local = checkLocal();
  const state = loadState();
  if (opts.local === 'no') add(local.manifest ? 'ok' : 'skip', '로컬 클라이언트 리소스 (선택)', local.manifest ? `${local.count}개 항목 추출 완료` : '건너뜀 (--no-local)');
  else {
    const client = findClient(opts.game);
    const already = local.manifest && local.dirPresent;
    if (!client) {
      if (already && local.board3d && !local.tiles && !opts.check) cropBoardTiles(log);
      add(already ? 'ok' : 'skip', '로컬 클라이언트 리소스 (선택)', already ? `${local.count}개 항목 추출 완료`
        : `${opts.game ? `${opts.game} 경로를 찾을 수 없음` : '로컬 명일방주 클라이언트 미감지'}: ${LOCAL_ART_FALLBACK} (docs/DEPLOY.md 6장 참조)`);
    } else if (!client.autochess) {
      add(already ? 'ok' : 'warn', '로컬 클라이언트 리소스 (선택)', `${client.kind} 클라이언트에 위수 협약 리소스가 없습니다 (게임 내에서 전체 리소스를 다운로드하세요): ${client.path}`);
    } else if (already && opts.local !== 'force') {
      if (local.board3d && !local.tiles && !opts.check) cropBoardTiles(log);
      add('ok', '로컬 클라이언트 리소스 (선택)', `${local.count}개 항목 추출 완료${local.board3d ? ', 3D 보드 사용 가능' : ''}${local.enemySpines ? '' : ', 최신 원석충 모델 누락'} (재추출: --local)`);
    } else if (opts.check) {
      add('skip', '로컬 클라이언트 리소스 (선택)', `${client.kind} 클라이언트가 감지됨. node tools/setup.mjs --local 실행으로 추출 가능`);
    } else {
      const py = findPython();
      if (!py) {
        add('skip', '로컬 클라이언트 리소스 (선택)', `${client.kind} 클라이언트가 감지되었으나 Python 3.8+ 이상이 없습니다 (${IS_WIN ? 'winget install Python.Python.3.12' : 'https://www.python.org/downloads/'})`);
      } else {
        let go = opts.local === 'force' || opts.yes;
        if (go || !state.localDeclined) {
          log(`\n${c.cyan('▶')} 로컬 명일방주 클라이언트 감지됨 (${client.kind}):\n  ${c.dim(client.path)}`);
          log('  공식 3D 보드 텍스처, UI 아이콘 등을 추출할 수 있습니다 (로컬 전용; 약 1–5분 소요, Python 의존성 약 40 MB는 프로젝트 내 .venv-extract에 설치됨).');
        }
        let unattended = false;
        if (!go && !state.localDeclined) {
          const answer = await ask('지금 추출하시겠습니까?', true);
          if (answer === null) unattended = true; // 터미널 없음: 동의 없이 Python 패키지를 설치하지 않음
          else if (!answer) { saveState({ localDeclined: true }); log(c.dim('  선택을 기억했습니다. 이후 다시 묻지 않습니다. 필요 시 node tools/setup.mjs --local 실행')); }
          go = answer === true;
        }
        if (!go) add('skip', '로컬 클라이언트 리소스 (선택)', unattended ? '터미널이 없어 질의를 건너뛰었습니다 (필요 시 node tools/setup.mjs --local 실행)' : '건너뜀 (필요 시 node tools/setup.mjs --local 실행)');
        else {
          const venv = ensureVenv(py, log);
          if (!venv.ok) add('warn', '로컬 클라이언트 리소스 (선택)', venv.why);
          else {
            log(`  ${c.cyan('▶')} 추출 중 (python tools/local-extract/extract.py --game …)`);
            const r = run(venv.python, [EXTRACT_PY, '--game', client.path], { env: PY_ENV });
            if (r.ok) cropBoardTiles(log);
            const after = checkLocal();
            if (r.ok && after.manifest) { add('ok', '로컬 클라이언트 리소스 (선택)', `${after.count}개 항목 추출 완료${after.board3d ? ', 3D 보드 사용 가능' : ''}`); saveState({ localDeclined: false, localExtractedFrom: client.path }); }
            else add('warn', '로컬 클라이언트 리소스 (선택)', `추출 실패 (종료 코드 ${r.code}): 게임은 정상 실행되며 ${LOCAL_ART_FALLBACK}. 나중에 node tools/setup.mjs --local 로 재시도 가능`);
          }
        }
      }
    }
  }

  // 요약 출력
  log(c.bold('\n── 준비 상태 ──────────────────────────────'));
  const width = Math.max(...summary.map((s) => displayWidth(s.label))) + 2;
  for (const s of summary) log(`${mark[s.state]} ${padDisplay(s.label, width)}${s.detail ? c.dim(s.detail) : ''}`);
  if (fatal) {
    log(c.err('\n아직 실행할 수 없습니다: 위의 ✘ 표시된 문제를 먼저 해결하세요 (node tools/doctor.mjs 로 상세 진단 가능).'));
    return 1;
  }
  if (!opts.quiet) {
    log(`\n${c.ok('시작할 준비가 되었습니다:')} npm start   ${c.dim('(Windows 환경은 scripts\\start-windows.bat 더블 클릭 가능)')}`);
    log(c.dim('브라우저에서 http://localhost:3000 접속; 동일 LAN 환경의 친구는 터미널에 표시된 LAN 주소로 접속.'));
  }
  return 0;
}

function isMain() {
  try { return !!process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url)); } catch { return false; }
}

if (isMain()) {
  main().then((code) => { process.exitCode = code; }, (e) => {
    console.error(`${mark.err} setup 중 오류 발생: ${e?.stack || e}`);
    process.exitCode = 1;
  });
}