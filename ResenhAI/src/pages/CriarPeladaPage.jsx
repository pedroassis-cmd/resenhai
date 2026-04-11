import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { matchService } from '../services/matchService.js'
import TopBar from '../components/shared/TopBar.jsx'
import BottomNav from '../components/shared/BottomNav.jsx'

const FORMATS = [
  { id: 'FUTSAL_5V5',  label: '5v5 Futsal' },
  { id: 'SOCIETY_7V7', label: '7v7 Society' },
  { id: 'FIELD_11V11', label: '11v11 Campo' },
  { id: 'BEACH_SOCCER',label: 'Beach Soccer' },
  { id: 'CUSTOM',      label: 'Personalizado' },
]

export default function CriarPeladaPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '', format: 'SOCIETY_7V7', scheduled_at: '', duration: 60,
    address: '', total_slots: 14, is_public: true, description: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  async function handleSubmit(e) {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const match = await matchService.createMatch({
        title: form.title, format: form.format, scheduled_at: form.scheduled_at,
        estimated_duration_min: Number(form.duration), custom_address: form.address,
        total_slots: Number(form.total_slots), is_public: form.is_public,
        description: form.description, status: 'OPEN'
      })
      navigate(`/partida/${match.id}`)
    } catch (err) {
      setError(err.message || 'Erro ao criar partida'); setLoading(false)
    }
  }

  const S = {
    label: { fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--on-surface-variant)', display: 'block', marginBottom: 8 },
    input: { width: '100%', background: 'var(--surface-container-lowest)', border: 'none', borderRadius: 12, padding: '14px 16px', color: 'var(--on-surface)', fontSize: 15, outline: 'none', fontFamily: 'DM Sans, sans-serif' },
    row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--surface)', display: 'flex', flexDirection: 'column' }}>
      <TopBar title="Criar Partida" showBack />
      <main style={{ flex: 1, padding: '24px 20px 100px', maxWidth: 640, margin: '0 auto', width: '100%' }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 32, letterSpacing: '-0.04em', textTransform: 'uppercase', marginBottom: 28 }}>Nova <span style={{ color: 'var(--primary)' }}>Partida</span></h1>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Title */}
          <div>
            <label style={S.label}>Nome da Partida</label>
            <input style={S.input} type="text" placeholder="Ex: Partida do Sábado" value={form.title} onChange={e => set('title', e.target.value)} required />
          </div>

          {/* Format pills */}
          <div>
            <label style={S.label}>Formato</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {FORMATS.map(f => (
                <button key={f.id} type="button" onClick={() => set('format', f.id)} style={{ padding: '8px 16px', borderRadius: 999, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', background: form.format === f.id ? 'var(--primary-container)' : 'var(--surface-container-high)', color: form.format === f.id ? 'var(--on-primary-container)' : 'var(--on-surface-variant)', transition: 'all 0.2s', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date/Time & Duration */}
          <div style={S.row}>
            <div>
              <label style={S.label}>Data e Hora</label>
              <input style={S.input} type="datetime-local" value={form.scheduled_at} onChange={e => set('scheduled_at', e.target.value)} required />
            </div>
            <div>
              <label style={S.label}>Duração (min)</label>
              <input style={S.input} type="number" min="30" step="15" value={form.duration} onChange={e => set('duration', e.target.value)} />
            </div>
          </div>

          {/* Address */}
          <div>
            <label style={S.label}>Local</label>
            <div style={{ position: 'relative' }}>
              <span className="material-symbols-outlined" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--on-surface-variant)', fontSize: 20, pointerEvents: 'none' }}>location_on</span>
              <input style={{ ...S.input, paddingLeft: 44 }} type="text" placeholder="Nome do espaço ou endereço" value={form.address} onChange={e => set('address', e.target.value)} />
            </div>
          </div>

          {/* Slots */}
          <div>
            <label style={S.label}>Vagas</label>
            <input style={S.input} type="number" min="4" max="50" value={form.total_slots} onChange={e => set('total_slots', e.target.value)} />
          </div>

          {/* Description */}
          <div>
            <label style={S.label}>Descrição (opcional)</label>
            <textarea style={{ ...S.input, resize: 'vertical', minHeight: 80 }} placeholder="Avisos, regras, detalhes..." value={form.description} onChange={e => set('description', e.target.value)} />
          </div>

          {/* Public toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface-container)', borderRadius: 16, padding: '16px 20px' }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: 14 }}>Partida Pública</p>
              <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginTop: 2 }}>Aparecer no feed "Buscar Jogo"</p>
            </div>
            <label style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.is_public} onChange={e => set('is_public', e.target.checked)} style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
              <div style={{ width: 52, height: 30, background: form.is_public ? 'var(--primary)' : 'var(--surface-container-highest)', borderRadius: 999, position: 'relative', transition: 'background 0.2s' }}>
                <div style={{ position: 'absolute', top: 3, left: form.is_public ? 'calc(100% - 27px)' : 3, width: 24, height: 24, background: '#fff', borderRadius: '50%', transition: 'left 0.2s' }} />
              </div>
            </label>
          </div>

          {error && <p style={{ color: 'var(--error)', fontSize: 13, textAlign: 'center' }}>{error}</p>}

          <button type="submit" disabled={loading} style={{ width: '100%', background: 'var(--primary-container)', color: 'var(--on-primary-container)', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 16, textTransform: 'uppercase', letterSpacing: '-0.01em', padding: '16px 0', borderRadius: 14, cursor: 'pointer', boxShadow: '0 8px 24px rgba(28,184,91,0.3)', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span className="material-symbols-outlined">sports_soccer</span>
            {loading ? 'Criando...' : 'Criar Partida'}
          </button>
        </form>
      </main>
      <BottomNav />
    </div>
  )
}
