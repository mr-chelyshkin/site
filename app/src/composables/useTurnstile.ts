import { onBeforeUnmount, type Ref } from 'vue'

interface Turnstile {
  render(container: HTMLElement, options: Record<string, unknown>): string
  execute(widget: string): void
  reset(widget: string): void
  remove(widget: string): void
}

declare global {
  interface Window {
    turnstile?: Turnstile
  }
}

const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
const PATIENCE_MS = 30_000

let loading: Promise<Turnstile> | undefined
const load = () =>
  (loading ??= new Promise<Turnstile>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT
    script.async = true
    script.onload = () => {
      if (window.turnstile) resolve(window.turnstile)
      else reject(new Error('Turnstile loaded without its API'))
    }
    script.onerror = () => {
      script.remove()
      loading = undefined
      reject(new Error('Turnstile did not load'))
    }
    document.head.append(script)
  }))

export function useTurnstile(
  container: Readonly<Ref<HTMLElement | null>>,
  siteKey: string,
  action: string,
) {
  let turnstile: Turnstile | undefined
  let widget: string | undefined
  let waiting: { resolve: (token: string) => void; reject: (error: Error) => void } | undefined

  const settle = (outcome: string | Error) => {
    const pending = waiting
    waiting = undefined
    if (typeof outcome === 'string') pending?.resolve(outcome)
    else pending?.reject(outcome)
  }

  async function prepare() {
    turnstile ??= await load()
    if (widget === undefined && container.value) {
      widget = turnstile.render(container.value, {
        sitekey: siteKey,
        action,
        execution: 'execute',
        appearance: 'interaction-only',
        callback: (token: string) => settle(token),
        'error-callback': (code: string) => settle(new Error(`Turnstile failed: ${code}`)),
        'timeout-callback': () => settle(new Error('Turnstile timed out')),
      })
    }
    return turnstile
  }

  async function token() {
    const ready = await prepare()
    if (widget === undefined) throw new Error('Turnstile has nowhere to render')
    const id = widget
    settle(new Error('Turnstile was asked again'))
    return new Promise<string>((resolve, reject) => {
      const giveUp = window.setTimeout(
        () => settle(new Error('Turnstile took too long')),
        PATIENCE_MS,
      )
      waiting = {
        resolve: (value) => {
          clearTimeout(giveUp)
          resolve(value)
        },
        reject: (error) => {
          clearTimeout(giveUp)
          reject(error)
        },
      }
      ready.reset(id)
      ready.execute(id)
    })
  }

  onBeforeUnmount(() => {
    settle(new Error('Turnstile was removed'))
    if (widget !== undefined) turnstile?.remove(widget)
  })

  return { prepare, token }
}
