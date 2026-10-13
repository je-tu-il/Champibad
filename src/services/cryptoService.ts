import { AES, PBKDF2, Hex, Utf8, WordArray } from 'crypto-es';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_KEY_STORAGE = '@champibad_device_e2ee_key';

export class CryptoService {
  /**
   * Récupère ou génère une clé privée unique sur l'appareil pour le chiffrement E2EE
   */
  static async getOrCreateDeviceKey(userId: string): Promise<string> {
    const stored = await AsyncStorage.getItem(`${DEVICE_KEY_STORAGE}_${userId}`);
    if (stored) {
      return stored;
    }

    // Génération d'une clé aléatoire de 256 bits
    const randomHex = WordArray.random(32).toString();
    await AsyncStorage.setItem(`${DEVICE_KEY_STORAGE}_${userId}`, randomHex);
    return randomHex;
  }

  /**
   * Dérive une clé de conversation unique pour deux utilisateurs (E2EE)
   */
  static deriveConversationKey(userAId: string, userBId: string, salt: string = 'champibad-salt-v1'): string {
    const sortedIds = [userAId, userBId].sort().join(':');
    return PBKDF2(sortedIds, salt, {
      keySize: 256 / 32,
      iterations: 1000,
    }).toString();
  }

  /**
   * Chiffre un message avant son enregistrement dans Firebase Firestore
   */
  static encryptMessage(plainText: string, secretKey: string): { encryptedContent: string; iv: string } {
    const iv = WordArray.random(16).toString();
    const encrypted = AES.encrypt(plainText, secretKey, {
      iv: Hex.parse(iv),
    });

    return {
      encryptedContent: encrypted.toString(),
      iv,
    };
  }

  /**
   * Déchiffre un message reçu de Firebase Firestore
   */
  static decryptMessage(encryptedContent: string, iv: string, secretKey: string): string {
    try {
      const decrypted = AES.decrypt(encryptedContent, secretKey, {
        iv: Hex.parse(iv),
      });
      const result = decrypted.toString(Utf8);
      return result || '⚠️ Message non déchiffrable';
    } catch (e) {
      return '⚠️ Erreur de déchiffrement';
    }
  }
}
