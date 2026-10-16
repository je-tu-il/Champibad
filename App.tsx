import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { Player, GameMode } from './src/types';
import { AuthService } from './src/services/authService';
import { SUPER_ADMIN_EMAIL } from './src/config/constants';
import { Header } from './src/components/Header';
import { AuthScreen } from './src/screens/AuthScreen';
import { LeaderboardScreen } from './src/screens/LeaderboardScreen';
import { MatchesScreen } from './src/screens/MatchesScreen';
import { SlotsScreen } from './src/screens/SlotsScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { AdminScreen } from './src/screens/AdminScreen';

type TabKey = 'LEADERBOARD' | 'MATCHES' | 'SLOTS' | 'CHAT' | 'ADMIN';

export default function App() {
  const [currentUser, setCurrentUser] = useState<Player | null>(null);
  const [currentTab, setCurrentTab] = useState<TabKey>('LEADERBOARD');
  const [targetOpponentForChallenge, setTargetOpponentForChallenge] = useState<Player | null>(null);

  useEffect(() => {
    checkActiveSession();
  }, []);

  const checkActiveSession = async () => {
    const user = await AuthService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Déconnexion', 'Êtes-vous sûr de vouloir vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnexion',
        style: 'destructive',
        onPress: async () => {
          await AuthService.logout();
          setCurrentUser(null);
          setCurrentTab('LEADERBOARD');
        },
      },
    ]);
  };

  const handleChallengeFromLeaderboard = (player: Player, mode: GameMode) => {
    setTargetOpponentForChallenge(player);
    setCurrentTab('MATCHES');
  };

  const handleMatchValidated = () => {
    Alert.alert('Match Validé ! 🏸', 'Les scores et les classements Elo ont été mis à jour.');
  };

  const isAdmin =
    currentUser?.role === 'ADMIN' ||
    currentUser?.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <AuthScreen onLoginSuccess={(player) => setCurrentUser(player)} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* En-tête Apple épuré */}
      <Header
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Contenu de l'onglet actif */}
      <View style={styles.screenContent}>
        {currentTab === 'LEADERBOARD' && (
          <LeaderboardScreen
            currentUser={currentUser}
            onChallengePlayer={handleChallengeFromLeaderboard}
          />
        )}
        {currentTab === 'MATCHES' && (
          <MatchesScreen
            currentUser={currentUser}
            onMatchValidated={handleMatchValidated}
            targetOpponent={targetOpponentForChallenge}
            onClearTargetOpponent={() => setTargetOpponentForChallenge(null)}
          />
        )}
        {currentTab === 'SLOTS' && <SlotsScreen currentUser={currentUser} />}
        {currentTab === 'CHAT' && (
          <ChatScreen
            currentUser={currentUser}
            onUserUpdated={(u) => setCurrentUser(u)}
          />
        )}
        {currentTab === 'ADMIN' && isAdmin && (
          <AdminScreen currentUser={currentUser} />
        )}
      </View>

      {/* Barre d'onglets iOS native */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setCurrentTab('LEADERBOARD')}
          activeOpacity={0.7}
        >
          <Text style={styles.tabIcon}>🏆</Text>
          <Text style={[styles.tabLabel, currentTab === 'LEADERBOARD' && styles.activeTabLabel]}>
            Classement
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setCurrentTab('MATCHES')}
          activeOpacity={0.7}
        >
          <Text style={styles.tabIcon}>⚔</Text>
          <Text style={[styles.tabLabel, currentTab === 'MATCHES' && styles.activeTabLabel]}>
            Matchs
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setCurrentTab('SLOTS')}
          activeOpacity={0.7}
        >
          <Text style={styles.tabIcon}>📅</Text>
          <Text style={[styles.tabLabel, currentTab === 'SLOTS' && styles.activeTabLabel]}>
            Créneaux
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setCurrentTab('CHAT')}
          activeOpacity={0.7}
        >
          <Text style={styles.tabIcon}>💬</Text>
          <Text style={[styles.tabLabel, currentTab === 'CHAT' && styles.activeTabLabel]}>
            Messages
          </Text>
        </TouchableOpacity>

        {isAdmin && (
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setCurrentTab('ADMIN')}
            activeOpacity={0.7}
          >
            <Text style={styles.tabIcon}>⚙</Text>
            <Text style={[styles.tabLabel, currentTab === 'ADMIN' && styles.activeTabLabel]}>
              Admin
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  screenContent: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    paddingBottom: 8,
    paddingTop: 6,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  tabIcon: {
    fontSize: 18,
    marginBottom: 3,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#8E8E93',
  },
  activeTabLabel: {
    color: '#007AFF',
    fontWeight: '600',
  },
});
