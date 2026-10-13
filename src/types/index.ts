export type GameMode = 'SOLO' | 'DOUBLE';

export type HandicapType = 'NONE' | 'POINTS_PENALTY' | 'COURT_RESTRICTION';

export interface Licensee {
  id: string; // Numéro de licence
  licenseNumber: string;
  firstName: string;
  lastName: string;
  gender: 'M' | 'F';
  club: string; // 'Champibad'
  officialRank?: string; // e.g. R4, D7, P10, NC
  email?: string;
  phone?: string;
  syncedAt: number;
}

export interface Player {
  id: string; // Firebase Auth UID
  licenseNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  photoUrl?: string;
  role: 'PLAYER' | 'ADMIN';
  
  // Classements Elo
  eloSolo: number;
  eloDouble: number;
  
  // Snapshots & variations
  previousDayEloSolo?: number;
  previousDayEloDouble?: number;
  rankSolo?: number;
  rankDouble?: number;
  
  // Stats
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  threeSetMatches: number;
  currentStreak: number;
  highestEloSolo: number;
  
  // Badges
  badges: string[]; // 'BOSSEUR', 'PERSEVERANT', 'REMONTEE', 'CHAMPION'
  
  // Cashprize
  cashprizeEnrolled: boolean;
  cashprizePaid: boolean; // Validé par l'admin après paiement physique
  
  // Social
  friends: string[]; // User IDs
  blockedUsers: string[]; // User IDs
  
  // Clés E2EE
  publicKey?: string;
  
  createdAt: number;
  lastActiveAt: number;
}

export interface ClubSlot {
  id: string;
  dayOfWeek: number; // 0 = Dimanche, 1 = Lundi, 2 = Mardi, ..., 4 = Jeudi, 6 = Samedi
  dayName: string; // 'Mardi', 'Jeudi', etc.
  startTime: string; // '20:00'
  endTime: string; // '22:00'
  label: string; // 'Jeu Libre', 'Entraînement'
  gymnasium: string; // 'Gymnase de Champigneulles'
  
  // Subtilité forte affluence demandée par l'utilisateur
  hasPeakHours: boolean; // Si activé, les défis de classement ne sont autorisés que pendant une sous-fenêtre
  peakRestrictionMessage?: string; // ex: 'Matchs de classement autorisés uniquement après 21h00'
  allowedMatchStartTime?: string; // '21:00'
  allowedMatchEndTime?: string; // '22:00'
  isActive: boolean;
}

export interface PlayerAvailability {
  userId: string;
  recurringDays: number[]; // Jours de la semaine dispos (ex: [2, 4] pour mardi et jeudi)
  exceptionsUnavailable: string[]; // Dates ISO 'YYYY-MM-DD' où le joueur est absent
  extraAvailableDates: string[]; // Dates ISO 'YYYY-MM-DD' de présence ponctuelle
}

export interface MatchSet {
  setNumber: number;
  player1Score: number;
  player2Score: number;
}

export type MatchStatus = 'PROPOSED' | 'ACCEPTED' | 'DECLINED' | 'PENDING_VALIDATION' | 'VALIDATED' | 'CONTESTED' | 'CANCELLED';

export interface Match {
  id: string;
  seasonId: string;
  mode: GameMode;
  
  // Joueurs
  // Solo
  player1Id: string;
  player2Id: string;
  // Double
  team1PlayerIds?: [string, string];
  team2PlayerIds?: [string, string];
  
  // Créneau prévu
  scheduledSlotId?: string;
  scheduledDate?: string; // 'YYYY-MM-DD'
  scheduledTime?: string; // '21:15'
  
  // Handicap
  handicapApplied: HandicapType;
  handicapDetails?: string; // ex: '-10 pts au départ pour le joueur 1' ou 'Sans les couloirs'
  
  // Scores
  sets: MatchSet[];
  winnerId?: string; // Joueur 1 ou Joueur 2 (ou équipe 1/2)
  submittedBy?: string;
  
  // Elos avant et après
  eloBeforePlayer1?: number;
  eloBeforePlayer2?: number;
  eloDeltaPlayer1?: number;
  eloDeltaPlayer2?: number;
  
  status: MatchStatus;
  createdAt: number;
  validatedAt?: number;
}

export interface Season {
  id: string;
  name: string; // 'Saison 1 - 2026', 'Saison 2'
  startDate: string;
  endDate: string;
  isActive: boolean;
  isArchived: boolean;
  totalMatches: number;
}

export interface AdminSettings {
  adminEmail: string;
  maxEloGapForDirectMatch: number; // ex: 350 points d'écart
  handicapModeEnabled: boolean; // Permet de forcer ou suggérer le mode handicap si grand écart
  handicapPointsDelta: number; // ex: 10 points
  allowCourtRestriction: boolean; // 'Sans les couloirs'
  
  // Cashprize
  cashprizeEnabled: boolean;
  cashprizeEntryFee: number; // Montant demandé en euros (X €)
  adFundContribution: number; // Montant financé par les pubs Google Ads visionnées
  
  // Répartition des prix
  prizeDistribution: {
    mostDiligentPercent: number; // Le plus assidu
    strongestPercent: number;    // Le plus fort
    mostResilientPercent: number; // Le plus résilient
  };
  
  // Licence API
  licenseApiUrl: string;
  lastLicenseSyncTime: number;
}

export interface EncryptedMessage {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  encryptedContent: string; // Chiffré en AES-256
  iv: string;
  createdAt: number;
  read: boolean;
}

export interface DailySnapshot {
  date: string; // 'YYYY-MM-DD'
  leaderboardSolo: {
    userId: string;
    name: string;
    elo: number;
    rank: number;
    rankDelta: number;
  }[];
  leaderboardDouble: {
    userId: string;
    name: string;
    elo: number;
    rank: number;
    rankDelta: number;
  }[];
}
