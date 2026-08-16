import { useEffect, useRef, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Copy, X, Sparkles } from 'lucide-react';
import type { DisplayPrompt } from '../data/types';
import { copyPromptText } from '../lib/clipboard';
import { PromptImage } from './PromptImage';

const WORKSPACE_URL = import.meta.env.VITE_IMAGE_WORKSPACE_URL || 'https://img.opennex.top';

interface PromptDetailProps {
  prompt: DisplayPrompt;
  prompts: readonly DisplayPrompt[];
  onClose: () => void;
  onNavigate: (id: string) => void;
}

export function PromptDetail({ prompt, prompts, onClose, onNavigate }: PromptDetailProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const [copied, setCopied] = useState(false);
  const currentIndex = prompts.findIndex((item) => item.id === prompt.id);
  const previousPrompt = currentIndex > 0 ? prompts[currentIndex - 1] : null;
  const nextPrompt = currentIndex >= 0 && currentIndex < prompts.length - 1 ? prompts[currentIndex + 1] : null;

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  useEffect(() => {
    previouslyFocusedElementRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeButtonRef.current?.focus();

    return () => {
      if (previouslyFocusedElementRef.current?.isConnected) {
        previouslyFocusedElementRef.current.focus();
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) {
        return;
      }

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), [href], textarea, input, select'),
      );
      const first = focusable[0];
      const last = focusable.at(-1);

      if (!first || !last) {
        return;
      }

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    setCopied(false);
  }, [prompt.id]);

  const handleCopy = async () => {
    try {
      await copyPromptText(prompt.prompt);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const handleGoToWorkspace = () => {
    window.open(WORKSPACE_URL, '_blank', 'noopener,noreferrer');
    // 带提示词跳转参数
    // const url = new URL(WORKSPACE_URL);
    // url.searchParams.set('prompt', prompt.prompt);
    // window.open(url.toString(), '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="detail-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) {
        onClose();
      }
    }}>
      <section className="prompt-detail" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="prompt-detail-title">
        <header className="prompt-detail__bar">
          <span>{prompt.categoryLabel}</span>
          <button ref={closeButtonRef} type="button" className="icon-button" onClick={onClose} aria-label="关闭详情" title="关闭详情">
            <X aria-hidden="true" size={20} strokeWidth={1.8} />
          </button>
        </header>

        <div className="prompt-detail__body">
          <div className="prompt-detail__visual">
            <div className="prompt-detail__image">
              <PromptImage src={prompt.coverUrl} title={prompt.title} categoryId={prompt.categoryId} priority />
            </div>
            {prompt.referenceImageUrls.length > 0 ? (
              <div className="reference-strip" aria-label="参考图片">
                {prompt.referenceImageUrls.map((url, index) => (
                  <img key={url} src={url} alt={`${prompt.title}参考图 ${index + 1}`} loading="lazy" decoding="async" width={64} height={64} />
                ))}
              </div>
            ) : null}
          </div>

          <div className="prompt-detail__content">
            <p className="detail-eyebrow">AI MANGA PROMPT</p>
            <h2 id="prompt-detail-title">{prompt.title}</h2>
            {prompt.description ? <p className="detail-description">{prompt.description}</p> : null}
            <div className="tag-list" aria-label="标签">
              {prompt.tags.map((tag) => <span key={tag}>{tag}</span>)}
            </div>
            <div className="prompt-copy">
              <div className="prompt-copy__heading">
                <div className="prompt-copy__meta">
                  <p>提示词</p>
                  <span>{prompt.prompt.length} 字符</span>
                </div>
                <button
                  type="button"
                  className={copied ? 'prompt-copy__button prompt-copy__button--done' : 'prompt-copy__button'}
                  onClick={handleCopy}
                  aria-label={copied ? '已复制提示词' : '复制提示词到剪贴板'}
                  title={copied ? '已复制' : '复制提示词'}
                >
                  {copied ? <Check aria-hidden="true" size={14} strokeWidth={2} /> : <Copy aria-hidden="true" size={14} strokeWidth={1.9} />}
                  <span>{copied ? '已复制' : '复制'}</span>
                </button>
              </div>
              <pre tabIndex={0} aria-label="提示词内容">{prompt.prompt}</pre>
            </div>
          </div>
        </div>

        <footer className="prompt-detail__footer">
          <div className="detail-pagination" aria-label="浏览相邻提示词">
            <button type="button" onClick={() => previousPrompt && onNavigate(previousPrompt.id)} disabled={!previousPrompt} aria-label="上一条提示词" title="上一条提示词">
              <ChevronLeft aria-hidden="true" size={18} strokeWidth={1.8} />
            </button>
            <span>{currentIndex >= 0 ? `${currentIndex + 1} / ${prompts.length}` : ''}</span>
            <button type="button" onClick={() => nextPrompt && onNavigate(nextPrompt.id)} disabled={!nextPrompt} aria-label="下一条提示词" title="下一条提示词">
              <ChevronRight aria-hidden="true" size={18} strokeWidth={1.8} />
            </button>
          </div>
          <div className="detail-actions">
            <button type="button" className="workspace-button" onClick={handleGoToWorkspace} aria-label="前往生图工作台">
              <Sparkles aria-hidden="true" size={18} strokeWidth={1.9} />
              <span>打开生图工作台</span>
            </button>
          </div>
          <span className="sr-only" aria-live="polite">{copied ? '提示词已复制' : ''}</span>
        </footer>
      </section>
    </div>
  );
}
