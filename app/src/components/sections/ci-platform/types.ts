export interface ExhibitLink {
  label: string
  href: string
}

export interface ExhibitContent {
  id: string
  kicker: readonly string[]
  title: string
  body: readonly string[]
  links?: readonly ExhibitLink[]
  linksLabel?: string
}

export interface ExhibitLabels {
  example: string
  newTab: string
}

export interface GuideLabels extends ExhibitLabels {
  step: string
  do: string
  check: string
  tip: string
  copy: string
  copied: string
}

export interface GuideZones {
  label: string
  reproducible: { label: string; items: readonly string[] }
  gate: string
  privileged: { label: string; items: readonly string[] }
  note: string
}

export interface GuideStep {
  id: string
  number: string
  title: string
  why: string
  actions: readonly string[]
  code?: readonly { label: string; code: string }[]
  table?: { caption: string; rows: readonly { flag: string; note: string }[] }
  zones?: GuideZones
  check: string
  tip?: string
  links: readonly ExhibitLink[]
}
