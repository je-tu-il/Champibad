import { Player, Match, HandicapEvaluation, HandicapType } from '../types';

export class HandicapService {
  /**
   * Algorithme ultra intelligent de calibrage de handicap
   * Prise en compte :
   * 1. Écart d'Elo brut
   * 2. Nombre de parties jouées (expérience & calibration du niveau)
   * 3. Historique direct des confrontations (Head-to-Head)
   * 4. Historique des malus antérieurs et de leur efficacité
   * 5. Répartition intelligente (malus favori + bonus challenger)
   * 6. Désignation algorithmique du premier serveur
   */
  static evaluateIntelligentHandicap(
    p1: Player,
    p2: Player,
    allMatches: Match[] = []
  ): HandicapEvaluation {
    const elo1 = p1.eloSolo;
    const elo2 = p2.eloSolo;
    const eloDiff = elo1 - elo2;
    const absGap = Math.abs(eloDiff);
    const p1IsFavori = eloDiff >= 0;

    const favori = p1IsFavori ? p1 : p2;
    const challenger = p1IsFavori ? p2 : p1;

    // 1. Point de départ théorique basé sur la courbe logistique de Badminton
    let baseSpread = 0;
    if (absGap >= 80 && absGap < 150) {
      baseSpread = 3;
    } else if (absGap >= 150 && absGap < 240) {
      baseSpread = 5;
    } else if (absGap >= 240 && absGap < 340) {
      baseSpread = 8;
    } else if (absGap >= 340 && absGap < 450) {
      baseSpread = 11;
    } else if (absGap >= 450) {
      baseSpread = 13;
    }

    // 2. Facteur de confiance & nombre de matchs joués
    const p1Matches = p1.matchesPlayed || 0;
    const p2Matches = p2.matchesPlayed || 0;
    let confidenceFactor = 1.0;

    if (p1Matches < 5 || p2Matches < 5) {
      // Elo volatile / non stabilisé -> amortir l'écart de 25% pour éviter les injustices
      confidenceFactor = 0.75;
      baseSpread = Math.max(0, Math.round(baseSpread * confidenceFactor));
    } else if (p1Matches >= 15 && p2Matches >= 15) {
      confidenceFactor = 1.0;
    }

    // 3. Analyse des confrontations directes antérieures (Head-to-Head)
    const directMatches = allMatches.filter(
      (m) =>
        m.status === 'VALIDATED' &&
        ((m.player1Id === p1.id && m.player2Id === p2.id) ||
          (m.player1Id === p2.id && m.player2Id === p1.id))
    );

    let favoriH2HWins = 0;
    let challengerH2HWins = 0;
    let threeSetH2HCount = 0;

    directMatches.forEach((m) => {
      if (m.winnerId === favori.id) favoriH2HWins++;
      else if (m.winnerId === challenger.id) challengerH2HWins++;
      if (m.sets && m.sets.length === 3) threeSetH2HCount++;
    });

    let h2hAdjustment = 0;
    if (directMatches.length >= 2) {
      // Si le favori domine outrageusement (au moins 2 victoires de plus et 0 défaite)
      if (favoriH2HWins >= 2 && challengerH2HWins === 0) {
        h2hAdjustment += 1;
      }
      // Si le challenger a déjà gagné ou si les matchs sont des batailles en 3 sets
      if (challengerH2HWins >= 1 || threeSetH2HCount >= 2) {
        h2hAdjustment -= 1;
      }
    }

    // 4. Analyse des malus antérieurs du favori
    const pastHandicapMatches = allMatches.filter(
      (m) =>
        m.status === 'VALIDATED' &&
        (m.player1Id === favori.id || m.player2Id === favori.id) &&
        m.handicapApplied !== 'NONE'
    );

    let pastMalusWinRate = 0.5;
    if (pastHandicapMatches.length >= 3) {
      const winsUnderHandicap = pastHandicapMatches.filter((m) => m.winnerId === favori.id).length;
      pastMalusWinRate = winsUnderHandicap / pastHandicapMatches.length;

      // Si le favori écrase toujours tout le monde malgré le handicap (> 75% de victoires)
      if (pastMalusWinRate > 0.75) {
        h2hAdjustment += 1;
      } else if (pastMalusWinRate < 0.3) {
        h2hAdjustment -= 1;
      }
    }

    // Calcul du différentiel total final (plafonné entre 0 et 14 points)
    const totalPointDiff = Math.max(0, Math.min(14, baseSpread + h2hAdjustment));
    const hasHandicap = totalPointDiff > 0;

    // 5. Répartition équilibrée (compromis psychologique entre malus et bonus)
    // Au lieu de -10 tout d'un coup, on scinde : favori à -X et challenger à +Y
    let favoriMalus = 0;
    let challengerBonus = 0;

    if (hasHandicap) {
      favoriMalus = -Math.floor(totalPointDiff / 2);
      challengerBonus = Math.ceil(totalPointDiff / 2);
    }

    const player1Points = p1IsFavori ? favoriMalus : challengerBonus;
    const player2Points = p1IsFavori ? challengerBonus : favoriMalus;

    // 6. Choix du premier serveur par l'algorithme
    let firstServerId: string;
    let firstServerName: string;

    if (hasHandicap) {
      // En cas de handicap, l'algorithme attribue le 1er service au challenger pour lui donner l'initiative du point !
      firstServerId = challenger.id;
      firstServerName = challenger.firstName;
    } else {
      // Sans handicap : donner le premier service à celui qui a perdu la dernière confrontation ou alterner
      if (directMatches.length > 0 && directMatches[0].winnerId) {
        const lastLoserId = directMatches[0].winnerId === p1.id ? p2.id : p1.id;
        firstServerId = lastLoserId;
        firstServerName = lastLoserId === p1.id ? p1.firstName : p2.firstName;
      } else {
        // Aléatoire équitable
        firstServerId = p1.id;
        firstServerName = p1.firstName;
      }
    }

    // Résumés textuels
    let summary = 'Match équilibré (sans handicap)';
    let details = `Écart de ${absGap} Elo. Les deux joueurs partent à 0-0. Premier service : ${firstServerName}.`;

    if (hasHandicap) {
      const p1Str = player1Points !== 0 ? `${p1.firstName} (${player1Points > 0 ? `+${player1Points}` : player1Points} pts)` : `${p1.firstName} (0 pt)`;
      const p2Str = player2Points !== 0 ? `${p2.firstName} (${player2Points > 0 ? `+${player2Points}` : player2Points} pts)` : `${p2.firstName} (0 pt)`;
      
      summary = `Handicap ${totalPointDiff} pts : ${p1Str} vs ${p2Str}`;
      
      const h2hText = directMatches.length > 0
        ? `Historique : ${favoriH2HWins} victoires ${favori.firstName} vs ${challengerH2HWins} victoires ${challenger.firstName}.`
        : `Première confrontation directe.`;

      const expText = confidenceFactor < 1.0
        ? `Ajustement de prudence : ${p1Matches < 5 ? p1.firstName : p2.firstName} a moins de 5 matchs enregistrés.`
        : `Classements fiables (${p1Matches} et ${p2Matches} matchs).`;

      details = `Écart de niveau (${absGap} Elo). Pour équilibrer le match, ${favori.firstName} part à ${favoriMalus} pts et ${challenger.firstName} part à +${challengerBonus} pts. ${expText} ${h2hText} Premier service attribué à ${firstServerName}.`;
    }

    const headToHeadSummary = directMatches.length > 0
      ? `${directMatches.length} match(s) joué(s) : ${favori.firstName} (${favoriH2HWins}V) - ${challenger.firstName} (${challengerH2HWins}V)`
      : 'Aucun match direct précédent';

    return {
      hasHandicap,
      handicapType: hasHandicap ? 'POINTS_PENALTY' : 'NONE',
      player1Points,
      player2Points,
      firstServerId,
      firstServerName,
      summary,
      details,
      confidenceFactor,
      headToHeadSummary,
    };
  }
}
