import { ACCUEIL_API } from '@/lib/gateway'
import { getAuthToken } from '@/lib/auth-server'
// Client pour le backend Accueil (identité des patients)
// Base : passerelle du CHU + /accueil (voir lib/gateway.ts)
// ⚠️ URL non exposée au navigateur : à utiliser uniquement côté serveur.

export interface AccueilPatient {
  id: string
  nom: string
  prenom: string
  sexe: string // 'MALE' | 'FEMALE'
  dateNaissance: string
  cin?: string
  profession?: string
  adresse?: string
  telephone?: string
  contactUrgence?: string
  chuId?: string
}

export async function getAccueilPatient(id: string): Promise<AccueilPatient> {
  // Le service Accueil exige un Bearer JWT : celui du medecin connecte.
  const token = await getAuthToken()
  const res = await fetch(`${ACCUEIL_API}/patients/${id}`, {
    cache: 'no-store',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error(
        `Accueil : 401 — session expiree, reconnectez-vous`,
      )
    }
    throw new Error(
      `Patient "${id}" introuvable côté Accueil (HTTP ${res.status})`,
    )
  }
  return res.json()
}
