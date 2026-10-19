export interface GuideLink {
  label: string
  href: string
}

export interface GuideLabels {
  example: string
  newTab: string
  do: string
  check: string
  copy: string
  copied: string
  more: string
  less: string
}

export interface GuideLayer {
  name: string
  file: string
  text: string
}

export interface GuideLayers {
  label: string
  items: readonly GuideLayer[]
  hops: readonly string[]
  end: string
}

export interface GuideStep {
  id: string
  number: string
  title: string
  why: string
  layers?: GuideLayers | undefined
  actions: readonly string[]
  code?: readonly { label: string; code: string }[]
  check?: string | undefined
  links: readonly GuideLink[]
}
