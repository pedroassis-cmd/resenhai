/**
 * teamDraw.js — utilitários puros de sorteio de times
 *
 * Regras:
 *  1. Só acontece quando confirmedPlayers.length >= totalSlots
 *  2. Goleiros são distribuídos primeiro (um por time)
 *  3. Restantes ordenados por nível DESC → snake-draft alternado
 *  4. Sem mutação de arrays; todas as funções são puras
 */

/** Embaralha array (Fisher-Yates) — sem mutação */
export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Verifica se a partida está completa (todos os slots preenchidos).
 * Deduplica por user_id antes de contar.
 */
export function isMatchFull(players, totalSlots) {
  const unique = [...new Map(players.map(p => [p.user_id ?? p.id, p])).values()]
  return unique.length >= totalSlots
}

/**
 * Mapeia posição do banco para chave interna de sorteio.
 * O banco usa GOALKEEPER/DEFENDER/MIDFIELDER/FORWARD/ANY.
 * O MatchesHub usava GK/DF/MF/FW — normalizamos aqui.
 */
function isGoalkeeper(player) {
  const pos = player.preferred_position || player.primary_position || player.pos || ''
  return pos === 'GOALKEEPER' || pos === 'GK'
}

/**
 * Retorna o skill level numérico de um jogador.
 * Prioriza skill_score (0-10 do banco) → level (mock) → padrão 5.
 */
function skillOf(player) {
  if (typeof player.skill_score === 'number') return player.skill_score
  if (typeof player.level === 'number') return player.level * 2 // converte 1-5 → 2-10
  return 5
}

/**
 * Sorteia dois times equilibrados pelo algoritmo snake-draft.
 *
 * Algoritmo:
 *  1. Deduplica por user_id
 *  2. Separa goleiros (embaralha) → distribui 1 por time
 *  3. GKs excedentes vão para linha
 *  4. Linha ordenada por skill DESC → snake-draft entre times
 *
 * @param {Array} players  Lista de jogadores (RSVPs com profile embutido ou objetos simples)
 * @returns {{ teamA: Array, teamB: Array }}
 */
export function drawTeams(players) {
  // 1. Deduplica
  const unique = [...new Map(players.map(p => [p.user_id ?? p.id, p])).values()]

  // 2. Separa goleiros
  const gks  = shuffle(unique.filter(p => isGoalkeeper(p)))
  const field = shuffle(unique.filter(p => !isGoalkeeper(p)))

  const teamA = []
  const teamB = []

  // 3. Distribui goleiros (máx 1 por time)
  if (gks[0]) teamA.push(gks[0])
  if (gks[1]) teamB.push(gks[1])
  const extraGks = gks.slice(2)

  // 4. Snake-draft da linha + GKs excedentes
  const rest = [...field, ...extraGks].sort((a, b) => skillOf(b) - skillOf(a))

  rest.forEach((p, i) => {
    const round = Math.floor(i / 2)
    const goesA = round % 2 === 0 ? i % 2 === 0 : i % 2 !== 0
    if (goesA) teamA.push(p)
    else teamB.push(p)
  })

  return { teamA, teamB }
}
