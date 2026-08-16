# 造剧 · AI 漫剧提示词库

面向 AI 漫剧创作的提示词库与角色提示词生成器。项目收录表情演技、动作招式、术法大招、古风服饰、现代服饰、人物发型、关键道具与场景等 8 类共 450+ 条提示词，并提供封面图展示、检索筛选、静态详情页和可组合的人设提示词生成工具。

<p align="center">
  <a href="https://www.zaoju.vip">演示站点</a> ｜
  <a href="https://github.com/opennex/zaoju-prompt">项目仓库</a> ｜
  <a href="./src/data/catalog/">提示词数据</a>
</p>

![首页截图](./public/images/ScreenShot_home.png)


## 功能

### 提示词库

- 8 个分类：表情演技、动作招式、术法大招、古风服饰、现代服饰、人物发型、关键道具、场景空间
- 分类、标签与关键词组合筛选；多标签按 OR 逻辑匹配
- 搜索标题、提示词、描述及标签，并高亮关键词
- 将分类、搜索词、标签、详情和当前视图同步到 URL，支持刷新与分享
- 卡片封面、详情大图与参考图展示；无封面时提供分类占位图
- 详情弹窗支持复制提示词、浏览筛选结果中的相邻记录，并跳转生图工作台
- 浮动操作提供返回顶部和随机重排
- 列表采用按需追加的加载方式，并在初始加载和追加时显示骨架屏

### 精选提示词

| 封面 | 分类 | 标题 | 提示词摘要 |
| --- | --- | --- | --- |
| ![踩空惊恐脸变形](./public/images/expressions/expression-1.png) | 表情演技 | 踩空惊恐脸变形 | 古风少女脚下踩空下坠，惊吓拉长变形的脸部特写，夸张抽象表情与卡通 3D 黏土质感。 |
| ![霸体冲身破防](./public/images/action/action_019.png) | 动作招式 | 霸体冲身破防 | 人物全身绷紧凝聚气势，直接以霸体姿态强行顶进，周身仿佛裹挟厚重气场，无视干扰硬撞破防，画面热血感强|
| ![火焰法天象地](./public/images/finisher/dharma_001.png) | 术法大招 | 火焰法天象地 | 主角施展烈焰法天象地，火神巨像、熔岩裂地与火焰风暴构成仰视镜头下的史诗场面。 |
| ![环形镜湖天宫，环廊飞瀑](./public/images/scene/tianpalace-001.png) | 场景空间 | 环形镜湖天宫，环廊飞瀑 | 中轴对称的悬浮天宫全景，环形镜湖、白玉回廊飞瀑、云海满月与清冷冰蓝光影。 |

### 角色提示词生成器

- 根据时代、性别、种族、身份、外观、服饰、姿态、镜头等多维度随机组合角色设定
- 可启用或停用维度、限定候选范围，以及锁定满意的维度后继续生成
- 按 3D 渲染、2D 插画、真人写实分组选择画风，并支持画风搜索
- 支持角色三视图、半身像、全身像、面部特写等目标图类型
- 维度配置、画风和图类型保存至 `localStorage`
- 可一键复制包含画风、人设及目标图类型的完整提示词，或跳转到生图工作台

### 体验与发布

- 亮色与暗色主题，主题设置持久化并在首屏加载时恢复
- 键盘操作：`Cmd/Ctrl + K` 聚焦搜索，`Esc` 关闭详情；详情弹窗带焦点约束
- 响应式提示词网格，适配手机到宽屏桌面
- 详情页使用懒加载；构建时为全部提示词预渲染静态页，并生成 `sitemap.xml`、`robots.txt` 和 JSON-LD 结构化数据

## 技术栈

| 层面 | 技术 |
| --- | --- |
| 框架 | React + TypeScript |
| 构建 | Vite |
| 图标 | lucide-react |
| 测试 | Vitest + Testing Library + jsdom |
| 静态预渲染 | Node.js 脚本 |
| 包管理 | pnpm |

项目未引入 UI 组件库或状态管理库，样式和应用状态均由项目自身实现。

## 项目结构

```text
zaoju-prompt/
├── index.html                         # HTML 入口、SEO 与初始加载内容
├── public/
│   ├── favicon.svg
│   └── images/                        # 提示词封面图
├── scripts/
│   └── prerender.mjs                  # 详情页预渲染、sitemap 与 robots
├── src/
│   ├── app/                           # 根组件与全局应用样式
│   ├── components/                    # 提示词库、详情、生成器等组件
│   ├── data/
│   │   ├── catalog/                   # 8 个分类的 若干 JSON 数据
│   │   ├── art-styles.ts              # 画风数据
│   │   ├── categories.ts              # 分类定义
│   │   ├── character-rules.ts         # 人设维度与图类型规则
│   │   └── tag-taxonomy.ts            # 标签维度定义
│   ├── lib/                           # 筛选、URL 状态、复制、生成逻辑
│   └── styles/                        # 基础样式
├── tests/                             # Vitest 单元测试
├── .env.example
└── package.json
```

## 快速开始

```bash
pnpm install
cp .env.example .env
pnpm run dev
```

开发服务器启动后，按终端输出的本地地址访问应用。

## 命令

| 命令 | 说明 |
| --- | --- |
| `pnpm run dev` | 启动 Vite 开发服务器 |
| `pnpm run build` | TypeScript 类型检查、构建产物并预渲染全部详情页 |
| `pnpm run test` | 运行单元测试 |
| `pnpm run test:watch` | 以监听模式运行单元测试 |
| `pnpm run check:data` | 校验 `src/data/catalog/` 中的 JSON 数据与 ID、标题唯一性 |

## 环境变量

应用使用以下可选变量：

```bash
# 详情弹窗和生成器的“去生图工作台”链接
VITE_IMAGE_WORKSPACE_URL=https://img.opennex.top

# 构建时用于 sitemap 的完整站点地址
SITE_URL=https://www.zaoju.vip
```

## 数据格式

数据按分类存储在 `src/data/catalog/` 目录下，每个分类一个 JSON 文件：

| 文件 | 分类 | 条数 |
|------|------|------|
| `expressions.json` | 表情演技 | 若干 |
| `finisher.json` | 术法大招 | 若干 |
| `action.json` | 动作招式 | 若干 |
| `ancient-outfits.json` | 古风服饰 | 若干 |
| `modern-outfits.json` | 现代服饰 | 若干 |
| `character-hairstyles.json` | 角色发型 | 若干 |
| `props.json` | 关键道具 | 若干 |
| `scenes.json` | 场景氛围 | 若干 |


标准提示词记录存储在 `src/data/catalog/`，每条记录包含：

```json
{
  "id": "expression-1",
  "title": "踩空惊恐脸变形",
  "prompt": "古风少女，脚下踩空身体下坠，脸因惊吓拉长变形……",
  "description": "脚下踩空身体下坠，脸因惊吓拉长变形……",
  "coverUrl": "/images/expressions/expression-1.png",
  "referenceImageUrls": [],
  "tags": ["脸部表情", "古风少女", "惊恐"]
}
```

运行 `pnpm run check:data` 可检查字段完整性及重复 ID、标题。

## 路由与静态页

- 库视图使用 `cat`、`q` 和重复的 `tag` 查询参数保存筛选状态。
- 详情页路径为 `/prompt/:id/`；构建后为每条记录生成对应的静态 HTML。
- `?view=generator` 可直接打开角色提示词生成器。
- `SITE_URL` 用于生成 sitemap 中的完整 URL；未设置时默认使用 `https://www.zaoju.vip`。

## 测试

测试覆盖数据加载与完整性、提示词筛选、角色提示词组合、URL 状态，以及详情弹窗的复制和键盘交互：

```bash
pnpm run test
```

## 许可证

本项目采用 [MIT License](LICENSE)。
