import AsyncStorage from '@react-native-async-storage/async-storage';
import { Match, MatchSet, MatchStatus, Player } from '../types';
import { EloService } from './eloService';

const MATCHES_STORAGE_KEY = '@champibad_matches';

export class MatchService {
  /**
   * Récupère tous les matchs
   */
  static async getMatches(): Promise<Match[]> {
    const data = await AsyncStorage.getItem(MATCHES_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  /**
   * Récupère les matchs d'un joueur
   */
  static async getMatchesForPlayer(userId: string): Promise<Match[]> {
    const matches = await this.getMatches();
    return matches.filter(
      (m) =>
        m.player1Id === userId ||
        m.player2Id === userId ||
        m.team1PlayerIds?.includes(userId) ||
        m.team2PlayerIds?.includes(userId)
    );
  }

  /**
   * Crée un nouveau défi / match proposé
   */
  static async createChallenge(matchData: Omit<Match, 'id' | 'createdAt' | 'status'>): Promise<Match> {
    const matches = await this.getMatches();
    const newMatch: Match = {
      ...matchData,
      id: `match_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      createdAt: Date.now(),
      status: 'PROPOSED',
    };

    matches.unshift(newMatch);
    await AsyncStorage.setItem(MATCHES_STORAGE_KEY, JSON.stringify(matches));
    return newMatch;
  }

  /**
   * Accepte un défi proposé
   */
  static async acceptChallenge(matchId: string): Promise<Match> {
    const matches = await this.getMatches();
    const index = matches.findIndex((m) => m.id === matchId);
    if (index === -1) throw new Error('Match non trouvé');

    matches[index].status = 'ACCEPTED';
    await AsyncStorage.setItem(MATCHES_STORAGE_KEY, JSON.stringify(matches));
    return matches[index];
  }

  /**
   * Refuse un défi proposé
   */
  static async declineChallenge(matchId: string): Promise<Match> {
    const matches = await this.getMatches();
    const index = matches.findIndex((m) => m.id === matchId);
    if (index === -1) throw new Error('Match non trouvé');

    matches[index].status = 'DECLINED';
    await AsyncStorage.setItem(MATCHES_STORAGE_KEY, JSON.stringify(matches));
    return matches[index];
  }

  /**
   * Annule un défi
   */
  static async cancelChallenge(matchId: string): Promise<Match> {
    const matches = await this.getMatches();
    const index = matches.findIndex((m) => m.id === matchId);
    if (index === -1) throw new Error('Match non trouvé');

    matches[index].status = 'CANCELLED';
    await AsyncStorage.setItem(MATCHES_STORAGE_KEY, JSON.stringify(matches));
    return matches[index];
  }

  /**
   * Soumission du score des sets par un joueur -> Passe en PENDING_VALIDATION
   */
  static async submitScore(
    matchId: string,
    sets: MatchSet[],
    submittedBy: string
  ): Promise<Match> {
    const matches = await this.getMatches();
    const index = matches.findIndex((m) => m.id === matchId);
    if (index === -1) throw new Error('Match non trouvé');

    const match = matches[index];

    // Calcul du vainqueur basé sur les sets
    let p1SetsWon = 0;
    let p2SetsWon = 0;
    sets.forEach((s) => {
      if (s.player1Score > s.player2Score) p1SetsWon++;
      else if (s.player2Score > s.player1Score) p2SetsWon++;
    });

    const winnerId = p1SetsWon > p2SetsWon ? match.player1Id : match.player2Id;

    match.sets = sets;
    match.winnerId = winnerId;
    match.submittedBy = submittedBy;
    match.status = 'PENDING_VALIDATION';

    matches[index] = match;
    await AsyncStorage.setItem(MATCHES_STORAGE_KEY, JSON.stringify(matches));
    return match;
  }

  /**
   * Validation définitive du score par l'adversaire -> Calcul et mise à jour immédiate de l'Elo
   */
  static async validateScore(
    matchId: string,
    player1: Player,
    player2: Player
  ): Promise<{ match: Match; updatedP1: Player; updatedP2: Player }> {
    const matches = await this.getMatches();
    const index = matches.findIndex((m) => m.id === matchId);
    if (index === -1) throw new Error('Match non trouvé');

    const match = matches[index];
    const player1Won = match.winnerId === player1.id;

    // Calcul de l'Elo Solo
    const eloResult = EloService.calculateSoloElo(
      player1.eloSolo,
      player2.eloSolo,
      player1Won
    );

    match.eloBeforePlayer1 = player1.eloSolo;
    match.eloBeforePlayer2 = player2.eloSolo;
    match.eloDeltaPlayer1 = eloResult.deltaPlayer1;
    match.eloDeltaPlayer2 = eloResult.deltaPlayer2;
    match.status = 'VALIDATED';
    match.validatedAt = Date.now();

    const isThreeSets = match.sets.length === 3;

    // Mise à jour des joueurs
    const updatedP1: Player = {
      ...player1,
      eloSolo: eloResult.newEloPlayer1,
      highestEloSolo: Math.max(player1.highestEloSolo || 1200, eloResult.newEloPlayer1),
      matchesPlayed: player1.matchesPlayed + 1,
      matchesWon: player1Won ? player1.matchesWon + 1 : player1.matchesWon,
      matchesLost: !player1Won ? player1.matchesLost + 1 : player1.matchesLost,
      threeSetMatches: isThreeSets ? player1.threeSetMatches + 1 : player1.threeSetMatches,
      currentStreak: player1Won ? (player1.currentStreak > 0 ? player1.currentStreak + 1 : 1) : 0,
    };

    const updatedP2: Player = {
      ...player2,
      eloSolo: eloResult.newEloPlayer2,
      highestEloSolo: Math.max(player2.highestEloSolo || 1200, eloResult.newEloPlayer2),
      matchesPlayed: player2.matchesPlayed + 1,
      matchesWon: !player1Won ? player2.matchesWon + 1 : player2.matchesWon,
      matchesLost: player1Won ? player2.matchesLost + 1 : player2.matchesLost,
      threeSetMatches: isThreeSets ? player2.threeSetMatches + 1 : player2.threeSetMatches,
      currentStreak: !player1Won ? (player2.currentStreak > 0 ? player2.currentStreak + 1 : 1) : 0,
    };

    matches[index] = match;
    await AsyncStorage.setItem(MATCHES_STORAGE_KEY, JSON.stringify(matches));

    return { match, updatedP1, updatedP2 };
  }

  /**
   * Contestation du score par l'adversaire
   */
  static async contestScore(matchId: string): Promise<Match> {
    const matches = await this.getMatches();
    const index = matches.findIndex((m) => m.id === matchId);
    if (index === -1) throw new Error('Match non trouvé');

    matches[index].status = 'CONTESTED';
    await AsyncStorage.setItem(MATCHES_STORAGE_KEY, JSON.stringify(matches));
    return matches[index];
  }
}
