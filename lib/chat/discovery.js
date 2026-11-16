// Shared, small question pools; choosing an interest never makes a network call.
export const CHAT_INTERESTS = [
  {
    id: 'about',
    label: '认识博主',
    icon: '✧',
    questions: [
      '这是一个什么样的博客？',
      '博主是谁？',
      '这个博客都记录些什么？',
      '第一次来，可以从哪里开始？'
    ]
  },
  {
    id: 'research',
    label: '技术与研究',
    icon: '⌘',
    questions: [
      '推荐几篇技术与研究相关的文章',
      '有哪些关于强化学习的文章？',
      '有哪些 OCR 与文档理解的阅读笔记？',
      '有哪些算法与机器人寻路的文章？'
    ]
  },
  {
    id: 'study',
    label: '课程与学习',
    icon: '▤',
    questions: [
      '推荐几篇课程与学习相关的文章',
      '有哪些人机交互相关的学习记录？',
      '有哪些算法课程的学习笔记？',
      '有哪些课程作业或考试复习记录？'
    ]
  },
  {
    id: 'life',
    label: '生活随笔',
    icon: '❋',
    questions: [
      '推荐几篇生活随笔相关的文章',
      '有哪些旅行记录可以读？',
      '想看看技术之外的日常随笔',
      '有哪些心情随笔可以读？'
    ]
  },
  {
    id: 'wander',
    label: '随便逛逛',
    icon: '↗',
    questions: [
      '随便推荐几篇文章',
      '第一次来，可以从哪里开始？',
      '这个博客都记录些什么？',
      '随机推荐几篇文章'
    ]
  }
]

export function pickQuestions(interest, previous = []) {
  const pool = interest.questions.filter(
    question => !previous.includes(question)
  )
  const candidates = pool.length >= 2 ? pool : interest.questions
  const shuffled = [...candidates]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, 2)
}

export const ARTICLE_QUESTIONS = {
  questions: [
    '这篇文章主要讲了什么？',
    '可以解释一下这篇文章的核心思路吗？',
    '这篇文章有哪些值得记住的要点？',
    '文中提到了哪些局限或待解决的问题？'
  ]
}
