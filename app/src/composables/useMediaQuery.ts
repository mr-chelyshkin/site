import { readonly, ref, type Ref } from 'vue'

const shared = new Map<string, Readonly<Ref<boolean>>>()

export function useMediaQuery(query: string) {
  let match = shared.get(query)
  if (!match) {
    const list = window.matchMedia(query)
    const matches = ref(list.matches)
    list.addEventListener('change', (event) => {
      matches.value = event.matches
    })
    match = readonly(matches)
    shared.set(query, match)
  }
  return match
}
