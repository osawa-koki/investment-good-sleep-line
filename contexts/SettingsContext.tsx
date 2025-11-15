'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useSearchParams, usePathname } from 'next/navigation'

export interface InvestmentSettings {
  totalAssets: number // 資産総額
  investmentRatio: number // 投資比率 (0-100)
  probabilityThreshold: number // 何%の可能性まで考慮するか (0-100)
  expectedReturn: number // リターン (%)
  risk: number // リスク (%)
}

export const defaultSettings: InvestmentSettings = {
  totalAssets: 10000000,
  investmentRatio: 50,
  probabilityThreshold: 98,
  expectedReturn: 8,
  risk: 15
}

interface SettingsContextType {
  settings: InvestmentSettings
  updateSettings: (newSettings: Partial<InvestmentSettings>) => void
  resetSettings: () => void
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider ({ children }: { children: React.ReactNode }): React.JSX.Element {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [settings, setSettings] = useState<InvestmentSettings>(defaultSettings)
  const [shouldUpdateUrl, setShouldUpdateUrl] = useState(false)

  // URLパラメータから設定を復元
  useEffect(() => {
    const urlSettings: Partial<InvestmentSettings> = {}

    const totalAssets = searchParams.get('totalAssets')
    const investmentRatio = searchParams.get('investmentRatio')
    const probabilityThreshold = searchParams.get('probabilityThreshold')
    const expectedReturn = searchParams.get('expectedReturn')
    const risk = searchParams.get('risk')

    if (totalAssets !== null) {
      const parsed = parseFloat(totalAssets)
      if (!isNaN(parsed) && parsed > 0) {
        urlSettings.totalAssets = parsed
      }
    }

    if (investmentRatio !== null) {
      const parsed = parseFloat(investmentRatio)
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
        urlSettings.investmentRatio = parsed
      }
    }

    if (probabilityThreshold !== null) {
      const parsed = parseFloat(probabilityThreshold)
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
        urlSettings.probabilityThreshold = parsed
      }
    }

    if (expectedReturn !== null) {
      const parsed = parseFloat(expectedReturn)
      if (!isNaN(parsed)) {
        urlSettings.expectedReturn = parsed
      }
    }

    if (risk !== null) {
      const parsed = parseFloat(risk)
      if (!isNaN(parsed) && parsed >= 0) {
        urlSettings.risk = parsed
      }
    }

    if (Object.keys(urlSettings).length > 0) {
      setSettings(prev => ({ ...prev, ...urlSettings }))
    }
  }, [searchParams])

  // URLを更新するuseEffect（settingsが変更された時のみ）
  useEffect(() => {
    if (shouldUpdateUrl) {
      const params = new URLSearchParams()
      params.set('totalAssets', settings.totalAssets.toString())
      params.set('investmentRatio', settings.investmentRatio.toString())
      params.set('probabilityThreshold', settings.probabilityThreshold.toString())
      params.set('expectedReturn', settings.expectedReturn.toString())
      params.set('risk', settings.risk.toString())

      const newUrl = `${pathname}?${params.toString()}`
      window.history.replaceState({}, '', newUrl)
      setShouldUpdateUrl(false)
    }
  }, [settings, shouldUpdateUrl, pathname])

  const updateSettings = useCallback((newSettings: Partial<InvestmentSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
    setShouldUpdateUrl(true)
  }, [])

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings)
    // URLパラメータをクリア（次のレンダリングで反映される）
    setTimeout(() => {
      window.history.replaceState({}, '', pathname)
    }, 0)
  }, [pathname])

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings (): SettingsContextType {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}
