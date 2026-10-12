import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Match, MatchSet, Player, ClubSlot } from '../types';
import { MatchService } from '../services/matchService';
import { AuthService } from '../services/authService';
import { SlotService } from '../services/slotService';
import { EloService } from '../services/eloService';
import { MatchCard } from '../components/MatchCard';

interface Props {
  currentUser: Player;
  onMatchValidated: () => void;
  targetOpponent?: Player | null;
  onClearTargetOpponent?: () => void;
}

export const MatchesScreen: React.FC<Props> = ({
  currentUser,
  onMatchValidated,
  targetOpponent,
  onClearTargetOpponent,
}) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [clubSlots, setClubSlots] = useState<ClubSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'VALIDATED'>('ALL');

  // Modal Saisie de Score
  const [selectedMatchForScore, setSelectedMatchForScore] = useState<Match | null>(null);
  const [s1P1, setS1P1] = useState('21');
  const [s1P2, setS1P2] = useState('18');
  const [s2P1, setS2P1] = useState('19');
  const [s2P2, setS2P2] = useState('21');
  const [s3P1, setS3P1] = useState('21');
  const [s3P2, setS3P2] = useState('16');
  const [hasThirdSet, setHasThirdSet] = useState(true);

  // Modal Nouveau Défi
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [selectedOpponentId, setSelectedOpponentId] = useState<string>('');
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [commonSlots, setCommonSlots] = useState<any[]>([]);

  const loadData = async () => {
    setLoading(true);
    const [mList, pList, sList] = await Promise.all([
      MatchService.getMatchesForPlayer(currentUser.id),
      AuthService.getAllPlayers(),
      SlotService.getClubSlots(),
    ]);
    setMatches(mList);
    setAllPlayers(pList);
    setClubSlots(sList);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  useEffect(() => {
    if (targetOpponent) {
      setSelectedOpponentId(targetOpponent.id);
      setShowChallengeModal(true);
      SlotService.findCommonSlots(currentUser.id, targetOpponent.id).then((res) => {
        setCommonSlots(res);
        if (res.length > 0) setSelectedSlotId(res[0].slot.id);
      });
    }
  }, [targetOpponent]);

  const handleValidateScore = async (matchId: string) => {
    const match = matches.find((m) => m.id === matchId);
    if (!match) return;

    const p1 = allPlayers.find((p) => p.id === match.player1Id);
    const p2 = allPlayers.find((p) => p.id === match.player2Id);
    if (!p1 || !p2) return;

    try {
      const { updatedP1, updatedP2 } = await MatchService.validateScore(matchId, p1, p2);
      await AuthService.updatePlayer(updatedP1);
      await AuthService.updatePlayer(updatedP2);
      Alert.alert(
        'Match validé ! 🏸',
        'Les nouveaux classements Elos ont été mis à jour immédiatement.'
      );
      await loadData();
      onMatchValidated();
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    }
  };

  const handleContestScore = async (matchId: string) => {
    try {
      await MatchService.contestScore(matchId);
      Alert.alert('Match contesté', 'Le résultat a été mis en litige pour vérification.');
      await loadData();
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    }
  };

  const handleConfirmSubmitScores = async () => {
    if (!selectedMatchForScore) return;

    const sets: MatchSet[] = [
      {
        setNumber: 1,
        player1Score: parseInt(s1P1, 10) || 0,
        player2Score: parseInt(s1P2, 10) || 0,
      },
      {
        setNumber: 2,
        player1Score: parseInt(s2P1, 10) || 0,
        player2Score: parseInt(s2P2, 10) || 0,
      },
    ];

    if (hasThirdSet) {
      sets.push({
        setNumber: 3,
        player1Score: parseInt(s3P1, 10) || 0,
        player2Score: parseInt(s3P2, 10) || 0,
      });
    }

    try {
      await MatchService.submitScore(selectedMatchForScore.id, sets, currentUser.id);
      setSelectedMatchForScore(null);
      Alert.alert(
        'Score soumis !',
        'L\'adversaire doit maintenant valider ou contester le score.'
      );
      await loadData();
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    }
  };

  const handleCreateChallenge = async () => {
    if (!selectedOpponentId) {
      Alert.alert('Adversaire requis', 'Veuillez sélectionner un adversaire.');
      return;
    }

    const opponent = allPlayers.find((p) => p.id === selectedOpponentId);
    if (!opponent) return;

    const handicapEval = EloService.evaluateHandicap(
      currentUser.eloSolo,
      opponent.eloSolo,
      300
    );

    const slot = clubSlots.find((s) => s.id === selectedSlotId);

    try {
      await MatchService.createChallenge({
        seasonId: 'season_1_2026',
        mode: 'SOLO',
        player1Id: currentUser.id,
        player2Id: opponent.id,
        scheduledSlotId: slot?.id,
        scheduledDate: slot?.dayName,
        scheduledTime: slot?.hasPeakHours ? slot.allowedMatchStartTime : slot?.startTime,
        handicapApplied: handicapEval.suggestedHandicap,
        handicapDetails: handicapEval.details,
        sets: [],
      });

      setShowChallengeModal(false);
      if (onClearTargetOpponent) onClearTargetOpponent();
      Alert.alert('Défi envoyé !', `Votre défi contre ${opponent.firstName} a été créé.`);
      await loadData();
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    }
  };

  const filteredMatches = matches.filter((m) => {
    if (filter === 'PENDING') return m.status === 'PENDING_VALIDATION';
    if (filter === 'VALIDATED') return m.status === 'VALIDATED';
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Barre d'action & Filtres */}
      <View style={styles.headerBar}>
        <View style={styles.filtersRow}>
          <TouchableOpacity
            style={[styles.filterBtn, filter === 'ALL' && styles.activeFilterBtn]}
            onPress={() => setFilter('ALL')}
          >
            <Text style={[styles.filterText, filter === 'ALL' && styles.activeFilterText]}>
              Tous ({matches.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterBtn, filter === 'PENDING' && styles.activeFilterBtn]}
            onPress={() => setFilter('PENDING')}
          >
            <Text style={[styles.filterText, filter === 'PENDING' && styles.activeFilterText]}>
              À valider
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterBtn, filter === 'VALIDATED' && styles.activeFilterBtn]}
            onPress={() => setFilter('VALIDATED')}
          >
            <Text style={[styles.filterText, filter === 'VALIDATED' && styles.activeFilterText]}>
              Validés
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.newChallengeBtn}
          onPress={() => setShowChallengeModal(true)}
        >
          <Text style={styles.newChallengeText}>+ Proposer un défi</Text>
        </TouchableOpacity>
      </View>

      {/* Liste des cartes de match */}
      <FlatList
        data={filteredMatches}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🏸</Text>
            <Text style={styles.emptyTitle}>Aucun match trouvé</Text>
            <Text style={styles.emptySubtitle}>
              Proposez un défi à un membre du club pour lancer la compétition !
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <MatchCard
            match={item}
            currentUser={currentUser}
            allPlayers={allPlayers}
            onValidate={handleValidateScore}
            onContest={handleContestScore}
            onSubmitScores={(m) => setSelectedMatchForScore(m)}
          />
        )}
      />

      {/* Modal de déclaration des scores */}
      <Modal visible={!!selectedMatchForScore} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.scoreModalCard}>
            <Text style={styles.modalTitle}>Saisie du Score du Match</Text>
            <Text style={styles.modalSubtitle}>
              Indiquez les scores des sets pour transmission à l'adversaire.
            </Text>

            {/* Set 1 */}
            <View style={styles.setRowInput}>
              <Text style={styles.setLabel}>Set 1 :</Text>
              <TextInput
                style={styles.scoreInput}
                value={s1P1}
                onChangeText={setS1P1}
                keyboardType="numeric"
              />
              <Text style={styles.setDash}>-</Text>
              <TextInput
                style={styles.scoreInput}
                value={s1P2}
                onChangeText={setS1P2}
                keyboardType="numeric"
              />
            </View>

            {/* Set 2 */}
            <View style={styles.setRowInput}>
              <Text style={styles.setLabel}>Set 2 :</Text>
              <TextInput
                style={styles.scoreInput}
                value={s2P1}
                onChangeText={setS2P1}
                keyboardType="numeric"
              />
              <Text style={styles.setDash}>-</Text>
              <TextInput
                style={styles.scoreInput}
                value={s2P2}
                onChangeText={setS2P2}
                keyboardType="numeric"
              />
            </View>

            {/* Set 3 optionnel */}
            {hasThirdSet && (
              <View style={styles.setRowInput}>
                <Text style={styles.setLabel}>Set 3 :</Text>
                <TextInput
                  style={styles.scoreInput}
                  value={s3P1}
                  onChangeText={setS3P1}
                  keyboardType="numeric"
                />
                <Text style={styles.setDash}>-</Text>
                <TextInput
                  style={styles.scoreInput}
                  value={s3P2}
                  onChangeText={setS3P2}
                  keyboardType="numeric"
                />
              </View>
            )}

            <TouchableOpacity
              style={styles.toggleSetBtn}
              onPress={() => setHasThirdSet(!hasThirdSet)}
            >
              <Text style={styles.toggleSetText}>
                {hasThirdSet ? 'Supprimer le 3ème set' : '+ Ajouter un 3ème set décisif'}
              </Text>
            </TouchableOpacity>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setSelectedMatchForScore(null)}
              >
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleConfirmSubmitScores}
              >
                <Text style={styles.confirmBtnText}>Envoyer pour validation</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Création d'un défi */}
      <Modal visible={showChallengeModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.challengeModalCard}>
            <Text style={styles.modalTitle}>Proposer un Défi 🏸</Text>
            <Text style={styles.modalSubtitle}>
              Choisissez un adversaire et un créneau commun du club Champipaf.
            </Text>

            <Text style={styles.fieldLabel}>Adversaire :</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.playersScroll}>
              {allPlayers
                .filter((p) => p.id !== currentUser.id)
                .map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[
                      styles.playerChip,
                      selectedOpponentId === p.id && styles.activePlayerChip,
                    ]}
                    onPress={() => {
                      setSelectedOpponentId(p.id);
                      SlotService.findCommonSlots(currentUser.id, p.id).then((res) => {
                        setCommonSlots(res);
                        if (res.length > 0) setSelectedSlotId(res[0].slot.id);
                      });
                    }}
                  >
                    <Text
                      style={[
                        styles.chipName,
                        selectedOpponentId === p.id && styles.activeChipName,
                      ]}
                    >
                      {p.firstName} {p.lastName}
                    </Text>
                    <Text style={styles.chipElo}>{p.eloSolo} Elo</Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>

            <Text style={styles.fieldLabel}>Créneau de Badminton suggéré :</Text>
            <View style={styles.slotsBox}>
              {clubSlots.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[
                    styles.slotChoice,
                    selectedSlotId === s.id && styles.activeSlotChoice,
                  ]}
                  onPress={() => setSelectedSlotId(s.id)}
                >
                  <Text style={styles.slotChoiceTitle}>
                    {s.dayName} ({s.startTime} - {s.endTime})
                  </Text>
                  {s.hasPeakHours && (
                    <Text style={styles.peakNotice}>
                      ⚠️ Affluence forte : Défi autorisé après {s.allowedMatchStartTime}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setShowChallengeModal(false);
                  if (onClearTargetOpponent) onClearTargetOpponent();
                }}
              >
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleCreateChallenge}
              >
                <Text style={styles.confirmBtnText}>Lancer le défi</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerBar: {
    backgroundColor: '#0F172A',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#1E293B',
  },
  activeFilterBtn: {
    backgroundColor: '#0284C7',
  },
  filterText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  newChallengeBtn: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  newChallengeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  listContent: {
    padding: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
    padding: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  scoreModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 360,
  },
  challengeModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 16,
  },
  setRowInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 12,
  },
  setLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    width: 50,
  },
  scoreInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    width: 60,
    height: 44,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    backgroundColor: '#F8FAFC',
  },
  setDash: {
    fontSize: 18,
    fontWeight: '800',
    color: '#94A3B8',
  },
  toggleSetBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  toggleSetText: {
    color: '#0284C7',
    fontSize: 12,
    fontWeight: '700',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#E2E8F0',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#475569',
    fontWeight: '700',
    fontSize: 12,
  },
  confirmBtn: {
    flex: 2,
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
    marginTop: 8,
  },
  playersScroll: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  playerChip: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  activePlayerChip: {
    borderColor: '#0284C7',
    backgroundColor: '#E0F2FE',
  },
  chipName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  activeChipName: {
    color: '#0369A1',
  },
  chipElo: {
    fontSize: 10,
    color: '#64748B',
  },
  slotsBox: {
    gap: 6,
    marginBottom: 12,
  },
  slotChoice: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 10,
  },
  activeSlotChoice: {
    borderColor: '#16A34A',
    backgroundColor: '#F0FDF4',
  },
  slotChoiceTitle: {
    fontWeight: '700',
    fontSize: 12,
    color: '#0F172A',
  },
  peakNotice: {
    fontSize: 10,
    color: '#DC2626',
    fontWeight: '600',
    marginTop: 2,
  },
});
