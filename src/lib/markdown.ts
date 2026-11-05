/**
 * A deliberately small, safe Markdown renderer for council pages: headings (##, ###),
 * paragraphs, bullet lists, **bold**, *italic* and [links](url). No raw HTML; links
 * must be http(s), mailto or site paths. The real site uses a pinned, sanitised
 * library (plan Task 15).
 */
import { esc } from './escape';
import { href } from './paths';

function inline(text: string): string {
  let out = esc(text);
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, label: string, url: string) => {
    const raw = url.replace(/&amp;/g, '&');
    let target: string | null = null;
    if (/^https?:\/\//i.test(raw) || /^mailto:/i.test(raw)) target = raw;
    else if (raw.startsWith('/')) target = href(raw);
    if (!target) return label;
    const external = /^https?:/i.test(target) ? ' rel="noopener"' : '';
    return `<a href="${esc(target)}"${external}>${label}</a>`;
  });
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
  return out;
}

export function renderMarkdown(md: string): string {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const html: string[] = [];
  let para: string[] = [];
  let list: string[] = [];
  const flushPara = () => {
    if (para.length) html.push(`<p>${inline(para.join(' '))}</p>`);
    para = [];
  };
  const flushList = () => {
    if (list.length) html.push(`<ul>${list.map((li) => `<li>${inline(li)}</li>`).join('')}</ul>`);
    list = [];
  };
  for (const line of lines) {
    const trimmed = line.trim();
    const heading = /^(#{1,3})\s+(.*)$/.exec(trimmed);
    const bullet = /^[-*]\s+(.*)$/.exec(trimmed);
    if (!trimmed) {
      flushPara();
      flushList();
    } else if (heading) {
      flushPara();
      flushList();
      const level = Math.max(2, heading[1].length);
      html.push(`<h${level}>${inline(heading[2])}</h${level}>`);
    } else if (bullet) {
      flushPara();
      list.push(bullet[1]);
    } else {
      flushList();
      para.push(trimmed);
    }
  }
  flushPara();
  flushList();
  return html.join('\n');
}
