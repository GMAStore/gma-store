// Markdown mini → DOM (aman: tanpa innerHTML). Mendukung #/##/###, daftar, **tebal**, *miring*, [tautan](https://…), baris kosong = paragraf.
import { h } from './dom.js';
function inline(t) {
  const out = []; const re = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g; let last = 0, m;
  while ((m = re.exec(t))) {
    if (m.index > last) out.push(t.slice(last, m.index)); const s = m[0];
    if (s.startsWith('**')) out.push(h('strong', null, s.slice(2, -2)));
    else if (s.startsWith('*')) out.push(h('em', null, s.slice(1, -1)));
    else { const mm = /\[([^\]]+)\]\(([^)]+)\)/.exec(s); const u = mm[2].trim(); out.push(/^(https?:\/\/|mailto:|\/)/i.test(u) ? h('a', { href: u, rel: 'noopener noreferrer', target: /^https?:/i.test(u) ? '_blank' : null }, mm[1]) : mm[1]); }
    last = m.index + s.length;
  }
  if (last < t.length) out.push(t.slice(last)); return out;
}
export function markdown(teks) {
  const w = h('div', { class: 'konten-rich' }); const baris = String(teks || '').replace(/\r/g, '').split('\n'); let para = [], list = null;
  const tutupPara = () => { if (para.length) { w.append(h('p', null, ...para.flatMap((x, i) => i ? [h('br'), ...inline(x)] : inline(x)))); para = []; } };
  const tutupList = () => { if (list) { w.append(list); list = null; } };
  for (const b of baris) {
    let m;
    if ((m = /^(#{1,3})\s+(.*)$/.exec(b))) { tutupPara(); tutupList(); w.append(h('h' + (m[1].length + 1 > 4 ? 4 : m[1].length + 1), null, ...inline(m[2]))); }
    else if ((m = /^\s*[-*]\s+(.*)$/.exec(b))) { tutupPara(); if (!list || list.tagName !== 'UL') { tutupList(); list = h('ul'); } list.append(h('li', null, ...inline(m[1]))); }
    else if ((m = /^\s*\d+[.)]\s+(.*)$/.exec(b))) { tutupPara(); if (!list || list.tagName !== 'OL') { tutupList(); list = h('ol'); } list.append(h('li', null, ...inline(m[1]))); }
    else if (!b.trim()) { tutupPara(); tutupList(); }
    else { tutupList(); para.push(b.trim()); }
  }
  tutupPara(); tutupList(); return w;
}
