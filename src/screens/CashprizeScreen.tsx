import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { Player, AdminSettings } from '../types';
import { CashprizeService, PrizeBreakdown } from '../services/cashprizeService';
import { AuthService } from '../services/authService';

interface Props {
  currentUser: Player;
  onWatchAd: () => void;
  onUserUpdated: (player: Player) => void;
}

export const CashprizeScreen: React.FC<Props> = ({
  currentUser,
  onWatchAd,
  onUserUpdated,
}) => {
  const [breakdown, setBreakdown] = useState<PrizeBreakdown | null>(null);
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const [players, sett] = await Promise.all([
      AuthService.getAllPlayers(),
      CashprizeService.getSettings(),
    ]);
    setSettings(sett);
    const prizes = CashprizeService.calculatePrizes(players, sett);
    setBreakdown(prizes);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const handleEnrollCashprize = async () => {
    try {
      const updated: Player = {
        ...currentUser,
        cashprizeEnrolled: true,
      };
      await AuthService.updatePlayer(updated);
      onUserUpdated(updated);
      Alert.alert(
        'Inscription enregistrée !',
        `Pour finaliser votre inscription au Cashprize, remettez ${settings?.cashprizeEntryFee || 10}€ en liquide à l'administrateur (Aurélien Reymond). Il débloquera votre statut sur l'application.`
      );
      await loadData();
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}
    >
      {/* Carte d'en-tête de la cagnotte */}
      <View style={styles.potCard}>
        <Text style={styles.potLabel}>💰 CAGNOTTE TOTALE DU CLUB</Text>
        <Text style={styles.potAmount}>
          {breakdown ? `${breakdown.totalPot.toFixed(2)} €` : '0.00 €'}
        </Text>
        <Text style={styles.potSub}>
          {breakdown?.paidParticipantsCount || 0} compétiteurs validés ({breakdown?.entryFee}€/joueur)
          • {breakdown?.adFundTotal.toFixed(2)}€ financés par les publicités Google Ads
        </Text>

        <TouchableOpacity style={styles.adFundBtn} onPress={onWatchAd}>
          <Text style={styles.adFundBtnText}>
            📺 Regarder une annonce (5s) pour ajouter +0.05 € à la cagnotte
          </Text>
        </TouchableOpacity>
      </View>

      {/* Statut de participation du joueur connecté */}
      <View style={styles.userStatusCard}>
        <Text style={styles.statusCardTitle}>Mon Statut Cashprize</Text>
        {currentUser.cashprizePaid ? (
          <View style={styles.statusPaidBox}>
            <Text style={styles.statusPaidIcon}>✅</Text>
            <View>
              <Text style={styles.statusPaidTitle}>Participation Validée !</Text>
              <Text style={styles.statusPaidDesc}>
                Paiement physique validé par l'admin. Vous êtes éligible pour remporter les récompenses en fin de saison.
              </Text>
            </View>
          </View>
        ) : currentUser.cashprizeEnrolled ? (
          <View style={styles.statusPendingBox}>
            <Text style={styles.statusPendingIcon}>⏳</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.statusPendingTitle}>Paiement en attente</Text>
              <Text style={styles.statusPendingDesc}>
                Donnez vos {settings?.cashprizeEntryFee || 10}€ en physique à Aurélien Reymond lors de la prochaine séance pour activer vos gains.
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.statusUnenrolledBox}>
            <Text style={styles.statusUnenrolledDesc}>
              Participez à la compétition avec mise en jeu pour tenter de décrocher l'un des trois prix à la fin de la saison ({settings?.cashprizeEntryFee || 10}€).
            </Text>
            <TouchableOpacity style={styles.enrollButton} onPress={handleEnrollCashprize}>
              <Text style={styles.enrollButtonText}>M'inscrire au Cashprize ({settings?.cashprizeEntryFee || 10}€)</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Répartition des 3 Prix */}
      <Text style={styles.sectionTitle}>🏆 Récompenses de Saison</Text>

      {breakdown?.prizes.map((p, idx) => (
        <View key={idx} style={styles.prizeCard}>
          <View style={styles.prizeHeader}>
            <View>
              <Text style={styles.prizeTitle}>{p.title}</Text>
              <Text style={styles.prizeDesc}>{p.description}</Text>
            </View>
            <View style={styles.prizeAmountBox}>
              <Text style={styles.prizeAmount}>{p.amount.toFixed(2)} €</Text>
              <Text style={styles.prizePercent}>{p.percentage}% du pot</Text>
            </View>
          </View>

          {p.currentLeader ? (
            <View style={styles.leaderRow}>
              <Text style={styles.leaderLabel}>Actuellement en tête :</Text>
              <Text style={styles.leaderName}>{p.currentLeader.name}</Text>
              <Text style={styles.leaderStat}>({p.currentLeader.statValue})</Text>
            </View>
          ) : (
            <Text style={styles.noLeader}>Aucun compétiteur validé</Text>
          )}
        </View>
      ))}

      <View style={styles.rulesBox}>
        <Text style={styles.rulesTitle}>ℹ️ Modalités du Cashprize Champibad</Text>
        <Text style={styles.rulesText}>
          • Les cotisations physiques sont centralisées par l'administrateur du club.{'\n'}
          • Les prix sont remis en main propre lors de la fête de fin de saison.{'\n'}
          • Chaque visionnage de pub Google Ads ajoute 0.05 € à la dotation générale sans coûter un centime aux joueurs !
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
  },
  potCard: {
    backgroundColor: '#0F172A',
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  potLabel: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  potAmount: {
    color: '#F8FAFC',
    fontSize: 38,
    fontWeight: '900',
    marginBottom: 6,
  },
  potSub: {
    color: '#94A3B8',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 16,
  },
  adFundBtn: {
    backgroundColor: '#059669',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#34D399',
    width: '100%',
    alignItems: 'center',
  },
  adFundBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  userStatusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  statusPaidBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  statusPaidIcon: {
    fontSize: 24,
  },
  statusPaidTitle: {
    color: '#166534',
    fontWeight: '800',
    fontSize: 13,
  },
  statusPaidDesc: {
    color: '#15803D',
    fontSize: 11,
    marginTop: 2,
  },
  statusPendingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  statusPendingIcon: {
    fontSize: 24,
  },
  statusPendingTitle: {
    color: '#92400E',
    fontWeight: '800',
    fontSize: 13,
  },
  statusPendingDesc: {
    color: '#B45309',
    fontSize: 11,
    marginTop: 2,
  },
  statusUnenrolledBox: {
    alignItems: 'center',
  },
  statusUnenrolledDesc: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 16,
  },
  enrollButton: {
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  enrollButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  prizeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  prizeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  prizeTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  prizeDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    maxWidth: 220,
  },
  prizeAmountBox: {
    alignItems: 'flex-end',
  },
  prizeAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: '#16A34A',
  },
  prizePercent: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
    gap: 6,
    flexWrap: 'wrap',
  },
  leaderLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  leaderName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  leaderStat: {
    fontSize: 11,
    color: '#0284C7',
    fontWeight: '700',
  },
  noLeader: {
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  rulesBox: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    marginBottom: 30,
  },
  rulesTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  rulesText: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 18,
  },
});
