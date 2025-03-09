import { Team, SeriesResult, PlayoffResults } from './teams.entity';
export declare class TeamsService {
    private readonly logger;
    DEFENSE_WEIGHT: number;
    SHOOTING_WEIGHT: number;
    OFFENSE_WEIGHT: number;
    WIN_PCT_WEIGHT: number;
    HOME_COURT_ADVANTAGE: number;
    MAX_LUCK_FACTOR: number;
    PLAYOFF_INTENSITY_FACTOR: number;
    private readonly TEAMS;
    fetchTeamData(): Promise<Team[]>;
    private calculateChampionshipScores;
    private rankTeams;
    simulateSeries(team1: Team, team2: Team, isPlayIn?: boolean): SeriesResult;
    private calculateDesperationFactor;
    private updateMomentum;
    simulatePlayoffs(): Promise<PlayoffResults>;
    private simulatePlayInTournament;
    runMultipleSimulations(count?: number): Promise<{
        team: string;
        probability: number;
    }[]>;
    private trackSeriesLengths;
}
export { PlayoffResults };
