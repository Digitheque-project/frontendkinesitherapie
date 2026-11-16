'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import DemandeCard from './DemandeCard'

export default function DemandesKinePage() {
  const [demandes, setDemandes] = useState<any[]>([])
  const [erreur, setErreur] = useState<string | null>(null)
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    fetch('/api/demandes-kine', { cache: 'no-store' })
      .then(async (r) => {
        if (!r.ok) {
          const data = await r.json().catch(() => ({}))
          throw new Error(data.error || `Erreur HTTP ${r.status}`)
        }
        return r.json()
      })
      .then((data) => setDemandes(Array.isArray(data) ? data : []))
      .catch((e) => setErreur(e?.message ?? 'Erreur inconnue'))
      .finally(() => setChargement(false))
  }, [])

  return (
    <AppShell>
      <div>
        <h2 className="text-2xl font-black text-[#004A66] tracking-tight">Demandes de kinésithérapie</h2>
        <p className="text-sm text-[#64748B] mt-1">
          Planifiez un rendez-vous pour chaque demande reçue : le patient et le rendez-vous seront créés automatiquement.
        </p>
        {chargement ? (
          <p className="py-12 text-center text-sm text-[#64748B]">Chargement...</p>
        ) : erreur ? (
          <p className="py-12 text-center text-sm font-semibold text-[#E11D48]">
            Impossible de charger les demandes : {erreur}
          </p>
        ) : demandes.length === 0 ? (
          <div className="mt-6 py-12 text-center text-sm text-[#64748B] bg-white rounded-2xl border border-[#F1F5F9]">
            Aucune demande pour le moment.
          </div>
        ) : (
          <div className="mt-6">
            {demandes.map((demande: any) => (
              <DemandeCard key={demande.id} demande={demande} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
