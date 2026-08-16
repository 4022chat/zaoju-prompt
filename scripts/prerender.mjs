import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const distDir = path.join(root, 'dist');

const catalogDir = path.join(root, 'src', 'data', 'catalog');

const categoryLabels = {
  expression: '表情演技',
  action: '动作招式',
  finisher: '终结大招',
  'ancient-outfit': '古风服饰',
  'modern-outfit': '现代服饰',
  hairstyle: '人物发型',
  prop: '关键道具',
  scene: '场景空间',
};

const catalogFiles = {
  expression: 'expressions.json',
  action: 'action.json',
  finisher: 'finisher.json',
  'ancient-outfit': 'ancient-outfits.json',
  'modern-outfit': 'modern-outfits.json',
  hairstyle: 'character-hairstyles.json',
  prop: 'props.json',
  scene: 'scene.json',
};

function normalizeTags(value) {
  return Array.isArray(value) ? value : value ? value.split(',').map((tag) => tag.trim()) : [];
}

function loadAllPrompts() {
  const all = [];
  for (const [categoryId, file] of Object.entries(catalogFiles)) {
    const raw = fs.readFileSync(path.join(catalogDir, file), 'utf-8');
    const items = JSON.parse(raw);
    for (const item of items) {
      const title = item.title ?? item.name ?? '未命名';
      const description = item.description ?? item.slogan ?? '';
      all.push({
        id: item.id,
        title,
        description,
        prompt: item.prompt ?? '',
        tags: normalizeTags(item.tags),
        categoryId,
        categoryLabel: categoryLabels[categoryId] ?? categoryId,
      });
    }
  }
  return all;
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(text) {
  return escapeHtml(text);
}

function generatePromptPage(prompt, template) {
  const title = `${escapeHtml(prompt.title)} · ${escapeHtml(prompt.categoryLabel)} | 造剧 AI 漫剧提示词库`;
  const description = prompt.description
    ? escapeAttr(prompt.description.slice(0, 160))
    : `AI 漫剧${prompt.categoryLabel}提示词：${escapeAttr(prompt.title)}`;
  const canonical = `/prompt/${encodeURIComponent(prompt.id)}/`;

  const tagsHtml = prompt.tags
    .map((tag) => `<span class="prerender-tag">${escapeHtml(tag)}</span>`)
    .join('');

  const rootContent = `
      <div class="prerender-page">
        <nav class="prerender-breadcrumb"><a href="/">造剧 AI 漫剧提示词库</a> / ${escapeHtml(prompt.categoryLabel)}</nav>
        <p class="prerender-eyebrow">${escapeHtml(prompt.categoryLabel)}</p>
        <h1>${escapeHtml(prompt.title)}</h1>
        ${prompt.description ? `<p class="prerender-desc">${escapeHtml(prompt.description)}</p>` : ''}
        <div class="prerender-tags">${tagsHtml}</div>
        <div class="prerender-copy">
          <p>提示词</p>
          <pre>${escapeHtml(prompt.prompt)}</pre>
        </div>
      </div>`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: prompt.title,
    description: prompt.description || `AI 漫剧${prompt.categoryLabel}提示词`,
    keywords: prompt.tags.join(', '),
    category: prompt.categoryLabel,
    url: canonical,
    text: prompt.prompt,
  };

  let html = template
    .replace(/<title>.*?<\/title>/s, `<title>${title}</title>`)
    .replace(
      /<meta\s+name="description"[^>]*>/s,
      `<meta name="description" content="${description}" />`,
    );

  const ogTags = `
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${escapeAttr(prompt.title)} · ${escapeAttr(prompt.categoryLabel)}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:locale" content="zh_CN" />
    <link rel="canonical" href="${canonical}" />
    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`;

  if (html.includes('property="og:type"')) {
    html = html.replace(/\s*<meta\s+property="og:type"[^>]*>[\s\S]*?<meta\s+property="og:locale"[^>]*>/s, ogTags);
  } else {
    html = html.replace('</title>', `</title>\n${ogTags}`);
  }

  html = html.replace(/<div id="root">[\s\S]*?<\/div>/, `<div id="root">${rootContent}\n    </div>`);

  return html;
}

function generateSitemap(prompts, baseUrl) {
  const urls = [
    `  <url>\n    <loc>${baseUrl}/</loc>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>`,
  ];

  for (const prompt of prompts) {
    const loc = `${baseUrl}/prompt/${encodeURIComponent(prompt.id)}/`;
    urls.push(
      `  <url>\n    <loc>${loc}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>`,
    );
  }

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}

function generateRobots(baseUrl) {
  return `User-agent: *\nAllow: /\n\nSitemap: ${baseUrl}/sitemap.xml\n`;
}

const main = () => {
  const templatePath = path.join(distDir, 'index.html');
  if (!fs.existsSync(templatePath)) {
    console.error('[prerender] dist/index.html not found. Run "vite build" first.');
    process.exit(1);
  }

  const template = fs.readFileSync(templatePath, 'utf-8');
  const prompts = loadAllPrompts();
  const baseUrl = process.env.SITE_URL || 'https://www.zaoju.vip';

  console.log(`[prerender] Generating ${prompts.length} prompt pages...`);

  let count = 0;
  for (const prompt of prompts) {
    const html = generatePromptPage(prompt, template);
    const dir = path.join(distDir, 'prompt', prompt.id);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), html);
    count++;
  }

  const sitemap = generateSitemap(prompts, baseUrl);
  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemap);

  const robots = generateRobots(baseUrl);
  fs.writeFileSync(path.join(distDir, 'robots.txt'), robots);

  console.log(`[prerender] Done: ${count} pages + sitemap.xml + robots.txt`);
};

main();
