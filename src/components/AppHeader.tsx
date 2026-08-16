import { useEffect, useRef } from 'react';
import { Search, Library, Sparkles } from 'lucide-react';
import type { ViewId } from '../lib/url-state';
import { ThemeToggle } from './ThemeToggle';

interface AppHeaderProps {
  query: string;
  view: ViewId;
  onQueryChange: (query: string) => void;
  onViewChange: (view: ViewId) => void;
}

const VIEW_TABS: { id: ViewId; label: string; icon: typeof Library }[] = [
  { id: 'library', label: '提示词库', icon: Library },
  { id: 'generator', label: '角色生成器', icon: Sparkles },
];

export function AppHeader({ query, view, onQueryChange, onViewChange }: AppHeaderProps) {
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  return (
    <header className="app-header">
      <div className="header-left">
        <a className="brand" href="/" aria-label="造剧提示词库">
          <span className="brand__mark" aria-hidden="true">造剧</span>
          <span className="brand__copy">
            <strong>造剧提示词</strong>
            <span className="brand__subtitle">学AI漫剧，就来造剧</span>
          </span>
        </a>
      </div>

      <div className="header-center">
        <nav className="view-tabs" aria-label="切换功能">
          {VIEW_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                className={view === tab.id ? 'view-tab view-tab--active' : 'view-tab'}
                aria-pressed={view === tab.id}
                onClick={() => onViewChange(tab.id)}
              >
                <Icon className="view-tab__icon" size={18} strokeWidth={1.8} aria-hidden="true" />
                <span className="view-tab__label">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="header-right">
        {view === 'library' ? (
          <label className="search-field">
            <Search aria-hidden="true" size={18} strokeWidth={1.8} />
            <span className="sr-only">搜索提示词</span>
            <input
              ref={searchRef}
              type="search"
              name="prompt-search"
              autoComplete="off"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="搜索人设、表情、动作…"
            />
            <kbd aria-hidden="true">⌘K</kbd>
          </label>
        ) : null}
        <div className="header-actions">
          <a
            href="https://github.com/4022chat/zaoju-prompt"
            target="_blank"
            rel="noopener noreferrer"
            className="header-icon-link"
            aria-label="在 GitHub 查看开源项目"
            title="GitHub 开源项目"
          >
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.683-.217.683-.483 0-.237-.009-1.025-.013-1.86-2.782.604-3.369-1.18-3.369-1.18-.455-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.004.07 1.532 1.03 1.532 1.03.892 1.529 2.341 1.087 2.91.831.091-.646.349-1.087.635-1.337-2.22-.253-4.555-1.11-4.555-4.944 0-1.092.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.56 9.56 0 0 1 12 6.756a9.56 9.56 0 0 1 2.504.337c1.909-1.294 2.748-1.025 2.748-1.025.545 1.377.202 2.394.1 2.647.64.699 1.028 1.591 1.028 2.683 0 3.843-2.339 4.688-4.566 4.936.359.31.678.919.678 1.852 0 1.338-.012 2.416-.012 2.746 0 .269.18.58.688.482A10.003 10.003 0 0 0 22 12c0-5.523-4.477-10-10-10Z" />
            </svg>
          </a>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
