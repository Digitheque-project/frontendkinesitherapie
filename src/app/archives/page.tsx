'use client'

import { useState, useMemo, useEffect } from 'react'
import AppShell from '@/components/layout/AppShell'
import { useLanguage } from '@/context/LanguageContext'
import { getSeances, type Seance } from '@/lib/api'

export default function ArchivesPage() {
  const { t } = useLanguage()
  const [seances, setSeances] = useState<Seance[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [detailsGroupe, setDetailsGroupe] = useState<{ patientId: number; patient: Seance['patient']; seances: Seance[] } | null>(null)

  useEffect(() => {
    getSeances()
      .then((data) => setSeances(Array.isArray(data) ? data : []))
      .catch(() => setSeances([]))
      .finally(() => setLoading(false))
  }, [])

  const groupes = useMemo(() => {
    const map = new Map<number, { patient: Seance['patient']; seances: Seance[] }>()
    for (const s of seances) {
      if (!s.patient) continue
      const existant = map.get(s.patientId)
      if (existant) {
        existant.seances.push(s)
      } else {
        map.set(s.patientId, { patient: s.patient, seances: [s] })
      }
    }
    return Array.from(map.entries())
      .map(([patientId, v]) => ({ patientId, ...v }))
      .sort((a, b) => (b.seances[0]?.createdAt || '').localeCompare(a.seances[0]?.createdAt || ''))
  }, [seances])

  const filtered = useMemo(() => {
    if (!search.trim()) return groupes
    const s = search.toLowerCase()
    return groupes.filter((g) =>
      g.patient?.nom?.toLowerCase().includes(s) ||
      g.patient?.prenom?.toLowerCase().includes(s) ||
      g.patient?.diagnostic?.toLowerCase().includes(s) ||
      g.patient?.numeroDossier?.toLowerCase().includes(s)
    )
  }, [search, groupes])

  const totalSeances = seances.length

  return (
    <AppShell searchPlaceholder={t('arc_rechercherPlaceholder')} showSearch={false}>

      <div className="mb-6">
        <h2 className="text-2xl font-black text-[#004A66] tracking-tight">{t('arc_titre')}</h2>
        <p className="text-sm text-on-surface-variant mt-1 mb-4">
          {totalSeances} séance{totalSeances > 1 ? 's' : ''} validée{totalSeances > 1 ? 's' : ''} — {filtered.length} patient{filtered.length > 1 ? 's' : ''}
        </p>
        <div className="flex items-center gap-3 bg-surface border border-outline-variant px-4 py-2 rounded-xl max-w-md">
          <span className="material-symbols-outlined text-on-surface-variant text-lg">search</span>
          <input type="text" placeholder={t('arc_rechercherPlaceholder')}
            value={search} onChange={e => setSearch(e.target.value)}
            className="bg-transparent border-none focus:outline-none text-sm w-full text-on-surface placeholder:text-on-surface-variant" />
          {search && (
            <button onClick={() => setSearch('')} className="text-on-surface-variant hover:text-red-500 transition-colors">
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-on-surface-variant">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-sm">{t('arc_chargement')}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((g) => {
              const p = g.patient!
              return (
                <div key={g.patientId}
                  className="rounded-2xl border border-[#F1F5F9] bg-white p-5 shadow-[0px_4px_10px_rgba(0,0,0,0.02)] hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-[#006A8C] font-black text-base flex-shrink-0 bg-[#F0F7FF] border-2 border-[#CFE9EF]">
                      {p.prenom?.[0]}{p.nom?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-[#0F172A] truncate">{p.prenom} {p.nom}</p>
                      <p className="text-[11px] text-[#64748B]">
                        {g.seances.length} séance{g.seances.length > 1 ? 's' : ''} archivée{g.seances.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setDetailsGroupe(g)}
                    className="mt-4 w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#006A8C] text-white text-sm font-bold hover:bg-[#005a76] transition-colors shadow-sm"
                  >
                    <span className="material-symbols-outlined text-base">visibility</span>
                    Voir
                  </button>
                </div>
              )
            })}
          </div>

          {filtered.length === 0 && (
            <div className="py-12 text-center text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl mb-2">inventory_2</span>
              <p>{search ? t('arc_aucunResultat') : t('arc_aucunArchive')}</p>
              {search && (
                <button onClick={() => setSearch('')}
                  className="mt-4 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-[#005a76]">
                  {t('arc_voirTousArchives')}
                </button>
              )}
            </div>
          )}
        </>
      )}

      {detailsGroupe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-[#F1F5F9] shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-[#F1F5F9] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-[#006A8C] font-black bg-[#F0F7FF] border-2 border-[#CFE9EF] flex-shrink-0">
                  {detailsGroupe.patient?.prenom?.[0]}{detailsGroupe.patient?.nom?.[0]}
                </div>
                <div>
                  <h3 className="font-black text-[#004A66]">{detailsGroupe.patient?.prenom} {detailsGroupe.patient?.nom}</h3>
                  <p className="text-xs text-[#64748B]">{detailsGroupe.seances.length} séance{detailsGroupe.seances.length > 1 ? 's' : ''} archivée{detailsGroupe.seances.length > 1 ? 's' : ''}</p>
                </div>
              </div>
              <button onClick={() => setDetailsGroupe(null)} className="text-[#64748B] hover:text-[#0F172A]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {detailsGroupe.seances.map((s) => {
                const p = s.patient
                return (
                  <div key={s.id} className="bg-[#F8F9FB] rounded-2xl border border-[#F1F5F9] p-5">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#E2E8F0]">
                      <span className="material-symbols-outlined text-[#006A8C] text-lg">event</span>
                      <span className="text-sm font-bold text-[#0F172A]">{s.date}</span>
                      <span className="text-sm text-[#94A3B8]">·</span>
                      <span className="text-sm font-mono text-[#64748B]">{(s.heureDebut || '').substring(0,5)} - {(s.heureFin || '').substring(0,5)}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <ChampDetail label="Dr prescripteur" value={(p as any)?.nomMedecinPrescripteur} />
                      <ChampDetail label="Objectif prescripteur" value={(p as any)?.objectifs} />
                      <ChampDetail label="Diagnostic" value={p?.diagnostic} />
                      <ChampDetail label="Bilan kinésithérapie" value={null} enAttente />
                      <ChampDetail label="Traitement" value={s.traitement} />
                      <ChampDetail label="Évolution / suivi" value={s.evolution} />
                      <ChampDetail label="Conseil" value={s.conseil} full />
                    </div>

                    <div className="flex items-center gap-1.5 pt-3 mt-3 border-t border-[#E2E8F0]">
                      <span className="material-symbols-outlined text-sm text-[#64748B]">badge</span>
                      <span className="text-xs font-bold text-[#0F172A]">{s.kine || 'Kinésithérapeute inconnu'}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

    </AppShell>
  )
}

function ChampDetail({ label, value, enAttente, full }: { label: string; value?: string | null; enAttente?: boolean; full?: boolean }) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <p className="text-[10px] font-bold text-emerald-700/70 uppercase tracking-wider mb-0.5">{label}</p>
      {enAttente ? (
        <p className="text-xs text-amber-600 italic flex items-center gap-1">
          <span className="material-symbols-outlined text-[13px]">info</span>
          Champ à venir — non encore disponible dans le système
        </p>
      ) : (
        <p className="text-sm text-on-surface">{value || '—'}</p>
      )}
    </div>
  )
}
