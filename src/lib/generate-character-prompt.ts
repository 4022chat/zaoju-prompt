/**
 * 角色提示词生成 - 纯函数
 *
 * 输入：维度规则 + 每个维度的状态（启用 / 候选限定 / 锁定 / 当前值）
 * 输出：拼接后的提示词文本 + 本次各维度实际使用的值（供组件回写状态用于锁定）
 *
 * 设计为纯函数 + 可注入随机数生成器，便于单元测试。
 */

import { characterDimensions, characterPromptTemplate } from '../data/character-rules';
import type { CharacterDimension } from '../data/character-rules';

export type RandomFn = () => number;

export interface DimensionState {
  /** 是否启用该维度 */
  enabled: boolean;
  /** 候选限定：非空时仅从中随机；为空则从全 options 随机 */
  selected: string[];
  /** 锁定：true 时重新生成沿用现有 value，不再随机 */
  locked: boolean;
  /** 当前已生成的值，锁定时沿用；初次为 null */
  value: string | null;
}

export type DimensionStateMap = Record<string, DimensionState>;

export interface GenerateResult {
  /** 拼接后的提示词文本 */
  text: string;
  /** 本次各维度实际使用的值（仅含 enabled 维度） */
  values: Record<string, string>;
}

/**
 * 从候选池中随机取一个元素
 */
function pickRandom<T>(pool: readonly T[], random: RandomFn): T {
  const index = Math.floor(random() * pool.length) % pool.length;
  return pool[index];
}

/**
 * 为单个维度生成本次的值
 */
function resolveDimensionValue(
  dimension: CharacterDimension,
  state: DimensionState,
  random: RandomFn,
): string | null {
  if (!state.enabled) {
    return null;
  }

  // 锁定且已有值 → 沿用，不再随机
  if (state.locked && state.value) {
    return state.value;
  }

  // 候选限定非空 → 仅从中随机；否则从全 options 随机
  const pool = state.selected.length > 0 ? state.selected : dimension.options;
  if (pool.length === 0) {
    return null;
  }
  return pickRandom(pool, random);
}

/**
 * 按模板拼接提示词
 * - 仅替换启用的维度占位符
 * - 未启用维度的占位符连同其绑定前缀一并跳过
 * - 占位符语法：{占位符} 或 {前缀>占位符}
 */
function fillTemplate(
  template: string,
  filled: Map<string, string>,
): string {
  // 用占位符分割模板，逐段判断是否需要保留
  // 占位符格式：{name} 或 {prefix>name}
  const parts = template.split(/(\{[^}]+\})/g);
  const out: string[] = [];

  for (const part of parts) {
    const match = part.match(/^\{([^}]+)\}$/);
    if (!match) {
      // 普通文本段，直接保留
      out.push(part);
      continue;
    }

    const inner = match[1];
    // 解析 {前缀>占位符} 语法
    const bound = inner.split('>');
    const placeholder = bound.length > 1 ? bound.slice(1).join('>') : inner;
    const prefix = bound.length > 1 ? bound[0] : '';

    const value = filled.get(placeholder);
    if (value) {
      // 有值：输出「前缀 + 值」（前缀为空时只输出值）
      out.push(prefix ? `${prefix}${value}` : value);
    }
    // 未填充的占位符跳过（含其绑定前缀，整段丢弃）
  }

  // 清理因跳过占位符产生的多余标点
  return out
    .join('')
    // 连续逗号（中/英）合并为一个
    .replace(/[，,]{2,}/g, '，')
    // 逗号紧接句号（中/英）→ 句号
    .replace(/[，,]\s*[。.]/g, '。')
    // 行首标点/空白清理
    .replace(/^[，,。.、\s]+/, '')
    // 末尾逗号清理（逗号不该收尾）
    .replace(/[，,]\s*$/, '')
    // 空白紧贴逗号清理
    .replace(/\s+[，,]/g, '，')
    .trim();
}

/**
 * 生成角色提示词
 *
 * @param states 各维度状态
 * @param random 随机数生成器，默认 Math.random（测试可注入确定性函数）
 * @returns 提示词文本 + 各维度本次实际值
 */
export function generateCharacterPrompt(
  states: DimensionStateMap,
  random: RandomFn = Math.random,
): GenerateResult {
  const filled = new Map<string, string>();
  const values: Record<string, string> = {};

  for (const dimension of characterDimensions) {
    const state = states[dimension.id];
    if (!state) {
      continue;
    }
    const value = resolveDimensionValue(dimension, state, random);
    if (value) {
      filled.set(dimension.placeholder, value);
      values[dimension.id] = value;
    }
  }

  const text = fillTemplate(characterPromptTemplate, filled);
  return { text, values };
}

/**
 * 默认禁用的维度 id（其余维度默认启用）
 * 道具、姿态及画面控制维度默认关闭：多数场景下基础人设已足够，用户按需开启
 */
const DEFAULT_DISABLED_DIMENSIONS: ReadonlySet<string> = new Set([
  'ability',
  'prop',
  'pose',
  'scene',
  'lighting',
  'camera',
]);

/**
 * 初始化全部维度的默认状态：默认启用、无候选限定、不锁定、无值
 * 列表中的维度（DEFAULT_DISABLED_DIMENSIONS）除外，默认禁用
 */
export function createDefaultStates(): DimensionStateMap {
  const states: DimensionStateMap = {};
  for (const dimension of characterDimensions) {
    states[dimension.id] = {
      enabled: !DEFAULT_DISABLED_DIMENSIONS.has(dimension.id),
      selected: [],
      locked: false,
      value: null,
    };
  }
  return states;
}
