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
import { StatsService } from '../services/statsService';
import { EloBadge } from '../components/EloBadge';

interface Props {
  currentUser: Player;
  onChallengePlayer: (player: Player, mode: GameMode) => void;
}

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

  const renderBadgeIcon = (badge: string) => {
    switch (badge) {
      case 'CHAMPION':
        return '👑';
      case 'BOSSEUR':
        return '🔨';
      case 'PERSEVERANT':
        return '🛡️';
      case 'REMONTEE':
        return '🚀';
      default:
        return '🏅';
    }
  };

  return (
    <View style={styles.container}>
      {/* Sélecteur de mode Solo / Double */}
      <View style={styles.modeTabs}>
        <TouchableOpacity
          style={[styles.tab, mode === 'SOLO' && styles.activeTab]}
          onPress={() => setMode('SOLO')}
        >
          <Text style={[styles.tabText, mode === 'SOLO' && styles.activeTabText]}>
            🏸 Simple (1 contre 1)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, mode === 'DOUBLE' && styles.activeTab]}
          onPress={() => setMode('DOUBLE')}
        >
          <Text style={[styles.tabText, mode === 'DOUBLE' && styles.activeTabText]}>
            👥 Double (2 contre 2)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bannière stats & snapshot */}
      <View style={styles.snapshotBanner}>
        <Text style={styles.snapshotText}>
          ⚡ Classement officiel actualisé quotidiennement à minuit
        </Text>
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

          // Badges dynamiques
          const badges = StatsService.evaluateBadges(item);

          return (
            <View
              style={[
                styles.playerCard,
                isCurrentUser && styles.currentUserCard,
                rank === 1 && styles.firstRankCard,
              ]}
            >
              {/* Rang */}
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
                    {eloDelta > 0 ? `+${eloDelta}` : eloDelta}
                  </Text>
                )}
              </View>

              {/* Infos joueur */}
              <View style={styles.playerInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.playerName}>
                    {item.firstName} {item.lastName}
                  </Text>
                  {isCurrentUser && <Text style={styles.youBadge}>(Vous)</Text>}
                </View>

                {/* Badges de stats fun demandés par le user */}
                <View style={styles.badgesRow}>
                  {badges.map((b, i) => (
                    <View key={i} style={styles.badgePill}>
                      <Text style={styles.badgeText}>
                        {renderBadgeIcon(b)} {b}
                      </Text>
                    </View>
                  ))}
                  {item.cashprizePaid && (
                    <View style={styles.cashBadge}>
                      <Text style={styles.cashBadgeText}>💰 Éligible Cashprize</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.statsSummary}>
                  {item.matchesPlayed} matchs • {item.matchesWon}V / {item.matchesLost}D • {item.threeSetMatches} batailles en 3 sets
                </Text>
              </View>

              {/* Badge Elo & Action */}
              <View style={styles.actionCol}>
                <EloBadge elo={currentElo} size="small" />

                {!isCurrentUser && (
                  <TouchableOpacity
                    style={styles.challengeBtn}
                    onPress={() => onChallengePlayer(item, mode)}
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
    fontSize: 12,
    fontWeight: '700',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  snapshotBanner: {
    backgroundColor: '#E0F2FE',
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#BAE6FD',
  },
  snapshotText: {
    fontSize: 11,
    color: '#0369A1',
    fontWeight: '600',
  },
  listContent: {
    padding: 12,
  },
  playerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
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
    width: 44,
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
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  youBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
    marginBottom: 4,
  },
  badgePill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#92400E',
  },
  cashBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cashBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#166534',
  },
  statsSummary: {
    fontSize: 10,
    color: '#64748B',
  },
  actionCol: {
    alignItems: 'flex-end',
    gap: 6,
  },
  challengeBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  challengeBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 11,
  },
});
