'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

export interface InvestmentSettings {
  totalAssets: number // 資産総額
  investmentRatio: number // 投資比率 (0-100)
  probabilityThreshold: number // 何%の可能性まで考慮するか (0-100)
  expectedReturn: number // リターン (%)
  risk: number // リスク (%)
}

const DEFAULT_TOTAL_ASSETS = 1_000_000
const DEFAULT_INVESTMENT_RATIO = 50
const DEFAULT_PROBABILITY_THRESHOLD = 99.5
const DEFAULT_EXPECTED_RETURN = 7.5
const DEFAULT_RISK = 18.0

export const defaultSettings: InvestmentSettings = {
  totalAssets: DEFAULT_TOTAL_ASSETS,
  investmentRatio: DEFAULT_INVESTMENT_RATIO,
  probabilityThreshold: DEFAULT_PROBABILITY_THRESHOLD,
  expectedReturn: DEFAULT_EXPECTED_RETURN,
  risk: DEFAULT_RISK
}

interface SettingsContextType {
  settings: InvestmentSettings
  updateSettings: (newSettings: Partial<InvestmentSettings>) => void
  resetSettings: () => void
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

const STORAGE_KEY = 'investment-settings'

export function SettingsProvider ({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [settings, setSettings] = useState<InvestmentSettings>(defaultSettings)

  // 初回マウント時にlocalStorageから設定を読み込む
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === null) {
      return
    }

    try {
      const parsed: unknown = JSON.parse(stored)
      setSettings(parsed as InvestmentSettings)
    } catch {
      // 設定のパースに失敗した場合はデフォルトを使用
    }
  }, [])

  const updateSettings = useCallback((newSettings: Partial<InvestmentSettings>): void => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings }
      // localStorageに保存（丸め処理は呼び出し側で実施済み）
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      }
      return updated
    })
  }, [])

  const resetSettings = useCallback((): void => {
    setSettings(defaultSettings)
    // localStorageから削除
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  const contextValue = { settings, updateSettings, resetSettings }

  return (
    <SettingsContext.Provider value={contextValue}>
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
