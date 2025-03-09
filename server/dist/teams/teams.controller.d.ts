import { TeamsService, PlayoffResults } from './teams.service';
interface WeightingsDto {
    offense: number;
    defense: number;
    threePoint: number;
}
export declare class TeamsController {
    private readonly teamsService;
    constructor(teamsService: TeamsService);
    simulateWithWeights(weightings: WeightingsDto): Promise<PlayoffResults>;
}
export {};
