import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { ClubSlot, PlayerAvailability, Player } from '../types';
import { SlotService } from '../services/slotService';

interface Props {
  currentUser: Player;
}

export const SlotsScreen: React.FC<Props> = ({ currentUser }) => {
  const [clubSlots, setClubSlots] = useState<ClubSlot[]>([]);
  const [availability, setAvailability] = useState<PlayerAvailability | null>(null);
  const [newExceptionDate, setNewExceptionDate] = useState('');
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const [slots, avail] = await Promise.all([
      SlotService.getClubSlots(),
      SlotService.getPlayerAvailability(currentUser.id),
    ]);
    setClubSlots(slots);
    setAvailability(avail);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const handleToggleRecurringDay = async (dayOfWeek: number) => {
    if (!availability) return;

    const exists = availability.recurringDays.includes(dayOfWeek);
    const updatedDays = exists
      ? availability.recurringDays.filter((d) => d !== dayOfWeek)
      : [...availability.recurringDays, dayOfWeek];

    const updated: PlayerAvailability = {
      ...availability,
      recurringDays: updatedDays,
    };

    setAvailability(updated);
    await SlotService.savePlayerAvailability(updated);
  };

  const handleAddException = async () => {
    if (!availability || !newExceptionDate.trim()) return;

    const dateVal = newExceptionDate.trim();
    if (availability.exceptionsUnavailable.includes(dateVal)) {
      Alert.alert('Info', 'Cette date d\'absence est déjà enregistrée.');
      return;
    }

    const updated: PlayerAvailability = {
      ...availability,
      exceptionsUnavailable: [...availability.exceptionsUnavailable, dateVal],
    };

    setAvailability(updated);
    setNewExceptionDate('');
    await SlotService.savePlayerAvailability(updated);
    Alert.alert('Indisponibilité enregistrée', `Vous êtes noté absent le ${dateVal}.`);
  };

  const handleRemoveException = async (dateStr: string) => {
    if (!availability) return;

    const updated: PlayerAvailability = {
      ...availability,
      exceptionsUnavailable: availability.exceptionsUnavailable.filter((d) => d !== dateStr),
    };

    setAvailability(updated);
    await SlotService.savePlayerAvailability(updated);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}
    >
      {/* Créneaux du Club */}
      <Text style={styles.sectionTitle}>🏸 Créneaux Officiels de Champigneulles</Text>
      <Text style={styles.sectionSubtitle}>
        Horaires d'ouverture de la salle et règles d'affluence configurées par l'administrateur.
      </Text>

      {clubSlots.map((slot) => {
        const isRecurringChecked = availability?.recurringDays.includes(slot.dayOfWeek);

        return (
          <View key={slot.id} style={styles.slotCard}>
            <View style={styles.slotHeader}>
              <View>
                <Text style={styles.slotDay}>{slot.dayName} • {slot.label}</Text>
                <Text style={styles.slotHours}>
                  ⏰ {slot.startTime} - {slot.endTime}
                </Text>
                <Text style={styles.slotGym}>{slot.gymnasium}</Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.toggleDayBtn,
                  isRecurringChecked && styles.toggleDayBtnActive,
                ]}
                onPress={() => handleToggleRecurringDay(slot.dayOfWeek)}
              >
                <Text
                  style={[
                    styles.toggleDayText,
                    isRecurringChecked && styles.toggleDayTextActive,
                  ]}
                >
                  {isRecurringChecked ? '✓ Je suis dispo' : '+ M\'ajouter'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Subtilité forte affluence demandée */}
            {slot.hasPeakHours && (
              <View style={styles.peakBox}>
                <Text style={styles.peakIcon}>⚠️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.peakTitle}>Règle de forte affluence :</Text>
                  <Text style={styles.peakDesc}>
                    {slot.peakRestrictionMessage ||
                      `Matchs autorisés uniquement de ${slot.allowedMatchStartTime} à ${slot.allowedMatchEndTime}`}
                  </Text>
                </View>
              </View>
            )}
          </View>
        );
      })}

      {/* Mes Exceptions d'indisponibilité */}
      <View style={styles.exceptionCard}>
        <Text style={styles.cardTitle}>📅 Mes Absences Exceptionnelles</Text>
        <Text style={styles.cardDesc}>
          Vous êtes habituellement présent le jeudi mais pas ce jeudi-là ? Notez vos dates d'absence pour que l'app ne vous propose pas de match.
        </Text>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.dateInput}
            placeholder="ex: Jeudi 24 Octobre"
            placeholderTextColor="#94A3B8"
            value={newExceptionDate}
            onChangeText={setNewExceptionDate}
          />
          <TouchableOpacity style={styles.addExceptionBtn} onPress={handleAddException}>
            <Text style={styles.addExceptionText}>+ Noter absent</Text>
          </TouchableOpacity>
        </View>

        {availability && availability.exceptionsUnavailable.length > 0 ? (
          <View style={styles.chipsContainer}>
            {availability.exceptionsUnavailable.map((dateStr, idx) => (
              <View key={idx} style={styles.dateChip}>
                <Text style={styles.dateChipText}>Indisponible : {dateStr}</Text>
                <TouchableOpacity onPress={() => handleRemoveException(dateStr)}>
                  <Text style={styles.chipClose}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.noExceptions}>Aucune absence exceptionnelle enregistrée.</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 16,
  },
  slotCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slotDay: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  slotHours: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
    marginTop: 2,
  },
  slotGym: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  toggleDayBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  toggleDayBtnActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  toggleDayText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  toggleDayTextActive: {
    color: '#166534',
  },
  peakBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  peakIcon: {
    fontSize: 16,
  },
  peakTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#991B1B',
  },
  peakDesc: {
    fontSize: 11,
    color: '#B91C1C',
    marginTop: 1,
  },
  exceptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 12,
    lineHeight: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  dateInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    backgroundColor: '#F8FAFC',
  },
  addExceptionBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 14,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addExceptionText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  dateChip: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateChipText: {
    color: '#991B1B',
    fontSize: 11,
    fontWeight: '600',
  },
  chipClose: {
    color: '#DC2626',
    fontWeight: '800',
    fontSize: 12,
  },
  noExceptions: {
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
});
