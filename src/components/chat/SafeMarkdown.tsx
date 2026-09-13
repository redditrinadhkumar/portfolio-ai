/**
 * SAFE MARKDOWN RENDERING
 * ---------------------------
 * This renders a small, allow-listed markdown subset (bold, bullet lists,
 * paragraphs, and mailto:/https: links) directly to React elements. It
 * never calls `dangerouslySetInnerHTML` and never parses raw HTML tags —
 * so even if a malicious HTML/script string somehow survived the
 * server-side output validator, it would render here as inert plain text,
 * not as markup. This is a second, independent layer on top of that
 * server-side sanitization (defense in depth), not a replacement for it.
 */

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  // Split on **bold** segments and safe links; everything else is plain text.
  const parts = text.split(/(\*\*[^*]+\*\*|https?:\/\/\S+|mailto:\S+)/g);

  parts.forEach((part, i) => {
    if (!part) return;
    const key = `${keyPrefix}-${i}`;
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      nodes.push(<strong key={key}>{part.slice(2, -2)}</strong>);
    } else if (/^https?:\/\/\S+$/.test(part)) {
      const cleanHref = part.replace(/[.,)]+$/, '');
      nodes.push(
        <a key={key} href={cleanHref} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
          {cleanHref}
        </a>,
      );
    } else if (/^mailto:\S+$/.test(part)) {
      nodes.push(
        <a key={key} href={part} className="underline underline-offset-2">
          {part.replace('mailto:', '')}
        </a>,
      );
    } else {
      nodes.push(part);
    }
  });

  return nodes;
}

export function SafeMarkdown({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/);

  return (
    <>
      {blocks.map((block, blockIdx) => {
        const lines = block.split('\n').filter((l) => l.length > 0);
        const isList = lines.length > 0 && lines.every((l) => /^\s*[-*]\s+/.test(l));

        if (isList) {
          return (
            <ul key={`b-${blockIdx}`} className="list-disc space-y-1 pl-5">
              {lines.map((line, i) => (
                <li key={`li-${blockIdx}-${i}`}>{renderInline(line.replace(/^\s*[-*]\s+/, ''), `li-${blockIdx}-${i}`)}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={`b-${blockIdx}`} className="whitespace-pre-line">
            {renderInline(block, `p-${blockIdx}`)}
          </p>
        );
      })}
    </>
  );
}
