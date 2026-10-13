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
  const [slots, setSlots] = useState<ClubSlot[]>([]);
  const [syncingApi, setSyncingApi] = useState(false);
  const [saving, setSaving] = useState(false);

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
    setSlots(sList);
  };

  const handleTogglePhysicalPayment = async (targetPlayer: Player) => {
    const updatedStatus = !targetPlayer.cashprizePaid;
    const updated: Player = {
      ...targetPlayer,
      cashprizePaid: updatedStatus,
      cashprizeEnrolled: true,
    };

    await AuthService.updatePlayer(updated);
    setPlayers((prev) => prev.map((p) => (p.id === targetPlayer.id ? updated : p)));
    Alert.alert(
      updatedStatus ? 'Paiement Validé' : 'Paiement Annulé',
      `${targetPlayer.firstName} ${targetPlayer.lastName} est maintenant ${
        updatedStatus ? 'éligible aux récompenses de la cagnotte' : 'non validé'
      }.`
    );
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    await CashprizeService.saveSettings(settings);
    setSaving(false);
    Alert.alert('Succès', 'Paramètres administrateur sauvegardés.');
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
        'Synchronisation terminée',
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
      'Voulez-vous clôturer la saison actuelle et archiver les résultats du Cashprize ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Saison clôturée',
              'Les snapshots ont été archivés. Vous pouvez démarrer la Saison 2 !'
            );
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
        <Text style={styles.headerTitle}>🛡️ Panel Super-Administrateur</Text>
        <Text style={styles.headerSubtitle}>
          Accès exclusif réservé à {settings.adminEmail}
        </Text>
      </View>

      {/* 1. Mode Cashprize & Validations physiques */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>💰 Mode Cashprize & Validations Physiques</Text>
        <Text style={styles.sectionDesc}>
          Débloquez l'accès aux récompenses lorsque les membres vous remettent leur cotisation en espèces.
        </Text>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Activer le Cashprize sur la saison :</Text>
          <Switch
            value={settings.cashprizeEnabled}
            onValueChange={(val) => setSettings({ ...settings, cashprizeEnabled: val })}
          />
        </View>

        <Text style={styles.inputLabel}>Montant de participation demandé (X €) :</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={settings.cashprizeEntryFee.toString()}
          onChangeText={(v) =>
            setSettings({ ...settings, cashprizeEntryFee: parseFloat(v) || 0 })
          }
        />

        {/* Liste des membres pour validation physique */}
        <Text style={[styles.inputLabel, { marginTop: 14 }]}>
          Validation des cotisations reçues en main propre :
        </Text>

        {players.map((p) => (
          <View key={p.id} style={styles.playerValidationRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.playerRowName}>
                {p.firstName} {p.lastName}
              </Text>
              <Text style={styles.playerRowStatus}>
                {p.cashprizePaid
                  ? '✅ Cotisation réglée en liquide'
                  : p.cashprizeEnrolled
                  ? '⏳ En attente de paiement physique'
                  : '⚪ Non inscrit'}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.validatePayBtn,
                p.cashprizePaid && styles.validatePayBtnActive,
              ]}
              onPress={() => handleTogglePhysicalPayment(p)}
            >
              <Text
                style={[
                  styles.validatePayText,
                  p.cashprizePaid && styles.validatePayTextActive,
                ]}
              >
                {p.cashprizePaid ? 'Payé ✓' : 'Valider réception'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* 2. Écarts de niveau & Mode Pénalité / Handicaps */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>⚖️ Règles d'Écart de Niveau & Handicaps</Text>
        <Text style={styles.sectionDesc}>
          Configurez les pénalités appliquées lorsque deux compétiteurs ont un grand écart d'Elo.
        </Text>

        <Text style={styles.inputLabel}>Seuil d'écart d'Elo max recommandé :</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={settings.maxEloGapForDirectMatch.toString()}
          onChangeText={(v) =>
            setSettings({ ...settings, maxEloGapForDirectMatch: parseInt(v, 10) || 0 })
          }
        />

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Mode Handicap activé :</Text>
          <Switch
            value={settings.handicapModeEnabled}
            onValueChange={(val) => setSettings({ ...settings, handicapModeEnabled: val })}
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Autoriser restriction terrain ("Sans les couloirs") :</Text>
          <Switch
            value={settings.allowCourtRestriction}
            onValueChange={(val) => setSettings({ ...settings, allowCourtRestriction: val })}
          />
        </View>

        <Text style={styles.inputLabel}>Points de pénalité au départ (-X pts) :</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={settings.handicapPointsDelta.toString()}
          onChangeText={(v) =>
            setSettings({ ...settings, handicapPointsDelta: parseInt(v, 10) || 0 })
          }
        />
      </View>

      {/* 3. Synchronisation API des licenciés */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>🔄 Synchronisation API des Licenciés</Text>
        <Text style={styles.sectionDesc}>
          Synchronise automatiquement le fichier des licenciés de Champibad toutes les heures.
        </Text>

        <Text style={styles.inputLabel}>URL de l'API / Webhook du club :</Text>
        <TextInput
          style={styles.input}
          value={settings.licenseApiUrl}
          onChangeText={(v) => setSettings({ ...settings, licenseApiUrl: v })}
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={[styles.syncBtn, syncingApi && styles.btnDisabled]}
          disabled={syncingApi}
          onPress={handleTriggerApiSync}
        >
          {syncingApi ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.syncBtnText}>🔄 Forcer la synchronisation immédiate</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* 4. Gestion des Saisons */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>🏆 Gestion des Saisons (1 à 2 saisons / an)</Text>
        <Text style={styles.sectionDesc}>
          Clôturez la saison actuelle pour figer le classement, désigner les gagnants et archiver l'historique.
        </Text>

        <TouchableOpacity style={styles.archiveBtn} onPress={handleArchiveSeason}>
          <Text style={styles.archiveBtnText}>Clôturer la Saison 1 & Archiver</Text>
        </TouchableOpacity>
      </View>

      {/* Bouton d'enregistrement global */}
      <TouchableOpacity
        style={[styles.saveAllBtn, saving && styles.btnDisabled]}
        disabled={saving}
        onPress={handleSaveSettings}
      >
        <Text style={styles.saveAllText}>💾 Enregistrer toutes les modifications</Text>
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
    backgroundColor: '#7F1D1D',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DC2626',
  },
  headerTitle: {
    color: '#FEF2F2',
    fontSize: 18,
    fontWeight: '900',
  },
  headerSubtitle: {
    color: '#FCA5A5',
    fontSize: 11,
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  sectionDesc: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 14,
    lineHeight: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  switchLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    maxWidth: 240,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginTop: 10,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    backgroundColor: '#F8FAFC',
    color: '#0F172A',
  },
  playerValidationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 10,
  },
  playerRowName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  playerRowStatus: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  validatePayBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  validatePayBtnActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  validatePayText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  validatePayTextActive: {
    color: '#166534',
  },
  syncBtn: {
    backgroundColor: '#0284C7',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  syncBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  archiveBtn: {
    backgroundColor: '#B91C1C',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  archiveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  saveAllBtn: {
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
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
