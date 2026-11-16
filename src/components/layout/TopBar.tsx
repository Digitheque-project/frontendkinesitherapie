'use client'

import { PastilleAutresServices } from "@/components/ActionsCompte";
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'
import { getUtilisateurConnecte } from '@/lib/utilisateur'
import { useLogoAuthentifie } from '@/lib/use-logo-authentifie'
import { KINE_API } from '@/lib/gateway'
import PointServeur from "@/components/PointServeur";

const API = KINE_API

interface NotificationKine {
  id: number
  prescriptionId: string
  demandeId: string
  patientId: string
  patientNom?: string | null
  patientPrenom?: string | null
  typeKine: string
  urgence: string
  diagnostic: string
  renseignements?: string
  alertes?: string
  objectifs?: string
  remarques?: string
  nomMedecinPrescripteur?: string
  statut: string
  lue: boolean
  createdAt: string
}

interface TopBarProps {
  title?: string
  searchPlaceholder?: string
  showSearch?: boolean
  actions?: React.ReactNode
  onMenuClick?: () => void
  onNouvelleNotification?: () => void
  onBellClick?: () => void
}

function jouerCarillon() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const jouerNote = (freq: number, debut: number, duree: number) => {
      const osc = ctx.createOscillator()
      const osc2 = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc2.type = 'sine'
      osc.frequency.value = freq
      osc2.frequency.value = freq * 2.005
      gain.gain.setValueAtTime(0, ctx.currentTime + debut)
      gain.gain.setValueAtTime(0, ctx.currentTime + debut)
      gain.gain.linearRampToValueAtTime(0.6, ctx.currentTime + debut + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + debut + duree)
      osc.connect(gain)
      osc2.connect(gain)
      gain.connect(ctx.destination)
      osc.start(ctx.currentTime + debut)
      osc2.start(ctx.currentTime + debut)
      osc.stop(ctx.currentTime + debut + duree + 0.05)
      osc2.stop(ctx.currentTime + debut + duree + 0.05)
    }
    jouerNote(1046.5, 0, 0.6)
    jouerNote(783.99, 0.35, 0.75)
  } catch (e) {}
}

function rangUrgence(u: string) {
  if (u === 'TRES_URGENT') return 0
  if (u === 'URGENT') return 1
  return 2
}

function styleUrgence(u: string) {
  if (u === 'TRES_URGENT') return { badge: 'bg-red-100 text-red-700', bord: 'border-l-red-500', fond: 'bg-red-50' }
  if (u === 'URGENT') return { badge: 'bg-orange-100 text-orange-700', bord: 'border-l-orange-400', fond: 'bg-orange-50' }
  return { badge: 'bg-teal-100 text-teal-700', bord: 'border-l-teal-400', fond: 'bg-teal-50' }
}

export default function TopBar({
  searchPlaceholder,
  showSearch = true,
  actions,
  onMenuClick,
  onNouvelleNotification,
  onBellClick,
}: TopBarProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const placeholder = searchPlaceholder || t('topbar_rechercher')

  const [utilisateur, setUtilisateur] = useState(getUtilisateurConnecte())
  const [jetonLogo, setJetonLogo] = useState<string | null>(null)
  useEffect(() => {
    try {
      setJetonLogo(localStorage.getItem('authToken'))
    } catch {}
  }, [utilisateur])
  const logoChu = useLogoAuthentifie(utilisateur.chuLogoUrl, jetonLogo)
  const [notifs, setNotifs] = useState<NotificationKine[]>([])
  const [open, setOpen] = useState(false)
  const [now, setNow] = useState<Date | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const dernierNombre = useRef<number | null>(null)

  function fetchNotifs() {
    fetch(`${API}/notifications`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setNotifs(Array.isArray(d) ? d : []))
      .catch(() => {})
  }

  useEffect(() => {
    setUtilisateur(getUtilisateurConnecte())
    fetchNotifs()
    const interval = setInterval(fetchNotifs, 30000)
    setNow(new Date())
    const horloge = setInterval(() => setNow(new Date()), 1000)
    return () => { clearInterval(interval); clearInterval(horloge) }
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const enAttente = notifs.filter((n) => n.statut === 'CREEE')
  const nonLues = enAttente.filter((n) => !n.lue)

  const triees = [...enAttente].sort((a, b) => {
    const diff = rangUrgence(a.urgence) - rangUrgence(b.urgence)
    if (diff !== 0) return diff
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  useEffect(() => {
    if (dernierNombre.current !== null && nonLues.length > dernierNombre.current) {
      const diff = nonLues.length - dernierNombre.current
      for (let i = 0; i < diff; i++) {
        setTimeout(() => jouerCarillon(), i * 1100)
      }
      onNouvelleNotification?.()
    }
    dernierNombre.current = nonLues.length
  }, [nonLues.length])

  function formatDateHeure(iso: string) {
    const dt = new Date(iso)
    const date = dt.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const heure = dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    return date + ' a ' + heure
  }

  function marquerLue(n: NotificationKine) {
    if (!n.lue) {
      fetch(`${API}/notifications/${n.id}/lire`, { method: 'PATCH' })
        .then(() => fetchNotifs())
        .catch(() => {})
    }
  }

  function allerVersPrescription(n: NotificationKine) {
    if (n.lue) {
      setOpen(false)
      return
    }
    marquerLue(n)
    setOpen(false)
    try {
      localStorage.setItem('demandeSecours_' + n.patientId, JSON.stringify(n))
    } catch {}
    router.push('/prescriptions?patientId=' + encodeURIComponent(n.patientId))
  }

  return (
    <header className="relative z-40 w-full bg-white border-b border-[#F1F5F9] px-4 sm:px-6 lg:px-7 py-2.5 sm:py-3 flex items-center justify-between gap-3 shadow-[0px_4px_10px_rgba(0,0,0,0.015)]">
      {/* Gauche : menu mobile, logo du CHU (venant du jeton), nom du service */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onMenuClick}
          className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-colors flex-shrink-0"
          aria-label="Ouvrir la navigation"
        >
          <span className="material-symbols-outlined text-[20px]">menu</span>
        </button>
        {logoChu ? (
          <img
            src={logoChu}
            alt="Logo CHU"
            className="h-8 w-8 sm:h-9 sm:w-9 rounded-full object-cover border border-[#CFE9EF] flex-shrink-0"
          />
        ) : null}
        <div className="text-[16px] sm:text-[18px] lg:text-[20px] font-black text-[#004A66] tracking-tight truncate">
          Kinésithérapie
        </div>
      </div>

      {/* Centre : Bonjour + date/heure */}
      <div className="hidden md:flex items-center gap-4 min-w-0">
        <span className="text-[13px] font-semibold text-gray-500 truncate">
          Bonjour{utilisateur.prenom ? ` ${utilisateur.prenom}` : ''}
        </span>
        <span className="hidden xl:inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#64748B] capitalize whitespace-nowrap">
          <span className="material-symbols-outlined text-[16px] text-[#006A8C]">calendar_month</span>
          {now
            ? now.toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              }) + ' : ' + now.toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              }).split(':').join(' : ')
            : ' '}
        </span>
        {showSearch && (
          <div className="hidden lg:flex items-center gap-2 bg-[#F8F9FB] border border-[#E2E8F0] px-3 py-1.5 rounded-xl w-64">
            <span className="material-symbols-outlined text-[#64748B] text-base">search</span>
            <input
              type="text"
              placeholder={placeholder}
              className="bg-transparent border-none focus:outline-none focus:ring-0 text-sm w-full text-[#0F172A] placeholder:text-[#94A3B8]"
            />
          </div>
        )}
      </div>

      {/* Droite : actions, notifications, profil */}
      <div className="flex items-center gap-4 sm:gap-5 lg:gap-8 flex-shrink-0">
        {actions}
        <PastilleAutresServices />
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => { setOpen((o) => !o); onBellClick?.() }}
            className="relative block text-gray-700 hover:text-[#006A8C] transition-colors"
            aria-label="Notifications"
          >
            <span className="material-symbols-outlined text-[24px]">notifications</span>
            {nonLues.length > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-[16px] sm:h-[18px] sm:min-w-[18px] px-1 bg-[#E11D48] text-white text-[9px] sm:text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                {nonLues.length}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 mt-3 w-[22rem] sm:w-96 max-w-[calc(100vw-2rem)] max-h-[460px] overflow-y-auto bg-white rounded-2xl border border-[#F1F5F9] shadow-xl z-50">
              <div className="px-4 py-3 border-b border-[#F1F5F9] sticky top-0 bg-white">
                <p className="font-black text-[#004A66] text-sm">Notifications ({nonLues.length})</p>
              </div>
              {triees.length === 0 ? (
                <div className="py-8 text-center text-[#64748B] text-sm">
                  Aucune notification en attente
                </div>
              ) : (
                triees.map((n) => {
                  const s = styleUrgence(n.urgence)
                  return (
                    <div
                      key={n.id}
                      onClick={() => allerVersPrescription(n)}
                      className={
                        'px-4 py-3 border-b border-[#F1F5F9] last:border-b-0 transition-colors border-l-4 cursor-pointer ' +
                        (n.lue ? 'bg-white hover:bg-gray-50 border-l-[#E2E8F0]' : s.fond + ' hover:brightness-95 ' + s.bord)
                      }
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={'text-[10px] font-bold px-2 py-0.5 rounded-full ' + s.badge}>
                          {n.urgence}
                        </span>
                        <span className="text-[10px] text-[#64748B]">{formatDateHeure(n.createdAt)}</span>
                      </div>
                      <p className={'text-sm text-[#0F172A] ' + (n.lue ? 'font-medium' : 'font-bold')}>{n.patientNom && n.patientPrenom ? `${n.patientPrenom} ${n.patientNom}` : 'Patient inconnu'}</p>
                      <p className="text-xs text-[#64748B] truncate">{n.typeKine} — {n.diagnostic}</p>
                      <div className="flex items-center justify-end mt-2">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#006A8C]">
                          Voir la prescription
                          <span className="material-symbols-outlined text-sm">chevron_right</span>
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex flex-col text-right min-w-0">
            <span className="text-[12px] sm:text-[12.5px] lg:text-[13px] font-extrabold text-gray-900 leading-tight truncate max-w-[140px] sm:max-w-[180px] lg:max-w-none">
              {utilisateur.displayName}
            </span>
            <span className="hidden sm:block text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight mt-0.5 truncate">
              {utilisateur.role || 'Kinésithérapie'}
            </span>
          </div>
          <div className="relative w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
            <div className="w-full h-full rounded-full bg-[#F0F7FF] border-2 border-[#CFE9EF] flex items-center justify-center">
              <span className="text-[12px] sm:text-sm font-black text-[#006A8C]">{utilisateur.initiales}</span>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 leading-none">
              <PointServeur sansMarge />
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
