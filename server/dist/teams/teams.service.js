"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var TeamsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamsService = void 0;
const common_1 = require("@nestjs/common");
const teams_entity_1 = require("./teams.entity");
let TeamsService = TeamsService_1 = class TeamsService {
    logger = new common_1.Logger(TeamsService_1.name);
    DEFENSE_WEIGHT = 0.25;
    SHOOTING_WEIGHT = 0.15;
    OFFENSE_WEIGHT = 0.25;
    WIN_PCT_WEIGHT = 0.15;
    HOME_COURT_ADVANTAGE = 0.10;
    MAX_LUCK_FACTOR = 0.10;
    TEAMS = [
        new teams_entity_1.Team('Cleveland Cavaliers', 116.5, 107.8, 36.5, 'Eastern', 0.820),
        new teams_entity_1.Team('Boston Celtics', 123.0, 109.0, 39.0, 'Eastern', 0.780),
        new teams_entity_1.Team('New York Knicks', 117.8, 111.5, 37.0, 'Eastern', 0.710),
        new teams_entity_1.Team('Milwaukee Bucks', 118.5, 113.5, 37.5, 'Eastern', 0.690),
        new teams_entity_1.Team('Indiana Pacers', 119.0, 114.8, 38.0, 'Eastern', 0.670),
        new teams_entity_1.Team('Philadelphia 76ers', 115.0, 112.0, 37.3, 'Eastern', 0.650),
        new teams_entity_1.Team('Miami Heat', 114.2, 113.0, 36.0, 'Eastern', 0.610),
        new teams_entity_1.Team('Orlando Magic', 113.8, 110.0, 35.5, 'Eastern', 0.590),
        new teams_entity_1.Team('Chicago Bulls', 112.8, 115.0, 36.0, 'Eastern', 0.570),
        new teams_entity_1.Team('Atlanta Hawks', 116.0, 117.0, 36.8, 'Eastern', 0.550),
        new teams_entity_1.Team('Oklahoma City Thunder', 119.8, 109.5, 39.5, 'Western', 0.810),
        new teams_entity_1.Team('Los Angeles Lakers', 116.0, 113.5, 36.0, 'Western', 0.760),
        new teams_entity_1.Team('Denver Nuggets', 118.8, 111.0, 37.5, 'Western', 0.740),
        new teams_entity_1.Team('Minnesota Timberwolves', 115.2, 107.0, 38.0, 'Western', 0.720),
        new teams_entity_1.Team('Los Angeles Clippers', 116.5, 112.5, 38.5, 'Western', 0.700),
        new teams_entity_1.Team('Golden State Warriors', 117.5, 114.0, 39.0, 'Western', 0.680),
        new teams_entity_1.Team('Phoenix Suns', 118.0, 113.0, 38.0, 'Western', 0.650),
        new teams_entity_1.Team('Sacramento Kings', 117.3, 114.5, 36.5, 'Western', 0.630),
        new teams_entity_1.Team('Dallas Mavericks', 119.5, 114.0, 37.0, 'Western', 0.610),
        new teams_entity_1.Team('New Orleans Pelicans', 116.5, 112.0, 36.8, 'Western', 0.590),
    ];
    async fetchTeamData() {
        const teams = this.TEAMS.map(team => {
            return new teams_entity_1.Team(team.name, team.offensiveRating, team.defensiveRating, team.threePointAttempts, team.conference, team.winPercentage);
        });
        this.calculateChampionshipScores(teams);
        this.logger.log(`Loaded ${teams.length} teams with post-All-Star break stats.`);
        return teams;
    }
    calculateChampionshipScores(teams) {
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
    rankTeams(teams, stat, inverse = false) {
        const sortedTeams = [...teams].sort((a, b) => {
            const aValue = a[stat];
            const bValue = b[stat];
            return inverse ? aValue - bValue : bValue - aValue;
        });
        const ranks = new Map();
        sortedTeams.forEach((team, index) => {
            ranks.set(team.name, index + 1);
        });
        return ranks;
    }
    simulateSeries(team1, team2, isPlayIn = false) {
        let team1Wins = 0;
        let team2Wins = 0;
        const games = [];
        const maxWins = isPlayIn ? 1 : 4;
        while (team1Wins < maxWins && team2Wins < maxWins) {
            const gameNumber = team1Wins + team2Wins + 1;
            const team1HasHomeCourt = isPlayIn || [1, 2, 5, 7].includes(gameNumber);
            const luckFactor = (Math.random() * (this.MAX_LUCK_FACTOR * 2)) - this.MAX_LUCK_FACTOR;
            let team1EffectiveRating = 1 / (team1.weightedRating || 1) + luckFactor;
            let team2EffectiveRating = 1 / (team2.weightedRating || 1);
            if (team1HasHomeCourt)
                team1EffectiveRating += this.HOME_COURT_ADVANTAGE;
            else
                team2EffectiveRating += this.HOME_COURT_ADVANTAGE;
            const ratingDifference = Math.abs(team1EffectiveRating - team2EffectiveRating);
            const margin = Math.max(1, Math.floor(ratingDifference * 50) + (Math.floor(Math.random() * 10) - 5));
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
            }
            else {
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
    async simulatePlayoffs() {
        const allTeams = await this.fetchTeamData();
        const conferenceTeams = { Eastern: [], Western: [] };
        allTeams.forEach(team => conferenceTeams[team.conference].push(team));
        const results = {
            Eastern: { playIn: null, round1: [], round2: [], finals: null },
            Western: { playIn: null, round1: [], round2: [], finals: null },
            Finals: null,
            teams: allTeams,
        };
        for (const conference of ['Eastern', 'Western']) {
            const teams = conferenceTeams[conference];
            const playInResult = this.simulatePlayInTournament(teams);
            results[conference].playIn = playInResult;
            results[conference].round1 = [
                this.simulateSeries(teams[0], playInResult.seventhSeed),
                this.simulateSeries(teams[1], playInResult.eighthSeed),
                this.simulateSeries(teams[2], teams[5]),
                this.simulateSeries(teams[3], teams[4]),
            ];
            const round2Teams = results[conference].round1.map(series => series.winner);
            results[conference].round2 = [
                this.simulateSeries(round2Teams[0], round2Teams[3]),
                this.simulateSeries(round2Teams[1], round2Teams[2]),
            ];
            const finalsTeams = results[conference].round2.map(series => series.winner);
            results[conference].finals = this.simulateSeries(finalsTeams[0], finalsTeams[1]);
        }
        if (results.Eastern.finals && results.Western.finals) {
            results.Finals = this.simulateSeries(results.Eastern.finals.winner, results.Western.finals.winner);
        }
        return results;
    }
    simulatePlayInTournament(teams) {
        const playInGames = [];
        const game1 = this.simulateSeries(teams[8], teams[9], true);
        const game1Winner = game1.winner;
        const game1Loser = game1.winner === teams[8] ? teams[9] : teams[8];
        playInGames.push({ matchup: `${teams[8].name} vs. ${teams[9].name}`, winner: game1Winner.name, loser: game1Loser.name });
        const game2 = this.simulateSeries(teams[6], teams[7], true);
        const seventhSeed = game2.winner;
        const game2Loser = game2.winner === teams[6] ? teams[7] : teams[6];
        playInGames.push({ matchup: `${teams[6].name} vs. ${teams[7].name}`, winner: seventhSeed.name, loser: game2Loser.name });
        const game3 = this.simulateSeries(game1Winner, game2Loser, true);
        const eighthSeed = game3.winner;
        playInGames.push({ matchup: `${game1Winner.name} vs. ${game2Loser.name}`, winner: eighthSeed.name, loser: game3.winner === game1Winner ? game2Loser.name : game1Winner.name });
        return { seventhSeed, eighthSeed, games: playInGames };
    }
    async runMultipleSimulations(count = 1000) {
        const championshipCount = {};
        const allTeams = await this.fetchTeamData();
        allTeams.forEach(team => (championshipCount[team.name] = 0));
        for (let i = 0; i < count; i++) {
            const results = await this.simulatePlayoffs();
            if (results.Finals?.winner) {
                championshipCount[results.Finals.winner.name]++;
            }
        }
        const probabilities = Object.entries(championshipCount)
            .map(([team, wins]) => ({ team, probability: (wins / count) * 100 }))
            .sort((a, b) => b.probability - a.probability);
        this.logger.log(`Completed ${count} playoff simulations. Top team: ${probabilities[0].team} (${probabilities[0].probability.toFixed(2)}%)`);
        return probabilities;
    }
};
exports.TeamsService = TeamsService;
exports.TeamsService = TeamsService = TeamsService_1 = __decorate([
    (0, common_1.Injectable)()
], TeamsService);
//# sourceMappingURL=teams.service.js.map