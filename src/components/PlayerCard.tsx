'use client'
import { useState, useEffect } from 'react'
import { Player, isPitcher, Manager, PlayerTag, TAG_CONFIG } from '@/lib/types'
import { PriceBadge } from './PriceBadge'
import PlayerStatGrid from './PlayerStatGrid'
import CategoryRadar from './CategoryRadar'
import { HitterBars, PitcherBars } from './SavantBars'
import RollingXwOBA from './RollingXwOBA'

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
  'Joe Jimenez':             { status: 'IL',       returnDate: 'Jul 17', comment: "Feb 11: Uncertain if Jimenez (knee) will be available to pitch at any point in 2026." },
  'Sean Murphy':             { status: 'Out',      returnDate: 'May 12', comment: "Feb 10: Murphy (hip) is expected to be sidelined until sometime in May." },
  'AJ Smith-Shawver':        { status: 'Out',      returnDate: 'Aug 1',  comment: "Oct 2: Smith-Shawver (elbow) underwent Tommy John surgery." },
  'Jordan Westburg':         { status: 'Out',      returnDate: 'May 1',  comment: "Mar 16: Westburg (elbow) remains without a timeline to increase baseball activities." },
  'Andrew Kittredge':        { status: 'Out',      returnDate: 'Apr 10', comment: "Mar 4: Kittredge is battling right shoulder inflammation, low probability to be ready for Opening Day." },
  'Felix Bautista':          { status: 'IL',       returnDate: 'TBD',    comment: "Mar 4: Bautista (shoulder) threw a baseball for the first time since undergoing surgery last August." },
  'Colin Selby':             { status: 'IL',       returnDate: 'May 25', comment: "Feb 14: Selby placed on 60-day IL with right shoulder inflammation." },
  'Brendan Rodgers':         { status: 'Out',      returnDate: 'TBD',    comment: "Mar 17: Rodgers recently underwent right shoulder labral revision surgery." },
  'Romy Gonzalez':           { status: 'IL',       returnDate: 'May 26', comment: "Mar 12: Gonzalez will have his left shoulder injury evaluated to determine if surgery is needed." },
  'Kutter Crawford':         { status: 'Out',      returnDate: 'Mar 26', comment: "Feb 27: Crawford (wrist/illness) will throw a live BP session Friday." },
  'Tanner Houck':            { status: 'IL',       returnDate: 'TBD',    comment: "Feb 16: Houck (elbow) began a throwing program with 25 throws from 45 feet." },
  'Seiya Suzuki':            { status: 'DTD',      returnDate: 'Mar 26', comment: "Mar 17: Suzuki diagnosed with a sprained PCL in his right knee; Cubs will wait on Opening Day decision." },
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
  'Luis Severino':           { status: 'Out',      returnDate: 'Apr 15', comment: "Severino (undisclosed) on the injured list." },
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
  'Triston Casas':           { status: 'Out',      returnDate: 'May 1',  comment: "Mar 16: Casas (knee) was able to take simulated at-bats in a minor-league game." },
  'Jackson Jobe':            { status: 'IL',       returnDate: 'Sep 1',  comment: "Mar 17: Jobe (elbow) is scheduled to play catch out to 120 feet three times this week." },
  'Cody Bradford':           { status: 'Out',      returnDate: 'May 1',  comment: "Mar 19: Bradford (elbow) began facing live hitters and should be ready for a rehab assignment at season start." },
  'Taylor Walls':            { status: 'Out',      returnDate: 'Apr 14', comment: "Mar 20: Walls received cortisone injection in right oblique, sidelined at least 3-4 weeks." },
  'Edwin Uceta':             { status: 'Out',      returnDate: 'Apr 10', comment: "Mar 14: Uceta (shoulder) threw a bullpen session Saturday." },
  'Lars Nootbaar':           { status: 'Out',      returnDate: 'Apr 10', comment: "Mar 12: Nootbaar (heels) increasing agility drills and ramping up running program." },
  'Hunter Dobbins':          { status: 'Out',      returnDate: 'Apr 7',  comment: "Mar 15: Dobbins (knee) will begin the season on the injured list." },
  'Yimi Garcia':             { status: 'Out',      returnDate: 'Apr 10', comment: "Mar 14: Garcia (elbow) threw off a mound Saturday for the first time this spring." },
}


function normName(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
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


// ─── Recent News ─────────────────────────────────────────────────────────────
function NewsItem({ item }: { item: { title: string; pubDate: string; source: string; link: string } }) {
  const [expanded, setExpanded] = useState(false)
  const [desc, setDesc] = useState<string | null>(null)
  const [loadingDesc, setLoadingDesc] = useState(false)

  function toggle(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!expanded && desc === null && item.link) {
      setLoadingDesc(true)
      fetch(`/api/meta-description?url=${encodeURIComponent(item.link)}`)
        .then(r => r.json())
        .then(data => { setDesc(data.description || 'No description available.'); setLoadingDesc(false) })
        .catch(() => { setDesc('Could not load description.'); setLoadingDesc(false) })
    }
    setExpanded(p => !p)
  }

  return (
    <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
      <div style={{ padding: '9px 12px' }}>
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 12, fontWeight: 700, color: 'var(--cyan)', textDecoration: 'none', lineHeight: 1.4, display: 'block' }}
          onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
          onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
        >
          {item.title}
        </a>
        <div style={{ display: 'flex', gap: 8, marginTop: 3, alignItems: 'center' }}>
          {item.source && <span style={{ fontSize: 9, color: 'var(--text3)' }}>{item.source}</span>}
          {item.pubDate && (
            <span style={{ fontSize: 9, color: 'var(--text3)' }}>
              {new Date(item.pubDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
          <button onClick={toggle}
            style={{ fontSize: 9, color: 'var(--cyan)', background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', fontFamily: 'inherit' }}>
            {expanded ? '▲ less' : '▼ more'}
          </button>
        </div>
      </div>
      {expanded && (
        <div style={{ padding: '8px 12px 10px', fontSize: 11, color: 'var(--text2)', lineHeight: 1.6, borderTop: '1px solid var(--border)' }}>
          {loadingDesc ? 'Loading…' : desc}
        </div>
      )}
    </div>
  )
}

function RecentNews({ playerName }: { playerName: string }) {
  const [items, setItems] = useState<{ title: string; pubDate: string; source: string; link: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setLoading(true)
    fetch(`/api/player-news?name=${encodeURIComponent(playerName)}`)
      .then(r => r.json())
      .then(data => { setItems(data.items ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [playerName])

  if (!mounted) return null
  if (loading) return <div style={{ padding: '8px 0', fontSize: 11, color: 'var(--text3)', textAlign: 'center' }}>Loading news…</div>
  if (items.length === 0) return <div style={{ padding: '8px 0', fontSize: 11, color: 'var(--text3)', fontStyle: 'italic' }}>No recent news found.</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {items.map((item, i) => <NewsItem key={i} item={item} />)}
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
                    plRank(PL_HLD_RANKS, player.n) ? { r: plRank(PL_HLD_RANKS, player.n)!, label: 'PL HLD' } : null,
                    plRank(PL_SV_RANKS, player.n)  ? { r: plRank(PL_SV_RANKS, player.n)!,  label: 'PL SV'  } : null,
                    plRank(PL_SP_RANKS, player.n)  ? { r: plRank(PL_SP_RANKS, player.n)!,  label: 'PL SP'  } : null,
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

        {/* ── INJURY STATUS ── */}
        {(() => {
          const inj = injuryInfo(player.n)
          if (!inj) return null
          const sc = inj.status === 'DTD' ? { color: '#fbbf24', bg: '#2a1e06', border: '#b45309' } : inj.status === 'IL' ? { color: '#c084fc', bg: '#3b0764', border: '#7c3aed' } : { color: '#f87171', bg: '#450a0a', border: '#991b1b' }
          return (
            <div style={{ margin: '10px 20px 0', padding: '12px 14px', background: sc.bg, border: '1px solid ' + sc.border, borderRadius: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: sc.color }}>{inj.status}</span>
                <span style={{ fontSize: 10, color: 'var(--text3)' }}>·</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)' }}>Est. Return: {inj.returnDate}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.55 }}>{inj.comment}</div>
            </div>
          )
        })()}

        {/* ── RECENT NEWS ── */}
        <div style={{ margin: '10px 20px 0', padding: '12px 14px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: '0.15em' }}>RECENT NEWS</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>
          <RecentNews playerName={player.n} />
        </div>

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
