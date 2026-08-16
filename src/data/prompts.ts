import actions from './catalog/action.json';
import ancientOutfits from './catalog/ancient-outfits.json';
import expressions from './catalog/expressions.json';
import finishers from './catalog/finisher.json';
import characterHairstyles from './catalog/character-hairstyles.json';
import modernOutfits from './catalog/modern-outfits.json';
import props from './catalog/props.json';
import scenes from './catalog/scene.json';
import { categoryById } from './categories';
import type { CategoryId, DisplayPrompt, PromptRecord } from './types';

type SourcePromptRecord = PromptRecord | {
  id: string;
  title: string;
  prompt: string;
  description: string;
  coverUrl: string;
  referenceImageUrls: string | string[];
  tags: string | string[];
} | {
  id: string;
  name: string;
  slogan: string;
  prompt: string;
};

function normalizeStringArray(value: string | string[]): string[] {
  return Array.isArray(value) ? value : value === '' ? [] : value.split(',').map((item) => item.trim());
}

function withCategory(categoryId: CategoryId, records: SourcePromptRecord[]): DisplayPrompt[] {
  const category = categoryById.get(categoryId);

  if (!category) {
    throw new Error(`Unknown prompt category: ${categoryId}`);
  }

  return records.map((record) => {
    const normalized: PromptRecord = 'title' in record
      ? {
          ...record,
          referenceImageUrls: normalizeStringArray(record.referenceImageUrls),
          tags: normalizeStringArray(record.tags),
        }
      : {
          id: record.id,
          title: record.name,
          prompt: record.prompt,
          description: record.slogan,
          coverUrl: '',
          referenceImageUrls: [],
          tags: [],
        };

    return {
      ...normalized,
      categoryId,
      categoryLabel: category.label,
    };
  });
}

export const prompts: readonly DisplayPrompt[] = [
  ...withCategory('expression', expressions),
  ...withCategory('action', actions),
  ...withCategory('finisher', finishers),
  ...withCategory('ancient-outfit', ancientOutfits),
  ...withCategory('modern-outfit', modernOutfits),
  ...withCategory('hairstyle', characterHairstyles),
  ...withCategory('prop', props),
  ...withCategory('scene', scenes),
];

export const promptById = new Map(prompts.map((prompt) => [prompt.id, prompt]));
