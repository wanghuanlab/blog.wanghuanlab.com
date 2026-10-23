/**
 * 站点基础信息的唯一维护入口。
 * 组件、SEO、RSS、Sitemap 均从这里读取，不要在其他位置硬编码。
 * 正式域名可通过环境变量 NUXT_PUBLIC_SITE_URL 覆盖（构建时生效）。
 */

export type SocialIcon = 'github' | 'mail' | 'rss'

export interface SocialLink {
  name: string
  url: string
  icon: SocialIcon
}

export interface NavItem {
  label: string
  to: string
}

export interface SiteConfig {
  name: string
  tagline: string
  description: string
  url: string
  locale: string
  author: {
    name: string
    email: string
  }
  github: string
  email: string
  ogImage: string
  twitterHandle: string
  socialLinks: SocialLink[]
  nav: NavItem[]
  homeTitle: string
  homeDescription: string
  homeLatestCount: number
  homeCategoryCount: number
  relatedPostCount: number
  categoryDescriptions: Record<string, string>
}

const github = 'https://github.com/wanghuanlab'
const email = 'hello@wanghuanlab.com'

export const siteConfig: SiteConfig = {
  name: 'WangHuan Lab',
  tagline: 'Software · Architecture · AI · Engineering',
  description: '记录软件工程、系统架构、AI、大数据与工程实践。',
  url: 'https://blog.wanghuanlab.com',
  locale: 'zh-CN',
  author: {
    name: 'Wang Huan',
    email,
  },
  github,
  email,
  ogImage: '/og-default.png',
  twitterHandle: '',
  socialLinks: [
    { name: 'GitHub', url: github, icon: 'github' },
    { name: 'Email', url: `mailto:${email}`, icon: 'mail' },
    { name: 'RSS', url: '/rss.xml', icon: 'rss' },
  ],
  nav: [
    { label: '首页', to: '/' },
    { label: '文章', to: '/posts' },
    { label: '分类', to: '/categories' },
    { label: '标签', to: '/tags' },
    { label: '归档', to: '/archives' },
    { label: '关于', to: '/about' },
    { label: '搜索', to: '/search' },
  ],
  homeTitle: '软件工程与 AI 实践',
  homeDescription: '记录系统设计、代码实现与 AI 应用中的技术取舍和实践经验。',
  homeLatestCount: 8,
  homeCategoryCount: 6,
  relatedPostCount: 3,
  categoryDescriptions: {
    'Java': 'Java 语言特性、JVM 与并发编程',
    'Spring': 'Spring Boot、Spring Cloud 与微服务治理',
    'Database': 'PostgreSQL、MySQL、Redis 的设计与调优',
    'Big Data': 'Kafka、Flink 与实时/离线数据处理',
    'AI': 'LLM、RAG、Agent、MCP 与模型工程',
    'Frontend': 'Vue、TypeScript 与前端工程化',
    'DevOps': 'Docker、Kubernetes、Linux 与交付流水线',
    'Architecture': '系统架构设计、取舍与演进',
  },
}
