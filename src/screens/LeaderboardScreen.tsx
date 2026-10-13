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
  if (elo >= 1500) return '#DC2626';
  if (elo >= 1400) return '#EA580C';
  if (elo >= 1300) return '#2563EB';
  if (elo >= 1200) return '#16A34A';
  return '#64748B';
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
      {/* Sélecteur de mode 1v1 / 2v2 */}
      <View style={styles.modeTabs}>
        <TouchableOpacity
          style={[styles.tab, mode === 'SOLO' && styles.activeTab]}
          onPress={() => setMode('SOLO')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, mode === 'SOLO' && styles.activeTabText]}>
            1v1
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, mode === 'DOUBLE' && styles.activeTab]}
          onPress={() => setMode('DOUBLE')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, mode === 'DOUBLE' && styles.activeTabText]}>
            2v2
          </Text>
        </TouchableOpacity>
      </View>

      {/* Liste des joueurs */}
      <FlatList
        data={sortedPlayers}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}
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
                isCurrentUser && styles.currentUserCard,
                rank === 1 && styles.firstRankCard,
              ]}
            >
              {/* Rang & Delta */}
              <View style={styles.rankBox}>
                <Text style={[styles.rankNumber, rank <= 3 && styles.topRankNumber]}>
                  {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                </Text>
                {eloDelta !== 0 && (
                  <Text
                    style={[
                      styles.rankDelta,
                      { color: eloDelta > 0 ? '#16A34A' : '#DC2626' },
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
    backgroundColor: '#F8FAFC',
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#1E293B',
  },
  activeTab: {
    backgroundColor: '#0284C7',
  },
  tabText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 12,
  },
  playerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  currentUserCard: {
    borderColor: '#38BDF8',
    backgroundColor: '#F0F9FF',
    borderWidth: 1.5,
  },
  firstRankCard: {
    borderColor: '#F59E0B',
    borderWidth: 1.5,
  },
  rankBox: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: '#64748B',
  },
  topRankNumber: {
    fontSize: 18,
  },
  rankDelta: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 1,
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
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    flexShrink: 1,
  },
  youBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  eloText: {
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'right',
    minWidth: 42,
    marginRight: 8,
  },
  actionBox: {
    width: 54,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  challengeBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  challengeBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 10,
  },
});
