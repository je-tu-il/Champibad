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
        <Text style={styles.title}>Champibad</Text>
        <Text style={styles.subtitle}>Classement interne du club</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Connexion</Text>

        <Text style={styles.inputLabel}>Prénom</Text>
        <TextInput
          style={styles.input}
          placeholder="ex: Aurélien"
          placeholderTextColor="#8E8E93"
          value={firstName}
          onChangeText={setFirstName}
        />

        <Text style={styles.inputLabel}>Nom</Text>
        <TextInput
          style={styles.input}
          placeholder="ex: Reymond"
          placeholderTextColor="#8E8E93"
          value={lastName}
          onChangeText={setLastName}
        />

        <Text style={styles.inputLabel}>N° Licence</Text>
        <TextInput
          style={styles.input}
          placeholder="ex: 07123456"
          placeholderTextColor="#8E8E93"
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
            <Text style={styles.quickBtnText}>Admin</Text>
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
            <Text style={styles.quickBtnText}>Joueur</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logo: {
    fontSize: 60,
    textAlign: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    letterSpacing: 0.35,
  },
  subtitle: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 4,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000000',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  quickLoginContainer: {
    marginTop: 28,
    alignItems: 'center',
    gap: 10,
  },
  quickLoginTitle: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '500',
  },
  quickRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickBtn: {
    backgroundColor: '#F2F2F7',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  quickBtnText: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '500',
  },
});
