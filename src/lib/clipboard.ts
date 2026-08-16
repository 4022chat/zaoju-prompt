/**
 * 复制文本到剪贴板
 *
 * 优先使用 Clipboard API，降级到 execCommand 兜底。
 * 从 PromptDetail 抽离，便于多个组件复用且不破坏懒加载拆包。
 */
export async function copyPromptText(
  text: string,
  clipboard: Pick<Clipboard, 'writeText'> | undefined = window.navigator.clipboard,
): Promise<void> {
  if (clipboard?.writeText) {
    await clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.append(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  textarea.remove();

  if (!copied) {
    throw new Error('The browser denied the copy request.');
  }
}
