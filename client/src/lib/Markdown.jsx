// Minimal, safe Markdown renderer for CMS-authored legal pages.
// Output is built from React elements (never innerHTML), so author content cannot inject markup.
// Supports: ## / ### headings, paragraphs, "-" and "1." lists, **bold**, *italic* and [links](https://...).

function inline(text, keyPrefix) {
  const parts = [];
  const re = /(\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\(((?:https?:\/\/|mailto:|tel:|\/|#)[^)\s]*)\))/g;
  let last = 0;
  let m;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const key = `${keyPrefix}-${i++}`;
    if (m[2]) parts.push(<strong key={key}>{m[2]}</strong>);
    else if (m[3]) parts.push(<em key={key}>{m[3]}</em>);
    else parts.push(<a key={key} href={m[5]} rel="noopener noreferrer" target={m[5].startsWith('http') ? '_blank' : undefined}>{m[4]}</a>);
    last = re.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export function Markdown({ source = '' }) {
  const blocks = [];
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  let para = [];
  let list = null;

  const flushPara = () => {
    if (para.length) blocks.push({ type: 'p', text: para.join(' ') });
    para = [];
  };
  const flushList = () => {
    if (list) blocks.push(list);
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trim();
    let m;
    if (!line) {
      flushPara();
      flushList();
    } else if ((m = line.match(/^(#{1,4})\s+(.*)$/))) {
      flushPara();
      flushList();
      blocks.push({ type: m[1].length <= 2 ? 'h2' : 'h3', text: m[2] });
    } else if ((m = line.match(/^[-*]\s+(.*)$/)) || (m = line.match(/^\d+[.)]\s+(.*)$/))) {
      flushPara();
      const ordered = /^\d/.test(line);
      if (!list || list.ordered !== ordered) {
        flushList();
        list = { type: 'list', ordered, items: [] };
      }
      list.items.push(m[1]);
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara();
  flushList();

  return blocks.map((b, i) => {
    if (b.type === 'h2') return <h2 key={i}>{inline(b.text, i)}</h2>;
    if (b.type === 'h3') return <h3 key={i}>{inline(b.text, i)}</h3>;
    if (b.type === 'p') return <p key={i}>{inline(b.text, i)}</p>;
    const Tag = b.ordered ? 'ol' : 'ul';
    return (
      <Tag key={i}>
        {b.items.map((it, j) => (
          <li key={j}>{inline(it, `${i}-${j}`)}</li>
        ))}
      </Tag>
    );
  });
}
