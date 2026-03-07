// ─── Player ─────────────────────────────────────────────────────────────────

export interface HitterPlayer {
  id: string
  n: string  // name
  t: string  // team
  ps: string // positions
  age: number
  adp: string
  pr: number  // projected price
  sc: number  // score
  ab: number; hr: number; rb: number; r: number; sb: number
  av: number; ob: number; h: number; so: number; gp: number
}

export interface PitcherPlayer {
  id: string
  n: string; t: string; ps: string
  age: number; adp: string; pr: number; sc: number
  ip: number; k: number; er: number; wh: number
  w: number; l: number; sv: number; hld: number; bb: number; gp: number
}

export type Player = HitterPlayer | PitcherPlayer

export function isPitcher(p: Player): p is PitcherPlayer {
  return 'ip' in p
}

export type PositionTab = 'C' | '1B' | '2B' | 'SS' | '3B' | 'OF' | 'DH' | 'SP' | 'RP'
export const POSITION_TABS: PositionTab[] = ['C','1B','2B','SS','3B','OF','DH','SP','RP']

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
  budget: number         // starting budget ($450)
  spent: number          // total committed
  roster: DraftEntry[]
  hometownPlayers: string[] // player names with hometown discount
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

export interface AuctionState {
  phase: AuctionPhase
  activePlayer: Player | null
  currentBid: number
  secondsLeft: number
  timerStart: number
  timerDuration: number
}

// ─── League Standing Categories ───────────────────────────────────────────────

export interface TeamStanding {
  managerId: string
  // Hitting
  r: number; hr: number; rbi: number; sb: number
  avg: number; obp: number; ab: number; h: number; so_h: number
  // Pitching
  w: number; sv: number; hld: number; k: number; era: number; whip: number
  ip: number; bb: number; l: number
}

// 18 scoring categories
export const HITTING_CATS = ['R','HR','RBI','SB','AVG','OBP'] as const
export const PITCHING_CATS = ['W','SV','HLD','K','ERA','WHIP','BB','L'] as const
export const ALL_CATS = [...HITTING_CATS, ...PITCHING_CATS] as const
export type Category = typeof ALL_CATS[number]

// Lower is better for these
export const LOWER_IS_BETTER: Category[] = ['ERA','WHIP','BB','L']
