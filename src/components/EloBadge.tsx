import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  elo: number;
  label?: string;
  size?: 'small' | 'medium' | 'large';
}

export const EloBadge: React.FC<Props> = ({ elo, label, size = 'medium' }) => {
  // Détermination de la couleur selon le palier Elo
  let badgeColor = '#64748B'; // Gris standard
  let tierName = 'Série P';

  if (elo >= 1500) {
    badgeColor = '#DC2626'; // Rouge / National / N
    tierName = 'Série N';
  } else if (elo >= 1400) {
    badgeColor = '#EA580C'; // Orange / Régional / R
    tierName = 'Série R';
  } else if (elo >= 1300) {
    badgeColor = '#2563EB'; // Bleu / Départemental / D
    tierName = 'Série D';
  } else if (elo >= 1200) {
    badgeColor = '#16A34A'; // Vert / Promotion / P
    tierName = 'Série P';
  }

  const isLarge = size === 'large';
  const isSmall = size === 'small';

  return (
    <View style={[styles.container, { borderColor: badgeColor, backgroundColor: `${badgeColor}15` }]}>
      <Text style={[styles.eloText, { color: badgeColor, fontSize: isLarge ? 18 : isSmall ? 12 : 14 }]}>
        🏸 {elo} Elo
      </Text>
      {label && <Text style={[styles.labelText, { color: badgeColor }]}>{label}</Text>}
      {!label && <Text style={[styles.labelText, { color: badgeColor }]}>{tierName}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eloText: {
    fontWeight: '700',
  },
  labelText: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
    textTransform: 'uppercase',
  },
});
