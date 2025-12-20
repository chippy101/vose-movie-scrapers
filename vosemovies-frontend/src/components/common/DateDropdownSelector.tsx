import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface DateDropdownSelectorProps {
  selectedDate: string; // ISO format YYYY-MM-DD
  onDateChange: (date: string) => void;
  availableDates?: string[]; // Optional list of available dates
}

export default function DateDropdownSelector({
  selectedDate,
  onDateChange,
  availableDates
}: DateDropdownSelectorProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  // Generate next 7 days or use provided available dates
  const dateOptions = useMemo(() => {
    if (availableDates && availableDates.length > 0) {
      return availableDates.map(dateStr => {
        const date = new Date(dateStr);
        return {
          value: dateStr,
          label: formatDateLabel(date, dateStr)
        };
      });
    }

    // Generate next 7 days
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      dates.push({
        value: dateStr,
        label: formatDateLabel(date, dateStr)
      });
    }
    return dates;
  }, [availableDates]);

  function formatDateLabel(date: Date, dateStr: string): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    if (checkDate.getTime() === today.getTime()) {
      return `Today ${date.toLocaleDateString('en-US', { weekday: 'long' })}`;
    } else if (checkDate.getTime() === tomorrow.getTime()) {
      return `Tomorrow ${date.toLocaleDateString('en-US', { weekday: 'long' })}`;
    } else {
      // Format as "Saturday, 8 November"
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      });
    }
  }

  const selectedOption = dateOptions.find(d => d.value === selectedDate);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.labelRow}
        onPress={() => setShowDropdown(!showDropdown)}
        activeOpacity={0.7}
      >
        <Text style={styles.label}>Sessions for:</Text>

        <View style={styles.dropdownButton}>
          <Text style={styles.dropdownButtonText}>
            {selectedOption?.label || 'Select Date'}
          </Text>
          <Ionicons
            name={showDropdown ? "chevron-up" : "chevron-down"}
            size={16}
            color="#fff"
            style={{ marginLeft: 6 }}
          />
        </View>
      </TouchableOpacity>

      {/* Dropdown List - appears below the button */}
      {showDropdown && (
        <View style={styles.dropdownList}>
          <ScrollView
            style={styles.optionsList}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          >
            {dateOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.option,
                  option.value === selectedDate && styles.optionSelected
                ]}
                onPress={() => {
                  onDateChange(option.value);
                  setShowDropdown(false);
                }}
              >
                <Text style={[
                  styles.optionText,
                  option.value === selectedDate && styles.optionTextSelected
                ]}>
                  {option.label}
                </Text>
                {option.value === selectedDate && (
                  <Ionicons name="checkmark" size={20} color="#007AFF" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 0,
    backgroundColor: '#141414',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#888',
    marginRight: 12,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f1f1f',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#444',
    minWidth: 180,
  },
  dropdownButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
    flex: 1,
  },
  dropdownList: {
    backgroundColor: '#1f1f1f',
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#444',
    maxHeight: 300,
    overflow: 'hidden',
  },
  optionsList: {
    maxHeight: 300,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  optionSelected: {
    backgroundColor: '#2a2a2a',
  },
  optionText: {
    fontSize: 15,
    color: '#fff',
    flex: 1,
  },
  optionTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
});
