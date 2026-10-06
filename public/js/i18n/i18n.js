// 한글 패치: 화면 표시용 번역 계층 (Korean patch — display-only translation layer).
//
// 게임 데이터(data/*.json)와 코드 안의 문자열은 중국어 그대로 둔다. 전투 로직이 중국어 설명문을 파싱하기
// 때문이다. 대신 화면에 나가는 순간 번역한다.
//   1. tr(text)            사전 조회 (정확히 일치 → 패턴 → 구분자 단위 조각) — richText.js가 태그로 나누기 전에 호출
//   2. DOM 번역기          MutationObserver로 텍스트 노드와 title / placeholder / aria-label 속성을 바꾼다.
//                          Preact는 바뀐 vnode만 DOM에 다시 쓰므로, 번역한 노드는 원문이 바뀔 때까지 유지된다.
//
// 사전 (public/i18n/ko/, 뒤에 오는 파일이 우선):
//   official.json  공식 클라이언트 UI 문자열 표(string_map) CN↔KR 키 대응
//   data.json      공식 KR 게임 데이터로 만든 data/*.json 문자열 대응 (tools/i18n/build-ko-data-dict.mjs)
//   manual.json    공식 KR 테이블에 없는 데이터 문자열 수동 번역
//   ui.json        코드에 박힌 UI 문자열 수동 번역 (tools/i18n/extract-ui-strings.mjs로 목록 추출)
//   patterns.json  "{0}" 자리표시자가 있는 문장 패턴: { "还剩 {0} 场作战": "작전 {0}회 남음" }
// A key "<ctx>|<text>" translates <text> only inside an element carrying data-i18n-ctx="<ctx>" (one Chinese word with
// two Korean meanings: "toggle|关闭" is 꺼짐 on a switch, plain "关闭" is 닫기 on a close button).
//
// 언어 설정: localStorage `sp.pref.lang` = 'ko' | 'zh' (기본 'ko'). setLang()은 저장 후 새로고침한다.
// Node(단위 테스트)에서는 아무것도 하지 않는다: tr()은 입력을 그대로 돌려준다.

const LANG_KEY = 'sp.pref.lang';
const CJK = /[一-鿿]/;
// 번역 대상 감지: 한자 또는 중국어 전각 문장부호 (「」【】는 한국어에서도 쓰므로 제외)
const TRIGGER = /[一-鿿。，、；：？！（）]/;
const PUNCT = { '。': '. ', '，': ', ', '、': ', ', '；': '; ', '：': ': ', '？': '? ', '！': '! ', '（': '(', '）': ')' };
/** 한자가 남지 않은 문장의 전각 문장부호를 한국어식으로. */
const fixPunct = (s) => (CJK.test(s) ? s : s.replace(/[。，、；：？！（）]/g, (c) => PUNCT[c]).replace(/ {2,}/g, ' ').replace(/ ([)\]」』])/g, '$1'));
const FILES = ['official', 'data', 'manual', 'ui', 'patterns'];
const ATTRS = ['title', 'placeholder', 'aria-label', 'alt'];
const CACHE_MAX = 20000;

const hasDom = typeof document !== 'undefined' && typeof window !== 'undefined';

function readLang() {
  if (!hasDom) return 'zh';
  try {
    const v = localStorage.getItem(LANG_KEY);
    return v === 'zh' ? 'zh' : 'ko';
  } catch {
    return 'ko';
  }
}

/** 현재 언어 ('ko' | 'zh'). */
export const lang = readLang();

/** 언어를 바꾸고 새로고침한다 (번역은 첫 렌더 전에 적용해야 하므로). */
export function setLang(next) {
  try { localStorage.setItem(LANG_KEY, next === 'zh' ? 'zh' : 'ko'); } catch { /* 저장 불가: 그대로 */ }
  if (hasDom) location.reload();
}

/** @type {Map<string, string>} */
const dict = new Map();
/** @type {Array<{ re: RegExp, out: string, n: number }>} */
const patterns = [];
/** @type {Map<string, string>} */
const cache = new Map();
let active = false;
/** 번역하지 못한 문자열 (사전 보강용). 콘솔에서 __i18nMissing()으로 본다. */
const missing = new Set();
if (hasDom) window.__i18nMissing = () => [...missing];

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function addPattern(src, out) {
  const parts = src.split(/\{(\d+)\}/);
  if (parts.length < 3) { dict.set(src, out); return; }
  let re = '^';
  const order = [];
  for (let k = 0; k < parts.length; k++) {
    if (k % 2 === 0) re += escapeRe(parts[k]);
    else { re += '([\\s\\S]*?)'; order.push(Number(parts[k])); }
  }
  re += '$';
  // 출력의 {i}는 원문의 i번째 자리표시자를 가리킨다: 캡처 순서 → 자리표시자 번호
  const fixed = parts.filter((_, k) => k % 2 === 0).join('').length;
  patterns.push({ re: new RegExp(re), out, order, n: fixed });
}

/** 패턴 번역: 캡처한 값도 다시 번역한다 (이름 등). */
function viaPattern(s) {
  for (const p of patterns) {
    const m = p.re.exec(s);
    if (!m) continue;
    const vals = [];
    p.order.forEach((idx, k) => { vals[idx] = translate(m[k + 1]); });
    return p.out.replace(/\{(\d+)\}/g, (w, i) => (vals[Number(i)] ?? w));
  }
  return null;
}

// 구분자 단위 조각 번역 ("精锐 · 3阶", "盟约 / 特质" 등)
const SPLIT = /(\s*[·・|/]\s*|、|，|；|：|\s+-\s+|\n)/;

function viaPieces(s) {
  const pieces = s.split(SPLIT);
  if (pieces.length < 3) return null;
  let changed = false;
  const out = pieces.map((p, k) => {
    if (k % 2 === 1) {
      // 중국어 전각 구두점은 한국어 문장 부호로
      if (p === '，') return ', ';
      if (p === '、') return ', ';
      if (p === '；') return '; ';
      if (p === '：') return ': ';
      return p;
    }
    if (!CJK.test(p)) return p;
    const t = translate(p, true);
    if (t !== p) changed = true;
    return t;
  });
  return changed ? out.join('') : null;
}

/** 【이름】 / 「이름」 안의 이름만 번역 (공식 KR 표기처럼 【】는 [ ]로). */
function viaBrackets(s) {
  let changed = false;
  const out = s.replace(/【([^【】]+)】|「([^「」]+)」/g, (whole, a, b) => {
    const inner = a ?? b;
    const t = translate(inner, true);
    if (t === inner) return whole;
    changed = true;
    return a != null ? `[${t}]` : `「${t}」`;
  });
  if (!changed) return null;
  return CJK.test(out) ? (translate(out, true) !== out ? translate(out, true) : out) : out;
}

/**
 * 한 문자열의 번역. 사전에 없으면 원문을 돌려준다.
 * @param {string} s
 * @param {boolean} [noPieces] 조각 번역 재귀 방지
 */
function translate(s, noPieces = false) {
  if (!TRIGGER.test(s)) return s;
  const hit = cache.get(s);
  if (hit !== undefined) return hit;
  const lead = /^\s*/.exec(s)[0];
  const trail = /\s*$/.exec(s)[0];
  const core = s.slice(lead.length, s.length - trail.length);
  let out = dict.get(core);
  if (out === undefined && core.includes('\n')) out = dict.get(core.replace(/\n/g, '\\n'));
  if (out === undefined) out = viaPattern(core);
  if (out == null && /[【「]/.test(core)) out = viaBrackets(core);
  if (out == null && !noPieces) out = viaPieces(core);
  let body = fixPunct(out == null ? core : out);
  if (!trail) body = body.replace(/\s+$/, '');
  const res = lead + body + trail;
  if (!noPieces && CJK.test(res) && missing.size < 2000) missing.add(core);
  if (cache.size > CACHE_MAX) cache.clear();
  cache.set(s, res);
  return res;
}

/**
 * 화면 표시용 번역. 한국어 모드가 아니거나 사전에 없으면 원문 그대로.
 * @template T
 * @param {T} s
 * @param {string | null} [ctx] a data-i18n-ctx context: a "<ctx>|<text>" entry wins over the plain one
 * @returns {T}
 */
export function tr(s, ctx = null) {
  if (!active || typeof s !== 'string' || !s) return s;
  return /** @type {any} */ (translateIn(s, ctx));
}

/** translate(), preferring the "<ctx>|<text>" entry of the context (surrounding whitespace kept). */
function translateIn(s, ctx) {
  if (ctx) {
    const core = s.trim();
    const hit = dict.get(`${ctx}|${core}`);
    if (hit !== undefined) return s.replace(core, () => hit);
  }
  return translate(s);
}

// ---- DOM 번역기 -------------------------------------------------------------------------------

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'CODE', 'PRE']);

function skipNode(el) {
  for (let e = el; e && e.nodeType === 1; e = e.parentNode) {
    if (SKIP_TAGS.has(e.tagName) || (e.hasAttribute && e.hasAttribute('data-i18n-skip'))) return true;
  }
  return false;
}

/** The data-i18n-ctx of the nearest ancestor that has one. */
function ctxOf(el) {
  for (let e = el; e && e.nodeType === 1; e = e.parentNode) {
    const c = e.getAttribute && e.getAttribute('data-i18n-ctx');
    if (c) return c;
  }
  return null;
}

function fixText(node) {
  const v = node.data;
  if (!v || !TRIGGER.test(v) || skipNode(node.parentNode)) return;
  const t = translateIn(v, ctxOf(node.parentNode));
  if (t !== v) node.data = t;
}

function fixAttrs(el) {
  for (const a of ATTRS) {
    const v = el.getAttribute(a);
    if (v && TRIGGER.test(v)) {
      const t = translate(v);
      if (t !== v) el.setAttribute(a, t);
    }
  }
}

function fixTree(root) {
  if (root.nodeType === 3) { fixText(root); return; }
  if (root.nodeType !== 1 || SKIP_TAGS.has(root.tagName)) return;
  fixAttrs(root);
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    if (n.nodeType === 3) fixText(n);
    else fixAttrs(n);
  }
}

function installDom() {
  const obs = new MutationObserver((list) => {
    for (const m of list) {
      if (m.type === 'characterData') fixText(m.target);
      else if (m.type === 'attributes') fixAttrs(m.target);
      else for (const n of m.addedNodes) fixTree(n);
    }
  });
  obs.observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  fixTree(document.documentElement);
  document.title = translate(document.title);
}

// ---- 부팅 -----------------------------------------------------------------------------------

async function load() {
  const base = '/i18n/ko/';
  const res = await Promise.all(FILES.map((f) => fetch(`${base}${f}.json`).then((r) => (r.ok ? r.json() : {})).catch(() => ({}))));
  res.forEach((obj, k) => {
    for (const [zh, ko] of Object.entries(obj || {})) {
      if (typeof ko !== 'string' || (!ko && FILES[k] !== 'ui') || zh.startsWith('//')) continue;
      if (FILES[k] === 'patterns' || /\{\d+\}/.test(zh) && !dict.has(zh)) addPattern(zh, ko);
      if (FILES[k] !== 'patterns') dict.set(zh, ko);
    }
  });
  // 고정 문자열이 긴 패턴부터 (더 구체적인 패턴 우선)
  patterns.sort((a, b) => b.n - a.n);
  active = dict.size > 0;
}

if (hasDom && lang === 'ko') {
  try {
    await load();
    if (active) {
      document.documentElement.lang = 'ko';
      document.documentElement.classList.add('lang-ko');
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = '/i18n/ko/ko.css';
      document.head.appendChild(css);
      installDom();
    }
  } catch (e) {
    console.warn('[i18n] 한국어 사전을 불러오지 못했습니다 — 중국어로 표시합니다', e);
  }
}
