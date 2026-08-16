import { useMemo, useState } from 'react';
import { prompts } from '../data/prompts';
import { tagDimensions } from '../data/tag-taxonomy';
import type { CategoryId } from '../data/types';
import { getTagCount } from '../lib/filter-prompts';

interface TagRailProps {
  activeTags: string[];
  category: CategoryId | 'all';
  onChange: (tags: string[]) => void;
}

export function TagRail({ activeTags, category, onChange }: TagRailProps) {
  const [expanded, setExpanded] = useState(false);

  const dimensions = useMemo(() => {
    if (category === 'all') {
      return tagDimensions.map((dim) => ({
        ...dim,
        tags: dim.tags.filter((tag) => getTagCount(tag) > 0),
      })).filter((dim) => dim.tags.length > 0);
    }

    const categoryPromptTags = new Set<string>();
    for (const prompt of prompts) {
      if (prompt.categoryId === category) {
        for (const tag of prompt.tags) {
          categoryPromptTags.add(tag);
        }
      }
    }

    return tagDimensions
      .map((dim) => ({
        ...dim,
        tags: dim.tags.filter((tag) => categoryPromptTags.has(tag)),
      }))
      .filter((dim) => dim.tags.length > 0);
  }, [category]);

  if (dimensions.length === 0) {
    return null;
  }

  const toggle = (tag: string) => {
    if (activeTags.includes(tag)) {
      onChange(activeTags.filter((t) => t !== tag));
    } else {
      onChange([...activeTags, tag]);
    }
  };

  const hasActive = activeTags.length > 0;

  if (!expanded && !hasActive) {
    return (
      <button
        type="button"
        className="tag-toggle"
        onClick={() => setExpanded(true)}
        aria-expanded={false}
      >
        标签筛选
        <span className="tag-toggle__count">{dimensions.reduce((sum, dim) => sum + dim.tags.length, 0)}</span>
      </button>
    );
  }

  return (
    <nav className="tag-rail" aria-label="标签维度筛选">
      <button
        type="button"
        className="tag-rail__collapse"
        onClick={() => setExpanded(false)}
        aria-expanded={true}
      >
        标签筛选
        {hasActive ? <span className="tag-rail__active-count">{activeTags.length} 项</span> : null}
        <span className="tag-rail__hint">{expanded ? '收起' : '展开'}</span>
      </button>

      {expanded ? (
        <div className="tag-rail__groups">
          {dimensions.map((dim) => (
            <div key={dim.id} className="tag-group">
              <span className="tag-group__label">{dim.label}</span>
              <div className="tag-group__tags">
                {dim.tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className={activeTags.includes(tag) ? 'tag-chip tag-chip--active' : 'tag-chip'}
                    onClick={() => toggle(tag)}
                    aria-pressed={activeTags.includes(tag)}
                  >
                    {tag}
                    <span className="tag-chip__count">{getTagCount(tag)}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {hasActive ? (
        <div className="tag-rail__active">
          {activeTags.map((tag) => (
            <button
              key={tag}
              type="button"
              className="tag-chip tag-chip--active"
              onClick={() => toggle(tag)}
            >
              {tag}
              <span className="tag-chip__remove">×</span>
            </button>
          ))}
          <button type="button" className="tag-chip tag-chip--clear" onClick={() => onChange([])}>
            清除全部
          </button>
        </div>
      ) : null}
    </nav>
  );
}
