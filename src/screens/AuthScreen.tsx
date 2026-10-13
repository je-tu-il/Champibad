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
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegisterOrLogin = async () => {
    if (!firstName.trim() || !lastName.trim() || !licenseNumber.trim()) {
      Alert.alert('Champs requis', 'Veuillez saisir votre prénom, nom et numéro de licence FFBaD.');
      return;
    }

    setLoading(true);
    try {
      const userEmail = email.trim() || `${firstName.toLowerCase()}.${lastName.toLowerCase()}@champibad.fr`;
      const player = await AuthService.registerOrLogin(
        firstName.trim(),
        lastName.trim(),
        licenseNumber.trim(),
        userEmail
      );
      Alert.alert('Connexion réussie', `Bienvenue ${player.firstName} !`);
      onLoginSuccess(player);
    } catch (e: any) {
      Alert.alert('Échec de validation', e.message || 'Erreur lors de la vérification de la licence');
    } finally {
      setLoading(false);
    }
  };

  // Connexion rapide pour les tests (Admin ou Joueur)
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
        <Text style={styles.badge}>Club Champibad • Champigneulles</Text>
        <Text style={styles.desc}>
          Plateforme officielle de compétition interne et de classement Elo.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Vérification du Licencié</Text>
        <Text style={styles.cardSubtitle}>
          Pour garantir que seuls les membres du club accèdent aux classements, indiquez vos identifiants FFBaD.
        </Text>

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

        <Text style={styles.inputLabel}>Numéro de Licence</Text>
        <TextInput
          style={styles.input}
          placeholder="ex: 07123456"
          placeholderTextColor="#94A3B8"
          value={licenseNumber}
          onChangeText={setLicenseNumber}
          keyboardType="numeric"
        />

        <Text style={styles.inputLabel}>Adresse Email (optionnelle)</Text>
        <TextInput
          style={styles.input}
          placeholder="ex: reymond_aurelien@yahoo.fr"
          placeholderTextColor="#94A3B8"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.buttonDisabled]}
          disabled={loading}
          onPress={handleRegisterOrLogin}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Valider et Entrer</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Raccourcis de test immédiat */}
      <View style={styles.quickLoginContainer}>
        <Text style={styles.quickLoginTitle}>🚀 Connexion rapide de test :</Text>

        <TouchableOpacity
          style={styles.quickAdminBtn}
          onPress={() =>
            handleQuickLogin({
              first: 'Aurélien',
              last: 'Reymond',
              license: '07123456',
              email: SUPER_ADMIN_EMAIL,
            })
          }
        >
          <Text style={styles.quickAdminText}>
            🛡️ Se connecter en tant que Super Admin (Aurélien Reymond)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickPlayerBtn}
          onPress={() =>
            handleQuickLogin({
              first: 'Thomas',
              last: 'Dubois',
              license: '07234567',
              email: 'thomas.dubois@badminton-champigneulles.fr',
            })
          }
        >
          <Text style={styles.quickPlayerText}>
            👤 Se connecter en Joueur (Thomas Dubois)
          </Text>
        </TouchableOpacity>
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
  badge: {
    backgroundColor: '#0284C7',
    color: '#F0F9FF',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 6,
  },
  desc: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 280,
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
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 16,
    lineHeight: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#CBD5E1',
    marginBottom: 4,
    marginTop: 8,
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
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  quickAdminBtn: {
    backgroundColor: '#7F1D1D',
    borderWidth: 1,
    borderColor: '#DC2626',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  quickAdminText: {
    color: '#FEF2F2',
    fontWeight: '700',
    fontSize: 12,
  },
  quickPlayerBtn: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#475569',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  quickPlayerText: {
    color: '#E2E8F0',
    fontWeight: '600',
    fontSize: 12,
  },
});
