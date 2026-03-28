import { supabase } from '../supabase.js'

export const subscriptionService = {
  async getUserPlan(userId) {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    if (error) throw error
    return data // null if no subscription row yet (shouldn't happen — trigger creates it)
  },

  async isPremium(userId) {
    const sub = await subscriptionService.getUserPlan(userId)
    return sub?.plan === 'PREMIUM' || sub?.plan === 'CLUB'
  },

  async isClub(userId) {
    const sub = await subscriptionService.getUserPlan(userId)
    return sub?.plan === 'CLUB'
  },
}
