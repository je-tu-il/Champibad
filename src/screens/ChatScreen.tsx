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

      {/* En-tête partenaire simplifié */}
      {activePartner && (
        <View style={styles.partnerHeader}>
          <Text style={styles.partnerTitle}>
            {activePartner.firstName}
          </Text>

          <View style={styles.partnerActions}>
            <TouchableOpacity
              style={[styles.iconBtn, isFriend && styles.iconBtnActive]}
              onPress={handleToggleFriend}
            >
              <Text style={[styles.starIcon, isFriend && styles.starIconActive]}>
                {isFriend ? '★' : '☆'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.iconBtn, isBlocked && styles.blockBtnActive]}
              onPress={handleToggleBlock}
            >
              <Text style={styles.blockIcon}>🚫</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

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

      {/* Saisie de message compacte */}
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
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  partnerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnActive: {
    backgroundColor: '#FEF3C7',
  },
  blockBtnActive: {
    backgroundColor: '#FEE2E2',
  },
  starIcon: {
    fontSize: 16,
    color: '#94A3B8',
  },
  starIconActive: {
    color: '#D97706',
  },
  blockIcon: {
    fontSize: 14,
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
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 8,
  },
  messageInput: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 6,
    fontSize: 14,
    color: '#0F172A',
  },
  sendBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  sendBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
