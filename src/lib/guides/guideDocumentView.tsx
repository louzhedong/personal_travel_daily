import type { ReactNode } from 'react';

export interface GuideDocumentSection {
  id: string;
  title: string;
}

export interface OriginalGuideDocumentView {
  html: string;
  sections: GuideDocumentSection[];
}

const SAFE_TAGS = new Set([
  'a',
  'article',
  'aside',
  'blockquote',
  'br',
  'code',
  'dd',
  'div',
  'dl',
  'dt',
  'em',
  'figcaption',
  'figure',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'li',
  'mark',
  'ol',
  'p',
  'pre',
  'section',
  'small',
  'span',
  'strong',
  'sub',
  'sup',
  'table',
  'tbody',
  'td',
  'th',
  'thead',
  'tr',
  'ul',
]);

const URI_ATTRIBUTES = new Set(['href', 'src']);
const SAFE_GLOBAL_ATTRIBUTES = new Set(['class', 'id', 'title', 'aria-label']);
const SAFE_TABLE_ATTRIBUTES = new Set(['colspan', 'rowspan']);

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function buildHighlightTokens(keyword: string) {
  const trimmed = keyword.trim();
  if (!trimmed) {
    return [];
  }

  const tokens = [trimmed, ...trimmed.split(/\s+/)]
    .map((item) => item.trim())
    .filter((item) => item.length >= 2);

  return Array.from(new Set(tokens)).sort((left, right) => right.length - left.length);
}

export function renderHighlightedText(text: string, tokens: string[]): ReactNode {
  if (!tokens.length || !text) {
    return text;
  }

  const matcher = new RegExp(`(${tokens.map(escapeRegExp).join('|')})`, 'gi');
  const parts = text.split(matcher);

  return parts.map((part, index) =>
    tokens.some((token) => token.toLowerCase() === part.toLowerCase()) ? (
      <mark key={`${part}-${index}`} className="guide-highlight">
        {part}
      </mark>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    ),
  );
}

function isSafeUrl(value: string) {
  if (!value.trim()) {
    return false;
  }
  try {
    const url = new URL(value, window.location.origin);
    return url.protocol === 'http:' || url.protocol === 'https:' || url.protocol === 'mailto:';
  } catch {
    return false;
  }
}

function sanitizeElement(element: Element) {
  const tagName = element.tagName.toLowerCase();
  if (!SAFE_TAGS.has(tagName)) {
    element.replaceWith(...Array.from(element.childNodes));
    return;
  }

  Array.from(element.attributes).forEach((attribute) => {
    const name = attribute.name.toLowerCase();
    const value = attribute.value;
    const isSafeAttribute =
      SAFE_GLOBAL_ATTRIBUTES.has(name) ||
      SAFE_TABLE_ATTRIBUTES.has(name) ||
      name.startsWith('aria-') ||
      name.startsWith('data-');

    if (name.startsWith('on') || name === 'style') {
      element.removeAttribute(attribute.name);
      return;
    }

    if (URI_ATTRIBUTES.has(name)) {
      if (!isSafeUrl(value)) {
        element.removeAttribute(attribute.name);
        return;
      }
      if (name === 'href') {
        element.setAttribute('target', '_blank');
        element.setAttribute('rel', 'noreferrer');
      }
      return;
    }

    if (!isSafeAttribute) {
      element.removeAttribute(attribute.name);
    }
  });
}

function sanitizeHtml(root: Element) {
  Array.from(root.querySelectorAll('*')).forEach(sanitizeElement);
}

export function buildOriginalDocumentView(
  contentHtml: string,
  tokens: string[],
): OriginalGuideDocumentView {
  if (!contentHtml) {
    return { html: '', sections: [] };
  }

  const parser = new DOMParser();
  const document = parser.parseFromString(`<div>${contentHtml}</div>`, 'text/html');
  const root = document.body.firstElementChild as HTMLDivElement | null;
  if (!root) {
    return { html: '', sections: [] };
  }

  sanitizeHtml(root);

  const sections: GuideDocumentSection[] = [];
  root.querySelectorAll('h3').forEach((heading, index) => {
    const title = heading.textContent?.trim();
    if (!title) {
      return;
    }
    const id = `guide-section-${index + 1}`;
    heading.setAttribute('id', id);
    sections.push({ id, title });
  });

  if (tokens.length) {
    const matcher = new RegExp(`(${tokens.map(escapeRegExp).join('|')})`, 'gi');
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const textNodes: Text[] = [];

    while (walker.nextNode()) {
      const current = walker.currentNode as Text;
      if (!current.textContent?.trim()) {
        continue;
      }
      const parentTag = current.parentElement?.tagName.toLowerCase();
      if (parentTag === 'script' || parentTag === 'style' || parentTag === 'mark') {
        continue;
      }
      textNodes.push(current);
    }

    textNodes.forEach((node) => {
      const text = node.textContent ?? '';
      if (!matcher.test(text)) {
        matcher.lastIndex = 0;
        return;
      }
      matcher.lastIndex = 0;

      const fragment = document.createDocumentFragment();
      let lastIndex = 0;

      for (const match of text.matchAll(matcher)) {
        const matched = match[0];
        const offset = match.index ?? 0;
        if (offset > lastIndex) {
          fragment.appendChild(document.createTextNode(text.slice(lastIndex, offset)));
        }
        const mark = document.createElement('mark');
        mark.className = 'guide-highlight';
        mark.textContent = matched;
        fragment.appendChild(mark);
        lastIndex = offset + matched.length;
      }

      if (lastIndex < text.length) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
      }

      node.parentNode?.replaceChild(fragment, node);
    });
  }

  return { html: root.innerHTML, sections };
}
