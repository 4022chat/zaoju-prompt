export interface TagDimension {
  id: string;
  label: string;
  tags: string[];
}

export const tagDimensions: TagDimension[] = [
  {
    id: 'emotion',
    label: '情绪主题',
    tags: [
      '眼神开挂', '脑回路断线', '悬疑惊悚', '心动暧昧', '社死翻车',
      '高燃战斗', '高能夸张', '夸张演绎', '爆笑吐槽', '情绪上头',
      '五官开会', '状态拉满', '抽象变形',
    ],
  },
  {
    id: 'action-type',
    label: '动作类型',
    tags: ['突进与近身类', '空中与连击类', '防御与反制类', '重击与气劲类'],
  },
  {
    id: 'finisher',
    label: '大招主题',
    tags: ['法天象地', '玄幻大招', '仰视镜头', '史诗场面'],
  },
  {
    id: 'frame',
    label: '画面景别',
    tags: ['脸部表情', '面部特写', '半身特写', '全身近景'],
  },
  {
    id: 'character',
    label: '角色',
    tags: ['古风少女', '古风女子', '玄幻少女', '古风女侠'],
  },
  {
    id: 'attribute',
    label: '属性',
    tags: ['女性', '男性', '现代', '古风', '连衣裙', '服饰', '发型', '道具', '幻想', '科幻'],
  },
];

const tagToDimension = new Map<string, string>();
for (const dim of tagDimensions) {
  for (const tag of dim.tags) {
    tagToDimension.set(tag, dim.id);
  }
}

export function getTagDimension(tag: string): string | undefined {
  return tagToDimension.get(tag);
}
