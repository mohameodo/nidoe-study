"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from '@/components/layouts/ClientRootLayout'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'

// Default settings
export const defaultSettings = {
  // Quiz settings
  quizTypes: {
    multipleChoice: true,  // Default enabled
    shortAnswer: false,    // Default disabled
    matching: false,       // Default disabled
    puzzle: false          // Default disabled
  },
  // Learning features
  features: {
    aiHints: false,        // Default disabled
    explanations: true,    // Default enabled
    progressiveUnlock: false // Default disabled
  },
  // UI preferences
  ui: {
    darkMode: 'system',    // 'light', 'dark', or 'system'
    animations: true,      // Default enabled
    soundEffects: false    // Default disabled
  },
  // Study preferences
  study: {
    questionsPerQuiz: 5,   // Default 5 questions
    difficulty: 'medium',  // 'easy', 'medium', or 'hard'
    reviewMistakes: true   // Default enabled
  }
}

export type SettingsType = typeof defaultSettings

// Define context type
type SettingsContextType = {
  settings: SettingsType
  updateSettings: (newSettings: Partial<SettingsType>) => Promise<void>
  updateQuizType: (type: keyof SettingsType['quizTypes'], value: boolean) => Promise<void>
  updateFeature: (feature: keyof SettingsType['features'], value: boolean) => Promise<void>
  updateUIPreference: (pref: keyof SettingsType['ui'], value: any) => Promise<void>
  updateStudyPreference: (pref: keyof SettingsType['study'], value: any) => Promise<void>
  resetToDefaults: () => Promise<void>
}

// Create context
export const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

// Provider component
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SettingsType>(defaultSettings)
  const { user } = useAuth()
  const [loaded, setLoaded] = useState(false)

  // Load settings from Firestore or localStorage
  useEffect(() => {
    const loadSettings = async () => {
      let loadedSettings = { ...defaultSettings }
      
      try {
        if (user) {
          // Load from Firestore if user is logged in
          const settingsDoc = await getDoc(doc(db, 'settings', user.uid))
          if (settingsDoc.exists()) {
            loadedSettings = { 
              ...defaultSettings, 
              ...settingsDoc.data() as SettingsType
            }
          }
        } else {
          // Load from localStorage if not logged in
          const savedSettings = localStorage.getItem('nidoe-settings')
          if (savedSettings) {
            loadedSettings = { 
              ...defaultSettings, 
              ...JSON.parse(savedSettings) 
            }
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error)
      }
      
      setSettings(loadedSettings)
      setLoaded(true)
    }
    
    loadSettings()
  }, [user])

  // Save settings to Firestore or localStorage
  const saveSettings = async (newSettings: SettingsType) => {
    try {
      if (user) {
        // Save to Firestore if user is logged in
        await setDoc(doc(db, 'settings', user.uid), newSettings)
      } else {
        // Save to localStorage if not logged in
        localStorage.setItem('nidoe-settings', JSON.stringify(newSettings))
      }
    } catch (error) {
      console.error('Error saving settings:', error)
    }
  }

  // Update all settings
  const updateSettings = async (newSettings: Partial<SettingsType>) => {
    const updatedSettings = {
      ...settings,
      ...newSettings,
    }
    setSettings(updatedSettings)
    await saveSettings(updatedSettings)
  }

  // Update quiz type setting
  const updateQuizType = async (type: keyof SettingsType['quizTypes'], value: boolean) => {
    const updatedSettings = {
      ...settings,
      quizTypes: {
        ...settings.quizTypes,
        [type]: value
      }
    }
    setSettings(updatedSettings)
    await saveSettings(updatedSettings)
  }

  // Update feature setting
  const updateFeature = async (feature: keyof SettingsType['features'], value: boolean) => {
    const updatedSettings = {
      ...settings,
      features: {
        ...settings.features,
        [feature]: value
      }
    }
    setSettings(updatedSettings)
    await saveSettings(updatedSettings)
  }

  // Update UI preference
  const updateUIPreference = async (pref: keyof SettingsType['ui'], value: any) => {
    const updatedSettings = {
      ...settings,
      ui: {
        ...settings.ui,
        [pref]: value
      }
    }
    setSettings(updatedSettings)
    await saveSettings(updatedSettings)
  }

  // Update study preference
  const updateStudyPreference = async (pref: keyof SettingsType['study'], value: any) => {
    const updatedSettings = {
      ...settings,
      study: {
        ...settings.study,
        [pref]: value
      }
    }
    setSettings(updatedSettings)
    await saveSettings(updatedSettings)
  }

  // Reset to defaults
  const resetToDefaults = async () => {
    setSettings(defaultSettings)
    await saveSettings(defaultSettings)
  }

  // Skip rendering until settings are loaded
  if (!loaded) {
    return null
  }

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        updateQuizType,
        updateFeature,
        updateUIPreference,
        updateStudyPreference,
        resetToDefaults
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

// Custom hook to use settings context
export function useSettings() {
  const context = useContext(SettingsContext)
  
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  
  return context
} 