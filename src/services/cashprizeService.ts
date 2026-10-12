import AsyncStorage from '@react-native-async-storage/async-storage';
import { AdminSettings, Player } from '../types';
import { DEFAULT_ADMIN_SETTINGS, ADMOB_CONFIG } from '../config/constants';

const ADMIN_SETTINGS_KEY = '@champibad_admin_settings';

export interface PrizeBreakdown {
  totalPot: number;
  paidParticipantsCount: number;
  entryFee: number;
  adFundTotal: number;
  prizes: {
    category: string;
    title: string;
    description: string;
    percentage: number;
    amount: number;
    currentLeader?: {
      id: string;
      name: string;
      statValue: string;
    };
  }[];
}

export class CashprizeService {
  /**
   * Récupère les paramètres de l'admin
   */
  static async getSettings(): Promise<AdminSettings> {
    const data = await AsyncStorage.getItem(ADMIN_SETTINGS_KEY);
    if (!data) {
      await AsyncStorage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify(DEFAULT_ADMIN_SETTINGS));
      return DEFAULT_ADMIN_SETTINGS;
    }
    return JSON.parse(data);
  }

  /**
   * Met à jour les paramètres de l'admin
   */
  static async saveSettings(settings: AdminSettings): Promise<void> {
    await AsyncStorage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify(settings));
  }

  /**
   * Enregistre un visionnage d'une publicité Google Ads de 5 secondes et finance la cagnotte
   */
  static async recordAdView(): Promise<{ newAdFund: number; addedAmount: number }> {
    const settings = await this.getSettings();
    const addedAmount = ADMOB_CONFIG.adRewardEuroValue;
    const newAdFund = parseFloat((settings.adFundContribution + addedAmount).toFixed(2));

    settings.adFundContribution = newAdFund;
    await this.saveSettings(settings);

    return {
      newAdFund,
      addedAmount,
    };
  }

  /**
   * Calcule le montant total de la cagnotte et la répartition des prix
   */
  static calculatePrizes(
    players: Player[],
    settings: AdminSettings
  ): PrizeBreakdown {
    const paidPlayers = players.filter((p) => p.cashprizePaid);
    const paidCount = paidPlayers.length;
    const registrationPot = paidCount * settings.cashprizeEntryFee;
    const totalPot = parseFloat((registrationPot + settings.adFundContribution).toFixed(2));

    // Détermination des leaders des catégories
    // 1. Le Plus Fort (Plus haut Elo Solo)
    const strongest = [...players].sort((a, b) => b.eloSolo - a.eloSolo)[0];

    // 2. Le Plus Assidu (Plus grand nombre de matchs joués)
    const mostDiligent = [...players].sort((a, b) => b.matchesPlayed - a.matchesPlayed)[0];

    // 3. Le Plus Résilient (Plus grand nombre de matchs en 3 sets disputés)
    const mostResilient = [...players].sort((a, b) => b.threeSetMatches - a.threeSetMatches)[0];

    const dist = settings.prizeDistribution;
    const strongestAmount = parseFloat(((totalPot * dist.strongestPercent) / 100).toFixed(2));
    const diligentAmount = parseFloat(((totalPot * dist.mostDiligentPercent) / 100).toFixed(2));
    const resilientAmount = parseFloat(((totalPot * dist.mostResilientPercent) / 100).toFixed(2));

    return {
      totalPot,
      paidParticipantsCount: paidCount,
      entryFee: settings.cashprizeEntryFee,
      adFundTotal: settings.adFundContribution,
      prizes: [
        {
          category: 'STRONGEST',
          title: '👑 Le Plus Fort',
          description: 'N°1 du classement Elo à la clôture de la saison',
          percentage: dist.strongestPercent,
          amount: strongestAmount,
          currentLeader: strongest
            ? {
                id: strongest.id,
                name: `${strongest.firstName} ${strongest.lastName}`,
                statValue: `${strongest.eloSolo} Elo`,
              }
            : undefined,
        },
        {
          category: 'DILIGENT',
          title: '🔥 Le Plus Assidu',
          description: 'Le compétiteur ayant disputé le plus grand nombre de matchs',
          percentage: dist.mostDiligentPercent,
          amount: diligentAmount,
          currentLeader: mostDiligent
            ? {
                id: mostDiligent.id,
                name: `${mostDiligent.firstName} ${mostDiligent.lastName}`,
                statValue: `${mostDiligent.matchesPlayed} matchs joués`,
              }
            : undefined,
        },
        {
          category: 'RESILIENT',
          title: '🛡️ Le Plus Résilient',
          description: 'Le roi des batailles en 3 sets et des remontées héroïques',
          percentage: dist.mostResilientPercent,
          amount: resilientAmount,
          currentLeader: mostResilient
            ? {
                id: mostResilient.id,
                name: `${mostResilient.firstName} ${mostResilient.lastName}`,
                statValue: `${mostResilient.threeSetMatches} matchs en 3 sets`,
              }
            : undefined,
        },
      ],
    };
  }
}
