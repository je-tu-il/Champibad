import AsyncStorage from '@react-native-async-storage/async-storage';
import { EncryptedMessage, Player, GlobalChatMessage } from '../types';
import { CryptoService } from './cryptoService';
import { AuthService } from './authService';

const MESSAGES_KEY = '@champibad_encrypted_messages';
const GLOBAL_MESSAGES_KEY = '@champibad_global_messages';

export class ChatService {
  /**
   * Récupère les messages du salon global du club
   */
  static async getGlobalMessages(): Promise<GlobalChatMessage[]> {
    const raw = await AsyncStorage.getItem(GLOBAL_MESSAGES_KEY);
    if (!raw) {
      const initial: GlobalChatMessage[] = [
        {
          id: 'welcome_1',
          senderId: 'system',
          senderName: 'Club Champibad',
          senderAvatar: '🏸',
          senderRole: 'ADMIN',
          text: 'Bienvenue sur le salon officiel de Champibad ! Vous pouvez échanger ici sur les séances, organiser des matchs et suivre la vie du club.',
          createdAt: Date.now() - 3600000 * 24,
        },
      ];
      await AsyncStorage.setItem(GLOBAL_MESSAGES_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  }

  /**
   * Envoie un message sur le chat global
   */
  static async sendGlobalMessage(sender: Player, text: string): Promise<GlobalChatMessage> {
    if (sender.chatBannedUntil && sender.chatBannedUntil > Date.now()) {
      const expDate = new Date(sender.chatBannedUntil).toLocaleDateString('fr-FR');
      throw new Error(`Votre accès au chat est suspendu jusqu'au ${expDate}.`);
    }

    const messages = await this.getGlobalMessages();
    const newMsg: GlobalChatMessage = {
      id: `global_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      senderId: sender.id,
      senderName: `${sender.firstName} ${sender.lastName}`,
      senderAvatar: sender.avatarEmoji || '🏸',
      senderRole: sender.role,
      text: text.trim(),
      createdAt: Date.now(),
    };
    messages.push(newMsg);
    await AsyncStorage.setItem(GLOBAL_MESSAGES_KEY, JSON.stringify(messages));
    return newMsg;
  }

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
    sender: Player,
    recipientId: string,
    plainText: string
  ): Promise<EncryptedMessage> {
    if (sender.chatBannedUntil && sender.chatBannedUntil > Date.now()) {
      const expDate = new Date(sender.chatBannedUntil).toLocaleDateString('fr-FR');
      throw new Error(`Votre accès au chat est suspendu jusqu'au ${expDate}.`);
    }

    if (sender.blockedChatUserIds?.includes(recipientId)) {
      throw new Error(`La messagerie avec ce joueur a été restreinte par l'administrateur.`);
    }

    const conversationId = this.getConversationId(sender.id, recipientId);
    const secretKey = CryptoService.deriveConversationKey(sender.id, recipientId);

    const { encryptedContent, iv } = CryptoService.encryptMessage(plainText, secretKey);

    const newMessage: EncryptedMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      conversationId,
      senderId: sender.id,
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
