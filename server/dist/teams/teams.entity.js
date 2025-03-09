"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Team = void 0;
class Team {
    name;
    offensiveRating;
    defensiveRating;
    threePointAttempts;
    conference;
    winPercentage;
    championshipScore;
    weightedRating;
    constructor(name, offensiveRating, defensiveRating, threePointAttempts, conference, winPercentage = 0, championshipScore = 0, weightedRating = 0) {
        this.name = name;
        this.offensiveRating = offensiveRating;
        this.defensiveRating = defensiveRating;
        this.threePointAttempts = threePointAttempts;
        this.conference = conference;
        this.winPercentage = winPercentage;
        this.championshipScore = championshipScore;
        this.weightedRating = weightedRating;
    }
}
exports.Team = Team;
//# sourceMappingURL=teams.entity.js.map