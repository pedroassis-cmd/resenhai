const POSITION_LABELS = {
  GOALKEEPER: 'Goleiro', DEFENDER: 'Zagueiro',
  MIDFIELDER: 'Meia',   FORWARD: 'Atacante', ANY: 'Qualquer'
}

export default function PlayerCard({ player, distance, onCall, onInvite }) {
  const profile = player?.player_profiles?.[0] || player?.profile || {}
  const initials = (profile.display_name || player?.email || 'J').substring(0, 2).toUpperCase()
  const score = profile.skill_score?.toFixed(1) ?? '—'
  const position = POSITION_LABELS[profile.primary_position] || profile.primary_position || '—'

  return (
    <div style={{
      background: 'var(--surface-container)',
      borderRadius: 20, padding: 20, display: 'flex', flexDirection: 'column', gap: 16,
    }}>
      {distance != null && (
        <div style={{ position: 'absolute', top: 16, right: 16 }}>
          <span style={{ background: 'rgba(28,184,91,0.12)', color: '#69f58f', fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 999, border: '1px solid rgba(105,245,143,0.2)', textTransform: 'uppercase' }}>
            A {distance.toFixed(1)} km
          </span>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        {/* Avatar */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{ width: 72, height: 72, borderRadius: 16, background: 'var(--surface-container-highest)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 24, color: '#1cb85b', overflow: 'hidden', border: '1px solid rgba(65,74,68,0.3)' }}>
            {profile.avatar_url ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
          </div>
          {/* Skill score badge */}
          <div style={{ position: 'absolute', bottom: -6, right: -6, background: '#1cb85b', color: '#00290e', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 12, width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {score}
          </div>
        </div>
        {/* Info */}
        <div style={{ flex: 1 }}>
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, letterSpacing: '-0.04em', textTransform: 'uppercase', color: 'var(--on-surface)', lineHeight: 1 }}>
            {profile.display_name || 'Jogador'}
          </h3>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: 13, marginTop: 4 }}>
            {position} · Disponível agora
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: 'rgba(241,252,243,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#f8a010', fontVariationSettings: "'FILL' 1" }}>star</span>
              {score} ({profile.total_matches ?? 0} jogos)
            </span>
            {profile.total_matches >= 10 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: 'rgba(241,252,243,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#1cb85b' }}>check_circle</span>
                Pontual
              </span>
            )}
          </div>
        </div>
      </div>

      {(onCall || onInvite) && (
        <button
          onClick={onCall || onInvite}
          style={{ width: '100%', background: '#1cb85b', color: '#00290e', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 16, letterSpacing: '-0.02em', textTransform: 'uppercase', padding: '14px 0', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.15s', cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.background = '#5ae682'}
          onMouseLeave={e => e.currentTarget.style.background = '#1cb85b'}
        >
          <span className="material-symbols-outlined">bolt</span>
          Chamar para o jogo
        </button>
      )}
    </div>
  )
}
