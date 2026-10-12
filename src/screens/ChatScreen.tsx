import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Player } from '../types';
import { AuthService } from '../services/authService';
import { ChatService } from '../services/chatService';

interface Props {
  currentUser: Player;
  onUserUpdated: (player: Player) => void;
}

export const ChatScreen: React.FC<Props> = ({ currentUser, onUserUpdated }) => {
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [activePartnerId, setActivePartnerId] = useState<string>('');
  const [conversation, setConversation] = useState<{ message: any; text: string }[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPlayers();
  }, [currentUser]);

  const loadPlayers = async () => {
    const list = await AuthService.getAllPlayers();
    const otherPlayers = list.filter((p) => p.id !== currentUser.id);
    setAllPlayers(otherPlayers);
    if (otherPlayers.length > 0 && !activePartnerId) {
      setActivePartnerId(otherPlayers[0].id);
    }
  };

  useEffect(() => {
    if (activePartnerId) {
      loadMessages();
    }
  }, [activePartnerId]);

  const loadMessages = async () => {
    if (!activePartnerId) return;
    setLoading(true);
    const msgs = await ChatService.getDecryptedConversation(currentUser.id, activePartnerId);
    setConversation(msgs);
    setLoading(false);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !activePartnerId) return;

    const partner = allPlayers.find((p) => p.id === activePartnerId);
    if (currentUser.blockedUsers.includes(activePartnerId)) {
      Alert.alert('Utilisateur bloqué', 'Vous avez bloqué cet utilisateur.');
      return;
    }

    try {
      const text = inputText.trim();
      setInputText('');
      await ChatService.sendMessage(currentUser.id, activePartnerId, text);
      await loadMessages();
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    }
  };

  const activePartner = allPlayers.find((p) => p.id === activePartnerId);
  const isFriend = activePartner && currentUser.friends.includes(activePartner.id);
  const isBlocked = activePartner && currentUser.blockedUsers.includes(activePartner.id);

  const handleToggleFriend = async () => {
    if (!activePartner) return;
    const updated = await ChatService.toggleFriend(currentUser, activePartner.id);
    onUserUpdated(updated);
  };

  const handleToggleBlock = async () => {
    if (!activePartner) return;
    const updated = await ChatService.toggleBlockUser(currentUser, activePartner.id);
    onUserUpdated(updated);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Sélecteur de partenaire / Amis */}
      <View style={styles.contactsBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.contactsScroll}>
          {allPlayers.map((p) => {
            const isSelected = p.id === activePartnerId;
            const isFriendContact = currentUser.friends.includes(p.id);

            return (
              <TouchableOpacity
                key={p.id}
                style={[
                  styles.contactChip,
                  isSelected && styles.selectedContactChip,
                ]}
                onPress={() => setActivePartnerId(p.id)}
              >
                <Text
                  style={[
                    styles.contactName,
                    isSelected && styles.selectedContactName,
                  ]}
                >
                  {isFriendContact ? '⭐ ' : ''}
                  {p.firstName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Barre d'action de sécurité et social */}
      {activePartner && (
        <View style={styles.partnerHeader}>
          <View>
            <Text style={styles.partnerTitle}>
              {activePartner.firstName} {activePartner.lastName}
            </Text>
            <Text style={styles.partnerElo}>🏸 {activePartner.eloSolo} Elo Solo</Text>
          </View>

          <View style={styles.partnerActions}>
            <TouchableOpacity
              style={[styles.socialBtn, isFriend && styles.socialBtnActive]}
              onPress={handleToggleFriend}
            >
              <Text style={styles.socialBtnText}>
                {isFriend ? '★ Ami' : '+ Ami'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.socialBtn, isBlocked && styles.blockBtnActive]}
              onPress={handleToggleBlock}
            >
              <Text style={[styles.socialBtnText, isBlocked && styles.blockTextActive]}>
                {isBlocked ? 'Débloquer' : 'Bloquer'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Tag de vie privée E2EE */}
      <View style={styles.e2eeBanner}>
        <Text style={styles.e2eeText}>
          🔒 Chiffrement de bout en bout (E2EE) • Seuls vous et votre adversaire pouvez lire ces messages
        </Text>
      </View>

      {/* Messages */}
      <FlatList
        data={conversation}
        keyExtractor={(item) => item.message.id}
        contentContainerStyle={styles.messagesList}
        renderItem={({ item }) => {
          const isMine = item.message.senderId === currentUser.id;
          return (
            <View
              style={[
                styles.messageBubble,
                isMine ? styles.myMessage : styles.theirMessage,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  isMine ? styles.myMessageText : styles.theirMessageText,
                ]}
              >
                {item.text}
              </Text>
              <Text style={styles.messageTime}>
                {new Date(item.message.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          );
        }}
      />

      {/* Saisie de message */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.messageInput}
          placeholder={isBlocked ? 'Utilisateur bloqué' : 'Votre message privé...'}
          placeholderTextColor="#94A3B8"
          value={inputText}
          onChangeText={setInputText}
          editable={!isBlocked}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!inputText.trim() || isBlocked) && styles.sendBtnDisabled]}
          disabled={!inputText.trim() || isBlocked}
          onPress={handleSendMessage}
        >
          <Text style={styles.sendBtnText}>Envoyer</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contactsBar: {
    backgroundColor: '#0F172A',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  contactsScroll: {
    paddingHorizontal: 12,
    gap: 8,
  },
  contactChip: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  selectedContactChip: {
    backgroundColor: '#0284C7',
  },
  contactName: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  selectedContactName: {
    color: '#FFFFFF',
  },
  partnerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  partnerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  partnerElo: {
    fontSize: 11,
    color: '#64748B',
  },
  partnerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  socialBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  socialBtnActive: {
    backgroundColor: '#FEF3C7',
  },
  blockBtnActive: {
    backgroundColor: '#FEE2E2',
  },
  socialBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  blockTextActive: {
    color: '#DC2626',
  },
  e2eeBanner: {
    backgroundColor: '#F0FDF4',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#BBF7D0',
  },
  e2eeText: {
    fontSize: 10,
    color: '#15803D',
    textAlign: 'center',
    fontWeight: '600',
  },
  messagesList: {
    padding: 16,
    flexGrow: 1,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 14,
    marginBottom: 8,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#0284C7',
    borderBottomRightRadius: 2,
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderBottomLeftRadius: 2,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 18,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  theirMessageText: {
    color: '#0F172A',
  },
  messageTime: {
    fontSize: 9,
    color: '#94A3B8',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 8,
  },
  messageInput: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  sendBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 16,
    borderRadius: 20,
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  sendBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
});
