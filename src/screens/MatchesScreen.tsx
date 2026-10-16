import React, { useState, useEffect, useRef } from 'react';
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
import { HandicapService } from '../services/handicapService';
import { MatchCard } from '../components/MatchCard';

interface Props {
  currentUser: Player;
  onMatchValidated: () => void;
  targetOpponent?: Player | null;
  onClearTargetOpponent?: () => void;
  onPressPlayer?: (player: Player) => void;
}

export const MatchesScreen: React.FC<Props> = ({
  currentUser,
  onMatchValidated,
  targetOpponent,
  onClearTargetOpponent,
  onPressPlayer,
}) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [clubSlots, setClubSlots] = useState<ClubSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'VALIDATED'>('ALL');

  // Modal Saisie de Score - scores non préremplis (vides)
  const [selectedMatchForScore, setSelectedMatchForScore] = useState<Match | null>(null);
  const [s1P1, setS1P1] = useState('');
  const [s1P2, setS1P2] = useState('');
  const [s2P1, setS2P1] = useState('');
  const [s2P2, setS2P2] = useState('');
  const [s3P1, setS3P1] = useState('');
  const [s3P2, setS3P2] = useState('');

  // Refs pour l'auto-passage automatique d'une case à l'autre
  const s1P1Ref = useRef<TextInput>(null);
  const s1P2Ref = useRef<TextInput>(null);
  const s2P1Ref = useRef<TextInput>(null);
  const s2P2Ref = useRef<TextInput>(null);
  const s3P1Ref = useRef<TextInput>(null);
  const s3P2Ref = useRef<TextInput>(null);

  // Modal Nouveau Défi
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [selectedOpponentId, setSelectedOpponentId] = useState<string>('');
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [commonSlots, setCommonSlots] = useState<any[]>([]);

  // Détection automatique du 3ème set :
  // Un set est gagné si un joueur atteint >= 21 et a plus de points que l'adversaire
  const num1_1 = parseInt(s1P1, 10) || 0;
  const num1_2 = parseInt(s1P2, 10) || 0;
  const num2_1 = parseInt(s2P1, 10) || 0;
  const num2_2 = parseInt(s2P2, 10) || 0;

  const p1WonSet1 = num1_1 >= 21 && num1_1 > num1_2;
  const p2WonSet1 = num1_2 >= 21 && num1_2 > num1_1;
  const p1WonSet2 = num2_1 >= 21 && num2_1 > num2_2;
  const p2WonSet2 = num2_2 >= 21 && num2_2 > num2_1;

  // 21 deux fois du même côté (victoire 2-0 nette) -> pas de 3ème set
  const isTwoZero = (p1WonSet1 && p1WonSet2) || (p2WonSet1 && p2WonSet2);

  // 21 des 2 côtés (1 set remporté par chacun -> 1-1) -> 3ème set décisif obligatoire
  const isOneAll = (p1WonSet1 && p2WonSet2) || (p2WonSet1 && p1WonSet2);

  const handleScoreChange = (
    text: string,
    setter: (val: string) => void,
    nextRef?: React.RefObject<TextInput | null>
  ) => {
    const clean = text.replace(/[^0-9]/g, '');
    setter(clean);
    if (!clean) return;
    const num = parseInt(clean, 10);
    // Auto-passage dès que 2 chiffres sont saisis OU dès qu'un chiffre > 2 est tapé (ex: 3..9)
    if (clean.length >= 2 || num > 2) {
      nextRef?.current?.focus();
    }
  };

  const handleOpenScoreModal = (match: Match) => {
    setSelectedMatchForScore(match);
    setS1P1('');
    setS1P2('');
    setS2P1('');
    setS2P2('');
    setS3P1('');
    setS3P2('');
    setTimeout(() => {
      s1P1Ref.current?.focus();
    }, 150);
  };

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

  const handleAcceptChallenge = async (matchId: string) => {
    try {
      await MatchService.acceptChallenge(matchId);
      Alert.alert('Défi accepté ! 🏸', 'Préparez vos raquettes pour la rencontre.');
      await loadData();
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    }
  };

  const handleDeclineChallenge = async (matchId: string) => {
    try {
      await MatchService.declineChallenge(matchId);
      Alert.alert('Défi refusé', 'La proposition a été déclinée.');
      await loadData();
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    }
  };

  const handleConfirmSubmitScores = async () => {
    if (!selectedMatchForScore) return;

    if (!s1P1 || !s1P2 || !s2P1 || !s2P2) {
      Alert.alert('Scores incomplets', 'Veuillez renseigner les scores des deux premiers sets.');
      return;
    }

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

    if (isOneAll) {
      if (!s3P1 || !s3P2) {
        Alert.alert('3ème set requis', 'Les deux joueurs sont à 1 set chacun. Veuillez saisir le score du 3ème set décisif.');
        return;
      }
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

    // Algorithme intelligent multi-facteurs (Elo, volume matchs, H2H, malus antérieurs, serveur)
    const intelligentEval = HandicapService.evaluateIntelligentHandicap(
      currentUser,
      opponent,
      matches
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
        handicapApplied: intelligentEval.handicapType,
        handicapDetails: intelligentEval.summary,
        handicapExplanation: intelligentEval.details,
        handicapPlayer1Points: intelligentEval.player1Points,
        handicapPlayer2Points: intelligentEval.player2Points,
        firstServerId: intelligentEval.firstServerId,
        sets: [],
      });

      setShowChallengeModal(false);
      if (onClearTargetOpponent) onClearTargetOpponent();
      Alert.alert('Défi envoyé ! 🏸', `Votre proposition a été envoyée à ${opponent.firstName}.\n\n${intelligentEval.details}`);
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
      {/* Barre d'action & Filtres style iOS Segmented Control */}
      <View style={styles.headerBar}>
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[styles.segmentBtn, filter === 'ALL' && styles.activeSegmentBtn]}
            onPress={() => setFilter('ALL')}
            activeOpacity={0.7}
          >
            <Text style={[styles.segmentText, filter === 'ALL' && styles.activeSegmentText]}>
              Tous ({matches.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, filter === 'PENDING' && styles.activeSegmentBtn]}
            onPress={() => setFilter('PENDING')}
            activeOpacity={0.7}
          >
            <Text style={[styles.segmentText, filter === 'PENDING' && styles.activeSegmentText]}>
              À valider
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, filter === 'VALIDATED' && styles.activeSegmentBtn]}
            onPress={() => setFilter('VALIDATED')}
            activeOpacity={0.7}
          >
            <Text style={[styles.segmentText, filter === 'VALIDATED' && styles.activeSegmentText]}>
              Validés
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.newChallengeBtn}
          onPress={() => setShowChallengeModal(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.newChallengeText}>+ Défi</Text>
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
            onSubmitScores={handleOpenScoreModal}
            onAcceptChallenge={handleAcceptChallenge}
            onDeclineChallenge={handleDeclineChallenge}
            onPressPlayer={onPressPlayer}
          />
        )}
      />

      {/* Modal de déclaration des scores */}
      <Modal visible={!!selectedMatchForScore} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.scoreModalCard}>
            <Text style={styles.modalTitle}>Saisie du Score</Text>
            <Text style={styles.modalSubtitle}>
              Saisissez les scores. Le curseur passe automatiquement à la case suivante.
            </Text>

            {/* Set 1 */}
            <View style={styles.setRowInput}>
              <Text style={styles.setLabel}>Set 1</Text>
              <TextInput
                ref={s1P1Ref}
                style={styles.scoreInput}
                value={s1P1}
                onChangeText={(val) => handleScoreChange(val, setS1P1, s1P2Ref)}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#C7C7CC"
                selectTextOnFocus
              />
              <Text style={styles.setDash}>-</Text>
              <TextInput
                ref={s1P2Ref}
                style={styles.scoreInput}
                value={s1P2}
                onChangeText={(val) => handleScoreChange(val, setS1P2, s2P1Ref)}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#C7C7CC"
                selectTextOnFocus
              />
            </View>

            {/* Set 2 */}
            <View style={styles.setRowInput}>
              <Text style={styles.setLabel}>Set 2</Text>
              <TextInput
                ref={s2P1Ref}
                style={styles.scoreInput}
                value={s2P1}
                onChangeText={(val) => handleScoreChange(val, setS2P1, s2P2Ref)}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#C7C7CC"
                selectTextOnFocus
              />
              <Text style={styles.setDash}>-</Text>
              <TextInput
                ref={s2P2Ref}
                style={styles.scoreInput}
                value={s2P2}
                onChangeText={(val) => handleScoreChange(val, setS2P2, isOneAll ? s3P1Ref : undefined)}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#C7C7CC"
                selectTextOnFocus
              />
            </View>

            {/* Détection 21 2 fois du même côté (2-0) vs 21 des 2 côtés (1-1) */}
            {isTwoZero && (
              <View style={styles.autoSetNoticeBox}>
                <Text style={styles.autoSetNoticeText}>
                  ✓ Victoire nette en 2 sets (2-0). Aucun 3ème set requis.
                </Text>
              </View>
            )}

            {isOneAll && (
              <>
                <View style={styles.decisiveSetNoticeBox}>
                  <Text style={styles.decisiveSetNoticeText}>
                    🔥 Égalité 1 set partout ! 3ème set décisif :
                  </Text>
                </View>
                <View style={styles.setRowInput}>
                  <Text style={styles.setLabel}>Set 3</Text>
                  <TextInput
                    ref={s3P1Ref}
                    style={styles.scoreInput}
                    value={s3P1}
                    onChangeText={(val) => handleScoreChange(val, setS3P1, s3P2Ref)}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#C7C7CC"
                    selectTextOnFocus
                  />
                  <Text style={styles.setDash}>-</Text>
                  <TextInput
                    ref={s3P2Ref}
                    style={styles.scoreInput}
                    value={s3P2}
                    onChangeText={(val) => handleScoreChange(val, setS3P2)}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#C7C7CC"
                    selectTextOnFocus
                  />
                </View>
              </>
            )}

            {!isTwoZero && !isOneAll && (
              <View style={styles.infoSetNoticeBox}>
                <Text style={styles.infoSetNoticeText}>
                  ℹ️ Renseignez les 2 sets. Le 3ème set s'affichera uniquement si 1-1 (21 des deux côtés).
                </Text>
              </View>
            )}

            <View style={styles.modalButtonsStack}>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleConfirmSubmitScores}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryBtnText}>Envoyer pour validation</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setSelectedMatchForScore(null)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Création d'un défi */}
      <Modal visible={showChallengeModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.challengeModalWrapper}>
            <ScrollView
              contentContainerStyle={styles.challengeModalCard}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.modalTitle}>Proposer un Défi 🏸</Text>
              <Text style={styles.modalSubtitle}>
                Choisissez un adversaire et un créneau de jeu.
              </Text>

              <Text style={styles.fieldLabel}>Adversaire</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.playersScrollContainer}
                style={styles.playersScroll}
              >
                {allPlayers
                  .filter((p) => p.id !== currentUser.id)
                  .map((p) => {
                    const isSelected = selectedOpponentId === p.id;
                    return (
                      <TouchableOpacity
                        key={p.id}
                        style={[
                          styles.playerChip,
                          isSelected && styles.activePlayerChip,
                        ]}
                        onPress={() => {
                          setSelectedOpponentId(p.id);
                          SlotService.findCommonSlots(currentUser.id, p.id).then((res) => {
                            setCommonSlots(res);
                            if (res.length > 0) setSelectedSlotId(res[0].slot.id);
                          });
                        }}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.chipName,
                            isSelected && styles.activeChipName,
                          ]}
                        >
                          {p.firstName} {p.lastName}
                        </Text>
                        <Text
                          style={[
                            styles.chipElo,
                            isSelected && styles.activeChipElo,
                          ]}
                        >
                          {p.eloSolo} Elo
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
              </ScrollView>

              {/* Aperçu Algorithmique du Handicap & Premier Serveur */}
              {(() => {
                const opponent = allPlayers.find((p) => p.id === selectedOpponentId);
                if (!opponent) return null;
                const evalData = HandicapService.evaluateIntelligentHandicap(
                  currentUser,
                  opponent,
                  matches
                );
                return (
                  <View style={styles.intelligentCard}>
                    <View style={styles.intelligentHeader}>
                      <Text style={styles.intelligentTitle}>⚖️ Équilibrage Intelligent</Text>
                      <View
                        style={[
                          styles.intelligentBadge,
                          {
                            backgroundColor: evalData.hasHandicap
                              ? 'rgba(255, 149, 0, 0.15)'
                              : 'rgba(52, 199, 89, 0.15)',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.intelligentBadgeText,
                            {
                              color: evalData.hasHandicap ? '#D97706' : '#248A3D',
                            },
                          ]}
                        >
                          {evalData.hasHandicap ? 'Handicap Actif' : 'Match Équilibré'}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.intelligentSummary}>{evalData.summary}</Text>
                    <Text style={styles.intelligentDetails}>{evalData.details}</Text>

                    <View style={styles.serverRow}>
                      <Text style={styles.serverLabel}>Premier serveur désigné :</Text>
                      <Text style={styles.serverValue}>🏸 {evalData.firstServerName}</Text>
                    </View>
                  </View>
                );
              })()}

              <Text style={styles.fieldLabel}>Créneau de Badminton suggéré</Text>
              <View style={styles.slotsBox}>
                {clubSlots.map((s) => {
                  const isSelected = selectedSlotId === s.id;
                  return (
                    <TouchableOpacity
                      key={s.id}
                      style={[
                        styles.slotChoice,
                        isSelected && styles.activeSlotChoice,
                      ]}
                      onPress={() => setSelectedSlotId(s.id)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.slotChoiceTitle,
                          isSelected && styles.activeSlotChoiceTitle,
                        ]}
                      >
                        {s.dayName} ({s.startTime} - {s.endTime})
                      </Text>
                      {s.hasPeakHours && (
                        <Text style={styles.peakNotice}>
                          ⚠️ Affluence forte : Défi autorisé après {s.allowedMatchStartTime}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.modalButtonsStack}>
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={handleCreateChallenge}
                  activeOpacity={0.8}
                >
                  <Text style={styles.primaryBtnText}>Lancer le défi</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => {
                    setShowChallengeModal(false);
                    if (onClearTargetOpponent) onClearTargetOpponent();
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelBtnText}>Annuler</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  headerBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  segmentedControl: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    borderRadius: 9,
    padding: 2,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 6,
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
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
  },
  activeSegmentText: {
    color: '#000000',
    fontWeight: '600',
  },
  newChallengeBtn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newChallengeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 44,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scoreModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 360,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  challengeModalWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  challengeModalCard: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: '#8E8E93',
    marginBottom: 18,
    textAlign: 'center',
  },
  setRowInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 12,
  },
  setLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1C1C1E',
    width: 48,
  },
  scoreInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    width: 60,
    height: 44,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  setDash: {
    fontSize: 18,
    fontWeight: '500',
    color: '#8E8E93',
  },
  toggleSetBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 8,
  },
  toggleSetText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 10,
    marginTop: 6,
  },
  playersScroll: {
    marginBottom: 16,
  },
  playersScrollContainer: {
    paddingVertical: 2,
    gap: 8,
  },
  playerChip: {
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
  },
  activePlayerChip: {
    backgroundColor: '#007AFF',
  },
  chipName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  activeChipName: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  chipElo: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2,
  },
  activeChipElo: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  slotsBox: {
    gap: 8,
    marginBottom: 20,
  },
  slotChoice: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    padding: 12,
  },
  activeSlotChoice: {
    backgroundColor: '#EBF5FF',
    borderColor: '#007AFF',
  },
  slotChoiceTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  activeSlotChoiceTitle: {
    color: '#007AFF',
    fontWeight: '600',
  },
  peakNotice: {
    fontSize: 11,
    color: '#FF9500',
    fontWeight: '500',
    marginTop: 4,
  },
  modalButtonsStack: {
    marginTop: 10,
  },
  primaryBtn: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  cancelBtn: {
    backgroundColor: '#F2F2F7',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 8,
  },
  cancelBtnText: {
    color: '#8E8E93',
    fontWeight: '600',
    fontSize: 15,
  },
  autoSetNoticeBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  autoSetNoticeText: {
    fontSize: 13,
    color: '#2E7D32',
    fontWeight: '500',
    textAlign: 'center',
  },
  decisiveSetNoticeBox: {
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
  },
  decisiveSetNoticeText: {
    fontSize: 13,
    color: '#E65100',
    fontWeight: '600',
    textAlign: 'center',
  },
  infoSetNoticeBox: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  infoSetNoticeText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  intelligentCard: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  intelligentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  intelligentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  intelligentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  intelligentBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  intelligentSummary: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  intelligentDetails: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 17,
    marginBottom: 8,
  },
  serverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderTopWidth: 0.5,
    borderTopColor: '#E5E7EB',
    paddingTop: 6,
  },
  serverLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  serverValue: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '600',
  },
});

