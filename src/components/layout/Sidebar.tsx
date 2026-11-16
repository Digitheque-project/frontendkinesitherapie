'use client'
import { ActionsCompte } from "@/components/ActionsCompte";
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'

interface SidebarProps {
  open?: boolean
  onClose?: () => void
}

export default function Sidebar({ open = false, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useLanguage()
  const [confirmDeconnexion, setConfirmDeconnexion] = useState(false)

  const navItems = [
    { href: '/', icon: 'dashboard', label: t('sidebar_tableauDeBord') },
    { href: '/prescriptions', icon: 'assignment', label: t('sidebar_preinscription') },
    { href: '/patients', icon: 'group', label: t('sidebar_patients') },
    { href: '/calendrier', icon: 'calendar_today', label: t('sidebar_calendrier') },
    { href: '/archives', icon: 'inventory_2', label: t('sidebar_archives') },
    { href: '/rapport', icon: 'assessment', label: t('sidebar_rapport') },
  ]

  function deconnecter() {
    try {
      const cleTokenGarder = (cle: string) =>
        cle.startsWith('historique_patient_') ||
        cle.startsWith('religion_patient_') ||
        cle.startsWith('brouillon_patient_')
      Object.keys(localStorage)
        .filter((cle) => !cleTokenGarder(cle))
        .forEach((cle) => localStorage.removeItem(cle))
    } catch {}
    setConfirmDeconnexion(false)
    router.push('/')
    router.refresh()
  }

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px] md:hidden" onClick={onClose} aria-hidden />
      )}
      <aside
        className={
          'bg-white border-r border-[#F1F5F9] flex flex-col h-full shrink-0 shadow-[1px_0px_5px_rgba(0,0,0,0.01)] overflow-y-auto z-50 ' +
          'fixed inset-y-0 left-0 w-[82vw] max-w-[280px] transition-transform duration-200 md:static md:w-[220px] lg:w-[260px] ' +
          'md:rounded-tr-[24px] md:mt-2 ' +
          (open ? 'translate-x-0' : '-translate-x-full md:translate-x-0')
        }
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-2 md:hidden">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-[0.2em]">Navigation</span>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-gray-200 text-gray-500 hover:text-gray-900 hover:border-gray-300 transition-colors"
            aria-label="Fermer la navigation"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 sm:py-5 space-y-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={
                  'flex items-center gap-3 sm:gap-4 px-4 py-3 sm:py-3.5 rounded-[12px] transition-colors duration-200 ' +
                  (isActive ? 'bg-[#F0F7FF] text-[#006A8C] font-bold' : 'text-[#475569] hover:bg-gray-50 font-medium')
                }
              >
                <span className={'material-symbols-outlined text-[20px] shrink-0 ' + (isActive ? 'text-[#006A8C]' : 'text-[#64748B]')}>
                  {item.icon}
                </span>
                <span className="text-[13px] sm:text-[14px]">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="px-4 sm:px-5 py-5 sm:py-6 space-y-5 border-t border-[#F1F5F9]">
          <ActionsCompte
            className="flex w-full items-center gap-3 px-4 text-slate-500 transition-colors hover:text-slate-900"
            classeLibelle="text-[12px] sm:text-[13px] font-bold"
          />
          <button
            type="button"
            onClick={() => setConfirmDeconnexion(true)}
            className="flex items-center gap-3 px-4 text-[#E11D48] hover:text-red-700 transition-colors w-full"
          >
            <span className="material-symbols-outlined text-[18px] w-5 text-center">logout</span>
            <span className="text-[12px] sm:text-[13px] font-bold">{t('sidebar_deconnexion')}</span>
          </button>
        </div>
      </aside>

      {confirmDeconnexion && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl border border-[#F1F5F9] shadow-2xl p-8 max-w-sm w-full text-center">
            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[#E11D48] text-3xl">logout</span>
            </div>
            <h3 className="text-lg font-black text-[#0F172A] mb-2">{t('sidebar_deconnecterQ')}</h3>
            <p className="text-sm text-[#64748B] mb-6">{t('sidebar_deconnecterDesc')}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeconnexion(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-[#475569] font-bold text-sm hover:bg-gray-50"
              >
                {t('sidebar_annuler')}
              </button>
              <button
                onClick={deconnecter}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#E11D48] text-white font-bold text-sm hover:bg-rose-700 shadow-sm"
              >
                {t('sidebar_confirmer')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
