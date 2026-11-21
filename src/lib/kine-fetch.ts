// Appels au backend kinésithérapie via la passerelle du CHU. La passerelle
// exige le jeton du soignant connecté sur /kine : sans lui, chaque appel
// recevait « 401 Token manquant » et aucune page du service ne fonctionnait.

/** Jeton du soignant connecté, côté navigateur (rangé par AppShell). */
export function jetonClient(): string | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    return window.localStorage.getItem('authToken') ?? undefined
  } catch {
    return undefined
  }
}

/** fetch avec le jeton du soignant (sauf si l'appelant en fournit un). */
export function kineFetch(input: string, init: RequestInit = {}, jeton?: string): Promise<Response> {
  const headers = new Headers(init.headers)
  const t = jeton ?? jetonClient()
  if (t && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${t}`)
  return fetch(input, { ...init, headers })
}
