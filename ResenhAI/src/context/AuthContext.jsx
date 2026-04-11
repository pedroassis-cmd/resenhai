import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabase.js'

const AuthContext = createContext(null)

const IS_DEV_PLACEHOLDER =
  !import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.VITE_SUPABASE_URL.includes('placeholder') ||
  import.meta.env.VITE_SUPABASE_URL.includes('your-project')

const MOCK_USER = IS_DEV_PLACEHOLDER
  ? { id: 'dev-user', email: 'dev@peladaapp.com.br', user_metadata: { display_name: 'Dev User' } }
  : null

const MOCK_PROFILE = IS_DEV_PLACEHOLDER
  ? {
      user_id: 'dev-user',
      display_name: 'Dev Player',
      primary_position: 'MIDFIELDER',
      skill_level: 'INTERMEDIATE',
      skill_score: 7.5,
      total_matches: 24,
      total_goals: 12,
      total_assists: 8,
      total_wins: 15,
      total_no_shows: 0,
      is_available: false,
      city: 'São Paulo',
      state: 'SP',
    }
  : null

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(IS_DEV_PLACEHOLDER ? MOCK_USER : null)
  const [profile, setProfile] = useState(IS_DEV_PLACEHOLDER ? MOCK_PROFILE : null)
  const [loading, setLoading] = useState(!IS_DEV_PLACEHOLDER)

  useEffect(() => {
    if (IS_DEV_PLACEHOLDER) return

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    }).catch(() => setLoading(false))

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) fetchProfile(session.user.id)
        else { setProfile(null); setLoading(false) }
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    try {
      const { data } = await supabase
        .from('player_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()
      setProfile(data)
    } catch (_) {
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  // Profile is "complete" when user has set their city or primary position after onboarding
  // The trigger creates the profile with just display_name from email — city/skill_level are null initially
  const isProfileComplete = IS_DEV_PLACEHOLDER
    ? true
    : !!profile && !!profile.city && profile.skill_level !== null && profile.skill_level !== undefined

  const value = { user, profile, loading, setProfile, isProfileComplete, IS_DEV_PLACEHOLDER }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
