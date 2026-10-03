#!/usr/bin/env node
// tools/i18n/build-ko-data-dict.mjs — 게임 데이터 한국어 사전 생성 (한글 패치)
//
// data/*.json은 중국어 그대로 둔다(전투 로직이 중국어 설명문을 파싱하므로). 대신 화면 표시용
// 사전 public/i18n/ko/data.json ({ "중국어 원문": "한국어" })을 만든다.
//
// 절차:
//   1. CN 공식 테이블(.cache/gamedata, build-data가 받는 Kengxxiao zh_CN)과
//      KR 공식 테이블(.cache/gamedata-kr, ArknightsAssets kr/ — 같은 상대 경로)을 같은 JSON 경로로 맞춘다.
//      CN 구조는 그대로 두고, 중국어 문자열 자리에 같은 경로의 한국어 문자열만 넣은 "혼합 테이블"을
//      .cache/gamedata-hybrid-ko에 쓴다. (KR 덤프는 빈 배열을 {}로 저장하는 등 형식이 달라 그대로는
//      build-data가 읽지 못한다.)
//   2. 혼합 테이블로 build-data를 돌려 .cache/data-ko를 만든다.
//   3. data/*.json(중국어)과 .cache/data-ko/*.json을 경로별로 맞춰 문자열 쌍을 모은다.
//
// 같은 중국어 문장이 위치에 따라 다른 한국어로 번역되면 가장 많이 나온 번역을 쓰고 보고서에 남긴다.
// KR 테이블에 없는 문자열(PRTS 조사 자료, build-data의 하드코딩 문자열)은 사전에 들어가지 않는다.
// 그런 문자열은 public/i18n/ko/manual.json에서 직접 번역한다.
//
// 사용: node tools/i18n/build-ko-data-dict.mjs [--skip-build]
//   KR 테이블 받기: python 또는 아무 다운로더로 .cache/gd-files.txt 목록을
//   https://raw.githubusercontent.com/ArknightsAssets/ArknightsGamedata/<commit>/kr/gamedata/<path> 에서 받는다.
//   (--fetch 옵션이 대신 해 준다.)

import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CN_DIR = join(ROOT, '.cache', 'gamedata');
const KR_DIR = join(ROOT, '.cache', 'gamedata-kr');
const HYBRID_DIR = join(ROOT, '.cache', 'gamedata-hybrid-ko');
const DATA_ZH = join(ROOT, 'data');
const DATA_KO = join(ROOT, '.cache', 'data-ko');
const OUT = join(ROOT, 'public', 'i18n', 'ko', 'data.json');
const REPORT = join(ROOT, '.cache', 'i18n-ko-report.json');
const KR_REPO = 'ArknightsAssets/ArknightsGamedata';
const KR_COMMIT = '56aee3d6c5a29c3a0d192456d70d14252cbb0804'; // 2026-09-29, KR act2autochess 최종 데이터

const args = new Set(process.argv.slice(2));
const CJK = /[一-鿿]/;
const HANGUL = /[가-힣]/;
/** 원본 테이블 단위 대응 (data 경로로 못 맞춘 문자열의 보조 사전): 중국어 원문 → 한국어 */
const RAW_PAIRS = new Map();
const stripTags = (t) => t.replace(/<[@$][^>]*>|<\/>/g, '').replace(/\\n/g, '\n');
const ID_KEYS = ['Key', 'key', 'id', 'enemyId', 'charId', 'skillId', 'tokenKey'];

async function listFiles(dir) {
  const out = [];
  for (const ent of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name);
    if (ent.isDirectory()) out.push(...await listFiles(p));
    else if (ent.name.endsWith('.json')) out.push(p);
  }
  return out;
}

const readJson = async (p) => JSON.parse(await readFile(p, 'utf8'));

/** CN 구조에 KR 문자열을 끼운 값. 중국어가 들어 있는 문자열만 바꾼다. */
function hybrid(cn, kr, stats) {
  if (typeof cn === 'string') {
    if (CJK.test(cn) && typeof kr === 'string' && kr !== cn) {
      stats.replaced++;
      if (HANGUL.test(kr) && !CJK.test(kr) && !RAW_PAIRS.has(cn)) RAW_PAIRS.set(cn, kr);
      return kr;
    }
    if (CJK.test(cn)) stats.kept++;
    return cn;
  }
  if (Array.isArray(cn)) {
    const k = Array.isArray(kr) ? kr : [];
    // id가 있는 객체 배열(enemy_database의 { Key, Value } 등)은 서버 버전마다 항목 수와 순서가 달라
    // 인덱스가 아니라 id로 맞춘다.
    const idKey = ID_KEYS.find((f) => cn.length > 0 && cn.every((v) => v && typeof v === 'object' && typeof v[f] === 'string'));
    if (idKey) {
      const byId = new Map(k.filter((v) => v && typeof v === 'object').map((v) => [v[idKey], v]));
      // KR enemy_database는 [{ Key, Value }] 대신 { id: Value } 형태다.
      if (idKey === 'Key' && kr && typeof kr === 'object' && !Array.isArray(kr)) {
        for (const [id, value] of Object.entries(kr)) byId.set(id, { Key: id, Value: value });
      }
      return cn.map((v) => hybrid(v, byId.get(v[idKey]), stats));
    }
    return cn.map((v, i) => hybrid(v, k[i], stats));
  }
  if (cn && typeof cn === 'object') {
    const k = kr && typeof kr === 'object' && !Array.isArray(kr) ? kr : {};
    const o = {};
    for (const key of Object.keys(cn)) o[key] = hybrid(cn[key], k[key], stats);
    return o;
  }
  return cn;
}

async function fetchKr() {
  const list = (await readFile(join(ROOT, '.cache', 'gd-files.txt'), 'utf8')).split(/\r?\n/).filter(Boolean);
  for (const rel of list) {
    const dst = join(KR_DIR, rel);
    if (existsSync(dst)) continue;
    const url = `https://raw.githubusercontent.com/${KR_REPO}/${KR_COMMIT}/kr/gamedata/${rel}`;
    const res = await fetch(url);
    if (!res.ok) { console.warn(`  KR missing ${rel} (HTTP ${res.status})`); continue; }
    await mkdir(dirname(dst), { recursive: true });
    await writeFile(dst, await res.text());
    console.log(`  KR ${rel}`);
  }
}

async function buildHybrid() {
  const files = await listFiles(CN_DIR);
  const stats = { replaced: 0, kept: 0, missingKr: [] };
  for (const cnPath of files) {
    const rel = relative(CN_DIR, cnPath);
    const krPath = join(KR_DIR, rel);
    const cn = await readJson(cnPath);
    let out = cn;
    if (existsSync(krPath)) {
      let kr = await readJson(krPath);
      // KR enemy_database는 최상위가 { id: Value }다 (CN은 { enemies: [{ Key, Value }] }).
      if (Array.isArray(cn.enemies) && kr && !('enemies' in kr)) kr = { enemies: kr };
      out = hybrid(cn, kr, stats);
    }
    else stats.missingKr.push(rel);
    const dst = join(HYBRID_DIR, rel);
    await mkdir(dirname(dst), { recursive: true });
    await writeFile(dst, JSON.stringify(out));
  }
  return stats;
}

/** zh / ko 출력 데이터를 경로별로 맞춰 문자열 쌍을 모은다. */
function collectPairs(zh, ko, path, pairs) {
  if (typeof zh === 'string') {
    if (typeof ko === 'string' && zh !== ko && CJK.test(zh) && HANGUL.test(ko) && !CJK.test(ko)) {
      let m = pairs.get(zh);
      if (!m) pairs.set(zh, (m = new Map()));
      const e = m.get(ko) ?? { n: 0, at: path };
      e.n++;
      m.set(ko, e);
    }
    return;
  }
  if (Array.isArray(zh)) {
    if (!Array.isArray(ko)) return;
    // 길이가 다르면 KR 빌드의 텍스트 파싱 결과가 달라진 배열이다 — 인덱스가 어긋날 수 있어 건너뛴다.
    if (zh.length !== ko.length) return;
    zh.forEach((v, i) => collectPairs(v, ko[i], `${path}[${i}]`, pairs));
    return;
  }
  if (zh && typeof zh === 'object') {
    if (!ko || typeof ko !== 'object' || Array.isArray(ko)) return;
    for (const k of Object.keys(zh)) if (k in ko) collectPairs(zh[k], ko[k], `${path}.${k}`, pairs);
  }
}

/** 문자열 안의 중국어 조각 전부(남은 번역 대상 추정용). */
function collectCjk(v, out) {
  if (typeof v === 'string') { if (CJK.test(v)) out.add(v); return; }
  if (Array.isArray(v)) { for (const x of v) collectCjk(x, out); return; }
  if (v && typeof v === 'object') for (const x of Object.values(v)) collectCjk(x, out);
}

async function main() {
  if (args.has('--fetch')) await fetchKr();
  if (!existsSync(KR_DIR)) throw new Error(`KR tables not found: ${KR_DIR} (run with --fetch)`);
  if (!args.has('--skip-build')) {
    if (!existsSync(CN_DIR)) throw new Error(`CN tables not found: ${CN_DIR} (run npm run build-data once)`);
    const st = await buildHybrid();
    console.log(`hybrid tables: ${st.replaced} strings replaced, ${st.kept} CN strings without KR text, missing KR files ${st.missingKr.length}`);
    const r = spawnSync(process.execPath, [join(ROOT, 'tools', 'build-data.mjs'), '--offline', '--force', '--quiet',
      '--cache', HYBRID_DIR, '--out', DATA_KO, '--report', join(ROOT, '.cache', 'build-data-report-ko.json')], { stdio: 'inherit' });
    if (r.status !== 0 && r.status !== 1) throw new Error(`build-data (ko) failed with exit code ${r.status}`);
  }

  const pairs = new Map();
  const remaining = new Set();
  for (const name of (await readdir(DATA_ZH)).filter((f) => f.endsWith('.json')).sort()) {
    if (name === 'assets.json' || !existsSync(join(DATA_KO, name))) continue;
    const zh = await readJson(join(DATA_ZH, name));
    collectPairs(zh, await readJson(join(DATA_KO, name)), name.replace('.json', ''), pairs);
    collectCjk(zh, remaining);
  }

  const dict = {};
  const conflicts = [];
  for (const zh of [...pairs.keys()].sort()) {
    const cands = [...pairs.get(zh).entries()].sort((a, b) => b[1].n - a[1].n || a[0].localeCompare(b[0]));
    dict[zh] = cands[0][0];
    if (cands.length > 1) conflicts.push({ zh, candidates: cands.map(([ko, e]) => ({ ko, n: e.n, at: e.at })) });
  }
  // 보조: 원본 테이블 문자열과 그대로 같거나 태그만 뺀 형태가 같은 경우
  const rawStripped = new Map();
  for (const [cn, kr] of RAW_PAIRS) {
    const k = stripTags(cn);
    if (!rawStripped.has(k)) rawStripped.set(k, stripTags(kr));
  }
  let fromRaw = 0;
  for (const s of remaining) {
    if (s in dict) continue;
    const ko = RAW_PAIRS.get(s) ?? RAW_PAIRS.get(s.replace(/\n/g, '\\n')) ?? rawStripped.get(s);
    if (ko) { dict[s] = ko; fromRaw++; }
  }
  console.log(`raw-table fallback: ${fromRaw} entries`);
  const untranslated = [...remaining].filter((s) => !(s in dict)).sort();

  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(dict, null, 0).replace(/","/g, '",\n"') + '\n');
  await writeFile(REPORT, JSON.stringify({ entries: Object.keys(dict).length, conflicts, untranslated }, null, 2));
  console.log(`data dict: ${Object.keys(dict).length} entries → ${relative(ROOT, OUT)}`);
  console.log(`conflicts: ${conflicts.length}, untranslated data strings: ${untranslated.length} (see ${relative(ROOT, REPORT)})`);
}

main().catch((e) => { console.error(`build-ko-data-dict: ${e.message}`); process.exit(2); });
