import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface ShowtimeFilters {
  date: string;
  timeSlot: 'all' | 'morning' | 'afternoon' | 'evening' | 'night';
  cinema: string;
  voseOnly: boolean;
}

interface ShowtimeFiltersProps {
  filters: ShowtimeFilters;
  onFiltersChange: (filters: ShowtimeFilters) => void;
  availableCinemas: string[];
}

export default function ShowtimeFiltersComponent({
  filters,
  onFiltersChange,
  availableCinemas
}: ShowtimeFiltersProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCinemaPicker, setShowCinemaPicker] = useState(false);

  // Generate next 7 days
  const generateDateOptions = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push({
        value: date.toISOString().split('T')[0],
        label: i === 0 ? 'Today' :
               i === 1 ? 'Tomorrow' :
               date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      });
    }
    return dates;
  };

  const timeSlots = [
    { value: 'all', label: 'All Times', icon: 'time-outline' },
    { value: 'morning', label: 'Morning (9-12)', icon: 'sunny-outline' },
    { value: 'afternoon', label: 'Afternoon (12-18)', icon: 'partly-sunny-outline' },
    { value: 'evening', label: 'Evening (18-22)', icon: 'moon-outline' },
    { value: 'night', label: 'Night (22+)', icon: 'moon' },
  ];

  const updateFilters = (updates: Partial<ShowtimeFilters>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const selectedDate = generateDateOptions().find(d => d.value === filters.date);
  const selectedTimeSlot = timeSlots.find(t => t.value === filters.timeSlot);
  const selectedCinema = availableCinemas.find(c => c === filters.cinema);

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersRow}>
        {/* Date Filter */}
        <TouchableOpacity
          style={[styles.filterButton, filters.date !== 'all' && styles.filterButtonActive]}
          onPress={() => setShowDatePicker(true)}
        >
          <Ionicons name="calendar" size={16} color={filters.date !== 'all' ? '#fff' : '#888'} />
          <Text style={[styles.filterText, filters.date !== 'all' && styles.filterTextActive]}>
            {selectedDate?.label || 'Date'}
          </Text>
        </TouchableOpacity>

        {/* Time Slot Filter */}
        <TouchableOpacity
          style={[styles.filterButton, filters.timeSlot !== 'all' && styles.filterButtonActive]}
          onPress={() => {
            const currentIndex = timeSlots.findIndex(t => t.value === filters.timeSlot);
            const nextIndex = (currentIndex + 1) % timeSlots.length;
            updateFilters({ timeSlot: timeSlots[nextIndex].value as any });
          }}
        >
          <Ionicons
            name={selectedTimeSlot?.icon as any}
            size={16}
            color={filters.timeSlot !== 'all' ? '#fff' : '#888'}
          />
          <Text style={[styles.filterText, filters.timeSlot !== 'all' && styles.filterTextActive]}>
            {selectedTimeSlot?.label}
          </Text>
        </TouchableOpacity>

        {/* Cinema Filter */}
        <TouchableOpacity
          style={[styles.filterButton, filters.cinema !== 'all' && styles.filterButtonActive]}
          onPress={() => setShowCinemaPicker(true)}
        >
          <Ionicons name="business" size={16} color={filters.cinema !== 'all' ? '#fff' : '#888'} />
          <Text style={[styles.filterText, filters.cinema !== 'all' && styles.filterTextActive]}>
            {selectedCinema || 'All Cinemas'}
          </Text>
        </TouchableOpacity>

        {/* VOSE Only Toggle */}
        <TouchableOpacity
          style={[styles.filterButton, filters.voseOnly && styles.filterButtonActive]}
          onPress={() => updateFilters({ voseOnly: !filters.voseOnly })}
        >
          <Ionicons name="checkmark-circle" size={16} color={filters.voseOnly ? '#fff' : '#888'} />
          <Text style={[styles.filterText, filters.voseOnly && styles.filterTextActive]}>
            VOSE Only
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setShowDatePicker(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Date</Text>
            {generateDateOptions()?.map((date) => (
              <TouchableOpacity
                key={date.value}
                style={[
                  styles.modalOption,
                  date.value === filters.date && styles.modalOptionSelected
                ]}
                onPress={() => {
                  updateFilters({ date: date.value });
                  setShowDatePicker(false);
                }}
              >
                <Text style={[
                  styles.modalOptionText,
                  date.value === filters.date && styles.modalOptionTextSelected
                ]}>
                  {date.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Cinema Picker Modal */}
      <Modal
        visible={showCinemaPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCinemaPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setShowCinemaPicker(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Cinema</Text>
            <TouchableOpacity
              style={[
                styles.modalOption,
                filters.cinema === 'all' && styles.modalOptionSelected
              ]}
              onPress={() => {
                updateFilters({ cinema: 'all' });
                setShowCinemaPicker(false);
              }}
            >
              <Text style={[
                styles.modalOptionText,
                filters.cinema === 'all' && styles.modalOptionTextSelected
              ]}>
                All Cinemas
              </Text>
            </TouchableOpacity>
            {availableCinemas?.map((cinema) => (
              <TouchableOpacity
                key={cinema}
                style={[
                  styles.modalOption,
                  cinema === filters.cinema && styles.modalOptionSelected
                ]}
                onPress={() => {
                  updateFilters({ cinema });
                  setShowCinemaPicker(false);
                }}
              >
                <Text style={[
                  styles.modalOptionText,
                  cinema === filters.cinema && styles.modalOptionTextSelected
                ]}>
                  {cinema}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  filtersRow: {
    paddingHorizontal: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    color: '#888',
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1f1f1f',
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
    width: '80%',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  modalOptionSelected: {
    backgroundColor: '#007AFF',
  },
  modalOptionText: {
    color: '#ccc',
    fontSize: 16,
  },
  modalOptionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
});