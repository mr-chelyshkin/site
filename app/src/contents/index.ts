import siteContent from './site.json'
import ciPlatformContent from './ci-platform.json'

export { siteContent, ciPlatformContent }
export type CiPlatformContent = typeof ciPlatformContent
export type SiteContent = typeof siteContent
export type HomeContent = SiteContent['home']
export type StackLayer = HomeContent['practice']['layers'][number]
export type Company = HomeContent['commerce']['companies'][number]
export interface SketchNote {
  title: readonly string[]
  body: readonly string[]
}
export interface ProjectSketch {
  caption: string
  trigger: string
  tasks: readonly string[]
  deploy: string
  rewrite: string
  insert: string
  split: { above: string; below: string }
  notes: readonly SketchNote[]
}
export interface Project {
  name: string
  stock: string
  kicker: readonly string[]
  summary: string
  specs: readonly { term: string; value: string }[]
  links: readonly { label: string; href: string }[]
  qr?: string
  sketch?: ProjectSketch
  stain?: string
}
export type SocialProfiles = SiteContent['socialProfiles']
