import { supabase } from '../supabase.js'

export const notificationService = {
  async fetchAll(userId) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('sent_at', { ascending: false })
      .limit(50)
    if (error) throw error
    return data ?? []
  },

  async fetchUnread(userId) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .is('read_at', null)
      .order('sent_at', { ascending: false })
    if (error) throw error
    return data ?? []
  },

  async markAsRead(notificationId) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async markAllAsRead(userId) {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('read_at', null)
    if (error) throw error
  },

  // Real-time subscription
  subscribe(userId, callback) {
    return supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        payload => callback(payload.new)
      )
      .subscribe()
  },
}
