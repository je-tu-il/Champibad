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
      <Text style={styles.brandTitle}>🏸 Champibad</Text>

      {currentUser && (
        <View style={styles.userSection}>
          <Text style={styles.userName}>{currentUser.firstName}</Text>
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={onLogout}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.logoutIcon}>✕</Text>
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
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#38BDF8',
    letterSpacing: 0.3,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userName: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  logoutBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutIcon: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
});
