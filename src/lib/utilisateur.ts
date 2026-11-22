export interface UtilisateurConnecte {
  prenom: string
  nom: string
  displayName: string
  initiales: string
  /** Rôle de l'agent dans ce service (services[].roleName du jeton). */
  role: string
  /** Logo du CHU, tel que fourni par le jeton (jamais figé dans le code). */
  chuLogoUrl: string
}

interface ServiceJeton {
  serviceId?: string
  roleName?: string
  baseUrl?: string | null
  chu?: { logoUrl?: string | null } | null
}

/** Entrée du jeton correspondant à ce front (même origine, sinon service mémorisé). */
function serviceIci(services: ServiceJeton[]): ServiceJeton | undefined {
  const ici = services.filter((s) => {
    try {
      return !!s.baseUrl && new URL(s.baseUrl).origin === window.location.origin
    } catch {
      return false
    }
  })
  let memorise: string | null = null
  try {
    memorise = localStorage.getItem('serviceId')
  } catch {}
  return (
    ici.find((s) => s.serviceId === memorise) ??
    ici[0] ??
    services.find((s) => s.serviceId === memorise)
  )
}

export function utilisateurVide(): UtilisateurConnecte {
  return { prenom: '', nom: '', displayName: 'Utilisateur', initiales: 'U', role: '', chuLogoUrl: '' }
}

export function getUtilisateurConnecte(): UtilisateurConnecte {
  const defaut = utilisateurVide()
  if (typeof window === 'undefined') return defaut

  try {
    const token = localStorage.getItem('authToken')
    if (!token) return defaut
    const payload = token.split('.')[1]
    const binaire = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    const decoded = new TextDecoder('utf-8').decode(Uint8Array.from(binaire, (c) => c.charCodeAt(0)))
    const data = JSON.parse(decoded)

    const prenom = (data.firstname || '').trim()
    const nom = (data.name || '').trim()
    const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s

    const displayName = [capitalize(prenom), capitalize(nom)].filter(Boolean).join(' ') || 'Utilisateur'
    const initiales = ((prenom[0] || '') + (nom[0] || '')).toUpperCase() || 'U'

    const services: ServiceJeton[] = Array.isArray(data.services) ? data.services : []
    const ici = serviceIci(services)
    const role = (ici?.roleName || '').trim()
    const chuLogoUrl =
      ici?.chu?.logoUrl ||
      services.find((s) => s.chu?.logoUrl)?.chu?.logoUrl ||
      data.chuLogoUrl ||
      ''

    return { prenom: capitalize(prenom), nom: capitalize(nom), displayName, initiales, role, chuLogoUrl }
  } catch {
    return defaut
  }
}
