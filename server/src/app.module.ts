import { Module } from '@nestjs/common';
import { TeamsController } from './teams/teams.controller';
import { TeamsService } from './teams/teams.service';

@Module({
  imports: [],
  controllers: [TeamsController],
  providers: [TeamsService],
})
export class AppModule {}