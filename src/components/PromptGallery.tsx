import { useEffect, useRef, useState } from 'react';
import type { DisplayPrompt } from '../data/types';
import { PromptCard } from './PromptCard';

const PAGE_SIZE = 40;

interface PromptGalleryProps {
  prompts: readonly DisplayPrompt[];
  query: string;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onOpen: (id: string, element: HTMLButtonElement) => void;
}

export function PromptGallery({ prompts, query, hasActiveFilters, onClearFilters, onOpen }: PromptGalleryProps) {
  const [loadedCount, setLoadedCount] = useState(PAGE_SIZE);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const visiblePrompts = prompts.slice(0, loadedCount);
  const hasMore = loadedCount < prompts.length;

  useEffect(() => {
    setLoadedCount(PAGE_SIZE);
  }, [prompts]);

  useEffect(() => {
    const loadMoreElement = loadMoreRef.current;
    if (!loadMoreElement || !hasMore || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLoadedCount((count) => Math.min(count + PAGE_SIZE, prompts.length));
        }
      },
      { rootMargin: '600px' },
    );
    observer.observe(loadMoreElement);
    return () => observer.disconnect();
  }, [hasMore, prompts.length]);

  if (prompts.length === 0) {
    return (
      <section className="empty-state" aria-live="polite">
        <p>这一帧还没有对应的提示词。</p>
        {hasActiveFilters ? <button type="button" onClick={onClearFilters}>清除筛选</button> : null}
      </section>
    );
  }

  return (
    <>
      <div className="prompt-grid" aria-live="polite">
        {visiblePrompts.map((prompt) => (
          <PromptCard key={prompt.id} prompt={prompt} query={query} onOpen={onOpen} />
        ))}
        {hasMore
          ? Array.from({ length: Math.min(8, prompts.length - loadedCount) }).map((_, i) => (
              <div key={`skeleton-${i}`} className="prompt-card prompt-card--skeleton" aria-hidden="true">
                <div className="skeleton skeleton--image" />
                <div className="skeleton skeleton--line" />
                <div className="skeleton skeleton--line skeleton--short" />
              </div>
            ))
          : null}
      </div>
      {hasMore ? <div ref={loadMoreRef} className="prompt-load-sentinel" aria-hidden="true" /> : null}
    </>
  );
}
