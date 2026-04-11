# PeladaApp — Instruções de Integração

## Arquivos modificados / criados

```
PeladaApp/
└── src/
    ├── pages/
    │   ├── DashboardPartidaPage.jsx   ← MODIFICADO
    │   └── RadarDeSubstitutosPage.jsx ← MODIFICADO
    └── services/
        ├── rsvpService.js             ← MODIFICADO
        └── googleMapsService.js       ← NOVO
```

---

## 1. Configurar a chave do Google Maps

No arquivo `.env` do projeto, adicione:

```
VITE_GOOGLE_MAPS_API_KEY=AIzaSy_SUA_CHAVE_AQUI
```

No `.env.example`, adicione também:

```
VITE_GOOGLE_MAPS_API_KEY=
```

### APIs a ativar no Google Cloud Console (console.cloud.google.com):
| API | Para que serve |
|-----|----------------|
| Maps Embed API | Exibir mapa na aba "Local" da partida |
| Geocoding API | Converter endereço em coordenadas |
| Places API (Nearby Search) | Buscar quadras próximas no Radar |
| Maps JavaScript API | (Opcional) Mapa interativo futuro |

> **Sem a chave:** o app funciona normalmente. O mapa da aba "Local" exibe um placeholder clicável. O Radar busca jogadores no Supabase sem filtro de distância e usa dados mock de quadras.

---

## 2. Banco de dados — Supabase

### Verificar que a tabela `rsvps` aceita os novos status:

```sql
-- Verificar constraint de status existente
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'rsvps'::regclass AND contype = 'c';

-- Se houver um CHECK constraint nos status, adicionar NO_SHOW:
ALTER TABLE rsvps
  DROP CONSTRAINT rsvps_status_check;

ALTER TABLE rsvps
  ADD CONSTRAINT rsvps_status_check
  CHECK (status IN ('INVITED','PENDING','CONFIRMED','DECLINED','WAITLIST','NO_SHOW'));
```

### (Opcional) Campo para indicar que é suplente:

```sql
ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS is_substitute BOOLEAN DEFAULT FALSE;
```

---

## 3. Controle de presença (DashboardPartidaPage)

### Como funciona:

- O **admin** (organizador da partida) vê controles extras na aba "Escalação"
- **Suplentes convidados** (`status = 'INVITED'`) aparecem em seção separada com dois botões:
  - **"Chegou"** → chama `rsvpService.confirmGuestPresence()` → status vira `CONFIRMED`
  - **"Faltou"** → chama `rsvpService.markNoShow()` → status vira `NO_SHOW`
- Jogadores confirmados (`CONFIRMED`) também têm o botão **"Faltou"** para o admin
- Jogadores com `NO_SHOW` aparecem esmaecidos com badge "Faltou"
- Um **toast inline** confirma cada ação do admin

### Verificar `organizer_id` no modelo de dados:

O componente usa `match.organizer_id === user.id` para detectar admin.
Certifique-se que `matchService.getMatch()` retorna o campo `organizer_id`.
Se o campo tiver outro nome, atualize a linha no `DashboardPartidaPage.jsx`:

```js
const isAdmin = user && match.organizer_id && user.id === match.organizer_id
```

---

## 4. Radar de Substitutos (RadarDeSubstitutosPage)

### Fluxo de busca:

1. Usuário clica **"Buscar por Localização"**
2. App pede permissão de geolocalização via `navigator.geolocation`
3. Em paralelo: busca jogadores no Supabase + quadras próximas via Places API
4. Jogadores são ordenados por distância real (fórmula de Haversine)
5. Quadras próximas aparecem em painel expansível com link para o Google Maps

### Seletor de raio:
- O usuário pode escolher **5km / 10km / 20km** antes de buscar
- O raio é passado para `radarService.getAvailablePlayers()` e `findNearbySportVenues()`

### Geolocalização negada:
- O app exibe aviso amarelo e continua a busca **sem filtro de distância**
- Nunca bloqueia o usuário

---

## 5. Novos métodos em rsvpService.js

```js
// Marcar jogador como ausente (admin)
await rsvpService.markNoShow(matchId, userId)

// Confirmar chegada de suplente convidado (admin)
await rsvpService.confirmGuestPresence(matchId, userId)
```

---

## 6. Funções em googleMapsService.js

```js
import {
  loadGoogleMapsScript,   // Carrega SDK do Maps (lazy, uma vez)
  geocodeAddress,         // Endereço → { lat, lng }
  getMapEmbedUrl,         // URL para <iframe> do Maps
  getDirectionsUrl,       // Deep link "Como chegar"
  getShareLocationUrl,    // URL para compartilhar local
  getUserLocation,        // navigator.geolocation → { lat, lng }
  findNearbySportVenues,  // Places Nearby Search → quadras
  sortPlayersByDistance,  // Ordena jogadores por distância real
} from '../services/googleMapsService.js'
```
