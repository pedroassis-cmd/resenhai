import { supabase } from '../supabase.js'

/**
 * teamService — persiste e lê os times sorteados no banco.
 *
 * Schema:
 *   teams       { id, match_id, name, color }
 *   team_slots  { id, team_id, user_id, position, squad_number }
 */
export const teamService = {
  /**
   * Persiste os dois times no banco.
   * Apaga teams anteriores da partida antes de gravar (idempotente).
   *
   * @param {string} matchId
   * @param {{ teamA: Array, teamB: Array }} teams
   */
  async saveTeams(matchId, { teamA, teamB }) {
    // 1. Remove teams antigos (cascade apaga team_slots)
    await supabase.from('teams').delete().eq('match_id', matchId)

    // 2. Cria os dois times
    const { data: newTeams, error: teamsErr } = await supabase
      .from('teams')
      .insert([
        { match_id: matchId, name: 'Time Verde',  color: '#1cb85b' },
        { match_id: matchId, name: 'Time Branco', color: '#e8f5ef' },
      ])
      .select()
    if (teamsErr) throw teamsErr

    const [tA, tB] = newTeams

    // 3. Cria os slots
    const slotsA = teamA
      .filter(p => p.user_id)       // bots sem user_id são ignorados
      .map((p, i) => ({
        team_id: tA.id,
        user_id: p.user_id,
        position: p.preferred_position || p.primary_position || 'ANY',
        squad_number: i + 1,
      }))

    const slotsB = teamB
      .filter(p => p.user_id)
      .map((p, i) => ({
        team_id: tB.id,
        user_id: p.user_id,
        position: p.preferred_position || p.primary_position || 'ANY',
        squad_number: i + 1,
      }))

    const allSlots = [...slotsA, ...slotsB]
    if (allSlots.length > 0) {
      const { error: slotsErr } = await supabase.from('team_slots').insert(allSlots)
      if (slotsErr) throw slotsErr
    }

    // 4. Atualiza status da partida para TEAMS_SET
    await supabase
      .from('matches')
      .update({ status: 'TEAMS_SET' })
      .eq('id', matchId)

    return { teamA: tA, teamB: tB }
  },

  /**
   * Carrega os times existentes de uma partida.
   * @returns {{ teamA: object|null, teamB: object|null, hasTeams: boolean }}
   */
  async getTeams(matchId) {
    const { data, error } = await supabase
      .from('teams')
      .select('*, team_slots(*, player_profiles!team_slots_user_id_fkey(display_name, primary_position, skill_score))')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true })
    if (error) throw error
    if (!data || data.length < 2) return { teamA: null, teamB: null, hasTeams: false }
    return { teamA: data[0], teamB: data[1], hasTeams: true }
  },
}
