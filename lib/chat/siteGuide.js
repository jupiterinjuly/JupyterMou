import { getSearchResultHref } from '@/lib/search/resultLink'

const cleanQuestion = question =>
  question
    .trim()
    .replace(/[\s，。！？、,.!?：:]/g, '')
    .replace(/^(你好|请问|请|我想问一下)/, '')
    .toLowerCase()
const homeSource = {
  id: 1,
  title: 'JupyterMou’s Notes｜序秋随笔',
  section: '博客首页',
  href: '/'
}

// Normal retrieval also needs a source for the website identity when a visitor
// phrases an introduction question differently from the quick navigation paths.
export const SITE_PROFILE = {
  title: homeSource.title,
  section: '网站介绍（非单篇文章）',
  href: '/',
  content:
    '本站是 JupyterMou 的个人博客「JupyterMou’s Notes｜序秋随笔」，记录技术学习、文献阅读、课程作业、项目经历和生活随笔。站内问答助手名为「序秋小星球」，可以介绍博客、按兴趣推荐公开文章，并基于文章原文回答阅读问题。单篇文章的内容不代表整个网站的介绍。'
}

// Explicit navigation questions only. Technical questions and instructions must
// still go through grounded retrieval, even if they contain the word “博客”.
export function guideIntent(input) {
  const q = cleanQuestion(input.question)
  if (
    /^(这是(一个)?什么(样的)?(网页|网站|博客)|这是什么地方|这(个|里)(网页|网站|博客)?是(做|干)什么的|这个博客都记录些什么|这个网站有哪些内容|本站有哪些内容|介绍(一下)?(这个|一下这个|本站|这个网站|这个博客|网站|博客)|博主是谁|jupytermou是谁|你是谁|你能做什么|whoareyou|whatisthis(website|site|blog))$/.test(
      q
    )
  )
    return 'intro'
  if (/^(第一次来可以从哪里开始|从哪里开始(读|看)|怎么逛这个博客)$/.test(q))
    return 'start'
  if (input.scope !== 'site') return null
  if (
    !input.history.length &&
    /^(这篇文章(主要)?(讲了什么|讲的是什么|说了什么)|总结(一下)?这篇文章|介绍(一下)?这篇文章)$/.test(
      q
    )
  )
    return 'missing-article'
  if (/^(随便|随机)推荐几篇文章$/.test(q)) return 'wander'
  const match = q.match(/^推荐几篇(技术与研究|课程与学习|生活随笔)相关的文章$/)
  return match
    ? { 技术与研究: 'research', 课程与学习: 'study', 生活随笔: 'life' }[
        match[1]
      ]
    : null
}

export function siteGuideReply(intent) {
  if (intent === 'intro')
    return {
      answer:
        '这里是 JupyterMou 的个人博客「JupyterMou’s Notes｜序秋随笔」，记录技术学习、文献阅读、课程作业、项目经历和生活随笔。[1]\n\n我是「序秋小星球」，可以帮你认识这个博客、按兴趣寻找文章，或在阅读时一起梳理文章里的问题。想先看看哪一类？',
      sources: [homeSource],
      grounded: true,
      kind: 'site-guide'
    }
  if (intent === 'start')
    return {
      answer:
        '欢迎来逛 JupyterMou 的博客「序秋随笔」！[1]\n\n你可以从感兴趣的方向开始：技术与研究、课程与学习，或生活随笔。也可以问我「随便推荐几篇文章」；打开一篇文章后，切到「问当前文章」，我们再一起读。',
      sources: [homeSource],
      grounded: true,
      kind: 'site-guide'
    }
  if (intent === 'missing-article')
    return {
      answer:
        '你现在选择的是全站范围，我还不知道你指的是哪篇文章。可以告诉我文章标题，或打开文章后切到「问当前文章」，我再帮你梳理。',
      sources: [],
      grounded: false,
      kind: 'clarification'
    }
  return null
}

const topics = {
  research: {
    label: '技术与研究',
    pattern:
      /技术|研究|文献|项目|算法|机器人|强化学习|OCR|论文|模型|编程|代码|MAPF|LLM|VLM/i
  },
  study: {
    label: '课程与学习',
    pattern: /课程|作业|考试|复习|学习|人机交互|HCI|MEMS/i
  },
  life: {
    label: '生活随笔',
    pattern: /随笔|生活|旅行|旅游|游记|心情|日常|摄影|世界那么大/i
  },
  wander: { label: '随便逛逛', pattern: /./ }
}

export function recommendPosts(intent, catalog) {
  const topic = topics[intent]
  if (!topic) return null
  const candidates = [...catalog.values()].filter(post =>
    topic.pattern.test(
      [
        post.title,
        post.category,
        ...(Array.isArray(post.tags) ? post.tags : [])
      ].join(' ')
    )
  )
  // Sampling from the authoritative public catalog cannot surface a draft or
  // fabricate an article. No model call or paragraph index is needed.
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[candidates[i], candidates[j]] = [candidates[j], candidates[i]]
  }
  const sources = candidates
    .slice(0, 3)
    .map((post, i) => ({
      id: i + 1,
      title: String(post.title || '未命名文章').slice(0, 180),
      section: post.category || topic.label,
      href: getSearchResultHref({ slug: post.slug || post.id })
    }))
    .filter(
      source =>
        source.href.startsWith('/') &&
        !source.href.startsWith('//') &&
        !/[\\\r\n]/.test(source.href)
    )
  return {
    answer: sources.length
      ? `按「${topic.label}」帮你挑了${sources.length}篇公开文章：\n\n${sources.map(s => `《${s.title}》[${s.id}]`).join('\n')}\n\n点击下方卡片就能开始读。也可以告诉我更具体的兴趣，我再帮你找。`
      : `暂时没有在公开文章目录里找到「${topic.label}」相关的文章。你可以换个兴趣，或告诉我更具体的关键词。`,
    sources,
    grounded: sources.length > 0,
    kind: 'recommendation'
  }
}
