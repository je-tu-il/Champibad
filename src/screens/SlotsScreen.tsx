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

  const formatTime = (time?: string) => {
    if (!time) return '';
    return time.replace(':00', 'h').replace(':', 'h');
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}
    >
      {clubSlots.map((slot) => {
        const isRecurringChecked = availability?.recurringDays.includes(slot.dayOfWeek);

        return (
          <View key={slot.id} style={styles.slotCard}>
            <View style={styles.slotRow}>
              <View style={styles.slotInfo}>
                <Text style={styles.slotTitle}>
                  {slot.dayName} • {formatTime(slot.startTime)}-{formatTime(slot.endTime)}
                </Text>
                <Text style={styles.slotGym}>{slot.gymnasium}</Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.toggleBtn,
                  isRecurringChecked && styles.toggleBtnActive,
                ]}
                onPress={() => handleToggleRecurringDay(slot.dayOfWeek)}
              >
                <Text
                  style={[
                    styles.toggleText,
                    isRecurringChecked && styles.toggleTextActive,
                  ]}
                >
                  {isRecurringChecked ? '✓ Dispo' : '+ Dispo'}
                </Text>
              </TouchableOpacity>
            </View>

            {slot.hasPeakHours && (
              <View style={styles.peakRow}>
                <Text style={styles.peakText}>
                  ⚠️ Matchs après {slot.allowedMatchStartTime ? formatTime(slot.allowedMatchStartTime) : '21h'}
                </Text>
              </View>
            )}
          </View>
        );
      })}

      {/* Mes Exceptions d'indisponibilité */}
      <View style={styles.exceptionCard}>
        <Text style={styles.cardTitle}>📅 Absences</Text>

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
                <Text style={styles.dateChipText}>{dateStr}</Text>
                <TouchableOpacity
                  onPress={() => handleRemoveException(dateStr)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Text style={styles.chipClose}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.noExceptions}>Aucune absence enregistrée.</Text>
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
  slotCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  slotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slotInfo: {
    flex: 1,
    marginRight: 10,
  },
  slotTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  slotGym: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  toggleBtnActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  toggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  toggleTextActive: {
    color: '#15803D',
  },
  peakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  peakText: {
    fontSize: 11,
    color: '#D97706',
    fontWeight: '500',
  },
  exceptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginTop: 6,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  dateInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    fontSize: 12,
    backgroundColor: '#F8FAFC',
    color: '#0F172A',
  },
  addExceptionBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addExceptionText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 11,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  dateChip: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
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
    fontWeight: '700',
    fontSize: 11,
  },
  noExceptions: {
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
});
