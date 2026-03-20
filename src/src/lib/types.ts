// ─── Player ─────────────────────────────────────────────────────────────────

export interface HitterPlayer {
  id: string
  n: string   // name
  t: string   // team
  ps: string  // positions
  age: number
  adp: string
  pr: number  // projected price
  sc: number  // score
  // 9 hitting categories
  r: number; d2: number; d3: number; hr: number; rb: number
  sbn: number; so: number; av: number; ob: number
  // extra
  ab: number; h: number; gp: number
}

export interface PitcherPlayer {
  id: string
  n: string; t: string; ps: string
  age: number; adp: string; pr: number; sc: number
  // 9 pitching categories
  w: number; l: number; sv: number; hld: number
  er: number; wh: number; bb: number; k: number; qa3: number
  // extra
  ip: number; gp: number
}

export type Player = HitterPlayer | PitcherPlayer

export function isPitcher(p: Player): p is PitcherPlayer {
  return 'qa3' in p
}

export type PositionTab = 'C' | '1B' | '2B' | 'SS' | '3B' | 'LF' | 'CF' | 'RF' | 'OF' | 'DH' | 'SP' | 'RP' | 'PROS'
export const POSITION_TABS: PositionTab[] = ['C','1B','2B','SS','3B','LF','CF','RF','OF','DH','SP','RP','PROS']

// ─── Draft Types ─────────────────────────────────────────────────────────────

export type DraftType = 'auction' | 'keeper' | 'qualifying_offer'
export type RosterLevel = 'major' | 'minor'

export interface DraftEntry {
  player: Player
  managerId: string
  price: number
  draftType: DraftType
  rosterLevel: RosterLevel
  timestamp: number
}

// ─── Manager ─────────────────────────────────────────────────────────────────

export interface Manager {
  id: string
  name: string
  budget: number
  spent: number
  roster: DraftEntry[]
  hometownPlayers: string[]
}

export const WAB_MANAGERS: Pick<Manager, 'id' | 'name'>[] = [
  { id: 'm1',  name: 'Adam Fromal' },
  { id: 'm2',  name: 'Arjun Baradwaj' },
  { id: 'm3',  name: 'Bretton McIlrath' },
  { id: 'm4',  name: 'Chris Glazier' },
  { id: 'm5',  name: 'Eric Fleury' },
  { id: 'm6',  name: 'Jacob Newcomer' },
  { id: 'm7',  name: 'Michael Tumey' },
  { id: 'm8',  name: 'Robert Ray' },
  { id: 'm9',  name: 'Shashank Bharadwaj' },
  { id: 'm10', name: 'Shorty Hoffman' },
]

// ─── Auction State ────────────────────────────────────────────────────────────

export type AuctionPhase = 'idle' | 'bidding' | 'going_once' | 'going_twice' | 'sold' | 'logging'

// ─── League Scoring Categories (18 total) ────────────────────────────────────

export interface TeamStanding {
  managerId: string
  // 9 hitting categories
  r: number; d2: number; d3: number; hr: number; rbi: number
  sbn: number; so_h: number; avg: number; obp: number
  // 9 pitching categories
  w: number; l: number; sv: number; hld: number
  era: number; whip: number; bb: number; k: number; qa3: number
  // helpers for weighted rate stats
  ab: number; ip: number
}

export const HITTING_CATS  = ['R','2B','3B','HR','RBI','SBN','SO','AVG','OBP'] as const
export const PITCHING_CATS = ['W','L','SV','HLD','ERA','WHIP','BB','K','QA3'] as const
export const ALL_CATS = [...HITTING_CATS, ...PITCHING_CATS] as const
export type Category = typeof ALL_CATS[number]

// Lower value = better rank for these
export const LOWER_IS_BETTER: Category[] = ['SO','ERA','WHIP','BB','L']

// ─── Player Tags ─────────────────────────────────────────────────────────────
export type PlayerTag = 'avoid' | 'target' | 'star'

export const TAG_CONFIG: Record<PlayerTag, { label: string; emoji: string; color: string; bg: string }> = {
  avoid:  { label: 'Avoid',  emoji: '🚫', color: '#f87171', bg: '#450a0a' },
  target: { label: 'Target', emoji: '🎯', color: '#34d399', bg: '#064e3b' },
  star:   { label: '★',     emoji: '★',  color: '#c084fc', bg: '#3b0764' },
}
