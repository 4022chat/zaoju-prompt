import type { ReactNode } from 'react';

export function highlightText(text: string, query: string): ReactNode {
  const trimmed = query.trim();

  if (!trimmed) {
    return text;
  }

  const normalizedText = text.toLocaleLowerCase('zh-CN');
  const normalizedQuery = trimmed.toLocaleLowerCase('zh-CN');
  const index = normalizedText.indexOf(normalizedQuery);

  if (index === -1) {
    return text;
  }

  const end = index + trimmed.length;

  return (
    <>
      {text.slice(0, index)}
      <mark className="search-hit">{text.slice(index, end)}</mark>
      {text.slice(end)}
    </>
  );
}
