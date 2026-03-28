import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { chatService } from '../services/radarService.js'
import TopBar from '../components/shared/TopBar.jsx'
import BottomNav from '../components/shared/BottomNav.jsx'

const MOCK_MESSAGES = [
  { id: 'm1', sender_id: 'other', content: 'Galera, alguém consegue chegar mais cedo hoje?', sent_at: new Date(Date.now() - 3600000).toISOString(), sender: { player_profiles: [{ display_name: 'Bruno Silva' }] } },
  { id: 'm2', sender_id: 'me', content: 'Consigo chegar às 19h30!', sent_at: new Date(Date.now() - 2400000).toISOString(), sender: { player_profiles: [{ display_name: 'Você' }] } },
  { id: 'm3', sender_id: 'other2', content: 'Eu também! Vejo vocês lá 🔥', sent_at: new Date(Date.now() - 1200000).toISOString(), sender: { player_profiles: [{ display_name: 'Marcos' }] } },
]

export default function ChatPage() {
  const { matchId } = useParams()
  const { user, profile } = useAuth()
  const [messages, setMessages] = useState(MOCK_MESSAGES)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    chatService.getMessages(matchId || 'mock')
      .then(data => { if (data?.length) setMessages(data) })
      .catch(() => {})

    const ch = chatService.subscribeToChat(matchId || 'mock', (payload) => {
      setMessages(prev => [...prev, payload.new])
    })
    return () => ch?.unsubscribe?.()
  }, [matchId])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function handleSend(e) {
    e.preventDefault()
    if (!input.trim()) return
    const text = input; setInput(''); setSending(true)
    const optimistic = { id: `opt-${Date.now()}`, sender_id: 'me', content: text, sent_at: new Date().toISOString(), sender: { player_profiles: [{ display_name: profile?.display_name || 'Você' }] } }
    setMessages(prev => [...prev, optimistic])
    try { await chatService.sendMessage(matchId || 'mock', text) }
    catch { /* optimistic already shown */ }
    finally { setSending(false) }
  }

  function timeStr(iso) {
    try { return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }
    catch { return '' }
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--surface)', display: 'flex', flexDirection: 'column' }}>
      <TopBar title="Chat da Pelada" showBack />

      {/* Messages */}
      <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 90 }}>
        {messages.map(msg => {
          const isMe = msg.sender_id === 'me' || msg.sender_id === user?.id
          const name = msg.sender?.player_profiles?.[0]?.display_name || 'Jogador'
          return (
            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
              {!isMe && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4, marginLeft: 12 }}>{name}</span>}
              <div style={{ maxWidth: '75%', background: isMe ? 'var(--primary-container)' : 'var(--surface-container-high)', color: isMe ? 'var(--on-primary-container)' : 'var(--on-surface)', padding: '12px 16px', borderRadius: isMe ? '20px 20px 6px 20px' : '20px 20px 20px 6px', fontSize: 14, lineHeight: 1.5, fontWeight: 500 }}>
                {msg.content}
              </div>
              <span style={{ fontSize: 10, color: 'var(--on-surface-variant)', marginTop: 4, marginLeft: 8, marginRight: 8 }}>{timeStr(msg.sent_at)}</span>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div style={{ position: 'fixed', bottom: 80, left: 0, right: 0, padding: '12px 16px', background: 'rgba(27,41,33,0.9)', backdropFilter: 'blur(16px)', borderTop: '1px solid rgba(64,74,68,0.2)', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
        <form onSubmit={handleSend} style={{ display: 'flex', gap: 10, width: '100%', alignItems: 'center' }}>
          <input value={input} onChange={e => setInput(e.target.value)} placeholder="Escreva uma mensagem..." style={{ flex: 1, background: 'var(--surface-container)', border: 'none', borderRadius: 20, padding: '12px 18px', color: 'var(--on-surface)', fontSize: 14, outline: 'none', fontFamily: 'DM Sans, sans-serif' }} />
          <button type="submit" disabled={!input.trim() || sending} style={{ width: 44, height: 44, borderRadius: '50%', background: input.trim() ? 'var(--primary-container)' : 'var(--surface-container-high)', border: 'none', cursor: input.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
            <span className="material-symbols-outlined" style={{ color: input.trim() ? 'var(--on-primary-container)' : 'var(--on-surface-variant)', fontSize: 22 }}>send</span>
          </button>
        </form>
      </div>
      <BottomNav />
    </div>
  )
}
