import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, Copy, Lock, LockOpen, RefreshCw, RotateCcw, Search, Sparkles } from 'lucide-react';
import { characterDimensions, imageTypes } from '../data/character-rules';
import {
  artStyleById,
  artStyleGroupLabels,
  artStyleGroupOrder,
  artStyles,
  artStylesByGroup,
  type ArtStyleGroup,
} from '../data/art-styles';
import {
  createDefaultStates,
  generateCharacterPrompt,
  type DimensionStateMap,
} from '../lib/generate-character-prompt';
import { copyPromptText } from '../lib/clipboard';

const WORKSPACE_URL = import.meta.env.VITE_IMAGE_WORKSPACE_URL || 'https://img.opennex.top';

/** localStorage 持久化 key */
const STORAGE_KEY_STATES = 'zaoju-generator-states';
const STORAGE_KEY_IMAGE_TYPE = 'zaoju-generator-imagetype';
const STORAGE_KEY_ART_STYLE = 'zaoju-generator-artstyle';
const DEFAULT_IMAGE_TYPE_ID = 'turnaround';
/** 默认选中第一个画风（按分组顺序的首个） */
const DEFAULT_ART_STYLE_ID = artStyles[0]?.id ?? null;

/** 从 localStorage 读取维度状态，失败/无记录则返回默认值 */
function loadStates(): DimensionStateMap {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_STATES);
    if (!raw) {
      return createDefaultStates();
    }
    const parsed = JSON.parse(raw) as DimensionStateMap;
    // 合并默认值，防止新增维度时缺字段
    const defaults = createDefaultStates();
    const merged: DimensionStateMap = {};
    for (const id of Object.keys(defaults)) {
      merged[id] = { ...defaults[id], ...(parsed[id] ?? {}) };
    }
    return merged;
  } catch {
    return createDefaultStates();
  }
}

/** 从 localStorage 读取图类型 id */
function loadImageTypeId(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY_IMAGE_TYPE) ?? DEFAULT_IMAGE_TYPE_ID;
  } catch {
    return DEFAULT_IMAGE_TYPE_ID;
  }
}

/** 从 localStorage 读取画风 id，无记录则取默认（第一个画风） */
function loadArtStyleId(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY_ART_STYLE) ?? DEFAULT_ART_STYLE_ID;
  } catch {
    return DEFAULT_ART_STYLE_ID;
  }
}

/**
 * 角色提示词生成器
 *
 * 左右双栏布局：
 * - 左栏：维度控制（开关 / 候选 / 锁定）+ 重置按钮
 * - 右栏（sticky）：生成按钮 + 图类型选择 + 结果输出 + 复制（始终可见）
 *
 * 结果顺序：人设段在上，图类型固定段在下
 * 复制内容：人设段 + 换行 + 图类型段（与显示顺序一致）
 * 默认选中「角色三视图」
 * 维度状态与图类型选择持久化到 localStorage，刷新不丢
 */
export function CharacterGenerator() {
  const [states, setStates] = useState<DimensionStateMap>(() => loadStates());
  const [characterText, setCharacterText] = useState<string>('');
  const [imageTypeId, setImageTypeId] = useState<string | null>(() => loadImageTypeId());
  const [artStyleId, setArtStyleId] = useState<string | null>(() => loadArtStyleId());
  const [styleQuery, setStyleQuery] = useState('');
  const [stylePanelOpen, setStylePanelOpen] = useState(false);
  const [expandedDimId, setExpandedDimId] = useState<string | 'all' | null>(null);
  const [copied, setCopied] = useState(false);

  const enabledCount = useMemo(
    () => Object.values(states).filter((s) => s.enabled).length,
    [states],
  );

  const selectedImageType = imageTypeId ? imageTypes.find((t) => t.id === imageTypeId) ?? null : null;
  const selectedArtStyle = artStyleId ? artStyleById[artStyleId] ?? null : null;

  // 最终输出 = 画风段（若有）+ 人设段 +（换行 + 图类型固定段 | 无）
  // 顺序：画风在最前，人设居中，图类型在下（与显示一致）
  const finalText = useMemo(() => {
    if (!characterText) {
      return '';
    }
    const stylePart = selectedArtStyle ? selectedArtStyle.before : '';
    const characterPart = stylePart ? `${stylePart}${characterText}` : characterText;
    if (!selectedImageType) {
      return characterPart;
    }
    return `${characterPart}\n${selectedImageType.suffix}`;
  }, [characterText, selectedArtStyle, selectedImageType]);

  // 画风搜索过滤
  const filteredArtStyles = useMemo(() => {
    const q = styleQuery.trim().toLowerCase();
    if (!q) {
      return artStyles;
    }
    return artStyles.filter(
      (s) => s.title.toLowerCase().includes(q) || s.before.toLowerCase().includes(q),
    );
  }, [styleQuery]);

  // 初始自动生成一次人设
  useEffect(() => {
    handleGenerate(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 维度状态持久化到 localStorage
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY_STATES, JSON.stringify(states));
    } catch {
      // 忽略写入失败（隐私模式 / 配额满）
    }
  }, [states]);

  // 图类型选择持久化
  useEffect(() => {
    try {
      if (imageTypeId) {
        window.localStorage.setItem(STORAGE_KEY_IMAGE_TYPE, imageTypeId);
      } else {
        window.localStorage.removeItem(STORAGE_KEY_IMAGE_TYPE);
      }
    } catch {
      // 忽略
    }
  }, [imageTypeId]);

  // 画风选择持久化
  useEffect(() => {
    try {
      if (artStyleId) {
        window.localStorage.setItem(STORAGE_KEY_ART_STYLE, artStyleId);
      } else {
        window.localStorage.removeItem(STORAGE_KEY_ART_STYLE);
      }
    } catch {
      // 忽略
    }
  }, [artStyleId]);

  const handleGenerate = useCallback(
    (resetCopied: boolean) => {
      setStates((prev) => {
        const { text, values } = generateCharacterPrompt(prev);
        // 把本次实际值回写，供锁定沿用
        const next: DimensionStateMap = {};
        for (const id of Object.keys(prev)) {
          const s = prev[id];
          next[id] = {
            ...s,
            value: values[id] ?? s.value,
          };
        }
        setCharacterText(text);
        return next;
      });
      if (resetCopied) {
        setCopied(false);
      }
    },
    [],
  );

  const toggleEnabled = (id: string) => {
    setStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], enabled: !prev[id].enabled },
    }));
  };

  const toggleLocked = (id: string) => {
    setStates((prev) => {
      const current = prev[id];

      // 解锁：直接切换 locked 即可
      if (current.locked) {
        return { ...prev, [id]: { ...current, locked: false } };
      }

      // 锁定时确定锁定值，优先级：
      // ① 已选标签的第一个（用户已限定范围，取首个作为锁定目标）
      // ② 现有 value（之前生成过）
      // ③ 随机生成回写（从未生成过）
      let value = current.value;
      let selected = current.selected;

      if (current.selected.length > 0) {
        value = current.selected[0];
        // 锁定后改为单选语义，selected 同步为单值
        selected = [current.selected[0]];
      } else if (!value) {
        const { values } = generateCharacterPrompt(prev);
        value = values[id] ?? current.value;
      }

      return {
        ...prev,
        [id]: { ...current, locked: true, value, selected },
      };
    });
  };

  const toggleSelected = (id: string, option: string) => {
    setStates((prev) => {
      const current = prev[id];

      // 锁定状态：单选 + 立即定值到当前
      // - 选中一个候选 → 把它设为当前锁定值（selected 也同步为单值，用于高亮）
      // - 再次点同一个 → 取消定值（清空 selected 与 value）
      if (current.locked) {
        const isSame = current.selected[0] === option;
        const next = {
          ...prev,
          [id]: {
            ...current,
            selected: isSame ? [] : [option],
            value: isSame ? null : option,
          },
        };
        // 锁定定值后立即重新生成，让结果区同步更新
        // （锁定维度沿用刚定的 value，其他锁定维度也保持，未锁定维度随机）
        const { text, values } = generateCharacterPrompt(next);
        for (const dimId of Object.keys(next)) {
          if (values[dimId] !== undefined) {
            next[dimId] = { ...next[dimId], value: values[dimId] };
          }
        }
        setCharacterText(text);
        return next;
      }

      // 非锁定状态：多选，仅限定随机范围
      const has = current.selected.includes(option);
      const selected = has
        ? current.selected.filter((v) => v !== option)
        : [...current.selected, option];
      return { ...prev, [id]: { ...current, selected } };
    });
  };

  const handleSelectImageType = (id: string) => {
    setImageTypeId((prev) => (prev === id ? null : id));
    setCopied(false);
  };

  const handleSelectArtStyle = (id: string) => {
    setArtStyleId((prev) => (prev === id ? null : id));
    setCopied(false);
    // 选中后自动收起画风面板，省出纵向空间
    setStylePanelOpen(false);
  };

  const handleReset = () => {
    const fresh = createDefaultStates();
    setStates(fresh);
    setImageTypeId(DEFAULT_IMAGE_TYPE_ID);
    setArtStyleId(DEFAULT_ART_STYLE_ID);
    setStyleQuery('');
    setStylePanelOpen(false);
    setCopied(false);
    // 立即用默认状态生成一次人设
    const { text, values } = generateCharacterPrompt(fresh);
    const next: DimensionStateMap = {};
    for (const id of Object.keys(fresh)) {
      next[id] = { ...fresh[id], value: values[id] ?? fresh[id].value };
    }
    setStates(next);
    setCharacterText(text);
  };

  const handleCopy = async () => {
    if (!finalText) {
      return;
    }
    try {
      await copyPromptText(finalText);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="generator">
      <div className="generator__heading">
        <p>CHARACTER PROMPT GENERATOR</p>
        <h1>角色提示词生成器</h1>
        <p className="generator__sub">
          左侧调维度，右侧生成人设、选图类型并复制完整提示词。结果常驻可见，实时跟随你的调整。
        </p>
      </div>

      <div className="generator__layout">
        {/* 左栏：画风 + 维度控制 */}
        <div className="generator__left">
          {/* 画风板块 - 可折叠，收起时只占一行 */}
          <button
            type="button"
            className="style-trigger"
            aria-expanded={stylePanelOpen}
            aria-controls="style-panel"
            onClick={() => setStylePanelOpen((v) => !v)}
          >
            <span className="style-trigger__label">画风</span>
            <span className="style-trigger__value">
              {selectedArtStyle ? selectedArtStyle.title : '未选择'}
            </span>
            <ChevronDown
              aria-hidden="true"
              size={16}
              strokeWidth={1.8}
              className={stylePanelOpen ? 'style-trigger__chevron style-trigger__chevron--open' : 'style-trigger__chevron'}
            />
          </button>
          {stylePanelOpen ? (
            <div id="style-panel" className="style-panel">
              <div className="style-search">
                <Search aria-hidden="true" size={15} strokeWidth={1.8} />
                <input
                  type="search"
                  value={styleQuery}
                  onChange={(e) => setStyleQuery(e.target.value)}
                  placeholder="搜索画风名称…"
                  aria-label="搜索画风"
                />
              </div>
              <div className="style-groups">
                {artStyleGroupOrder.map((group: ArtStyleGroup) => {
                  const items = filteredArtStyles.filter((s) => s.group === group);
                  if (items.length === 0) {
                    return null;
                  }
                  return (
                    <div key={group} className="style-group">
                      <p className="style-group__label">{artStyleGroupLabels[group]}</p>
                      <div className="style-group__chips">
                        {items.map((style) => (
                          <button
                            key={style.id}
                            type="button"
                            className={artStyleId === style.id ? 'style-chip style-chip--active' : 'style-chip'}
                            aria-pressed={artStyleId === style.id}
                            title={style.before}
                            onClick={() => handleSelectArtStyle(style.id)}
                          >
                            {style.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* 人设维度板块 - 紧凑行式 */}
          <div className="generator__panel-head">
            <h2 className="generator__panel-title">人设维度</h2>
            <div className="generator__panel-actions">
              <button
                type="button"
                className="generator__expand-btn"
                onClick={() => setExpandedDimId((current) => (current === 'all' ? null : 'all'))}
                aria-expanded={expandedDimId === 'all'}
                aria-label={expandedDimId === 'all' ? '收起所有维度候选' : '展开所有维度候选'}
                title={expandedDimId === 'all' ? '收起所有候选' : '展开所有候选'}
              >
                <ChevronDown
                  aria-hidden="true"
                  size={14}
                  strokeWidth={1.9}
                  className={expandedDimId === 'all' ? 'generator__expand-icon generator__expand-icon--open' : 'generator__expand-icon'}
                />
                <span>{expandedDimId === 'all' ? '收起' : '展开'}</span>
              </button>
              <span className="generator__count">已启用 {enabledCount} / {characterDimensions.length}</span>
              <button
                type="button"
                className="generator__reset-btn"
                onClick={handleReset}
                title="重置所有设置（画风、维度开关、候选、锁定）"
                aria-label="一键重置所有设置"
              >
                <RotateCcw aria-hidden="true" size={14} strokeWidth={1.9} />
                <span>重置</span>
              </button>
            </div>
          </div>

          <div className="dim-rows">
            {characterDimensions.map((dimension) => {
              const state = states[dimension.id];
              const isAllExpanded = expandedDimId === 'all';
              const isOpen = isAllExpanded || expandedDimId === dimension.id;
              const toggleLabel = isAllExpanded
                ? `仅展开${dimension.label}候选`
                : isOpen
                  ? `收起${dimension.label}候选`
                  : `展开${dimension.label}候选`;
              return (
                <article
                  key={dimension.id}
                  className={
                    !state.enabled
                      ? 'dim-row dim-row--off'
                      : isOpen
                        ? 'dim-row dim-row--open'
                        : 'dim-row'
                  }
                  aria-label={dimension.label}
                >
                  {/* 行头：点空白处展开/收起，开关/锁定在外层常驻 */}
                  <div className="dim-row__head">
                    <button
                      type="button"
                      className="dim-row__toggle-area"
                      aria-expanded={isOpen}
                      aria-label={toggleLabel}
                      title={toggleLabel}
                      onClick={() => setExpandedDimId(expandedDimId === dimension.id ? null : dimension.id)}
                    >
                      <span className="dim-row__name">{dimension.label}</span>
                      <span
                        className={
                          state.enabled
                            ? (state.locked ? 'dim-row__value dim-row__value--locked' : 'dim-row__value')
                            : 'dim-row__value dim-row__value--off'
                        }
                      >
                        {state.enabled ? (state.value || '随机中…') : '已停用'}
                      </span>
                      <ChevronDown
                        aria-hidden="true"
                        size={15}
                        strokeWidth={1.8}
                        className={isOpen ? 'dim-row__chevron dim-row__chevron--open' : 'dim-row__chevron'}
                      />
                    </button>

                    <button
                      type="button"
                      className={state.enabled ? 'dim-toggle dim-toggle--on' : 'dim-toggle'}
                      role="switch"
                      aria-checked={state.enabled}
                      aria-label={state.enabled ? `停用${dimension.label}` : `启用${dimension.label}`}
                      onClick={() => toggleEnabled(dimension.id)}
                    >
                      <span className="dim-toggle__dot" aria-hidden="true" />
                      <span className="dim-toggle__text">{state.enabled ? '启用' : '停用'}</span>
                    </button>

                    <button
                      type="button"
                      className={state.locked ? 'dim-lock dim-lock--on' : 'dim-lock'}
                      aria-pressed={state.locked}
                      aria-label={state.locked ? `解锁${dimension.label}` : `锁定${dimension.label}`}
                      title={
                        state.locked
                          ? state.value
                            ? `已锁定：${state.value}（重新生成时保持不变）`
                            : '已锁定（重新生成时保持不变）'
                          : '锁定后，重新生成时该维度保持不变'
                      }
                      onClick={() => toggleLocked(dimension.id)}
                      disabled={!state.enabled}
                    >
                      {state.locked ? <Lock aria-hidden="true" size={13} strokeWidth={2} /> : <LockOpen aria-hidden="true" size={13} strokeWidth={1.8} />}
                      <span>{state.locked ? '已锁定' : '未锁定'}</span>
                    </button>
                  </div>

                  {/* 展开内容：候选 */}
                  {isOpen ? (
                    <div className="dim-row__body">
                      {state.enabled ? (
                        <div className="dim-row__options" role="group" aria-label={`${dimension.label}候选值`}>
                          {dimension.options.map((option) => {
                            // 候选限制优先；未限制时高亮本次实际生成值，不改变下次随机范围。
                            const active = state.selected.length > 0
                              ? state.selected.includes(option)
                              : state.value === option;
                            return (
                              <button
                                key={option}
                                type="button"
                                className={active ? 'gen-chip gen-chip--active' : 'gen-chip'}
                                aria-pressed={active}
                                onClick={() => toggleSelected(dimension.id, option)}
                              >
                                {option}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="dim-row__hint">该维度已停用，不会出现在提示词中</p>
                      )}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </div>

        {/* 右栏：生成按钮 + 图类型 + 结果（sticky 常驻） */}
        <aside className="generator__right">
          <div className="generator__guide" role="status">
            <Sparkles aria-hidden="true" size={16} strokeWidth={1.8} />
            <span>选择左侧维度，组合专属人设</span>
          </div>
          <button
            type="button"
            className="copy-button generator__generate-btn"
            onClick={() => handleGenerate(true)}
          >
            <RefreshCw aria-hidden="true" size={17} strokeWidth={1.9} />
            <span>{characterText ? '重新生成人设' : '生成人设'}</span>
          </button>

          <div className="generator__panel-head">
            <h2 className="generator__panel-title">目标图类型</h2>
            <span className="generator__step-hint">点击选择，再点取消</span>
          </div>
          <div className="image-type-rail" role="group" aria-label="目标图类型">
            {imageTypes.map((type) => (
              <button
                key={type.id}
                type="button"
                className={imageTypeId === type.id ? 'image-type-chip image-type-chip--active' : 'image-type-chip'}
                aria-pressed={imageTypeId === type.id}
                onClick={() => handleSelectImageType(type.id)}
              >
                {type.label}
              </button>
            ))}
          </div>

          <div className="generator__panel-head generator__panel-head--result">
            <h2 className="generator__panel-title">生成结果{selectedArtStyle ? ` · ${selectedArtStyle.title}` : ''}{selectedImageType ? ` · ${selectedImageType.label}` : ''}</h2>
            <button
              type="button"
              className={copied ? 'prompt-copy__button prompt-copy__button--done' : 'prompt-copy__button'}
              onClick={handleCopy}
              disabled={!finalText}
              aria-label={copied ? '已复制提示词' : '复制完整提示词到剪贴板'}
              title={copied ? '已复制' : '复制完整提示词'}
            >
              {copied ? <Check aria-hidden="true" size={15} strokeWidth={2} /> : <Copy aria-hidden="true" size={15} strokeWidth={1.9} />}
            </button>
          </div>

          {finalText ? (
            <pre className="generator__result">
              {selectedArtStyle ? (
                <span className="generator__result-style">{selectedArtStyle.before}</span>
              ) : null}
              {selectedArtStyle ? (
                <span className="generator__result-sep" aria-hidden="true">——— 角色人设 ———</span>
              ) : null}
              <span className="generator__result-character">{characterText}</span>
              {selectedImageType ? (
                <span className="generator__result-sep" aria-hidden="true">——— 目标图类型固定提示词 ———</span>
              ) : null}
              {selectedImageType ? (
                <span className="generator__result-suffix">{selectedImageType.suffix}</span>
              ) : null}
            </pre>
          ) : (
            <pre className="generator__result generator__result--empty">点击「生成人设」开始拼装你的角色…</pre>
          )}

          <div className="generator__result-actions">
            <button
              type="button"
              className={copied ? 'copy-button copy-button--done generator__copy-btn' : 'copy-button generator__copy-btn'}
              onClick={handleCopy}
              disabled={!finalText}
            >
              {copied ? <Check aria-hidden="true" size={18} strokeWidth={1.9} /> : <Copy aria-hidden="true" size={18} strokeWidth={1.9} />}
              <span>{copied ? '已复制完整提示词' : '复制完整提示词'}</span>
            </button>

            <a
              className="generator__workspace-link"
              href={WORKSPACE_URL}
              target="_blank"
              rel="noreferrer"
            >
              打开生图工作台
            </a>
          </div>

          <p className="generator__tips" aria-hidden="true">
            <Sparkles aria-hidden="true" size={12} strokeWidth={1.8} />
            勾选候选值限定随机范围；锁定满意部分再重新生成微调；选定图类型后复制即得完整提示词。
          </p>
        </aside>
      </div>
    </section>
  );
}
