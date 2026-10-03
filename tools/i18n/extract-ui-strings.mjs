#!/usr/bin/env node
// tools/i18n/extract-ui-strings.mjs — 코드에 박힌 중국어 UI 문자열 추출 (한글 패치)
//
// public/js, shared, server의 JS를 가볍게 토큰화해 중국어가 들어 있는 문자열을 모은다.
//   - '…' / "…"             → 그대로 한 항목
//   - `…${x}…` (태그 없음)   → 패턴 항목 "…{0}…" (런타임에 정규식으로 맞춘다)
//   - html`…` (htm 템플릿)  → 태그와 ${} 사이의 텍스트 조각, 속성값 각각을 항목으로
// 주석과 정규식 리터럴은 건너뛴다. 결과는 .cache/i18n-ui-strings.json (번역 작업 목록)과
// public/i18n/ko/ui.json의 누락 항목 보고.
//
// 사용: node tools/i18n/extract-ui-strings.mjs [--missing]
//   --missing  ui.json / data.json / official.json 어디에도 없는 항목만 출력

import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, relative, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DIRS = ['public/js', 'shared', 'server'];
// 개발자용 메시지만 있는 파일 (화면에 나오지 않음)
const SKIP = [/server[\\/]match[\\/]audit\.js$/, /public[\\/]dev[\\/]/];
const CJK = /[一-鿿]/;

async function walk(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...await walk(p));
    else if (e.name.endsWith('.js') || e.name.endsWith('.mjs')) out.push(p);
  }
  return out;
}

const REGEX_PREV = new Set(['(', ',', '=', ':', '[', '!', '&', '|', '?', '{', '}', ';', '+', '-', '*', '%', '<', '>', '~', '^', '']);
const REGEX_KW = /(?:return|typeof|case|do|else|in|of|new|delete|void|throw|yield|await)$/;

/** 문자열·템플릿 리터럴 토큰을 돌려준다. { kind: 'str'|'tpl', tag, parts: string[], line } */
function lex(src) {
  const toks = [];
  let i = 0, line = 1, prev = '';
  const n = src.length;
  const readTemplate = () => {
    // src[i] === '`'
    const startLine = line;
    const parts = [];
    let buf = '';
    i++;
    while (i < n) {
      const c = src[i];
      if (c === '\\') { buf += src.slice(i, i + 2); i += 2; continue; }
      if (c === '\n') line++;
      if (c === '`') { i++; break; }
      if (c === '$' && src[i + 1] === '{') {
        parts.push(buf); buf = '';
        i += 2;
        let depth = 1;
        while (i < n && depth > 0) {
          const d = src[i];
          if (d === '\n') line++;
          if (d === '`') { pushTemplate(); continue; }
          if (d === "'" || d === '"') { readString(d); continue; }
          if (d === '{') depth++;
          else if (d === '}') depth--;
          i++;
        }
        continue;
      }
      buf += c; i++;
    }
    parts.push(buf);
    return { parts, line: startLine };
  };
  const readString = (q) => {
    const startLine = line;
    let buf = '';
    i++;
    while (i < n && src[i] !== q) {
      if (src[i] === '\\') { buf += src.slice(i, i + 2); i += 2; continue; }
      if (src[i] === '\n') { line++; break; }
      buf += src[i++];
    }
    i++;
    toks.push({ kind: 'str', parts: [buf], line: startLine });
  };
  function pushTemplate() {
    const tagMatch = /([A-Za-z_$][\w$]*)\s*$/.exec(src.slice(Math.max(0, i - 40), i));
    const tag = tagMatch && !REGEX_KW.test(tagMatch[1]) ? tagMatch[1] : null;
    const t = readTemplate();
    toks.push({ kind: 'tpl', tag, parts: t.parts, line: t.line });
  }
  while (i < n) {
    const c = src[i];
    if (c === '\n') { line++; i++; continue; }
    if (c === ' ' || c === '\t' || c === '\r') { i++; continue; }
    if (c === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\n') i++; continue; }
    if (c === '/' && src[i + 1] === '*') {
      const end = src.indexOf('*/', i + 2);
      const stop = end < 0 ? n : end + 2;
      for (let k = i; k < stop; k++) if (src[k] === '\n') line++;
      i = stop; continue;
    }
    if (c === "'" || c === '"') { readString(c); prev = 'x'; continue; }
    if (c === '`') { pushTemplate(); prev = 'x'; continue; }
    if (c === '/') {
      const before = src.slice(Math.max(0, i - 12), i).trimEnd();
      const p = before.slice(-1);
      if (REGEX_PREV.has(p) || REGEX_KW.test(before)) {
        // 정규식 리터럴: 건너뛴다
        i++;
        let cls = false;
        while (i < n) {
          const d = src[i];
          if (d === '\\') { i += 2; continue; }
          if (d === '\n') break;
          if (d === '[') cls = true;
          else if (d === ']') cls = false;
          else if (d === '/' && !cls) { i++; break; }
          i++;
        }
        while (/[a-z]/.test(src[i] || '')) i++;
        prev = 'x';
        continue;
      }
    }
    prev = c;
    i++;
  }
  return toks;
}

/** htm 템플릿의 정적 조각에서 화면 텍스트와 속성값을 뽑는다. */
function htmTexts(parts) {
  const out = [];
  let inTag = false, quote = null, buf = '';
  const push = (s) => { const t = s.replace(/\s+/g, ' ').trim(); if (t && CJK.test(t)) out.push(t); };
  for (const part of parts) {
    for (let k = 0; k < part.length; k++) {
      const c = part[k];
      if (!inTag) {
        if (c === '<') { push(buf); buf = ''; inTag = true; continue; }
        buf += c;
      } else if (quote) {
        if (c === quote) { push(buf); buf = ''; quote = null; continue; }
        buf += c;
      } else {
        if (c === '"' || c === "'") { quote = c; buf = ''; continue; }
        if (c === '>') { inTag = false; buf = ''; continue; }
      }
    }
    // ${} 경계: 텍스트 조각을 끊는다
    if (!inTag || quote) { push(buf); buf = ''; }
  }
  push(buf);
  return out;
}

const unescape = (s) => s.replace(/\\n/g, '\n').replace(/\\(['"`\\])/g, '$1');

async function main() {
  const entries = new Map(); // key → { kind, at: [] }
  const add = (key, kind, at) => {
    key = unescape(key);
    if (!CJK.test(key)) return;
    const e = entries.get(key) ?? { kind, at: [] };
    if (e.at.length < 4) e.at.push(at);
    entries.set(key, e);
  };
  for (const d of DIRS) {
    for (const f of await walk(join(ROOT, d))) {
      const rel = relative(ROOT, f).replace(/\\/g, '/');
      if (SKIP.some((re) => re.test(rel))) continue;
      const src = await readFile(f, 'utf8');
      for (const t of lex(src)) {
        const at = `${rel}:${t.line}`;
        if (t.kind === 'str') add(t.parts[0], 'str', at);
        else if (t.tag === 'html') for (const s of htmTexts(t.parts)) add(s, 'frag', at);
        else if (t.parts.length === 1) add(t.parts[0], 'str', at);
        else add(t.parts.map((p, k) => (k ? `{${k - 1}}` : '') + p).join(''), 'tpl', at);
      }
    }
  }
  const load = async (p) => (existsSync(p) ? JSON.parse(await readFile(p, 'utf8')) : {});
  const ko = join(ROOT, 'public', 'i18n', 'ko');
  const known = { ...(await load(join(ko, 'official.json'))), ...(await load(join(ko, 'data.json'))), ...(await load(join(ko, 'manual.json'))), ...(await load(join(ko, 'ui.json'))) };
  const list = [...entries.entries()].map(([key, e]) => ({ key, kind: e.kind, at: e.at, has: key in known || key.trim() in known }));
  await mkdir(join(ROOT, '.cache'), { recursive: true });
  await writeFile(join(ROOT, '.cache', 'i18n-ui-strings.json'), JSON.stringify(list, null, 1));
  const missing = list.filter((e) => !e.has);
  if (process.argv.includes('--missing')) for (const e of missing) console.log(`${e.kind}\t${e.at[0]}\t${JSON.stringify(e.key)}`);
  console.log(`ui strings: ${list.length} (str ${list.filter((e) => e.kind === 'str').length}, tpl ${list.filter((e) => e.kind === 'tpl').length}, frag ${list.filter((e) => e.kind === 'frag').length}); untranslated ${missing.length}`);
}

main().catch((e) => { console.error(e); process.exit(2); });
