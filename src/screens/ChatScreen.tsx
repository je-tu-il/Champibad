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
import { Player, GlobalChatMessage } from '../types';
import { AuthService } from '../services/authService';
import { ChatService } from '../services/chatService';

interface Props {
  currentUser: Player;
  onUserUpdated: (player: Player) => void;
  onPressPlayer?: (player: Player) => void;
}

export const ChatScreen: React.FC<Props> = ({ currentUser, onUserUpdated, onPressPlayer }) => {
  const [activeTab, setActiveTab] = useState<'GLOBAL' | 'DIRECT'>('GLOBAL');
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);

  // Global Chat state
  const [globalMessages, setGlobalMessages] = useState<GlobalChatMessage[]>([]);
  const [globalInputText, setGlobalInputText] = useState('');

  // Direct Chat state
  const [activePartnerId, setActivePartnerId] = useState<string>('');
  const [conversation, setConversation] = useState<{ message: any; text: string }[]>([]);
  const [directInputText, setDirectInputText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPlayers();
    loadGlobalMessages();
  }, [currentUser]);

  const loadPlayers = async () => {
    const list = await AuthService.getAllPlayers();
    const otherPlayers = list.filter((p) => p.id !== currentUser.id);
    setAllPlayers(otherPlayers);
    if (otherPlayers.length > 0 && !activePartnerId) {
      setActivePartnerId(otherPlayers[0].id);
    }
  };

  const loadGlobalMessages = async () => {
    try {
      const msgs = await ChatService.getGlobalMessages();
      setGlobalMessages(msgs);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (activePartnerId && activeTab === 'DIRECT') {
      loadDirectMessages();
    }
  }, [activePartnerId, activeTab]);

  const loadDirectMessages = async () => {
    if (!activePartnerId) return;
    setLoading(true);
    const msgs = await ChatService.getDecryptedConversation(currentUser.id, activePartnerId);
    setConversation(msgs);
    setLoading(false);
  };

  // Suspension / Ban checks
  const isGlobalChatBanned = !!(currentUser.chatBannedUntil && currentUser.chatBannedUntil > Date.now());
  const banDateFormatted = currentUser.chatBannedUntil
    ? new Date(currentUser.chatBannedUntil).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  const isPartnerAdminBlocked = !!(activePartnerId && currentUser.blockedChatUserIds?.includes(activePartnerId));

  const handleSendGlobalMessage = async () => {
    if (!globalInputText.trim()) return;
    if (isGlobalChatBanned) {
      Alert.alert('Accès restreint', `Votre accès au chat est suspendu jusqu'au ${banDateFormatted}.`);
      return;
    }

    try {
      const text = globalInputText.trim();
      setGlobalInputText('');
      await ChatService.sendGlobalMessage(currentUser, text);
      await loadGlobalMessages();
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    }
  };

  const handleSendDirectMessage = async () => {
    if (!directInputText.trim() || !activePartnerId) return;

    if (isGlobalChatBanned) {
      Alert.alert('Accès restreint', `Votre accès au chat est suspendu jusqu'au ${banDateFormatted}.`);
      return;
    }

    if (isPartnerAdminBlocked) {
      Alert.alert('Contact restreint', 'La messagerie avec ce joueur a été restreinte par l\'administrateur.');
      return;
    }

    if (currentUser.blockedUsers.includes(activePartnerId)) {
      Alert.alert('Utilisateur bloqué', 'Vous avez bloqué cet utilisateur.');
      return;
    }

    try {
      const text = directInputText.trim();
      setDirectInputText('');
      await ChatService.sendMessage(currentUser, activePartnerId, text);
      await loadDirectMessages();
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

  const isDirectSendDisabled = !directInputText.trim() || isBlocked || isGlobalChatBanned || isPartnerAdminBlocked;
  const isGlobalSendDisabled = !globalInputText.trim() || isGlobalChatBanned;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Sélecteur de mode : Club (Général) vs Messages Privés */}
      <View style={styles.topTabBar}>
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'GLOBAL' && styles.activeSegmentBtn]}
            onPress={() => {
              setActiveTab('GLOBAL');
              loadGlobalMessages();
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.segmentText, activeTab === 'GLOBAL' && styles.activeSegmentText]}>
              💬 Club (Général)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'DIRECT' && styles.activeSegmentBtn]}
            onPress={() => {
              setActiveTab('DIRECT');
              if (activePartnerId) loadDirectMessages();
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.segmentText, activeTab === 'DIRECT' && styles.activeSegmentText]}>
              👤 Messages Privés
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Alerte si le compte est banni du chat */}
      {isGlobalChatBanned && (
        <View style={styles.banBanner}>
          <Text style={styles.banBannerText}>
            ⚠️ Accès au chat suspendu par l'administration jusqu'au {banDateFormatted}.
          </Text>
        </View>
      )}

      {/* === VUE SALON GLOBAL === */}
      {activeTab === 'GLOBAL' && (
        <View style={styles.tabContent}>
          <FlatList
            data={globalMessages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.globalList}
            renderItem={({ item }) => {
              const isMine = item.senderId === currentUser.id;
              const senderPlayer = allPlayers.find((p) => p.id === item.senderId);

              return (
                <View style={[styles.globalMsgContainer, isMine && styles.globalMsgMine]}>
                  {!isMine && (
                    <TouchableOpacity
                      onPress={() => senderPlayer && onPressPlayer && onPressPlayer(senderPlayer)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.avatarCircle}>
                        <Text style={styles.avatarEmoji}>{item.senderAvatar || '🏸'}</Text>
                      </View>
                    </TouchableOpacity>
                  )}

                  <View
                    style={[
                      styles.globalMsgBubble,
                      isMine ? styles.myGlobalBubble : styles.theirGlobalBubble,
                    ]}
                  >
                    {!isMine && (
                      <View style={styles.globalHeaderRow}>
                        <TouchableOpacity
                          onPress={() => senderPlayer && onPressPlayer && onPressPlayer(senderPlayer)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.globalSenderName}>{item.senderName}</Text>
                        </TouchableOpacity>
                        {item.senderRole === 'ADMIN' && (
                          <View style={styles.adminBadge}>
                            <Text style={styles.adminBadgeText}>Admin</Text>
                          </View>
                        )}
                      </View>
                    )}

                    <Text
                      style={[
                        styles.globalMsgText,
                        isMine ? styles.myMsgText : styles.theirMsgText,
                      ]}
                    >
                      {item.text}
                    </Text>

                    <Text
                      style={[
                        styles.globalMsgTime,
                        isMine ? styles.myMsgTime : styles.theirMsgTime,
                      ]}
                    >
                      {new Date(item.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>
              );
            }}
          />

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.messageInput}
              placeholder={isGlobalChatBanned ? 'Chat suspendu' : 'Message pour tout le club...'}
              placeholderTextColor="#8E8E93"
              value={globalInputText}
              onChangeText={setGlobalInputText}
              editable={!isGlobalChatBanned}
            />
            <TouchableOpacity
              style={[styles.sendBtn, isGlobalSendDisabled && styles.sendBtnDisabled]}
              disabled={isGlobalSendDisabled}
              onPress={handleSendGlobalMessage}
              activeOpacity={0.8}
            >
              <Text style={[styles.sendBtnText, isGlobalSendDisabled && styles.sendBtnTextDisabled]}>
                ↑
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* === VUE MESSAGES PRIVÉS === */}
      {activeTab === 'DIRECT' && (
        <View style={styles.tabContent}>
          {/* Sélecteur de partenaire / Amis */}
          <View style={styles.contactsBar}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.contactsScroll}
            >
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
                    activeOpacity={0.7}
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

          {/* En-tête partenaire */}
          {activePartner && (
            <View style={styles.partnerHeader}>
              <View style={styles.headerSpacer} />
              <TouchableOpacity
                onPress={() => onPressPlayer && onPressPlayer(activePartner)}
                activeOpacity={0.7}
              >
                <Text style={styles.partnerTitle} numberOfLines={1}>
                  {activePartner.avatarEmoji ? `${activePartner.avatarEmoji} ` : ''}
                  {activePartner.firstName} {activePartner.lastName}
                </Text>
              </TouchableOpacity>

              <View style={styles.partnerActions}>
                <TouchableOpacity
                  style={[styles.iconBtn, isFriend && styles.iconBtnActive]}
                  onPress={handleToggleFriend}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={[styles.starIcon, isFriend && styles.starIconActive]}>
                    {isFriend ? '★' : '☆'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.iconBtn, isBlocked && styles.blockBtnActive]}
                  onPress={handleToggleBlock}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.blockIcon}>🚫</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Alerte si messagerie avec ce joueur restreinte par admin */}
          {isPartnerAdminBlocked && (
            <View style={styles.adminBlockNotice}>
              <Text style={styles.adminBlockNoticeText}>
                ⚠️ La messagerie avec ce joueur a été restreinte par l'administrateur.
              </Text>
            </View>
          )}

          {/* Messages privés chiffrés */}
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
                  <Text
                    style={[
                      styles.messageTime,
                      isMine ? styles.myMessageTime : styles.theirMessageTime,
                    ]}
                  >
                    {new Date(item.message.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              );
            }}
          />

          {/* Saisie de message privé */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.messageInput}
              placeholder={
                isBlocked
                  ? 'Utilisateur bloqué'
                  : isPartnerAdminBlocked
                  ? 'Messagerie restreinte'
                  : 'Votre message privé chiffré...'
              }
              placeholderTextColor="#8E8E93"
              value={directInputText}
              onChangeText={setDirectInputText}
              editable={!isBlocked && !isGlobalChatBanned && !isPartnerAdminBlocked}
            />
            <TouchableOpacity
              style={[styles.sendBtn, isDirectSendDisabled && styles.sendBtnDisabled]}
              disabled={isDirectSendDisabled}
              onPress={handleSendDirectMessage}
              activeOpacity={0.8}
            >
              <Text style={[styles.sendBtnText, isDirectSendDisabled && styles.sendBtnTextDisabled]}>
                ↑
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topTabBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    borderRadius: 9,
    padding: 2,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
  },
  activeSegmentBtn: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
  },
  activeSegmentText: {
    color: '#000000',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
  },
  banBanner: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  banBannerText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  adminBlockNotice: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  adminBlockNoticeText: {
    color: '#D97706',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  globalList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
  },
  globalMsgContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
  },
  globalMsgMine: {
    justifyContent: 'flex-end',
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 16,
  },
  globalMsgBubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 16,
  },
  myGlobalBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  theirGlobalBubble: {
    backgroundColor: '#F2F2F7',
    borderBottomLeftRadius: 4,
  },
  globalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  globalSenderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
  adminBadge: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  adminBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#007AFF',
  },
  globalMsgText: {
    fontSize: 14,
    lineHeight: 19,
  },
  myMsgText: {
    color: '#FFFFFF',
  },
  theirMsgText: {
    color: '#000000',
  },
  globalMsgTime: {
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  myMsgTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  theirMsgTime: {
    color: '#8E8E93',
  },
  contactsBar: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  contactsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  contactChip: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
  },
  selectedContactChip: {
    backgroundColor: '#007AFF',
  },
  contactName: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '500',
  },
  selectedContactName: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  partnerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerSpacer: {
    width: 64,
  },
  partnerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
  partnerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    width: 64,
  },
  iconBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnActive: {
    backgroundColor: '#FFFBEB',
  },
  blockBtnActive: {
    backgroundColor: '#FEE2E2',
  },
  starIcon: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 16,
  },
  starIconActive: {
    color: '#FF9500',
  },
  blockIcon: {
    fontSize: 12,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
    marginBottom: 8,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#F2F2F7',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  theirMessageText: {
    color: '#000000',
  },
  messageTime: {
    fontSize: 10,
    color: '#8E8E93',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  theirMessageTime: {
    color: '#8E8E93',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    gap: 10,
  },
  messageInput: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 15,
    color: '#000000',
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#E5E5EA',
  },
  sendBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: -1,
  },
  sendBtnTextDisabled: {
    color: '#8E8E93',
  },
});
