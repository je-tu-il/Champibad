import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Player } from '../types';

interface Props {
  currentUser: Player | null;
  onLogout?: () => void;
  onPressProfile?: () => void;
  onWatchAd?: () => void;
}

export const Header: React.FC<Props> = ({ currentUser, onPressProfile }) => {
  return (
    <View style={styles.container}>
      <View style={styles.brandRow}>
        <Image
          source={require('../../assets/icon.png')}
          style={styles.brandLogo}
          accessibilityLabel="Logo ChampiBAD"
        />
        <Text style={styles.brandTitle}>ChampiBAD</Text>
      </View>

      {currentUser && (
        <TouchableOpacity
          style={styles.userSection}
          onPress={onPressProfile}
          activeOpacity={0.7}
        >
          <View style={styles.avatarMini}>
            <Text style={styles.avatarMiniText}>{currentUser.avatarEmoji || '🏸'}</Text>
          </View>
          <Text style={styles.userName}>{currentUser.firstName}</Text>
        </TouchableOpacity>
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
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandLogo: {
    width: 28,
    height: 28,
    borderRadius: 8,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
  },
  avatarMini: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMiniText: {
    fontSize: 14,
  },
  userName: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '500',
  },
});
