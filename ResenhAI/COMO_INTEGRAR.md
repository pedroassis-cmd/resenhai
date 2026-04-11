# 📋 Como integrar as novas funcionalidades ao PeladaApp

## Arquivos criados/modificados

```
src/
├── services/
│   ├── googleMapsService.js   ← NOVO: integração completa com Google Maps API
│   └── rsvpService.js         ← NOVO: confirmação de presença e controle de faltas
├── pages/
│   ├── DashboardPartidaPage.jsx  ← NOVO: dashboard com painel de presença
│   └── RadarDeSubstitutosPage.jsx ← NOVO: radar de suplentes via Google Maps
├── hooks/
│   └── useUserLocation.js     ← NOVO: hook para geolocalização do usuário
└── (substitua os originais pelos arquivos desta pasta)

MIGRATION_SUPABASE.sql         ← Execute no SQL Editor do Supabase
```

---

## Passo 1 — Chave do Google Maps

No arquivo `.env`, adicione:

```env
VITE_GOOGLE_MAPS_API_KEY=SUA_CHAVE_AQUI
```

### APIs necessárias no Google Cloud Console:
1. Acesse https://console.cloud.google.com
2. Ative as seguintes APIs no seu projeto:
   - **Maps JavaScript API**
   - **Places API**
   - **Geocoding API**
   - **Distance Matrix API**
   - **Maps Static API** (para o preview do mapa na RadarPage)
3. Gere uma API Key e restrinja por domínio (recomendado)

---

## Passo 2 — Migration do banco de dados

1. Acesse o **SQL Editor** no painel do Supabase
2. Copie e execute o conteúdo de `MIGRATION_SUPABASE.sql`

Isso cria/adiciona:
- Tabela `match_rsvp` (confirmações de presença)
- Colunas `location_lat`, `location_lng`, `last_location_update`, `available_as_substitute` em `profiles`
- Colunas `location_lat`, `location_lng`, `location_name` em `matches`
- RLS policies e índices

---

## Passo 3 — Rotas no App.jsx

Certifique-se que as rotas existem no seu `App.jsx`:

```jsx
import DashboardPartidaPage from './pages/DashboardPartidaPage';
import RadarDeSubstitutosPage from './pages/RadarDeSubstitutosPage';

// Dentro do <Routes>:
<Route path="/partida/:matchId"            element={<DashboardPartidaPage />} />
<Route path="/radar-substitutos/:matchId" element={<RadarDeSubstitutosPage />} />
```

---

## Passo 4 — Habilitar Realtime no Supabase

No painel Supabase:
1. Vá em **Database → Replication**
2. Ative a tabela `match_rsvp` para Realtime

Isso permite que o dashboard atualize automaticamente quando um jogador confirma presença.

---

## Passo 5 — Geolocalização dos usuários

Para que o radar funcione, os usuários precisam ter `location_lat` e `location_lng` no perfil.

### Opção A — Atualizar via hook (automático)
No seu componente raiz ou página inicial, use:

```jsx
import { useUserLocation } from './hooks/useUserLocation';

function App() {
  useUserLocation({ autoUpdate: true, updateInterval: 5 * 60 * 1000 });
  // ...
}
```

### Opção B — Botão manual no perfil
Permita que o usuário ative "disponível como suplente" e compartilhe localização na página de perfil.

### Opção C — No login
Chamar `updateUserLocation(supabase, userId)` após autenticação.

---

## Como funciona o fluxo completo

### Confirmação de presença (suplente)

```
Admin cria partida
    ↓
Admin convida suplente via "Buscar Suplente" no dashboard
    ↓
Suplente aparece na aba "Suplentes" com status "Pendente"
    ↓
Suplente confirma no próprio app (botão "✓ Confirmar")
    ↓
Se não confirmar: Admin usa menu ⋯ → "Registrar Falta"
    ↓
Dashboard atualiza em tempo real via Supabase Realtime
```

### Busca de substitutos via Google Maps

```
Admin acessa "Radar de Suplentes"
    ↓
App usa Google Maps API para calcular distâncias de jogadores disponíveis
    ↓
Lista ordenada do mais próximo ao mais distante
    ↓
Admin convida com um clique → jogador aparece como suplente "Pendente"
```

---

## Campos usados nas tabelas

### `match_rsvp`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `match_id` | UUID | ID da partida |
| `player_id` | UUID | ID do jogador |
| `role` | text | `'titular'` ou `'suplente'` |
| `status` | text | `'confirmado'`, `'pendente'`, `'ausente'` |
| `confirmed_at` | timestamptz | Quando confirmou |
| `absent_at` | timestamptz | Quando falta foi registrada |
| `absent_reason` | text | Motivo da falta (opcional) |

### `profiles` (novos campos)
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `location_lat` | float8 | Latitude atual |
| `location_lng` | float8 | Longitude atual |
| `last_location_update` | timestamptz | Última atualização |
| `available_as_substitute` | boolean | Disponível para ser suplente |

### `matches` (novos campos)
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `location_lat` | float8 | Latitude do campo |
| `location_lng` | float8 | Longitude do campo |
| `location_name` | text | Nome do local |
