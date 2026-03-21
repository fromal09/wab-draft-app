'use client'
import { useState, useMemo, useCallback } from 'react'
import playersRaw from '@/data/players_raw.json'
import { Player, isPitcher, PositionTab, POSITION_TABS, Manager, PlayerTag, TAG_CONFIG, DraftEntry } from '@/lib/types'
import { PriceBadge } from './PriceBadge'
import PlayerCard from './PlayerCard'
import RecommendationsPanel from './RecommendationsPanel'
import { useRecommendations } from '@/hooks/useRecommendations'

const PLAYERS_RAW = playersRaw as Record<string, Player[]>

const hasPos = (ps: string, pos: string) => ps.split(',').map(s => s.trim()).includes(pos)
const PLAYERS: Record<string, Player[]> = {
  ...PLAYERS_RAW,
  LF: (PLAYERS_RAW['OF'] ?? []).filter(p => hasPos(p.ps, 'LF')),
  CF: (PLAYERS_RAW['OF'] ?? []).filter(p => hasPos(p.ps, 'CF')),
  RF: (PLAYERS_RAW['OF'] ?? []).filter(p => hasPos(p.ps, 'RF')),
}

const ALL_FLAT: Player[] = (() => {
  const seen = new Set<string>()
  const out: Player[] = []
  for (const tab of POSITION_TABS) {
    for (const p of PLAYERS[tab] ?? []) {
      const key = p.n + '|' + p.t
      if (!seen.has(key)) { seen.add(key); out.push(p) }
    }
  }
  return out
})()

const POS_COLORS: Record<string, string> = {
  C:'#0ea5e9', '1B':'#10b981', '2B':'#8b5cf6',
  SS:'#f59e0b', '3B':'#ef4444',
  LF:'#06b6d4', CF:'#22d3ee', RF:'#67e8f9', OF:'#06b6d4',
  DH:'#ec4899', SP:'#a3e635', RP:'#fb923c',
  PROS:'#a78bfa',
}

const PROSPECT_COLOR = '#a78bfa'


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


// Normalize name for rank lookup — strips diacritics for fuzzy matching
function normName(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}
function injuryInfo(name: string): InjuryInfo | undefined {
  if (INJURY_MAP[name]) return INJURY_MAP[name]
  const norm = normName(name)
  const key = Object.keys(INJURY_MAP).find(k => normName(k) === norm)
  return key ? INJURY_MAP[key] : undefined
}

function plRank(map: Record<string, number>, name: string): number | undefined {
  if (map[name] !== undefined) return map[name]
  const norm = normName(name)
  const key = Object.keys(map).find(k => normName(k) === norm)
  return key ? map[key] : undefined
}


// ─── Injury Data ─────────────────────────────────────────────────────────────
interface InjuryInfo { status: string; returnDate: string; comment: string }
const INJURY_MAP: Record<string, InjuryInfo> = {
  'Merrill Kelly':           { status: 'Out',      returnDate: 'Apr 7',  comment: "Mar 19: Kelly (back) allowed two runs on five hits over 2.2 innings in Wednesday's spring start against the Cubs." },
  'Corbin Burnes':           { status: 'IL',       returnDate: 'Jul 17', comment: "Mar 17: Burnes (elbow) threw a bullpen session Monday." },
  'Lourdes Gurriel Jr.':     { status: 'Out',      returnDate: 'Apr 17', comment: "Mar 13: Gurriel (knee) could return to game action by mid-April." },
  'Adrian Del Castillo':     { status: 'Out',      returnDate: 'Mar 26', comment: "Mar 6: Del Castillo (calf) has begun hitting in cages and catching bullpen sessions." },
  'Cristian Mena':           { status: 'Out',      returnDate: 'Mar 26', comment: "Feb 26: Mena (shoulder) has continued his throwing program, but has yet to throw off a mound." },
  'Tyler Locklear':          { status: 'Out',      returnDate: 'May 18', comment: "Feb 16: Locklear (shoulder/elbow) trending toward return around mid-May to early June." },
  'A.J. Puk':                { status: 'IL',       returnDate: 'Jun 29', comment: "Feb 15: The Diamondbacks placed Puk (elbow) on the 60-day injured list." },
  'Justin Martinez':         { status: 'IL',       returnDate: 'Aug 21', comment: "Feb 14: Martinez (elbow) hopes to make his season debut by late August." },
  'Andrew Saalfrank':        { status: 'IL',       returnDate: 'TBD',    comment: "Feb 11: Saalfrank (shoulder) expects to be sidelined 10-16 months." },
  'Blake Walston':           { status: 'Out',      returnDate: 'Jul 1',  comment: "Oct 2: The Diamondbacks placed Walston (elbow) on the 60-day IL." },
  'Gunnar Hoglund':          { status: 'Out',      returnDate: 'Apr 10', comment: "Mar 12: Hoglund (knee) is now dealing with a back injury that will delay his start to the season." },
  'Ha-Seong Kim':            { status: 'Out',      returnDate: 'May 15', comment: "Mar 16: Kim (finger) arrived at spring training and has been cleared for fielding drills." },
  'Hurston Waldrep':         { status: 'Out',      returnDate: 'Jun 2',  comment: "Feb 18: Waldrep will undergo surgery to remove loose bodies from his right elbow." },
  'Spencer Schwellenbach':   { status: 'IL',       returnDate: 'Jun 2',  comment: "Feb 18: Schwellenbach underwent a procedure to remove bone spurs from his right elbow." },
  'Joe Jimenez':             { status: 'IL',       returnDate: 'Jul 17', comment: "Feb 11: Uncertain if Jimenez (knee) will be available to pitch at any point in 2026." },
  'Sean Murphy':             { status: 'Out',      returnDate: 'May 12', comment: "Feb 10: Murphy (hip) is expected to be sidelined until sometime in May." },
  'AJ Smith-Shawver':        { status: 'Out',      returnDate: 'Aug 1',  comment: "Oct 2: Smith-Shawver (elbow) underwent Tommy John surgery." },
  'Jackson Holliday':        { status: 'Out',      returnDate: 'Apr 10', comment: "Mar 20: Holliday (hand) took live batting practice Thursday with no issues." },
  'Jordan Westburg':         { status: 'Out',      returnDate: 'May 1',  comment: "Mar 16: Westburg (elbow) remains without a timeline to increase baseball activities." },
  'Andrew Kittredge':        { status: 'Out',      returnDate: 'Apr 10', comment: "Mar 4: Kittredge is battling right shoulder inflammation, low probability to be ready for Opening Day." },
  'Felix Bautista':          { status: 'IL',       returnDate: 'TBD',    comment: "Mar 4: Bautista (shoulder) threw a baseball for the first time since undergoing surgery last August." },
  'Colin Selby':             { status: 'IL',       returnDate: 'May 25', comment: "Feb 14: Selby placed on 60-day IL with right shoulder inflammation." },
  'Brendan Rodgers':         { status: 'Out',      returnDate: 'TBD',    comment: "Mar 17: Rodgers recently underwent right shoulder labral revision surgery." },
  'Triston Casas':           { status: 'Out',      returnDate: 'May 1',  comment: "Mar 16: Casas (knee) was able to take simulated at-bats in a minor-league game." },
  'Romy Gonzalez':           { status: 'IL',       returnDate: 'May 26', comment: "Mar 12: Gonzalez will have his left shoulder injury evaluated to determine if surgery is needed." },
  'Kutter Crawford':         { status: 'Out',      returnDate: 'Mar 26', comment: "Feb 27: Crawford (wrist/illness) will throw a live BP session Friday." },
  'Tanner Houck':            { status: 'IL',       returnDate: 'TBD',    comment: "Feb 16: Houck (elbow) began a throwing program with 25 throws from 45 feet." },
  'Seiya Suzuki':            { status: 'DTD',      returnDate: 'Mar 26', comment: "Mar 17: Suzuki diagnosed with a sprained PCL in his right knee; Cubs will wait on Opening Day decision." },
  'Justin Steele':           { status: 'Out',      returnDate: 'May 15', comment: "Mar 14: Steele (elbow) faced live hitters for the first time in 11 months." },
  'Jordan Wicks':            { status: 'Out',      returnDate: 'Apr 15', comment: "Mar 10: Wicks (forearm) is slated to throw off a mound next week." },
  'Kyle Hendricks':          { status: 'Out',      returnDate: 'TBD',    comment: "Hendricks dealing with injury, timeline uncertain." },
  'José Abreu':              { status: 'Out',      returnDate: 'TBD',    comment: "Abreu dealing with injury." },
  'Chas McCormick':          { status: 'Out',      returnDate: 'Apr 15', comment: "McCormick (undisclosed) on the injured list." },
  'Framber Valdez':          { status: 'Out',      returnDate: 'Apr 7',  comment: "Mar 18: Valdez (finger) threw a bullpen session and is on track for a return around Opening Day." },
  'Jake Meyers':             { status: 'Out',      returnDate: 'Apr 10', comment: "Meyers (undisclosed) on the injured list." },
  'Hunter Brown':            { status: 'DTD',      returnDate: 'Mar 26', comment: "Mar 19: Brown (hip) is considered day-to-day and expected to be ready for Opening Day." },
  'Ryan Pressly':            { status: 'Out',      returnDate: 'May 1',  comment: "Pressly (elbow) on the injured list." },
  'Phil Maton':              { status: 'Out',      returnDate: 'Apr 10', comment: "Maton (undisclosed) on the injured list." },
  'Luke Weaver':             { status: 'Out',      returnDate: 'Apr 15', comment: "Weaver (undisclosed) dealing with injury." },
  'Zack Greinke':            { status: 'Out',      returnDate: 'TBD',    comment: "Greinke dealing with injury." },
  'Eduardo Julien':          { status: 'Out',      returnDate: 'Apr 15', comment: "Julien (undisclosed) on the injured list." },
  'Max Kepler':              { status: 'Out',      returnDate: 'Apr 10', comment: "Kepler (undisclosed) on the injured list." },
  'Carlos Santana':          { status: 'Out',      returnDate: 'TBD',    comment: "Santana dealing with injury." },
  'Anthony DeSclafani':      { status: 'Out',      returnDate: 'TBD',    comment: "DeSclafani dealing with injury." },
  'Edwin Diaz':              { status: 'Out',      returnDate: 'Apr 15', comment: "Mar 18: Diaz (shoulder) threw a bullpen session and is targeting an early-April return." },
  'Kodai Senga':             { status: 'Out',      returnDate: 'Apr 14', comment: "Mar 17: Senga (shoulder) threw a bullpen and is on track to start the season." },
  'Justin Verlander':        { status: 'Out',      returnDate: 'May 1',  comment: "Verlander (shoulder) working back from injury." },
  'Carlos Rodon':            { status: 'Out',      returnDate: 'Apr 7',  comment: "Mar 15: Rodon (shoulder) threw a bullpen session and is targeting Opening Day." },
  'Gerrit Cole':             { status: 'Out',      returnDate: 'May 1',  comment: "Mar 16: Cole (elbow) threw a bullpen and is targeting a May return." },
  'Luis Severino':           { status: 'Out',      returnDate: 'Apr 15', comment: "Severino (undisclosed) on the injured list." },
  'Cody Bradford':           { status: 'Out',      returnDate: 'May 1',  comment: "Mar 19: Bradford (elbow) began facing live hitters and should be ready for a rehab assignment at season start." },
  'Jordan Montgomery':       { status: 'IL',       returnDate: 'Jul 1',  comment: "Mar 8: Montgomery (elbow) signed a one-year deal with the Rangers." },
  'Sebastian Walcott':       { status: 'Out',      returnDate: 'Aug 3',  comment: "Feb 24: Walcott could be ready for game action in August from internal brace procedure on right elbow." },
  'Trey Yesavage':           { status: 'Out',      returnDate: 'Apr 14', comment: "Mar 19: Yesavage will open the season on the 15-day IL due to right shoulder impingement." },
  'Jose Berrios':            { status: 'Out',      returnDate: 'Apr 14', comment: "Mar 18: Berrios will have an in-person visit with a doctor to evaluate elbow inflammation." },
  'Shane Bieber':            { status: 'Out',      returnDate: 'Apr 30', comment: "Mar 13: Bieber (forearm) will continue throwing from flat ground and be reevaluated late next week." },
  'Bowden Francis':          { status: 'IL',       returnDate: 'TBD',    comment: "Feb 18: Francis undergoing UCL reconstruction surgery and will miss the 2026 season." },
  'Anthony Santander':       { status: 'Out',      returnDate: 'Aug 1',  comment: `Feb 10: Santander's left shoulder and back finally feel normal again.` },
  'DJ Herz':                 { status: 'IL',       returnDate: 'Jul 1',  comment: "Mar 13: Herz (elbow) threw a bullpen session Friday." },
  'Trevor Williams':         { status: 'IL',       returnDate: 'Jun 1',  comment: "Mar 4: Williams (elbow) has resumed throwing progression, 25 tosses from 60 feet." },
  'J.P. Crawford':           { status: 'DTD',      returnDate: 'Mar 23', comment: "Mar 18: Crawford received a cortisone injection in his injured shoulder; Opening Day availability unclear." },
  'Bryce Miller':            { status: 'Out',      returnDate: 'Mar 30', comment: "Mar 17: Miller (oblique) is scheduled to throw a bullpen session Tuesday." },

  'Hunter Greene':           { status: 'Out',      returnDate: 'Jul 1',  comment: "Mar 10: Greene is scheduled to have bone chips removed from his right elbow Wednesday and is expected to be out until July." },
  'Hunter Gaddis':           { status: 'Out',      returnDate: 'Apr 6',  comment: "Mar 20: Gaddis (forearm) will throw a live batting practice session Wednesday." },
  'Jared Jones':             { status: 'IL',       returnDate: 'May 25', comment: "Feb 23: Jones (elbow) should be ready for game action when eligible to return from the 60-day IL in late May." },
  'Jeremy Pena':             { status: 'Out',      returnDate: 'Mar 26', comment: "Mar 18: Pena (finger) has resumed throwing and will start swinging a bat with both hands this weekend." },
  'Josh Hader':              { status: 'Out',      returnDate: 'Apr 10', comment: "Mar 11: Hader (biceps) will begin the season on the injured list." },
  'Zack Wheeler':            { status: 'Out',      returnDate: 'Apr 17', comment: "Mar 19: Wheeler (shoulder) will pitch in a minor-league game Monday." },
  'Francisco Lindor':        { status: 'DTD',      returnDate: 'Mar 26', comment: "Mar 15: Lindor (hand) played four innings at shortstop in spring debut but wouldn't commit to being ready for Opening Day." },
  'Gerrit Cole':             { status: 'Out',      returnDate: 'May 25', comment: "Mar 19: Cole (elbow) allowed two hits in one scoreless inning against Boston in a Grapefruit League game." },
  'Carlos Rodon':            { status: 'Out',      returnDate: 'Apr 25', comment: "Mar 17: Rodon (elbow) is not expected to pitch in a Grapefruit League game this spring." },
  'Anthony Volpe':           { status: 'Out',      returnDate: 'Apr 24', comment: "Mar 12: Volpe (shoulder) went through a high-intensity defensive workout and is about two weeks away from live BP." },
  'Blake Snell':             { status: 'Out',      returnDate: 'May 1',  comment: "Mar 12: Snell (shoulder) threw a 15-pitch bullpen session Thursday." },
  'Tommy Edman':             { status: 'Out',      returnDate: 'May 1',  comment: "Mar 17: Edman (ankle) has continued to ramp up his running progression and is taking on-field batting practice." },
  'Gavin Stone':             { status: 'Out',      returnDate: 'May 8',  comment: "Mar 15: Stone (shoulder) said Sunday that he hopes to begin playing catch next week." },
  'Pablo Lopez':             { status: 'IL',       returnDate: 'Apr 1',  comment: "Feb 26: The Twins placed Lopez (elbow) on the 60-day injured list." },
  'Matt Strahm':             { status: 'DTD',      returnDate: 'Mar 20', comment: "Mar 19: Strahm was removed from Wednesday's Cactus League game with a left leg contusion." },
  'Joe Musgrove':            { status: 'Out',      returnDate: 'Apr 10', comment: "Mar 16: Musgrove (elbow) has had his workload eased and it is uncertain if he will be ramped up in time for Opening Day." },
  'Kris Bryant':             { status: 'IL',       returnDate: 'Jun 1',  comment: "Feb 17: Bryant said the ongoing pain in his back continues to prevent him from participating in baseball activities." },
  'Jackson Holliday':        { status: 'Out',      returnDate: 'Apr 10', comment: "Mar 20: Holliday (hand) took live batting practice Thursday with no issues." },
  'Mike Trout':              { status: 'DTD',      returnDate: 'Mar 23', comment: "Mar 20: Trout had precautionary X-rays come back negative after being hit by a pitch Friday." },
  'Grayson Rodriguez':       { status: 'DTD',      returnDate: 'Mar 26', comment: "Mar 20: Rodriguez (arm) played light catch Friday and said he does not consider his injury serious." },
  'Spencer Schwellenbach':   { status: 'IL',       returnDate: 'Jun 2',  comment: "Feb 18: Schwellenbach underwent a procedure to remove bone spurs from his right elbow." },
  'Hurston Waldrep':         { status: 'Out',      returnDate: 'Jun 2',  comment: "Feb 18: Waldrep will undergo surgery to remove loose bodies from his right elbow." },
  'Quinn Priester':          { status: 'Out',      returnDate: 'Apr 28', comment: "Mar 13: Priester (wrist) said he is hoping to be ready to pitch in games by late April or May." },
  'Brandon Woodruff':        { status: 'DTD',      returnDate: 'Mar 26', comment: "Mar 18: Woodruff (lat) said his status for Opening Day remains up in the air." },
  'David Festa':             { status: 'Out',      returnDate: 'May 1',  comment: "Mar 11: Festa (shoulder) remains shut down from throwing and is expected to begin the season on the IL." },
  'Jared Jones':             { status: 'IL',       returnDate: 'May 25', comment: "Feb 23: Jones (elbow) should be ready for game action when eligible to return from the 60-day IL in late May." },
  'Hayden Birdsong':         { status: 'Out',      returnDate: 'Jun 1',  comment: "Mar 19: Birdsong (forearm/elbow) is scheduled to undergo Tommy John surgery next week." },
  'Porter Hodge':            { status: 'Out',      returnDate: 'Apr 12', comment: "Mar 8: Hodge has been diagnosed with a right flexor tendon strain and will be shut down for two weeks." },
  'Justin Steele':           { status: 'Out',      returnDate: 'May 15', comment: "Mar 14: Steele (elbow) faced live hitters for the first time in 11 months." },
  'Triston Casas':           { status: 'Out',      returnDate: 'May 1',  comment: "Mar 16: Casas (knee) was able to take simulated at-bats in a minor-league game." },
  'Jackson Jobe':            { status: 'IL',       returnDate: 'Sep 1',  comment: "Mar 17: Jobe (elbow) is scheduled to play catch out to 120 feet three times this week." },
  'Cody Bradford':           { status: 'Out',      returnDate: 'May 1',  comment: "Mar 19: Bradford (elbow) began facing live hitters and should be ready for a rehab assignment at season start." },
  'Taylor Walls':            { status: 'Out',      returnDate: 'Apr 14', comment: "Mar 20: Walls received cortisone injection in right oblique, sidelined at least 3-4 weeks." },
  'Edwin Uceta':             { status: 'Out',      returnDate: 'Apr 10', comment: "Mar 14: Uceta (shoulder) threw a bullpen session Saturday." },
  'Lars Nootbaar':           { status: 'Out',      returnDate: 'Apr 10', comment: "Mar 12: Nootbaar (heels) increasing agility drills and ramping up running program." },
  'Hunter Dobbins':          { status: 'Out',      returnDate: 'Apr 7',  comment: "Mar 15: Dobbins (knee) will begin the season on the injured list." },
  'Yimi Garcia':             { status: 'Out',      returnDate: 'Apr 10', comment: "Mar 14: Garcia (elbow) threw off a mound Saturday for the first time this spring." },
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

type SortKey = 'pr'|'sc'|'ab'|'r'|'d2'|'d3'|'hr'|'rb'|'sbn'|'so'|'av'|'ob'|'ip'|'w'|'l'|'sv'|'hld'|'er'|'wh'|'bb'|'k'|'qa3'|'age'|'adp_n'|'prospect_rank'|'pl_hld_rk'|'pl_sv_rk'|'pl_sp_rk'

interface Props {
  draftedIds: Set<string>
  hometownMap: Record<string, string>
  managers: Manager[]
  onNominate: (p: Player) => void
  adjustedPrices: Map<string, number>
  draftLog: DraftEntry[]
  tags: Record<string, PlayerTag>
  onCycleTag: (key: string) => void
  notes?: Record<string, string>
  onUpdateNote?: (key: string, note: string) => void
}

export default function BigBoard({ draftedIds, hometownMap, managers, onNominate, adjustedPrices, draftLog, tags, onCycleTag, notes = {}, onUpdateNote = () => {} }: Props) {
  const [tab, setTab] = useState<PositionTab>('SS')
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('pr')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc')
  const [hideDrafted, setHideDrafted] = useState(false)
  const [hideNeg, setHideNeg] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [showRec, setShowRec] = useState(false)

  const isSearching = query.trim().length > 1
  const isProsTab = tab === 'PROS' && !isSearching
  const isPit = (tab === 'SP' || tab === 'RP') && !isSearching

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else {
      setSortKey(key)
      setSortDir(key === 'er' || key === 'wh' || key === 'prospect_rank' ? 'asc' : 'desc')
    }
  }

  const isDrafted = useCallback((p: Player) => draftedIds.has(p.id + '|' + p.n), [draftedIds])
  const recs = useRecommendations(managers, draftedIds, ALL_FLAT)
  const draftedInfoMap = useMemo(() => {
    const m = new Map<string, { price: number; managerName: string; draftType: import('@/lib/types').DraftType }>()
    for (const e of draftLog) {
      const mgr = managers.find(m => m.id === e.managerId)
      m.set(e.player.id + '|' + e.player.n, {
        price: e.price,
        managerName: mgr ? mgr.name.split(' ')[0] : e.managerId,
        draftType: e.draftType,
      })
    }
    return m
  }, [draftLog, managers])

  const baseList: Player[] = useMemo(() =>
    isSearching ? ALL_FLAT : (PLAYERS[tab] ?? [])
  , [tab, isSearching])

  const filtered = useMemo(() => {
    let list = baseList
    if (query.trim().length > 1) {
      const q = query.toLowerCase()
      list = list.filter(p => p.n.toLowerCase().includes(q) || p.t.toLowerCase().includes(q))
    }
    if (hideDrafted) list = list.filter(p => !isDrafted(p))
    if (hideNeg) list = list.filter(p => p.pr > 0)
    // On PROS tab default sort is prospect_rank asc; elsewhere default is pr desc
    return [...list].sort((a, b) => {
      let av: number, bv: number
      if (sortKey === 'adp_n') {
        av = parseFloat((a as any).adp) || 9999
        bv = parseFloat((b as any).adp) || 9999
      } else if (sortKey === 'pl_hld_rk') {
        av = plRank(PL_HLD_RANKS, (a as any).n) ?? 9999
        bv = plRank(PL_HLD_RANKS, (b as any).n) ?? 9999
      } else if (sortKey === 'pl_sv_rk') {
        av = plRank(PL_SV_RANKS, (a as any).n) ?? 9999
        bv = plRank(PL_SV_RANKS, (b as any).n) ?? 9999
      } else if (sortKey === 'pl_sp_rk') {
        av = plRank(PL_SP_RANKS, (a as any).n) ?? 9999
        bv = plRank(PL_SP_RANKS, (b as any).n) ?? 9999
      } else {
        const ar = (a as any)[sortKey]; av = typeof ar === 'number' ? ar : 0
        const br = (b as any)[sortKey]; bv = typeof br === 'number' ? br : 0
      }
      return sortDir === 'desc' ? bv - av : av - bv
    })
  }, [baseList, query, hideDrafted, hideNeg, sortKey, sortDir, isDrafted])

  // When switching to PROS tab, default sort to rank
  const handleTabChange = (t: PositionTab) => {
    setTab(t)
    setQuery('')
    setShowRec(false)
    if (t === 'PROS') {
      setSortKey('prospect_rank')
      setSortDir('asc')
    } else if (sortKey === 'prospect_rank') {
      setSortKey('pr')
      setSortDir('desc')
    }
  }

  const col = POS_COLORS[tab] ?? 'var(--text2)'

  const hitterSorts: {key: SortKey; label: string}[] = [
    {key:'pr',label:'$'},{key:'sc',label:'SCR'},{key:'ab',label:'AB'},
    {key:'r',label:'R'},{key:'d2',label:'2B'},{key:'d3',label:'3B'},{key:'hr',label:'HR'},
    {key:'rb',label:'RBI'},{key:'sbn',label:'SBN'},{key:'sv',label:'SV'},{key:'so',label:'SO'},
    {key:'av',label:'AVG'},{key:'ob',label:'OBP'},
    {key:'age',label:'AGE'},{key:'adp_n',label:'ADP'},
  ]
  const pitcherSorts: {key: SortKey; label: string}[] = [
    {key:'pr',label:'$'},{key:'sc',label:'SCR'},{key:'ip',label:'IP'},
    {key:'w',label:'W'},{key:'l',label:'L'},{key:'sv',label:'SV'},{key:'hld',label:'HLD'},
    {key:'er',label:'ERA'},{key:'wh',label:'WHIP'},{key:'bb',label:'BB'},{key:'k',label:'K'},{key:'qa3',label:'QA3'},
    {key:'age',label:'AGE'},{key:'pl_hld_rk',label:'PL HLD Rk'},{key:'pl_sv_rk',label:'PL SV Rk'},{key:'pl_sp_rk',label:'PL SP Rk'},
  ]
  const prosSorts: {key: SortKey; label: string}[] = [
    {key:'prospect_rank',label:'RANK'},{key:'pr',label:'$'},{key:'sc',label:'SCR'},
    {key:'age',label:'AGE'},
  ]
  const sorts = isProsTab ? prosSorts : isPit ? pitcherSorts : hitterSorts

  // Separate tabs: regular position tabs vs PROS
  const regularTabs = POSITION_TABS.filter(t => t !== 'PROS')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', overflow: 'hidden' }}>

      {/* Top controls */}
      <div style={{ padding: '7px 12px', background: 'var(--bg1)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', flexShrink: 0 }}>
        {regularTabs.map(t => {
          const c = POS_COLORS[t]
          const active = tab === t && !isSearching && !showRec
          return (
            <button key={t} onClick={() => handleTabChange(t)} style={{
              padding: '4px 10px', border: 'none', cursor: 'pointer',
              background: active ? c + '22' : 'transparent',
              color: active ? c : 'var(--text3)',
              borderBottom: active ? `2px solid ${c}` : '2px solid transparent',
              borderRadius: '3px 3px 0 0',
              fontSize: 11, fontFamily: 'inherit', fontWeight: active ? 700 : 400, transition: 'all 0.1s',
            }}>
              {t} <span style={{ fontSize: 9, opacity: 0.5 }}>({PLAYERS[t]?.length ?? 0})</span>
            </button>
          )
        })}

        {/* Divider */}
        <div style={{ width: 1, height: 16, background: 'var(--border2)', margin: '0 2px' }} />

        {/* PROS tab */}
        {(() => {
          const active = tab === 'PROS' && !isSearching && !showRec
          return (
            <button onClick={() => handleTabChange('PROS')} style={{
              padding: '4px 10px', border: 'none', cursor: 'pointer',
              background: active ? PROSPECT_COLOR + '22' : 'transparent',
              color: active ? PROSPECT_COLOR : 'var(--text3)',
              borderBottom: active ? `2px solid ${PROSPECT_COLOR}` : '2px solid transparent',
              borderRadius: '3px 3px 0 0',
              fontSize: 11, fontFamily: 'inherit', fontWeight: active ? 700 : 400, transition: 'all 0.1s',
            }}>
              🔮 PROS <span style={{ fontSize: 9, opacity: 0.5 }}>({PLAYERS['PROS']?.length ?? 0})</span>
            </button>
          )
        })()}

        <button onClick={() => { setShowRec(r => !r); setQuery('') }} style={{
          padding: '4px 12px', border: 'none', cursor: 'pointer',
          background: showRec ? '#4a9eff22' : 'transparent',
          color: showRec ? '#4a9eff' : 'var(--text3)',
          borderBottom: showRec ? '2px solid #4a9eff' : '2px solid transparent',
          borderRadius: '3px 3px 0 0',
          fontSize: 11, fontFamily: 'inherit', fontWeight: showRec ? 700 : 400,
        }}>
          🎯 REC
        </button>
        <div style={{ flex: 1 }} />
        <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text3)', cursor: 'pointer' }}>
          <input type="checkbox" checked={hideDrafted} onChange={e => setHideDrafted(e.target.checked)} style={{ accentColor: 'var(--gold)' }} />
          Hide drafted
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text3)', cursor: 'pointer' }}>
          <input type="checkbox" checked={hideNeg} onChange={e => setHideNeg(e.target.checked)} style={{ accentColor: 'var(--gold)' }} />
          Hide $0
        </label>
        <div style={{ position: 'relative' }}>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search all positions…"
            style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 5, padding: '5px 28px 5px 10px', color: 'var(--text)', fontSize: 11, fontFamily: 'inherit', outline: 'none', width: 180 }} />
          {query && <button onClick={() => setQuery('')} style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 15, lineHeight: 1 }}>×</button>}
        </div>
      </div>

      {/* Sort bar */}
      {!showRec && <div style={{ padding: '4px 12px', background: 'var(--bg)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0, overflowX: 'auto' }}>
        <span style={{ fontSize: 10, color: 'var(--text3)', marginRight: 6, whiteSpace: 'nowrap' }}>SORT:</span>
        {sorts.map(s => (
          <button key={s.key} onClick={() => toggleSort(s.key)} style={{
            padding: '3px 7px', border: 'none', cursor: 'pointer',
            background: sortKey === s.key ? 'var(--border2)' : 'transparent',
            color: sortKey === s.key ? 'var(--text)' : 'var(--text3)',
            borderRadius: 4, fontSize: 10, fontFamily: 'inherit', whiteSpace: 'nowrap',
            display: 'flex', alignItems: 'center', gap: 2,
          }}>
            {s.label}
            {sortKey === s.key && <span style={{ fontSize: 8 }}>{sortDir === 'desc' ? '▼' : '▲'}</span>}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text3)', whiteSpace: 'nowrap' }}>
          {isSearching ? `${filtered.length} results` : `${filtered.length} / ${PLAYERS[tab]?.length ?? 0}`}
          {hideDrafted && draftedIds.size > 0 ? ` · ${draftedIds.size} drafted` : ''}
        </span>
      </div>}

      {/* REC view */}
      {showRec && (
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: '#4a9eff', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 4 }}>🎯 RECOMMENDED FOR ADAM · {recs.topEnd.length + recs.midTier.length + recs.sneaky.length} players</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.6 }}>
              Ranked by marginal category value relative to your current needs. Colored tags show which cats each player helps most. Updates live as picks happen.
            </div>
          </div>
          <RecommendationsPanel
            tiers={recs}
            adjustedPrices={adjustedPrices}
            tags={tags}
            onCycleTag={onCycleTag}
            onNominate={onNominate}
            onSelect={setSelectedPlayer}
          />
        </div>
      )}

      {/* Player rows */}
      {!showRec && <div style={{ flex: 1, overflowY: 'auto', padding: '3px 8px 24px' }}>
        {filtered.map((p, i) => {
          const drafted = isDrafted(p)
          const hometown = hometownMap[p.n]
          const displayTab = isSearching ? p.ps.split(',')[0].trim() : tab
          const rowCol = isProsTab ? PROSPECT_COLOR : (POS_COLORS[displayTab] ?? col)
          const prospectRank: number | undefined = (p as any).prospect_rank
          const prospectEta: number | undefined = (p as any).prospect_eta
          const isProspectOnly = prospectRank !== undefined && p.pr === 0 && p.sc === 0

          return (
            <div key={p.n + p.t + i}
              onClick={() => setSelectedPlayer(p)}
              style={{
                display: 'flex', alignItems: 'center', gap: 9, padding: '5px 8px',
                borderRadius: 5, cursor: 'pointer',
                background: i % 2 === 0 ? 'var(--bg1)' : 'var(--bg)',
                borderLeft: `3px solid ${drafted ? '#450a0a' : hometown ? '#b7791f88' : prospectRank && isProspectOnly ? PROSPECT_COLOR + '44' : rowCol + '22'}`,
                opacity: drafted ? 0.45 : 1, transition: 'background 0.08s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg3)')}
              onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? 'var(--bg1)' : 'var(--bg)')}
            >
              <div style={{ width: 28, textAlign: 'right', fontSize: 10, color: 'var(--text3)', flexShrink: 0 }}>{i + 1}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                {!isProspectOnly && <PriceBadge price={p.pr} size="sm" />}
                {!isProspectOnly && (() => {
                  if (draftedIds.size === 0) return null
                  const adj = adjustedPrices.get(p.id + '|' + p.n)
                  if (!adj || Math.abs(adj - Math.round(p.pr)) < 2) return null
                  return (
                    <>
                      <span style={{ color: 'var(--text3)', fontSize: 14, lineHeight: 1 }}>→</span>
                      <PriceBadge price={adj} size="sm" />
                    </>
                  )
                })()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: 12, color: drafted ? 'var(--text3)' : 'var(--text)' }}>{p.n}</span>
                  <span style={{ fontSize: 10, color: 'var(--text3)' }}>{p.t}</span>
                  {p.age > 0 && <span style={{ fontSize: 9, color: 'var(--text3)' }}>({p.age})</span>}

                  {/* Prospect badges */}
                  {prospectRank !== undefined && (
                    <span style={{
                      fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3,
                      color: '#e9d5ff', background: '#4c1d95',
                      border: '1px solid #7c3aed',
                    }}>
                      🔮 Prospect #{prospectRank}
                    </span>
                  )}
                  {prospectEta !== undefined && (
                    <span style={{
                      fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 3,
                      color: '#c4b5fd', background: '#2e1065',
                    }}>
                      ETA {prospectEta}
                    </span>
                  )}

                  {(() => {
                    const inj = injuryInfo(p.n)
                    if (!inj) return null
                    const sc = inj.status === 'DTD' ? { color: '#fbbf24', bg: '#2a1e06' } : inj.status === 'IL' ? { color: '#c084fc', bg: '#3b0764' } : { color: '#f87171', bg: '#450a0a' }
                    return (
                      <>
                        <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3, color: sc.color, background: sc.bg, border: '1px solid ' + sc.color + '55' }}>
                          {inj.status}
                        </span>
                        <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, color: 'var(--text3)', background: 'var(--bg3)', border: '1px solid var(--border2)' }}>
                          {inj.returnDate}
                        </span>
                      </>
                    )
                  })()}
                  {hometown && (() => {
                    const mgrName = managers.find(m => m.id === hometown)?.name ?? hometown
                    const shortName = mgrName.split(' ')[0]
                    return <span style={{ fontSize: 9, color: 'var(--gold)', background: '#b7791f22', padding: '1px 4px', borderRadius: 3 }}>★ HTD: {shortName}</span>
                  })()}
                  {drafted && (() => {
                    const info = draftedInfoMap.get(p.id + '|' + p.n)
                    const suffix = info?.draftType === 'keeper' ? ' (keeper)' : info?.draftType === 'qualifying_offer' ? ' (QO)' : ''
                    return (
                      <span style={{ fontSize: 9, color: 'var(--red)', background: '#450a0a', padding: '1px 5px', borderRadius: 3 }}>
                        DRAFTED{info ? ` $${info.price} by ${info.managerName}${suffix}` : ''}
                      </span>
                    )
                  })()}
                  {(() => {
                    const pkey = p.id + '|' + p.n
                    const tag = tags[pkey]
                    if (!tag) return null
                    const tc = TAG_CONFIG[tag]
                    return <span style={{ fontSize: 9, color: tc.color, background: tc.bg, padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>{tc.emoji} {tc.label}</span>
                  })()}
                  {isPit && !isSearching && (() => {
                    const hldRank = tab === 'RP' ? plRank(PL_HLD_RANKS, p.n) : undefined
                    const svRank  = tab === 'RP' ? plRank(PL_SV_RANKS, p.n)  : undefined
                    const spRank  = tab === 'SP' ? plRank(PL_SP_RANKS, p.n)  : undefined
                    const badges = [
                      hldRank ? { r: hldRank, label: 'PL HLD' } : null,
                      svRank  ? { r: svRank,  label: 'PL SV'  } : null,
                      spRank  ? { r: spRank,  label: 'PL SP'  } : null,
                    ].filter(Boolean) as { r: number; label: string }[]
                    if (badges.length === 0) return null
                    return (
                      <>
                        {badges.map(({ r, label }) => (
                          <span key={label} style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3,
                            color: r <= 25 ? '#4ade80' : r <= 50 ? '#a3e635' : r <= 75 ? '#e2e8f0' : '#fb923c',
                            background: 'var(--bg3)', border: '1px solid var(--border2)' }}>
                            {label} #{r}
                          </span>
                        ))}
                      </>
                    )
                  })()}

                  {(isSearching || isProsTab) && p.ps.split(',').map(pos => (
                    <span key={pos} style={{ fontSize: 9, color: POS_COLORS[pos.trim()] ?? 'var(--text3)', background: (POS_COLORS[pos.trim()] ?? '#666') + '18', padding: '1px 4px', borderRadius: 3 }}>{pos.trim()}</span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 2, fontSize: 10, flexWrap: 'wrap' }}>
                  {isProspectOnly ? (
                    <span style={{ fontSize: 10, color: 'var(--text3)', fontStyle: 'italic' }}>Minor league prospect — no MLB projections yet</span>
                  ) : !isPitcher(p) ? (
                    <>
                      <Stat label="AB" v={p.ab} />
                      <Stat label="R" v={p.r} />
                      <Stat label="2B" v={p.d2} />
                      <Stat label="3B" v={p.d3} />
                      <Stat label="HR" v={p.hr} />
                      <Stat label="RBI" v={p.rb} />
                      <Stat label="SBN" v={p.sbn} />
                      <Stat label="SO" v={p.so} />
                      <Stat label="AVG" v={p.av.toFixed(3)} />
                      <Stat label="OBP" v={p.ob.toFixed(3)} />
                    </>
                  ) : (
                    <>
                      <Stat label="IP" v={Math.round(p.ip)} />
                      <Stat label="W" v={p.w} />
                      <Stat label="L" v={p.l} />
                      <Stat label="SV" v={typeof (p as any).sv === 'number' ? (p as any).sv : 0} />
                      <Stat label="HLD" v={p.hld} />
                      <Stat label="ERA" v={p.er.toFixed(2)} color={p.er < 3.2 ? 'var(--green)' : p.er < 4.0 ? 'var(--gold)' : 'var(--red)'} />
                      <Stat label="WHIP" v={p.wh.toFixed(2)} color={p.wh < 1.1 ? 'var(--green)' : p.wh < 1.3 ? 'var(--gold)' : 'var(--red)'} />
                      <Stat label="BB" v={p.bb} />
                      <Stat label="K" v={p.k} />
                      <Stat label="QA3" v={p.qa3} />
                    </>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                {!isProspectOnly && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 9, color: 'var(--text3)' }}>SCORE</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: rowCol }}>{p.sc}</div>
                  </div>
                )}
                {!drafted && (
                  <>
                    <button
                      onClick={e => { e.stopPropagation(); onCycleTag(p.id + '|' + p.n) }}
                      title="Cycle tag: Target → ★ → Avoid → None"
                      style={{ padding: '3px 7px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 12, cursor: 'pointer', flexShrink: 0, minWidth: 28, textAlign: 'center' }}>
                      {(() => { const t = tags[p.id + '|' + p.n]; return t ? TAG_CONFIG[t].emoji : '○' })()}
                    </button>
                    <button onClick={e => { e.stopPropagation(); onNominate(p) }}
                      style={{ padding: '4px 8px', border: '1px solid var(--gold)', borderRadius: 4, background: 'transparent', color: 'var(--gold)', fontSize: 10, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                      ⚡ NOM
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text3)', fontSize: 12 }}>
            {query ? 'No players match your search' : 'No players in this view'}
          </div>
        )}
      </div>}

      {selectedPlayer && (
        <PlayerCard
          player={selectedPlayer}
          managers={managers}
          hometownMap={hometownMap}
          isDrafted={isDrafted(selectedPlayer)}
          onNominate={onNominate}
          onClose={() => setSelectedPlayer(null)}
          adjustedPrices={adjustedPrices}
          tag={tags[selectedPlayer.id + '|' + selectedPlayer.n] ?? null}
          onCycleTag={onCycleTag}
          note={selectedPlayer ? (notes[selectedPlayer.id + '|' + selectedPlayer.n] ?? '') : ''}
          onUpdateNote={onUpdateNote}
        />
      )}
    </div>
  )
}

function Stat({ label, v, color }: { label: string; v: number | string; color?: string }) {
  return (
    <span>
      <span style={{ color: 'var(--border2)' }}>{label} </span>
      <span style={{ color: color ?? 'var(--text2)' }}>{v}</span>
    </span>
  )
}
