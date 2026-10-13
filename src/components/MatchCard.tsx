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

  const p1Name = p1?.firstName || 'Joueur 1';
  const p2Name = p2?.firstName || 'Joueur 2';

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

  // Statut dot & label
  let statusText = 'Proposé';
  let statusDotColor = '#64748B';

  if (match.status === 'VALIDATED') {
    statusText = 'Validé';
    statusDotColor = '#16A34A';
  } else if (match.status === 'PENDING_VALIDATION') {
    statusText = 'En attente';
    statusDotColor = '#EA580C';
  } else if (match.status === 'CONTESTED') {
    statusText = 'Contesté';
    statusDotColor = '#DC2626';
  }

  const slotDay = match.scheduledDate || match.scheduledTime;

  return (
    <View style={styles.card}>
      {/* Top Header : Statut */}
      <View style={styles.topRow}>
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: statusDotColor }]} />
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

      {/* Créneau prévu */}
      {slotDay ? (
        <Text style={styles.slotInfo}>📅 {slotDay}</Text>
      ) : null}

      {/* Actions de validation */}
      {needsValidationFromUser && (
        <View style={styles.actionsContainer}>
          <Text style={styles.actionPrompt}>
            Confirmer ce résultat ?
          </Text>
          <View style={styles.buttonsRow}>
            <TouchableOpacity
              style={styles.validateButton}
              onPress={() => onValidate && onValidate(match.id)}
            >
              <Text style={styles.validateButtonText}>✓ Confirmer</Text>
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
          <Text style={styles.submitScoreText}>📝 Score</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  playersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playerCol: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRadius: 6,
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
  eloDelta: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  scoreCol: {
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  vsText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#94A3B8',
  },
  setsList: {
    gap: 3,
    alignItems: 'center',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  setText: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '600',
  },
  boldScore: {
    color: '#38BDF8',
    fontWeight: '800',
  },
  setDivider: {
    color: '#64748B',
    fontSize: 9,
  },
  slotInfo: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 6,
    textAlign: 'center',
  },
  actionsContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionPrompt: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 6,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  validateButton: {
    flex: 2,
    backgroundColor: '#16A34A',
    paddingVertical: 7,
    borderRadius: 6,
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
    paddingVertical: 7,
    borderRadius: 6,
    alignItems: 'center',
  },
  contestButtonText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 12,
  },
  submitScoreButton: {
    backgroundColor: '#0284C7',
    paddingVertical: 7,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  submitScoreText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
});
