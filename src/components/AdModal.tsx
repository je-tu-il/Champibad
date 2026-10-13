import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { CashprizeService } from '../services/cashprizeService';
import { ADMOB_CONFIG } from '../config/constants';

interface Props {
  visible: boolean;
  onAdFinished: () => void;
  reason?: string;
}

export const AdModal: React.FC<Props> = ({ visible, onAdFinished, reason }) => {
  const [secondsRemaining, setSecondsRemaining] = useState(5);
  const [canClose, setCanClose] = useState(false);
  const [rewardAdded, setRewardAdded] = useState(false);

  useEffect(() => {
    let timer: any;
    if (visible) {
      setSecondsRemaining(5);
      setCanClose(false);
      setRewardAdded(false);

      timer = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanClose(true);
            // Créditer la cagnotte
            CashprizeService.recordAdView().then(() => {
              setRewardAdded(true);
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [visible]);

  const handleClose = () => {
    if (canClose) {
      onAdFinished();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.adCard}>
          {/* Tag publicitaire Google Ads */}
          <View style={styles.adBadgeContainer}>
            <Text style={styles.adBadgeText}>ANNONCE GOOGLE ADS</Text>
            <View style={styles.timerBadge}>
              <Text style={styles.timerText}>
                {canClose ? '✓ Terminé' : `0:0${secondsRemaining}s`}
              </Text>
            </View>
          </View>

          {/* Bannière visuelle de badminton sponsor */}
          <View style={styles.adBannerBox}>
            <Text style={styles.adIcon}>🏸</Text>
            <Text style={styles.adTitle}>Babolat & Yonex Pro Store</Text>
            <Text style={styles.adSubtitle}>
              Équipez-vous au meilleur prix chez le partenaire officiel du club Champibad !
            </Text>
            <View style={styles.dealPill}>
              <Text style={styles.dealText}>-20% avec le code CHAMPIBAD2026</Text>
            </View>
          </View>

          {/* Explication du financement du cashprize */}
          <View style={styles.fundingInfoBox}>
            <Text style={styles.fundingTitle}>
              {rewardAdded
                ? '🎉 +0.05 € ajoutés au Cashprize !'
                : '💰 Visionnage solidaire du club'}
            </Text>
            <Text style={styles.fundingDesc}>
              {reason || 'Cette annonce de 5 secondes finance directement la cagnotte des vainqueurs.'}
            </Text>
          </View>

          {/* Bouton Fermer */}
          <TouchableOpacity
            style={[styles.closeButton, !canClose && styles.closeButtonDisabled]}
            disabled={!canClose}
            onPress={handleClose}
          >
            <Text style={styles.closeButtonText}>
              {canClose ? 'Fermer l\'annonce et continuer' : `Attendez ${secondsRemaining}s...`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  adCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  adBadgeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  adBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  timerBadge: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timerText: {
    color: '#38BDF8',
    fontWeight: '700',
    fontSize: 12,
  },
  adBannerBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: '100%',
    marginBottom: 16,
  },
  adIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  adTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 6,
  },
  adSubtitle: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 18,
  },
  dealPill: {
    backgroundColor: '#FEF08A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FDE047',
  },
  dealText: {
    color: '#854D0E',
    fontWeight: '700',
    fontSize: 12,
  },
  fundingInfoBox: {
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    width: '100%',
    alignItems: 'center',
    marginBottom: 18,
  },
  fundingTitle: {
    color: '#166534',
    fontWeight: '700',
    fontSize: 13,
    marginBottom: 2,
  },
  fundingDesc: {
    color: '#15803D',
    fontSize: 11,
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: '#0284C7',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  closeButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
