import AsyncStorage from '@react-native-async-storage/async-storage';
import { Licensee } from '../types';

const LICENSEES_STORAGE_KEY = '@champibad_licensees_cache';
const LAST_SYNC_STORAGE_KEY = '@champibad_licensees_last_sync';
const SYNC_INTERVAL_MS = 60 * 60 * 1000; // 1 heure

// Liste officielle des licenciés réels du club Champibad (CHAMPIGNEULLES) - Source MyFFBaD
export const MOCK_CHAMPIBAD_LICENSEES: Licensee[] = [
  {
    "id": "07090004",
    "licenseNumber": "07090004",
    "firstName": "Jean-pierre",
    "lastName": "Allard",
    "gender": "M",
    "club": "Champibad",
    "officialRank": "P12",
    "email": "jeanpierre.allard@champibad.fr",
    "syncedAt": 1792157018802
  },
  {
    "id": "06663860",
    "licenseNumber": "06663860",
    "firstName": "Patrick",
    "lastName": "Battistelli",
    "gender": "M",
    "club": "Champibad",
    "officialRank": "P12",
    "email": "patrick.battistelli@champibad.fr",
    "syncedAt": 1792157018802
  },
  {
    "id": "07639418",
    "licenseNumber": "07639418",
    "firstName": "Romane",
    "lastName": "Battistelli",
    "gender": "F",
    "club": "Champibad",
    "officialRank": "P11",
    "email": "romane.battistelli@champibad.fr",
    "syncedAt": 1792157018802
  },
  {
    "id": "07770122",
    "licenseNumber": "07770122",
    "firstName": "Allory",
    "lastName": "Besnard",
    "gender": "M",
    "club": "Champibad",
    "officialRank": "NC",
    "email": "allory.besnard@champibad.fr",
    "syncedAt": 1792157018802
  },
  {
    "id": "07108570",
    "licenseNumber": "07108570",
    "firstName": "Christelle",
    "lastName": "Bonfils",
    "gender": "F",
    "club": "Champibad",
    "officialRank": "P10",
    "email": "christelle.bonfils@champibad.fr",
    "syncedAt": 1792157018802
  },
  {
    "id": "06853495",
    "licenseNumber": "06853495",
    "firstName": "Mathis",
    "lastName": "Bonfils",
    "gender": "M",
    "club": "Champibad",
    "officialRank": "P11",
    "email": "mathis.bonfils@champibad.fr",
    "syncedAt": 1792157018802
  },
  {
    "id": "07669529",
    "licenseNumber": "07669529",
    "firstName": "Mike",
    "lastName": "Cazin",
    "gender": "M",
    "club": "Champibad",
    "officialRank": "P11",
    "email": "mike.cazin@champibad.fr",
    "syncedAt": 1792157018802
  },
  {
    "id": "07780028",
    "licenseNumber": "07780028",
    "firstName": "Angélina",
    "lastName": "Costanzo",
    "gender": "F",
    "club": "Champibad",
    "officialRank": "P12",
    "email": "angelina.costanzo@champibad.fr",
    "syncedAt": 1792157018803
  },
  {
    "id": "07780036",
    "licenseNumber": "07780036",
    "firstName": "Timéo",
    "lastName": "Costanzo",
    "gender": "M",
    "club": "Champibad",
    "officialRank": "P12",
    "email": "timeo.costanzo@champibad.fr",
    "syncedAt": 1792157018803
  },
  {
    "id": "07463787",
    "licenseNumber": "07463787",
    "firstName": "Lucas",
    "lastName": "Courtiol",
    "gender": "M",
    "club": "Champibad",
    "officialRank": "P11",
    "email": "lucas.courtiol@champibad.fr",
    "syncedAt": 1792157018803
  },
  {
    "id": "06649617",
    "licenseNumber": "06649617",
    "firstName": "José",
    "lastName": "Pédro De Oliveira",
    "gender": "M",
    "club": "Champibad",
    "officialRank": "P12",
    "email": "jose.pedrodeoliveira@champibad.fr",
    "syncedAt": 1792157018803
  },
  {
    "id": "07695734",
    "licenseNumber": "07695734",
    "firstName": "Anne-charlotte",
    "lastName": "Delsol",
    "gender": "F",
    "club": "Champibad",
    "officialRank": "NC",
    "email": "annecharlotte.delsol@champibad.fr",
    "syncedAt": 1792157018803
  },
  {
    "id": "07297317",
    "licenseNumber": "07297317",
    "firstName": "Carolane",
    "lastName": "Didier",
    "gender": "F",
    "club": "Champibad",
    "officialRank": "P12",
    "email": "carolane.didier@champibad.fr",
    "syncedAt": 1792157018803
  },
  {
    "id": "07695737",
    "licenseNumber": "07695737",
    "firstName": "Vincent",
    "lastName": "Double",
    "gender": "M",
    "club": "Champibad",
    "officialRank": "NC",
    "email": "vincent.double@champibad.fr",
    "syncedAt": 1792157018803
  },
  {
    "id": "07639419",
    "licenseNumber": "07639419",
    "firstName": "Alec",
    "lastName": "Drouin",
    "gender": "M",
    "club": "Champibad",
    "officialRank": "P12",
    "email": "alec.drouin@champibad.fr",
    "syncedAt": 1792157018803
  },
  {
    "id": "07732724",
    "licenseNumber": "07732724",
    "firstName": "Loris",
    "lastName": "Drouin",
    "gender": "M",
    "club": "Champibad",
    "officialRank": "P11",
    "email": "loris.drouin@champibad.fr",
    "syncedAt": 1792157018803
  },
  {
    "id": "07743916",
    "licenseNumber": "07743916",
    "firstName": "Sylvain",
    "lastName": "Drouin",
    "gender": "M",
    "club": "Champibad",
    "officialRank": "P12",
    "email": "sylvain.drouin@champibad.fr",
    "syncedAt": 1792157018803
  },
  {
    "id": "07106943",
    "licenseNumber": "07106943",
    "firstName": "Lea",
    "lastName": "Falchetto",
    "gender": "F",
    "club": "Champibad",
    "officialRank": "D8",
    "email": "lea.falchetto@champibad.fr",
    "syncedAt": 1792157018803
  },
  {
    "id": "07451762",
    "licenseNumber": "07451762",
    "firstName": "Océane",
    "lastName": "Gambetti",
    "gender": "F",
    "club": "Champibad",
    "officialRank": "D9",
    "email": "oceane.gambetti@champibad.fr",
    "syncedAt": 1792157018803
  },
  {
    "id": "00381203",
    "licenseNumber": "00381203",
    "firstName": "Bruno",
    "lastName": "Gascard",
    "gender": "M",
    "club": "Champibad",
    "officialRank": "NC",
    "email": "bruno.gascard@champibad.fr",
    "syncedAt": 1792157018803
  },
  {
    "id": "06943417",
    "licenseNumber": "06943417",
    "firstName": "Elodie",
    "lastName": "Gerard",
    "gender": "F",
    "club": "Champibad",
    "officialRank": "D9",
    "email": "elodie.gerard@champibad.fr",
    "syncedAt": 1792157018803
  },
  {
    "id": "06837243",
    "licenseNumber": "06837243",
    "firstName": "Alexandre",
    "lastName": "Gillet",
    "gender": "M",
    "club": "Champibad",
    "officialRank": "D8",
    "email": "alexandre.gillet@champibad.fr",
    "syncedAt": 1792157018803
  },
  {
    "id": "07125719",
    "licenseNumber": "07125719",
    "firstName": "Michael",
    "lastName": "Hery",
    "gender": "M",
    "club": "Champibad",
    "officialRank": "P11",
    "email": "michael.hery@champibad.fr",
    "syncedAt": 1792157018803
  },
  {
    "id": "07070401",
    "licenseNumber": "07070401",
    "firstName": "Lucas",
    "lastName": "Hutin",
    "gender": "M",
    "club": "Champibad",
    "officialRank": "D9",
    "email": "lucas.hutin@champibad.fr",
    "syncedAt": 1792157018803
  },
  {
    "id": "07471590",
    "licenseNumber": "07471590",
    "firstName": "Solenn",
    "lastName": "Laurain",
    "gender": "F",
    "club": "Champibad",
    "officialRank": "P11",
    "email": "solenn.laurain@champibad.fr",
    "syncedAt": 1792157018803
  },
  {
    "id": "07529634",
    "licenseNumber": "07529634",
    "firstName": "Quentin",
    "lastName": "Laval",
    "gender": "M",
    "club": "Champibad",
    "officialRank": "D8",
    "email": "quentin.laval@champibad.fr",
    "syncedAt": 1792157018803
  },
  {
    "id": "07634333",
    "licenseNumber": "07634333",
    "firstName": "Jeanne",
    "lastName": "Martin",
    "gender": "F",
    "club": "Champibad",
    "officialRank": "P12",
    "email": "jeanne.martin@champibad.fr",
    "syncedAt": 1792157018803
  },
  {
    "id": "06954218",
    "licenseNumber": "06954218",
    "firstName": "Paul",
    "lastName": "Martin",
    "gender": "M",
    "club": "Champibad",
    "officialRank": "P10",
    "email": "paul.martin@champibad.fr",
    "syncedAt": 1792157018803
  },
  {
    "id": "07669533",
    "licenseNumber": "07669533",
    "firstName": "Quentin",
    "lastName": "Maume",
    "gender": "M",
    "club": "Champibad",
    "officialRank": "NC",
    "email": "quentin.maume@champibad.fr",
    "syncedAt": 1792157018803
  },
  {
    "id": "07771304",
    "licenseNumber": "07771304",
    "firstName": "Jean-paul",
    "lastName": "Milon",
    "gender": "M",
    "club": "Champibad",
    "officialRank": "NC",
    "email": "jeanpaul.milon@champibad.fr",
    "syncedAt": 1792157018803
  },
  {
    "id": "06851184",
    "licenseNumber": "06851184",
    "firstName": "David",
    "lastName": "Nanquette",
    "gender": "M",
    "club": "Champibad",
    "officialRank": "P12",
    "email": "david.nanquette@champibad.fr",
    "syncedAt": 1792157018803
  },
  {
    "id": "06680345",
    "licenseNumber": "06680345",
    "firstName": "Hervé",
    "lastName": "Oudard",
    "gender": "M",
    "club": "Champibad",
    "officialRank": "D9",
    "email": "herve.oudard@champibad.fr",
    "syncedAt": 1792157018803
  },
  {
    "id": "00049468",
    "licenseNumber": "00049468",
    "firstName": "Maud",
    "lastName": "Paris",
    "gender": "F",
    "club": "Champibad",
    "officialRank": "P11",
    "email": "maud.paris@champibad.fr",
    "syncedAt": 1792157018803
  },
  {
    "id": "07695845",
    "licenseNumber": "07695845",
    "firstName": "Mylene",
    "lastName": "Petitgand",
    "gender": "F",
    "club": "Champibad",
    "officialRank": "NC",
    "email": "mylene.petitgand@champibad.fr",
    "syncedAt": 1792157018803
  },
  {
    "id": "06869057",
    "licenseNumber": "06869057",
    "firstName": "Romain",
    "lastName": "Remusat",
    "gender": "M",
    "club": "Champibad",
    "officialRank": "D9",
    "email": "romain.remusat@champibad.fr",
    "syncedAt": 1792157018803
  },
  {
    "id": "00336568",
    "licenseNumber": "00336568",
    "firstName": "Aurélien",
    "lastName": "Reymond",
    "gender": "M",
    "club": "Champibad",
    "officialRank": "D7",
    "email": "aurelien.reymond@champibad.fr",
    "syncedAt": 1792157018803
  },
  {
    "id": "07539612",
    "licenseNumber": "07539612",
    "firstName": "Jules",
    "lastName": "Reymond",
    "gender": "M",
    "club": "Champibad",
    "officialRank": "P10",
    "email": "jules.reymond@champibad.fr",
    "syncedAt": 1792157018803
  },
  {
    "id": "07128549",
    "licenseNumber": "07128549",
    "firstName": "Cyril",
    "lastName": "Thiriet",
    "gender": "M",
    "club": "Champibad",
    "officialRank": "P11",
    "email": "cyril.thiriet@champibad.fr",
    "syncedAt": 1792157018803
  },
  {
    "id": "07471572",
    "licenseNumber": "07471572",
    "firstName": "Aurélien",
    "lastName": "Thirion",
    "gender": "M",
    "club": "Champibad",
    "officialRank": "P10",
    "email": "aurelien.thirion@champibad.fr",
    "syncedAt": 1792157018803
  },
  {
    "id": "07785383",
    "licenseNumber": "07785383",
    "firstName": "Eloi",
    "lastName": "Thomas",
    "gender": "M",
    "club": "Champibad",
    "officialRank": "NC",
    "email": "eloi.thomas@champibad.fr",
    "syncedAt": 1792157018803
  },
  {
    "id": "06594973",
    "licenseNumber": "06594973",
    "firstName": "Jean-claude",
    "lastName": "Weinert",
    "gender": "M",
    "club": "Champibad",
    "officialRank": "P11",
    "email": "jeanclaude.weinert@champibad.fr",
    "syncedAt": 1792157018803
  },
  {
    "id": "06905963",
    "licenseNumber": "06905963",
    "firstName": "Laurent",
    "lastName": "Woerther",
    "gender": "M",
    "club": "Champibad",
    "officialRank": "P12",
    "email": "laurent.woerther@champibad.fr",
    "syncedAt": 1792157018803
  }
];

export class LicenseService {
  /**
   * Parse le flux Next.js Server Components de MyFFBaD pour extraire la liste des licenciés
   */
  static parseMyFFBaDHtml(html: string): Licensee[] {
    const key1 = '{\\"results\\":[';
    const key2 = '{"results":[';
    let start = html.indexOf(key1);
    let isEscaped = true;
    if (start === -1) {
      start = html.indexOf(key2);
      isEscaped = false;
    }
    if (start === -1) return [];

    const arrayStart = start + (isEscaped ? key1.length - 1 : key2.length - 1);
    let depth = 0, end = -1, inString = false, escape = false;

    for (let i = arrayStart; i < html.length; i++) {
      const c = html[i];
      if (escape) { escape = false; continue; }
      if (c === '\\') { escape = true; continue; }
      if (c === '"') { inString = !inString; continue; }
      if (!inString) {
        if (c === '[') depth++;
        else if (c === ']') {
          depth--;
          if (depth === 0) {
            end = i + 1;
            break;
          }
        }
      }
    }

    if (end === -1) return [];

    let raw = html.slice(arrayStart, end);
    if (isEscaped) {
      raw = raw.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    }

    try {
      const rawPlayers = JSON.parse(raw);
      return rawPlayers.map((p: any) => {
        const parts = (p.PersonName || '').trim().split(/\s+/);
        let firstName = '';
        let lastName = '';
        if (parts.length >= 2) {
          firstName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
          lastName = parts.slice(1).map((s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()).join(' ');
        } else {
          firstName = p.PersonName || 'Joueur';
          lastName = '';
        }

        const rank = p.SimpleSubLevel || p.DoubleSubLevel || 'NC';
        const cleanFirst = firstName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z]/g, '');
        const cleanLast = lastName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z]/g, '');

        return {
          id: p.PersonLicence || p.PersonId,
          licenseNumber: p.PersonLicence || '',
          firstName,
          lastName,
          gender: p.PersonSex === '1' ? 'M' : 'F',
          club: p.ClubName || 'Champibad',
          officialRank: rank,
          email: `${cleanFirst}.${cleanLast}@champibad.fr`,
          syncedAt: Date.now(),
        };
      });
    } catch (e) {
      console.warn('Erreur lors du parsing MyFFBaD:', e);
      return [];
    }
  }

  /**
   * Récupère la liste des licenciés en cache ou synchronise
   */
  static async getLicensees(apiUrl?: string, forceSync: boolean = false): Promise<Licensee[]> {
    const lastSyncStr = await AsyncStorage.getItem(LAST_SYNC_STORAGE_KEY);
    const lastSync = lastSyncStr ? parseInt(lastSyncStr, 10) : 0;
    const now = Date.now();

    const cachedStr = await AsyncStorage.getItem(LICENSEES_STORAGE_KEY);
    let cachedList: Licensee[] = cachedStr ? JSON.parse(cachedStr) : [];

    if (cachedList.length === 0) {
      cachedList = [...MOCK_CHAMPIBAD_LICENSEES];
      await AsyncStorage.setItem(LICENSEES_STORAGE_KEY, JSON.stringify(cachedList));
      await AsyncStorage.setItem(LAST_SYNC_STORAGE_KEY, now.toString());
      return cachedList;
    }

    // Synchronisation demandée ou expiration du cache (> 1h)
    if (forceSync || (now - lastSync > SYNC_INTERVAL_MS && apiUrl)) {
      try {
        if (apiUrl) {
          const res = await fetch(apiUrl);
          if (res.ok) {
            let fetchedList: Licensee[] = [];

            if (apiUrl.includes('myffbad.fr')) {
              // Extraction intelligente depuis la page publique de recherche MyFFBaD
              const html = await res.text();
              fetchedList = this.parseMyFFBaDHtml(html);
            } else {
              // API standard JSON
              const data = await res.json();
              if (Array.isArray(data)) {
                fetchedList = data;
              }
            }

            if (fetchedList.length > 0) {
              cachedList = fetchedList;
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
        (l.lastName.trim().toLowerCase() === cleanLast || cleanLast.includes(l.lastName.trim().toLowerCase())) &&
        (l.firstName.trim().toLowerCase() === cleanFirst || cleanFirst.includes(l.firstName.trim().toLowerCase()))
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
