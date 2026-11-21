// Client API pour le backend Kinésithérapie (NestJS)
// Base : passerelle du CHU + /kine/api (voir lib/gateway.ts)

import type { Patient, PaginatedResponse, Rendezvous } from '@/types'
import { KINE_API } from '@/lib/gateway'
import { kineFetch } from '@/lib/kine-fetch'

const API_URL = KINE_API

// `jeton` : à fournir côté serveur (actions), où le stockage du navigateur
// n'existe pas ; côté navigateur, kineFetch prend celui du soignant connecté.
async function apiFetch<T>(path: string, jeton?: string): Promise<T> {
  const res = await kineFetch(`${API_URL}${path}`, { cache: 'no-store' }, jeton)
  if (!res.ok) {
    throw new Error(`Erreur API ${res.status} sur ${path}`)
  }
  return res.json() as Promise<T>
}

async function apiEnvoi<T>(methode: string, path: string, body: unknown, jeton?: string): Promise<T> {
  const res = await kineFetch(
    `${API_URL}${path}`,
    {
      method: methode,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: 'no-store',
    },
    jeton,
  )
  if (!res.ok) {
    throw new Error(`Erreur API ${res.status} sur ${methode} ${path}`)
  }
  return res.json().catch(() => ({})) as Promise<T>
}

const apiPost = <T>(path: string, body: unknown, jeton?: string) => apiEnvoi<T>('POST', path, body, jeton)

// Le backend renvoie un tableau simple ; on filtre et pagine côté client
// pour respecter le contrat PaginatedResponse attendu par les hooks.
export async function getPatients(
  page = 1,
  limit = 20,
  search?: string,
): Promise<PaginatedResponse<Patient>> {
  const all = await apiFetch<Patient[]>('/patients')

  const s = search?.trim().toLowerCase()
  const filtered = s
    ? all.filter((p) =>
        `${p.prenom} ${p.nom}`.toLowerCase().includes(s) ||
        p.numeroDossier?.toLowerCase().includes(s) ||
        p.diagnostic?.toLowerCase().includes(s),
      )
    : all

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const start = (page - 1) * limit
  const data = filtered.slice(start, start + limit)

  return { data, total, page, limit, totalPages }
}

export async function getPatientById(id: number): Promise<Patient> {
  return apiFetch<Patient>(`/patients/${id}`)
}

// ---- Création / recherche de patients ----

export async function getAllPatients(jeton?: string): Promise<Patient[]> {
  return apiFetch<Patient[]>('/patients', jeton)
}

// Recherche un patient local par son numéro de dossier (= patientId Accueil)
export async function findPatientByNumeroDossier(
  numeroDossier: string,
  jeton?: string,
): Promise<Patient | null> {
  const all = await getAllPatients(jeton)
  return all.find((p) => p.numeroDossier === numeroDossier) ?? null
}

// Payload de création : suit le format du backend (peut différer du modèle
// frontend @/types), d'où un typage souple.
export async function createPatient(
  data: Record<string, unknown>,
  jeton?: string,
): Promise<Patient> {
  return apiPost<Patient>('/patients', data, jeton)
}

export async function updatePatient(id: number, data: Record<string, unknown>, jeton?: string): Promise<Patient> {
  return apiEnvoi<Patient>('PUT', `/patients/${id}`, data, jeton)
}

// Marque la demande « planifiée » dans le backend kiné (lien demande ↔ patient,
// utilisé à la fin de la prise en charge).
export async function marquerDemandePlanifiee(prescriptionId: string, patientId: string, jeton?: string): Promise<void> {
  await apiEnvoi('PATCH', `/notifications/prescription/${encodeURIComponent(prescriptionId)}/planifiee`, { patientId }, jeton)
}

// Fin de la prise en charge : demandes planifiées « terminées », patient archivé.
export async function terminerPriseEnCharge(patientId: number): Promise<{ demandesTerminees: number }> {
  return apiPost<{ demandesTerminees: number }>(`/notifications/terminer-patient/${patientId}`, {})
}

// ---- Rendez-vous ----

export async function getRendezVous(): Promise<Rendezvous[]> {
  return apiFetch<Rendezvous[]>('/rendezvous')
}

export async function createRendezVous(
  data: Record<string, unknown>,
  jeton?: string,
): Promise<Rendezvous> {
  return apiPost<Rendezvous>('/rendezvous', data, jeton)
}

// ---- Seances (historique valide, affiche dans Archives) ----
export interface Seance {
  id: number
  patientId: number
  patient?: {
    id: number
    nom: string
    prenom: string
    numeroDossier?: string
    diagnostic?: string
    dateNaissance?: string
    sexe?: string
  }
  date: string
  heureDebut: string
  heureFin: string
  traitement: string
  evolution: string
  conseil: string
  kine: string
  createdAt: string
}

export async function getSeances(): Promise<Seance[]> {
  return apiFetch<Seance[]>('/seances')
}
