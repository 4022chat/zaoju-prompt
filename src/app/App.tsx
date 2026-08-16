import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { BackToTop } from '../components/BackToTop';
import { AppHeader } from '../components/AppHeader';
import { CategoryRail } from '../components/CategoryRail';
import { CharacterGenerator } from '../components/CharacterGenerator';
import { PromptGallery } from '../components/PromptGallery';
import { SiteFooter } from '../components/SiteFooter';
import { TagRail } from '../components/TagRail';
import { categoryById } from '../data/categories';
import { promptById, prompts } from '../data/prompts';
import type { CategoryId } from '../data/types';
import { filterPrompts } from '../lib/filter-prompts';
import {
  readUrlState,
  setLibraryStateInUrl,
  setPromptInUrl,
  setViewInUrl,
  type ViewId,
} from '../lib/url-state';
import './app.css';

const PromptDetail = lazy(() =>
  import('../components/PromptDetail').then((module) => ({ default: module.PromptDetail })),
);

function parseCategory(value: string | null): CategoryId | 'all' {
  if (value && prompts.some((prompt) => prompt.categoryId === value)) {
    return value as CategoryId;
  }
  return 'all';
}

export function App() {
  const [initialState] = useState(() => readUrlState());
  const [query, setQuery] = useState(initialState.query ?? '');
  const [category, setCategory] = useState<CategoryId | 'all'>(parseCategory(initialState.category));
  const [activeTags, setActiveTags] = useState<string[]>(initialState.tags);
  const [isScrolled, setIsScrolled] = useState(false);
  const [selectedId, setSelectedId] = useState(initialState.prompt);
  const [spotlightOffset, setSpotlightOffset] = useState(0);
  const [view, setView] = useState<ViewId>(initialState.view);
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null);

  const filteredPrompts = useMemo(
    () => filterPrompts(prompts, { query, category, tags: activeTags }),
    [category, query, activeTags],
  );

  const visiblePrompts = useMemo(() => {
    if (filteredPrompts.length === 0 || spotlightOffset === 0) {
      return filteredPrompts;
    }

    const offset = spotlightOffset % filteredPrompts.length;
    return [...filteredPrompts.slice(offset), ...filteredPrompts.slice(0, offset)];
  }, [filteredPrompts, spotlightOffset]);

  const selectedPrompt = selectedId ? promptById.get(selectedId) ?? null : null;

  useEffect(() => {
    if (selectedId && !selectedPrompt) {
      setPromptInUrl(null);
      setSelectedId(null);
    }
  }, [selectedId, selectedPrompt]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const state = readUrlState();
      setQuery(state.query ?? '');
      setCategory(parseCategory(state.category));
      setActiveTags(state.tags);
      setSelectedId(state.prompt);
      setView(state.view);
      setSpotlightOffset(0);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setLibraryStateInUrl({ category: category === 'all' ? null : category, query: value || null, tags: activeTags }, 'replace');
    setSpotlightOffset(0);
  };

  const handleCategoryChange = (value: CategoryId | 'all') => {
    setCategory(value);
    setLibraryStateInUrl({ category: value === 'all' ? null : value, query: query || null, tags: activeTags });
    setSpotlightOffset(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTagsChange = (tags: string[]) => {
    setActiveTags(tags);
    setLibraryStateInUrl({ category: category === 'all' ? null : category, query: query || null, tags });
    setSpotlightOffset(0);
  };

  const clearFilters = () => {
    setQuery('');
    setCategory('all');
    setActiveTags([]);
    setSpotlightOffset(0);
    setLibraryStateInUrl({ category: null, query: null, tags: [] });
  };

  const openPrompt = (id: string, element: HTMLButtonElement) => {
    lastTriggerRef.current = element;
    setPromptInUrl(id);
    setSelectedId(id);
  };

  const closePrompt = () => {
    setPromptInUrl(null);
    setSelectedId(null);
    window.setTimeout(() => lastTriggerRef.current?.focus(), 0);
  };

  const navigatePrompt = (id: string) => {
    setPromptInUrl(id);
    setSelectedId(id);
  };

  const shufflePrompts = () => {
    if (filteredPrompts.length > 1) {
      setSpotlightOffset((offset) => (offset + Math.max(1, Math.floor(Math.random() * filteredPrompts.length))) % filteredPrompts.length);
    }
  };

  const handleViewChange = (next: ViewId) => {
    if (next === view) {
      return;
    }
    setView(next);
    setViewInUrl(next);
  };

  const hasActiveFilters = query.length > 0 || category !== 'all' || activeTags.length > 0;

  return (
    <main className="site-shell">
      <div className={`sticky-nav ${isScrolled ? 'sticky-nav--scrolled' : ''}`}>
        <div className="sticky-nav__header">
          <AppHeader
            query={query}
            view={view}
            onQueryChange={handleQueryChange}
            onViewChange={handleViewChange}
          />
        </div>
        {view === 'library' ? (
          <>
            <div className="sticky-nav__rail">
              <CategoryRail activeCategory={category} onChange={handleCategoryChange} />
            </div>
            <div className="sticky-nav__tags">
              <TagRail activeTags={activeTags} category={category} onChange={handleTagsChange} />
            </div>
          </>
        ) : null}
      </div>
      {view === 'library' ? (
        <section className="content-shell">
          <div className="gallery-heading">
            <div>
              <h1>{category === 'all' ? '灵感片场' : categoryById.get(category)?.label}</h1>
            </div>
            <span>{filteredPrompts.length} 条提示词</span>
          </div>
          <PromptGallery
            prompts={visiblePrompts}
            query={query}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
            onOpen={openPrompt}
          />
        </section>
      ) : (
        <CharacterGenerator />
      )}
      <SiteFooter />
      {view === 'library' ? <BackToTop onShuffle={shufflePrompts} /> : null}
      {view === 'library' && selectedPrompt ? (
        <Suspense fallback={null}>
          <PromptDetail prompt={selectedPrompt} prompts={filteredPrompts} onClose={closePrompt} onNavigate={navigatePrompt} />
        </Suspense>
      ) : null}
    </main>
  );
}
