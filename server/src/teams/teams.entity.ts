// src/teams/teams.entity.ts
export class Team {
  constructor(
    public name: string,
    public offensiveRating: number,
    public defensiveRating: number,
    public threePointAttempts: number, // Changed from threePointPercentage - Keeping threePointAttempts for now, as per original code, despite example mentioning 3P%
    public conference: string,
    public winPercentage: number = 0,
    public championshipScore: number = 0, // repurposed weightedRating to championshipScore
    public weightedRating: number = 0, // Keep weightedRating for now, might remove later
  ) {}
}

export interface GameResult {
  gameNumber: number;
  winner: string;
  team1Rating: string;
  team2Rating: string;
  homeTeam: string;
  margin: number;
}

export interface SeriesResult {
  winner: Team;
  team1Wins: number;
  team2Wins: number;
  team1Name: string;
  team2Name: string;
  games: GameResult[];
}

export interface PlayInGame {
  matchup: string;
  winner: string;
  loser: string;
}

export interface PlayInResult {
  seventhSeed: Team;
  eighthSeed: Team;
  games: PlayInGame[];
}

export interface ConferencePlayoffs {
  playIn: PlayInResult | null;
  round1: SeriesResult[];
  round2: SeriesResult[];
  finals: SeriesResult | null;
}

export interface PlayoffResults {
  Eastern: ConferencePlayoffs;
  Western: ConferencePlayoffs;
  Finals: SeriesResult | null;
  teams: Team[];
}