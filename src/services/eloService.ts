import { HandicapType } from '../types';

export interface EloCalculationResult {
  newEloPlayer1: number;
  newEloPlayer2: number;
  deltaPlayer1: number;
  deltaPlayer2: number;
}

export class EloService {
  /**
   * Facteur K dynamique : récompense encore plus la victoire contre un joueur plus fort
   */
  private static getDynamicK(playerElo: number, opponentElo: number, isWinner: boolean): number {
    const gap = opponentElo - playerElo;
    // Si on bat quelqu'un de bien plus fort (> 200 points d'Elo), K est augmenté
    if (isWinner && gap > 200) {
      return 40;
    }
    // Si on a moins de 1300 Elo (joueur débutant), K est plus élevé pour accélérer la progression
    if (playerElo < 1300) {
      return 36;
    }
    return 32;
  }

  /**
   * Calcule le gain / perte d'Elo pour un match 1 contre 1
   */
  static calculateSoloElo(
    elo1: number,
    elo2: number,
    player1Won: boolean
  ): EloCalculationResult {
    // Probabilité attendue
    const expected1 = 1 / (1 + Math.pow(10, (elo2 - elo1) / 400));
    const expected2 = 1 - expected1;

    const actual1 = player1Won ? 1 : 0;
    const actual2 = player1Won ? 0 : 1;

    const k1 = this.getDynamicK(elo1, elo2, player1Won);
    const k2 = this.getDynamicK(elo2, elo1, !player1Won);

    const delta1 = Math.round(k1 * (actual1 - expected1));
    const delta2 = Math.round(k2 * (actual2 - expected2));

    return {
      newEloPlayer1: Math.max(800, elo1 + delta1),
      newEloPlayer2: Math.max(800, elo2 + delta2),
      deltaPlayer1: delta1,
      deltaPlayer2: delta2,
    };
  }

  /**
   * Calcule l'Elo pour un match en double (2v2)
   */
  static calculateDoubleElo(
    team1EloAvg: number,
    team2EloAvg: number,
    team1Won: boolean
  ): { deltaTeam1: number; deltaTeam2: number } {
    const expected1 = 1 / (1 + Math.pow(10, (team2EloAvg - team1EloAvg) / 400));
    const expected2 = 1 - expected1;

    const actual1 = team1Won ? 1 : 0;
    const actual2 = team1Won ? 0 : 1;

    const k = 32;
    const delta1 = Math.round(k * (actual1 - expected1));
    const delta2 = Math.round(k * (actual2 - expected2));

    return {
      deltaTeam1: delta1,
      deltaTeam2: delta2,
    };
  }

  /**
   * Vérifie si un handicap doit être proposé ou appliqué en fonction de l'écart d'Elo
   */
  static evaluateHandicap(
    elo1: number,
    elo2: number,
    maxGapThreshold: number = 300,
    preferredMode: HandicapType = 'POINTS_PENALTY'
  ): {
    requiresHandicap: boolean;
    gap: number;
    favoredPlayer: 1 | 2;
    suggestedHandicap: HandicapType;
    details: string;
  } {
    const gap = Math.abs(elo1 - elo2);
    const requiresHandicap = gap >= maxGapThreshold;
    const favoredPlayer = elo1 > elo2 ? 1 : 2;

    if (!requiresHandicap) {
      return {
        requiresHandicap: false,
        gap,
        favoredPlayer,
        suggestedHandicap: 'NONE',
        details: `Écart équilibré (${gap} Elo). Match standard.`,
      };
    }

    if (preferredMode === 'COURT_RESTRICTION') {
      return {
        requiresHandicap: true,
        gap,
        favoredPlayer,
        suggestedHandicap: 'COURT_RESTRICTION',
        details: `Grand écart (${gap} Elo) : Le favori joue "Sans les couloirs" pour rééquilibrer les échanges.`,
      };
    }

    // Par défaut : Handicap de points (-10 points pour le favori)
    return {
      requiresHandicap: true,
      gap,
      favoredPlayer,
      suggestedHandicap: 'POINTS_PENALTY',
      details: `Grand écart (${gap} Elo) : Pénalité de 10 points pour le joueur le plus fort (départ à -10 ou challenger à +10).`,
    };
  }
}
