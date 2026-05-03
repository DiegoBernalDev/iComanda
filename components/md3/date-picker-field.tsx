import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

interface DatePickerFieldProps {
  label: string;
  value: string; // ISO format YYYY-MM-DD
  onDateChange: (isoDate: string) => void;
  placeholder?: string;
  color?: string;
}

// Format ISO string to display format (DD/MM/YYYY)
const formatDateDisplay = (dateStr: string) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
};

// Parse ISO string to Date object
const dateStringToObject = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  const [y, m, d] = dateStr.split('-');
  return new Date(`${y}-${m}-${d}`);
};

// Format Date object to ISO string
const dateObjectToString = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export function DatePickerField({
  label,
  value,
  onDateChange,
  placeholder,
  color = '#1F1F1F',
}: DatePickerFieldProps) {
  const [showPicker, setShowPicker] = useState(false);
  const dateValue = useMemo(() => dateStringToObject(value), [value]);

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (selectedDate) {
      const isoString = dateObjectToString(selectedDate);
      onDateChange(isoString);
    }
  };

  return (
    <View>
      <Pressable onPress={() => setShowPicker(true)} style={({ pressed }) => [
        styles.fieldContainer,
        { opacity: pressed ? 0.7 : 1 },
      ]}>
        <View style={styles.field}>
          <View style={styles.fieldContent}>
            <Text style={[styles.label, { color }]}>{label}</Text>
            <Text style={[styles.value, { color }]}>
              {value ? formatDateDisplay(value) : placeholder || 'Seleccionar fecha'}
            </Text>
          </View>
          <Ionicons name="calendar-outline" size={20} color={color} />
        </View>
      </Pressable>

      {showPicker && (
        <DateTimePicker
          value={dateValue}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
          onChange={handleDateChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fieldContainer: {
    marginBottom: 12,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    gap: 8,
  },
  fieldContent: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.7,
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
  },
});
