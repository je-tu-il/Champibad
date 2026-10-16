import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Player, GameMode } from '../types';
import { AuthService } from '../services/authService';

interface Props {
  currentUser: Player;
  onChallengePlayer: (player: Player, mode: GameMode) => void;
}

const getEloColor = (elo: number): string => {
  if (elo >= 1500) return '#FF3B30';
  if (elo >= 1400) return '#FF9500';
  if (elo >= 1300) return '#007AFF';
  if (elo >= 1200) return '#34C759';
  return '#8E8E93';
};

export const LeaderboardScreen: React.FC<Props> = ({ currentUser, onChallengePlayer }) => {
  const [mode, setMode] = useState<GameMode>('SOLO');
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const list = await AuthService.getAllPlayers();
    setPlayers(list);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const sortedPlayers = [...players].sort((a, b) =>
    mode === 'SOLO' ? b.eloSolo - a.eloSolo : b.eloDouble - a.eloDouble
  );

  return (
    <View style={styles.container}>
      {/* Sélecteur de mode 1v1 / 2v2 (Segmented Control style iOS) */}
      <View style={styles.header}>
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[styles.segment, mode === 'SOLO' && styles.segmentActive]}
            onPress={() => setMode('SOLO')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.segmentText,
                mode === 'SOLO' && styles.segmentTextActive,
              ]}
            >
              1v1
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segment, mode === 'DOUBLE' && styles.segmentActive]}
            onPress={() => setMode('DOUBLE')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.segmentText,
                mode === 'DOUBLE' && styles.segmentTextActive,
              ]}
            >
              2v2
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Liste des joueurs */}
      <FlatList
        data={sortedPlayers}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadData}
            tintColor="#007AFF"
            colors={['#007AFF']}
          />
        }
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => {
          const rank = index + 1;
          const isCurrentUser = item.id === currentUser.id;
          const currentElo = mode === 'SOLO' ? item.eloSolo : item.eloDouble;
          const prevElo =
            mode === 'SOLO' ? item.previousDayEloSolo : item.previousDayEloDouble;
          const eloDelta = prevElo ? currentElo - prevElo : 0;

          return (
            <View
              style={[
                styles.playerCard,
                rank === 1 && styles.firstRankCard,
                isCurrentUser && styles.currentUserCard,
              ]}
            >
              {/* Rang & Delta */}
              <View style={styles.rankBox}>
                <Text style={[styles.rankNumber, rank <= 3 && styles.topRankNumber]}>
                  {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
                </Text>
                {eloDelta !== 0 && (
                  <Text
                    style={[
                      styles.rankDelta,
                      { color: eloDelta > 0 ? '#34C759' : '#FF3B30' },
                    ]}
                  >
                    {eloDelta > 0 ? `+${eloDelta}` : `${eloDelta}`}
                  </Text>
                )}
              </View>

              {/* Infos joueur */}
              <View style={styles.playerInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.playerName} numberOfLines={1}>
                    {item.firstName} {item.lastName}
                  </Text>
                  {isCurrentUser && <Text style={styles.youBadge}>(Vous)</Text>}
                </View>
              </View>

              {/* Elo */}
              <Text style={[styles.eloText, { color: getEloColor(currentElo) }]}>
                {currentElo}
              </Text>

              {/* Action Défier */}
              <View style={styles.actionBox}>
                {!isCurrentUser && (
                  <TouchableOpacity
                    style={styles.challengeBtn}
                    onPress={() => onChallengePlayer(item, mode)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.challengeBtnText}>Défier</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 2,
  },
  segment: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
  },
  segmentTextActive: {
    color: '#000000',
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  playerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  currentUserCard: {
    backgroundColor: '#F0F4FF',
  },
  firstRankCard: {
    backgroundColor: '#FFFBEB',
  },
  rankBox: {
    width: 32,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    textAlign: 'center',
  },
  topRankNumber: {
    fontSize: 16,
  },
  rankDelta: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  playerInfo: {
    flex: 1,
    paddingHorizontal: 10,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  playerName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000000',
    flexShrink: 1,
  },
  youBadge: {
    fontSize: 11,
    fontWeight: '500',
    color: '#007AFF',
  },
  eloText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'right',
    minWidth: 42,
  },
  actionBox: {
    width: 60,
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: 8,
  },
  challengeBtn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  challengeBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
});
