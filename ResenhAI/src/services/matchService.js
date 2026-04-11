import { supabase } from '../supabase.js'

// PostgREST returns joined rows under the table name (venues),
// but all components reference match.venue — normalize here once.
function normalizeMatch(m) {
  if (!m) return m
  return { ...m, venue: m.venues ?? m.venue ?? null }
}

export const matchService = {
  async createMatch(matchData) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('matches')
      .insert({ ...matchData, organizer_id: user.id })
      .select()
      .single()
    if (error) throw error
    return data
  },

  // Lists matches where user is organizer OR has an RSVP
  async listMatches() {
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch matches organized by user
    const { data: organized, error: e1 } = await supabase
      .from('matches')
      .select('*, venues(*), rsvps(count)')
      .eq('organizer_id', user.id)
      .order('scheduled_at', { ascending: true })
    if (e1) throw e1

    // Fetch match IDs where user has an RSVP
    const { data: rsvpRows, error: e2 } = await supabase
      .from('rsvps')
      .select('match_id')
      .eq('user_id', user.id)
    if (e2) throw e2

    const rsvpMatchIds = (rsvpRows ?? []).map(r => r.match_id)
    const organizedIds = new Set((organized ?? []).map(m => m.id))
    const missing = rsvpMatchIds.filter(id => !organizedIds.has(id))

    let joined = []
    if (missing.length > 0) {
      const { data, error: e3 } = await supabase
        .from('matches')
        .select('*, venues(*), rsvps(count)')
        .in('id', missing)
        .order('scheduled_at', { ascending: true })
      if (e3) throw e3
      joined = data ?? []
    }

    const all = [...(organized ?? []), ...joined]
    all.sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
    return all.map(normalizeMatch)
  },

  async getMatch(matchId) {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        venues(*),
        rsvps(*, player_profiles!rsvps_user_id_fkey(*)),
        teams(*, team_slots(*))
      `)
      .eq('id', matchId)
      .single()
    if (error) throw error
    return normalizeMatch(data)
  },

  async updateMatch(matchId, updates) {
    const { data, error } = await supabase
      .from('matches')
      .update(updates)
      .eq('id', matchId)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async cancelMatch(matchId, cancelReason) {
    return matchService.updateMatch(matchId, {
      status: 'CANCELLED',
      cancelled_at: new Date().toISOString(),
      cancel_reason: cancelReason,
    })
  },

  async deleteMatch(matchId) {
    const { error } = await supabase
      .from('matches')
      .delete()
      .eq('id', matchId)
    if (error) throw error
  },

  async listPublicMatches({ formatFilter } = {}) {
    let query = supabase
      .from('matches')
      .select('*, venues(*), rsvps(count)')
      .eq('is_public', true)
      .eq('status', 'OPEN')
      .order('scheduled_at', { ascending: true })

    if (formatFilter && formatFilter !== 'ALL') {
      query = query.eq('format', formatFilter)
    }
    const { data, error } = await query
    if (error) throw error
    return (data ?? []).map(normalizeMatch)
  },
}
