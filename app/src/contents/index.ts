import siteContent from './site.json'
import ciPlatformContent from './ci-platform.json'

export { siteContent, ciPlatformContent }
export type CiPlatformContent = typeof ciPlatformContent
export type SiteContent = typeof siteContent
export type HomeContent = SiteContent['home']
export type StackLayer = HomeContent['practice']['layers'][number]
export type Company = HomeContent['commerce']['companies'][number]
export interface Project {
  name: string
  stock: string
  kicker: readonly string[]
  summary: string
  specs: readonly { term: string; value: string }[]
  links: readonly { label: string; href: string }[]
  qr?: string
}
export type SocialProfiles = SiteContent['socialProfiles']
