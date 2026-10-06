import siteContent from './site.json'

export { siteContent }
export type SiteContent = typeof siteContent
export type HomeContent = SiteContent['home']
export type SocialProfiles = SiteContent['socialProfiles']
export type SocialPlatform = keyof SocialProfiles
