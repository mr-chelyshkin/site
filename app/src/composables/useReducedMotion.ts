import { readonly, ref, type Ref } from 'vue'

let shared: Readonly<Ref<boolean>> | undefined

export function useReducedMotion() {
  if (!shared) {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const reduced = ref(query.matches)
    query.addEventListener('change', (event) => {
      reduced.value = event.matches
    })
    shared = readonly(reduced)
  }
  return shared
}
