import { useEffect, useState } from 'react';
import type { CategoryId } from '../data/types';

interface PromptImageProps {
  src: string;
  title: string;
  categoryId: CategoryId;
  priority?: boolean;
}

export function PromptImage({ src, title, categoryId, priority = false }: PromptImageProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (src && !failed) {
    return (
      <img
        className="prompt-image__media"
        src={src}
        alt={`${title}生成效果`}
        width={600}
        height={800}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
        decoding="async"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div className={`prompt-image__fallback prompt-image__fallback--${categoryId}`} role="img" aria-label={`${title}封面待补`}>
      <span className="prompt-image__frame" aria-hidden="true" />
      <span className="prompt-image__ink" aria-hidden="true" />
      <span className="prompt-image__state">封面待补</span>
      <strong>{title}</strong>
      <span className="prompt-image__caption">AI MANGA FRAME</span>
    </div>
  );
}
