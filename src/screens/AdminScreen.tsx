import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { AdminSettings, Player, ClubSlot } from '../types';
import { CashprizeService } from '../services/cashprizeService';
import { AuthService } from '../services/authService';
import { LicenseService } from '../services/licenseService';
import { SlotService } from '../services/slotService';

interface Props {
  currentUser: Player;
}

export const AdminScreen: React.FC<Props> = ({ currentUser }) => {
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [clubSlots, setClubSlots] = useState<ClubSlot[]>([]);
  const [syncingApi, setSyncingApi] = useState(false);
  const [saving, setSaving] = useState(false);

  // Formulaire d'ajout rapide d'un joueur
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newLicense, setNewLicense] = useState('');
  const [newElo, setNewElo] = useState('1200');

  // Modal de modération joueur
  const [moderatedPlayer, setModeratedPlayer] = useState<Player | null>(null);
  const [editEloSolo, setEditEloSolo] = useState('');
  const [suspendDays, setSuspendDays] = useState('7');
  const [suspendReason, setSuspendReason] = useState('Comportement antisportif');
  const [chatBanDays, setChatBanDays] = useState('7');
  const [targetBlockUserId, setTargetBlockUserId] = useState<string>('');

  // Formulaire d'ajout de créneau
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [newSlotDay, setNewSlotDay] = useState('Mardi');
  const [newSlotStart, setNewSlotStart] = useState('18:00');
  const [newSlotEnd, setNewSlotEnd] = useState('20:00');
  const [newSlotHasPeak, setNewSlotHasPeak] = useState(false);
  const [newSlotAllowedStart, setNewSlotAllowedStart] = useState('19:30');

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    const [sett, pList, sList] = await Promise.all([
      CashprizeService.getSettings(),
      AuthService.getAllPlayers(),
      SlotService.getClubSlots(),
    ]);
    setSettings(sett);
    setPlayers(pList);
    setClubSlots(sList);
  };

  const handleOpenModeration = (p: Player) => {
    setModeratedPlayer(p);
    setEditEloSolo(p.eloSolo.toString());
    setSuspendDays('7');
    setSuspendReason('Non-respect des règles du club');
    setChatBanDays('7');
    const firstOther = players.find((o) => o.id !== p.id);
    if (firstOther) setTargetBlockUserId(firstOther.id);
  };

  const handleApplyElo = async () => {
    if (!moderatedPlayer) return;
    const newEloVal = parseInt(editEloSolo, 10);
    if (isNaN(newEloVal) || newEloVal < 500 || newEloVal > 3000) {
      Alert.alert('Valeur invalide', 'Veuillez saisir un Elo compris entre 500 et 3000.');
      return;
    }
    const updated = await AuthService.adjustElo(moderatedPlayer.id, newEloVal);
    setPlayers(updated);
    const refreshed = updated.find((p) => p.id === moderatedPlayer.id) || null;
    setModeratedPlayer(refreshed);
    Alert.alert('Elo mis à jour', `Le classement Elo de ${moderatedPlayer.firstName} est maintenant de ${newEloVal}.`);
  };

  const handleSuspendPlayer = async () => {
    if (!moderatedPlayer) return;
    const days = parseInt(suspendDays, 10) || 7;
    const reason = suspendReason.trim() || 'Suspension temporaire';
    const updated = await AuthService.suspendPlayer(moderatedPlayer.id, days, reason);
    setPlayers(updated);
    const refreshed = updated.find((p) => p.id === moderatedPlayer.id) || null;
    setModeratedPlayer(refreshed);
    Alert.alert('Compte suspendu', `Le compte de ${moderatedPlayer.firstName} a été suspendu pour ${days} jours.`);
  };

  const handleUnsuspendPlayer = async () => {
    if (!moderatedPlayer) return;
    const updated = await AuthService.unsuspendPlayer(moderatedPlayer.id);
    setPlayers(updated);
    const refreshed = updated.find((p) => p.id === moderatedPlayer.id) || null;
    setModeratedPlayer(refreshed);
    Alert.alert('Suspension levée', `Le compte de ${moderatedPlayer.firstName} est de nouveau actif.`);
  };

  const handleBanChat = async () => {
    if (!moderatedPlayer) return;
    const days = parseInt(chatBanDays, 10) || 7;
    const updated = await AuthService.banPlayerFromChat(moderatedPlayer.id, days);
    setPlayers(updated);
    const refreshed = updated.find((p) => p.id === moderatedPlayer.id) || null;
    setModeratedPlayer(refreshed);
    Alert.alert('Chat bloqué', `L'accès au chat a été bloqué pour ${days} jours.`);
  };

  const handleUnbanChat = async () => {
    if (!moderatedPlayer) return;
    const updated = await AuthService.unbanPlayerFromChat(moderatedPlayer.id);
    setPlayers(updated);
    const refreshed = updated.find((p) => p.id === moderatedPlayer.id) || null;
    setModeratedPlayer(refreshed);
    Alert.alert('Chat débloqué', `L'accès au chat a été réactivé.`);
  };

  const handleBlockChatWithTarget = async () => {
    if (!moderatedPlayer || !targetBlockUserId) return;
    const updated = await AuthService.blockChatWithPlayer(moderatedPlayer.id, targetBlockUserId);
    setPlayers(updated);
    const refreshed = updated.find((p) => p.id === moderatedPlayer.id) || null;
    setModeratedPlayer(refreshed);
    Alert.alert('Restriction appliquée', 'Le chat entre ces deux joueurs est désormais bloqué.');
  };

  const handleUnblockChatWithTarget = async (otherId: string) => {
    if (!moderatedPlayer) return;
    const updated = await AuthService.unblockChatWithPlayer(moderatedPlayer.id, otherId);
    setPlayers(updated);
    const refreshed = updated.find((p) => p.id === moderatedPlayer.id) || null;
    setModeratedPlayer(refreshed);
    Alert.alert('Restriction levée', 'La restriction a été retirée.');
  };

  const handleAddPlayer = async () => {
    if (!newFirstName.trim() || !newLastName.trim() || !newLicense.trim()) {
      Alert.alert('Champs incomplets', 'Veuillez renseigner le prénom, le nom et le numéro de licence.');
      return;
    }

    const initialElo = parseInt(newElo, 10) || 1200;
    const cleanLicense = newLicense.trim();

    await LicenseService.addLicensee({
      id: cleanLicense,
      licenseNumber: cleanLicense,
      firstName: newFirstName.trim(),
      lastName: newLastName.trim(),
      gender: 'M',
      club: 'Champibad - Champigneulles',
      syncedAt: Date.now(),
    });

    const newPlayer: Player = {
      id: `user_${Date.now()}`,
      licenseNumber: cleanLicense,
      firstName: newFirstName.trim(),
      lastName: newLastName.trim(),
      email: `${newFirstName.trim().toLowerCase()}.${newLastName.trim().toLowerCase()}@champibad.fr`,
      role: 'PLAYER',
      eloSolo: initialElo,
      eloDouble: initialElo,
      matchesPlayed: 0,
      matchesWon: 0,
      matchesLost: 0,
      threeSetMatches: 0,
      currentStreak: 0,
      highestEloSolo: initialElo,
      badges: [],
      cashprizeEnrolled: false,
      cashprizePaid: false,
      friends: [],
      blockedUsers: [],
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
    };

    const updatedPlayers = await AuthService.addPlayerDirectly(newPlayer);
    setPlayers(updatedPlayers);

    setNewFirstName('');
    setNewLastName('');
    setNewLicense('');
    setNewElo('1200');

    Alert.alert('Joueur Ajouté !', `${newPlayer.firstName} ${newPlayer.lastName} fait maintenant partie du club.`);
  };

  const handleDeletePlayer = (player: Player) => {
    if (player.id === currentUser.id) {
      Alert.alert('Action impossible', 'Vous ne pouvez pas supprimer votre propre compte administrateur.');
      return;
    }

    Alert.alert(
      'Supprimer le compte',
      `Voulez-vous supprimer définitivement ${player.firstName} ${player.lastName} du club ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const updated = await AuthService.deletePlayer(player.id);
            setPlayers(updated);
            setModeratedPlayer(null);
          },
        },
      ]
    );
  };

  // Gestion des créneaux
  const handleToggleSlotActive = async (slot: ClubSlot) => {
    const updatedSlot = { ...slot, isActive: !slot.isActive };
    const updated = await SlotService.updateClubSlot(updatedSlot);
    setClubSlots(updated);
  };

  const handleDeleteSlot = (slot: ClubSlot) => {
    Alert.alert('Supprimer le créneau', `Supprimer le créneau du ${slot.dayName} (${slot.startTime}-${slot.endTime}) ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          const updated = await SlotService.deleteClubSlot(slot.id);
          setClubSlots(updated);
        },
      },
    ]);
  };

  const handleCreateSlot = async () => {
    if (!newSlotStart.trim() || !newSlotEnd.trim()) {
      Alert.alert('Erreur', 'Veuillez renseigner les heures de début et de fin.');
      return;
    }

    const dayMap: Record<string, number> = {
      Dimanche: 0,
      Lundi: 1,
      Mardi: 2,
      Mercredi: 3,
      Jeudi: 4,
      Vendredi: 5,
      Samedi: 6,
    };

    const newSlot = await SlotService.addClubSlot({
      dayOfWeek: dayMap[newSlotDay] ?? 2,
      dayName: newSlotDay,
      label: 'Jeu Libre & Défis',
      gymnasium: 'Gymnase de Champigneulles',
      startTime: newSlotStart.trim(),
      endTime: newSlotEnd.trim(),
      isActive: true,
      hasPeakHours: newSlotHasPeak,
      allowedMatchStartTime: newSlotHasPeak ? newSlotAllowedStart.trim() : undefined,
    });

    setClubSlots(newSlot);
    setShowAddSlot(false);
    Alert.alert('Créneau ajouté !', `Le créneau du ${newSlotDay} a été enregistré.`);
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    await CashprizeService.saveSettings(settings);
    setSaving(false);
    Alert.alert('Succès', 'Paramètres sauvegardés avec succès.');
  };

  const handleTriggerApiSync = async () => {
    if (!settings) return;
    setSyncingApi(true);
    try {
      const updatedList = await LicenseService.getLicensees(settings.licenseApiUrl, true);
      const newSettings = { ...settings, lastLicenseSyncTime: Date.now() };
      setSettings(newSettings);
      await CashprizeService.saveSettings(newSettings);
      Alert.alert(
        'Synchronisation réussie',
        `${updatedList.length} licenciés synchronisés avec succès depuis l'API FFBaD/Champibad.`
      );
    } catch (e: any) {
      Alert.alert('Erreur API', e.message);
    } finally {
      setSyncingApi(false);
    }
  };

  if (!settings) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Administration</Text>
      </View>

      {/* 1. Liste des Joueurs existants & Modération */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Membres du Club (Cliquez pour gérer)</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{players.length}</Text>
          </View>
        </View>

        {players.map((p, index) => {
          const isSuspended = p.suspendedUntil && p.suspendedUntil > Date.now();
          const isChatBanned = p.chatBannedUntil && p.chatBannedUntil > Date.now();

          return (
            <TouchableOpacity
              key={p.id}
              style={[
                styles.playerRow,
                index === players.length - 1 && styles.playerRowLast,
              ]}
              onPress={() => handleOpenModeration(p)}
              activeOpacity={0.7}
            >
              <View style={styles.playerInfo}>
                <View style={styles.playerNameRow}>
                  <Text style={styles.playerAvatar}>{p.avatarEmoji || '🏸'}</Text>
                  <Text style={styles.playerRowName}>
                    {p.firstName} {p.lastName}
                  </Text>
                  {p.role === 'ADMIN' && (
                    <View style={styles.adminMiniBadge}>
                      <Text style={styles.adminMiniBadgeText}>Admin</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.playerLicense}>
                  {p.eloSolo} Elo • Lic: {p.licenseNumber}
                </Text>
              </View>

              <View style={styles.badgesRow}>
                {isSuspended && (
                  <View style={styles.statusBadgeSuspended}>
                    <Text style={styles.statusBadgeText}>Suspendu</Text>
                  </View>
                )}
                {isChatBanned && (
                  <View style={styles.statusBadgeChatBanned}>
                    <Text style={styles.statusBadgeText}>Chat ban</Text>
                  </View>
                )}
                <Text style={styles.chevron}>›</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 2. Formulaire d'ajout rapide d'un joueur */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Inscrire un joueur manuellement</Text>

        <View style={styles.formRow}>
          <View style={styles.inputCol}>
            <Text style={styles.inputLabel}>Prénom</Text>
            <TextInput
              style={styles.input}
              placeholder="ex: Lucas"
              placeholderTextColor="#8E8E93"
              value={newFirstName}
              onChangeText={setNewFirstName}
            />
          </View>
          <View style={styles.inputCol}>
            <Text style={styles.inputLabel}>Nom</Text>
            <TextInput
              style={styles.input}
              placeholder="ex: Martin"
              placeholderTextColor="#8E8E93"
              value={newLastName}
              onChangeText={setNewLastName}
            />
          </View>
        </View>

        <View style={styles.formRow}>
          <View style={styles.inputCol}>
            <Text style={styles.inputLabel}>N° de Licence FFBaD</Text>
            <TextInput
              style={styles.input}
              placeholder="ex: 07891234"
              placeholderTextColor="#8E8E93"
              value={newLicense}
              onChangeText={setNewLicense}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.inputCol}>
            <Text style={styles.inputLabel}>Elo initial</Text>
            <TextInput
              style={styles.input}
              placeholder="1200"
              placeholderTextColor="#8E8E93"
              value={newElo}
              onChangeText={setNewElo}
              keyboardType="numeric"
            />
          </View>
        </View>

        <TouchableOpacity style={styles.addPlayerBtn} onPress={handleAddPlayer}>
          <Text style={styles.addPlayerText}>Ajouter au club</Text>
        </TouchableOpacity>
      </View>

      {/* 3. Personnalisation des Créneaux du Club */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Créneaux du Club Disponibles</Text>
          <TouchableOpacity
            style={styles.addSlotBtn}
            onPress={() => setShowAddSlot(!showAddSlot)}
            activeOpacity={0.7}
          >
            <Text style={styles.addSlotBtnText}>{showAddSlot ? 'Fermer' : '+ Ajouter'}</Text>
          </TouchableOpacity>
        </View>

        {showAddSlot && (
          <View style={styles.addSlotForm}>
            <Text style={styles.inputLabel}>Jour de la semaine</Text>
            <View style={styles.daySelectorRow}>
              {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.dayChoice, newSlotDay === d && styles.activeDayChoice]}
                  onPress={() => setNewSlotDay(d)}
                >
                  <Text style={[styles.dayChoiceText, newSlotDay === d && styles.activeDayChoiceText]}>
                    {d.slice(0, 3)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.formRow}>
              <View style={styles.inputCol}>
                <Text style={styles.inputLabel}>Heure Début</Text>
                <TextInput
                  style={styles.input}
                  value={newSlotStart}
                  onChangeText={setNewSlotStart}
                  placeholder="18:00"
                  placeholderTextColor="#8E8E93"
                />
              </View>
              <View style={styles.inputCol}>
                <Text style={styles.inputLabel}>Heure Fin</Text>
                <TextInput
                  style={styles.input}
                  value={newSlotEnd}
                  onChangeText={setNewSlotEnd}
                  placeholder="20:00"
                  placeholderTextColor="#8E8E93"
                />
              </View>
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Heure de pointe (défis restreints)</Text>
              <Switch
                value={newSlotHasPeak}
                onValueChange={setNewSlotHasPeak}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
              />
            </View>

            {newSlotHasPeak && (
              <View style={styles.formRow}>
                <View style={styles.inputCol}>
                  <Text style={styles.inputLabel}>Défis autorisés après :</Text>
                  <TextInput
                    style={styles.input}
                    value={newSlotAllowedStart}
                    onChangeText={setNewSlotAllowedStart}
                    placeholder="19:30"
                    placeholderTextColor="#8E8E93"
                  />
                </View>
              </View>
            )}

            <TouchableOpacity style={styles.saveSlotBtn} onPress={handleCreateSlot}>
              <Text style={styles.saveSlotBtnText}>Enregistrer le créneau</Text>
            </TouchableOpacity>
          </View>
        )}

        {clubSlots.map((s, idx) => (
          <View key={s.id || idx} style={styles.slotRow}>
            <View style={styles.slotInfo}>
              <Text style={styles.slotDayName}>
                {s.dayName} ({s.startTime} - {s.endTime})
              </Text>
              {s.hasPeakHours && (
                <Text style={styles.slotPeakNotice}>
                  ⚠️ Forte affluence : Défis dès {s.allowedMatchStartTime}
                </Text>
              )}
            </View>

            <View style={styles.slotActions}>
              <Switch
                value={s.isActive}
                onValueChange={() => handleToggleSlotActive(s)}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
              />
              <TouchableOpacity onPress={() => handleDeleteSlot(s)} style={styles.slotDeleteBtn}>
                <Text style={styles.slotDeleteText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* 4. Synchronisation API des licenciés */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Synchronisation API des licenciés</Text>

        <Text style={styles.inputLabel}>URL de l'API / Webhook du club</Text>
        <TextInput
          style={styles.input}
          value={settings.licenseApiUrl}
          onChangeText={(v) => setSettings({ ...settings, licenseApiUrl: v })}
          autoCapitalize="none"
          placeholder="https://votre-club.fr/api/licencies"
          placeholderTextColor="#8E8E93"
        />

        <TouchableOpacity
          style={[styles.syncBtn, syncingApi && styles.btnDisabled]}
          disabled={syncingApi}
          onPress={handleTriggerApiSync}
        >
          {syncingApi ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.syncBtnText}>Synchroniser les licenciés</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Bouton de sauvegarde */}
      <TouchableOpacity
        style={[styles.saveAllBtn, saving && styles.btnDisabled]}
        disabled={saving}
        onPress={handleSaveSettings}
      >
        <Text style={styles.saveAllText}>{saving ? 'Sauvegarde...' : 'Sauvegarder les paramètres'}</Text>
      </TouchableOpacity>

      {/* MODAL DE MODÉRATION ET D'AJUSTEMENT JOUEUR */}
      <Modal visible={!!moderatedPlayer} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.moderationCard}>
            {moderatedPlayer && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modHeader}>
                  <Text style={styles.modAvatar}>{moderatedPlayer.avatarEmoji || '🏸'}</Text>
                  <Text style={styles.modName}>
                    {moderatedPlayer.firstName} {moderatedPlayer.lastName}
                  </Text>
                  <Text style={styles.modSub}>Licence n° {moderatedPlayer.licenseNumber}</Text>
                </View>

                {/* 1. Ajustement d'Elo */}
                <View style={styles.modSection}>
                  <Text style={styles.modSectionTitle}>Ajuster le classement Elo</Text>
                  <View style={styles.formRow}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      keyboardType="numeric"
                      value={editEloSolo}
                      onChangeText={setEditEloSolo}
                      placeholder="Nouveau score Elo"
                      placeholderTextColor="#8E8E93"
                    />
                    <TouchableOpacity style={styles.modApplyBtn} onPress={handleApplyElo}>
                      <Text style={styles.modApplyBtnText}>Appliquer</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* 2. Suspension de Compte */}
                <View style={styles.modSection}>
                  <Text style={styles.modSectionTitle}>Suspension de Compte</Text>
                  {moderatedPlayer.suspendedUntil && moderatedPlayer.suspendedUntil > Date.now() ? (
                    <View style={styles.activeBanCard}>
                      <Text style={styles.activeBanText}>
                        Compte suspendu jusqu'au {new Date(moderatedPlayer.suspendedUntil).toLocaleDateString('fr-FR')}.
                      </Text>
                      {moderatedPlayer.suspensionReason && (
                        <Text style={styles.activeBanReason}>Raison : {moderatedPlayer.suspensionReason}</Text>
                      )}
                      <TouchableOpacity style={styles.unbanBtn} onPress={handleUnsuspendPlayer}>
                        <Text style={styles.unbanBtnText}>Lever la suspension</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View>
                      <View style={styles.formRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.inputLabel}>Durée (jours)</Text>
                          <TextInput
                            style={styles.input}
                            keyboardType="numeric"
                            value={suspendDays}
                            onChangeText={setSuspendDays}
                          />
                        </View>
                      </View>
                      <Text style={styles.inputLabel}>Raison de la suspension</Text>
                      <TextInput
                        style={styles.input}
                        value={suspendReason}
                        onChangeText={setSuspendReason}
                        placeholder="ex: Comportement antisportif"
                        placeholderTextColor="#8E8E93"
                      />
                      <TouchableOpacity style={styles.suspendBtn} onPress={handleSuspendPlayer}>
                        <Text style={styles.suspendBtnText}>Suspendre le compte</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {/* 3. Blocage de Chat */}
                <View style={styles.modSection}>
                  <Text style={styles.modSectionTitle}>Modération du Chat</Text>
                  {moderatedPlayer.chatBannedUntil && moderatedPlayer.chatBannedUntil > Date.now() ? (
                    <View style={styles.activeBanCard}>
                      <Text style={styles.activeBanText}>
                        Chat banni jusqu'au {new Date(moderatedPlayer.chatBannedUntil).toLocaleDateString('fr-FR')}.
                      </Text>
                      <TouchableOpacity style={styles.unbanBtn} onPress={handleUnbanChat}>
                        <Text style={styles.unbanBtnText}>Réactiver le chat</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.formRow}>
                      <TextInput
                        style={[styles.input, { flex: 1 }]}
                        keyboardType="numeric"
                        value={chatBanDays}
                        onChangeText={setChatBanDays}
                        placeholder="Jours"
                        placeholderTextColor="#8E8E93"
                      />
                      <TouchableOpacity style={styles.chatBanBtn} onPress={handleBanChat}>
                        <Text style={styles.chatBanBtnText}>Bannir du chat</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Restreindre avec un membre spécifique */}
                  <Text style={[styles.inputLabel, { marginTop: 10 }]}>Restreindre chat avec un joueur précis :</Text>
                  <View style={styles.formRow}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                      {players
                        .filter((p) => p.id !== moderatedPlayer.id)
                        .map((p) => {
                          const isSelected = targetBlockUserId === p.id;
                          return (
                            <TouchableOpacity
                              key={p.id}
                              style={[styles.miniChip, isSelected && styles.miniChipActive]}
                              onPress={() => setTargetBlockUserId(p.id)}
                            >
                              <Text style={[styles.miniChipText, isSelected && styles.miniChipTextActive]}>
                                {p.firstName}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                    </ScrollView>
                  </View>
                  <TouchableOpacity style={styles.restrictBtn} onPress={handleBlockChatWithTarget}>
                    <Text style={styles.restrictBtnText}>Bloquer la discussion avec ce joueur</Text>
                  </TouchableOpacity>

                  {/* Liste des restrictions individuelles existantes */}
                  {moderatedPlayer.blockedChatUserIds && moderatedPlayer.blockedChatUserIds.length > 0 && (
                    <View style={{ marginTop: 10 }}>
                      <Text style={styles.inputLabel}>Discussions actuellement bloquées :</Text>
                      {moderatedPlayer.blockedChatUserIds.map((bid) => {
                        const blockedP = players.find((p) => p.id === bid);
                        return (
                          <View key={bid} style={styles.blockedUserRow}>
                            <Text style={styles.blockedUserName}>
                              {blockedP ? `${blockedP.firstName} ${blockedP.lastName}` : bid}
                            </Text>
                            <TouchableOpacity onPress={() => handleUnblockChatWithTarget(bid)}>
                              <Text style={styles.unblockText}>Débloquer</Text>
                            </TouchableOpacity>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>

                {/* 4. Action de suppression */}
                <View style={[styles.modSection, { borderBottomWidth: 0 }]}>
                  <TouchableOpacity
                    style={styles.deleteAccountBtn}
                    onPress={() => handleDeletePlayer(moderatedPlayer)}
                  >
                    <Text style={styles.deleteAccountText}>Supprimer définitivement ce joueur</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.closeModBtn}
                  onPress={() => setModeratedPlayer(null)}
                >
                  <Text style={styles.closeModText}>Fermer</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.5,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  countBadge: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  countText: {
    color: '#8E8E93',
    fontWeight: '600',
    fontSize: 12,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  inputCol: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#000000',
  },
  addPlayerBtn: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  addPlayerText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  playerRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 2,
  },
  playerInfo: {
    flex: 1,
  },
  playerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  playerAvatar: {
    fontSize: 16,
  },
  playerRowName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000000',
  },
  adminMiniBadge: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  adminMiniBadgeText: {
    color: '#007AFF',
    fontSize: 10,
    fontWeight: '600',
  },
  playerLicense: {
    fontSize: 12,
    color: '#8E8E93',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusBadgeSuspended: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeChatBanned: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#DC2626',
  },
  chevron: {
    fontSize: 18,
    color: '#C7C7CC',
    marginLeft: 4,
  },
  addSlotBtn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  addSlotBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  addSlotForm: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  daySelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  dayChoice: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  activeDayChoice: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  dayChoiceText: {
    fontSize: 12,
    color: '#1C1C1E',
  },
  activeDayChoiceText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.08)',
    marginBottom: 10,
  },
  switchLabel: {
    fontSize: 14,
    color: '#000000',
  },
  saveSlotBtn: {
    backgroundColor: '#34C759',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  saveSlotBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  slotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  slotInfo: {
    flex: 1,
  },
  slotDayName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  slotPeakNotice: {
    fontSize: 11,
    color: '#FF9500',
    marginTop: 2,
  },
  slotActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  slotDeleteBtn: {
    padding: 6,
  },
  slotDeleteText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
  syncBtn: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  syncBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  saveAllBtn: {
    backgroundColor: '#34C759',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  saveAllText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  moderationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    width: '100%',
    maxWidth: 420,
    maxHeight: '90%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  modHeader: {
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    paddingBottom: 14,
  },
  modAvatar: {
    fontSize: 40,
    marginBottom: 6,
  },
  modName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  modSub: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  modSection: {
    marginBottom: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.08)',
    paddingBottom: 14,
  },
  modSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  modApplyBtn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modApplyBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  activeBanCard: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 10,
    marginVertical: 4,
  },
  activeBanText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
  },
  activeBanReason: {
    fontSize: 11,
    color: '#991B1B',
    marginTop: 2,
  },
  unbanBtn: {
    backgroundColor: '#DC2626',
    borderRadius: 6,
    paddingVertical: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  unbanBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  suspendBtn: {
    backgroundColor: '#FF3B30',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  suspendBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  chatBanBtn: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 12,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatBanBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  miniChip: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginRight: 6,
  },
  miniChipActive: {
    backgroundColor: '#007AFF',
  },
  miniChipText: {
    fontSize: 12,
    color: '#1C1C1E',
  },
  miniChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  restrictBtn: {
    backgroundColor: '#F2F2F7',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  restrictBtnText: {
    color: '#1C1C1E',
    fontSize: 12,
    fontWeight: '500',
  },
  blockedUserRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  blockedUserName: {
    fontSize: 12,
    color: '#374151',
  },
  unblockText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  deleteAccountBtn: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
  },
  deleteAccountText: {
    color: '#E11D48',
    fontWeight: '600',
    fontSize: 13,
  },
  closeModBtn: {
    backgroundColor: '#F2F2F7',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  closeModText: {
    color: '#1C1C1E',
    fontWeight: '600',
    fontSize: 14,
  },
});
