import { supabase } from '../supabase.js'

export const rsvpService = {
  // rsvp status values: INVITED | PENDING | CONFIRMED | DECLINED | WAITLIST | NO_SHOW
  async confirm(matchId, userId, preferredPosition) {
    const { data, error } = await supabase
      .from('rsvps')
      .upsert(
        { match_id: matchId, user_id: userId, status: 'CONFIRMED', preferred_position: preferredPosition ?? null, responded_at: new Date().toISOString() },
        { onConflict: 'match_id,user_id' }
      )
      .select()
      .single()
    if (error) throw error
    return data
  },

  async decline(matchId, userId, cancelReason) {
    const { data, error } = await supabase
      .from('rsvps')
      .upsert(
        { match_id: matchId, user_id: userId, status: 'DECLINED', cancel_reason: cancelReason ?? null, responded_at: new Date().toISOString() },
        { onConflict: 'match_id,user_id' }
      )
      .select()
      .single()
    if (error) throw error
    return data
  },

  async joinWaitlist(matchId, userId, preferredPosition) {
    const { data, error } = await supabase
      .from('rsvps')
      .upsert(
        { match_id: matchId, user_id: userId, status: 'WAITLIST', preferred_position: preferredPosition ?? null, responded_at: new Date().toISOString() },
        { onConflict: 'match_id,user_id' }
      )
      .select()
      .single()
    if (error) throw error
    return data
  },

  async getMyRsvp(matchId, userId) {
    const { data, error } = await supabase
      .from('rsvps')
      .select('*')
      .eq('match_id', matchId)
      .eq('user_id', userId)
      .maybeSingle()
    if (error) throw error
    return data
  },

  async listMatchRsvps(matchId) {
    const { data, error } = await supabase
      .from('rsvps')
      .select('*, player_profiles!rsvps_user_id_fkey(display_name, avatar_url, primary_position, skill_score)')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return data ?? []
  },
}
