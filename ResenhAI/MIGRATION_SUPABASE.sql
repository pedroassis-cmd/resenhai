-- =============================================================================
-- MIGRATION: Confirmação de Presença + Geolocalização
-- PeladaApp - Aplique este script no SQL Editor do Supabase
-- =============================================================================

-- 1. Tabela de RSVP (confirmação de presença)
-- =============================================================================
CREATE TABLE IF NOT EXISTS match_rsvp (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id       UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role           TEXT NOT NULL DEFAULT 'titular'   CHECK (role IN ('titular', 'suplente')),
  status         TEXT NOT NULL DEFAULT 'pendente'  CHECK (status IN ('confirmado', 'ausente', 'pendente')),
  confirmed_at   TIMESTAMPTZ,
  absent_at      TIMESTAMPTZ,
  absent_reason  TEXT,
  notified_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(match_id, player_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_match_rsvp_match_id  ON match_rsvp(match_id);
CREATE INDEX IF NOT EXISTS idx_match_rsvp_player_id ON match_rsvp(player_id);
CREATE INDEX IF NOT EXISTS idx_match_rsvp_status    ON match_rsvp(status);

-- RLS
ALTER TABLE match_rsvp ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DROP POLICY IF EXISTS "Leitura pública de rsvp da partida" ON match_rsvp;
CREATE POLICY "Leitura pública de rsvp da partida" ON match_rsvp
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin da partida pode inserir rsvp" ON match_rsvp;
CREATE POLICY "Admin da partida pode inserir rsvp" ON match_rsvp
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT created_by FROM matches WHERE id = match_id)
    OR auth.uid() = player_id
  );

DROP POLICY IF EXISTS "Admin ou jogador pode atualizar rsvp" ON match_rsvp;
CREATE POLICY "Admin ou jogador pode atualizar rsvp" ON match_rsvp
  FOR UPDATE USING (
    auth.uid() IN (SELECT created_by FROM matches WHERE id = match_id)
    OR auth.uid() = player_id
  );

DROP POLICY IF EXISTS "Admin da partida pode deletar rsvp" ON match_rsvp;
CREATE POLICY "Admin da partida pode deletar rsvp" ON match_rsvp
  FOR DELETE USING (
    auth.uid() IN (SELECT created_by FROM matches WHERE id = match_id)
  );

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS match_rsvp_updated_at ON match_rsvp;
CREATE TRIGGER match_rsvp_updated_at
  BEFORE UPDATE ON match_rsvp
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 2. Colunas de geolocalização na tabela profiles
-- =============================================================================
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS location_lat           DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS location_lng           DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS last_location_update   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS available_as_substitute BOOLEAN DEFAULT FALSE;

-- Índice geográfico aproximado (para filtros de raio)
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles(location_lat, location_lng)
  WHERE location_lat IS NOT NULL AND location_lng IS NOT NULL;

-- 3. Colunas de localização na tabela matches
-- =============================================================================
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS location_lat  DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS location_lng  DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS location_name TEXT;

-- 4. Habilitar Realtime para match_rsvp
-- =============================================================================
-- No dashboard Supabase: Database > Replication > Tables > habilite match_rsvp
-- Ou via SQL:
ALTER PUBLICATION supabase_realtime ADD TABLE match_rsvp;

-- =============================================================================
-- FIM DA MIGRATION
-- =============================================================================
