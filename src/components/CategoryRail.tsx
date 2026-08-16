import { Smile, Zap, Flame, Shirt, Flower2, Scissors, Package, Mountain, Grid3x3 } from 'lucide-react';
import { categories } from '../data/categories';
import type { CategoryId } from '../data/types';

interface CategoryRailProps {
  activeCategory: CategoryId | 'all';
  onChange: (category: CategoryId | 'all') => void;
}

const CATEGORY_ICONS: Record<CategoryId | 'all', typeof Smile> = {
  all: Grid3x3,
  expression: Smile,
  action: Zap,
  finisher: Flame,
  'ancient-outfit': Flower2,
  'modern-outfit': Shirt,
  hairstyle: Scissors,
  prop: Package,
  scene: Mountain,
};

export function CategoryRail({ activeCategory, onChange }: CategoryRailProps) {
  return (
    <nav className="category-rail" aria-label="提示词分类">
      <button
        className={activeCategory === 'all' ? 'category-chip category-chip--active' : 'category-chip'}
        type="button"
        onClick={() => onChange('all')}
        aria-pressed={activeCategory === 'all'}
      >
        <Grid3x3 className="category-chip__icon" size={16} strokeWidth={1.8} aria-hidden="true" />
        <span className="category-chip__text">全部</span>
      </button>
      {categories.map((category) => {
        const Icon = CATEGORY_ICONS[category.id];
        return (
          <button
            className={activeCategory === category.id ? 'category-chip category-chip--active' : 'category-chip'}
            type="button"
            key={category.id}
            onClick={() => onChange(category.id)}
            aria-label={category.label}
            aria-pressed={activeCategory === category.id}
          >
            <Icon className="category-chip__icon" size={16} strokeWidth={1.8} aria-hidden="true" />
            <span className="category-chip__text category-chip__text--full" aria-hidden="true">
              {category.label}
            </span>
            <span className="category-chip__text category-chip__text--short" aria-hidden="true">
              {category.shortLabel}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
