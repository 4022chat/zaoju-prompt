import type { DisplayPrompt } from '../data/types';
import { highlightText } from '../lib/highlight';
import { PromptImage } from './PromptImage';

interface PromptCardProps {
  prompt: DisplayPrompt;
  query: string;
  onOpen: (id: string, element: HTMLButtonElement) => void;
}

const ATTRIBUTE_TAGS = new Set([
  'modern', 'ancient', 'dress', 'outfit', 'hairstyle', 'prop', 'fantasy', 'sci-fi',
]);

const GENERIC_TAGS = new Set(['脸部表情', '面部特写', '半身特写', '全身近景']);

function pickDisplayTags(tags: string[], max: number): string[] {
  return tags.filter((tag) => !ATTRIBUTE_TAGS.has(tag) && !GENERIC_TAGS.has(tag) && !tag.endsWith('类')).slice(0, max);
}

function pickPrimaryTag(tags: string[]): string | null {
  return tags.find((tag) => !ATTRIBUTE_TAGS.has(tag) && !GENERIC_TAGS.has(tag) && !tag.endsWith('类')) ?? null;
}

function getDescription(prompt: DisplayPrompt): string {
  if (prompt.description && !prompt.description.startsWith('别称：')) {
    return prompt.description;
  }

  const excerpt = prompt.prompt.slice(0, 42);
  return excerpt.length < prompt.prompt.length ? excerpt + '…' : excerpt;
}

export function PromptCard({ prompt, query, onOpen }: PromptCardProps) {
  const displayTags = pickDisplayTags(prompt.tags, 3);
  const primaryTag = pickPrimaryTag(prompt.tags);
  const description = getDescription(prompt);
  const hasCover = Boolean(prompt.coverUrl);

  return (
    <article className="prompt-card">
      <button
        className="prompt-card__trigger"
        type="button"
        onClick={(event) => onOpen(prompt.id, event.currentTarget)}
        aria-label={`查看提示词：${prompt.title}`}
      >
        {hasCover ? (
          <div className="prompt-card__image">
            <PromptImage src={prompt.coverUrl} title={prompt.title} categoryId={prompt.categoryId} />
            <span className="prompt-card__category">{prompt.categoryLabel}</span>
            {primaryTag ? <span className="prompt-card__primary">{primaryTag}</span> : null}
            <div className="prompt-card__overlay">
              <div className="prompt-card__main">
                <h2>{highlightText(prompt.title, query)}</h2>
                <p>{highlightText(description, query)}</p>
                {displayTags.length > 0 ? (
                  <div className="prompt-card__tags">
                    {displayTags.map((tag) => (
                      <span key={tag} className="prompt-card__tag">{tag}</span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : (
          <div className={`prompt-card__body prompt-card__body--${prompt.categoryId}`}>
            <div className="prompt-card__topbar">
              <span className="prompt-card__category">{prompt.categoryLabel}</span>
              {primaryTag ? <span className="prompt-card__primary">{primaryTag}</span> : null}
            </div>
            <div className="prompt-card__main">
              <h2>{highlightText(prompt.title, query)}</h2>
              <p>{highlightText(description, query)}</p>
              {displayTags.length > 0 ? (
                <div className="prompt-card__tags">
                  {displayTags.map((tag) => (
                    <span key={tag} className="prompt-card__tag">{tag}</span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        )}
      </button>
    </article>
  );
}
