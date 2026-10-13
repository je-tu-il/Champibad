import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Player } from '../types';

interface Props {
  currentUser: Player | null;
  onLogout: () => void;
  onWatchAd: () => void;
}

export const Header: React.FC<Props> = ({ currentUser, onLogout, onWatchAd }) => {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View>
          <View style={styles.titleRow}>
            <Text style={styles.appTitle}>🏸 CHAMPIBAD</Text>
            <View style={styles.clubPill}>
              <Text style={styles.clubText}>CHAMPIGNEULLES</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>Club de Champigneulles • Compétition Interne</Text>
        </View>

        {currentUser && (
          <TouchableOpacity style={styles.adDonateButton} onPress={onWatchAd}>
            <Text style={styles.adDonateText}>📺 +0.05€ Cashprize</Text>
          </TouchableOpacity>
        )}
      </View>

      {currentUser && (
        <View style={styles.userBar}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {currentUser.firstName} {currentUser.lastName}
            </Text>
            {currentUser.role === 'ADMIN' && (
              <View style={styles.adminPill}>
                <Text style={styles.adminText}>ADMIN</Text>
              </View>
            )}
            {currentUser.cashprizePaid ? (
              <View style={styles.cashprizePillPaid}>
                <Text style={styles.cashprizeTextPaid}>💰 Cashprize Validé</Text>
              </View>
            ) : currentUser.cashprizeEnrolled ? (
              <View style={styles.cashprizePillPending}>
                <Text style={styles.cashprizeTextPending}>⏳ En attente paiement</Text>
              </View>
            ) : null}
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
            <Text style={styles.logoutText}>Déconnexion</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#38BDF8',
    letterSpacing: 0.5,
  },
  clubPill: {
    backgroundColor: '#0369A1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  clubText: {
    color: '#E0F2FE',
    fontSize: 10,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  adDonateButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#34D399',
  },
  adDonateText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 11,
  },
  userBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  userName: {
    color: '#F8FAFC',
    fontWeight: '700',
    fontSize: 13,
  },
  adminPill: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  adminText: {
    color: '#FEF2F2',
    fontWeight: '800',
    fontSize: 10,
  },
  cashprizePillPaid: {
    backgroundColor: '#15803D',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  cashprizeTextPaid: {
    color: '#DCFCE7',
    fontSize: 10,
    fontWeight: '700',
  },
  cashprizePillPending: {
    backgroundColor: '#B45309',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  cashprizeTextPending: {
    color: '#FEF3C7',
    fontSize: 10,
    fontWeight: '700',
  },
  logoutBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  logoutText: {
    color: '#94A3B8',
    fontSize: 11,
    textDecorationLine: 'underline',
  },
});
