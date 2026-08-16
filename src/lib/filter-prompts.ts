import { prompts } from '../data/prompts';
import type { CategoryId, DisplayPrompt } from '../data/types';

export interface PromptFilters {
  query: string;
  category: CategoryId | 'all';
  tags?: string[];
}

function matchesQuery(prompt: DisplayPrompt, normalizedQuery: string): boolean {
  if (!normalizedQuery) {
    return true;
  }

  const searchableText = [prompt.title, prompt.prompt, prompt.description, ...prompt.tags]
    .join(' ')
    .toLocaleLowerCase('zh-CN');

  return searchableText.includes(normalizedQuery);
}

function matchesTags(prompt: DisplayPrompt, tags: string[]): boolean {
  if (tags.length === 0) {
    return true;
  }

  return tags.some((tag) => prompt.tags.includes(tag));
}

export function filterPrompts(
  prompts: readonly DisplayPrompt[],
  { query, category, tags = [] }: PromptFilters,
): DisplayPrompt[] {
  const normalizedQuery = query.trim().toLocaleLowerCase('zh-CN');

  return prompts.filter((prompt) => {
    const matchesCategory = category === 'all' || prompt.categoryId === category;
    return matchesCategory && matchesQuery(prompt, normalizedQuery) && matchesTags(prompt, tags);
  });
}

const tagCounts = new Map<string, number>();
for (const prompt of prompts) {
  for (const tag of prompt.tags) {
    tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
  }
}

export const popularTags: string[] = [...tagCounts.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, 24)
  .map(([tag]) => tag);

export function getTagCount(tag: string): number {
  return tagCounts.get(tag) ?? 0;
}
