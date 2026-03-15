import type { Conference, Division } from '../types/team.js';
import type { OffensiveScheme, DefensiveScheme } from '../types/coach.js';

/**
 * Fictional NFL-style league with 32 teams.
 * 2 conferences, 4 divisions each, 4 teams per division.
 * All names are original to avoid trademark issues.
 */

export interface TeamSeed {
  city: string;
  name: string;
  abbreviation: string;
  conference: Conference;
  division: Division;
  stadium: string;
  ownerName: string;
}

export const TEAM_SEEDS: TeamSeed[] = [
  // AFC East
  { city: 'Atlantic City', name: 'Aces', abbreviation: 'ACA', conference: 'AFC', division: 'AFC East', stadium: 'Boardwalk Stadium', ownerName: 'Vincent Hargrove' },
  { city: 'Hartford', name: 'Whalers', abbreviation: 'HTW', conference: 'AFC', division: 'AFC East', stadium: 'Charter Oak Arena', ownerName: 'Patricia Winslow' },
  { city: 'Providence', name: 'Ironworks', abbreviation: 'PRI', conference: 'AFC', division: 'AFC East', stadium: 'Narragansett Field', ownerName: 'Samuel Briggs' },
  { city: 'Richmond', name: 'Generals', abbreviation: 'RCG', conference: 'AFC', division: 'AFC East', stadium: 'Capitol Dome', ownerName: 'Eleanor Tate' },

  // AFC North
  { city: 'Birmingham', name: 'Forge', abbreviation: 'BIF', conference: 'AFC', division: 'AFC North', stadium: 'Steel City Arena', ownerName: 'Marcus Drummond' },
  { city: 'Louisville', name: 'Thoroughbreds', abbreviation: 'LVT', conference: 'AFC', division: 'AFC North', stadium: 'Bluegrass Coliseum', ownerName: 'Catherine Mercer' },
  { city: 'Columbus', name: 'Pioneers', abbreviation: 'CLP', conference: 'AFC', division: 'AFC North', stadium: 'Frontier Field', ownerName: 'David Ashworth' },
  { city: 'Memphis', name: 'Rivermen', abbreviation: 'MER', conference: 'AFC', division: 'AFC North', stadium: 'Beale Street Bowl', ownerName: 'Isaac Caldwell' },

  // AFC South
  { city: 'San Antonio', name: 'Marshals', abbreviation: 'SAM', conference: 'AFC', division: 'AFC South', stadium: 'Alamo Dome', ownerName: 'Rosa Delgado' },
  { city: 'Orlando', name: 'Storm', abbreviation: 'ORS', conference: 'AFC', division: 'AFC South', stadium: 'Sunshine Arena', ownerName: 'James Whitfield' },
  { city: 'Norfolk', name: 'Admirals', abbreviation: 'NFA', conference: 'AFC', division: 'AFC South', stadium: 'Hampton Roads Field', ownerName: 'Thomas Archer' },
  { city: 'Raleigh', name: 'Oaks', abbreviation: 'RAO', conference: 'AFC', division: 'AFC South', stadium: 'Piedmont Park', ownerName: 'Linda Beaumont' },

  // AFC West
  { city: 'Portland', name: 'Timberline', abbreviation: 'PTL', conference: 'AFC', division: 'AFC West', stadium: 'Cascade Stadium', ownerName: 'Nathan Frost' },
  { city: 'Salt Lake', name: 'Raptors', abbreviation: 'SLR', conference: 'AFC', division: 'AFC West', stadium: 'Granite Peak Arena', ownerName: 'Rebecca Stone' },
  { city: 'Albuquerque', name: 'Sidewinders', abbreviation: 'ABS', conference: 'AFC', division: 'AFC West', stadium: 'Mesa Dome', ownerName: 'Carlos Vega' },
  { city: 'Omaha', name: 'Sentinels', abbreviation: 'OMS', conference: 'AFC', division: 'AFC West', stadium: 'Plains Field', ownerName: 'Harold Jensen' },

  // NFC East
  { city: 'Brooklyn', name: 'Kings', abbreviation: 'BKK', conference: 'NFC', division: 'NFC East', stadium: 'Borough Arena', ownerName: 'Michael DeLuca' },
  { city: 'Philadelphia', name: 'Liberty', abbreviation: 'PHL', conference: 'NFC', division: 'NFC East', stadium: 'Independence Bowl', ownerName: 'Grace Mitchell' },
  { city: 'Baltimore', name: 'Ironbirds', abbreviation: 'BAI', conference: 'NFC', division: 'NFC East', stadium: 'Harbor Field', ownerName: 'Kenneth Morris' },
  { city: 'Charlotte', name: 'Hornets', abbreviation: 'CHH', conference: 'NFC', division: 'NFC East', stadium: 'Queen City Dome', ownerName: 'Angela Foster' },

  // NFC North
  { city: 'Milwaukee', name: 'Brewmasters', abbreviation: 'MWB', conference: 'NFC', division: 'NFC North', stadium: 'Lakefront Stadium', ownerName: 'Frank Novak' },
  { city: 'Minneapolis', name: 'Blizzard', abbreviation: 'MNB', conference: 'NFC', division: 'NFC North', stadium: 'North Star Dome', ownerName: 'Ingrid Larsen' },
  { city: 'Detroit', name: 'Motors', abbreviation: 'DTM', conference: 'NFC', division: 'NFC North', stadium: 'Assembly Line Arena', ownerName: 'Raymond Kessler' },
  { city: 'St. Louis', name: 'Archers', abbreviation: 'SLA', conference: 'NFC', division: 'NFC North', stadium: 'Gateway Field', ownerName: 'Dorothy Shaw' },

  // NFC South
  { city: 'New Orleans', name: 'Krewe', abbreviation: 'NOK', conference: 'NFC', division: 'NFC South', stadium: 'Crescent Bowl', ownerName: 'Antoine Broussard' },
  { city: 'Austin', name: 'Outlaws', abbreviation: 'AUO', conference: 'NFC', division: 'NFC South', stadium: 'Lone Star Stadium', ownerName: 'William Crane' },
  { city: 'Nashville', name: 'Sounds', abbreviation: 'NHS', conference: 'NFC', division: 'NFC South', stadium: 'Music Row Dome', ownerName: 'Dolores Harper' },
  { city: 'Tampa', name: 'Tides', abbreviation: 'TAT', conference: 'NFC', division: 'NFC South', stadium: 'Gulf Coast Arena', ownerName: 'Roberto Santana' },

  // NFC West
  { city: 'Sacramento', name: 'Condors', abbreviation: 'SAC', conference: 'NFC', division: 'NFC West', stadium: 'Gold Rush Field', ownerName: 'Helen Nguyen' },
  { city: 'San Diego', name: 'Surf', abbreviation: 'SDS', conference: 'NFC', division: 'NFC West', stadium: 'Pacific Stadium', ownerName: 'Daniel Reyes' },
  { city: 'Tucson', name: 'Scorpions', abbreviation: 'TUS', conference: 'NFC', division: 'NFC West', stadium: 'Desert Dome', ownerName: 'Maria Espinoza' },
  { city: 'Las Vegas', name: 'Vipers', abbreviation: 'LVV', conference: 'NFC', division: 'NFC West', stadium: 'Neon Bowl', ownerName: 'Steven Blackwell' },
];

export const OFFENSIVE_SCHEMES: OffensiveScheme[] = [
  'west_coast', 'spread', 'air_raid', 'power_run',
  'zone_run', 'rpo_heavy', 'play_action_heavy', 'pro_style',
];

export const DEFENSIVE_SCHEMES: DefensiveScheme[] = [
  '4_3_under', '3_4', 'nickel_base', 'cover_3',
  'cover_2_tampa', 'multiple', 'aggressive_blitz',
];

export const COLLEGES: string[] = [
  'Alabama', 'Ohio State', 'Georgia', 'Clemson', 'LSU', 'Michigan',
  'Oklahoma', 'Texas', 'USC', 'Oregon', 'Penn State', 'Florida',
  'Notre Dame', 'Auburn', 'Tennessee', 'Texas A&M', 'Wisconsin',
  'Iowa', 'Miami', 'Stanford', 'UCLA', 'Washington', 'Virginia Tech',
  'Florida State', 'Nebraska', 'Arkansas', 'Mississippi State', 'Kentucky',
  'Baylor', 'TCU', 'Utah', 'North Carolina', 'Pittsburgh', 'Michigan State',
  'Colorado', 'Arizona State', 'Missouri', 'South Carolina', 'West Virginia',
  'Minnesota', 'Illinois', 'Purdue', 'Indiana', 'Duke', 'Northwestern',
  'Boston College', 'Wake Forest', 'Syracuse', 'Rutgers', 'Maryland',
  'Boise State', 'UCF', 'Cincinnati', 'Memphis', 'Houston', 'SMU',
  'Tulane', 'Liberty', 'James Madison', 'Appalachian State', 'Coastal Carolina',
];

export const FIRST_NAMES: string[] = [
  'James', 'Marcus', 'DeAndre', 'Tyrone', 'Kyle', 'Brandon', 'Chris',
  'Aaron', 'Justin', 'Tyler', 'Jordan', 'Darius', 'Michael', 'Antonio',
  'Terrell', 'Lamar', 'Jamal', 'Derek', 'Cameron', 'Malik', 'Isaiah',
  'Xavier', 'Tre', 'Devonta', 'Kadarius', 'Jalen', 'Zach', 'Trey',
  'DJ', 'CJ', 'AJ', 'TJ', 'JJ', 'Jaylen', 'Davante', 'Stefon',
  'Patrick', 'Josh', 'Joe', 'Mac', 'Trevor', 'Tua', 'Justin', 'Dak',
  'Caleb', 'Drake', 'Jayden', 'Bryce', 'Will', 'Aidan', 'Bo',
  'Brock', 'Kenny', 'Geno', 'Sam', 'Daniel', 'Baker', 'Deshaun',
  'Russell', 'Kirk', 'Ryan', 'Matt', 'Derek', 'Carson', 'Kyler',
  'Lamar', 'Jared', 'Jimmy', 'Mitch', 'Davis', 'Spencer', 'Hendon',
];

export const LAST_NAMES: string[] = [
  'Johnson', 'Williams', 'Brown', 'Jones', 'Davis', 'Smith', 'Wilson',
  'Jackson', 'Thomas', 'Moore', 'Taylor', 'Anderson', 'White', 'Harris',
  'Martin', 'Thompson', 'Robinson', 'Clark', 'Lewis', 'Walker', 'Hall',
  'Allen', 'Young', 'King', 'Wright', 'Hill', 'Green', 'Adams',
  'Nelson', 'Carter', 'Mitchell', 'Turner', 'Phillips', 'Campbell',
  'Parker', 'Evans', 'Edwards', 'Collins', 'Stewart', 'Morris',
  'Murphy', 'Cook', 'Rogers', 'Morgan', 'Peterson', 'Cooper', 'Reed',
  'Bailey', 'Bell', 'Howard', 'Ward', 'Bennett', 'Wood', 'Brooks',
  'Gray', 'James', 'Watson', 'Diggs', 'Lamb', 'Chase', 'Jefferson',
  'Parsons', 'Sauce', 'Stroud', 'Harrison', 'Daniels', 'Penix',
  'Nix', 'Maye', 'McCarthy', 'Worthy', 'Nabers', 'Bowers', 'Alt',
];

/** Position roster template: how many of each position a team typically has */
export const ROSTER_TEMPLATE: Record<string, number> = {
  QB: 3, RB: 4, FB: 1, WR: 6, TE: 3,
  LT: 2, LG: 2, C: 2, RG: 2, RT: 2,
  DE: 4, DT: 3, OLB: 4, ILB: 3,
  CB: 5, FS: 2, SS: 2,
  K: 1, P: 1, LS: 1,
};
