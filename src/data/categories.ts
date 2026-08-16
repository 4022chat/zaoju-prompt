import type { CategoryId, PromptCategory } from './types';

export const categories: readonly PromptCategory[] = [
  { id: 'expression', label: '表情演技', shortLabel: '表情' },
  { id: 'action', label: '动作招式', shortLabel: '动作' },
  { id: 'finisher', label: '术法大招', shortLabel: '术法大招' },
  { id: 'ancient-outfit', label: '古风服饰', shortLabel: '古风' },
  { id: 'modern-outfit', label: '现代服饰', shortLabel: '现代' },
  { id: 'hairstyle', label: '人物发型', shortLabel: '发型' },
  { id: 'prop', label: '关键道具', shortLabel: '道具' },
  { id: 'scene', label: '场景空间', shortLabel: '场景' },
];

export const categoryById = new Map<CategoryId, PromptCategory>(
  categories.map((category) => [category.id, category]),
);
