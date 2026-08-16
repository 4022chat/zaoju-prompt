export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <span className="site-footer__mark" aria-hidden="true">造剧</span>
          <div>
            <strong>造剧提示词</strong>
            <p>由 <a href="https://www.zaoju.vip" target="_blank" rel="noopener noreferrer">www.zaoju.vip</a> 提供此 <a href="https://github.com/4022chat/zaoju-prompt" target="_blank" rel="noopener noreferrer">开源项目</a></p>
          </div>
        </div>
        <div className="site-footer__meta">
          <span>持续收集创作灵感</span>
          <span aria-hidden="true">·</span>
          <span>© {year} 造剧提示词</span>
        </div>
      </div>
    </footer>
  );
}
