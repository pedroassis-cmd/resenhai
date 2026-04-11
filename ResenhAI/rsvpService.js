/**
 * rsvpService.js
 * Serviço de confirmação de presença (RSVP) e controle de faltas
 *
 * TABELA SUPABASE NECESSÁRIA: match_rsvp
 *
 * CREATE TABLE match_rsvp (
 *   id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   match_id     UUID REFERENCES matches(id) ON DELETE CASCADE,
 *   player_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
 *   role         TEXT NOT NULL DEFAULT 'titular',   -- 'titular' | 'suplente'
 *   status       TEXT NOT NULL DEFAULT 'pendente',  -- 'confirmado' | 'ausente' | 'pendente'
 *   confirmed_at TIMESTAMPTZ,
 *   absent_at    TIMESTAMPTZ,
 *   absent_reason TEXT,
 *   notified_at  TIMESTAMPTZ,
 *   created_at   TIMESTAMPTZ DEFAULT NOW(),
 *   updated_at   TIMESTAMPTZ DEFAULT NOW(),
 *   UNIQUE(match_id, player_id)
 * );
 *
 * -- Habilitar RLS:
 * ALTER TABLE match_rsvp ENABLE ROW LEVEL SECURITY;
 * -- Política: admin da partida pode ver e editar tudo; jogador pode ver e confirmar o próprio RSVP
 */

import { supabase } from '../supabase';

// ─── Leitura ──────────────────────────────────────────────────────────────────

/**
 * Busca todos os RSVPs de uma partida com dados do jogador.
 */
export async function getMatchRsvps(matchId) {
  const { data, error } = await supabase
    .from('match_rsvp')
    .select(`
      *,
      profiles:player_id (
        id,
        full_name,
        avatar_url,
        position,
        rating,
        phone
      )
    `)
    .eq('match_id', matchId)
    .order('role', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Busca o RSVP de um jogador específico em uma partida.
 */
export async function getPlayerRsvp(matchId, playerId) {
  const { data, error } = await supabase
    .from('match_rsvp')
    .select('*')
    .eq('match_id', matchId)
    .eq('player_id', playerId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Conta confirmados, ausentes e pendentes de uma partida.
 */
export async function getRsvpSummary(matchId) {
  const { data, error } = await supabase
    .from('match_rsvp')
    .select('status, role')
    .eq('match_id', matchId);

  if (error) throw error;

  return data.reduce(
    (acc, row) => {
      acc.total++;
      acc[row.status] = (acc[row.status] || 0) + 1;
      if (row.role === 'suplente') acc.suplentes++;
      if (row.role === 'titular') acc.titulares++;
      return acc;
    },
    { total: 0, confirmado: 0, ausente: 0, pendente: 0, titulares: 0, suplentes: 0 }
  );
}

// ─── Criação e convite ────────────────────────────────────────────────────────

/**
 * Adiciona um jogador à partida como suplente convidado.
 * Usado pelo admin quando convida um substituto.
 */
export async function inviteSubstitute(matchId, playerId) {
  const { data, error } = await supabase
    .from('match_rsvp')
    .upsert(
      {
        match_id: matchId,
        player_id: playerId,
        role: 'suplente',
        status: 'pendente',
        notified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'match_id,player_id' }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Adiciona um jogador como titular na partida.
 */
export async function addTitular(matchId, playerId) {
  const { data, error } = await supabase
    .from('match_rsvp')
    .upsert(
      {
        match_id: matchId,
        player_id: playerId,
        role: 'titular',
        status: 'confirmado',
        confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'match_id,player_id' }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── Ações do jogador ─────────────────────────────────────────────────────────

/**
 * Jogador confirma presença na partida.
 * Pode ser chamado pelo próprio jogador.
 */
export async function confirmPresence(matchId, playerId) {
  const { data, error } = await supabase
    .from('match_rsvp')
    .update({
      status: 'confirmado',
      confirmed_at: new Date().toISOString(),
      absent_at: null,
      absent_reason: null,
      updated_at: new Date().toISOString(),
    })
    .eq('match_id', matchId)
    .eq('player_id', playerId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── Ações do admin ───────────────────────────────────────────────────────────

/**
 * Admin marca um jogador como ausente (não compareceu).
 * @param {string} matchId
 * @param {string} playerId
 * @param {string} reason - motivo opcional da falta
 */
export async function markPlayerAbsent(matchId, playerId, reason = '') {
  const { data, error } = await supabase
    .from('match_rsvp')
    .update({
      status: 'ausente',
      absent_at: new Date().toISOString(),
      absent_reason: reason || null,
      updated_at: new Date().toISOString(),
    })
    .eq('match_id', matchId)
    .eq('player_id', playerId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Admin reverte status de ausente para pendente (correção de erro).
 */
export async function revertAbsent(matchId, playerId) {
  const { data, error } = await supabase
    .from('match_rsvp')
    .update({
      status: 'pendente',
      absent_at: null,
      absent_reason: null,
      updated_at: new Date().toISOString(),
    })
    .eq('match_id', matchId)
    .eq('player_id', playerId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Admin promove suplente a titular (quando um titular falta e o suplente assume).
 */
export async function promoteSubstitute(matchId, playerId) {
  const { data, error } = await supabase
    .from('match_rsvp')
    .update({
      role: 'titular',
      status: 'confirmado',
      confirmed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('match_id', matchId)
    .eq('player_id', playerId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Remove um jogador da partida.
 */
export async function removeFromMatch(matchId, playerId) {
  const { error } = await supabase
    .from('match_rsvp')
    .delete()
    .eq('match_id', matchId)
    .eq('player_id', playerId);

  if (error) throw error;
}

// ─── Realtime subscription ────────────────────────────────────────────────────

/**
 * Inscreve em mudanças de RSVP em tempo real.
 * @param {string} matchId
 * @param {function} callback - chamada com o payload de mudança
 * @returns {Object} subscription (chame .unsubscribe() para cancelar)
 */
export function subscribeToRsvpChanges(matchId, callback) {
  return supabase
    .channel(`match_rsvp:${matchId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'match_rsvp', filter: `match_id=eq.${matchId}` },
      callback
    )
    .subscribe();
}
