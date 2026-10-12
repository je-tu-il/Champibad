import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Match, Player } from '../types';

interface Props {
  match: Match;
  currentUser: Player;
  allPlayers: Player[];
  onValidate?: (matchId: string) => void;
  onContest?: (matchId: string) => void;
  onSubmitScores?: (match: Match) => void;
}

export const MatchCard: React.FC<Props> = ({
  match,
  currentUser,
  allPlayers,
  onValidate,
  onContest,
  onSubmitScores,
}) => {
  const p1 = allPlayers.find((p) => p.id === match.player1Id);
  const p2 = allPlayers.find((p) => p.id === match.player2Id);

  const p1Name = p1 ? `${p1.firstName} ${p1.lastName}` : 'Joueur 1';
  const p2Name = p2 ? `${p2.firstName} ${p2.lastName}` : 'Joueur 2';

  const isUserP1 = currentUser.id === match.player1Id;
  const isUserP2 = currentUser.id === match.player2Id;
  const isParticipant = isUserP1 || isUserP2;

  const needsValidationFromUser =
    match.status === 'PENDING_VALIDATION' &&
    match.submittedBy !== currentUser.id &&
    isParticipant;

  const canSubmitScore =
    (match.status === 'ACCEPTED' || match.status === 'PROPOSED') &&
    isParticipant;

  // Statut text & color
  let statusText = 'Défi proposé';
  let statusBg = '#64748B';

  if (match.status === 'VALIDATED') {
    statusText = 'Validé (Elo calculé)';
    statusBg = '#16A34A';
  } else if (match.status === 'PENDING_VALIDATION') {
    statusText = 'En attente de confirmation';
    statusBg = '#EA580C';
  } else if (match.status === 'CONTESTED') {
    statusText = 'Contesté (En litige)';
    statusBg = '#DC2626';
  }

  return (
    <View style={styles.card}>
      {/* Top Header : Mode & Statut */}
      <View style={styles.topRow}>
        <View style={styles.modeBadge}>
          <Text style={styles.modeText}>
            {match.mode === 'SOLO' ? '🏸 Simple 1v1' : '🏸 Double 2v2'}
          </Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
          <Text style={styles.statusText}>{statusText}</Text>
        </View>
      </View>

      {/* Joueurs & Scores */}
      <View style={styles.playersRow}>
        {/* Joueur 1 */}
        <View style={[styles.playerCol, match.winnerId === match.player1Id && styles.winnerCol]}>
          <Text style={styles.playerName} numberOfLines={1}>
            {p1Name}
          </Text>
          <Text style={styles.playerSub}>
            {p1 ? `${p1.eloSolo} Elo` : ''}
          </Text>
          {match.eloDeltaPlayer1 !== undefined && (
            <Text
              style={[
                styles.eloDelta,
                { color: match.eloDeltaPlayer1 >= 0 ? '#16A34A' : '#DC2626' },
              ]}
            >
              {match.eloDeltaPlayer1 >= 0 ? `+${match.eloDeltaPlayer1}` : match.eloDeltaPlayer1} Elo
            </Text>
          )}
        </View>

        {/* VS / Scores des sets */}
        <View style={styles.scoreCol}>
          {match.sets && match.sets.length > 0 ? (
            <View style={styles.setsList}>
              {match.sets.map((s, idx) => (
                <View key={idx} style={styles.setRow}>
                  <Text style={[styles.setText, s.player1Score > s.player2Score && styles.boldScore]}>
                    {s.player1Score}
                  </Text>
                  <Text style={styles.setDivider}>-</Text>
                  <Text style={[styles.setText, s.player2Score > s.player1Score && styles.boldScore]}>
                    {s.player2Score}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.vsText}>VS</Text>
          )}
        </View>

        {/* Joueur 2 */}
        <View style={[styles.playerCol, match.winnerId === match.player2Id && styles.winnerCol]}>
          <Text style={styles.playerName} numberOfLines={1}>
            {p2Name}
          </Text>
          <Text style={styles.playerSub}>
            {p2 ? `${p2.eloSolo} Elo` : ''}
          </Text>
          {match.eloDeltaPlayer2 !== undefined && (
            <Text
              style={[
                styles.eloDelta,
                { color: match.eloDeltaPlayer2 >= 0 ? '#16A34A' : '#DC2626' },
              ]}
            >
              {match.eloDeltaPlayer2 >= 0 ? `+${match.eloDeltaPlayer2}` : match.eloDeltaPlayer2} Elo
            </Text>
          )}
        </View>
      </View>

      {/* Handicap appliqué si grand écart d'Elo */}
      {match.handicapApplied !== 'NONE' && (
        <View style={styles.handicapBadge}>
          <Text style={styles.handicapText}>
            ⚖️ Handicap : {match.handicapDetails || match.handicapApplied}
          </Text>
        </View>
      )}

      {/* Créneau prévu */}
      {match.scheduledTime && (
        <Text style={styles.slotInfo}>
          🕒 Créneau : {match.scheduledDate || 'Séance'} à {match.scheduledTime}
        </Text>
      )}

      {/* Actions de validation */}
      {needsValidationFromUser && (
        <View style={styles.actionsContainer}>
          <Text style={styles.actionPrompt}>
            L'adversaire a soumis ce résultat. Confirmez-vous ?
          </Text>
          <View style={styles.buttonsRow}>
            <TouchableOpacity
              style={styles.validateButton}
              onPress={() => onValidate && onValidate(match.id)}
            >
              <Text style={styles.validateButtonText}>✓ Confirmer & Valider Elo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contestButton}
              onPress={() => onContest && onContest(match.id)}
            >
              <Text style={styles.contestButtonText}>✕ Contester</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Action de saisie de score si le match a eu lieu */}
      {canSubmitScore && (
        <TouchableOpacity
          style={styles.submitScoreButton}
          onPress={() => onSubmitScores && onSubmitScores(match)}
        >
          <Text style={styles.submitScoreText}>📝 Déclarer le score du match</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modeBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  modeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  playersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playerCol: {
    flex: 1,
    alignItems: 'center',
    padding: 6,
    borderRadius: 8,
  },
  winnerCol: {
    backgroundColor: '#F0FDF4',
  },
  playerName: {
    fontWeight: '700',
    fontSize: 13,
    color: '#0F172A',
    textAlign: 'center',
  },
  playerSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  eloDelta: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },
  scoreCol: {
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  vsText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#94A3B8',
  },
  setsList: {
    gap: 4,
    alignItems: 'center',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  setText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '600',
  },
  boldScore: {
    color: '#38BDF8',
    fontWeight: '800',
  },
  setDivider: {
    color: '#64748B',
    fontSize: 10,
  },
  handicapBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 10,
  },
  handicapText: {
    color: '#B45309',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  slotInfo: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 6,
    textAlign: 'center',
  },
  actionsContainer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionPrompt: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  validateButton: {
    flex: 2,
    backgroundColor: '#16A34A',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  validateButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  contestButton: {
    flex: 1,
    backgroundColor: '#FEE2E2',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  contestButtonText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 12,
  },
  submitScoreButton: {
    backgroundColor: '#0284C7',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  submitScoreText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
});
