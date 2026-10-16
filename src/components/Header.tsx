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
      <Text style={styles.brandTitle}>Champibad</Text>

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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: -0.4,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userName: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '400',
  },
  logoutBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutIcon: {
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '600',
    marginTop: -1,
  },
});
