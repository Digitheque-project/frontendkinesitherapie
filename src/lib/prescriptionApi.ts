import { PRESCRIPTION_API } from '@/lib/gateway';
import { getAuthToken } from '@/lib/auth-server';
// Ce fichier contient les fonctions pour parler avec le backend Prescription
// En-têtes communs : jeton du medecin connecte (la passerelle et le service
// Prescription l'exigent), plus de jeton statique en configuration.
async function prescriptionHeaders(extra: Record<string, string> = {}) {
  const token = await getAuthToken();
  return {
    ...extra,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// Fonction qui récupère toutes les demandes de kiné destinées à notre service
// chuId et serviceId viennent maintenant du token (voir auth-server.ts),
// plus besoin des variables d'environnement CHU_ID / KINE_SERVICE_ID.
export async function getDemandesKine(chuId: string, serviceId: string) {
  const url = `${PRESCRIPTION_API}/kine?serviceIdDest=${serviceId}&chuId=${chuId}`;

  const response = await fetch(url, {
    cache: 'no-store',
    headers: await prescriptionHeaders(),
  });

  if (!response.ok) {
    throw new Error(
      `Erreur lors de la récupération des demandes de kiné (HTTP ${response.status})`,
    );
  }

  const demandes = await response.json();
  return demandes;
}

// Met à jour le statut d'une demande de kiné (best-effort : renvoie l'info au
// service prescription une fois le rendez-vous planifié).
export async function updateDemandeStatut(
  id: string,
  statut: string,
  motif?: string,
) {
  const url = `${PRESCRIPTION_API}/kine/${id}/statut`;

  const response = await fetch(url, {
    method: 'PATCH',
    headers: await prescriptionHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(motif ? { statut, motif } : { statut }),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(
      `Échec de la mise à jour du statut de la demande (HTTP ${response.status})`,
    );
  }

  return response.json().catch(() => ({}));
}
