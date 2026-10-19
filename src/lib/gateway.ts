// Passerelle unique du CHU : toutes les API appelees par ce front (backend
// kinesitherapie, users, prescriptions, accueil) passent par elle ; chaque
// appelant ajoute le prefixe de route du service. Aucune valeur par defaut :
// deplacer la plateforme ne change que cette variable (integree au build).
export const GATEWAY_URL = (process.env.NEXT_PUBLIC_GATEWAY_URL ?? '').trim().replace(/\/+$/, '')

const via = (prefix: string) => (GATEWAY_URL ? `${GATEWAY_URL}${prefix}` : '')

/** Backend kinesitherapie (prefixe de route kine/api). */
export const KINE_API = via('/kine/api')
/** Service utilisateurs. */
export const USER_API = via('/users')
/** Service Prescription. */
export const PRESCRIPTION_API = via('/prescriptions')
/** Service Accueil. */
export const ACCUEIL_API = via('/accueil')

/** Page de connexion du portail CHU. */
export const LOGIN_URL = (process.env.NEXT_PUBLIC_LOGIN_URL ?? '').trim()
