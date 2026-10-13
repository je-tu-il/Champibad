import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { AuthService } from '../services/authService';
import { Player } from '../types';
import { SUPER_ADMIN_EMAIL } from '../config/constants';

interface Props {
  onLoginSuccess: (player: Player) => void;
}

export const AuthScreen: React.FC<Props> = ({ onLoginSuccess }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegisterOrLogin = async () => {
    if (!firstName.trim() || !lastName.trim() || !licenseNumber.trim()) {
      Alert.alert('Champs requis', 'Veuillez saisir votre prénom, nom et numéro de licence FFBaD.');
      return;
    }

    setLoading(true);
    try {
      const email = `${firstName.trim().toLowerCase()}.${lastName.trim().toLowerCase()}@champibad.fr`;
      const player = await AuthService.registerOrLogin(
        firstName.trim(),
        lastName.trim(),
        licenseNumber.trim(),
        email
      );
      Alert.alert('Connexion réussie', `Bienvenue ${player.firstName} !`);
      onLoginSuccess(player);
    } catch (e: any) {
      Alert.alert('Échec de validation', e.message || 'Erreur lors de la vérification de la licence');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (prefill: {
    first: string;
    last: string;
    license: string;
    email: string;
  }) => {
    setLoading(true);
    try {
      const player = await AuthService.registerOrLogin(
        prefill.first,
        prefill.last,
        prefill.license,
        prefill.email
      );
      onLoginSuccess(player);
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.logo}>🏸</Text>
        <Text style={styles.title}>CHAMPIBAD</Text>
        <Text style={styles.desc}>Classement interne du club</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Connexion</Text>

        <Text style={styles.inputLabel}>Prénom</Text>
        <TextInput
          style={styles.input}
          placeholder="ex: Aurélien"
          placeholderTextColor="#94A3B8"
          value={firstName}
          onChangeText={setFirstName}
        />

        <Text style={styles.inputLabel}>Nom</Text>
        <TextInput
          style={styles.input}
          placeholder="ex: Reymond"
          placeholderTextColor="#94A3B8"
          value={lastName}
          onChangeText={setLastName}
        />

        <Text style={styles.inputLabel}>N° Licence</Text>
        <TextInput
          style={styles.input}
          placeholder="ex: 07123456"
          placeholderTextColor="#94A3B8"
          value={licenseNumber}
          onChangeText={setLicenseNumber}
          keyboardType="numeric"
        />

        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.buttonDisabled]}
          disabled={loading}
          onPress={handleRegisterOrLogin}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Valider</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.quickLoginContainer}>
        <Text style={styles.quickLoginTitle}>Connexion rapide</Text>
        <View style={styles.quickRow}>
          <TouchableOpacity
            style={styles.quickBtn}
            onPress={() =>
              handleQuickLogin({
                first: 'Aurélien',
                last: 'Reymond',
                license: '07123456',
                email: SUPER_ADMIN_EMAIL,
              })
            }
          >
            <Text style={styles.quickBtnText}>🛡️ Admin</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickBtn}
            onPress={() =>
              handleQuickLogin({
                first: 'Thomas',
                last: 'Dubois',
                license: '07234567',
                email: 'thomas.dubois@badminton-champigneulles.fr',
              })
            }
          >
            <Text style={styles.quickBtnText}>👤 Joueur</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#0F172A',
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    fontSize: 54,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#38BDF8',
    letterSpacing: 1,
  },
  desc: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#CBD5E1',
    marginBottom: 4,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#F8FAFC',
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: '#0284C7',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  quickLoginContainer: {
    marginTop: 24,
    alignItems: 'center',
    gap: 8,
  },
  quickLoginTitle: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  quickRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickBtn: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  quickBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
});
