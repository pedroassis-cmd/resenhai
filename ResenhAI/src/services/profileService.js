import { supabase } from '../supabase.js'

export const profileService = {
  async getProfile(userId) {
    const { data, error } = await supabase
      .from('player_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async updateProfile(userId, updates) {
    const { data, error } = await supabase
      .from('player_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single()
    if (error) throw error
    return data
  },

  // Called after onboarding step — saves display_name, position, city, etc.
  async completeOnboarding(userId, { displayName, primaryPosition, skillLevel, city, state }) {
    const { data, error } = await supabase
      .from('player_profiles')
      .update({
        display_name: displayName,
        primary_position: primaryPosition,
        skill_level: skillLevel,
        city: city ?? null,
        state: state ?? null,
      })
      .eq('user_id', userId)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async getStats(userId) {
    const { data, error } = await supabase
      .from('player_profiles')
      .select('total_matches, total_goals, total_assists, total_wins, total_no_shows, skill_score')
      .eq('user_id', userId)
      .single()
    if (error) throw error
    return data
  },

  async setAvailable(userId, isAvailable) {
    const { data, error } = await supabase
      .from('player_profiles')
      .update({ is_available: isAvailable })
      .eq('user_id', userId)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async getSeekingProfile(userId) {
    const { data, error } = await supabase
      .from('seeking_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    if (error) throw error
    return data
  },

  async upsertSeekingProfile(userId, updates) {
    const { data, error } = await supabase
      .from('seeking_profiles')
      .upsert({ user_id: userId, ...updates }, { onConflict: 'user_id' })
      .select()
      .single()
    if (error) throw error
    return data
  },
}
