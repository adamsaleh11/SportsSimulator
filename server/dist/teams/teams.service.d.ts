import { Team, SeriesResult, PlayoffResults } from './teams.entity';
export declare class TeamsService {
    private readonly logger;
    DEFENSE_WEIGHT: number;
    SHOOTING_WEIGHT: number;
    OFFENSE_WEIGHT: number;
    private readonly WIN_PCT_WEIGHT;
    private readonly HOME_COURT_ADVANTAGE;
    private readonly MAX_LUCK_FACTOR;
    private readonly TEAMS;
    fetchTeamData(): Promise<Team[]>;
    private calculateChampionshipScores;
    private rankTeams;
    simulateSeries(team1: Team, team2: Team, isPlayIn?: boolean): SeriesResult;
    simulatePlayoffs(): Promise<PlayoffResults>;
    private simulatePlayInTournament;
    runMultipleSimulations(count?: number): Promise<{
        team: string;
        probability: number;
    }[]>;
}
export { PlayoffResults };
