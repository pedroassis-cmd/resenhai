/**
 * rsvpService.js
 * Serviço de confirmação de presença (RSVP) para o ResenhAI.
 *
 * Tabela Supabase: `rsvps`
 * Status possíveis: INVITED | PENDING | CONFIRMED | DECLINED | WAITLIST | NO_SHOW
 */
import { supabase } from '../supabase.js'

export const rsvpService = {

  // ─── Ações do jogador ────────────────────────────────────────────────────────

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

  // ─── Ações do admin ──────────────────────────────────────────────────────────

  /**
   * Admin: convida um substituto (status = INVITED, is_substitute = true).
   */
  async inviteSubstitute(matchId, userId, position = null) {
    const { data, error } = await supabase
      .from('rsvps')
      .upsert(
        {
          match_id: matchId,
          user_id: userId,
          status: 'INVITED',
          is_substitute: true,
          preferred_position: position,
          responded_at: null,
        },
        { onConflict: 'match_id,user_id' }
      )
      .select()
      .single()
    if (error) throw error
    return data
  },

  /**
   * Admin: marca jogador como ausente (não compareceu).
   */
  async markNoShow(matchId, userId) {
    const { data, error } = await supabase
      .from('rsvps')
      .upsert(
        { match_id: matchId, user_id: userId, status: 'NO_SHOW', responded_at: new Date().toISOString() },
        { onConflict: 'match_id,user_id' }
      )
      .select()
      .single()
    if (error) throw error
    return data
  },

  /**
   * Admin: promove suplente a titular confirmado.
   */
  async promoteSubstitute(matchId, userId) {
    const { data, error } = await supabase
      .from('rsvps')
      .update({ is_substitute: false, status: 'CONFIRMED', responded_at: new Date().toISOString() })
      .eq('match_id', matchId)
      .eq('user_id', userId)
      .select()
      .single()
    if (error) throw error
    return data
  },

  /**
   * Admin: confirma presença manual de um convidado (INVITED → CONFIRMED).
   */
  async confirmGuestPresence(matchId, userId) {
    const { data, error } = await supabase
      .from('rsvps')
      .upsert(
        { match_id: matchId, user_id: userId, status: 'CONFIRMED', responded_at: new Date().toISOString() },
        { onConflict: 'match_id,user_id' }
      )
      .select()
      .single()
    if (error) throw error
    return data
  },

  /**
   * Remove um jogador da partida.
   */
  async remove(matchId, userId) {
    const { error } = await supabase
      .from('rsvps')
      .delete()
      .eq('match_id', matchId)
      .eq('user_id', userId)
    if (error) throw error
  },

  // ─── Leitura ──────────────────────────────────────────────────────────────────

  async listMatchRsvps(matchId) {
    const { data, error } = await supabase
      .from('rsvps')
      .select('*, player_profiles!rsvps_user_id_fkey(display_name, avatar_url, primary_position, skill_score, latitude, longitude)')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return data ?? []
  },

  /**
   * Retorna contagem de RSVP por status para uma partida.
   * @returns {{ total, CONFIRMED, DECLINED, PENDING, WAITLIST, NO_SHOW, substitutes }}
   */
  async getSummary(matchId) {
    const { data, error } = await supabase
      .from('rsvps')
      .select('status, is_substitute')
      .eq('match_id', matchId)
    if (error) throw error

    return (data ?? []).reduce(
      (acc, row) => {
        acc.total++
        acc[row.status] = (acc[row.status] || 0) + 1
        if (row.is_substitute) acc.substitutes++
        return acc
      },
      { total: 0, CONFIRMED: 0, DECLINED: 0, PENDING: 0, WAITLIST: 0, NO_SHOW: 0, substitutes: 0 }
    )
  },

  // ─── Realtime ─────────────────────────────────────────────────────────────────

  /**
   * Subscreve a mudanças de RSVP de uma partida em tempo real.
   * @param {string} matchId
   * @param {function} callback
   * @returns subscription (chame .unsubscribe() para cancelar)
   */
  subscribe(matchId, callback) {
    return supabase
      .channel(`rsvps:match:${matchId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rsvps', filter: `match_id=eq.${matchId}` },
        callback
      )
      .subscribe()
  },
}
