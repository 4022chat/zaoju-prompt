import { useEffect, useState } from 'react';
import { ArrowUp, Shuffle } from 'lucide-react';

interface BackToTopProps {
  onShuffle: () => void;
}

export function BackToTop({ onShuffle }: BackToTopProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={visible ? 'floating-actions floating-actions--visible' : 'floating-actions'}>
      <button
        type="button"
        className="floating-action"
        onClick={onShuffle}
        aria-label="随机换一组"
        title="随机换一组"
      >
        <Shuffle aria-hidden="true" size={20} strokeWidth={1.8} />
      </button>
      <button
        type="button"
        className="back-to-top"
        onClick={scrollToTop}
        aria-label="返回顶部"
        title="返回顶部"
      >
        <ArrowUp aria-hidden="true" size={20} strokeWidth={1.8} />
      </button>
    </div>
  );
}
