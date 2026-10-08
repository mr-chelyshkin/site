/**
 * An address split after its last "@", which stays on the first part, so a
 * line can fold there instead of inside a word.
 */
export function foldAddress(email: string): { first: string; rest: string } {
  const at = email.lastIndexOf('@') + 1
  return { first: email.slice(0, at), rest: email.slice(at) }
}
