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
      Alert.alert('Info', "Cette date d'absence est déjà enregistrée.");
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

  const getUpcomingSlotDates = (): string[] => {
    const activeDays = clubSlots.filter((s) => s.isActive).map((s) => s.dayOfWeek);
    if (activeDays.length === 0) return [];

    const dates: string[] = [];
    const now = new Date();

    for (let i = 0; i <= 21; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      if (activeDays.includes(d.getDay())) {
        const dayStr = d.toLocaleDateString('fr-FR', { weekday: 'short' });
        const dayCapitalized = dayStr.charAt(0).toUpperCase() + dayStr.slice(1);
        const dayNum = d.getDate();
        const monthStr = d.toLocaleDateString('fr-FR', { month: 'short' });
        const label = `${dayCapitalized} ${dayNum} ${monthStr}`;
        dates.push(label);
        if (dates.length >= 6) break;
      }
    }
    return dates;
  };

  const handleToggleUpcomingDate = async (dateLabel: string) => {
    if (!availability) return;
    const isAlreadyAbsent = availability.exceptionsUnavailable.includes(dateLabel);
    const updated = isAlreadyAbsent
      ? availability.exceptionsUnavailable.filter((d) => d !== dateLabel)
      : [...availability.exceptionsUnavailable, dateLabel];

    const newAvail: PlayerAvailability = {
      ...availability,
      exceptionsUnavailable: updated,
    };
    setAvailability(newAvail);
    await SlotService.savePlayerAvailability(newAvail);
  };

  const upcomingDates = getUpcomingSlotDates();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} tintColor="#007AFF" />}
      showsVerticalScrollIndicator={false}
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
                  isRecurringChecked ? styles.toggleBtnActive : styles.toggleBtnInactive,
                ]}
                onPress={() => handleToggleRecurringDay(slot.dayOfWeek)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.toggleText,
                    isRecurringChecked ? styles.toggleTextActive : styles.toggleTextInactive,
                  ]}
                >
                  Dispo
                </Text>
              </TouchableOpacity>
            </View>

            {slot.hasPeakHours && (
              <View style={styles.peakRow}>
                <Text style={styles.peakText}>
                  Matchs après {slot.allowedMatchStartTime ? formatTime(slot.allowedMatchStartTime) : '21h'}
                </Text>
              </View>
            )}
          </View>
        );
      })}

      {/* Mes Exceptions d'indisponibilité */}
      <View style={styles.exceptionCard}>
        <Text style={styles.sectionTitle}>Absences</Text>
        <Text style={styles.sectionSubtitle}>Séances à venir (sélection directe)</Text>

        <View style={styles.upcomingGrid}>
          {upcomingDates.map((dateStr, idx) => {
            const isAbsent = availability?.exceptionsUnavailable.includes(dateStr);
            return (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.upcomingChip,
                  isAbsent && styles.upcomingChipAbsent,
                ]}
                onPress={() => handleToggleUpcomingDate(dateStr)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.upcomingChipText,
                    isAbsent && styles.upcomingChipTextAbsent,
                  ]}
                >
                  {isAbsent ? '✕ ' : ''}{dateStr}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.sectionSubtitle, { marginTop: 14 }]}>Autre date</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.dateInput}
            placeholder="ex: 28 Octobre"
            placeholderTextColor="#8E8E93"
            value={newExceptionDate}
            onChangeText={setNewExceptionDate}
            returnKeyType="done"
            onSubmitEditing={handleAddException}
          />
          <TouchableOpacity
            style={styles.addExceptionBtn}
            onPress={handleAddException}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Ajouter une date d'absence"
          >
            <Text style={styles.addExceptionText}>+</Text>
          </TouchableOpacity>
        </View>

        {availability && availability.exceptionsUnavailable.length > 0 ? (
          <View style={styles.recordedSection}>
            <Text style={styles.sectionSubtitle}>Absences enregistrées</Text>
            <View style={styles.chipsContainer}>
              {availability.exceptionsUnavailable.map((dateStr, idx) => (
                <View key={idx} style={styles.dateChip}>
                  <Text style={styles.dateChipText}>{dateStr}</Text>
                  <TouchableOpacity
                    onPress={() => handleRemoveException(dateStr)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    activeOpacity={0.6}
                    style={styles.chipCloseBtn}
                    accessibilityRole="button"
                    accessibilityLabel={`Supprimer absence du ${dateStr}`}
                  >
                    <Text style={styles.chipClose}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
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
    backgroundColor: '#F2F2F7',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  slotCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  slotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slotInfo: {
    flex: 1,
    marginRight: 12,
  },
  slotTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  slotGym: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 4,
  },
  toggleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBtnActive: {
    backgroundColor: '#34C759',
  },
  toggleBtnInactive: {
    backgroundColor: '#F2F2F7',
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  toggleTextInactive: {
    color: '#8E8E93',
  },
  peakRow: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  peakText: {
    fontSize: 12,
    color: '#FF9500',
    fontWeight: '500',
  },
  exceptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginTop: 4,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 10,
  },
  upcomingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  upcomingChip: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  upcomingChipAbsent: {
    backgroundColor: '#FFE5E5',
  },
  upcomingChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#000000',
  },
  upcomingChipTextAbsent: {
    color: '#FF3B30',
    fontWeight: '600',
  },
  recordedSection: {
    marginTop: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  dateInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#000000',
  },
  addExceptionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addExceptionText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '400',
    lineHeight: 24,
    textAlign: 'center',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dateChip: {
    backgroundColor: '#FFE5E5',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateChipText: {
    color: '#FF3B30',
    fontSize: 13,
    fontWeight: '500',
  },
  chipCloseBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipClose: {
    color: '#FF3B30',
    fontSize: 12,
    fontWeight: '600',
  },
  noExceptions: {
    fontSize: 13,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
});
