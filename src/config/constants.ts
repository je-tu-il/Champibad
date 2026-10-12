import { AdminSettings, ClubSlot } from '../types';

export const SUPER_ADMIN_EMAIL = 'reymond_aurelien@yahoo.fr';

export const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  adminEmail: SUPER_ADMIN_EMAIL,
  maxEloGapForDirectMatch: 350, // Écart maximum recommandé avant déclenchement handicap
  handicapModeEnabled: true,
  handicapPointsDelta: 10, // -10 points pour le joueur favori ou +10 au challenger
  allowCourtRestriction: true, // Autorise le handicap 'Sans les couloirs'
  
  // Cashprize
  cashprizeEnabled: true,
  cashprizeEntryFee: 10, // 10 € de cotisation par défaut (paramétrable par l'admin)
  adFundContribution: 24.50, // Financement progressif généré par Google Ads
  prizeDistribution: {
    strongestPercent: 50,     // 50% pour le Plus Fort (N°1 Elo)
    mostDiligentPercent: 25,  // 25% pour le Plus Assidu (Volume de matchs)
    mostResilientPercent: 25, // 25% pour le Plus Résilient (Remontées et 3 sets)
  },
  
  // Synchronisation des licenciés
  licenseApiUrl: 'https://api.champibad.fr/licencies',
  lastLicenseSyncTime: Date.now(),
};

export const DEFAULT_CLUB_SLOTS: ClubSlot[] = [
  {
    id: 'slot-mardi-soir',
    dayOfWeek: 2, // Mardi
    dayName: 'Mardi',
    startTime: '18:00',
    endTime: '20:30',
    label: 'Jeu libre & Loisir',
    gymnasium: 'Gymnase de Champigneulles',
    hasPeakHours: false,
    isActive: true,
  },
  {
    id: 'slot-jeudi-soir',
    dayOfWeek: 4, // Jeudi
    dayName: 'Jeudi',
    startTime: '20:00',
    endTime: '22:00',
    label: 'Séance Compétition & Jeu Libre',
    gymnasium: 'Gymnase de Champigneulles',
    // Subtilité demandée : Fort moment d'affluence -> autoriser les matchs uniquement après 21h
    hasPeakHours: true,
    peakRestrictionMessage: 'Forte affluence avant 21h : Matchs de classement autorisés uniquement après 21h00',
    allowedMatchStartTime: '21:00',
    allowedMatchEndTime: '22:00',
    isActive: true,
  },
  {
    id: 'slot-samedi-matin',
    dayOfWeek: 6, // Samedi
    dayName: 'Samedi',
    startTime: '10:00',
    endTime: '12:30',
    label: 'Jeu libre du week-end',
    gymnasium: 'Gymnase de Champigneulles',
    hasPeakHours: false,
    isActive: true,
  },
];

// Identifiants officiels de test Google Mobile Ads (AdMob)
export const ADMOB_CONFIG = {
  // Unités de test Google AdMob officielles
  androidInterstitialTestId: 'ca-app-pub-3940256099942544/1033173712',
  iosInterstitialTestId: 'ca-app-pub-3940256099942544/4411468910',
  androidRewardedTestId: 'ca-app-pub-3940256099942544/5224354917',
  iosRewardedTestId: 'ca-app-pub-3940256099942544/1712485313',
  adDurationSeconds: 5, // Durée obligatoire de visionnage
  adRewardEuroValue: 0.05, // Chaque pub vue ajoute 0.05 € à la cagnotte
};
