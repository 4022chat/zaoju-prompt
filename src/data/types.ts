export type CategoryId =
  | 'expression'
  | 'action'
  | 'finisher'
  | 'ancient-outfit'
  | 'modern-outfit'
  | 'hairstyle'
  | 'prop'
  | 'scene';

export interface PromptRecord {
  id: string;
  title: string;
  prompt: string;
  description: string;
  coverUrl: string;
  referenceImageUrls: string[];
  tags: string[];
}

export interface PromptCategory {
  id: CategoryId;
  label: string;
  shortLabel: string;
}

export interface DisplayPrompt extends PromptRecord {
  categoryId: CategoryId;
  categoryLabel: string;
}
