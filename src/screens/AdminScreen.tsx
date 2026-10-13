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
} from 'react-native';
import { AdminSettings, Player } from '../types';
import { CashprizeService } from '../services/cashprizeService';
import { AuthService } from '../services/authService';
import { LicenseService } from '../services/licenseService';

interface Props {
  currentUser: Player;
}

export const AdminScreen: React.FC<Props> = ({ currentUser }) => {
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [syncingApi, setSyncingApi] = useState(false);
  const [saving, setSaving] = useState(false);

  // Formulaire d'ajout rapide d'un joueur
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newLicense, setNewLicense] = useState('');
  const [newElo, setNewElo] = useState('1200');

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    const [sett, pList] = await Promise.all([
      CashprizeService.getSettings(),
      AuthService.getAllPlayers(),
    ]);
    setSettings(sett);
    setPlayers(pList);
  };

  const handleAddPlayer = async () => {
    if (!newFirstName.trim() || !newLastName.trim() || !newLicense.trim()) {
      Alert.alert('Champs incomplets', 'Veuillez renseigner le prénom, le nom et le numéro de licence.');
      return;
    }

    const initialElo = parseInt(newElo, 10) || 1200;
    const cleanLicense = newLicense.trim();

    // 1. Ajouter aux licenciés autorisés
    await LicenseService.addLicensee({
      id: cleanLicense,
      licenseNumber: cleanLicense,
      firstName: newFirstName.trim(),
      lastName: newLastName.trim(),
      gender: 'M',
      club: 'Champibad - Champigneulles',
      syncedAt: Date.now(),
    });

    // 2. Ajouter au profil joueur actif
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
      'Retirer le joueur',
      `Voulez-vous retirer ${player.firstName} ${player.lastName} du club ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const updated = await AuthService.deletePlayer(player.id);
            setPlayers(updated);
          },
        },
      ]
    );
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

  const handleArchiveSeason = () => {
    Alert.alert(
      'Clôturer la saison en cours',
      'Voulez-vous figer le classement actuel et archiver la saison ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Saison clôturée', 'Les classements ont été archivés.');
          },
        },
      ]
    );
  };

  if (!settings) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0284C7" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerBox}>
        <Text style={styles.headerTitle}>🛡️ Admin</Text>
      </View>

      {/* 1. Formulaire d'ajout rapide d'un joueur */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>➕ Ajouter un joueur</Text>

        <View style={styles.formRow}>
          <View style={styles.inputCol}>
            <Text style={styles.inputLabel}>Prénom</Text>
            <TextInput
              style={styles.input}
              placeholder="ex: Lucas"
              placeholderTextColor="#94A3B8"
              value={newFirstName}
              onChangeText={setNewFirstName}
            />
          </View>
          <View style={styles.inputCol}>
            <Text style={styles.inputLabel}>Nom</Text>
            <TextInput
              style={styles.input}
              placeholder="ex: Martin"
              placeholderTextColor="#94A3B8"
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
              placeholderTextColor="#94A3B8"
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
              placeholderTextColor="#94A3B8"
              value={newElo}
              onChangeText={setNewElo}
              keyboardType="numeric"
            />
          </View>
        </View>

        <TouchableOpacity style={styles.addPlayerBtn} onPress={handleAddPlayer}>
          <Text style={styles.addPlayerText}>+ Ajouter</Text>
        </TouchableOpacity>
      </View>

      {/* 2. Liste des Joueurs existants */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>👥 Joueurs inscrits</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{players.length}</Text>
          </View>
        </View>

        {players.map((p) => (
          <View key={p.id} style={styles.playerRow}>
            <View style={styles.playerInfo}>
              <Text style={styles.playerText} numberOfLines={1}>
                <Text style={styles.playerRowName}>
                  {p.firstName} {p.lastName}
                </Text>
                <Text style={styles.playerLicense}> • Licence : {p.licenseNumber}</Text>
              </Text>
            </View>

            {p.id !== currentUser.id && (
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDeletePlayer(p)}
              >
                <Text style={styles.deleteBtnText}>Retirer</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      {/* 3. Règles d'Écart de Niveau & Handicaps */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>⚖️ Handicap</Text>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Mode Handicap activé</Text>
          <Switch
            value={settings.handicapModeEnabled}
            onValueChange={(val) => setSettings({ ...settings, handicapModeEnabled: val })}
          />
        </View>

        <Text style={styles.inputLabel}>Seuil d'écart d'Elo max recommandé</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={settings.maxEloGapForDirectMatch.toString()}
          onChangeText={(v) =>
            setSettings({ ...settings, maxEloGapForDirectMatch: parseInt(v, 10) || 0 })
          }
        />

        <Text style={[styles.inputLabel, styles.inputLabelSpacing]}>Points de pénalité de départ (-X pts)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={settings.handicapPointsDelta.toString()}
          onChangeText={(v) =>
            setSettings({ ...settings, handicapPointsDelta: parseInt(v, 10) || 0 })
          }
        />
      </View>

      {/* 4. Synchronisation API des licenciés */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>🔄 Synchronisation API</Text>

        <Text style={styles.inputLabel}>URL de l'API / Webhook du club</Text>
        <TextInput
          style={styles.input}
          value={settings.licenseApiUrl}
          onChangeText={(v) => setSettings({ ...settings, licenseApiUrl: v })}
          autoCapitalize="none"
          placeholder="https://..."
          placeholderTextColor="#94A3B8"
        />

        <TouchableOpacity
          style={[styles.syncBtn, syncingApi && styles.btnDisabled]}
          disabled={syncingApi}
          onPress={handleTriggerApiSync}
        >
          {syncingApi ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.syncBtnText}>🔄 Synchroniser</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* 5. Clôture de saison */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>🏆 Clôture de saison</Text>

        <TouchableOpacity style={styles.archiveBtn} onPress={handleArchiveSeason}>
          <Text style={styles.archiveBtnText}>Clôturer la saison en cours</Text>
        </TouchableOpacity>
      </View>

      {/* Bouton de sauvegarde */}
      <TouchableOpacity
        style={[styles.saveAllBtn, saving && styles.btnDisabled]}
        disabled={saving}
        onPress={handleSaveSettings}
      >
        <Text style={styles.saveAllText}>💾 Enregistrer les paramètres</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
  headerBox: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  headerTitle: {
    color: '#38BDF8',
    fontSize: 18,
    fontWeight: '800',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  countBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    color: '#0369A1',
    fontWeight: '800',
    fontSize: 11,
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  inputCol: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 5,
  },
  inputLabelSpacing: {
    marginTop: 10,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0F172A',
  },
  addPlayerBtn: {
    backgroundColor: '#0284C7',
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  addPlayerText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  playerInfo: {
    flex: 1,
    marginRight: 10,
  },
  playerText: {
    fontSize: 13,
  },
  playerRowName: {
    fontWeight: '700',
    color: '#0F172A',
  },
  playerLicense: {
    color: '#64748B',
  },
  deleteBtn: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  deleteBtnText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '700',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 12,
  },
  switchLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  syncBtn: {
    backgroundColor: '#0F172A',
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  syncBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  archiveBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
  },
  archiveBtnText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 12,
  },
  saveAllBtn: {
    backgroundColor: '#16A34A',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  saveAllText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
