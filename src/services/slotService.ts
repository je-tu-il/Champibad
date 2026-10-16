import AsyncStorage from '@react-native-async-storage/async-storage';
import { ClubSlot, PlayerAvailability } from '../types';
import { DEFAULT_CLUB_SLOTS } from '../config/constants';

const CLUB_SLOTS_KEY = '@champibad_club_slots';
const AVAILABILITY_KEY = '@champibad_player_availability';

export class SlotService {
  /**
   * Récupère la liste des créneaux du club configurés par l'admin
   */
  static async getClubSlots(): Promise<ClubSlot[]> {
    const data = await AsyncStorage.getItem(CLUB_SLOTS_KEY);
    if (!data) {
      await AsyncStorage.setItem(CLUB_SLOTS_KEY, JSON.stringify(DEFAULT_CLUB_SLOTS));
      return DEFAULT_CLUB_SLOTS;
    }
    return JSON.parse(data);
  }

  /**
   * Sauvegarde les créneaux modifiés par l'admin
   */
  static async saveClubSlots(slots: ClubSlot[]): Promise<void> {
    await AsyncStorage.setItem(CLUB_SLOTS_KEY, JSON.stringify(slots));
  }

  /**
   * Ajoute un nouveau créneau au club
   */
  static async addClubSlot(slotData: Omit<ClubSlot, 'id'>): Promise<ClubSlot[]> {
    const slots = await this.getClubSlots();
    const newSlot: ClubSlot = {
      ...slotData,
      id: `slot_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    };
    const updated = [...slots, newSlot];
    await this.saveClubSlots(updated);
    return updated;
  }

  /**
   * Modifie un créneau existant
   */
  static async updateClubSlot(slot: ClubSlot): Promise<ClubSlot[]> {
    const slots = await this.getClubSlots();
    const index = slots.findIndex((s) => s.id === slot.id);
    if (index !== -1) {
      slots[index] = slot;
      await this.saveClubSlots(slots);
    }
    return slots;
  }

  /**
   * Supprime un créneau du club
   */
  static async deleteClubSlot(slotId: string): Promise<ClubSlot[]> {
    const slots = await this.getClubSlots();
    const updated = slots.filter((s) => s.id !== slotId);
    await this.saveClubSlots(updated);
    return updated;
  }

  /**
   * Récupère les disponibilités d'un joueur
   */
  static async getPlayerAvailability(userId: string): Promise<PlayerAvailability> {
    const data = await AsyncStorage.getItem(`${AVAILABILITY_KEY}_${userId}`);
    if (!data) {
      // Dispo par défaut : Mardis et Jeudis (les séances principales de Champigneulles)
      return {
        userId,
        recurringDays: [2, 4], // Mardi (2), Jeudi (4)
        exceptionsUnavailable: [],
        extraAvailableDates: [],
      };
    }
    return JSON.parse(data);
  }

  /**
   * Enregistre les disponibilités d'un joueur
   */
  static async savePlayerAvailability(avail: PlayerAvailability): Promise<void> {
    await AsyncStorage.setItem(`${AVAILABILITY_KEY}_${avail.userId}`, JSON.stringify(avail));
  }

  /**
   * Calcule les créneaux communs éligibles entre 2 joueurs pour planifier un défi
   */
  static async findCommonSlots(
    user1Id: string,
    user2Id: string
  ): Promise<{
    slot: ClubSlot;
    isPeakRestricted: boolean;
    recommendedTimeWindow: string;
  }[]> {
    const [slots, avail1, avail2] = await Promise.all([
      this.getClubSlots(),
      this.getPlayerAvailability(user1Id),
      this.getPlayerAvailability(user2Id),
    ]);

    const activeSlots = slots.filter((s) => s.isActive);
    const results: {
      slot: ClubSlot;
      isPeakRestricted: boolean;
      recommendedTimeWindow: string;
    }[] = [];

    for (const slot of activeSlots) {
      // Vérifier si les deux joueurs sont dispo ce jour de semaine récurrent
      const u1Available = avail1.recurringDays.includes(slot.dayOfWeek);
      const u2Available = avail2.recurringDays.includes(slot.dayOfWeek);

      if (u1Available && u2Available) {
        let recommendedTimeWindow = `${slot.startTime} - ${slot.endTime}`;
        
        // Si le créneau subit une forte affluence (ex: Jeudi 20h-22h autorisé après 21h)
        if (slot.hasPeakHours && slot.allowedMatchStartTime) {
          recommendedTimeWindow = `${slot.allowedMatchStartTime} - ${slot.allowedMatchEndTime || slot.endTime} (Affluence forte avant ${slot.allowedMatchStartTime})`;
        }

        results.push({
          slot,
          isPeakRestricted: slot.hasPeakHours,
          recommendedTimeWindow,
        });
      }
    }

    return results;
  }
}
