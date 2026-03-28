import { supabase } from '../supabase.js'

export const achievementService = {
  // Returns all achievements with unlock status for the current user
  async getAll(userId) {
    const { data: all, error: e1 } = await supabase
      .from('achievements')
      .select('*')
      .order('xp_reward', { ascending: false })
    if (e1) throw e1

    const { data: earned, error: e2 } = await supabase
      .from('user_achievements')
      .select('achievement_id, earned_at')
      .eq('user_id', userId)
    if (e2) throw e2

    const earnedMap = Object.fromEntries((earned ?? []).map(e => [e.achievement_id, e.earned_at]))

    return (all ?? []).map(a => ({
      ...a,
      unlocked: !!earnedMap[a.id],
      earned_at: earnedMap[a.id] ?? null,
    }))
  },

  // Total XP for user (sum of xp_reward from unlocked achievements)
  async getTotalXP(userId) {
    const { data, error } = await supabase
      .from('user_achievements')
      .select('achievements!inner(xp_reward)')
      .eq('user_id', userId)
    if (error) throw error
    return (data ?? []).reduce((sum, row) => sum + (row.achievements?.xp_reward ?? 0), 0)
  },

  async getUnlocked(userId) {
    const { data, error } = await supabase
      .from('user_achievements')
      .select('*, achievement:achievements(*)')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false })
    if (error) throw error
    return data ?? []
  },

  async getNotifications(userId) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'ACHIEVEMENT')
      .is('read_at', null)
      .order('sent_at', { ascending: false })
    if (error) throw error
    return data ?? []
  },
}
