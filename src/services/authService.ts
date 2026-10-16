import AsyncStorage from '@react-native-async-storage/async-storage';
import { Player } from '../types';
import { SUPER_ADMIN_EMAIL } from '../config/constants';
import { LicenseService, MOCK_CHAMPIBAD_LICENSEES } from './licenseService';

const CURRENT_USER_KEY = '@champibad_current_user';
const PLAYERS_KEY = '@champibad_players_db';

export const INITIAL_PLAYERS: Player[] = [
  {
    id: 'user_aurelien_admin',
    licenseNumber: '07123456',
    firstName: 'Aurélien',
    lastName: 'Reymond',
    email: SUPER_ADMIN_EMAIL,
    role: 'ADMIN',
    eloSolo: 1485,
    eloDouble: 1420,
    previousDayEloSolo: 1460,
    previousDayEloDouble: 1420,
    rankSolo: 1,
    rankDouble: 2,
    matchesPlayed: 18,
    matchesWon: 14,
    matchesLost: 4,
    threeSetMatches: 6,
    currentStreak: 4,
    highestEloSolo: 1495,
    badges: ['BOSSEUR', 'CHAMPION'],
    cashprizeEnrolled: true,
    cashprizePaid: true,
    friends: ['user_thomas', 'user_camille'],
    blockedUsers: [],
    createdAt: Date.now() - 30 * 86400000,
    lastActiveAt: Date.now(),
  },
  {
    id: 'user_thomas',
    licenseNumber: '07234567',
    firstName: 'Thomas',
    lastName: 'Dubois',
    email: 'thomas.dubois@badminton-champigneulles.fr',
    role: 'PLAYER',
    eloSolo: 1420,
    eloDouble: 1450,
    previousDayEloSolo: 1435,
    previousDayEloDouble: 1440,
    rankSolo: 2,
    rankDouble: 1,
    matchesPlayed: 24,
    matchesWon: 16,
    matchesLost: 8,
    threeSetMatches: 9, // Grand prétendant à "Plus Résilient"
    currentStreak: 2,
    highestEloSolo: 1440,
    badges: ['BOSSEUR', 'PERSEVERANT'],
    cashprizeEnrolled: true,
    cashprizePaid: true,
    friends: ['user_aurelien_admin'],
    blockedUsers: [],
    createdAt: Date.now() - 28 * 86400000,
    lastActiveAt: Date.now(),
  },
  {
    id: 'user_camille',
    licenseNumber: '07345678',
    firstName: 'Camille',
    lastName: 'Laurent',
    email: 'camille.laurent@gmail.com',
    role: 'PLAYER',
    eloSolo: 1340,
    eloDouble: 1310,
    previousDayEloSolo: 1315,
    previousDayEloDouble: 1300,
    rankSolo: 3,
    rankDouble: 3,
    matchesPlayed: 15,
    matchesWon: 10,
    matchesLost: 5,
    threeSetMatches: 5,
    currentStreak: 3,
    highestEloSolo: 1350,
    badges: ['REMONTEE'],
    cashprizeEnrolled: true,
    cashprizePaid: true,
    friends: ['user_aurelien_admin'],
    blockedUsers: [],
    createdAt: Date.now() - 25 * 86400000,
    lastActiveAt: Date.now(),
  },
  {
    id: 'user_julien',
    licenseNumber: '07456789',
    firstName: 'Julien',
    lastName: 'Moreau',
    email: 'j.moreau@orange.fr',
    role: 'PLAYER',
    eloSolo: 1220,
    eloDouble: 1240,
    previousDayEloSolo: 1240,
    previousDayEloDouble: 1230,
    rankSolo: 4,
    rankDouble: 4,
    matchesPlayed: 12,
    matchesWon: 5,
    matchesLost: 7,
    threeSetMatches: 4,
    currentStreak: 0,
    highestEloSolo: 1260,
    badges: [],
    cashprizeEnrolled: true,
    cashprizePaid: false, // En attente de paiement physique par l'admin
    friends: [],
    blockedUsers: [],
    createdAt: Date.now() - 20 * 86400000,
    lastActiveAt: Date.now(),
  },
  {
    id: 'user_sarah',
    licenseNumber: '07567890',
    firstName: 'Sarah',
    lastName: 'Bernard',
    email: 'sarah.b@free.fr',
    role: 'PLAYER',
    eloSolo: 1150,
    eloDouble: 1180,
    previousDayEloSolo: 1150,
    previousDayEloDouble: 1180,
    rankSolo: 5,
    rankDouble: 5,
    matchesPlayed: 9,
    matchesWon: 4,
    matchesLost: 5,
    threeSetMatches: 3,
    currentStreak: 1,
    highestEloSolo: 1170,
    badges: [],
    cashprizeEnrolled: false,
    cashprizePaid: false,
    friends: [],
    blockedUsers: [],
    createdAt: Date.now() - 15 * 86400000,
    lastActiveAt: Date.now(),
  },
];

export class AuthService {
  /**
   * Récupère tous les joueurs enregistrés
   */
  static async getAllPlayers(): Promise<Player[]> {
    const data = await AsyncStorage.getItem(PLAYERS_KEY);
    if (!data) {
      await AsyncStorage.setItem(PLAYERS_KEY, JSON.stringify(INITIAL_PLAYERS));
      return INITIAL_PLAYERS;
    }
    return JSON.parse(data);
  }

  /**
   * Sauvegarde la liste des joueurs
   */
  static async saveAllPlayers(players: Player[]): Promise<void> {
    await AsyncStorage.setItem(PLAYERS_KEY, JSON.stringify(players));
  }

  /**
   * Récupère le joueur actuellement connecté
   */
  static async getCurrentUser(): Promise<Player | null> {
    const data = await AsyncStorage.getItem(CURRENT_USER_KEY);
    if (!data) return null;
    return JSON.parse(data);
  }

  /**
   * Enregistre le joueur actuellement connecté
   */
  static async setCurrentUser(player: Player | null): Promise<void> {
    if (!player) {
      await AsyncStorage.removeItem(CURRENT_USER_KEY);
    } else {
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(player));
    }
  }

  /**
   * Onboarding : Vérifie Nom, Prénom et Numéro de licence
   */
  static async registerOrLogin(
    firstName: string,
    lastName: string,
    licenseNumber: string,
    email: string
  ): Promise<Player> {
    // 1. Vérification dans la base des licenciés du club
    const licensee = await LicenseService.verifyLicensee(licenseNumber, firstName, lastName);
    if (!licensee) {
      throw new Error(
        `Licencié introuvable dans le club Champibad pour : ${firstName} ${lastName} (N° ${licenseNumber}). Contactez le responsable du club.`
      );
    }

    const players = await this.getAllPlayers();
    let player = players.find((p) => p.licenseNumber === licenseNumber);

    const isAdmin =
      email.toLowerCase().trim() === SUPER_ADMIN_EMAIL.toLowerCase().trim() ||
      licenseNumber === '07123456';

    if (player) {
      // Mise à jour de l'email si nécessaire
      player.email = email;
      player.role = isAdmin ? 'ADMIN' : player.role;
      player.lastActiveAt = Date.now();
    } else {
      // Création du compte joueur
      player = {
        id: `user_${Date.now()}`,
        licenseNumber,
        firstName: licensee.firstName,
        lastName: licensee.lastName,
        email,
        role: isAdmin ? 'ADMIN' : 'PLAYER',
        eloSolo: 1200,
        eloDouble: 1200,
        matchesPlayed: 0,
        matchesWon: 0,
        matchesLost: 0,
        threeSetMatches: 0,
        currentStreak: 0,
        highestEloSolo: 1200,
        badges: [],
        cashprizeEnrolled: false,
        cashprizePaid: false,
        friends: [],
        blockedUsers: [],
        createdAt: Date.now(),
        lastActiveAt: Date.now(),
      };
      players.push(player);
    }

    await this.saveAllPlayers(players);
    await this.setCurrentUser(player);
    return player;
  }

  /**
   * Met à jour le profil d'un joueur
   */
  static async updatePlayer(updated: Player): Promise<void> {
    const players = await this.getAllPlayers();
    const index = players.findIndex((p) => p.id === updated.id);
    if (index !== -1) {
      players[index] = updated;
      await this.saveAllPlayers(players);
      const current = await this.getCurrentUser();
      if (current?.id === updated.id) {
        await this.setCurrentUser(updated);
      }
    }
  }

  /**
   * Ajoute directement un nouveau joueur (par l'administrateur)
   */
  static async addPlayerDirectly(player: Player): Promise<Player[]> {
    const players = await this.getAllPlayers();
    const updated = [player, ...players.filter((p) => p.licenseNumber !== player.licenseNumber)];
    await this.saveAllPlayers(updated);
    return updated;
  }

  /**
   * Supprime un joueur de la base de données
   */
  static async deletePlayer(playerId: string): Promise<Player[]> {
    const players = await this.getAllPlayers();
    const updated = players.filter((p) => p.id !== playerId);
    await this.saveAllPlayers(updated);
    return updated;
  }

  /**
   * Ajuste manuellement l'Elo d'un joueur (par l'admin)
   */
  static async adjustElo(playerId: string, newElo: number): Promise<Player[]> {
    const players = await this.getAllPlayers();
    const index = players.findIndex((p) => p.id === playerId);
    if (index !== -1) {
      players[index].eloSolo = newElo;
      players[index].highestEloSolo = Math.max(players[index].highestEloSolo || 1200, newElo);
      await this.saveAllPlayers(players);
      const current = await this.getCurrentUser();
      if (current?.id === playerId) {
        await this.setCurrentUser(players[index]);
      }
    }
    return players;
  }

  /**
   * Suspend le compte d'un joueur pour X jours avec un motif
   */
  static async suspendPlayer(playerId: string, days: number, reason: string): Promise<Player[]> {
    const players = await this.getAllPlayers();
    const index = players.findIndex((p) => p.id === playerId);
    if (index !== -1) {
      players[index].suspendedUntil = Date.now() + days * 24 * 60 * 60 * 1000;
      players[index].suspensionReason = reason;
      await this.saveAllPlayers(players);
      const current = await this.getCurrentUser();
      if (current?.id === playerId) {
        await this.setCurrentUser(players[index]);
      }
    }
    return players;
  }

  /**
   * Lève la suspension du compte
   */
  static async unsuspendPlayer(playerId: string): Promise<Player[]> {
    const players = await this.getAllPlayers();
    const index = players.findIndex((p) => p.id === playerId);
    if (index !== -1) {
      delete players[index].suspendedUntil;
      delete players[index].suspensionReason;
      await this.saveAllPlayers(players);
      const current = await this.getCurrentUser();
      if (current?.id === playerId) {
        await this.setCurrentUser(players[index]);
      }
    }
    return players;
  }

  /**
   * Bloque l'accès au chat global pour X jours
   */
  static async banPlayerFromChat(playerId: string, days: number): Promise<Player[]> {
    const players = await this.getAllPlayers();
    const index = players.findIndex((p) => p.id === playerId);
    if (index !== -1) {
      players[index].chatBannedUntil = Date.now() + days * 24 * 60 * 60 * 1000;
      await this.saveAllPlayers(players);
      const current = await this.getCurrentUser();
      if (current?.id === playerId) {
        await this.setCurrentUser(players[index]);
      }
    }
    return players;
  }

  /**
   * Lève le blocage du chat global
   */
  static async unbanPlayerFromChat(playerId: string): Promise<Player[]> {
    const players = await this.getAllPlayers();
    const index = players.findIndex((p) => p.id === playerId);
    if (index !== -1) {
      delete players[index].chatBannedUntil;
      await this.saveAllPlayers(players);
      const current = await this.getCurrentUser();
      if (current?.id === playerId) {
        await this.setCurrentUser(players[index]);
      }
    }
    return players;
  }

  /**
   * Bloque la messagerie entre deux joueurs spécifiques
   */
  static async blockChatWithPlayer(playerId: string, targetUserId: string): Promise<Player[]> {
    const players = await this.getAllPlayers();
    const index = players.findIndex((p) => p.id === playerId);
    if (index !== -1) {
      const existing = players[index].blockedChatUserIds || [];
      if (!existing.includes(targetUserId)) {
        players[index].blockedChatUserIds = [...existing, targetUserId];
        await this.saveAllPlayers(players);
        const current = await this.getCurrentUser();
        if (current?.id === playerId) {
          await this.setCurrentUser(players[index]);
        }
      }
    }
    return players;
  }

  /**
   * Lève le blocage de messagerie avec un joueur spécifique
   */
  static async unblockChatWithPlayer(playerId: string, targetUserId: string): Promise<Player[]> {
    const players = await this.getAllPlayers();
    const index = players.findIndex((p) => p.id === playerId);
    if (index !== -1) {
      const existing = players[index].blockedChatUserIds || [];
      players[index].blockedChatUserIds = existing.filter((id) => id !== targetUserId);
      await this.saveAllPlayers(players);
      const current = await this.getCurrentUser();
      if (current?.id === playerId) {
        await this.setCurrentUser(players[index]);
      }
    }
    return players;
  }

  /**
   * Personnalisation du profil par le joueur lui-même
   */
  static async updateProfile(
    userId: string,
    data: { firstName?: string; lastName?: string; avatarEmoji?: string; bio?: string }
  ): Promise<Player> {
    const players = await this.getAllPlayers();
    const index = players.findIndex((p) => p.id === userId);
    if (index === -1) throw new Error('Joueur introuvable');

    players[index] = {
      ...players[index],
      firstName: data.firstName !== undefined ? data.firstName.trim() : players[index].firstName,
      lastName: data.lastName !== undefined ? data.lastName.trim() : players[index].lastName,
      avatarEmoji: data.avatarEmoji !== undefined ? data.avatarEmoji : players[index].avatarEmoji,
      bio: data.bio !== undefined ? data.bio.trim() : players[index].bio,
    };

    await this.saveAllPlayers(players);
    await this.setCurrentUser(players[index]);
    return players[index];
  }

  /**
   * Déconnexion
   */
  static async logout(): Promise<void> {
    await AsyncStorage.removeItem(CURRENT_USER_KEY);
  }
}
