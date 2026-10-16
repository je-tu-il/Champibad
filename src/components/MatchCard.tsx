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
  onAcceptChallenge?: (matchId: string) => void;
  onDeclineChallenge?: (matchId: string) => void;
  onPressPlayer?: (player: Player) => void;
}

export const MatchCard: React.FC<Props> = ({
  match,
  currentUser,
  allPlayers,
  onValidate,
  onContest,
  onSubmitScores,
  onAcceptChallenge,
  onDeclineChallenge,
  onPressPlayer,
}) => {
  const p1 = allPlayers.find((p) => p.id === match.player1Id);
  const p2 = allPlayers.find((p) => p.id === match.player2Id);

  const p1Name = p1?.firstName || 'Joueur 1';
  const p2Name = p2?.firstName || 'Joueur 2';

  const isUserP1 = currentUser.id === match.player1Id;
  const isUserP2 = currentUser.id === match.player2Id;
  const isParticipant = isUserP1 || isUserP2;

  // Défi reçu en attente d'acceptation par l'adversaire
  const isPendingChallengeForUser = match.status === 'PROPOSED' && isUserP2;
  const isPendingChallengeSentByUser = match.status === 'PROPOSED' && isUserP1;

  const needsValidationFromUser =
    match.status === 'PENDING_VALIDATION' &&
    match.submittedBy !== currentUser.id &&
    isParticipant;

  const canSubmitScore =
    match.status === 'ACCEPTED' &&
    isParticipant;

  const isP1Winner = match.winnerId === match.player1Id;
  const isP2Winner = match.winnerId === match.player2Id;

  // Statut dot & label
  let statusText = 'Proposé';
  let statusDotColor = '#8E8E93';

  if (match.status === 'VALIDATED') {
    statusText = 'Validé';
    statusDotColor = '#34C759';
  } else if (match.status === 'PENDING_VALIDATION') {
    statusText = 'En attente';
    statusDotColor = '#FF9500';
  } else if (match.status === 'CONTESTED') {
    statusText = 'Contesté';
    statusDotColor = '#FF3B30';
  } else if (match.status === 'ACCEPTED') {
    statusText = 'Accepté';
    statusDotColor = '#007AFF';
  }

  const getFormattedDate = (): string => {
    if (match.scheduledDate && match.scheduledTime) {
      return `${match.scheduledDate} à ${match.scheduledTime}`;
    }
    if (match.scheduledDate) return match.scheduledDate;
    if (match.scheduledTime) return `Séance à ${match.scheduledTime}`;
    if (match.createdAt) {
      const d = new Date(match.createdAt);
      return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    }
    return '';
  };

  const formattedDate = getFormattedDate();

  return (
    <View style={styles.card}>
      {/* Top Header : Date et Statut */}
      <View style={styles.topRow}>
        <Text style={styles.dateLabel}>{formattedDate}</Text>
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: statusDotColor }]} />
          <Text style={styles.statusText}>{statusText}</Text>
        </View>
      </View>

      {/* Joueurs & Scores */}
      <View style={styles.playersRow}>
        {/* Joueur 1 */}
        <View style={styles.playerCol}>
          <TouchableOpacity
            style={styles.nameContainer}
            onPress={() => p1 && onPressPlayer && onPressPlayer(p1)}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.playerName, isP1Winner && styles.winnerName]}
              numberOfLines={1}
            >
              {p1Name}
            </Text>
            {isP1Winner && <Text style={styles.winnerCheck}>✓</Text>}
          </TouchableOpacity>
          {match.eloDeltaPlayer1 !== undefined && (
            <View
              style={[
                styles.eloPill,
                {
                  backgroundColor:
                    match.eloDeltaPlayer1 >= 0 ? '#34C759' : '#FF3B30',
                },
              ]}
            >
              <Text style={styles.eloPillText}>
                {match.eloDeltaPlayer1 >= 0
                  ? `+${match.eloDeltaPlayer1}`
                  : match.eloDeltaPlayer1}{' '}
                Elo
              </Text>
            </View>
          )}
        </View>

        {/* VS / Scores des sets */}
        <View style={styles.scoreCol}>
          {match.sets && match.sets.length > 0 ? (
            <View style={styles.setsList}>
              {match.sets.map((s, idx) => {
                const isP1Leading = s.player1Score > s.player2Score;
                const isP2Leading = s.player2Score > s.player1Score;
                return (
                  <View key={idx} style={styles.setRow}>
                    <Text
                      style={[
                        styles.setText,
                        isP1Leading && styles.leadingScore,
                      ]}
                    >
                      {s.player1Score}
                    </Text>
                    <Text style={styles.setDivider}>-</Text>
                    <Text
                      style={[
                        styles.setText,
                        isP2Leading && styles.leadingScore,
                      ]}
                    >
                      {s.player2Score}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={styles.vsText}>VS</Text>
          )}
        </View>

        {/* Joueur 2 */}
        <View style={styles.playerCol}>
          <TouchableOpacity
            style={styles.nameContainer}
            onPress={() => p2 && onPressPlayer && onPressPlayer(p2)}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.playerName, isP2Winner && styles.winnerName]}
              numberOfLines={1}
            >
              {p2Name}
            </Text>
            {isP2Winner && <Text style={styles.winnerCheck}>✓</Text>}
          </TouchableOpacity>
          {match.eloDeltaPlayer2 !== undefined && (
            <View
              style={[
                styles.eloPill,
                {
                  backgroundColor:
                    match.eloDeltaPlayer2 >= 0 ? '#34C759' : '#FF3B30',
                },
              ]}
            >
              <Text style={styles.eloPillText}>
                {match.eloDeltaPlayer2 >= 0
                  ? `+${match.eloDeltaPlayer2}`
                  : match.eloDeltaPlayer2}{' '}
                Elo
              </Text>
            </View>
          )}
        </View>
      </View>


      {/* Affichage des malus & handicap équilibré */}
      {match.handicapApplied !== 'NONE' && (match.handicapDetails || match.handicapExplanation) && (
        <View style={styles.handicapBox}>
          <Text style={styles.handicapTitle}>
            ⚖️ {match.handicapDetails || 'Handicap appliqué'}
          </Text>
          {match.firstServerId && (
            <Text style={styles.firstServerText}>
              Premier service : {match.firstServerId === match.player1Id ? p1Name : p2Name}
            </Text>
          )}
        </View>
      )}

      {/* Défi reçu en attente d'acceptation par l'utilisateur */}
      {isPendingChallengeForUser && (
        <View style={styles.challengeBox}>
          <Text style={styles.challengeNotice}>
            🏸 {p1Name} vous a défié sur ce créneau !
          </Text>
          <View style={styles.buttonsRow}>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => onAcceptChallenge && onAcceptChallenge(match.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.acceptButtonText}>✓ Accepter le défi</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.declineButton}
              onPress={() => onDeclineChallenge && onDeclineChallenge(match.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.declineButtonText}>✕ Refuser</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Défi envoyé par l'utilisateur en attente */}
      {isPendingChallengeSentByUser && (
        <View style={styles.sentChallengeBox}>
          <Text style={styles.sentChallengeText}>
            ⏳ Défi envoyé • En attente de la réponse de {p2Name}
          </Text>
        </View>
      )}

      {/* Défi décliné */}
      {match.status === 'DECLINED' && (
        <View style={styles.declinedBox}>
          <Text style={styles.declinedText}>Défi refusé</Text>
        </View>
      )}

      {/* Actions de validation du score */}
      {needsValidationFromUser && (
        <View style={styles.actionsContainer}>
          <Text style={styles.actionPrompt}>Confirmer ce résultat ?</Text>
          <View style={styles.buttonsRow}>
            <TouchableOpacity
              style={styles.validateButton}
              onPress={() => onValidate && onValidate(match.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.validateButtonText}>Confirmer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contestButton}
              onPress={() => onContest && onContest(match.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.contestButtonText}>Contester</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Action de saisie de score une fois le défi accepté */}
      {canSubmitScore && (
        <TouchableOpacity
          style={styles.submitScoreButton}
          onPress={() => onSubmitScores && onSubmitScores(match)}
          activeOpacity={0.7}
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
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
  },
  playersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playerCol: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  playerName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000000',
    textAlign: 'center',
  },
  winnerName: {
    fontWeight: '600',
  },
  winnerCheck: {
    color: '#34C759',
    fontSize: 12,
    fontWeight: '600',
  },
  eloPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
    alignSelf: 'center',
  },
  eloPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  scoreCol: {
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C7C7CC',
    letterSpacing: 0.5,
  },
  setsList: {
    gap: 4,
    alignItems: 'center',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  setText: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '500',
  },
  leadingScore: {
    color: '#000000',
    fontWeight: '600',
  },
  setDivider: {
    color: '#C7C7CC',
    fontSize: 10,
    marginHorizontal: 4,
  },
  slotInfo: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 10,
    textAlign: 'center',
  },
  actionsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
  },
  actionPrompt: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 10,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  validateButton: {
    flex: 1,
    backgroundColor: '#34C759',
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  validateButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  contestButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FF3B30',
    paddingVertical: 9,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contestButtonText: {
    color: '#FF3B30',
    fontWeight: '600',
    fontSize: 13,
  },
  handicapBox: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
    alignItems: 'center',
  },
  handicapTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
  },
  firstServerText: {
    fontSize: 11,
    color: '#007AFF',
    fontWeight: '500',
    marginTop: 2,
  },
  challengeBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
  },
  challengeNotice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#34C759',
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  declineButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FF3B30',
    paddingVertical: 9,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineButtonText: {
    color: '#FF3B30',
    fontWeight: '600',
    fontSize: 13,
  },
  sentChallengeBox: {
    marginTop: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
  },
  sentChallengeText: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  declinedBox: {
    marginTop: 10,
    alignItems: 'center',
  },
  declinedText: {
    fontSize: 12,
    color: '#FF3B30',
    fontStyle: 'italic',
  },
  submitScoreButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  submitScoreText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
});
