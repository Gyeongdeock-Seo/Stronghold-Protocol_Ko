// 한글 패치: 상단 바용 언어 전환 버튼. 누르면 다른 언어로 바꾸고 새로고침한다 (i18n.js setLang).
// 라벨은 번역하지 않는다 (data-i18n-skip): 바꿀 언어 이름을 그 언어로 보여 준다.

import { html, Button } from '../ui/components.js';
import { lang, setLang } from './i18n.js';

export function LangButton({ class: cls, size = 'sm', variant = 'ghost' }) {
  const next = lang === 'ko' ? 'zh' : 'ko';
  return html`<${Button} variant=${variant} size=${size} class=${cls} data-i18n-skip
    title=${lang === 'ko' ? '언어: 한국어 → 中文' : '语言：中文 → 한국어'}
    onClick=${() => setLang(next)}>${next === 'zh' ? '中文' : '한국어'}<//>`;
}
