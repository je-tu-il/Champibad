import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { Player, Match } from '../types';
import { AuthService } from '../services/authService';

interface Props {
  visible: boolean;
  player: Player | null;
  currentUser: Player;
  allMatches?: Match[];
  onClose: () => void;
  onLogout?: () => void;
  onChallenge?: (player: Player) => void;
  onSendMessage?: (player: Player) => void;
  onProfileUpdated?: (updated: Player) => void;
}

const AVAILABLE_AVATARS = ['🏸', '⚡', '🔥', '🏆', '🦁', '🎯', '🚀', '🥇', '👑', '🦅'];

export const PlayerProfileModal: React.FC<Props> = ({
  visible,
  player,
  currentUser,
  allMatches = [],
  onClose,
  onLogout,
  onChallenge,
  onSendMessage,
  onProfileUpdated,
}) => {
  if (!player) return null;

  const isSelf = player.id === currentUser.id;

  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(player.firstName);
  const [lastName, setLastName] = useState(player.lastName);
  const [selectedAvatar, setSelectedAvatar] = useState(player.avatarEmoji || '🏸');
  const [bio, setBio] = useState(player.bio || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Champs requis', 'Le prénom et le nom ne peuvent pas être vides.');
      return;
    }
    setSaving(true);
    try {
      const updated = await AuthService.updateProfile(currentUser.id, {
        firstName,
        lastName,
        avatarEmoji: selectedAvatar,
        bio,
      });
      if (onProfileUpdated) onProfileUpdated(updated);
      setEditing(false);
      Alert.alert('Profil mis à jour', 'Vos modifications ont été enregistrées.');
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    } finally {
      setSaving(false);
    }
  };

  // Calcul du Head-to-Head si on regarde un autre joueur
  const directMatches = allMatches.filter(
    (m) =>
      m.status === 'VALIDATED' &&
      ((m.player1Id === currentUser.id && m.player2Id === player.id) ||
        (m.player1Id === player.id && m.player2Id === currentUser.id))
  );

  let myH2HWins = 0;
  let opponentH2HWins = 0;
  directMatches.forEach((m) => {
    if (m.winnerId === currentUser.id) myH2HWins++;
    else if (m.winnerId === player.id) opponentH2HWins++;
  });

  const winRate =
    player.matchesPlayed > 0
      ? Math.round((player.matchesWon / player.matchesPlayed) * 100)
      : 0;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header & Close */}
          <View style={styles.sheetHeader}>
            <View style={styles.handleBar} />
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {/* Avatar & Identité */}
            <View style={styles.heroSection}>
              <View style={styles.avatarBubble}>
                <Text style={styles.avatarText}>{isSelf ? selectedAvatar : player.avatarEmoji || '🏸'}</Text>
              </View>

              {!editing ? (
                <>
                  <Text style={styles.fullName}>
                    {player.firstName} {player.lastName}
                  </Text>
                  <Text style={styles.subText}>
                    Licence N° {player.licenseNumber} • {player.role === 'ADMIN' ? '🛡️ Administrateur' : 'Adhérent Club'}
                  </Text>
                  {player.bio ? <Text style={styles.bioText}>{player.bio}</Text> : null}
                  {isSelf && (
                    <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(true)}>
                      <Text style={styles.editBtnText}>Modifier mon profil</Text>
                    </TouchableOpacity>
                  )}
                </>
              ) : (
                <View style={styles.editForm}>
                  <Text style={styles.label}>Choisir un avatar</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.avatarRow}>
                    {AVAILABLE_AVATARS.map((av) => (
                      <TouchableOpacity
                        key={av}
                        style={[styles.avatarChoice, selectedAvatar === av && styles.activeAvatarChoice]}
                        onPress={() => setSelectedAvatar(av)}
                      >
                        <Text style={styles.avatarChoiceText}>{av}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <Text style={styles.label}>Prénom</Text>
                  <TextInput
                    style={styles.input}
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="Prénom"
                  />

                  <Text style={styles.label}>Nom</Text>
                  <TextInput
                    style={styles.input}
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Nom"
                  />

                  <Text style={styles.label}>Statut / Description</Text>
                  <TextInput
                    style={styles.input}
                    value={bio}
                    onChangeText={setBio}
                    placeholder="ex: Toujours prêt pour un simple !"
                  />

                  <View style={styles.editActions}>
                    <TouchableOpacity style={styles.cancelEditBtn} onPress={() => setEditing(false)}>
                      <Text style={styles.cancelEditText}>Annuler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.saveEditBtn, saving && styles.btnDisabled]}
                      onPress={handleSave}
                      disabled={saving}
                    >
                      <Text style={styles.saveEditText}>{saving ? '...' : 'Enregistrer'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {/* Statistiques clés (style widgets iOS) */}
            <View style={styles.statsGrid}>
              <View style={styles.statWidget}>
                <Text style={styles.statValue}>{player.eloSolo}</Text>
                <Text style={styles.statLabel}>Elo Solo</Text>
              </View>

              <View style={styles.statWidget}>
                <Text style={styles.statValue}>{player.matchesPlayed}</Text>
                <Text style={styles.statLabel}>Matchs</Text>
              </View>

              <View style={styles.statWidget}>
                <Text style={[styles.statValue, { color: '#34C759' }]}>{winRate}%</Text>
                <Text style={styles.statLabel}>Victoires</Text>
              </View>

              <View style={styles.statWidget}>
                <Text style={styles.statValue}>{player.currentStreak} 🔥</Text>
                <Text style={styles.statLabel}>Série</Text>
              </View>
            </View>

            {/* H2H Face-à-face si autre joueur */}
            {!isSelf && directMatches.length > 0 && (
              <View style={styles.h2hCard}>
                <Text style={styles.h2hTitle}>Face-à-face direct</Text>
                <Text style={styles.h2hScore}>
                  Vous {myH2HWins} - {opponentH2HWins} {player.firstName}
                </Text>
                <Text style={styles.h2hSub}>Sur {directMatches.length} confrontation(s) enregistrée(s)</Text>
              </View>
            )}

            {/* Actions pour un autre joueur */}
            {!isSelf && (
              <View style={styles.otherActions}>
                {onChallenge && (
                  <TouchableOpacity
                    style={styles.challengeActionBtn}
                    onPress={() => {
                      onClose();
                      onChallenge(player);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.challengeActionText}>⚔ Proposer un défi</Text>
                  </TouchableOpacity>
                )}

                {onSendMessage && (
                  <TouchableOpacity
                    style={styles.messageActionBtn}
                    onPress={() => {
                      onClose();
                      onSendMessage(player);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.messageActionText}>💬 Envoyer un message</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* BOUTON DE DECONNEXION EXCLUSIF SUR SON PROPRE PROFIL */}
            {isSelf && onLogout && (
              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={() => {
                  onClose();
                  onLogout();
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.logoutText}>Se déconnecter</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  sheetHeader: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
    position: 'relative',
  },
  handleBar: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#C7C7CC',
  },
  closeBtn: {
    position: 'absolute',
    right: 16,
    top: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  heroSection: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  avatarBubble: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 40,
  },
  fullName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000000',
  },
  subText: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 4,
  },
  bioText: {
    fontSize: 14,
    color: '#3C3C43',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  editBtn: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#F2F2F7',
  },
  editBtnText: {
    color: '#007AFF',
    fontSize: 13,
    fontWeight: '500',
  },
  editForm: {
    width: '100%',
    marginTop: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 4,
    marginTop: 8,
  },
  avatarRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  avatarChoice: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    marginRight: 8,
  },
  activeAvatarChoice: {
    backgroundColor: '#E5F1FF',
    borderWidth: 1.5,
    borderColor: '#007AFF',
  },
  avatarChoiceText: {
    fontSize: 22,
  },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#000000',
  },
  editActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  cancelEditBtn: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelEditText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  saveEditBtn: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    alignItems: 'center',
  },
  saveEditText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statWidget: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  statLabel: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2,
    fontWeight: '500',
  },
  h2hCard: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  h2hTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
  },
  h2hScore: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginTop: 4,
  },
  h2hSub: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2,
  },
  otherActions: {
    gap: 10,
    marginBottom: 16,
  },
  challengeActionBtn: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  challengeActionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  messageActionBtn: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  messageActionText: {
    color: '#007AFF',
    fontSize: 15,
    fontWeight: '600',
  },
  logoutBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FFF2F2',
    alignItems: 'center',
    marginTop: 10,
  },
  logoutText: {
    color: '#FF3B30',
    fontSize: 15,
    fontWeight: '600',
  },
});
