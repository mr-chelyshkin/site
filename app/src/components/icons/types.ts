/** Shared by `BaseIcon` and every named icon that wraps it. */
export interface IconProps {
  size?: number
  /** Accessible name. Without it the icon is decorative and hidden. */
  label?: string
}
