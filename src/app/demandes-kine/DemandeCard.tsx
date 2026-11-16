'use client'

import { useState } from 'react'
import { planifierRendezVous } from './actions'

const TYPES = ['consultation', 'soin', 'bilan', 'exercice']

export default function DemandeCard({ demande }: { demande: any }) {
  const premiereDemc = Array.isArray(demande.demandes)
    ? demande.demandes[0]
    : null
  const typesKine = Array.isArray(demande.demandes)
    ? demande.demandes.map((d: any) => d.autreKine || d.typeKine).join(', ')
    : ''

  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(
    null,
  )

  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(today)
  const [heureDebut, setHeureDebut] = useState('09:00')
  const [heureFin, setHeureFin] = useState('10:00')
  const [type, setType] = useState('soin')
  const [motif, setMotif] = useState(
    demande.diagnostic || demande.renseignements || typesKine || '',
  )

  async function confirmer() {
    setBusy(true)
    setResult(null)
    const res = await planifierRendezVous({
      prescriptionId: demande.id,
      demandeId: premiereDemc?.id ?? demande.id,
      patientId: demande.patientId,
      diagnostic: demande.diagnostic,
      renseignements: demande.renseignements,
      typeKine: premiereDemc?.typeKine,
      date,
      heureDebut,
      heureFin,
      type,
      motif,
    })
    setResult(res)
    setBusy(false)
    if (res.ok) setOpen(false)
  }

  const champ =
    'w-full px-3 py-2 rounded-xl border border-[#E2E8F0] bg-white text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#006A8C]/20 focus:border-[#006A8C]'
  const libelle = 'block text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-1'

  return (
    <div className="bg-white rounded-2xl border border-[#F1F5F9] shadow-[0px_4px_10px_rgba(0,0,0,0.02)] p-4 mb-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0 text-sm text-[#0F172A]">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span><span className="font-bold">Patient :</span> Non identifié</span>
            <span className="text-[#CBD5E1]">|</span>
            <span><span className="font-bold">Type(s) :</span> {typesKine || '—'}</span>
            <span className="text-[#CBD5E1]">|</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="font-bold">Urgence :</span>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#F0F7FF] text-[#006A8C]">{demande.urgence}</span>
            </span>
          </div>
          <p className="text-[#64748B] mt-1">
            {demande.diagnostic}
            {demande.renseignements ? ` — ${demande.renseignements}` : ''}
          </p>
        </div>
        {!open && (
          <button
            onClick={() => {
              setOpen(true)
              setResult(null)
            }}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#006A8C] hover:bg-[#005a76] text-white text-sm font-bold whitespace-nowrap transition-colors"
          >
            <span className="material-symbols-outlined text-base">event_available</span>
            Planifier RDV
          </button>
        )}
      </div>

      {open && (
        <div className="mt-4 pt-4 border-t border-[#F1F5F9] flex flex-wrap gap-3 items-end">
          <label className="text-sm">
            <span className={libelle}>Date</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={champ}
            />
          </label>
          <label className="text-sm">
            <span className={libelle}>Début</span>
            <input
              type="time"
              value={heureDebut}
              onChange={(e) => setHeureDebut(e.target.value)}
              className={champ}
            />
          </label>
          <label className="text-sm">
            <span className={libelle}>Fin</span>
            <input
              type="time"
              value={heureFin}
              onChange={(e) => setHeureFin(e.target.value)}
              className={champ}
            />
          </label>
          <label className="text-sm">
            <span className={libelle}>Type</span>
            <select value={type} onChange={(e) => setType(e.target.value)} className={champ}>
              {TYPES.map((tp) => (
                <option key={tp} value={tp}>
                  {tp}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm flex-1 min-w-[180px]">
            <span className={libelle}>Motif</span>
            <input
              type="text"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              className={champ}
            />
          </label>
          <button
            onClick={confirmer}
            disabled={busy}
            className="px-4 py-2 rounded-xl bg-[#006A8C] hover:bg-[#005a76] text-white text-sm font-bold transition-colors disabled:bg-[#94A3B8] disabled:cursor-default"
          >
            {busy ? 'Planification…' : 'Confirmer'}
          </button>
          <button
            onClick={() => setOpen(false)}
            disabled={busy}
            className="px-4 py-2 rounded-xl border border-[#E2E8F0] bg-white text-[#475569] text-sm font-bold hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
        </div>
      )}

      {result && (
        <p className={'mt-2 text-sm font-semibold ' + (result.ok ? 'text-emerald-600' : 'text-[#E11D48]')}>
          {result.message}
        </p>
      )}
    </div>
  )
}
