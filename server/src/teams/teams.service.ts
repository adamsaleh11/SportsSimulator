import { Injectable, Logger } from '@nestjs/common';
import { Team, SeriesResult, ConferencePlayoffs, PlayoffResults, GameResult } from './teams.entity';

interface PlayInGame {
  matchup: string;
  winner: string;
  loser: string;
}

interface PlayInResult {
  seventhSeed: Team;
  eighthSeed: Team;
  games: PlayInGame[];
}

interface DesperationFactor {
  team1: number;
  team2: number;
}

@Injectable()
export class TeamsService {
  private readonly logger = new Logger(TeamsService.name);

  // Algorithm weights based on refined analysis
  public DEFENSE_WEIGHT = 0.40; // 40% DRtg
  public SHOOTING_WEIGHT = 0.25; // 25% 3PA
  public OFFENSE_WEIGHT = 0.20; // 20% ORtg
  public WIN_PCT_WEIGHT = 0.15; // 15% Win%
  public HOME_COURT_ADVANTAGE = 0.05; // Increased from 3% to 5%
  public MAX_LUCK_FACTOR = 0.08; // Increased from 2% to 8%
  public PLAYOFF_INTENSITY_FACTOR = 0.9; // Reduces effective rating gap in playoffs

  private readonly TEAMS: Team[] = [
    // Eastern Conference (full season as of March 9, 2025, ordered by seed per @stats_feed)
    new Team('Cleveland Cavaliers', 116.5, 107.8, 36.5, 'Eastern', 0.820), // #1
    new Team('Boston Celtics', 123.0, 109.0, 39.0, 'Eastern', 0.780),     // #2
    new Team('New York Knicks', 117.8, 111.5, 37.0, 'Eastern', 0.710),   // #3
    new Team('Milwaukee Bucks', 118.5, 113.5, 37.5, 'Eastern', 0.690),   // #4
    new Team('Indiana Pacers', 119.0, 114.8, 38.0, 'Eastern', 0.670),    // #5
    new Team('Detroit Pistons', 114.0, 111.0, 35.0, 'Eastern', 0.650),   // #6 (estimated stats)
    new Team('Atlanta Hawks', 116.0, 117.0, 36.8, 'Eastern', 0.620),     // #7
    new Team('Orlando Magic', 113.8, 110.0, 35.5, 'Eastern', 0.590),     // #8
    new Team('Miami Heat', 114.2, 113.0, 36.0, 'Eastern', 0.570),        // #9
    new Team('Chicago Bulls', 112.8, 115.0, 36.0, 'Eastern', 0.550),     // #10
  
    // Western Conference (full season as of March 9, 2025, ordered by seed per @stats_feed)
    new Team('Oklahoma City Thunder', 119.8, 109.5, 39.5, 'Western', 0.810), // #1
    new Team('Denver Nuggets', 118.8, 111.0, 37.5, 'Western', 0.760),      // #2
    new Team('Los Angeles Lakers', 116.0, 113.5, 36.0, 'Western', 0.740),   // #3
    new Team('Memphis Grizzlies', 117.0, 112.5, 37.0, 'Western', 0.720),    // #4 (estimated stats)
    new Team('Houston Rockets', 116.5, 113.0, 36.5, 'Western', 0.700),      // #5 (estimated stats)
    new Team('Golden State Warriors', 117.5, 114.0, 39.0, 'Western', 0.680), // #6
    new Team('Minnesota Timberwolves', 115.2, 107.0, 38.0, 'Western', 0.660), // #7
    new Team('Los Angeles Clippers', 116.5, 112.5, 38.5, 'Western', 0.640),  // #8
    new Team('Sacramento Kings', 117.3, 114.5, 36.5, 'Western', 0.620),     // #9
    new Team('Dallas Mavericks', 119.5, 114.0, 37.0, 'Western', 0.600),     // #10
  ];

  async fetchTeamData(): Promise<Team[]> {
    const teams = this.TEAMS.map(team => {
      return new Team(
        team.name,
        team.offensiveRating,
        team.defensiveRating,
        team.threePointAttempts,
        team.conference,
        team.winPercentage
      );
    });
    this.calculateChampionshipScores(teams);
    this.logger.log(`Loaded ${teams.length} teams with post-All-Star break stats.`);
    return teams;
  }

  private calculateChampionshipScores(teams: Team[]): void {
    const ortgRanks = this.rankTeams(teams, 'offensiveRating');
    const drtgRanks = this.rankTeams(teams, 'defensiveRating', true);
    const tpaRanks = this.rankTeams(teams, 'threePointAttempts');
    const winPctRanks = this.rankTeams(teams, 'winPercentage');

    teams.forEach(team => {
      const ortgRank = ortgRanks.get(team.name) || 20;
      const drtgRank = drtgRanks.get(team.name) || 20;
      const tpaRank = tpaRanks.get(team.name) || 20;
      const winPctRank = winPctRanks.get(team.name) || 20;

      team.weightedRating =
        this.DEFENSE_WEIGHT * drtgRank +
        this.SHOOTING_WEIGHT * tpaRank +
        this.OFFENSE_WEIGHT * ortgRank +
        this.WIN_PCT_WEIGHT * winPctRank;
    });
  }

  private rankTeams(teams: Team[], stat: keyof Team, inverse: boolean = false): Map<string, number> {
    const sortedTeams = [...teams].sort((a, b) => {
      const aValue = a[stat] as number;
      const bValue = b[stat] as number;
      return inverse ? aValue - bValue : bValue - aValue;
    });

    const ranks = new Map<string, number>();
    sortedTeams.forEach((team, index) => {
      ranks.set(team.name, index + 1);
    });
    return ranks;
  }

  simulateSeries(team1: Team, team2: Team, isPlayIn = false): SeriesResult {
    let team1Wins = 0;
    let team2Wins = 0;
    const games: GameResult[] = [];
    const maxWins = isPlayIn ? 1 : 4;

    // Calculate the baseline rating difference and apply playoff intensity factor
    // This makes higher seeded teams less dominant in the playoffs
    const baselineTeam1Rating = 1 / (team1.weightedRating || 1);
    const baselineTeam2Rating = 1 / (team2.weightedRating || 1);
    const ratingDiff = Math.abs(baselineTeam1Rating - baselineTeam2Rating);
    const adjustedRatingDiff = ratingDiff * this.PLAYOFF_INTENSITY_FACTOR;

    // Determine the favorite and underdog for game-by-game adjustments
    const favorite = baselineTeam1Rating > baselineTeam2Rating ? team1 : team2;
    const underdog = favorite === team1 ? team2 : team1;
    
    // Momentum factor that can shift during a series
    let underdogMomentum = 0;

    while (team1Wins < maxWins && team2Wins < maxWins) {
      const gameNumber = team1Wins + team2Wins + 1;
      const team1HasHomeCourt = isPlayIn || [1, 2, 5, 7].includes(gameNumber);

      // Higher luck factor for increased variability
      const baseLuckFactor = (Math.random() * (this.MAX_LUCK_FACTOR * 2)) - this.MAX_LUCK_FACTOR;
      
      // Add desperation factor - teams playing to avoid elimination get a small boost
      const desperationFactor = this.calculateDesperationFactor(team1, team2, team1Wins, team2Wins, maxWins);
      
      // Update momentum (underdogs get momentum as series progresses)
      underdogMomentum = this.updateMomentum(underdogMomentum, team1, team2, team1Wins, team2Wins, favorite);
      
      // Calculate effective ratings with all factors
      let team1EffectiveRating = baselineTeam1Rating;
      let team2EffectiveRating = baselineTeam2Rating;
      
      // Apply home court advantage
      if (team1HasHomeCourt) {
        team1EffectiveRating += this.HOME_COURT_ADVANTAGE;
      } else {
        team2EffectiveRating += this.HOME_COURT_ADVANTAGE;
      }
      
      // Apply momentum to the underdog
      if (underdog === team1) {
        team1EffectiveRating += underdogMomentum;
      } else {
        team2EffectiveRating += underdogMomentum;
      }
      
      // Apply desperation factor
      team1EffectiveRating += desperationFactor.team1;
      team2EffectiveRating += desperationFactor.team2;
      
      // Apply random luck factor
      team1EffectiveRating += baseLuckFactor;
      team2EffectiveRating += (Math.random() * (this.MAX_LUCK_FACTOR * 2)) - this.MAX_LUCK_FACTOR;

      // Calculate game margin
      const effectiveRatingDiff = Math.abs(team1EffectiveRating - team2EffectiveRating);
      // Smaller multiplier for tighter games
      const margin = Math.max(1, Math.floor(effectiveRatingDiff * 30) + (Math.floor(Math.random() * 8) - 4));

      const homeTeam = team1HasHomeCourt ? team1.name : team2.name;
      if (team1EffectiveRating > team2EffectiveRating) {
        team1Wins++;
        games.push({
          gameNumber,
          winner: team1.name,
          team1Rating: team1EffectiveRating.toFixed(3),
          team2Rating: team2EffectiveRating.toFixed(3),
          homeTeam,
          margin,
        });
      } else {
        team2Wins++;
        games.push({
          gameNumber,
          winner: team2.name,
          team1Rating: team1EffectiveRating.toFixed(3),
          team2Rating: team2EffectiveRating.toFixed(3),
          homeTeam,
          margin,
        });
      }
    }

    return {
      winner: team1Wins > team2Wins ? team1 : team2,
      team1Wins,
      team2Wins,
      team1Name: team1.name,
      team2Name: team2.name,
      games,
    };
  }

  // Calculate a boost for teams facing elimination
  private calculateDesperationFactor(team1: Team, team2: Team, team1Wins: number, team2Wins: number, maxWins: number): DesperationFactor {
    const result: DesperationFactor = { team1: 0, team2: 0 };
    
    // If a team is one loss away from elimination, give them a boost
    if (team2Wins === maxWins - 1) {
      result.team1 += 0.03; // 3% boost when facing elimination
    }
    
    if (team1Wins === maxWins - 1) {
      result.team2 += 0.03; // 3% boost when facing elimination
    }
    
    return result;
  }

  // Update momentum factor - underdogs gain momentum as series progresses
  private updateMomentum(currentMomentum: number, team1: Team, team2: Team, team1Wins: number, team2Wins: number, favorite: Team): number {
    const totalGames = team1Wins + team2Wins;
    
    // Underdog wins increase momentum more
    if (favorite === team1 && team2Wins > 0) {
      return Math.min(0.05, currentMomentum + 0.01 * team2Wins);
    } else if (favorite === team2 && team1Wins > 0) {
      return Math.min(0.05, currentMomentum + 0.01 * team1Wins);
    }
    
    // Slight momentum for longer series regardless
    return Math.min(0.03, currentMomentum + 0.005 * totalGames);
  }

  async simulatePlayoffs(): Promise<PlayoffResults> {
    const allTeams = await this.fetchTeamData();

    const conferenceTeams: Record<string, Team[]> = { Eastern: [], Western: [] };
    allTeams.forEach(team => conferenceTeams[team.conference].push(team));
    // Do NOT sort by weightedRating here to preserve standings order

    const results: PlayoffResults = {
      Eastern: { playIn: null, round1: [], round2: [], finals: null },
      Western: { playIn: null, round1: [], round2: [], finals: null },
      Finals: null,
      teams: allTeams,
    };

    for (const conference of ['Eastern', 'Western'] as const) {
      const teams = conferenceTeams[conference];
      const playInResult = this.simulatePlayInTournament(teams);
      results[conference].playIn = playInResult;

      // Round 1 matchups: #1 vs 7-8 winner, #2 vs (9-10 winner vs 7-8 loser), #3 vs #6, #4 vs #5
      results[conference].round1 = [
        this.simulateSeries(teams[0], playInResult.seventhSeed), // #1 vs 7-8 winner
        this.simulateSeries(teams[1], playInResult.eighthSeed),  // #2 vs (9-10 winner vs 7-8 loser)
        this.simulateSeries(teams[2], teams[5]),                 // #3 vs #6
        this.simulateSeries(teams[3], teams[4]),                 // #4 vs #5
      ];

      const round2Teams = results[conference].round1.map(series => series.winner);
      results[conference].round2 = [
        this.simulateSeries(round2Teams[0], round2Teams[3]), // Winner of 1 vs 4
        this.simulateSeries(round2Teams[1], round2Teams[2]), // Winner of 2 vs 3
      ];

      const finalsTeams = results[conference].round2.map(series => series.winner);
      results[conference].finals = this.simulateSeries(finalsTeams[0], finalsTeams[1]);
    }

    if (results.Eastern.finals && results.Western.finals) {
      results.Finals = this.simulateSeries(results.Eastern.finals.winner, results.Western.finals.winner);
    }

    return results;
  }

  private simulatePlayInTournament(teams: Team[]): PlayInResult {
    const playInGames: PlayInGame[] = [];

    // Game 1: 9 vs 10, loser eliminated
    const game1 = this.simulateSeries(teams[8], teams[9], true); // 9 vs 10
    const game1Winner = game1.winner;
    const game1Loser = game1.winner === teams[8] ? teams[9] : teams[8];
    playInGames.push({ matchup: `${teams[8].name} vs. ${teams[9].name}`, winner: game1Winner.name, loser: game1Loser.name });

    // Game 2: 7 vs 8
    const game2 = this.simulateSeries(teams[6], teams[7], true); // 7 vs 8
    const seventhSeed = game2.winner; // Winner gets 7th seed
    const game2Loser = game2.winner === teams[6] ? teams[7] : teams[6];
    playInGames.push({ matchup: `${teams[6].name} vs. ${teams[7].name}`, winner: seventhSeed.name, loser: game2Loser.name });

    // Game 3: Winner of 9 vs 10 vs Loser of 7 vs 8
    const game3 = this.simulateSeries(game1Winner, game2Loser, true);
    const eighthSeed = game3.winner; // Winner gets 8th seed
    playInGames.push({ matchup: `${game1Winner.name} vs. ${game2Loser.name}`, winner: eighthSeed.name, loser: game3.winner === game1Winner ? game2Loser.name : game1Winner.name });

    return { seventhSeed, eighthSeed, games: playInGames };
  }

  async runMultipleSimulations(count: number = 1000): Promise<{ team: string; probability: number }[]> {
    const championshipCount: Record<string, number> = {};
    const seriesLengthDistribution: Record<number, number> = { 4: 0, 5: 0, 6: 0, 7: 0 };
    const allTeams = await this.fetchTeamData();
    allTeams.forEach(team => (championshipCount[team.name] = 0));

    for (let i = 0; i < count; i++) {
      const results = await this.simulatePlayoffs();
      if (results.Finals?.winner) {
        championshipCount[results.Finals.winner.name]++;
      }
      
      // Track series length distribution
      this.trackSeriesLengths(results, seriesLengthDistribution);
    }

    const probabilities = Object.entries(championshipCount)
      .map(([team, wins]) => ({ team, probability: (wins / count) * 100 }))
      .sort((a, b) => b.probability - a.probability);

    // Log series length distribution
    const totalSeries = Object.values(seriesLengthDistribution).reduce((sum, count) => sum + count, 0);
    this.logger.log(`Series length distribution: 
      4 games (sweep): ${(seriesLengthDistribution[4] / totalSeries * 100).toFixed(2)}%
      5 games: ${(seriesLengthDistribution[5] / totalSeries * 100).toFixed(2)}%
      6 games: ${(seriesLengthDistribution[6] / totalSeries * 100).toFixed(2)}%
      7 games: ${(seriesLengthDistribution[7] / totalSeries * 100).toFixed(2)}%`);
    
    this.logger.log(`Completed ${count} playoff simulations. Top team: ${probabilities[0].team} (${probabilities[0].probability.toFixed(2)}%)`);
    return probabilities;
  }
  
  // Track the distribution of series lengths for analysis
  private trackSeriesLengths(results: PlayoffResults, distribution: Record<number, number>): void {
    // Function to count games in a series
    const countGames = (series: SeriesResult | null) => {
      if (!series) return;
      const totalGames = series.team1Wins + series.team2Wins;
      distribution[totalGames] = (distribution[totalGames] || 0) + 1;
    };
    
    // Count for Eastern Conference
    results.Eastern.round1.forEach(countGames);
    results.Eastern.round2.forEach(countGames);
    countGames(results.Eastern.finals);
    
    // Count for Western Conference
    results.Western.round1.forEach(countGames);
    results.Western.round2.forEach(countGames);
    countGames(results.Western.finals);
    
    // Count NBA Finals
    countGames(results.Finals);
  }
}

export { PlayoffResults };