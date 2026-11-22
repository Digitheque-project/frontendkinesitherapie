'use server'

import { revalidatePath } from 'next/cache'
import { getAccueilPatient } from '@/lib/accueilApi'
import {
  findPatientByNumeroDossier,
  createPatient,
  createRendezVous,
  updatePatient,
  marquerDemandePlanifiee,
} from '@/lib/api'
import { getAuthToken } from '@/lib/auth-server'
import { updateDemandeStatut, updateDemandeRdv } from '@/lib/prescriptionApi'

export interface PlanifierInput {
  prescriptionId: string
  demandeId: string
  patientId: string // ex. CHU-2026-00001 (référence Accueil)
  diagnostic?: string
  renseignements?: string
  typeKine?: string
  urgence?: string
  alertes?: string
  objectifs?: string
  remarques?: string
  nomMedecinPrescripteur?: string
  date: string
  heureDebut: string
  heureFin: string
  type: string
  motif: string
}

export interface PlanifierResult {
  ok: boolean
  message: string
  patientLocalId?: number
  rendezVousId?: number
}

// Orchestration : prescription kiné → patient local → rendez-vous local.
export async function planifierRendezVous(
  input: PlanifierInput,
): Promise<PlanifierResult> {
  try {
    // 1. Réutiliser le patient local s'il existe déjà (par numéro de dossier),
    //    sinon résoudre son identité via le service Accueil et le créer.
    // Jeton du soignant (cookie) : la passerelle l'exige sur /kine.
    const jeton = await getAuthToken()
    let patient = await findPatientByNumeroDossier(input.patientId, jeton)

    // Patient dont une prise en charge précédente a été close : il revient.
    // Patient déjà connu : sa fiche prend les données de la NOUVELLE prescription
    // (diagnostic, objectifs, prescripteur…), seulement les champs fournis.
    if (patient) {
      const maj: Record<string, string> = {}
      const champs: [string, string | undefined][] = [
        ['diagnostic', input.diagnostic || input.typeKine],
        ['urgence', input.urgence],
        ['alertes', input.alertes],
        ['objectifs', input.objectifs],
        ['remarques', input.remarques],
        ['nomMedecinPrescripteur', input.nomMedecinPrescripteur],
      ]
      for (const [k, v] of champs) if (v) maj[k] = v
      if (patient.statut === 'archive') maj.statut = 'actif'
      if (Object.keys(maj).length > 0) patient = await updatePatient(patient.id, maj, jeton)
    }

    if (!patient) {
      const acc = await getAccueilPatient(input.patientId)
      patient = await createPatient({
        numeroDossier: input.patientId,
        nom: acc.nom,
        prenom: acc.prenom || 'Non renseigne',
        sexe: acc.sexe === 'FEMALE' ? 'F' : 'M',
        dateNaissance: acc.dateNaissance,
        adresse: acc.adresse,
        telephone: acc.telephone,
        diagnostic: input.diagnostic || input.typeKine || '',
        antecedents: input.renseignements || '',
        urgence: input.urgence || '',
        alertes: input.alertes || '',
        objectifs: input.objectifs || '',
        remarques: input.remarques || '',
        nomMedecinPrescripteur: input.nomMedecinPrescripteur || '',
        statut: 'actif',
        dateAdmission: new Date().toLocaleDateString('sv-SE'),
      }, jeton)
    }

    // 2. Créer le rendez-vous local rattaché au patient.
    const rdv = await createRendezVous({
      date: input.date,
      heureDebut: input.heureDebut,
      heureFin: input.heureFin,
      type: input.type,
      motif: input.motif || input.typeKine || 'Séance de kinésithérapie',
      statut: 'planifie',
      patientId: patient.id,
    }, jeton)

    // Lien demande ↔ patient dans le backend kiné (fin de prise en charge).
    try {
      await marquerDemandePlanifiee(input.prescriptionId, input.patientId, jeton)
    } catch (e) {
      console.error('[planifierRendezVous] Échec marquerDemandePlanifiee:', e)
    }

    // 3. Best-effort : informer le service prescription de la date, puis du statut.
    try {
      await updateDemandeRdv(input.prescriptionId, input.date, input.heureDebut)
    } catch (e) {
      console.error('[planifierRendezVous] Échec updateDemandeRdv:', e)
    }
    try {
      await updateDemandeStatut(
        input.prescriptionId,
        'PLANIFIEE',
      )
    } catch (e) {
      // non bloquant : le RDV local est déjà créé, mais on log l'échec pour diagnostiquer
      console.error('[planifierRendezVous] Échec updateDemandeStatut:', e)
    }

    // Rafraîchir les pages concernées.
    revalidatePath('/demandes-kine')
    revalidatePath('/patients')
    revalidatePath('/calendrier')

    return {
      ok: true,
      message: `Rendez-vous planifié pour ${patient.prenom} ${patient.nom}.`,
      patientLocalId: patient.id,
      rendezVousId: rdv.id,
    }
  } catch (e: any) {
    return {
      ok: false,
      message: e?.message ?? 'Erreur lors de la planification du rendez-vous.',
    }
  }
}
