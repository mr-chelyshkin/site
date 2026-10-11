import siteContent from './site.json'

export { siteContent }
export type SiteContent = typeof siteContent
export type HomeContent = SiteContent['home']
export type StackLayer = HomeContent['practice']['layers'][number]
export type Company = HomeContent['commerce']['companies'][number]
export type Project = HomeContent['openSource']['projects'][number]
export type SocialProfiles = SiteContent['socialProfiles']
