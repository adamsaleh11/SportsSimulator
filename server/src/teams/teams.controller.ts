import { Controller, Post, Body } from '@nestjs/common';
    import { TeamsService, PlayoffResults } from './teams.service';

    interface WeightingsDto {
      offense: number;
      defense: number;
      threePoint: number;
    }

    @Controller('api')
    export class TeamsController {
      constructor(private readonly teamsService: TeamsService) {}

      @Post('simulate')
      async simulateWithWeights(@Body() weightings: WeightingsDto): Promise<PlayoffResults> {
        this.teamsService.OFFENSE_WEIGHT = weightings.offense / 100;
        this.teamsService.DEFENSE_WEIGHT = weightings.defense / 100;
        this.teamsService.SHOOTING_WEIGHT = weightings.threePoint / 100;

        return this.teamsService.simulatePlayoffs();
      }
    }