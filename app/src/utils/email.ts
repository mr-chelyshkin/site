export function foldAddress(email: string): { first: string; rest: string } {
  const at = email.lastIndexOf('@') + 1
  return { first: email.slice(0, at), rest: email.slice(at) }
}
