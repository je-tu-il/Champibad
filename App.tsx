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
import { AdModal } from './src/components/AdModal';
import { AuthScreen } from './src/screens/AuthScreen';
import { LeaderboardScreen } from './src/screens/LeaderboardScreen';
import { MatchesScreen } from './src/screens/MatchesScreen';
import { CashprizeScreen } from './src/screens/CashprizeScreen';
import { SlotsScreen } from './src/screens/SlotsScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { AdminScreen } from './src/screens/AdminScreen';

type TabKey = 'LEADERBOARD' | 'MATCHES' | 'CASHPRIZE' | 'SLOTS' | 'CHAT' | 'ADMIN';

export default function App() {
  const [currentUser, setCurrentUser] = useState<Player | null>(null);
  const [currentTab, setCurrentTab] = useState<TabKey>('LEADERBOARD');
  const [adModalVisible, setAdModalVisible] = useState(false);
  const [adReason, setAdReason] = useState<string | undefined>();
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
    // Proposer l'annonce 5s de soutien au cashprize
    setAdReason('Un match de classement a été validé ! Financez la cagnotte en regardant cette annonce de 5 secondes.');
    setAdModalVisible(true);
  };

  const isAdmin =
    currentUser?.role === 'ADMIN' ||
    currentUser?.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
        <AuthScreen onLoginSuccess={(player) => setCurrentUser(player)} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* En-tête de l'application */}
      <Header
        currentUser={currentUser}
        onLogout={handleLogout}
        onWatchAd={() => {
          setAdReason('Visionnage volontaire pour faire grimper le cashprize de Champipaf.');
          setAdModalVisible(true);
        }}
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
        {currentTab === 'CASHPRIZE' && (
          <CashprizeScreen
            currentUser={currentUser}
            onWatchAd={() => {
              setAdReason('Financement direct des 3 prix du Cashprize de Champipaf.');
              setAdModalVisible(true);
            }}
            onUserUpdated={(u) => setCurrentUser(u)}
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

      {/* Barre de navigation inférieure (Tabs) */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity
          style={[styles.tabItem, currentTab === 'LEADERBOARD' && styles.activeTabItem]}
          onPress={() => setCurrentTab('LEADERBOARD')}
        >
          <Text style={styles.tabIcon}>🏆</Text>
          <Text style={[styles.tabLabel, currentTab === 'LEADERBOARD' && styles.activeTabLabel]}>
            Classement
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, currentTab === 'MATCHES' && styles.activeTabItem]}
          onPress={() => setCurrentTab('MATCHES')}
        >
          <Text style={styles.tabIcon}>🏸</Text>
          <Text style={[styles.tabLabel, currentTab === 'MATCHES' && styles.activeTabLabel]}>
            Matchs
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, currentTab === 'CASHPRIZE' && styles.activeTabItem]}
          onPress={() => setCurrentTab('CASHPRIZE')}
        >
          <Text style={styles.tabIcon}>💰</Text>
          <Text style={[styles.tabLabel, currentTab === 'CASHPRIZE' && styles.activeTabLabel]}>
            Cashprize
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, currentTab === 'SLOTS' && styles.activeTabItem]}
          onPress={() => setCurrentTab('SLOTS')}
        >
          <Text style={styles.tabIcon}>🕒</Text>
          <Text style={[styles.tabLabel, currentTab === 'SLOTS' && styles.activeTabLabel]}>
            Créneaux
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, currentTab === 'CHAT' && styles.activeTabItem]}
          onPress={() => setCurrentTab('CHAT')}
        >
          <Text style={styles.tabIcon}>💬</Text>
          <Text style={[styles.tabLabel, currentTab === 'CHAT' && styles.activeTabLabel]}>
            Chat E2EE
          </Text>
        </TouchableOpacity>

        {isAdmin && (
          <TouchableOpacity
            style={[styles.tabItem, currentTab === 'ADMIN' && styles.activeTabItem]}
            onPress={() => setCurrentTab('ADMIN')}
          >
            <Text style={styles.tabIcon}>🛡️</Text>
            <Text style={[styles.tabLabel, currentTab === 'ADMIN' && styles.activeTabLabel]}>
              Admin
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Modal publicitaire Google Ads 5 secondes */}
      <AdModal
        visible={adModalVisible}
        reason={adReason}
        onAdFinished={() => {
          setAdModalVisible(false);
          // Actualiser le statut du user si nécessaire
          AuthService.getCurrentUser().then((u) => u && setCurrentUser(u));
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  screenContent: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingVertical: 6,
    paddingHorizontal: 4,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 8,
    minWidth: 54,
  },
  activeTabItem: {
    backgroundColor: '#1E293B',
  },
  tabIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
  },
  activeTabLabel: {
    color: '#38BDF8',
  },
});
