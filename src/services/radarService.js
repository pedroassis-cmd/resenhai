import { supabase } from '../supabase.js'

export const radarService = {
  async getAvailablePlayers({ position, matchId, lat, lng, radiusKm = 10 } = {}) {
    let query = supabase
      .from('seeking_profiles')
      .select('*, user:users(*, player_profiles(*))')
      .eq('is_active', true)

    if (position && position !== 'ALL') {
      query = query.or(`preferred_position.eq.${position},preferred_position.eq.ANY`)
    }
    const { data, error } = await query.limit(20)
    if (error) throw error
    return data ?? []
  },

  async sendRadarCall({ matchId, targetUserId, neededPosition }) {
    const { data: { user } } = await supabase.auth.getUser()
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 min
    const { data, error } = await supabase
      .from('radar_calls')
      .insert({
        match_id: matchId,
        sender_id: user.id,
        target_id: targetUserId,
        needed_position: neededPosition,
        status: 'SENT',
        expires_at: expiresAt
      })
      .select().single()
    if (error) throw error
    return data
  },

  async respondToRadarCall(radarCallId, accepted) {
    const { data, error } = await supabase
      .from('radar_calls')
      .update({ status: accepted ? 'ACCEPTED' : 'DECLINED', responded_at: new Date().toISOString() })
      .eq('id', radarCallId)
      .select().single()
    if (error) throw error
    return data
  }
}

export const joinRequestService = {
  async sendJoinRequest(matchId, message) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('join_requests')
      .insert({ match_id: matchId, requester_id: user.id, message, status: 'PENDING' })
      .select().single()
    if (error) throw error
    return data
  },

  async approveJoinRequest(requestId) {
    const { data, error } = await supabase
      .from('join_requests')
      .update({ status: 'APPROVED', responded_at: new Date().toISOString() })
      .eq('id', requestId)
      .select().single()
    if (error) throw error
    return data
  },

  async rejectJoinRequest(requestId, rejectReason) {
    const { data, error } = await supabase
      .from('join_requests')
      .update({ status: 'REJECTED', responded_at: new Date().toISOString(), reject_reason: rejectReason })
      .eq('id', requestId)
      .select().single()
    if (error) throw error
    return data
  },

  async getRequestsForMatch(matchId) {
    const { data, error } = await supabase
      .from('join_requests')
      .select('*, requester:users(*, player_profiles(*))')
      .eq('match_id', matchId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data ?? []
  }
}

export const subscriptionService = {
  async getSubscription() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()
    // It's ok if no row exists (free plan)
    return data ?? { plan: 'FREE', status: 'active' }
  }
}

export const chatService = {
  async getMessages(matchId) {
    const { data: chat, error: chatErr } = await supabase
      .from('match_chats')
      .select('id')
      .eq('match_id', matchId)
      .single()
    if (chatErr) return []

    const { data, error } = await supabase
      .from('chat_messages')
      .select('*, sender:users(*, player_profiles(display_name, avatar_url))')
      .eq('chat_id', chat.id)
      .order('sent_at', { ascending: true })
    if (error) throw error
    return data ?? []
  },

  async sendMessage(matchId, content) {
    const { data: { user } } = await supabase.auth.getUser()
    // Ensure chat exists
    let { data: chat } = await supabase
      .from('match_chats')
      .select('id')
      .eq('match_id', matchId)
      .single()
    if (!chat) {
      const { data: newChat } = await supabase
        .from('match_chats')
        .insert({ match_id: matchId })
        .select().single()
      chat = newChat
    }
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({ chat_id: chat.id, sender_id: user.id, content })
      .select().single()
    if (error) throw error
    return data
  },

  subscribeToChat(matchId, onMessage) {
    return supabase
      .channel(`match-chat-${matchId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages'
      }, onMessage)
      .subscribe()
  }
}
