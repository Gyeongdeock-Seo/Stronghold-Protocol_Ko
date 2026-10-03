#!/usr/bin/env node
// tools/i18n/build-ko-official.mjs — 공식 클라이언트 UI 문자열 표 대응 (한글 패치)
//
// ArknightsAssets/ArknightsGamedata의 i18n/string_map.txt ("[KEY]문장" 한 줄씩)를 CN·KR 두 벌 받아
// 같은 키끼리 맞춰 public/i18n/ko/official.json ({ "중국어": "한국어" })을 만든다.
// Unity 리치 텍스트 태그(<color=…>)가 들어간 문장은 이 게임에서 쓰지 않으므로 뺀다.
//
// 사용: node tools/i18n/build-ko-official.mjs

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const REPO = 'ArknightsAssets/ArknightsGamedata';
const KR_COMMIT = '56aee3d6c5a29c3a0d192456d70d14252cbb0804';
const CN_REF = 'master';
const CJK = /[一-鿿]/;
const HANGUL = /[가-힣]/;

async function load(region, ref) {
  const url = `https://raw.githubusercontent.com/${REPO}/${ref}/${region}/i18n/string_map.txt`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const map = new Map();
  for (const line of (await res.text()).split(/\r?\n/)) {
    const m = /^\[([^\]]+)\]\s?(.*)$/.exec(line);
    if (m) map.set(m[1], m[2]);
  }
  return map;
}

const cn = await load('cn', CN_REF);
const kr = await load('kr', KR_COMMIT);
const out = {};
for (const [key, zh] of [...cn.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  const ko = kr.get(key);
  if (!ko || !CJK.test(zh) || !HANGUL.test(ko) || CJK.test(ko)) continue;
  if (/<color=|<\/color>|<size=|<b>/.test(zh + ko)) continue;
  if (!(zh in out)) out[zh] = ko.replace(/\\n/g, '\n');
}
const dst = join(ROOT, 'public', 'i18n', 'ko', 'official.json');
await mkdir(dirname(dst), { recursive: true });
await writeFile(dst, JSON.stringify(out, null, 0).replace(/","/g, '",\n"') + '\n');
console.log(`official dict: ${Object.keys(out).length} entries`);
