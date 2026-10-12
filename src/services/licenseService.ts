import AsyncStorage from '@react-native-async-storage/async-storage';
import { Licensee } from '../types';

const LICENSEES_STORAGE_KEY = '@champibad_licensees_cache';
const LAST_SYNC_STORAGE_KEY = '@champibad_licensees_last_sync';
const SYNC_INTERVAL_MS = 60 * 60 * 1000; // 1 heure

// Liste initiale des licenciés du club Champipaf (Champigneulles)
export const MOCK_CHAMPIPAF_LICENSEES: Licensee[] = [
  {
    id: '07123456',
    licenseNumber: '07123456',
    firstName: 'Aurélien',
    lastName: 'Reymond',
    gender: 'M',
    club: 'Champipaf - Champigneulles',
    officialRank: 'R5',
    email: 'reymond_aurelien@yahoo.fr',
    syncedAt: Date.now(),
  },
  {
    id: '07234567',
    licenseNumber: '07234567',
    firstName: 'Thomas',
    lastName: 'Dubois',
    gender: 'M',
    club: 'Champipaf - Champigneulles',
    officialRank: 'D7',
    email: 'thomas.dubois@badminton-champigneulles.fr',
    syncedAt: Date.now(),
  },
  {
    id: '07345678',
    licenseNumber: '07345678',
    firstName: 'Camille',
    lastName: 'Laurent',
    gender: 'F',
    club: 'Champipaf - Champigneulles',
    officialRank: 'D8',
    email: 'camille.laurent@gmail.com',
    syncedAt: Date.now(),
  },
  {
    id: '07456789',
    licenseNumber: '07456789',
    firstName: 'Julien',
    lastName: 'Moreau',
    gender: 'M',
    club: 'Champipaf - Champigneulles',
    officialRank: 'P10',
    email: 'j.moreau@orange.fr',
    syncedAt: Date.now(),
  },
  {
    id: '07567890',
    licenseNumber: '07567890',
    firstName: 'Sarah',
    lastName: 'Bernard',
    gender: 'F',
    club: 'Champipaf - Champigneulles',
    officialRank: 'P11',
    email: 'sarah.b@free.fr',
    syncedAt: Date.now(),
  },
  {
    id: '07678901',
    licenseNumber: '07678901',
    firstName: 'Maxime',
    lastName: 'Petit',
    gender: 'M',
    club: 'Champipaf - Champigneulles',
    officialRank: 'R6',
    email: 'maxime.petit@hotmail.com',
    syncedAt: Date.now(),
  },
  {
    id: '07789012',
    licenseNumber: '07789012',
    firstName: 'Lucas',
    lastName: 'Roux',
    gender: 'M',
    club: 'Champipaf - Champigneulles',
    officialRank: 'NC',
    email: 'lucas.roux@gmail.com',
    syncedAt: Date.now(),
  },
];

export class LicenseService {
  /**
   * Récupère la liste des licenciés en cache ou synchronise si > 1h
   */
  static async getLicensees(apiUrl?: string, forceSync: boolean = false): Promise<Licensee[]> {
    const lastSyncStr = await AsyncStorage.getItem(LAST_SYNC_STORAGE_KEY);
    const lastSync = lastSyncStr ? parseInt(lastSyncStr, 10) : 0;
    const now = Date.now();

    const cachedStr = await AsyncStorage.getItem(LICENSEES_STORAGE_KEY);
    let cachedList: Licensee[] = cachedStr ? JSON.parse(cachedStr) : [];

    if (cachedList.length === 0) {
      cachedList = [...MOCK_CHAMPIPAF_LICENSEES];
      await AsyncStorage.setItem(LICENSEES_STORAGE_KEY, JSON.stringify(cachedList));
      await AsyncStorage.setItem(LAST_SYNC_STORAGE_KEY, now.toString());
      return cachedList;
    }

    // Si plus d'1h ou demande de forçage admin
    if (forceSync || (now - lastSync > SYNC_INTERVAL_MS && apiUrl)) {
      try {
        if (apiUrl && !apiUrl.includes('champibad.fr/licencies')) {
          const res = await fetch(apiUrl);
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
              cachedList = data;
              await AsyncStorage.setItem(LICENSEES_STORAGE_KEY, JSON.stringify(cachedList));
              await AsyncStorage.setItem(LAST_SYNC_STORAGE_KEY, now.toString());
            }
          }
        }
      } catch (e) {
        console.warn('API Sync non joignable, conservation du cache:', e);
      }
    }

    return cachedList;
  }

  /**
   * Vérifie si un joueur fait bien partie de la liste des licenciés
   */
  static async verifyLicensee(
    licenseNumber: string,
    firstName: string,
    lastName: string
  ): Promise<Licensee | null> {
    const licensees = await this.getLicensees();
    const cleanNum = licenseNumber.trim().toLowerCase();
    const cleanFirst = firstName.trim().toLowerCase();
    const cleanLast = lastName.trim().toLowerCase();

    const match = licensees.find(
      (l) =>
        l.licenseNumber.trim().toLowerCase() === cleanNum &&
        l.lastName.trim().toLowerCase() === cleanLast &&
        l.firstName.trim().toLowerCase() === cleanFirst
    );

    return match || null;
  }

  /**
   * Ajout manuel d'un licencié par l'admin
   */
  static async addLicensee(licensee: Licensee): Promise<Licensee[]> {
    const list = await this.getLicensees();
    const updated = [licensee, ...list.filter((l) => l.licenseNumber !== licensee.licenseNumber)];
    await AsyncStorage.setItem(LICENSEES_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  }
}
