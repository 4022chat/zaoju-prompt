export type ViewId = 'library' | 'generator';

type HistoryMode = 'push' | 'replace';

export interface UrlState {
  prompt: string | null;
  category: string | null;
  query: string | null;
  tags: string[];
  view: ViewId;
}

export interface LibraryUrlState {
  category: string | null;
  query: string | null;
  tags: readonly string[];
}

export function readUrlState(
  search: string = window.location.search,
  pathname: string = window.location.pathname,
): UrlState {
  const params = new URLSearchParams(search);
  const pathMatch = pathname.match(/^\/prompt\/([^/?#]+)\/?$/);
  const prompt = pathMatch ? decodeURIComponent(pathMatch[1]) : null;
  const viewParam = params.get('view');
  const view: ViewId = viewParam === 'generator' ? 'generator' : 'library';

  return {
    prompt,
    category: params.get('cat'),
    query: params.get('q'),
    tags: params.getAll('tag'),
    view,
  };
}

function writeUrl(url: URL, mode: HistoryMode): void {
  window.history[mode === 'push' ? 'pushState' : 'replaceState']({}, '', url);
}

function buildUrl(clearPromptPath: boolean): URL {
  const url = new URL(window.location.href);

  if (clearPromptPath && url.pathname.startsWith('/prompt/')) {
    url.pathname = '/';
  }

  return url;
}

export function setPromptInUrl(id: string | null): void {
  const url = buildUrl(id === null);
  url.searchParams.delete('prompt');

  if (id) {
    url.pathname = `/prompt/${encodeURIComponent(id)}/`;
  }

  writeUrl(url, 'push');
}

export function setLibraryStateInUrl(
  { category, query, tags }: LibraryUrlState,
  mode: HistoryMode = 'push',
): void {
  const url = buildUrl(false);

  if (category) {
    url.searchParams.set('cat', category);
  } else {
    url.searchParams.delete('cat');
  }

  if (query) {
    url.searchParams.set('q', query);
  } else {
    url.searchParams.delete('q');
  }

  url.searchParams.delete('tag');
  for (const tag of tags) {
    url.searchParams.append('tag', tag);
  }

  writeUrl(url, mode);
}

export function setViewInUrl(view: ViewId): void {
  const url = buildUrl(view === 'generator');

  if (view === 'generator') {
    url.searchParams.set('view', view);
  } else {
    url.searchParams.delete('view');
  }

  writeUrl(url, 'push');
}
