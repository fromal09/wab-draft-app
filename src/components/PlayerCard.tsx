'use client'
import { Player, isPitcher, Manager, PlayerTag, TAG_CONFIG } from '@/lib/types'
import { PriceBadge } from './PriceBadge'
import PlayerStatGrid from './PlayerStatGrid'
import CategoryRadar from './CategoryRadar'
import { HitterBars, PitcherBars } from './SavantBars'
import RollingXwOBA from './RollingXwOBA'

// ─── Pitcher List SV Rankings ────────────────────────────────────────────────
const PL_SV_RANKS: Record<string, number> = {
  'Mason Miller': 1, 'Edwin Díaz': 2, 'Cade Smith': 3, 'Devin Williams': 4,
  'Andrés Muñoz': 5, 'Jhoan Duran': 6, 'Aroldis Chapman': 7, 'David Bednar': 8,
  'Daniel Palencia': 9, 'Jeff Hoffman': 10, 'Ryan Helsley': 11, 'Pete Fairbanks': 12,
  'Griffin Jax': 13, 'Josh Hader': 14, 'Trevor Megill': 15, 'Emilio Pagán': 16,
  'Raisel Iglesias': 17, 'Kenley Jansen': 18, 'Robert Suarez': 19, 'Abner Uribe': 20,
  'Bryan Abreu': 21, 'Ryan Walker': 22, 'Dennis Santana': 23, 'Seranthony Domínguez': 24,
  'Robert Garcia': 25, 'Paul Sewald': 26, 'Carlos Estévez': 27, 'Kirby Yates': 28,
  'Jeremiah Estrada': 29, 'Garrett Whitlock': 30, 'Tanner Scott': 31, 'Adrian Morejon': 32,
  'Grant Taylor': 33, 'Garrett Cleavinger': 34, 'Kyle Finnegan': 35, 'Will Vest': 36,
  'Edwin Uceta': 37, "Riley O'Brien": 38, 'Clayton Beeter': 39, 'Taylor Rogers': 40,
  'Drew Pomeranz': 41, 'JoJo Romero': 42, 'Chris Martin': 43, 'Jordan Romano': 44,
  'Cole Henry': 45, 'Victor Vodnik': 46, 'Mark Leiter Jr.': 47, 'Ryne Stanek': 48,
  'Jordan Leasure': 49, 'Hogan Harris': 50, 'Bryan Baker': 51, 'Matt Svanson': 52,
  'Liam Hendriks': 53, 'Matt Strahm': 54, 'Kevin Ginkel': 55, 'Lucas Erceg': 56,
  'Jonathan Loáisiga': 57, 'Elvis Alvarado': 58, 'Scott Barlow': 59, 'Justin Sterner': 60,
  'Matt Brash': 61, 'Luke Weaver': 62, 'Phil Maton': 63, 'Mason Montgomery': 64,
  'Camilo Doval': 65, 'Louis Varland': 66, 'José Alvarado': 67, 'Jose A. Ferrer': 68,
  'Brad Keller': 69, 'Hunter Gaddis': 70, 'Steven Okert': 71, 'Fernando Cruz': 72,
  'Graham Ashcraft': 73, 'Connor Phillips': 74, 'Gus Varland': 75, 'Gregory Soto': 76,
  'Tony Santillan': 77, 'Hunter Harvey': 78, 'Justin Slaten': 79, 'Juan Mejia': 80,
  'Alex Vesia': 81, 'Dylan Lee': 82, 'Gabe Speier': 83, 'Calvin Faucher': 84,
  'Isaac Mattson': 85, 'Andrew Nardi': 86, 'Nick Mears': 87, 'Anthony Bender': 88,
  'Cole Sands': 89, 'Angel Zerpa': 90, 'Shawn Armstrong': 91, 'Eric Orze': 92,
  'Josh Sborz': 93, 'Griff McGarry': 94, 'Orion Kerkering': 95, 'Gregory Santos': 96,
  'Zach Agnos': 97, 'Eduard Bazardo': 98, 'Bryan King': 99, 'Erik Sabrowski': 100,
}

// ─── Pitcher List SP Rankings ────────────────────────────────────────────────
const PL_SP_RANKS: Record<string, number> = {
  'Garrett Crochet': 1, 'Paul Skenes': 2, 'Tarik Skubal': 3, 'Bryan Woo': 4,
  'Yoshinobu Yamamoto': 5, 'Hunter Brown': 6, 'Cristopher Sánchez': 7, 'Max Fried': 8,
  'Shohei Ohtani': 9, 'Jacob deGrom': 10, 'Logan Gilbert': 11, 'Logan Webb': 12,
  'Freddy Peralta': 13, 'Chris Sale': 14, 'Cole Ragans': 15, 'George Kirby': 16,
  'Tyler Glasnow': 17, 'Joe Ryan': 18, 'Kyle Bradish': 19, 'Cam Schlittler': 20,
  'Jesús Luzardo': 21, 'Eury Pérez': 22, 'Framber Valdez': 23, 'Nolan McLean': 24,
  'Nick Pivetta': 25, 'Kevin Gausman': 26, 'Shota Imanaga': 27, 'Nathan Eovaldi': 28,
  'Trevor Rogers': 29, 'Sandy Alcantara': 30, 'Bubba Chandler': 31, 'Dylan Cease': 32,
  'Ryan Pepiot': 33, 'Jacob Misiorowski': 34, 'Drew Rasmussen': 35, 'Tatsuya Imai': 36,
  'Nick Lodolo': 37, 'Edward Cabrera': 38, 'Cade Horton': 39, 'Robbie Ray': 40,
  'Michael King': 41, 'Kris Bubic': 42, 'MacKenzie Gore': 43, 'Chase Burns': 44,
  'Zack Wheeler': 45, 'Gerrit Cole': 46, 'Shane McClanahan': 47, 'Aaron Nola': 48,
  'Sonny Gray': 49, 'Matthew Boyd': 50, 'Zac Gallen': 51, 'Kodai Senga': 52,
  'Ranger Suárez': 53, 'Andrew Abbott': 54, 'Ryan Weathers': 55, 'Gavin Williams': 56,
  'Shane Baz': 57, 'Connelly Early': 58, 'Blake Snell': 59, 'Carlos Rodón': 60,
  'Bryce Miller': 61, 'Jared Jones': 62, 'Cody Ponce': 63, 'Mike Burrows': 64,
  'Mick Abel': 65, 'Emmet Sheehan': 66, 'Brandon Sproat': 67, 'Braxton Ashcraft': 68,
  'Will Warren': 69, 'Kyle Harrison': 70, 'Spencer Strider': 71, 'Andrew Painter': 72,
  'Ryne Nelson': 73, 'Zach Eflin': 74, 'Noah Cameron': 75, 'Brayan Bello': 76,
  'Luis Castillo': 77, 'Merrill Kelly': 78, 'Tanner Bibee': 79, 'Dustin May': 80,
  'Matthew Liberatore': 81, 'Max Scherzer': 82, 'Joey Cantillo': 83, 'Spencer Arrighetti': 84,
  'Jack Leiter': 85, 'Landen Roupp': 86, 'Max Meyer': 87, 'Jack Flaherty': 88,
  'Luis Gil': 89, 'Justin Wrobleski': 90, 'Parker Messick': 91, 'Didier Fuentes': 92,
  'Slade Cecconi': 93, 'Anthony Kay': 94, 'Tyler Mahle': 95, 'Brandon Williamson': 96,
  'Justin Verlander': 97, 'Kyle Leahy': 98, 'Justin Steele': 99, 'Shane Bieber': 100,
}


// ─── Pitcher List HLD Rankings ───────────────────────────────────────────────
const PL_HLD_RANKS: Record<string, number> = {
  'Jeremiah Estrada': 1, 'Garrett Whitlock': 2, 'Adrian Morejon': 3,
  'Tanner Scott': 4, 'Robert Suarez': 5, 'Edwin Uceta': 6,
  'Matt Brash': 7, 'Phil Maton': 8, 'Garrett Cleavinger': 9,
  'Gabe Speier': 10, 'Dylan Lee': 11, 'Alex Vesia': 12,
  'Luke Weaver': 13, 'Jason Adam': 14, 'Brad Keller': 15,
  'Will Vest': 16, 'Kyle Finnegan': 17, 'Hunter Gaddis': 18,
  'Tyler Rogers': 19, 'Grant Taylor': 20, 'Louis Varland': 21,
  'Fernando Cruz': 22, 'Erik Sabrowski': 23, 'Mason Montgomery': 24,
  'Aaron Ashby': 25, 'Matt Strahm': 26, 'Bryan Baker': 27,
  'Jose A. Ferrer': 28, 'José Alvarado': 29, 'Andrew Nardi': 30,
  'Camilo Doval': 31, 'Steven Okert': 32, 'Caleb Thielbar': 33,
  'Brooks Raley': 34, 'Matt Svanson': 35, 'Andrew Kittredge': 36,
  'Bryan King': 37, 'Drew Pomeranz': 38, 'Jordan Leasure': 39,
  'Graham Ashcraft': 40, 'Justin Slaten': 41, 'Orion Kerkering': 42,
  'Shawn Armstrong': 43, 'Tony Santillan': 44, 'Gregory Soto': 45,
  'Anthony Bender': 46, 'Chris Martin': 47, 'Lucas Erceg': 48,
  'Jared Koenig': 49, 'Connor Phillips': 50, 'Justin Sterner': 51,
  'Brendon Little': 52, 'Braydon Fisher': 53, 'Eduard Bazardo': 54,
  'Hunter Harvey': 55, 'Elvis Alvarado': 56, 'Mason Fluharty': 57,
  'Rico Garcia': 58, 'Jonathan Bowlan': 59, 'Carmen Mlodzinski': 60,
  'Hunter Bigge': 61, 'Dylan Dodd': 62, 'Ryan Zeferjahn': 63,
  'Jack Dreyer': 64, 'Ryne Stanek': 65, 'Jonathan Loáisiga': 66,
  'Edgardo Henriquez': 67, 'Hogan Harris': 68, 'Angel Zerpa': 69,
  'Cole Sands': 70, 'Isaac Mattson': 71, 'Dietrich Enns': 72,
  'Lake Bachar': 73, 'Matt Festa': 74, 'Tyler Holton': 75,
  'Calvin Faucher': 76, 'JoJo Romero': 77, 'Nick Mears': 78,
  'Grant Anderson': 79, 'Pierce Johnson': 80, 'Yennier Cano': 81,
  'Tanner Banks': 82, 'Tyler Kinley': 83, 'Blake Treinen': 84,
  'Kody Funderburk': 85, 'John Schreiber': 86, 'Scott Barlow': 87,
  'Ryan Thompson': 88, 'José Buttó': 89, 'Jordan Romano': 90,
  'Brock Burke': 91, 'David Morgan': 92, 'Keegan Akin': 93,
  'Jacob Webb': 94, 'Aaron Bummer': 95, 'Juan Mejia': 96,
  'Eric Orze': 97, 'Erik Miller': 98, 'Will Klein': 99, 'DL Hall': 100,
}



interface Props {
  player: Player
  managers: Manager[]
  hometownMap: Record<string, string>
  isDrafted: boolean
  onNominate: ((p: Player) => void) | undefined
  onClose: () => void
  adjustedPrices?: Map<string, number>
  tag?: PlayerTag | null
  onCycleTag?: (key: string) => void
  note?: string
  onUpdateNote?: (key: string, note: string) => void
}

function StatMeta({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ background: 'var(--bg2)', borderRadius: 7, padding: '9px 12px', textAlign: 'center' }}>
      <div style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: '0.12em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--cyan)', fontFamily: 'Space Mono, monospace' }}>{value}</div>
    </div>
  )
}

function Divider({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0 10px' }}>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      <span style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: '0.15em' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  )
}

export default function PlayerCard({ player, managers, hometownMap, isDrafted, onNominate, onClose, adjustedPrices, tag, onCycleTag, note = '', onUpdateNote }: Props) {
  const isPit = isPitcher(player)
  const hometownMgrId = hometownMap[player.n]
  const hometownMgr = hometownMgrId ? managers.find(m => m.id === hometownMgrId) : null
  const discount = hometownMgr ? Math.min(5, Math.round(player.pr * 0.2)) : 0
  const sv = (player as any).savant ?? null
  const hasSavant = sv !== null
  const hasRadar = (player as any).sc > 0
  const hasRoll = hasSavant && sv.xwoba_roll && Array.isArray(sv.xwoba_roll) && sv.xwoba_roll.length > 5
  const blurb = (player as any).blurb

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: '#00000088', zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(3px)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg1)', border: '1px solid var(--border2)', borderRadius: 14,
          width: 980, maxWidth: '96vw', maxHeight: '94vh', overflow: 'auto',
          boxShadow: '0 24px 60px #00000088',
        }}
      >
        {/* ── HEADER ── */}
        <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <PriceBadge price={player.pr} size="lg" />
              {(() => {
                if (!adjustedPrices) return null
                const adj = adjustedPrices.get(player.id + '|' + player.n)
                if (!adj || Math.abs(adj - Math.round(player.pr)) < 2) return null
                return (
                  <>
                    <span style={{ color: 'var(--text3)', fontSize: 20, lineHeight: 1 }}>→</span>
                    <PriceBadge price={adj} size="lg" />
                  </>
                )
              })()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="font-syne" style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.1 }}>{player.n}</div>
                {onCycleTag && (
                  <button
                    onClick={() => onCycleTag(player.id + '|' + player.n)}
                    title="Cycle tag"
                    style={{ padding: '3px 10px', borderRadius: 5, border: tag ? `1px solid ${TAG_CONFIG[tag].color}` : '1px solid var(--border2)', background: tag ? TAG_CONFIG[tag].bg : 'var(--bg3)', color: tag ? TAG_CONFIG[tag].color : 'var(--text3)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
                    {tag ? `${TAG_CONFIG[tag].emoji} ${TAG_CONFIG[tag].label}` : '○ Tag'}
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: 'var(--text2)', fontSize: 14 }}>{player.t}</span>
                {player.ps.split(',').map(pos => (
                  <span key={pos} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'var(--bg3)', color: 'var(--gold)', border: '1px solid var(--border2)' }}>{pos.trim()}</span>
                ))}
                {(() => {
                  const rank = (player as any).prospect_rank
                  const eta  = (player as any).prospect_eta
                  if (!rank) return null
                  return (
                    <>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, color: '#e9d5ff', background: '#4c1d95', border: '1px solid #7c3aed' }}>🔮 Prospect #{rank}</span>
                      {eta && <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4, color: '#c4b5fd', background: '#2e1065' }}>ETA {eta}</span>}
                    </>
                  )
                })()}
                {(() => {
                  const badges = [
                    PL_HLD_RANKS[player.n] ? { r: PL_HLD_RANKS[player.n]!, label: 'PL HLD' } : null,
                    PL_SV_RANKS[player.n]  ? { r: PL_SV_RANKS[player.n]!,  label: 'PL SV'  } : null,
                    PL_SP_RANKS[player.n]  ? { r: PL_SP_RANKS[player.n]!,  label: 'PL SP'  } : null,
                  ].filter(Boolean) as { r: number; label: string }[]
                  if (badges.length === 0) return null
                  return (
                    <>
                      {badges.map(({ r, label }) => (
                        <span key={label} style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                          color: r <= 25 ? '#4ade80' : r <= 50 ? '#a3e635' : r <= 75 ? '#e2e8f0' : '#fb923c',
                          background: 'var(--bg3)', border: '1px solid var(--border2)' }}>
                          {label} #{r}
                        </span>
                      ))}
                    </>
                  )
                })()}
                {isDrafted && (
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: '#450a0a', color: 'var(--red)' }}>DRAFTED</span>
                )}
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text3)', fontSize: 22, cursor: 'pointer', lineHeight: 1, padding: 4 }}>×</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 12 }}>
            {player.adp && <StatMeta label="ADP" value={player.adp} />}
            <StatMeta label="FANTRAX SCORE" value={player.sc} />
            <StatMeta label="PROJ GAMES" value={player.gp} />
          </div>
        </div>

        {/* ── HOMETOWN DISCOUNT ── */}
        {hometownMgr && (
          <div style={{ margin: '10px 20px 0', padding: '9px 14px', background: '#2a1e0688', border: '1px solid #b7791f66', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--gold)', fontSize: 11, fontWeight: 700 }}>★ HOMETOWN DISCOUNT</span>
            <span style={{ color: 'var(--text3)', fontSize: 11 }}>·</span>
            <span style={{ color: 'var(--text2)', fontSize: 11 }}>{hometownMgr.name}</span>
            <span style={{ color: 'var(--text3)', fontSize: 11 }}>— 20% off, max $5</span>
            <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 800, color: 'var(--gold2)', fontFamily: 'Space Mono, monospace' }}>
              ${Math.max(1, Math.round(player.pr) - discount)}
            </span>
          </div>
        )}

        {/* ── ZONE 2: blurb + projections | radar ── */}
        <div style={{ display: 'grid', gridTemplateColumns: hasRadar ? '1fr 1fr' : '1fr', alignItems: 'start', borderBottom: '1px solid var(--border)' }}>

          {/* LEFT: blurb + projections */}
          <div style={{ padding: '12px 20px 16px', borderRight: hasRadar ? '1px solid var(--border)' : 'none' }}>
            {blurb && (
              <div style={{ padding: '10px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, borderLeft: '3px solid #4a9eff', marginBottom: 4 }}>
                <div style={{ fontSize: 9, color: '#4a9eff', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 5 }}>SCOUT INTEL · Pitcher List</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.55 }}>{blurb}</div>
              </div>
            )}
            <Divider label="2025 PROJECTIONS" />
            <PlayerStatGrid player={player} />
          </div>

          {/* RIGHT: radar — height naturally matches left column */}
          {hasRadar && (
            <div style={{ padding: '12px 20px 16px' }}>
              <Divider label="CATEGORY RADAR" />
              <CategoryRadar player={player} />
            </div>
          )}
        </div>

        {/* ── ZONE 3: statcast full-width, split into two columns inside ── */}
        {hasSavant && (
          <div style={{ padding: '0 20px 16px', borderBottom: '1px solid var(--border)' }}>
            <Divider label="2025 STATCAST ACTUALS" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
              <div>{!isPit ? <HitterBars sv={sv} /> : <PitcherBars sv={sv} />}</div>
              {hasRoll
                ? <div><RollingXwOBA data={sv.xwoba_roll} playerName={player.n} invertColors={isPit} /></div>
                : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text3)', fontSize: 11 }}>No rolling data</div>
              }
            </div>
          </div>
        )}
        {!hasSavant && (
          <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ padding: '9px 14px', background: 'var(--bg2)', borderRadius: 6, fontSize: 11, color: 'var(--text3)', textAlign: 'center' }}>
              Run <code style={{ background: 'var(--bg3)', padding: '1px 5px', borderRadius: 3 }}>python3 fetch_savant.py</code> to add Statcast data
            </div>
          </div>
        )}

        {/* ── NOTES ── */}
        <div style={{ padding: '0 20px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0 8px' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: '0.15em' }}>NOTES</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>
          <textarea
            value={note}
            onChange={e => onUpdateNote?.(player.id + '|' + player.n, e.target.value)}
            placeholder="Add notes about this player…"
            rows={3}
            style={{ width: '100%', padding: '8px 10px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 6, color: 'var(--text)', fontSize: 12, fontFamily: 'inherit', outline: 'none', resize: 'vertical', lineHeight: 1.5 }}
          />
          {note && <div style={{ fontSize: 9, color: 'var(--text3)', marginTop: 3, textAlign: 'right' }}>Auto-saved · persists across tabs</div>}
        </div>

        {/* ── ACTIONS ── */}
        <div style={{ padding: '12px 20px 16px', display: 'flex', gap: 8 }}>
          {!isDrafted && onNominate && (
            <button onClick={() => { onNominate(player); onClose() }} style={{
              flex: 1, padding: '11px', background: 'var(--gold)', color: '#1c1408',
              border: 'none', borderRadius: 8, fontWeight: 800, fontSize: 14,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
              ⚡ Nominate for Auction
            </button>
          )}
          <button onClick={onClose} style={{
            padding: '11px 20px', background: 'transparent', border: '1px solid var(--border)',
            color: 'var(--text3)', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
          }}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
