import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Player } from '../types';

interface Props {
  currentUser: Player | null;
  onLogout: () => void;
  onWatchAd?: () => void;
}

export const Header: React.FC<Props> = ({ currentUser, onLogout }) => {
  return (
    <View style={styles.container}>
      <View style={styles.mainRow}>
        <View style={styles.brandContainer}>
          <View style={styles.brandTitleRow}>
            <Text style={styles.appTitle}>🏸 CHAMPIBAD</Text>
            <View style={styles.clubPill}>
              <Text style={styles.clubText}>CHAMPIGNEULLES</Text>
            </View>
          </View>
          {currentUser && (
            <View style={styles.userRow}>
              <Text style={styles.userName}>
                {currentUser.firstName} {currentUser.lastName}
              </Text>
              {currentUser.role === 'ADMIN' && (
                <View style={styles.adminPill}>
                  <Text style={styles.adminText}>ADMIN</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {currentUser && (
          <View style={styles.rightContainer}>
            <View style={styles.eloGroup}>
              <View style={styles.eloPill}>
                <Text style={styles.eloLabel}>1v1</Text>
                <Text style={styles.eloValue}>{currentUser.eloSolo}</Text>
              </View>
              <View style={styles.eloPill}>
                <Text style={styles.eloLabel}>2v2</Text>
                <Text style={styles.eloValue}>{currentUser.eloDouble}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={onLogout}
              activeOpacity={0.7}
            >
              <Text style={styles.logoutText}>Sortir</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  mainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandContainer: {
    flex: 1,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  appTitle: {
    fontSize: 18,
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
    fontSize: 9,
    fontWeight: '800',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  userName: {
    color: '#F8FAFC',
    fontWeight: '700',
    fontSize: 13,
  },
  adminPill: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  adminText: {
    color: '#FEF2F2',
    fontWeight: '800',
    fontSize: 9,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eloGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  eloPill: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  eloLabel: {
    color: '#94A3B8',
    fontSize: 8,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  eloValue: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '900',
  },
  logoutBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  logoutText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '600',
  },
});
