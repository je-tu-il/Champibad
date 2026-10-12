import AsyncStorage from '@react-native-async-storage/async-storage';
import { EncryptedMessage, Player } from '../types';
import { CryptoService } from './cryptoService';
import { AuthService } from './authService';

const MESSAGES_KEY = '@champibad_encrypted_messages';

export class ChatService {
  /**
   * Identifiant canonique de conversation entre deux joueurs
   */
  static getConversationId(user1Id: string, user2Id: string): string {
    return [user1Id, user2Id].sort().join('__');
  }

  /**
   * Récupère tous les messages chiffrés d'une conversation et les déchiffre
   */
  static async getDecryptedConversation(
    currentUserId: string,
    otherUserId: string
  ): Promise<{ message: EncryptedMessage; text: string }[]> {
    const rawData = await AsyncStorage.getItem(MESSAGES_KEY);
    const allMessages: EncryptedMessage[] = rawData ? JSON.parse(rawData) : [];
    const conversationId = this.getConversationId(currentUserId, otherUserId);

    const convMessages = allMessages.filter((m) => m.conversationId === conversationId);
    const secretKey = CryptoService.deriveConversationKey(currentUserId, otherUserId);

    return convMessages.map((m) => {
      const text = CryptoService.decryptMessage(m.encryptedContent, m.iv, secretKey);
      return { message: m, text };
    });
  }

  /**
   * Envoie un message chiffré de bout en bout (E2EE)
   */
  static async sendMessage(
    senderId: string,
    recipientId: string,
    plainText: string
  ): Promise<EncryptedMessage> {
    const conversationId = this.getConversationId(senderId, recipientId);
    const secretKey = CryptoService.deriveConversationKey(senderId, recipientId);

    const { encryptedContent, iv } = CryptoService.encryptMessage(plainText, secretKey);

    const newMessage: EncryptedMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      conversationId,
      senderId,
      recipientId,
      encryptedContent,
      iv,
      createdAt: Date.now(),
      read: false,
    };

    const rawData = await AsyncStorage.getItem(MESSAGES_KEY);
    const allMessages: EncryptedMessage[] = rawData ? JSON.parse(rawData) : [];
    allMessages.push(newMessage);
    await AsyncStorage.setItem(MESSAGES_KEY, JSON.stringify(allMessages));

    return newMessage;
  }

  /**
   * Ajoute ou supprime un ami
   */
  static async toggleFriend(currentUser: Player, targetUserId: string): Promise<Player> {
    const isFriend = currentUser.friends.includes(targetUserId);
    const updatedFriends = isFriend
      ? currentUser.friends.filter((id) => id !== targetUserId)
      : [...currentUser.friends, targetUserId];

    const updated = { ...currentUser, friends: updatedFriends };
    await AuthService.updatePlayer(updated);
    return updated;
  }

  /**
   * Bloque ou débloque un utilisateur
   */
  static async toggleBlockUser(currentUser: Player, targetUserId: string): Promise<Player> {
    const isBlocked = currentUser.blockedUsers.includes(targetUserId);
    const updatedBlocked = isBlocked
      ? currentUser.blockedUsers.filter((id) => id !== targetUserId)
      : [...currentUser.blockedUsers, targetUserId];

    const updated = { ...currentUser, blockedUsers: updatedBlocked };
    await AuthService.updatePlayer(updated);
    return updated;
  }
}
