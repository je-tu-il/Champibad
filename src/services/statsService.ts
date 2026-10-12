import AsyncStorage from '@react-native-async-storage/async-storage';
import { DailySnapshot, Player } from '../types';
import { AuthService } from './authService';

const DAILY_SNAPSHOT_KEY = '@champibad_daily_snapshot';

export class StatsService {
  /**
   * Génère ou récupère le snapshot quotidien pour afficher le classement ultra-rapide
   */
  static async getDailySnapshot(): Promise<DailySnapshot> {
    const todayStr = new Date().toISOString().split('T')[0];
    const data = await AsyncStorage.getItem(DAILY_SNAPSHOT_KEY);

    if (data) {
      const snapshot: DailySnapshot = JSON.parse(data);
      if (snapshot.date === todayStr) {
        return snapshot;
      }
    }

    // Génération du snapshot du jour
    const players = await AuthService.getAllPlayers();

    const sortedSolo = [...players].sort((a, b) => b.eloSolo - a.eloSolo);
    const leaderboardSolo = sortedSolo.map((p, index) => {
      const currentRank = index + 1;
      const prevRank = p.rankSolo || currentRank;
      return {
        userId: p.id,
        name: `${p.firstName} ${p.lastName}`,
        elo: p.eloSolo,
        rank: currentRank,
        rankDelta: prevRank - currentRank, // Positif si on monte au classement
      };
    });

    const sortedDouble = [...players].sort((a, b) => b.eloDouble - a.eloDouble);
    const leaderboardDouble = sortedDouble.map((p, index) => {
      const currentRank = index + 1;
      const prevRank = p.rankDouble || currentRank;
      return {
        userId: p.id,
        name: `${p.firstName} ${p.lastName}`,
        elo: p.eloDouble,
        rank: currentRank,
        rankDelta: prevRank - currentRank,
      };
    });

    const newSnapshot: DailySnapshot = {
      date: todayStr,
      leaderboardSolo,
      leaderboardDouble,
    };

    await AsyncStorage.setItem(DAILY_SNAPSHOT_KEY, JSON.stringify(newSnapshot));
    return newSnapshot;
  }

  /**
   * Attribue dynamiquement les badges aux joueurs
   */
  static evaluateBadges(player: Player): string[] {
    const badges: string[] = [];

    // Le plus bosseur : volume de matchs
    if (player.matchesPlayed >= 15) {
      badges.push('BOSSEUR');
    }

    // Le plus persévérant : batailles intenses en 3 sets
    if (player.threeSetMatches >= 5) {
      badges.push('PERSEVERANT');
    }

    // La plus grande remontée
    if (player.previousDayEloSolo && player.eloSolo - player.previousDayEloSolo >= 25) {
      badges.push('REMONTEE');
    }

    // Le Champion (N°1)
    if (player.rankSolo === 1) {
      badges.push('CHAMPION');
    }

    return badges;
  }
}
