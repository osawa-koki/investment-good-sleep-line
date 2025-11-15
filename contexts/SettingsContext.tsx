'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'

export interface InvestmentSettings {
  totalAssets: number // 資産総額
  investmentRatio: number // 投資比率 (0-100)
  probabilityThreshold: number // 何%の可能性まで考慮するか (0-100)
  expectedReturn: number // リターン (%)
  risk: number // リスク (%)
}

export const defaultSettings: InvestmentSettings = {
  totalAssets: 1_000_000,
  investmentRatio: 50,
  probabilityThreshold: 90.0,
  expectedReturn: 7.5,
  risk: 18.0
}

interface SettingsContextType {
  settings: InvestmentSettings
  updateSettings: (newSettings: Partial<InvestmentSettings>) => void
  resetSettings: () => void
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

const STORAGE_KEY = 'investment-settings'

export function SettingsProvider ({ children }: { children: React.ReactNode }): React.JSX.Element {
  const pathname = usePathname()
  const [settings, setSettings] = useState<InvestmentSettings>(defaultSettings)
  const [shouldUpdateUrl, setShouldUpdateUrl] = useState(false)

  // 初回マウント時にlocalStorageから設定を読み込む
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored !== null) {
        try {
          const parsed = JSON.parse(stored) as InvestmentSettings
          setSettings(parsed)
        } catch (error) {
          console.error('Failed to parse stored settings:', error)
        }
      }
    }
  }, [])

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
    setSettings(prev => {
      const updated = { ...prev, ...newSettings }
      // localStorageに保存（丸め処理は呼び出し側で実施済み）
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      }
      return updated
    })
    setShouldUpdateUrl(true)
  }, [])

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings)
    // localStorageから削除
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
    }
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
